// Polyfills for Expo and React Native Web - must be loaded first
if (typeof globalThis !== 'undefined') {
  if (!globalThis.expo) {
    globalThis.expo = {};
  }
  if (!globalThis.expo.modules) {
    globalThis.expo.modules = {};
  }
  if (!globalThis.process) {
    globalThis.process = { env: {} };
  }
  if (!globalThis.global) {
    globalThis.global = globalThis;
  }
  // Polyfill for require (used by some React Native modules)
  if (typeof globalThis.require === 'undefined') {
    globalThis.require = function(module) {
      console.warn(`require('${module}') is not available in the browser`);
      return {};
    };
  }
  // Polyfill for CommonJS exports and module
  if (typeof globalThis.exports === 'undefined') {
    globalThis.exports = {};
  }
  if (typeof globalThis.module === 'undefined') {
    globalThis.module = { exports: globalThis.exports };
  }
}
