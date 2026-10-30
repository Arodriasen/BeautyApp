# Política de privacidad de Tocador

Última actualización: 30 de octubre de 2026

Tocador es una app para llevar el inventario personal de maquillaje y cosmética. No tiene cuentas de usuario, publicidad ni analítica, y no recoge datos personales.

## Qué se guarda y dónde

Todo lo que añades a la app (productos, botes y sus fechas, fotos, lista de la compra, ajustes) se guarda **solo en tu móvil**. No se envía a ningún servidor nuestro: la app no tiene servidor. Si desinstalas la app, esos datos se borran.

## Permisos

- **Cámara**: para leer el código de barras de tus productos y, si quieres, hacerles una foto. Las imágenes de la cámara no salen del móvil.
- **Fotos**: para elegir una foto de tu galería como imagen de un producto. Se guarda una copia dentro de la app.
- **Notificaciones**: para avisarte de los productos que caducan. Se programan en el propio móvil.

## Servicios externos

Para identificar productos, la app consulta estas bases de datos públicas de internet. Solo les envía lo necesario para la búsqueda (nunca tus datos del inventario) y, como cualquier conexión a internet, ellas reciben la dirección IP del móvil:

| Servicio | Qué recibe | Cuándo |
|---|---|---|
| [Open Beauty Facts](https://world.openbeautyfacts.org/privacy) | El código de barras o el texto buscado | Al escanear, buscar por nombre o consultar ingredientes |
| [UPCitemdb](https://www.upcitemdb.com/privacy-policy) | El código de barras o el texto buscado | Si Open Beauty Facts no conoce el producto |
| [Makeup API](https://makeup-api.herokuapp.com) | Nada (se descarga su catálogo completo) | Al buscar por nombre o tras escanear, para sugerir tonos |
| [INCI API](https://inciapi.com) | El código de barras o la lista de ingredientes, y tu clave de INCI API | Solo si has puesto tu propia clave en Ajustes y pides analizar ingredientes |

Las fotos de producto que ofrecen estas bases de datos se descargan al móvil si las eliges. La clave de INCI API se guarda solo en tu móvil.

## Menores

La app no está dirigida a menores de 13 años y no recoge datos de nadie.

## Cambios y contacto

Si esta política cambia, se actualizará en esta página. Para cualquier duda, abre una incidencia en https://github.com/Arodriasen/BeautyApp/issues.
