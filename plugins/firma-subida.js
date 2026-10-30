/**
 * Firma las builds de release con la clave de subida a Google Play.
 *
 * `expo prebuild` regenera android/app/build.gradle (que firma con la clave de depuración); este
 * plugin le añade una firma `release` que lee de las propiedades de Gradle del usuario
 * (%USERPROFILE%\.gradle\gradle.properties, fuera del repo):
 *
 *   TOCADOR_UPLOAD_STORE_FILE=G:/_Claves/tocador-subida.jks
 *   TOCADOR_UPLOAD_KEY_ALIAS=tocador
 *   TOCADOR_UPLOAD_STORE_PASSWORD=…
 *   TOCADOR_UPLOAD_KEY_PASSWORD=…
 *
 * Las crea `scripts/crear-clave-subida.ps1`. Sin ellas se sigue firmando con la de depuración.
 */
const { withAppBuildGradle } = require('expo/config-plugins');

const FIRMA = `
        release {
            if (project.hasProperty('TOCADOR_UPLOAD_STORE_FILE')) {
                storeFile file(TOCADOR_UPLOAD_STORE_FILE)
                storePassword TOCADOR_UPLOAD_STORE_PASSWORD
                keyAlias TOCADOR_UPLOAD_KEY_ALIAS
                keyPassword TOCADOR_UPLOAD_KEY_PASSWORD
            }
        }`;

const USO = `signingConfig project.hasProperty('TOCADOR_UPLOAD_STORE_FILE') ? signingConfigs.release : signingConfigs.debug`;

module.exports = function conFirmaSubida(config) {
  return withAppBuildGradle(config, (c) => {
    let gradle = c.modResults.contents;
    if (gradle.includes('TOCADOR_UPLOAD_STORE_FILE')) return c;

    const debug = /(signingConfigs \{\s*\n\s*debug \{[\s\S]*?\n\s*\})/;
    const release = /(buildTypes \{[\s\S]*?release \{[\s\S]*?)signingConfig signingConfigs\.debug/;
    if (!debug.test(gradle) || !release.test(gradle)) {
      throw new Error('firma-subida: build.gradle no tiene la forma esperada; revisa el plugin.');
    }
    gradle = gradle.replace(debug, `$1${FIRMA}`).replace(release, `$1${USO}`);
    c.modResults.contents = gradle;
    return c;
  });
};
