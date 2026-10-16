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

No necesita el PC una vez instalada: lleva todo dentro. Sube `version` en `app.json` antes de cada APK nuevo.

```powershell
cd G:_SourceBeautyApp
npx expo prebuild --platform android      # solo si cambió app.json, iconos o se añadió una librería nativa
cd android
$env:JAVA_HOME = "G:JDK"; .gradlew assembleRelease
```

El APK sale en `androidappuildoutputsapkeleaseapp-release.apk`. Para dejarlo en la carpeta APK del móvil (conectado por USB):

```powershell
& G:AndroidSdkplatform-toolsadb.exe push androidappuildoutputsapkeleaseapp-release.apk /sdcard/APK/Tocador-1.0.0.apk
```

Requisitos ya preparados en este PC: rutas largas de Windows activadas (`LongPathsEnabled=1`) y CMake 3.31.6 en el SDK, indicado en `androidlocal.properties` (`cmake.dir`). Si `prebuild --clean` borra la carpeta `android`, hay que volver a crear ese `local.properties`.

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
