const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Heavy obfuscation of first-party code in release bundles: a
// wrapper around Expo's Babel transformer (see the script's header for why it
// isn't a Metro minifier, and for what is skipped). Dev runs are unaffected;
// SKIP_OBFUSCATION=1 disables it for a build.
config.transformer.babelTransformerPath =
  require.resolve("./scripts/obfuscating-babel-transformer.js");

// Expo's default disables this (@expo/metro-config sets inlineRequires:
// false); turning it on rewrites a file's top-of-file `require()`s into
// calls made right at their point of use inside functions, so a module
// only actually runs the first time a function that needs it is called -
// sometimes never, for a given session. Applies everywhere (first-party
// code and every library). Doesn't change the bundle's size, only when its
// code executes, so it helps cold start by not running every screen's module
// at launch. One behavior change worth knowing: code a module runs at its top
// level (not inside a function) now runs on first use of that module rather
// than at launch. `experimentalImportSupport: true` is Expo's own default for
// this field - repeated here since providing getTransformOptions replaces the
// whole object, not just inlineRequires.
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: true,
    inlineRequires: true,
  },
});

module.exports = config;
