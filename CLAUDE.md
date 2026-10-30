@AGENTS.md

## Tocador (carpeta y slug: BeautyApp)

Inventario personal de maquillaje y cosmética (Android). Código y textos de la UI en español.

Diseño "Tocador" (siempre claro): paleta y fuentes en `src/constants/theme.ts` (baya `#9E2B5B` sobre porcelana `#FCF6F7`; títulos Bodoni Moda cursiva, textos Jost). En Android el peso va por familia (`Fonts.semibold`…), no con `fontWeight`. Formas: tarjetas `Radius.tarjeta`, botones/chips en pastilla, miniaturas redondas. El icono y el splash se generan desde el símbolo PAO (`BotePao`); los PNG de `assets/images` salen de un script con resvg y la Bodoni del paquete de fuentes.

Arquitectura DDD:
- `src/domain/` — TypeScript puro, sin React ni Expo. Value objects (`Ean`, `Pao`), entidades (`Producto`, `Unidad` = un bote concreto), reglas de caducidad e interfaces de repositorio.
- `src/application/` — `ServicioNeceser`: casos de uso (alta, abrir/terminar bote, resumen ordenado por urgencia, detalle). `ServicioEscaneo`: código leído → ¿ya lo tengo? → si no, `CatalogoExterno` (puerto). Tests con repositorios en memoria (`src/test-utils/`).
- `src/infrastructure/sqlite/` — expo-sqlite: migraciones por `PRAGMA user_version` y repositorios. Fechas como texto `AAAA-MM-DD`. Upsert con `ON CONFLICT DO UPDATE` (no usar `INSERT OR REPLACE`: borraría los botes en cascada).
- `src/application/ServicioCompra.ts` — lista de la compra (`ArticuloCompra`: texto libre o enlazado a un producto; la descripción se copia para que sobreviva si se borra el producto). Sugerencias = productos caducados/caducan pronto/terminados que no estén ya pendientes.
- `src/application/avisos/` — `planificarAvisos` (función pura: aviso N días antes + el día, agrupados, máx. 50, resumen semanal opcional) y `ServicioAvisos` (reprograma todo con `sincronizar()`). `ServicioNeceser` recibe un callback `alCambiar` que dispara la reprogramación tras cada cambio de botes; `GestorAvisos` (layout) reprograma también al volver a primer plano.
- `src/infrastructure/notificaciones/` — `ExpoNotificador`: canal `caducidad`, triggers `DATE` con entrega `bestEffort` (sin permiso de alarmas exactas). Reprogramaciones serializadas en cola. **No importar `expo-notifications` directamente**: usar `expo-notifications-local.ts` (su index carga `ExpoTopicSubscriptionModule`, que no existe en Expo Go Android y tumba la app al arrancar).
- `src/infrastructure/catalogo/` — `CatalogoEnCadena` [Open Beauty Facts → UPCitemdb (trial, 100/día por IP)], ambas sin clave. `mapeo-categorias.ts` traduce sus categorías a las nuestras. En jest `fetch` está simulado por jest-expo; para probar contra las APIs reales usar un script con `npx tsx`.
- `src/infrastructure/fotos/` — `FotosEnDispositivo` (puerto `AlmacenFotos`): copia/descarga a `Paths.document/fotos`. En BD solo se guarda el nombre del archivo; `uriFoto()` lo resuelve.
- Ingredientes: dominio `productos/Ingredientes.ts` (parsear lista INCI, términos a evitar por fragmento sin tildes), `application/ingredientes/ServicioIngredientes` (lista desde Open Beauty Facts gratis → INCI API si hay clave), clientes `catalogo/ObfIngredientes` e `InciApi`. La clave de INCI API la mete el usuario en Ajustes y se guarda solo en SQLite (tabla `ajustes`), nunca en el código.
- `react-native.config.js` excluye del autoenlazado nativo gesture-handler, reanimated y worklets: npm las instala como peer de expo-router (drawer-layout) aunque no estén en package.json, y la app no las usa.
- APK: `npm run apk` (`scripts/apk.js`); AAB para Google Play: `npm run aab`. Paquete `com.arodriasen.tocador` (definitivo). Firma de release con la clave de subida vía `plugins/firma-subida.js` (propiedades `TOCADOR_UPLOAD_*` del gradle.properties del usuario, creadas por `scripts/crear-clave-subida.ps1`). Política de privacidad en `PRIVACIDAD.md`: si se añade un servicio externo o un permiso, actualizarla. Ver CHULETA.md.
- Búsqueda por nombre (alta a mano): puerto `BuscadorPorNombre`; `BuscadorEnCadena` consulta Open Beauty Facts y Makeup API (catálogo de 1,6 MB descargado una vez por sesión y filtrado en el móvil; trae tonos con color → `TonosSugeridos` en el alta) en paralelo, y UPCitemdb solo si hay < 5 resultados (cupo 100/día; sus resultados se filtran por las palabras buscadas porque su buscador es muy laxo). Se busca al pulsar, no al teclear (Open Facts: 10 búsquedas/min). Tras escanear, el alta pide aparte los tonos (puerto `BuscadorDeTonos`, `MakeupApi.buscarTonos`): misma marca y todas las palabras del nombre de Makeup API (tipo incluido, con equivalencias español→inglés) dentro del nombre escaneado; si duda entre dos productos distintos, sin tonos.
- Looks: se quitó la función. La migración 8 borra las tablas `looks` y `pasos_look` que creaba la 7.
- Marcas: `catalogo/marcas.ts` unifica variantes ("Maybelline New York" → Maybelline, "NYX Professional Makeup" → NYX) y las quita del nombre; todas las fuentes externas pasan por ahí.
- Tests de SQLite: `test-utils/sqlite-de-prueba.ts` (sql.js en memoria con la API de expo-sqlite que usamos); los tests llevan `@jest-environment node`. Si se añade una migración, actualizar la versión esperada en `sqlite.test.ts`.
- `src/app/` — solo rutas de Expo Router. Pestañas (`expo-router/js-tabs`, no las nativas) en `(tabs)/`: Neceser y Compra. Iconos: `@expo/vector-icons/MaterialCommunityIcons` (comprobar que el nombre existe en su glyphmap). `src/components/`, `src/hooks/` (`useNeceser`, `useConsulta`), `src/utils/` (textos y formato).

Cómo arrancarla: ver `CHULETA.md`.

Antes de dar algo por terminado: `npm test`, `npm run typecheck`, `npx expo lint`.
