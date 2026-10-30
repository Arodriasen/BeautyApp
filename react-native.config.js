/**
 * Librerías nativas que NO se compilan en la app.
 *
 * expo-router depende de react-native-drawer-layout, que pide como peer gesture-handler y
 * reanimated (y reanimated, worklets); npm las instala aunque no estén en package.json.
 * Tocador no las usa (no hay cajón lateral ni animaciones con reanimated), así que se excluyen
 * del autoenlazado: no se compila su C++ ni entran en el APK. Si algún día se usan, quitarlas
 * de aquí y añadirlas a package.json con `npx expo install`.
 */
const sinNativo = { platforms: { android: null, ios: null } };

module.exports = {
  dependencies: {
    'react-native-gesture-handler': sinNativo,
    'react-native-reanimated': sinNativo,
    'react-native-worklets': sinNativo,
  },
};
