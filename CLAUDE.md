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
- `src/app/` — solo rutas de Expo Router. Pestañas (`expo-router/js-tabs`, no las nativas) en `(tabs)/`: Neceser y Compra. Iconos: `@expo/vector-icons/MaterialCommunityIcons` (comprobar que el nombre existe en su glyphmap). `src/components/`, `src/hooks/` (`useNeceser`, `useConsulta`), `src/utils/` (textos y formato).

Cómo arrancarla: ver `CHULETA.md`.

Antes de dar algo por terminado: `npm test`, `npm run typecheck`, `npx expo lint`.
