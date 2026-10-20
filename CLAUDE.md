# Mi app de gym

App web sencilla para gente que va al gimnasio. Está pensada para principiantes y para usarse sobre todo en iPhone (Safari).

## Reglas

- **Muy simple.** Nada de complicaciones innecesarias: pocas pantallas, pocos botones, textos claros.
- **Solo HTML, CSS y JavaScript**, sin librerías, frameworks ni herramientas de compilación. La app se abre directamente con `index.html`.
- **Datos en `localStorage`.** No hay servidor, ni base de datos, ni cuentas de usuario. Todo acceso a `localStorage` va dentro de `try/catch` para que la app siga funcionando si el navegador no deja guardar.
- **Primero el móvil.** Diseñar pensando en la pantalla del iPhone; en pantallas grandes, el contenido se queda centrado con un ancho máximo. Botones y campos grandes, fáciles de pulsar con el dedo.
- **Explicar los cambios en lenguaje sencillo.** El dueño del proyecto es principiante: después de cada cambio, explicar qué se hizo y cómo funciona sin jerga técnica (o explicándola cuando haga falta).
- Escribir el código, los nombres y los comentarios en español, como el código que ya existe.

## Funciones previstas (v1)

1. **Rutinas predeterminadas** para principiantes, listas para usar.
2. **Rutinas propias:** crearlas y guardarlas, sin límite.
3. **Registrar entrenamientos:** ejercicios hechos, con peso y repeticiones.
4. **Historial:** ver los entrenamientos anteriores.

## Estado actual

### Archivos

Un solo HTML, con el aspecto separado de la lógica:

- `index.html`: la estructura de todas las pantallas. Cada pantalla es una `<section class="pantalla">` y solo se ve una a la vez.
- `estilos.css`: todo el aspecto (colores, tamaños). La lógica no pone estilos; solo usa clases y el atributo `hidden`.
- `ejercicios.js`: `EJERCICIOS_BASE`, la lista inicial de ejercicios (provisional), con `{ id, nombre, grupo, medicion }`. `medicion` es `"peso"`, `"peso-corporal"` o `"tiempo"`.
- `rutinas-predeterminadas.js`: `RUTINAS_PREDETERMINADAS` (provisionales), con `{ id, nombre, ejercicios }`, donde `ejercicios` son ids de `EJERCICIOS_BASE`.
- `app.js`: toda la lógica. Se carga después de los dos archivos de datos. Al final registra el service worker.
- `manifest.webmanifest`: nombre ("Mi app de gym", corto "Mi gym"), colores e iconos para instalar la app en la pantalla de inicio. `index.html` añade además las etiquetas que usa el iPhone (`apple-touch-icon`, `apple-mobile-web-app-title`…).
- `iconos/`: icono provisional (mancuerna blanca sobre naranja) en PNG de 180 (iPhone), 192 y 512 px. El dibujo cabe en el 60 % central, para que sirva también como icono "maskable".
- `sw.js`: service worker para usar la app sin conexión. Estrategia "primero internet": cada archivo se pide a internet (con `cache: "no-cache"`) y se guarda la copia; si no hay conexión o tarda más de 3 s, se usa la copia guardada. Así las versiones nuevas llegan solas sin tocar `sw.js`. **Si se añade, quita o renombra un archivo de la app, hay que actualizar la lista `ARCHIVOS` de `sw.js` y subir el número de `CACHE`** (por ejemplo, `"gym-v2"`); las copias antiguas se borran solas. El service worker no toca `localStorage`. Solo funciona publicado (https o localhost); al abrir `index.html` directamente no hace nada y la app funciona igual.

### Navegación

La pantalla actual depende del final de la dirección (`#rutinas`, `#crear-rutina`, `#buscar-ejercicio`, `#nuevo-ejercicio`, `#entrenar`, `#entrenamiento`, `#resumen-<id>`, `#historial`, `#historial-<id>`, `#progreso`, `#progreso-<año>-<mes>`, `#progreso-<año>-<mes>-<día>`, `#predeterminada-<id>`, `#mia-<id>`; sin nada = inicio), así que el botón "atrás" del navegador también funciona. Las pantallas se registran en `PANTALLAS` (en `app.js`): cada una tiene un `padre`, que es adonde lleva "Volver" si se abrió la página directamente en ella, y opcionalmente `alEntrar`, que la prepara cada vez que se muestra.

### Pantallas

- Inicio: título y cuatro botones grandes ("Rutinas", "Empezar entrenamiento", "Historial", "Progreso") y, debajo, uno más discreto: "Copia de seguridad". Si hay un entrenamiento sin terminar, encima aparece un aviso con "Continuar entrenamiento".
- Empezar entrenamiento (`#entrenar`): lista de rutinas (predeterminadas y propias). Al elegir una se crea el entrenamiento en curso (si ya había uno, pide confirmación para descartarlo) y se *sustituye* la pantalla por `#entrenamiento`, para que "Volver" lleve al inicio.
- Entrenamiento en curso (`#entrenamiento`): un bloque por ejercicio con su nombre, "Última vez: …" (última serie de ese ejercicio en el entrenamiento guardado más reciente) y filas de series (3 por defecto) con casilla "Hecha". Los campos dependen de `medicion` según `CAMPOS_SERIE`: peso → kg y reps; peso corporal → reps; tiempo → segundos. Campos `type="text"` con `inputmode` (`decimal` en kg, `numeric` en el resto); se acepta coma decimal. Botones "Añadir serie" y "Quitar serie" (quita la última; pide confirmación si tiene datos). "Terminar entrenamiento" exige al menos una serie hecha y que las hechas tengan datos válidos, avisa si hay series con datos sin marcar, guarda y sustituye la pantalla por el resumen. "Cancelar entrenamiento" pide confirmación y lo descarta.
- Resumen / detalle de un entrenamiento guardado: una sola pantalla (`pantalla-resumen`, `pintarResumen(entrenamiento, recienTerminado)`) para dos direcciones. `#resumen-<id>` es al terminar (título "¡Entrenamiento guardado!", padre inicio); `#historial-<id>` es desde el historial (título "Entrenamiento", padre historial). Muestra rutina, fecha, duración, número de series y las series de cada ejercicio, y tiene "Borrar entrenamiento" (con `confirm()`; después vuelve atrás).
- Historial (`#historial`): una tarjeta por entrenamiento, del más reciente al más antiguo (por `fecha`), con la fecha y "rutina · N ejercicios · N series". Si no hay ninguno: "Todavía no has registrado ningún entrenamiento".
- Progreso (`#progreso`): calendario mensual dentro de un recuadro (`.calendario`) con "Mi app de gym" arriba, pensado para que quepa entero en una captura. Semana de lunes a domingo; días con al menos un entrenamiento en círculo naranja (son botones), hoy con un aro oscuro, el resto sin nada. Flechas ‹ › para cambiar de mes: *sustituyen* la dirección (`#progreso-2026-09`) para no llenar el historial del navegador. Debajo, "Este mes: N entrenamientos" (o "En septiembre: …", con el año si no es el actual). Un día con un entrenamiento abre `#historial-<id>`; con varios, cambia la dirección a `#progreso-2026-10-12` y muestra debajo una lista para elegir (así "atrás" desde el detalle vuelve con la lista abierta). Los días se agrupan con `claveDia()`, que usa la fecha local del dispositivo (`getFullYear/getMonth/getDate`), nunca la hora universal.
- Copia de seguridad (`#copia`): explica que los datos solo están en el dispositivo y muestra cuántos hay. "Exportar datos" crea `copia-gym-<fecha>.json` con `{ tipo: "copia-de-seguridad-mi-app-gym", version, fecha, datos: { misRutinas, misEjercicios, entrenamientos } }`; en pantallas táctiles intenta el menú de compartir (`navigator.share` con el archivo) y, si no se puede, lo descarga con un enlace. "Importar datos" abre un `<input type="file">` oculto; `comprobarCopia()` exige ese `tipo`, rechaza versiones más nuevas que `VERSION_DATOS`, convierte las antiguas con `actualizarFormato()` y comprueba cada rutina, ejercicio, entrenamiento y serie. Solo si todo es válido pide `confirm()` (indicando lo que hay ahora y lo que trae el archivo) y reemplaza las tres listas; si falla al guardar, deja los datos como estaban. El entrenamiento en curso no entra en la copia ni se toca.
- Fechas: `fechaLegible()` da "martes 20 de octubre" (con el año solo si no es el actual); `fechaLegibleTitulo()`, igual con mayúscula inicial.
- Rutinas: secciones "Rutinas predeterminadas" y "Mis rutinas", con una tarjeta por rutina (nombre y número de ejercicios). Al pulsar una tarjeta se abre el detalle (nombre y lista de ejercicios). En las rutinas propias, el detalle tiene "Editar" y "Borrar" (con `confirm()` antes de borrar). En las predeterminadas, en su lugar, tiene "Copiar a mis rutinas": crea una rutina propia independiente (id nuevo, copia de la lista de ejercicios) llamada "<nombre> (copia)", o "(copia 2)", "(copia 3)"… si ya existe; muestra un aviso breve (`mostrarAvisoBreve`) y sustituye la pantalla por el detalle de la copia.
- Crear rutina: nombre, lista de ejercicios añadidos (con subir ↑, bajar ↓ y "Quitar") y "Añadir ejercicio", que da dos opciones: "Buscar en la lista" (buscador que filtra por nombre o grupo, sin importar tildes ni mayúsculas) y "Crear ejercicio" (nombre y tipo de medición; se guarda y se añade a la rutina). "Guardar" exige nombre y al menos un ejercicio. La rutina en preparación vive en memoria hasta que se guarda.
- Editar rutina (`#editar-mia-<id>`): es la misma pantalla y el mismo código que "Crear rutina", con los datos cargados. `idRutinaEnEdicion` indica si se crea (`null`) o se edita. `guardarRutina()` valida el formulario y guarda.
- Toda escritura de una rutina propia (crear, editar, copiar) pasa por `guardarEnMisRutinas(rutina)`, que la reemplaza si su id ya existe o la añade si es nueva.

### Datos

- Lo fijo (ejercicios base y rutinas predeterminadas) vive en el código y **nunca** se guarda en `localStorage`, para poder cambiarlo sin afectar a los datos de cada persona.
- **Versión del formato:** todo se guarda como `{ version, datos }` mediante `guardarDatos()`/`leerDatos()`. `VERSION_DATOS` es la versión actual (1). Al leer, `actualizarFormato()` convierte paso a paso lo antiguo a lo actual. Un array guardado sin envoltorio es la "versión 0" (formato de antes de las versiones) y se lee igual. **Si cambia la estructura de algún dato:** subir `VERSION_DATOS` y añadir el paso de conversión en `actualizarFormato()`; nunca tirar datos antiguos.
- `localStorage` `"entrenamientos"`: entrenamientos terminados, en orden de guardado: `{ id, fecha, inicio, rutina: { nombre }, ejercicios: [{ id, nombre, medicion, series: [{ kg, reps } | { reps } | { segundos }] }] }`. Solo series hechas, ya como números; solo ejercicios con al menos una serie. Los nombres son copias, no referencias: editar o borrar rutinas o ejercicios no cambia los entrenamientos guardados.
- `localStorage` `"entrenamientoEnCurso"`: el entrenamiento a medias (`{ id, inicio, rutina: { nombre }, ejercicios: [{ id, nombre, medicion, series: [{ hecha, kg, reps… }] }] }`, con los valores como texto tal cual se escriben). Se guarda en cada cambio (`guardarEntrenamientoEnCurso()`; si falla, se muestra un aviso) y se borra al terminar o cancelar. En memoria vive en `entrenamientoEnCurso`.
- `localStorage` `"misRutinas"`: rutinas propias, `{ id, nombre, ejercicios }` con ids de ejercicios. Una rutina guarda solo sus ejercicios, sin series, repeticiones ni pesos.
- `localStorage` `"misEjercicios"`: ejercicios creados por la persona, mismo formato que los base (`grupo: "Mis ejercicios"`). Aparecen también en el buscador.
- Las rutinas guardan ids de ejercicios: no cambiar el `id` de un ejercicio de `EJERCICIOS_BASE` que ya pueda estar en uso. Si no se encuentra un id, se muestra "Ejercicio no encontrado".
- (Una versión anterior usaba la clave `"ejercicios"`; ese código se quitó.)
