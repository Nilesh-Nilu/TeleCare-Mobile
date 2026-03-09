const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.unstable_conditionNames = ['react-native', 'browser', 'require'];
config.resolver.unstable_enablePackageExports = true;

// Alias native-only packages to stubs when bundling for web
const nativeStub = path.resolve(__dirname, 'src/stubs/agora-native-stub.js');

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    if (
      moduleName === 'react-native-agora'
    ) {
      return { type: 'sourceFile', filePath: nativeStub };
    }
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
