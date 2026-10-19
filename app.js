// ============================================================
// LÓGICA DE LA APP
// Los datos fijos están en ejercicios.js y rutinas-predeterminadas.js.
// El aspecto (colores, tamaños) está en estilos.css.
// ============================================================


// ============================================================
// GUARDAR Y LEER DATOS EN EL NAVEGADOR
// Lo que crea cada persona se guarda en el navegador (localStorage),
// separado de los datos fijos del código.
// ============================================================
const CLAVE_MIS_RUTINAS = "misRutinas";
const CLAVE_MIS_EJERCICIOS = "misEjercicios";

// Lee una lista guardada en el navegador (o una lista vacía si no hay)
function leerLista(clave) {
  try {
    const guardada = localStorage.getItem(clave);
    const lista = guardada ? JSON.parse(guardada) : [];
    return Array.isArray(lista) ? lista : [];
  } catch (error) {
    return [];
  }
}

// Guarda una lista en el navegador. Devuelve false si el navegador no deja guardar.
function guardarLista(clave, lista) {
  try {
    localStorage.setItem(clave, JSON.stringify(lista));
    return true;
  } catch (error) {
    return false;
  }
}


// ============================================================
// EJERCICIOS
// ============================================================
const NOMBRES_MEDICION = {
  "peso": "Peso",
  "peso-corporal": "Peso corporal",
  "tiempo": "Tiempo"
};

// Todos los ejercicios: los de la lista inicial y los creados por la persona
function todosLosEjercicios() {
  return EJERCICIOS_BASE.concat(leerLista(CLAVE_MIS_EJERCICIOS));
}

function buscarEjercicio(id) {
  return todosLosEjercicios().find(function (ejercicio) {
    return ejercicio.id === id;
  });
}

function nombreDeEjercicio(id) {
  const ejercicio = buscarEjercicio(id);
  return ejercicio ? ejercicio.nombre : "Ejercicio no encontrado";
}

// Pasa un texto a minúsculas y sin tildes, para comparar sin fallos.
// Así "jalon" encuentra "Jalón".
function normalizar(texto) {
  return texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}


// ============================================================
// RUTINAS
// ============================================================

// Busca una rutina por su tipo ("predeterminada" o "mia") y su id
function buscarRutina(tipo, id) {
  const lista = tipo === "predeterminada" ? RUTINAS_PREDETERMINADAS : leerLista(CLAVE_MIS_RUTINAS);
  return lista.find(function (rutina) {
    return rutina.id === id;
  });
}

// Texto con el número de ejercicios: "1 ejercicio", "5 ejercicios"...
function textoCantidad(rutina) {
  const cantidad = rutina.ejercicios.length;
  return cantidad === 1 ? "1 ejercicio" : cantidad + " ejercicios";
}

// Crea una tarjeta con un título, un texto debajo y algo a la derecha
function crearTarjeta(titulo, subtitulo, derecha) {
  const tarjeta = document.createElement("button");
  tarjeta.className = "tarjeta";

  const textos = document.createElement("span");
  const nombre = document.createElement("span");
  nombre.className = "tarjeta-nombre";
  nombre.textContent = titulo;
  const debajo = document.createElement("span");
  debajo.className = "tarjeta-cantidad";
  debajo.textContent = subtitulo;
  textos.appendChild(nombre);
  textos.appendChild(debajo);

  tarjeta.appendChild(textos);
  tarjeta.appendChild(derecha);
  return tarjeta;
}

function crearFlecha() {
  const flecha = document.createElement("span");
  flecha.className = "tarjeta-flecha";
  flecha.textContent = "›";
  return flecha;
}

// Tarjeta de una rutina. Al pulsarla, abre su detalle.
function crearTarjetaRutina(rutina, tipo) {
  const tarjeta = crearTarjeta(rutina.nombre, textoCantidad(rutina), crearFlecha());
  tarjeta.addEventListener("click", function () {
    irA(tipo + "-" + rutina.id);
  });
  return tarjeta;
}

// Rellena la pantalla de rutinas con las tarjetas
function pintarRutinas() {
  const listaPredeterminadas = document.getElementById("lista-predeterminadas");
  listaPredeterminadas.innerHTML = "";
  RUTINAS_PREDETERMINADAS.forEach(function (rutina) {
    listaPredeterminadas.appendChild(crearTarjetaRutina(rutina, "predeterminada"));
  });

  const misRutinas = leerLista(CLAVE_MIS_RUTINAS);
  const listaMisRutinas = document.getElementById("lista-mis-rutinas");
  listaMisRutinas.innerHTML = "";
  misRutinas.forEach(function (rutina) {
    listaMisRutinas.appendChild(crearTarjetaRutina(rutina, "mia"));
  });
  document.getElementById("mis-rutinas-vacio").hidden = misRutinas.length > 0;
}

// La rutina que se está viendo en la pantalla de detalle
let rutinaEnDetalle = null;

// Rellena la pantalla de detalle con el nombre y los ejercicios de una rutina.
// "Editar" y "Borrar" solo aparecen en las rutinas propias.
function pintarDetalle(rutina, tipo) {
  rutinaEnDetalle = rutina;

  document.getElementById("detalle-nombre").textContent = rutina.nombre;
  const lista = document.getElementById("detalle-ejercicios");
  lista.innerHTML = "";
  rutina.ejercicios.forEach(function (id) {
    const elemento = document.createElement("li");
    elemento.textContent = nombreDeEjercicio(id);
    lista.appendChild(elemento);
  });

  document.getElementById("acciones-rutina").hidden = tipo !== "mia";
  document.getElementById("error-detalle").hidden = true;
}

document.getElementById("boton-editar-rutina").addEventListener("click", function () {
  empezarEdicion(rutinaEnDetalle);
  irA("editar-mia-" + rutinaEnDetalle.id);
});

// "Borrar" pregunta antes de eliminar la rutina
document.getElementById("boton-borrar-rutina").addEventListener("click", function () {
  const seguro = confirm("¿Seguro que quieres borrar la rutina «" + rutinaEnDetalle.nombre + "»? No se puede deshacer.");
  if (!seguro) {
    return;
  }

  const misRutinas = leerLista(CLAVE_MIS_RUTINAS).filter(function (rutina) {
    return rutina.id !== rutinaEnDetalle.id;
  });

  if (!guardarLista(CLAVE_MIS_RUTINAS, misRutinas)) {
    mostrarError(document.getElementById("error-detalle"), "No se ha podido borrar. Puede que tu navegador no permita guardar datos.");
    return;
  }

  volver(); // De vuelta a "Rutinas", donde ya no aparece
});


// ============================================================
// CREAR Y EDITAR RUTINA
// Las dos cosas usan la misma pantalla y el mismo código.
// Mientras se prepara, la rutina vive solo aquí (en memoria).
// Se guarda en el navegador al pulsar "Guardar".
// ============================================================
let ejerciciosNuevaRutina = []; // ids de los ejercicios añadidos, en orden
let idRutinaEnEdicion = null;   // null = rutina nueva; si no, el id de la rutina que se edita

const campoNombreRutina = document.getElementById("nombre-rutina");
const errorRutina = document.getElementById("error-rutina");

function mostrarError(elemento, mensaje) {
  elemento.textContent = mensaje;
  elemento.hidden = false;
}

// Deja la pantalla en blanco, para crear una rutina nueva
function empezarRutinaNueva() {
  idRutinaEnEdicion = null;
  ejerciciosNuevaRutina = [];
  campoNombreRutina.value = "";
  errorRutina.hidden = true;
}

// Carga en la pantalla los datos de una rutina que ya existe, para editarla
function empezarEdicion(rutina) {
  idRutinaEnEdicion = rutina.id;
  ejerciciosNuevaRutina = rutina.ejercicios.slice(); // una copia: no se toca la original hasta guardar
  campoNombreRutina.value = rutina.nombre;
  errorRutina.hidden = true;
}

// Cambia de sitio dos ejercicios de la lista
function intercambiar(posicionA, posicionB) {
  const guardado = ejerciciosNuevaRutina[posicionA];
  ejerciciosNuevaRutina[posicionA] = ejerciciosNuevaRutina[posicionB];
  ejerciciosNuevaRutina[posicionB] = guardado;
  pintarCrearRutina();
}

function crearBotonPequeno(clase, texto, descripcion, alPulsar) {
  const boton = document.createElement("button");
  boton.className = clase;
  boton.textContent = texto;
  boton.setAttribute("aria-label", descripcion);
  boton.addEventListener("click", alPulsar);
  return boton;
}

// Muestra los ejercicios añadidos, cada uno con sus botones subir, bajar y quitar
function pintarCrearRutina() {
  document.getElementById("titulo-crear-rutina").textContent =
    idRutinaEnEdicion ? "Editar rutina" : "Crear rutina";

  const lista = document.getElementById("ejercicios-nueva-rutina");
  lista.innerHTML = "";
  const ultima = ejerciciosNuevaRutina.length - 1;

  ejerciciosNuevaRutina.forEach(function (id, posicion) {
    const elemento = document.createElement("li");

    const nombre = document.createElement("span");
    nombre.className = "ejercicio-nombre";
    nombre.textContent = nombreDeEjercicio(id);

    const controles = document.createElement("span");
    controles.className = "controles-ejercicio";

    const subir = crearBotonPequeno("boton-mover", "↑", "Subir", function () {
      intercambiar(posicion, posicion - 1);
    });
    subir.disabled = posicion === 0;

    const bajar = crearBotonPequeno("boton-mover", "↓", "Bajar", function () {
      intercambiar(posicion, posicion + 1);
    });
    bajar.disabled = posicion === ultima;

    const quitar = crearBotonPequeno("boton-quitar", "Quitar", "Quitar", function () {
      ejerciciosNuevaRutina.splice(posicion, 1);
      pintarCrearRutina();
    });

    controles.appendChild(subir);
    controles.appendChild(bajar);
    controles.appendChild(quitar);
    elemento.appendChild(nombre);
    elemento.appendChild(controles);
    lista.appendChild(elemento);
  });

  document.getElementById("nueva-rutina-vacio").hidden = ejerciciosNuevaRutina.length > 0;
  document.getElementById("opciones-anadir").hidden = true;
}

// Al entrar en "Crear rutina": si quedaba a medias una edición, se descarta
function abrirCrearRutina() {
  if (idRutinaEnEdicion !== null) {
    empezarRutinaNueva();
  }
  pintarCrearRutina();
}

// Guarda la rutina, tanto si es nueva como si se está editando
function guardarRutina() {
  const nombre = campoNombreRutina.value.trim();

  if (nombre === "") {
    mostrarError(errorRutina, "Escribe un nombre para la rutina.");
    return;
  }
  if (ejerciciosNuevaRutina.length === 0) {
    mostrarError(errorRutina, "Añade al menos un ejercicio.");
    return;
  }

  const rutina = {
    id: idRutinaEnEdicion || "r" + Date.now(),
    nombre: nombre,
    ejercicios: ejerciciosNuevaRutina.slice()
  };

  const misRutinas = leerLista(CLAVE_MIS_RUTINAS);
  const posicion = misRutinas.findIndex(function (guardada) {
    return guardada.id === rutina.id;
  });

  if (posicion >= 0) {
    misRutinas[posicion] = rutina; // Ya existía: se reemplaza
  } else {
    misRutinas.push(rutina);       // Es nueva: se añade al final
  }

  if (!guardarLista(CLAVE_MIS_RUTINAS, misRutinas)) {
    mostrarError(errorRutina, "No se ha podido guardar. Puede que tu navegador no permita guardar datos.");
    return;
  }

  empezarRutinaNueva();
  volver(); // De vuelta a la pantalla anterior ("Rutinas" o el detalle), ya actualizada
}

document.getElementById("boton-crear-rutina").addEventListener("click", function () {
  empezarRutinaNueva();
  irA("crear-rutina");
});

// "Añadir ejercicio" muestra u oculta las dos opciones
document.getElementById("boton-anadir-ejercicio").addEventListener("click", function () {
  const opciones = document.getElementById("opciones-anadir");
  opciones.hidden = !opciones.hidden;
});

campoNombreRutina.addEventListener("input", function () {
  errorRutina.hidden = true;
});

document.getElementById("boton-guardar-rutina").addEventListener("click", guardarRutina);


// ============================================================
// BUSCAR EJERCICIO
// ============================================================
const campoBuscar = document.getElementById("campo-buscar");

// Muestra los ejercicios cuyo nombre o grupo muscular contiene lo escrito
function pintarResultados() {
  const texto = normalizar(campoBuscar.value);
  const resultados = document.getElementById("resultados-busqueda");
  resultados.innerHTML = "";

  const encontrados = todosLosEjercicios()
    .filter(function (ejercicio) {
      return normalizar(ejercicio.nombre).includes(texto) || normalizar(ejercicio.grupo).includes(texto);
    })
    .sort(function (a, b) {
      return a.nombre.localeCompare(b.nombre, "es");
    });

  encontrados.forEach(function (ejercicio) {
    const yaAnadido = ejerciciosNuevaRutina.includes(ejercicio.id);
    const derecha = yaAnadido ? document.createElement("span") : crearFlecha();
    if (yaAnadido) {
      derecha.className = "tarjeta-marca";
      derecha.textContent = "Añadido";
    }

    const subtitulo = ejercicio.grupo + " · " + NOMBRES_MEDICION[ejercicio.medicion];
    const tarjeta = crearTarjeta(ejercicio.nombre, subtitulo, derecha);
    tarjeta.disabled = yaAnadido;
    tarjeta.addEventListener("click", function () {
      if (ejerciciosNuevaRutina.includes(ejercicio.id)) {
        return; // Evita añadirlo dos veces con un doble toque
      }
      ejerciciosNuevaRutina.push(ejercicio.id);
      volver(); // De vuelta a "Crear rutina"
    });
    resultados.appendChild(tarjeta);
  });

  document.getElementById("busqueda-vacia").hidden = encontrados.length > 0;
}

// Al entrar en el buscador: campo vacío, lista completa y teclado listo
function abrirBuscador() {
  campoBuscar.value = "";
  pintarResultados();
  campoBuscar.focus();
}

campoBuscar.addEventListener("input", pintarResultados);


// ============================================================
// CREAR EJERCICIO
// ============================================================
const formularioEjercicio = document.getElementById("formulario-ejercicio");
const campoNombreEjercicio = document.getElementById("nombre-ejercicio");
const errorEjercicio = document.getElementById("error-ejercicio");

// Al entrar en "Crear ejercicio": formulario en blanco
function abrirNuevoEjercicio() {
  formularioEjercicio.reset();
  errorEjercicio.hidden = true;
  campoNombreEjercicio.focus();
}

formularioEjercicio.addEventListener("submit", function (evento) {
  evento.preventDefault();

  const nombre = campoNombreEjercicio.value.trim();
  const medicion = formularioEjercicio.elements.medicion.value;

  if (nombre === "") {
    mostrarError(errorEjercicio, "Escribe un nombre para el ejercicio.");
    return;
  }

  const repetido = todosLosEjercicios().some(function (ejercicio) {
    return normalizar(ejercicio.nombre) === normalizar(nombre);
  });
  if (repetido) {
    mostrarError(errorEjercicio, "Ya existe un ejercicio con ese nombre. Búscalo en la lista.");
    return;
  }

  const nuevo = {
    id: "e" + Date.now(),
    nombre: nombre,
    grupo: "Mis ejercicios",
    medicion: medicion
  };

  const misEjercicios = leerLista(CLAVE_MIS_EJERCICIOS);
  misEjercicios.push(nuevo);
  if (!guardarLista(CLAVE_MIS_EJERCICIOS, misEjercicios)) {
    mostrarError(errorEjercicio, "No se ha podido guardar. Puede que tu navegador no permita guardar datos.");
    return;
  }

  ejerciciosNuevaRutina.push(nuevo.id);
  volver(); // De vuelta a "Crear rutina"
});

campoNombreEjercicio.addEventListener("input", function () {
  errorEjercicio.hidden = true;
});


// ============================================================
// NAVEGACIÓN ENTRE PANTALLAS
// Cada pantalla tiene un nombre corto, que es el que aparece al final
// de la dirección de la página (por ejemplo: index.html#rutinas).
//   - id: la <section> del HTML que se muestra
//   - padre: la pantalla a la que lleva "Volver" si se abrió la página
//            directamente en esta pantalla
//   - alEntrar: lo que hay que preparar cada vez que se muestra
// ============================================================
const PANTALLAS = {
  inicio: { id: "pantalla-inicio" },
  rutinas: { id: "pantalla-rutinas", padre: "inicio", alEntrar: pintarRutinas },
  "crear-rutina": { id: "pantalla-crear-rutina", padre: "rutinas", alEntrar: abrirCrearRutina },
  "buscar-ejercicio": { id: "pantalla-buscar-ejercicio", padre: "crear-rutina", alEntrar: abrirBuscador },
  "nuevo-ejercicio": { id: "pantalla-nuevo-ejercicio", padre: "crear-rutina", alEntrar: abrirNuevoEjercicio },
  entrenar: { id: "pantalla-proximamente", titulo: "Empezar entrenamiento", padre: "inicio" },
  historial: { id: "pantalla-proximamente", titulo: "Historial / Progreso", padre: "inicio" }
};

// Averigua qué pantalla toca según la dirección.
// Las rutinas usan nombres como "predeterminada-cuerpo-completo-a" o "mia-r123",
// y la edición de una rutina propia, "editar-mia-r123".
function pantallaActual() {
  const nombre = location.hash.slice(1);

  const edicion = nombre.match(/^editar-mia-(.+)$/);
  if (edicion) {
    const rutina = buscarRutina("mia", edicion[1]);
    if (rutina) {
      return {
        id: "pantalla-crear-rutina",
        padre: "mia-" + rutina.id,
        alEntrar: function () {
          // Si se ha recargado la página, los datos aún no están cargados
          if (idRutinaEnEdicion !== rutina.id) {
            empezarEdicion(rutina);
          }
          pintarCrearRutina();
        }
      };
    }
    return PANTALLAS.rutinas;
  }

  const partes = nombre.match(/^(predeterminada|mia)-(.+)$/);
  if (partes) {
    const rutina = buscarRutina(partes[1], partes[2]);
    if (rutina) {
      return {
        id: "pantalla-detalle",
        padre: "rutinas",
        alEntrar: function () {
          pintarDetalle(rutina, partes[1]);
        }
      };
    }
    return PANTALLAS.rutinas;
  }

  return PANTALLAS[nombre] || PANTALLAS.inicio;
}

// Muestra la pantalla que indica la dirección y oculta las demás
function mostrarPantallaActual() {
  const pantalla = pantallaActual();

  if (pantalla.titulo) {
    document.getElementById("titulo-proximamente").textContent = pantalla.titulo;
  }

  document.querySelectorAll(".pantalla").forEach(function (seccion) {
    seccion.hidden = seccion.id !== pantalla.id;
  });

  window.scrollTo(0, 0);

  if (pantalla.alEntrar) {
    pantalla.alEntrar();
  }
}

// Va a otra pantalla. Se apunta en el historial del navegador que
// hemos llegado desde dentro de la app, para que "Volver" sepa qué hacer.
function irA(nombre) {
  history.pushState({ dentroDeLaApp: true }, "", "#" + nombre);
  mostrarPantallaActual();
}

// Botón "Volver": si llegamos desde la app, hace lo mismo que la flecha
// de atrás del navegador. Si se abrió la página directamente en esta
// pantalla, va a su pantalla "padre".
function volver() {
  if (history.state && history.state.dentroDeLaApp) {
    history.back();
  } else {
    history.replaceState(null, "", "#" + pantallaActual().padre);
    mostrarPantallaActual();
  }
}

document.querySelectorAll("[data-ir-a]").forEach(function (boton) {
  boton.addEventListener("click", function () {
    irA(boton.dataset.irA);
  });
});

document.querySelectorAll(".boton-volver").forEach(function (boton) {
  boton.addEventListener("click", volver);
});

// Cuando se usa la flecha de atrás (o adelante) del navegador
window.addEventListener("popstate", mostrarPantallaActual);

mostrarPantallaActual();
