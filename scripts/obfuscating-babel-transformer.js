/**
 * Heavy obfuscation of OUR code in production/staging bundles, as a wrapper
 * around Expo's Babel transformer.
 *
 * Why here and not as a Metro minifier: when a build uses Hermes bytecode,
 * Expo skips Metro-level minification entirely (the Hermes compiler does it),
 * so a minifier hook is never called for `expo export` / `eas update`. The
 * Babel stage runs in every path, so the result is the same for a local
 * Gradle build, an EAS build and an OTA update.
 *
 * Skipped on purpose:
 *  - dev runs (options.dev) and web;
 *  - anything under node_modules (React Native, Expo, libraries): public code,
 *    huge, and all cost/risk for no secrecy;
 *  - modules containing Reanimated worklets: a worklet's source is captured as
 *    a string by a Babel plugin and evaluated on another thread, so rewriting
 *    the surrounding code could desynchronise it from its captured closure.
 * SKIP_OBFUSCATION=1 disables it for a build (e.g. to rule it out when
 * chasing a crash).
 *
 * Deliberately NOT enabled: selfDefending / debugProtection (rely on the
 * code's own formatting/toString; can hang a minified Hermes bundle),
 * renameProperties (expo-router reads `default` / `unstable_settings` /
 * `ErrorBoundary` exports), eval-based decoding (Hermes has no runtime eval).
 * `ignoreImports` keeps `require("x")` and `import("x")` literal so Metro can still
 * collect each module's dependencies.
 */
const upstream = require('@expo/metro-config/build/babel-transformer');
const generate = require('@babel/generator').default;
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const JavaScriptObfuscator = require('javascript-obfuscator');

// Deterministic per file: same input -> same output, so rebuilds and OTA
// updates are reproducible and Metro's cache stays valid.
function seedFor(filename) {
  let h = 2166136261;
  for (let i = 0; i < filename.length; i++) {
    h ^= filename.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const HEAVY = {
  compact: true,
  target: 'browser-no-eval',
  sourceMap: false,
  ignoreImports: true,

  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  simplify: true,

  identifierNamesGenerator: 'hexadecimal',
  numbersToExpressions: true,
  splitStrings: true,
  splitStringsChunkLength: 8,
  stringArray: true,
  stringArrayThreshold: 1,
  stringArrayEncoding: ['base64', 'rc4'],
  stringArrayIndexShift: true,
  rotateStringArray: true,
  shuffleStringArray: true,
  stringArrayWrappersCount: 2,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersType: 'function',
  stringArrayCallsTransform: true,
  stringArrayCallsTransformThreshold: 0.75,

  selfDefending: false,
  debugProtection: false,
  disableConsoleOutput: false,
  renameProperties: false,
  transformObjectKeys: false,
  unicodeEscapeSequence: false,
};

/**
 * Expo decides whether a dependency came from an ES `import` (and so should be
 * resolved with the package's "import" export condition) by matching source
 * LOCATIONS: at this stage it has recorded where each ImportDeclaration sits
 * (metadata.metro.unstable_importDeclarationLocs), and Metro later turns those
 * declarations into `require` calls that inherit the location. Regenerating
 * the code from obfuscated text gives every node a fresh location, which
 * would silently flip every import to the CommonJS resolution - loading a
 * second, CJS copy of packages that other libraries load as ESM (two zods,
 * two query-cores...). So the original locations are put back on the import /
 * re-export declarations, matched by specifier in order. `ignoreImports`
 * keeps the specifier literals intact through obfuscation.
 *
 * Files still holding plain `require("x")` calls (CommonJS sources) get the
 * same treatment via the nearest located ancestor, which is what Metro reads.
 */
const isRequireCall = (n) =>
  n.callee.type === 'Identifier' &&
  n.callee.name === 'require' &&
  n.arguments.length === 1 &&
  n.arguments[0].type === 'StringLiteral';

function nearestLoc(path) {
  for (let p = path; p; p = p.parentPath) {
    if (p.node && p.node.loc) return p.node.loc;
  }
  return null;
}

function collectLocs(ast) {
  const bySpecifier = new Map();
  const add = (spec, loc) => {
    if (!loc) return;
    if (!bySpecifier.has(spec)) bySpecifier.set(spec, []);
    bySpecifier.get(spec).push(loc);
  };
  traverse(ast, {
    ImportDeclaration: (p) => add(p.node.source.value, p.node.loc),
    ExportAllDeclaration: (p) => add(p.node.source.value, p.node.loc),
    ExportNamedDeclaration: (p) => p.node.source && add(p.node.source.value, p.node.loc),
    CallExpression: (p) => {
      if (isRequireCall(p.node)) add(p.node.arguments[0].value, nearestLoc(p));
    },
  });
  return bySpecifier;
}

function restoreLocs(ast, bySpecifier) {
  const restore = (node, spec) => {
    const queue = bySpecifier.get(spec);
    if (queue && queue.length > 0) node.loc = queue.shift();
  };
  traverse(ast, {
    ImportDeclaration: (p) => restore(p.node, p.node.source.value),
    ExportAllDeclaration: (p) => restore(p.node, p.node.source.value),
    ExportNamedDeclaration: (p) => p.node.source && restore(p.node, p.node.source.value),
    CallExpression: (p) => {
      if (isRequireCall(p.node)) restore(p.node, p.node.arguments[0].value);
    },
  });
}

/**
 * OBFUSCATION_PROFILE picks how much is applied (default: heavy - chosen
 * deliberately, accepting the startup cost below; use `structure` for +0.23 s).
 * Startup cost scales with how much runs at load: every obfuscated module
 * rebuilds its own string table when it loads. The numbers below predate
 * EXPO_ROUTER_IMPORT_MODE=lazy (every route used to load at launch
 * regardless of whether it was ever opened that session - see "Startup
 * performance" in CLAUDE.md) and inlineRequires (metro.config.js), both of
 * which cut how many modules - obfuscated or not - actually run before the
 * first screen is interactive, so real-world cost today is likely lower
 * than this. Cold-start medians measured on the team's test phone before
 * either of those (plain build: 1.22 s):
 *   structure - control-flow flattening + dead code + base64 string table,
 *               no splitting/rc4:            1.45 s  (+0.23 s)
 *   strings   - full string protection (rc4, splitting, chained wrappers)
 *               but no restructuring:        2.36 s  (+1.15 s)
 *   heavy     - everything:                  3.26 s  (+2.04 s)   <- default
 *               (costs more than the two above combined - the features
 *               interact). One-time cost per cold start; it also makes
 *               first-party JS run somewhat slower afterwards (not measured).
 *   light     - base64 string table only     (not measured)
 * All of them hide API paths, field names and message text from a string
 * dump of the bundle; the difference is how hard the strings and logic are to
 * reverse by tooling.
 */
const PROFILES = {
  heavy: HEAVY,
  strings: { ...HEAVY, controlFlowFlattening: false, deadCodeInjection: false },
  structure: {
    ...HEAVY,
    splitStrings: false,
    stringArrayEncoding: ['base64'],
    stringArrayWrappersCount: 1,
    stringArrayWrappersChainedCalls: false,
    stringArrayCallsTransform: false,
  },
  light: {
    ...HEAVY,
    controlFlowFlattening: false,
    deadCodeInjection: false,
    splitStrings: false,
    numbersToExpressions: false,
    stringArrayEncoding: ['base64'],
    stringArrayThreshold: 0.75,
    stringArrayWrappersCount: 1,
    stringArrayWrappersChainedCalls: false,
    stringArrayCallsTransform: false,
  },
};
const PROFILE = PROFILES[process.env.OBFUSCATION_PROFILE] || PROFILES.heavy;

function eligible(filename, options, code) {
  if (process.env.SKIP_OBFUSCATION === '1') return false;
  if (options.dev) return false;
  if (options.platform === 'web') return false;
  if (/(^|[\\/])node_modules[\\/]/.test(filename)) return false;
  if (!/\.(t|j)sx?$/.test(filename)) return false;
  if (code.includes('__workletHash') || code.includes('__initData')) return false;
  return true;
}

module.exports.transform = async function transform(props) {
  const result = await upstream.transform(props);
  if (!result || !result.ast) return result;

  const locs = collectLocs(result.ast);
  const { code } = generate(result.ast, { compact: true, comments: false });
  if (!eligible(props.filename, props.options, code)) return result;

  // ESM still present at this stage: keep exported/top-level declarations
  // untouched (renaming an `export function` would break the export).
  const hasESM = result.ast.program.body.some((n) => /^(Import|Export)/.test(n.type));

  const obfuscated = JavaScriptObfuscator.obfuscate(code, {
    ...PROFILE,
    renameGlobals: !hasESM,
    sourceType: hasESM ? 'module' : 'script',
    seed: seedFor(props.filename),
  }).getObfuscatedCode();

  const ast = parser.parse(obfuscated, {
    sourceType: hasESM ? 'module' : 'script',
    sourceFilename: props.filename,
  });
  restoreLocs(ast, locs);
  return { ...result, ast };
};