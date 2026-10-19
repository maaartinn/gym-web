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

- `index.html` es una app de varias pantallas en un solo archivo. Cada pantalla es una `<section class="pantalla">` y solo se ve una a la vez. La pantalla actual depende del final de la dirección (`#rutinas`, `#crear-rutina`, `#entrenar`, `#historial`, `#predeterminada-<id>`, `#mia-<id>`; sin nada = inicio), así que el botón "atrás" del navegador también funciona. Las pantallas se registran en `PANTALLAS`; cada una tiene un `padre`, que es adonde lleva "Volver" si se abrió la página directamente en ella.
- Inicio: título y tres botones grandes ("Rutinas", "Empezar entrenamiento", "Historial / Progreso").
- Rutinas: secciones "Rutinas predeterminadas" y "Mis rutinas", con una tarjeta por rutina (nombre y número de ejercicios). Al pulsar una tarjeta se abre el detalle (nombre y lista de ejercicios). "Crear rutina", "Empezar entrenamiento" e "Historial / Progreso" muestran "Próximamente".
- Las rutinas predeterminadas están en la constante `RUTINAS_PREDETERMINADAS` del código (provisionales, solo nombres de ejercicios) y **nunca** se guardan en `localStorage`, para poder cambiarlas sin afectar a los datos de cada persona.
- Las rutinas propias se leen de `localStorage` con la clave `"misRutinas"` (lista de `{ id, nombre, ejercicios }`). Todavía no se pueden crear. (Una versión anterior usaba la clave `"ejercicios"`; ese código se quitó.)
