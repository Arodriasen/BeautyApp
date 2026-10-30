# Crea la clave de subida a Google Play de Tocador y la apunta en las propiedades de Gradle del
# usuario (%USERPROFILE%\.gradle\gradle.properties), fuera del repo. Pide la contraseña al lanzarlo;
# no queda escrita en ningún archivo del proyecto.
#
#   pwsh -File scripts/crear-clave-subida.ps1 [-Ruta G:\_Claves\tocador-subida.jks]
#
# Haz copia de seguridad del .jks y de la contraseña: Google firma la app con su propia clave
# (Play App Signing), pero sin esta no podrás subir versiones nuevas hasta pedirle que la reinicie.
param(
    [string]$Ruta = 'G:\_Claves\tocador-subida.jks',
    [string]$Alias = 'tocador'
)
$ErrorActionPreference = 'Stop'

$keytool = Join-Path ($env:JAVA_HOME ?? 'G:\JDK') 'bin\keytool.exe'
$propiedades = Join-Path $HOME '.gradle\gradle.properties'

if (Test-Path $Ruta) { throw "Ya existe $Ruta. No la sobrescribo: si quieres otra, bórrala tú antes." }
if ((Test-Path $propiedades) -and (Select-String -Path $propiedades -Pattern '^TOCADOR_UPLOAD_' -Quiet)) {
    throw "$propiedades ya tiene propiedades TOCADOR_UPLOAD_*. Quítalas antes si quieres crear otra clave."
}

$segura = Read-Host 'Contraseña para la clave (mínimo 6 caracteres)' -AsSecureString
$repetida = Read-Host 'Repítela' -AsSecureString
$clave = [System.Net.NetworkCredential]::new('', $segura).Password
if ($clave -ne [System.Net.NetworkCredential]::new('', $repetida).Password) { throw 'Las contraseñas no coinciden.' }
if ($clave.Length -lt 6) { throw 'Mínimo 6 caracteres.' }

New-Item -ItemType Directory -Force (Split-Path $Ruta) | Out-Null
# keytool lee las contraseñas de variables de entorno (:env) para que no salgan en la línea de comandos.
$env:TOCADOR_CLAVE = $clave
try {
    & $keytool -genkeypair -v -storetype PKCS12 -keystore $Ruta -alias $Alias -keyalg RSA -keysize 2048 `
        -validity 10000 -storepass:env TOCADOR_CLAVE -keypass:env TOCADOR_CLAVE `
        -dname 'CN=Tocador, O=Arodriasen, C=ES'
    if ($LASTEXITCODE -ne 0) { throw "keytool ha fallado ($LASTEXITCODE)." }
} finally {
    Remove-Item Env:TOCADOR_CLAVE
}

New-Item -ItemType Directory -Force (Split-Path $propiedades) | Out-Null
$rutaGradle = $Ruta -replace '\\', '/'
Add-Content -Path $propiedades -Encoding utf8 -Value @(
    '',
    '# Clave de subida a Google Play de Tocador (scripts/crear-clave-subida.ps1)',
    "TOCADOR_UPLOAD_STORE_FILE=$rutaGradle",
    "TOCADOR_UPLOAD_KEY_ALIAS=$Alias",
    "TOCADOR_UPLOAD_STORE_PASSWORD=$clave",
    "TOCADOR_UPLOAD_KEY_PASSWORD=$clave"
)

Write-Host ""
Write-Host "Clave creada en $Ruta y apuntada en $propiedades."
Write-Host 'Haz copia de seguridad del .jks y de la contraseña (gestor de contraseñas, otro disco...).'
