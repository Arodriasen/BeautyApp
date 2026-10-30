#!/usr/bin/env node
/**
 * Genera un APK de Tocador listo para instalar.
 *
 *   npm run apk                  sube la versión (1.0.0 → 1.0.1), compila y deja dist/Tocador-1.0.1.apk
 *   npm run apk -- --movil       además lo copia a /sdcard/APK del móvil conectado (no lo instala)
 *   npm run apk -- --sin-subir   recompila la versión actual sin cambiar el número
 *   npm run apk -- --menor       sube la versión menor (1.0.3 → 1.1.0) en vez del parche
 *   npm run aab                  igual, pero genera dist/Tocador-1.0.1.aab para subir a Google Play
 *   npm run apk -- --solo-arm64  APK ligero (~37 MB) solo para móviles arm64, para instalar a mano.
 *                                Por defecto incluye todos los procesadores (~130 MB), como pide Google Play.
 *
 * Android solo instala encima si `versionCode` es mayor que el instalado, por eso se sube siempre
 * junto con `version`. Google Play tampoco acepta un versionCode ya subido.
 *
 * Si existen las propiedades TOCADOR_UPLOAD_* (scripts/crear-clave-subida.ps1), APK y AAB se firman
 * con la clave de subida (plugins/firma-subida.js); si no, con la de depuración.
 */
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..');
const APP_JSON = path.join(RAIZ, 'app.json');
const JAVA_HOME = process.env.JAVA_HOME || 'G:\\JDK';
const CMAKE = '3.31.6';
const ADB =path.join(process.env.ANDROID_HOME || 'G:\\AndroidSdk', 'platform-tools', 'adb.exe');

const args = new Set(process.argv.slice(2));

function ejecutar(comando, argumentos, opciones = {}) {
  console.log(`\n> ${comando} ${argumentos.join(' ')}`);
  execFileSync(comando, argumentos, { stdio: 'inherit', shell: process.platform === 'win32', ...opciones });
}

function subirVersion() {
  const app = JSON.parse(fs.readFileSync(APP_JSON, 'utf8'));
  const [mayor, menor, parche] = app.expo.version.split('.').map(Number);
  app.expo.version = args.has('--menor') ? `${mayor}.${menor + 1}.0` : `${mayor}.${menor}.${parche + 1}`;
  app.expo.android.versionCode = (app.expo.android.versionCode ?? 1) + 1;
  fs.writeFileSync(APP_JSON, JSON.stringify(app, null, 2) + '\n');
  return app.expo;
}

/**
 * `prebuild` borra android/local.properties. Sin `cmake.dir` se usaría CMake 3.22.1, cuyo ninja
 * no admite rutas de más de 260 caracteres y la build falla en Windows.
 */
function escribirLocalProperties() {
  const sdk = process.env.ANDROID_HOME || 'G:\\AndroidSdk';
  const escapar = (ruta) => ruta.replace(/\\/g, '\\\\').replace(/:/g, '\\:');
  fs.writeFileSync(
    path.join(RAIZ, 'android', 'local.properties'),
    `sdk.dir=${escapar(sdk)}\n` +
      '# CMake 3.31.6: su ninja (1.12) admite rutas largas (con LongPathsEnabled=1 en Windows)\n' +
      `cmake.dir=${escapar(path.join(sdk, 'cmake', CMAKE))}\n`,
  );
}

const appJsonOriginal = fs.readFileSync(APP_JSON, 'utf8');
const expo = args.has('--sin-subir') ? JSON.parse(appJsonOriginal).expo : subirVersion();
console.log(`Tocador ${expo.version} (versionCode ${expo.android.versionCode})`);

const ANDROID = path.join(RAIZ, 'android');
const GRADLEW = path.join(ANDROID, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew');
try {
  // Regenera android/ desde app.json (versión, icono, plugins). Sin --clean, para conservar
  // android/local.properties (ruta a CMake 3.31.6, necesaria por las rutas largas).
  ejecutar('npx', ['expo', 'prebuild', '--platform', 'android', '--no-install'], { env: { ...process.env, CI: '1' } });
  escribirLocalProperties();
  const abis = args.has('--solo-arm64') ? ['-PreactNativeArchitectures=arm64-v8a'] : [];
  const tarea = args.has('--aab') ? 'bundleRelease' : 'assembleRelease';
  ejecutar(`"${GRADLEW}"`, [tarea, '--console=plain', ...abis], { cwd: ANDROID, env: { ...process.env, JAVA_HOME } });
} catch (e) {
  // Si la build falla, la versión no debe quedar subida.
  fs.writeFileSync(APP_JSON, appJsonOriginal);
  console.error('\nLa build ha fallado; app.json vuelve a su versión anterior.');
  process.exit(1);
}

const aab = args.has('--aab');
const salidas = path.join(RAIZ, 'android', 'app', 'build', 'outputs');
const origen = aab
  ? path.join(salidas, 'bundle', 'release', 'app-release.aab')
  : path.join(salidas, 'apk', 'release', 'app-release.apk');
const nombre = `Tocador-${expo.version}${args.has('--solo-arm64') ? '-arm64' : ''}.${aab ? 'aab' : 'apk'}`;
fs.mkdirSync(path.join(RAIZ, 'dist'), { recursive: true });
const destino = path.join(RAIZ, 'dist', nombre);
fs.copyFileSync(origen, destino);
console.log(`\n${aab ? 'AAB' : 'APK'}: ${destino} (${(fs.statSync(destino).size / 1024 / 1024).toFixed(1)} MB)`);

if (args.has('--movil') && !aab) {
  ejecutar(ADB, ['push', destino, `/sdcard/APK/${nombre}`], { shell: false });
  console.log(`Copiado a /sdcard/APK/${nombre}. Instálalo desde el gestor de archivos.`);
}
