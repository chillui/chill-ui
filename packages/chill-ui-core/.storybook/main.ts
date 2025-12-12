import type { StorybookConfig } from '@storybook/react-native-web-vite';

const config: StorybookConfig = {
  "stories": [
    "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": ['@storybook/addon-docs'],
  "framework": {
    "name": "@storybook/react-native-web-vite",
    "options": {
      pluginReactOptions: {
        jsxImportSource: "nativewind",
      },
    }
  },
  async viteFinal(config) {
    return {
      ...config,
      define: {
        ...config.define,
        global: 'globalThis',
      },
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
          'react-native': 'react-native-web',
        },
      },
      plugins: [
        ...(config.plugins || []),
        {
          name: 'inject-polyfills',
          transformIndexHtml: {
            order: 'pre',
            handler(html) {
              return html.replace(
                '<head>',
                `<head>
                <script>
                  // Polyfills for Expo and React Native Web
                  if (typeof globalThis !== 'undefined') {
                    if (!globalThis.expo) globalThis.expo = {};
                    if (!globalThis.expo.modules) globalThis.expo.modules = {};
                    if (!globalThis.process) globalThis.process = { env: {} };
                    if (!globalThis.global) globalThis.global = globalThis;
                    if (typeof globalThis.require === 'undefined') {
                      globalThis.require = function(module) {
                        console.warn('require(' + module + ') is not available in the browser');
                        return {};
                      };
                    }
                    if (typeof globalThis.exports === 'undefined') globalThis.exports = {};
                    if (typeof globalThis.module === 'undefined') globalThis.module = { exports: globalThis.exports };
                  }
                </script>`
              );
            },
          },
        },
      ],
    };
  },
};
export default config

