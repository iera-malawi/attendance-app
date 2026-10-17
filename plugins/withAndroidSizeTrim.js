/**
 * App-size settings for the Android build, kept in one Expo config plugin so
 * they're re-applied whenever the native project is (re)generated with
 * `expo prebuild`. android/ is committed and used as-is by EAS Build, which
 * does NOT run prebuild - the same edits are already in those files; this
 * plugin exists so a prebuild can't silently drop them. Every step is
 * idempotent (safe to run over an already-patched project).
 *
 *  - ARM only: x86/x86_64 are emulators/Chromebooks.
 *  - Exclude ML Kit barcode scanning (declared by expo-camera; this app only
 *    takes photos and expo-camera checks for the class at runtime).
 *
 * NOT excludable: expo-image's AVIF decoder (glide avif-integration).
 * Glide's generated GeneratedAppGlideModuleImpl references it directly, so
 * removing it fails R8 and would crash at the first image load.
 *  - R8 -dontwarn rules for the excluded ML Kit classes.
 */
const fs = require("fs");
const path = require("path");
const {
  withAppBuildGradle,
  withGradleProperties,
  withDangerousMod,
} = require("@expo/config-plugins");

const MARKER = "// [size-trim]";

const EXCLUDE_BLOCK = `
${MARKER} Excluded on purpose - see plugins/withAndroidSizeTrim.js.
configurations.all {
    exclude group: 'com.google.mlkit', module: 'barcode-scanning'
    exclude group: 'com.google.android.gms', module: 'play-services-mlkit-barcode-scanning'
    exclude group: 'com.google.android.gms', module: 'play-services-code-scanner'
    exclude group: 'androidx.camera', module: 'camera-mlkit-vision'
}
`;

const PROGUARD_MARK = "# [size-trim]";
const PROGUARD_RULES = `
${PROGUARD_MARK} expo-camera references ML Kit barcode classes that are excluded
# from the build on purpose; it checks for them at runtime before use.
-dontwarn com.google.mlkit.**
-dontwarn com.google.android.gms.internal.mlkit_vision_barcode.**
-dontwarn androidx.camera.mlkit.**
`;

function addExcludes(contents) {
  // Already applied - by this plugin, or by hand in the committed android/ folder.
  if (contents.includes(MARKER) || contents.includes("module: 'barcode-scanning'")) {
    return contents;
  }
  return contents.replace(/\s*$/, "\n") + EXCLUDE_BLOCK;
}

function addProguardRules(contents) {
  if (contents.includes("-dontwarn com.google.mlkit.**")) return contents;
  return contents.replace(/\s*$/, "\n") + PROGUARD_RULES;
}

module.exports = function withAndroidSizeTrim(config) {
  config = withAppBuildGradle(config, (c) => {
    c.modResults.contents = addExcludes(c.modResults.contents);
    return c;
  });

  config = withGradleProperties(config, (c) => {
    const props = c.modResults;
    const set = (key, value) => {
      const hit = props.find((p) => p.type === "property" && p.key === key);
      if (hit) hit.value = value;
      else props.push({ type: "property", key, value });
    };
    set("reactNativeArchitectures", "armeabi-v7a,arm64-v8a");
    return c;
  });

  config = withDangerousMod(config, [
    "android",
    (c) => {
      const file = path.join(c.modRequest.platformProjectRoot, "app", "proguard-rules.pro");
      const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
      const next = addProguardRules(current);
      if (next !== current) fs.writeFileSync(file, next);
      return c;
    },
  ]);

  return config;
};

module.exports.addExcludes = addExcludes;
module.exports.addProguardRules = addProguardRules;