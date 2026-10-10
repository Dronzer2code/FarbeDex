// onnxruntime-react-native ships a legacy `unimodule.json`, so Expo's autolinker assumes it is an Expo module and
// skips it as a React Native package — then nothing registers OnnxruntimePackage and NativeModules.Onnxruntime
// is null at runtime. Declaring it here makes autolinking add the package (docs/TRD.md → VERIFY-5).
module.exports = {
  dependencies: {
    'onnxruntime-react-native': {
      platforms: {
        android: {
          packageImportPath: 'import ai.onnxruntime.reactnative.OnnxruntimePackage;',
          packageInstance: 'new OnnxruntimePackage()',
        },
        ios: null,
      },
    },
  },
};
