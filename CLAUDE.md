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
- `app.js`: toda la lógica. Se carga después de los dos archivos de datos.

### Navegación

La pantalla actual depende del final de la dirección (`#rutinas`, `#crear-rutina`, `#buscar-ejercicio`, `#nuevo-ejercicio`, `#entrenar`, `#historial`, `#predeterminada-<id>`, `#mia-<id>`; sin nada = inicio), así que el botón "atrás" del navegador también funciona. Las pantallas se registran en `PANTALLAS` (en `app.js`): cada una tiene un `padre`, que es adonde lleva "Volver" si se abrió la página directamente en ella, y opcionalmente `alEntrar`, que la prepara cada vez que se muestra.

### Pantallas

- Inicio: título y tres botones grandes ("Rutinas", "Empezar entrenamiento", "Historial / Progreso"). Los dos últimos muestran "Próximamente".
- Rutinas: secciones "Rutinas predeterminadas" y "Mis rutinas", con una tarjeta por rutina (nombre y número de ejercicios). Al pulsar una tarjeta se abre el detalle (nombre y lista de ejercicios). En las rutinas propias, el detalle tiene "Editar" y "Borrar" (con `confirm()` antes de borrar). En las predeterminadas, en su lugar, tiene "Copiar a mis rutinas": crea una rutina propia independiente (id nuevo, copia de la lista de ejercicios) llamada "<nombre> (copia)", o "(copia 2)", "(copia 3)"… si ya existe; muestra un aviso breve (`mostrarAvisoBreve`) y sustituye la pantalla por el detalle de la copia.
- Crear rutina: nombre, lista de ejercicios añadidos (con subir ↑, bajar ↓ y "Quitar") y "Añadir ejercicio", que da dos opciones: "Buscar en la lista" (buscador que filtra por nombre o grupo, sin importar tildes ni mayúsculas) y "Crear ejercicio" (nombre y tipo de medición; se guarda y se añade a la rutina). "Guardar" exige nombre y al menos un ejercicio. La rutina en preparación vive en memoria hasta que se guarda.
- Editar rutina (`#editar-mia-<id>`): es la misma pantalla y el mismo código que "Crear rutina", con los datos cargados. `idRutinaEnEdicion` indica si se crea (`null`) o se edita. `guardarRutina()` valida el formulario y guarda.
- Toda escritura de una rutina propia (crear, editar, copiar) pasa por `guardarEnMisRutinas(rutina)`, que la reemplaza si su id ya existe o la añade si es nueva.

### Datos

- Lo fijo (ejercicios base y rutinas predeterminadas) vive en el código y **nunca** se guarda en `localStorage`, para poder cambiarlo sin afectar a los datos de cada persona.
- `localStorage` `"misRutinas"`: rutinas propias, `{ id, nombre, ejercicios }` con ids de ejercicios. Una rutina guarda solo sus ejercicios, sin series, repeticiones ni pesos.
- `localStorage` `"misEjercicios"`: ejercicios creados por la persona, mismo formato que los base (`grupo: "Mis ejercicios"`). Aparecen también en el buscador.
- Las rutinas guardan ids de ejercicios: no cambiar el `id` de un ejercicio de `EJERCICIOS_BASE` que ya pueda estar en uso. Si no se encuentra un id, se muestra "Ejercicio no encontrado".
- (Una versión anterior usaba la clave `"ejercicios"`; ese código se quitó.)
