# Chuleta: arrancar Tocador

## En el emulador del PC

**1. Arrancar el emulador** (PowerShell, deja la ventana abierta):

```powershell
& G:\AndroidSdk\emulator\emulator.exe -avd VideoGameLibrary_Test
```

Espera a que Android termine de arrancar (pantalla de inicio visible).

**2. Arrancar la app** (otra terminal):

```powershell
cd G:\_Source\BeautyApp
npx expo start
```

Cuando salga el QR, pulsa **`a`**. La primera vez instala Expo Go en el emulador y luego abre la app.

## En el móvil Android

1. Instala **Expo Go** desde Play Store (solo la primera vez).
2. Móvil y PC en la **misma wifi**.
3. `npx expo start` en `G:\_Source\BeautyApp` y escanea el QR con Expo Go.

## Generar el APK para instalar (build propia)

No necesita el PC una vez instalada: lleva todo dentro.

```powershell
cd G:\_Source\BeautyApp
npm run apk                  # sube la versión (1.0.1 → 1.0.2), compila y deja dist\Tocador-1.0.2.apk
npm run apk -- --movil       # además lo copia a /sdcard/APK del móvil conectado (no lo instala)
npm run apk -- --sin-subir   # recompila la versión actual
npm run apk -- --menor       # 1.0.5 → 1.1.0
npm run apk -- --solo-arm64  # APK ligero (~37 MB) solo para móviles arm64 como el suyo
```

El script hace `expo prebuild`, reescribe `android\local.properties` (CMake 3.31.6) y lanza Gradle. Si la build falla, deja `app.json` con la versión que tenía. Por defecto lleva todos los procesadores (~130 MB, lo que pide Google Play); con `--solo-arm64` queda en unos 37 MB.

Requisito ya preparado en este PC: rutas largas de Windows activadas (`LongPathsEnabled=1`) y CMake 3.31.6 en el SDK.

## Google Play (prueba interna)

Paquete: `com.arodriasen.tocador` (definitivo: no se puede cambiar tras la primera subida).

**Clave de subida (una sola vez):**

```powershell
pwsh -File scripts\crear-clave-subida.ps1    # pide la contraseña; crea G:\_Claves\tocador-subida.jks
```

Guarda las propiedades `TOCADOR_UPLOAD_*` en `%USERPROFILE%\.gradle\gradle.properties` (fuera del repo). El plugin `plugins/firma-subida.js` las usa para firmar APK y AAB de release; sin ellas firma con la de depuración. **Copia de seguridad del .jks y la contraseña.** Google firma lo que distribuye con su propia clave (Play App Signing), así que un APK instalado a mano no se actualiza desde Play ni al revés: hay que desinstalar.

**Cada versión:**

```powershell
npm run aab                  # sube la versión y deja dist\Tocador-X.Y.Z.aab
```

Play Console → Tocador → Pruebas → Prueba interna → Crear versión → subir el `.aab`.

**Primera vez en Play Console:**

1. *Crear aplicación*: nombre Tocador, idioma español (España), aplicación, gratuita.
2. *Prueba interna → Testers*: crear lista con los correos de Google (Gmail) de quien vaya a usarla.
3. *Crear versión*: aceptar Play App Signing, subir el `.aab`, notas de la versión, guardar y publicar.
4. *Panel → Configurar la app* (pide rellenarlo antes o después de la primera versión):
   - Política de privacidad: `https://github.com/Arodriasen/BeautyApp/blob/master/PRIVACIDAD.md` (tiene que estar en GitHub).
   - Acceso a la app: todo accesible sin credenciales. Anuncios: no. Público objetivo: 18+.
   - Seguridad de los datos: no recoge ni comparte datos (todo se queda en el móvil; los servicios externos solo reciben el código o el texto buscado). Cifrado en tránsito: sí (HTTPS).
   - Clasificación de contenido: cuestionario → utilidad/productividad, todo "no".
   - Categoría: Belleza.
5. En *Prueba interna → Testers* copiar el **enlace de participación** y abrirlo en el móvil de cada tester: aceptar y luego instalar desde Play Store.

## Teclas en la terminal de Expo

| Tecla | Qué hace |
|---|---|
| `a` | Abrir en el emulador/móvil Android conectado |
| `r` | Recargar la app |
| `m` | Menú de desarrollo |
| `j` | Abrir el depurador |
| `Ctrl+C` | Parar el servidor |

Al guardar un archivo, el cambio aparece solo en la app (no hace falta recargar).

## Comprobaciones antes de dar algo por bueno

```powershell
npm test            # tests del dominio
npm run typecheck   # errores de tipos
npx expo lint       # linter
```

## Si algo falla

| Síntoma | Solución |
|---|---|
| Emulador: `WHPX: Failed to setup partition` | Emulador desactualizado: `& G:\AndroidSdk\cmdline-tools\12.0\bin\sdkmanager.bat emulator`. **No** desactives Hyper-V. |
| Al pulsar `a` no encuentra el emulador | Comprueba que se ve: `& G:\AndroidSdk\platform-tools\adb.exe devices` (debe salir `emulator-5554 device`). Si no, cierra y vuelve a abrir el emulador. |
| `Device XXXX is unauthorized` | Es el móvil por USB pidiendo permiso: desbloquéalo y acepta **"Permitir depuración USB"** (marca "siempre"). Si no sale el aviso: en el móvil *Opciones de desarrollador → Revocar autorizaciones*, reconecta el cable y `& G:\AndroidSdk\platform-tools\adb.exe kill-server`. |
| Quería el emulador pero abre el móvil | Arranca antes el emulador; con dos dispositivos Expo pregunta cuál al pulsar `a` (o desenchufa el móvil). |
| La app se queda en blanco o con cambios viejos | Para con `Ctrl+C` y arranca limpiando caché: `npx expo start -c` |
| El móvil no conecta por QR | Misma wifi; si persiste, `npx expo start --tunnel` |
| Aviso `Node.js (v22.12.0) is outdated` | De momento se puede ignorar; conviene actualizar Node a la LTS. |
| No llegan los avisos | Pantalla **Avisos** (arriba a la derecha) → "Enviar un aviso de prueba". Si no llega: permiso de notificaciones de **Expo Go** en los ajustes del móvil, y quitar la optimización de batería a Expo Go. |
| Gradle: `Filename longer than 260 characters` | Falta `LongPathsEnabled=1` o el `cmake.dir` de `androidlocal.properties` (CMake 3.31.6; el 3.22.1 trae un ninja que no admite rutas largas). |
| Después de `npm install` algo deja de compilar | `npx expo install --fix` y `npx expo-doctor` |
