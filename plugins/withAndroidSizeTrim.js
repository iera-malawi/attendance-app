/**
 * App-size settings for the Android build that expo-build-properties doesn't
 * cover. android/ is generated (gitignored), so EAS runs prebuild on every
 * build and this plugin is re-applied each time. Idempotent.
 *
 *  - ARM only: x86/x86_64 are emulators/Chromebooks. Mostly shrinks the
 *    preview/development APKs; Play already splits the production AAB per ABI.
 *
 * R8 minification and resource shrinking are turned on in app.json via
 * expo-build-properties. ML Kit barcode scanning must NOT be excluded: the
 * check-in screen scans QR codes with expo-camera.
 */
const { withGradleProperties } = require("expo/config-plugins");

const ARCHITECTURES = "armeabi-v7a,arm64-v8a";

module.exports = function withAndroidSizeTrim(config) {
  return withGradleProperties(config, (c) => {
    const props = c.modResults;
    const hit = props.find((p) => p.type === "property" && p.key === "reactNativeArchitectures");
    if (hit) hit.value = ARCHITECTURES;
    else props.push({ type: "property", key: "reactNativeArchitectures", value: ARCHITECTURES });
    return c;
  });
};
