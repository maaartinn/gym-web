// ============================================================
// LÓGICA DE LA APP
// Los datos fijos están en ejercicios.js y rutinas-predeterminadas.js.
// El aspecto (colores, tamaños) está en estilos.css.
// ============================================================


// ============================================================
// GUARDAR Y LEER DATOS EN EL NAVEGADOR
// Lo que crea cada persona se guarda en el navegador (localStorage),
// separado de los datos fijos del código.
//
// Cada dato se guarda junto con el número de versión de su formato:
//   { version: 1, datos: [...] }
// Si algún día cambia la forma de los datos, se sube VERSION_DATOS y se
// añade en actualizarFormato() el paso que convierte lo antiguo en lo
// nuevo. Así no se pierde nada de lo que ya tenga guardado cada persona.
// ============================================================
const VERSION_DATOS = 3;

const CLAVE_MIS_RUTINAS = "misRutinas";
const CLAVE_MIS_EJERCICIOS = "misEjercicios";
const CLAVE_ENTRENAMIENTOS = "entrenamientos";
const CLAVE_ENTRENAMIENTO_EN_CURSO = "entrenamientoEnCurso";

// Convierte unos datos guardados con un formato antiguo al formato actual,
// paso a paso: de la versión 0 a la 1, de la 1 a la 2...
// "clave" dice qué dato es, por si un cambio solo afecta a uno.
function actualizarFormato(clave, version, datos) {
  // Versión 0: antes de que hubiera número de versión, las listas se
  // guardaban tal cual. Su contenido es igual que en la versión 1.
  if (version === 0) {
    version = 1;
  }

  // De la versión 1 a la 2: cada ejercicio de un entrenamiento (guardado
  // o en curso) tiene una nota. Los antiguos no tenían: se les pone una
  // nota vacía. Si ya tienen una (por ejemplo, guardada por una versión
  // vieja de la app abierta en otro momento), se respeta.
  if (version === 1) {
    if (clave === CLAVE_ENTRENAMIENTOS && Array.isArray(datos)) {
      datos.forEach(anadirNotasVacias);
    }
    if (clave === CLAVE_ENTRENAMIENTO_EN_CURSO && datos) {
      anadirNotasVacias(datos);
    }
    version = 2;
  }

  // De la versión 2 a la 3: cada entrenamiento guardado tiene su duración
  // en segundos (duracion). Los antiguos no la tenían, pero sí la hora de
  // inicio y la de fin (fecha), así que se calcula con ellas. Si no se
  // puede calcular, se queda en null (y no se muestra). Si ya tienen una,
  // se respeta.
  if (version === 2) {
    if (clave === CLAVE_ENTRENAMIENTOS && Array.isArray(datos)) {
      datos.forEach(anadirDuracion);
    }
    version = 3;
  }

  // Cuando exista la versión 4, aquí irá algo así:
  // if (version === 3) {
  //   datos = ...convertir los datos...;
  //   version = 4;
  // }

  return datos;
}

// Pone nota: "" a los ejercicios de un entrenamiento que no tengan nota
function anadirNotasVacias(entrenamiento) {
  if (!entrenamiento || !Array.isArray(entrenamiento.ejercicios)) {
    return;
  }
  entrenamiento.ejercicios.forEach(function (ejercicio) {
    if (ejercicio && typeof ejercicio.nota !== "string") {
      ejercicio.nota = "";
    }
  });
}

// Pone a un entrenamiento guardado antiguo su duración, calculada con la
// hora de inicio y la de fin. null si falta alguna o no tiene sentido.
function anadirDuracion(entrenamiento) {
  if (!entrenamiento || typeof entrenamiento.duracion === "number") {
    return;
  }
  const milisegundos = Date.parse(entrenamiento.fecha) - Date.parse(entrenamiento.inicio);
  entrenamiento.duracion = milisegundos >= 0 ? Math.round(milisegundos / 1000) : null; // NaN >= 0 es false
}

// Lee un dato guardado en el navegador, ya en el formato actual.
// Devuelve null si no hay nada o no se puede leer.
function leerDatos(clave) {
  try {
    const texto = localStorage.getItem(clave);
    if (!texto) {
      return null;
    }
    const guardado = JSON.parse(texto);
    if (Array.isArray(guardado)) {
      return actualizarFormato(clave, 0, guardado); // Formato antiguo, sin versión
    }
    if (guardado && typeof guardado.version === "number") {
      return actualizarFormato(clave, guardado.version, guardado.datos);
    }
    return null;
  } catch (error) {
    return null;
  }
}

// Guarda un dato en el navegador, con el número de versión actual.
// Devuelve false si el navegador no deja guardar.
function guardarDatos(clave, datos) {
  try {
    localStorage.setItem(clave, JSON.stringify({ version: VERSION_DATOS, datos: datos }));
    return true;
  } catch (error) {
    return false;
  }
}

function borrarDatos(clave) {
  try {
    localStorage.removeItem(clave);
  } catch (error) {
    // Si no se puede borrar, no pasa nada grave: se ignora
  }
}

// Lee una lista guardada en el navegador (o una lista vacía si no hay)
function leerLista(clave) {
  const lista = leerDatos(clave);
  return Array.isArray(lista) ? lista : [];
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

// Los ejercicios que salen en el buscador. Si la persona creó un ejercicio
// propio con el mismo nombre que uno de la lista inicial (por ejemplo,
// porque se añadió a la lista después), solo sale el suyo: así no aparece
// repetido y sigue usando el mismo de siempre, con su historial.
function ejerciciosDelBuscador() {
  const misEjercicios = leerLista(CLAVE_MIS_EJERCICIOS);
  const nombresPropios = misEjercicios.map(function (ejercicio) {
    return normalizar(ejercicio.nombre);
  });
  return EJERCICIOS_BASE
    .filter(function (ejercicio) {
      return !nombresPropios.includes(normalizar(ejercicio.nombre));
    })
    .concat(misEjercicios);
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

// Guarda una rutina propia en el navegador. Es el único sitio que lo hace.
// Si ya existe una con el mismo id, la reemplaza; si no, la añade al final.
// Devuelve false si el navegador no deja guardar.
function guardarEnMisRutinas(rutina) {
  const misRutinas = leerLista(CLAVE_MIS_RUTINAS);
  const posicion = misRutinas.findIndex(function (guardada) {
    return guardada.id === rutina.id;
  });

  if (posicion >= 0) {
    misRutinas[posicion] = rutina; // Ya existía: se reemplaza
  } else {
    misRutinas.push(rutina);       // Es nueva: se añade al final
  }

  return guardarDatos(CLAVE_MIS_RUTINAS, misRutinas);
}

// Un id nuevo para una rutina propia
function nuevoIdRutina() {
  return "r" + Date.now();
}

// Nombre para la copia de una rutina, sin repetir uno que ya exista en "Mis rutinas":
// "Tren superior (copia)", "Tren superior (copia 2)", "Tren superior (copia 3)"...
function nombreParaCopia(nombreOriginal) {
  const nombresUsados = leerLista(CLAVE_MIS_RUTINAS).map(function (rutina) {
    return normalizar(rutina.nombre);
  });

  let nombre = nombreOriginal + " (copia)";
  let numero = 2;
  while (nombresUsados.includes(normalizar(nombre))) {
    nombre = nombreOriginal + " (copia " + numero + ")";
    numero++;
  }
  return nombre;
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

// Rellena una lista con una tarjeta por rutina.
// Al pulsar una tarjeta, se llama a alElegir con esa rutina.
function pintarListaRutinas(idLista, rutinas, alElegir) {
  const lista = document.getElementById(idLista);
  lista.innerHTML = "";
  rutinas.forEach(function (rutina) {
    const tarjeta = crearTarjeta(rutina.nombre, textoCantidad(rutina), crearFlecha());
    tarjeta.addEventListener("click", function () {
      alElegir(rutina);
    });
    lista.appendChild(tarjeta);
  });
}

// Rellena la pantalla de rutinas con las tarjetas. Al pulsar una, se abre su detalle.
function pintarRutinas() {
  pintarListaRutinas("lista-predeterminadas", RUTINAS_PREDETERMINADAS, function (rutina) {
    irA("predeterminada-" + rutina.id);
  });

  const misRutinas = leerLista(CLAVE_MIS_RUTINAS);
  pintarListaRutinas("lista-mis-rutinas", misRutinas, function (rutina) {
    irA("mia-" + rutina.id);
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

  document.getElementById("boton-copiar-rutina").hidden = tipo !== "predeterminada";
  document.getElementById("acciones-rutina").hidden = tipo !== "mia";
  document.getElementById("error-detalle").hidden = true;
}

// "Copiar a mis rutinas": crea una rutina propia nueva con los mismos ejercicios.
// La copia es independiente: tiene su propio id y su propia lista de ejercicios,
// así que editarla o borrarla no toca la original (que vive en el código).
document.getElementById("boton-copiar-rutina").addEventListener("click", function () {
  const copia = {
    id: nuevoIdRutina(),
    nombre: nombreParaCopia(rutinaEnDetalle.nombre),
    ejercicios: rutinaEnDetalle.ejercicios.slice()
  };

  if (!guardarEnMisRutinas(copia)) {
    mostrarError(document.getElementById("error-detalle"), "No se ha podido copiar. Puede que tu navegador no permita guardar datos.");
    return;
  }

  mostrarAvisoBreve("Copiada a «Mis rutinas»");

  // Se sustituye esta pantalla por el detalle de la copia, en vez de añadir
  // una más: así "Volver" lleva a "Rutinas", donde ya aparece la copia.
  history.replaceState(history.state, "", "#mia-" + copia.id);
  mostrarPantallaActual();
});

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

  if (!guardarDatos(CLAVE_MIS_RUTINAS, misRutinas)) {
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

// Muestra un aviso abajo durante unos segundos
let temporizadorAviso = null;
function mostrarAvisoBreve(mensaje) {
  const aviso = document.getElementById("aviso-flotante");
  aviso.textContent = mensaje;
  aviso.hidden = false;
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(function () {
    aviso.hidden = true;
  }, 2500);
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
    id: idRutinaEnEdicion || nuevoIdRutina(),
    nombre: nombre,
    ejercicios: ejerciciosNuevaRutina.slice()
  };

  if (!guardarEnMisRutinas(rutina)) {
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
// ¿PARA QUÉ SE ELIGE UN EJERCICIO?
// El buscador y "Crear ejercicio" sirven para tres cosas:
//   { modo: "rutina" }                 → añadirlo a la rutina que se prepara
//   { modo: "anadir" }                 → añadirlo al final del entrenamiento en curso
//   { modo: "reemplazar", numero: 2 }  → ponerlo en lugar del 2.º ejercicio del entrenamiento
// Los dos últimos van en la dirección (por ejemplo,
// #entrenamiento-reemplazar-buscar-2), así que no se pierden al recargar.
// ============================================================
let destinoEjercicio = { modo: "rutina" };

// El ejercicio del entrenamiento que se va a reemplazar (o undefined si no hay)
function ejercicioAReemplazar() {
  return entrenamientoEnCurso ? entrenamientoEnCurso.ejercicios[destinoEjercicio.numero - 1] : undefined;
}

// Si un ejercicio ya está en la rutina o en el entrenamiento, según el destino
function yaElegido(idEjercicio) {
  if (destinoEjercicio.modo === "rutina") {
    return ejerciciosNuevaRutina.includes(idEjercicio);
  }
  return Boolean(entrenamientoEnCurso) && entrenamientoEnCurso.ejercicios.some(function (ejercicio) {
    return ejercicio.id === idEjercicio;
  });
}

// Usa el ejercicio elegido en el buscador (o recién creado) y vuelve atrás
function usarEjercicio(ejercicio) {
  if (destinoEjercicio.modo === "rutina") {
    ejerciciosNuevaRutina.push(ejercicio.id);
  } else if (entrenamientoEnCurso) {
    ponerEnEntrenamiento(ejercicio);
  }
  volver(); // De vuelta a "Crear rutina" o al entrenamiento
}

// La dirección de "Crear ejercicio" para el destino actual
function direccionCrear() {
  if (destinoEjercicio.modo === "anadir") {
    return "entrenamiento-anadir-crear";
  }
  if (destinoEjercicio.modo === "reemplazar") {
    return "entrenamiento-reemplazar-crear-" + destinoEjercicio.numero;
  }
  return "nuevo-ejercicio";
}


// ============================================================
// BUSCAR EJERCICIO
// ============================================================
const campoBuscar = document.getElementById("campo-buscar");

// Muestra los ejercicios cuyo nombre o grupo muscular contiene lo escrito
function pintarResultados() {
  const texto = normalizar(campoBuscar.value);
  const resultados = document.getElementById("resultados-busqueda");
  resultados.innerHTML = "";

  const encontrados = ejerciciosDelBuscador()
    .filter(function (ejercicio) {
      return normalizar(ejercicio.nombre).includes(texto) || normalizar(ejercicio.grupo).includes(texto);
    })
    .sort(function (a, b) {
      return a.nombre.localeCompare(b.nombre, "es");
    });

  encontrados.forEach(function (ejercicio) {
    const yaAnadido = yaElegido(ejercicio.id);
    const derecha = yaAnadido ? document.createElement("span") : crearFlecha();
    if (yaAnadido) {
      derecha.className = "tarjeta-marca";
      derecha.textContent = destinoEjercicio.modo === "rutina" ? "Añadido" : "Ya está";
    }

    const subtitulo = ejercicio.grupo + " · " + NOMBRES_MEDICION[ejercicio.medicion];
    const tarjeta = crearTarjeta(ejercicio.nombre, subtitulo, derecha);
    tarjeta.disabled = yaAnadido;
    tarjeta.addEventListener("click", function () {
      if (yaElegido(ejercicio.id)) {
        return; // Evita añadirlo dos veces con un doble toque
      }
      usarEjercicio(ejercicio);
    });
    resultados.appendChild(tarjeta);
  });

  document.getElementById("busqueda-vacia").hidden = encontrados.length > 0;
}

// Al entrar en el buscador: campo vacío, lista completa y teclado listo
function abrirBuscador(destino) {
  destinoEjercicio = destino;
  document.getElementById("titulo-buscar").textContent =
    destino.modo === "reemplazar" ? "Reemplazar «" + ejercicioAReemplazar().nombre + "»" : "Buscar ejercicio";
  campoBuscar.value = "";
  pintarResultados();
  campoBuscar.focus();
}

campoBuscar.addEventListener("input", pintarResultados);

// "¿No está? Crear ejercicio": se sustituye el buscador por "Crear ejercicio"
// (con lo que se había escrito ya puesto como nombre). Así, al crearlo,
// "Volver" lleva directamente a la rutina o al entrenamiento.
let nombrePropuesto = "";
document.getElementById("boton-buscar-crear").addEventListener("click", function () {
  nombrePropuesto = campoBuscar.value.trim();
  history.replaceState(history.state, "", "#" + direccionCrear());
  mostrarPantallaActual();
});


// ============================================================
// CREAR EJERCICIO
// ============================================================
const formularioEjercicio = document.getElementById("formulario-ejercicio");
const campoNombreEjercicio = document.getElementById("nombre-ejercicio");
const errorEjercicio = document.getElementById("error-ejercicio");

// Al entrar en "Crear ejercicio": formulario en blanco (o con el nombre
// que se había escrito en el buscador) y el botón según el destino
function abrirNuevoEjercicio(destino) {
  destinoEjercicio = destino;
  formularioEjercicio.reset();
  campoNombreEjercicio.value = nombrePropuesto;
  nombrePropuesto = "";
  errorEjercicio.hidden = true;

  let textoBoton = "Crear y añadir a la rutina";
  if (destino.modo === "anadir") {
    textoBoton = "Crear y añadir al entrenamiento";
  } else if (destino.modo === "reemplazar") {
    textoBoton = "Crear y poner en lugar de «" + ejercicioAReemplazar().nombre + "»";
  }
  document.getElementById("boton-crear-ejercicio").textContent = textoBoton;

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
  if (!guardarDatos(CLAVE_MIS_EJERCICIOS, misEjercicios)) {
    mostrarError(errorEjercicio, "No se ha podido guardar. Puede que tu navegador no permita guardar datos.");
    return;
  }

  usarEjercicio(nuevo);
});

campoNombreEjercicio.addEventListener("input", function () {
  errorEjercicio.hidden = true;
});


// ============================================================
// ENTRENAMIENTO EN CURSO
// Se guarda en el navegador cada vez que se cambia algo, para no
// perderlo si se recarga o se cierra la página.
// Mientras se entrena, cada serie guarda los textos tal cual se escriben.
// Al terminar, se pasan a números y se guardan solo las series hechas.
// ============================================================

// Los campos de cada serie, según cómo se mide el ejercicio
//   - decimales: si admite decimales (por ejemplo, 12,5 kg)
//   - puedeSerCero: si vale 0 (0 kg tiene sentido; 0 repeticiones, no)
const CAMPOS_SERIE = {
  "peso": [
    { nombre: "kg", titulo: "kg", decimales: true, puedeSerCero: true },
    { nombre: "reps", titulo: "Reps", decimales: false, puedeSerCero: false }
  ],
  "peso-corporal": [
    { nombre: "reps", titulo: "Reps", decimales: false, puedeSerCero: false }
  ],
  "tiempo": [
    { nombre: "segundos", titulo: "Segundos", decimales: false, puedeSerCero: false }
  ]
};

const SERIES_POR_DEFECTO = 3;

let entrenamientoEnCurso = leerEntrenamientoEnCurso();

function leerEntrenamientoEnCurso() {
  const guardado = leerDatos(CLAVE_ENTRENAMIENTO_EN_CURSO);
  return guardado && Array.isArray(guardado.ejercicios) ? guardado : null;
}

function camposDe(medicion) {
  return CAMPOS_SERIE[medicion] || CAMPOS_SERIE.peso;
}

// Una serie sin rellenar, con los campos que tocan: { hecha: false, kg: "", reps: "" }
function serieVacia(medicion) {
  const serie = { hecha: false };
  camposDe(medicion).forEach(function (campo) {
    serie[campo.nombre] = "";
  });
  return serie;
}

// Guarda el entrenamiento en curso. Si el navegador no deja, lo avisa en pantalla.
function guardarEntrenamientoEnCurso() {
  const guardado = guardarDatos(CLAVE_ENTRENAMIENTO_EN_CURSO, entrenamientoEnCurso);
  document.getElementById("error-autoguardado").hidden = guardado;
}

function descartarEntrenamientoEnCurso() {
  entrenamientoEnCurso = null;
  borrarDatos(CLAVE_ENTRENAMIENTO_EN_CURSO);
}

// 12.5 → "12,5"
function formatoNumero(numero) {
  return String(numero).replace(".", ",");
}

// Pasa un texto escrito a número: "12,5" → 12.5. Si no es un número válido, devuelve null.
function leerNumero(texto, decimales) {
  const limpio = texto.trim().replace(",", ".");
  const formato = decimales ? /^\d+(\.\d+)?$/ : /^\d+$/;
  return formato.test(limpio) ? Number(limpio) : null;
}

// Texto de una serie guardada: "40 kg x 10", "12 repeticiones", "30 segundos"
function textoSerie(serie, medicion) {
  if (medicion === "peso-corporal") {
    return serie.reps === 1 ? "1 repetición" : serie.reps + " repeticiones";
  }
  if (medicion === "tiempo") {
    return serie.segundos === 1 ? "1 segundo" : serie.segundos + " segundos";
  }
  return formatoNumero(serie.kg) + " kg x " + serie.reps;
}

// Lo que se hizo la última vez con un ejercicio, en el entrenamiento
// guardado más reciente que lo tenga:
//   { texto: "Última vez: 40 kg x 10", nota: "Subir peso" }
// (nota es "" si no se escribió ninguna). null si nunca se hizo.
function ultimaVez(idEjercicio, entrenamientos) {
  for (let i = entrenamientos.length - 1; i >= 0; i--) {
    const ejercicio = entrenamientos[i].ejercicios.find(function (hecho) {
      return hecho.id === idEjercicio;
    });
    if (ejercicio && ejercicio.series.length > 0) {
      const ultimaSerie = ejercicio.series[ejercicio.series.length - 1];
      return {
        texto: "Última vez: " + textoSerie(ultimaSerie, ejercicio.medicion),
        nota: ejercicio.nota || ""
      };
    }
  }
  return null;
}

// Un ejercicio listo para apuntar en el entrenamiento: copia del nombre y
// la medición, 3 series vacías y sin nota
function ejercicioParaEntrenar(ejercicio) {
  const series = [];
  for (let i = 0; i < SERIES_POR_DEFECTO; i++) {
    series.push(serieVacia(ejercicio.medicion));
  }
  return { id: ejercicio.id, nombre: ejercicio.nombre, medicion: ejercicio.medicion, series: series, nota: "" };
}

// Rellena la pantalla "¿Qué rutina vas a hacer?"
function pintarElegirRutina() {
  pintarListaRutinas("entrenar-predeterminadas", RUTINAS_PREDETERMINADAS, empezarEntrenamiento);

  const misRutinas = leerLista(CLAVE_MIS_RUTINAS);
  pintarListaRutinas("entrenar-mias", misRutinas, empezarEntrenamiento);
  document.getElementById("entrenar-mias-vacio").hidden = misRutinas.length > 0;
}

// Empieza un entrenamiento con una rutina. Se copian los nombres de la
// rutina y de los ejercicios, para que el entrenamiento no cambie aunque
// después se edite o se borre la rutina.
function empezarEntrenamiento(rutina) {
  if (entrenamientoEnCurso) {
    const seguro = confirm("Tienes un entrenamiento sin terminar («" + entrenamientoEnCurso.rutina.nombre + "»). ¿Quieres descartarlo y empezar uno nuevo?");
    if (!seguro) {
      return;
    }
  }

  const ejercicios = [];
  rutina.ejercicios.forEach(function (id) {
    const ejercicio = buscarEjercicio(id);
    if (!ejercicio) {
      return; // Un ejercicio que ya no existe no se puede apuntar
    }
    ejercicios.push(ejercicioParaEntrenar(ejercicio));
  });

  if (ejercicios.length === 0) {
    mostrarAvisoBreve("Esta rutina no tiene ejercicios");
    return;
  }

  entrenamientoEnCurso = {
    id: "t" + Date.now(),
    inicio: new Date().toISOString(),
    rutina: { nombre: rutina.nombre },
    ejercicios: ejercicios
  };
  guardarEntrenamientoEnCurso();

  // Se sustituye la pantalla de elegir rutina por la del entrenamiento:
  // así "Volver" lleva al inicio, no a elegir rutina otra vez.
  history.replaceState(history.state, "", "#entrenamiento");
  mostrarPantallaActual();
}

// Rellena la pantalla del entrenamiento en curso
function pintarEntrenamiento() {
  document.getElementById("entreno-nombre").textContent = entrenamientoEnCurso.rutina.nombre;
  actualizarCronometro();

  const anteriores = leerLista(CLAVE_ENTRENAMIENTOS);
  const contenedor = document.getElementById("entreno-ejercicios");
  contenedor.innerHTML = "";
  menuAbierto = null;
  let bloqueDestacado = null;
  entrenamientoEnCurso.ejercicios.forEach(function (ejercicio) {
    const bloque = crearBloqueEjercicio(ejercicio, anteriores);
    if (ejercicio === ejercicioDestacado) {
      bloqueDestacado = bloque;
    }
    contenedor.appendChild(bloque);
  });

  document.getElementById("error-entreno").hidden = true;
  document.getElementById("aviso-sin-ejercicios").hidden = true;
  document.getElementById("opciones-anadir-entreno").hidden = true;

  // Al volver de añadir o reemplazar un ejercicio, se lleva la vista hasta él
  ejercicioDestacado = null;
  if (bloqueDestacado) {
    bloqueDestacado.scrollIntoView({ block: "center" });
  }
}

// ---------- Cronómetro ----------
// No cuenta segundos uno a uno: calcula cada vez el tiempo que ha pasado
// desde la hora de inicio guardada en el entrenamiento. Así es correcto
// aunque se bloquee el móvil, se cambie de aplicación o se recargue.
// Solo cambia su propio texto, sin volver a dibujar la pantalla, para
// no cerrar el teclado ni borrar lo que se está escribiendo.

const textoCronometro = document.getElementById("cronometro-tiempo");
let temporizadorCronometro = null;

// Segundos que han pasado desde una fecha guardada (0 si no se puede saber)
function segundosDesde(fechaInicio) {
  const segundos = Math.floor((Date.now() - Date.parse(fechaInicio)) / 1000);
  return segundos > 0 ? segundos : 0; // NaN > 0 es false
}

// 754 → "12:34"; 3920 → "1:05:20"
function textoTiempo(segundos) {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const resto = segundos % 60;
  if (horas === 0) {
    return minutos + ":" + dosCifras(resto);
  }
  return horas + ":" + dosCifras(minutos) + ":" + dosCifras(resto);
}

// Pone el tiempo en el cronómetro y programa la siguiente vez
function actualizarCronometro() {
  clearTimeout(temporizadorCronometro);
  if (!entrenamientoEnCurso) {
    return;
  }
  const texto = textoTiempo(segundosDesde(entrenamientoEnCurso.inicio));
  if (textoCronometro.textContent !== texto) {
    textoCronometro.textContent = texto;
  }
  // La próxima vez, justo cuando cambie el segundo
  const milisegundos = Date.now() - Date.parse(entrenamientoEnCurso.inicio);
  const espera = milisegundos > 0 ? 1000 - (milisegundos % 1000) : 1000;
  temporizadorCronometro = setTimeout(actualizarCronometro, espera);
}

function detenerCronometro() {
  clearTimeout(temporizadorCronometro);
  temporizadorCronometro = null;
}

// Lo que pasa cada vez que se escribe algo o se marca una casilla
function alCambiarEntrenamiento() {
  guardarEntrenamientoEnCurso();
  document.getElementById("error-entreno").hidden = true;
  document.getElementById("aviso-sin-ejercicios").hidden = true;
}

// ---------- Cambiar los ejercicios de este entrenamiento ----------
// Añadir, quitar y reemplazar cambian solo el entrenamiento en curso
// (que se guarda solo, como todo lo demás). La rutina no se toca.

// El ejercicio recién añadido o puesto en lugar de otro, para llevar la vista hasta él
let ejercicioDestacado = null;

// Si una serie tiene algo: marcada como hecha o con algún dato escrito
function serieTieneDatos(serie, campos) {
  return serie.hecha || campos.some(function (campo) {
    return (serie[campo.nombre] || "").trim() !== "";
  });
}

// Si un ejercicio tiene algo apuntado: alguna serie con datos, o una nota
function tieneAlgoApuntado(ejercicio) {
  const campos = camposDe(ejercicio.medicion);
  return (ejercicio.nota || "").trim() !== "" || ejercicio.series.some(function (serie) {
    return serieTieneDatos(serie, campos);
  });
}

// Pone un ejercicio en el entrenamiento, con series vacías: al final, o en
// el sitio del que se reemplaza (según destinoEjercicio)
function ponerEnEntrenamiento(ejercicio) {
  const nuevo = ejercicioParaEntrenar(ejercicio);

  if (destinoEjercicio.modo === "reemplazar") {
    const reemplazado = ejercicioAReemplazar();
    if (!reemplazado) {
      return;
    }
    entrenamientoEnCurso.ejercicios[destinoEjercicio.numero - 1] = nuevo;
    mostrarAvisoBreve("«" + reemplazado.nombre + "» reemplazado por «" + nuevo.nombre + "»");
  } else {
    entrenamientoEnCurso.ejercicios.push(nuevo);
    mostrarAvisoBreve("Añadido: " + nuevo.nombre);
  }

  ejercicioDestacado = nuevo;
  guardarEntrenamientoEnCurso();
}

// "Quitar": lo saca de este entrenamiento. Si tiene algo apuntado, pregunta antes.
// El último no se puede quitar: un entrenamiento necesita al menos un ejercicio.
function quitarEjercicio(ejercicio) {
  const ejercicios = entrenamientoEnCurso.ejercicios;
  if (ejercicios.length <= 1) {
    const aviso = document.getElementById("aviso-sin-ejercicios");
    aviso.hidden = false;
    aviso.scrollIntoView({ block: "nearest" });
    return;
  }

  if (tieneAlgoApuntado(ejercicio) &&
      !confirm("«" + ejercicio.nombre + "» tiene series o una nota apuntadas. Si lo quitas, se perderán. ¿Quitarlo del entrenamiento?")) {
    return;
  }

  const posicion = ejercicios.indexOf(ejercicio);
  if (posicion < 0) {
    return;
  }
  ejercicios.splice(posicion, 1);
  alCambiarEntrenamiento();
  pintarEntrenamiento();
  mostrarAvisoBreve("Quitado: " + ejercicio.nombre);
}

// "Reemplazar": si tiene algo apuntado, avisa de que se perderá; después
// abre el buscador para elegir el ejercicio que irá en su lugar
function reemplazarEjercicio(ejercicio) {
  const posicion = entrenamientoEnCurso.ejercicios.indexOf(ejercicio);
  if (posicion < 0) {
    return;
  }

  if (tieneAlgoApuntado(ejercicio) &&
      !confirm("«" + ejercicio.nombre + "» tiene series o una nota apuntadas. Si lo reemplazas, se perderán. ¿Elegir otro ejercicio en su lugar?")) {
    return;
  }

  irA("entrenamiento-reemplazar-buscar-" + (posicion + 1));
}

// El menú de tres puntos de un ejercicio. Solo hay uno abierto a la vez,
// y se cierra al pulsar en cualquier otro sitio.
let menuAbierto = null; // { menu, boton }

function cerrarMenuEjercicio() {
  if (menuAbierto) {
    menuAbierto.menu.hidden = true;
    menuAbierto.boton.setAttribute("aria-expanded", "false");
    menuAbierto = null;
  }
}

document.addEventListener("click", function (evento) {
  if (menuAbierto && !menuAbierto.menu.contains(evento.target) && !menuAbierto.boton.contains(evento.target)) {
    cerrarMenuEjercicio();
  }
});

// "+ Añadir ejercicio" muestra u oculta las dos opciones
document.getElementById("boton-anadir-al-entreno").addEventListener("click", function () {
  const opciones = document.getElementById("opciones-anadir-entreno");
  opciones.hidden = !opciones.hidden;
});

// El aviso de "no puedes quedarte sin ejercicios" ofrece añadir uno o cancelar
document.getElementById("boton-sin-ejercicios-anadir").addEventListener("click", function () {
  document.getElementById("aviso-sin-ejercicios").hidden = true;
  const opciones = document.getElementById("opciones-anadir-entreno");
  opciones.hidden = false;
  opciones.scrollIntoView({ block: "nearest" });
});

document.getElementById("boton-sin-ejercicios-cancelar").addEventListener("click", cancelarEntrenamiento);

const LARGO_MAXIMO_NOTA = 300;

// Ejercicios con la nota desplegada aunque esté vacía (porque se pulsó "Nota").
// Así sigue abierta al volver a dibujar el bloque (al añadir o quitar una serie).
const notasAbiertas = new WeakSet();

// El bloque de un ejercicio: nombre con el botón "Nota", "Última vez",
// la nota (si está desplegada), filas de series y botones
function crearBloqueEjercicio(ejercicio, anteriores) {
  const bloque = document.createElement("div");
  bloque.className = "bloque-ejercicio";

  const cabecera = document.createElement("div");
  cabecera.className = "cabecera-bloque";
  const titulo = document.createElement("h3");
  titulo.className = "bloque-titulo";
  titulo.textContent = ejercicio.nombre;
  const botonNota = crearBotonPequeno("boton-nota", "Nota", "Nota de " + ejercicio.nombre, function () {
    const abrir = zonaNota.hidden;
    zonaNota.hidden = !abrir;
    botonNota.setAttribute("aria-expanded", String(abrir));
    if (abrir) {
      notasAbiertas.add(ejercicio);
      campoNota.focus();
    } else {
      notasAbiertas.delete(ejercicio);
    }
  });
  // Botón de tres puntos: abre el menú con "Reemplazar" y "Quitar"
  const botonMenu = crearBotonPequeno("boton-menu-ejercicio", "⋯", "Más opciones de " + ejercicio.nombre, function () {
    const abrir = menu.hidden;
    cerrarMenuEjercicio();
    if (abrir) {
      menu.hidden = false;
      botonMenu.setAttribute("aria-expanded", "true");
      menuAbierto = { menu: menu, boton: botonMenu };
    }
  });
  botonMenu.setAttribute("aria-expanded", "false");

  cabecera.appendChild(titulo);
  cabecera.appendChild(botonNota);
  cabecera.appendChild(botonMenu);
  bloque.appendChild(cabecera);

  const menu = document.createElement("div");
  menu.className = "menu-ejercicio";
  menu.hidden = true;
  menu.appendChild(crearBotonPequeno("boton-opcion", "Reemplazar", "Reemplazar " + ejercicio.nombre, function () {
    cerrarMenuEjercicio();
    reemplazarEjercicio(ejercicio);
  }));
  menu.appendChild(crearBotonPequeno("boton-peligro", "Quitar", "Quitar " + ejercicio.nombre + " del entrenamiento", function () {
    cerrarMenuEjercicio();
    quitarEjercicio(ejercicio);
  }));
  bloque.appendChild(menu);

  const anterior = ultimaVez(ejercicio.id, anteriores);
  if (anterior) {
    const referencia = document.createElement("p");
    referencia.className = "ultima-vez";
    referencia.textContent = anterior.texto;
    bloque.appendChild(referencia);
    if (anterior.nota) {
      const notaAnterior = document.createElement("p");
      notaAnterior.className = "ultima-nota";
      notaAnterior.textContent = "Nota: " + anterior.nota;
      bloque.appendChild(notaAnterior);
    }
  }

  // La nota: un campo de texto de hasta 300 caracteres, con contador.
  // Se ve desplegada si ya tiene algo escrito o si se abrió con "Nota".
  const zonaNota = document.createElement("div");
  zonaNota.className = "zona-nota";
  const campoNota = document.createElement("textarea");
  campoNota.className = "campo-nota";
  campoNota.rows = 3;
  campoNota.maxLength = LARGO_MAXIMO_NOTA;
  campoNota.placeholder = "Por ejemplo: subir peso la próxima vez, molestia en el hombro…";
  campoNota.value = ejercicio.nota || "";
  campoNota.setAttribute("aria-label", "Nota de " + ejercicio.nombre);
  const contador = document.createElement("p");
  contador.className = "contador-nota";
  function actualizarContador() {
    contador.textContent = campoNota.value.length + "/" + LARGO_MAXIMO_NOTA;
  }
  actualizarContador();
  campoNota.addEventListener("input", function () {
    ejercicio.nota = campoNota.value.slice(0, LARGO_MAXIMO_NOTA);
    actualizarContador();
    alCambiarEntrenamiento();
  });
  zonaNota.appendChild(campoNota);
  zonaNota.appendChild(contador);
  zonaNota.hidden = !(notasAbiertas.has(ejercicio) || campoNota.value !== "");
  botonNota.setAttribute("aria-expanded", String(!zonaNota.hidden));
  bloque.appendChild(zonaNota);

  const campos = camposDe(ejercicio.medicion);
  bloque.appendChild(crearCabeceraSeries(campos));
  ejercicio.series.forEach(function (serie, posicion) {
    bloque.appendChild(crearFilaSerie(serie, posicion + 1, campos));
  });

  // Vuelve a dibujar solo este bloque (al añadir o quitar una serie)
  function repintar() {
    bloque.replaceWith(crearBloqueEjercicio(ejercicio, anteriores));
  }

  const botones = document.createElement("div");
  botones.className = "botones-series";

  const anadir = crearBotonPequeno("boton-serie", "+ Añadir serie", "Añadir serie", function () {
    ejercicio.series.push(serieVacia(ejercicio.medicion));
    alCambiarEntrenamiento();
    repintar();
  });

  const quitar = crearBotonPequeno("boton-serie", "− Quitar serie", "Quitar la última serie", function () {
    const ultima = ejercicio.series[ejercicio.series.length - 1];
    if (serieTieneDatos(ultima, campos) && !confirm("La serie " + ejercicio.series.length + " tiene datos apuntados. ¿Quitarla?")) {
      return;
    }
    ejercicio.series.pop();
    alCambiarEntrenamiento();
    repintar();
  });
  quitar.disabled = ejercicio.series.length <= 1;

  botones.appendChild(anadir);
  botones.appendChild(quitar);
  bloque.appendChild(botones);
  return bloque;
}

// Fila de títulos encima de las series: "Serie | kg | Reps | Hecha"
function crearCabeceraSeries(campos) {
  const fila = document.createElement("div");
  fila.className = "fila-serie cabecera-series campos-" + campos.length;
  ["Serie"].concat(campos.map(function (campo) { return campo.titulo; }), ["Hecha"]).forEach(function (texto) {
    const celda = document.createElement("span");
    celda.textContent = texto;
    fila.appendChild(celda);
  });
  return fila;
}

// Una fila de serie: número, campos para escribir y casilla de "hecha"
function crearFilaSerie(serie, numero, campos) {
  const fila = document.createElement("div");
  fila.className = "fila-serie campos-" + campos.length;
  fila.classList.toggle("serie-hecha", serie.hecha);

  const numeroSerie = document.createElement("span");
  numeroSerie.className = "numero-serie";
  numeroSerie.textContent = numero;
  fila.appendChild(numeroSerie);

  campos.forEach(function (campo) {
    const entrada = document.createElement("input");
    entrada.className = "campo-serie";
    entrada.type = "text";
    // inputmode hace que el móvil muestre el teclado de números
    entrada.inputMode = campo.decimales ? "decimal" : "numeric";
    entrada.autocomplete = "off";
    entrada.value = serie[campo.nombre] || "";
    entrada.setAttribute("aria-label", "Serie " + numero + ", " + campo.titulo);
    entrada.addEventListener("input", function () {
      serie[campo.nombre] = entrada.value;
      alCambiarEntrenamiento();
    });
    fila.appendChild(entrada);
  });

  // La casilla va dentro de una etiqueta grande, para que sea fácil de pulsar
  const etiqueta = document.createElement("label");
  etiqueta.className = "casilla-hecha";
  const casilla = document.createElement("input");
  casilla.type = "checkbox";
  casilla.checked = serie.hecha;
  casilla.setAttribute("aria-label", "Serie " + numero + " hecha");
  casilla.addEventListener("change", function () {
    serie.hecha = casilla.checked;
    fila.classList.toggle("serie-hecha", serie.hecha);
    alCambiarEntrenamiento();
  });
  etiqueta.appendChild(casilla);
  fila.appendChild(etiqueta);

  return fila;
}

// Pasa los textos de una serie a números: { kg: 40, reps: 10 }.
// Devuelve null si falta algún dato o no es un número válido.
function convertirSerie(serie, campos) {
  const numeros = {};
  for (const campo of campos) {
    const numero = leerNumero(serie[campo.nombre] || "", campo.decimales);
    if (numero === null || (numero === 0 && !campo.puedeSerCero)) {
      return null;
    }
    numeros[campo.nombre] = numero;
  }
  return numeros;
}

// "Terminar entrenamiento": comprueba los datos, guarda solo las series
// hechas y muestra el resumen
function terminarEntrenamiento() {
  if (!entrenamientoEnCurso) {
    return; // Evita guardarlo dos veces con un doble toque
  }

  const error = document.getElementById("error-entreno");
  const ejerciciosHechos = [];
  let haySeriesSinMarcar = false;
  const notasSinGuardar = []; // Nombres de ejercicios con nota pero sin series hechas

  for (const ejercicio of entrenamientoEnCurso.ejercicios) {
    const campos = camposDe(ejercicio.medicion);
    const seriesHechas = [];

    for (const serie of ejercicio.series) {
      if (!serie.hecha) {
        const tieneDatos = campos.some(function (campo) {
          return (serie[campo.nombre] || "").trim() !== "";
        });
        if (tieneDatos) {
          haySeriesSinMarcar = true;
        }
        continue;
      }

      const numeros = convertirSerie(serie, campos);
      if (!numeros) {
        mostrarError(error, "Revisa «" + ejercicio.nombre + "»: hay una serie marcada como hecha con datos que faltan o que no son números.");
        return;
      }
      seriesHechas.push(numeros);
    }

    const nota = (ejercicio.nota || "").trim();
    if (seriesHechas.length > 0) {
      ejerciciosHechos.push({ id: ejercicio.id, nombre: ejercicio.nombre, medicion: ejercicio.medicion, series: seriesHechas, nota: nota });
    } else if (nota !== "") {
      notasSinGuardar.push(ejercicio.nombre); // Sin series hechas, el ejercicio (y su nota) no se guarda
    }
  }

  if (ejerciciosHechos.length === 0) {
    mostrarError(error, "Marca como hecha al menos una serie (la casilla de la derecha). Si no quieres guardar nada, pulsa «Cancelar entrenamiento».");
    return;
  }

  const avisos = [];
  if (haySeriesSinMarcar) {
    avisos.push("Hay series con datos que no están marcadas como hechas. Esas no se guardarán.");
  }
  if (notasSinGuardar.length > 0) {
    avisos.push("La nota de «" + notasSinGuardar.join("», «") + "» no se guardará, porque ese ejercicio no tiene ninguna serie hecha.");
  }
  if (avisos.length > 0 && !confirm(avisos.join("\n\n") + "\n\n¿Terminar igualmente?")) {
    return;
  }

  // Antes de guardar, se pregunta la duración (por si hay que corregirla)
  pedirDuracion(ejerciciosHechos);
}

// Guarda el entrenamiento terminado, con la duración ya elegida, y muestra el resumen
function guardarEntrenamientoTerminado(ejerciciosHechos, duracion) {
  const error = document.getElementById("error-entreno");
  const entrenamiento = {
    id: entrenamientoEnCurso.id,
    fecha: new Date().toISOString(),
    inicio: entrenamientoEnCurso.inicio,
    duracion: duracion,
    rutina: { nombre: entrenamientoEnCurso.rutina.nombre },
    ejercicios: ejerciciosHechos
  };

  const entrenamientos = leerLista(CLAVE_ENTRENAMIENTOS);
  entrenamientos.push(entrenamiento);
  if (!guardarDatos(CLAVE_ENTRENAMIENTOS, entrenamientos)) {
    mostrarError(error, "No se ha podido guardar. Puede que tu navegador no permita guardar datos.");
    return;
  }

  descartarEntrenamientoEnCurso();

  // Se sustituye la pantalla del entrenamiento por la del resumen
  history.replaceState(history.state, "", "#resumen-" + entrenamiento.id);
  mostrarPantallaActual();
}

document.getElementById("boton-terminar-entreno").addEventListener("click", terminarEntrenamiento);

// ---------- Corregir la duración antes de guardar ----------
// Al terminar sale una ventana con la duración (horas y minutos) ya
// rellenada con el tiempo del cronómetro. Si no se toca, se guarda el
// tiempo exacto; si se cambia, se guarda lo escrito.

const ventanaDuracion = document.getElementById("ventana-duracion");
const campoHoras = document.getElementById("duracion-horas");
const campoMinutos = document.getElementById("duracion-minutos");

// Lo que se va a guardar mientras la ventana está abierta
let pendienteDeGuardar = null;

function pedirDuracion(ejerciciosHechos) {
  const segundos = segundosDesde(entrenamientoEnCurso.inicio);
  campoHoras.value = String(Math.floor(segundos / 3600));
  campoMinutos.value = String(Math.floor((segundos % 3600) / 60));
  pendienteDeGuardar = { ejercicios: ejerciciosHechos, segundos: segundos, horas: campoHoras.value, minutos: campoMinutos.value };
  document.getElementById("error-duracion").hidden = true;
  ventanaDuracion.showModal();
}

// "Guardar entrenamiento" (dentro de la ventana)
document.getElementById("boton-guardar-duracion").addEventListener("click", function () {
  if (!pendienteDeGuardar || !entrenamientoEnCurso) {
    return; // Evita guardarlo dos veces con un doble toque
  }

  let duracion = pendienteDeGuardar.segundos;
  const cambiada = campoHoras.value.trim() !== pendienteDeGuardar.horas || campoMinutos.value.trim() !== pendienteDeGuardar.minutos;
  if (cambiada) {
    // Un campo vacío cuenta como 0
    const horas = leerNumero(campoHoras.value.trim() || "0", false);
    const minutos = leerNumero(campoMinutos.value.trim() || "0", false);
    const error = document.getElementById("error-duracion");
    if (horas === null || minutos === null || horas > 23 || minutos > 59) {
      mostrarError(error, "Escribe las horas (de 0 a 23) y los minutos (de 0 a 59) con números.");
      return;
    }
    if (horas === 0 && minutos === 0) {
      mostrarError(error, "La duración tiene que ser de al menos 1 minuto.");
      return;
    }
    duracion = horas * 3600 + minutos * 60;
  }

  const ejercicios = pendienteDeGuardar.ejercicios;
  ventanaDuracion.close();
  guardarEntrenamientoTerminado(ejercicios, duracion);
});

// "Seguir entrenando": cierra la ventana sin guardar nada
document.getElementById("boton-cerrar-duracion").addEventListener("click", function () {
  ventanaDuracion.close();
});

ventanaDuracion.addEventListener("close", function () {
  pendienteDeGuardar = null;
});

// "Cancelar entrenamiento" pregunta antes de tirar lo apuntado
function cancelarEntrenamiento() {
  const seguro = confirm("¿Seguro que quieres cancelar el entrenamiento? Se perderá todo lo que has apuntado.");
  if (!seguro) {
    return;
  }
  descartarEntrenamientoEnCurso();
  volver();
}

document.getElementById("boton-cancelar-entreno").addEventListener("click", cancelarEntrenamiento);


// ============================================================
// HISTORIAL Y DETALLE DE UN ENTRENAMIENTO GUARDADO
// El detalle usa la misma pantalla que el resumen que sale al terminar.
// ============================================================

// Fecha en español y fácil de leer: "martes 20 de octubre".
// Si no es de este año, se añade el año: "lunes 3 de marzo de 2025".
function fechaLegible(fecha) {
  const diaSemana = fecha.toLocaleDateString("es-ES", { weekday: "long" });
  const mes = fecha.toLocaleDateString("es-ES", { month: "long" });
  let texto = diaSemana + " " + fecha.getDate() + " de " + mes;
  if (fecha.getFullYear() !== new Date().getFullYear()) {
    texto += " de " + fecha.getFullYear();
  }
  return texto;
}

// Fecha con la primera letra en mayúscula, para los títulos: "Martes 20 de octubre"
function fechaLegibleTitulo(fecha) {
  const texto = fechaLegible(fecha);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// "1 serie", "12 series": las series hechas en todo el entrenamiento
function textoSeries(entrenamiento) {
  const total = entrenamiento.ejercicios.reduce(function (suma, ejercicio) {
    return suma + ejercicio.series.length;
  }, 0);
  return total === 1 ? "1 serie" : total + " series";
}

// Si un entrenamiento guardado tiene duración (si no se pudo saber, es null)
function tieneDuracion(entrenamiento) {
  return typeof entrenamiento.duracion === "number";
}

// Duración guardada, en texto: "menos de 1 min", "45 min", "1 h 5 min"
function textoDuracion(segundos) {
  const minutosTotales = Math.floor(segundos / 60);
  if (minutosTotales < 1) {
    return "menos de 1 min";
  }
  const horas = Math.floor(minutosTotales / 60);
  const minutos = minutosTotales % 60;
  if (horas === 0) {
    return minutos + " min";
  }
  return minutos === 0 ? horas + " h" : horas + " h " + minutos + " min";
}

// Rellena la pantalla "Historial": una tarjeta por entrenamiento, del más reciente al más antiguo
function pintarHistorial() {
  const entrenamientos = leerLista(CLAVE_ENTRENAMIENTOS).slice().sort(function (a, b) {
    return b.fecha.localeCompare(a.fecha); // Las fechas guardadas se pueden comparar como texto
  });

  const lista = document.getElementById("lista-historial");
  lista.innerHTML = "";
  entrenamientos.forEach(function (entrenamiento) {
    const partes = [entrenamiento.rutina.nombre, textoCantidad(entrenamiento), textoSeries(entrenamiento)];
    if (tieneDuracion(entrenamiento)) {
      partes.push(textoDuracion(entrenamiento.duracion));
    }
    const subtitulo = partes.join(" · ");
    const tarjeta = crearTarjeta(fechaLegibleTitulo(new Date(entrenamiento.fecha)), subtitulo, crearFlecha());
    tarjeta.addEventListener("click", function () {
      irA("historial-" + entrenamiento.id);
    });
    lista.appendChild(tarjeta);
  });

  document.getElementById("historial-vacio").hidden = entrenamientos.length > 0;
}

// El entrenamiento que se está viendo en la pantalla de resumen
let entrenamientoEnResumen = null;

// Rellena la pantalla de resumen. Se usa al terminar un entrenamiento
// (recienTerminado = true) y al abrirlo desde el historial (false).
function pintarResumen(entrenamiento, recienTerminado) {
  entrenamientoEnResumen = entrenamiento;

  const fin = new Date(entrenamiento.fecha);
  const partes = [fechaLegibleTitulo(fin) + ", " + fin.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })];
  if (tieneDuracion(entrenamiento)) {
    partes.push(textoDuracion(entrenamiento.duracion));
  }
  partes.push(textoSeries(entrenamiento));

  document.getElementById("resumen-titulo").textContent = recienTerminado ? "¡Entrenamiento guardado!" : "Entrenamiento";
  document.getElementById("boton-resumen-listo").textContent = recienTerminado ? "Volver al inicio" : "Volver al historial";
  document.getElementById("error-resumen").hidden = true;
  document.getElementById("resumen-rutina").textContent = entrenamiento.rutina.nombre;
  document.getElementById("resumen-datos").textContent = partes.join(" · ");

  const contenedor = document.getElementById("resumen-ejercicios");
  contenedor.innerHTML = "";
  entrenamiento.ejercicios.forEach(function (ejercicio) {
    const bloque = document.createElement("div");
    bloque.className = "bloque-ejercicio";

    const titulo = document.createElement("h3");
    titulo.className = "bloque-titulo";
    titulo.textContent = ejercicio.nombre;
    bloque.appendChild(titulo);

    const lista = document.createElement("ol");
    lista.className = "series-resumen";
    ejercicio.series.forEach(function (serie) {
      const elemento = document.createElement("li");
      elemento.textContent = textoSerie(serie, ejercicio.medicion);
      lista.appendChild(elemento);
    });
    bloque.appendChild(lista);

    if (ejercicio.nota) {
      const nota = document.createElement("p");
      nota.className = "nota-ejercicio";
      nota.textContent = ejercicio.nota;
      bloque.appendChild(nota);
    }

    contenedor.appendChild(bloque);
  });
}

document.getElementById("boton-resumen-listo").addEventListener("click", volver);

// "Borrar entrenamiento" pregunta antes de eliminarlo
document.getElementById("boton-borrar-entreno").addEventListener("click", function () {
  const fecha = fechaLegible(new Date(entrenamientoEnResumen.fecha));
  const seguro = confirm("¿Seguro que quieres borrar el entrenamiento del " + fecha + "? No se puede deshacer.");
  if (!seguro) {
    return;
  }

  const entrenamientos = leerLista(CLAVE_ENTRENAMIENTOS).filter(function (guardado) {
    return guardado.id !== entrenamientoEnResumen.id;
  });

  if (!guardarDatos(CLAVE_ENTRENAMIENTOS, entrenamientos)) {
    mostrarError(document.getElementById("error-resumen"), "No se ha podido borrar. Puede que tu navegador no permita guardar datos.");
    return;
  }

  mostrarAvisoBreve("Entrenamiento borrado");
  volver(); // De vuelta al historial (o al inicio, si se acababa de terminar)
});


// ============================================================
// PROGRESO: CALENDARIO MENSUAL
// La dirección dice qué mes se ve y, si se ha elegido uno, qué día:
//   #progreso             → el mes actual
//   #progreso-2026-09     → septiembre de 2026
//   #progreso-2026-09-14  → ese mes, con la lista de entrenamientos del día 14
// Así "atrás" vuelve al mismo mes, y las flechas no llenan el historial
// del navegador (sustituyen la dirección en vez de añadir una).
// Todas las fechas se miran con la hora local del dispositivo.
// ============================================================

// El mes que se está viendo (mes: de 0 = enero a 11 = diciembre)
let mesEnProgreso = { anio: 0, mes: 0 };

function dosCifras(numero) {
  return numero < 10 ? "0" + numero : String(numero);
}

// "2026-10-20": el día de una fecha según la hora local del dispositivo.
// (Si se usara la hora universal, un entrenamiento a las 00:30 podría
// salir en el día anterior.)
function claveDia(fecha) {
  return fecha.getFullYear() + "-" + dosCifras(fecha.getMonth() + 1) + "-" + dosCifras(fecha.getDate());
}

// Los entrenamientos guardados agrupados por día: { "2026-10-20": [ ... ], ... }
function entrenamientosPorDia() {
  const porDia = {};
  leerLista(CLAVE_ENTRENAMIENTOS)
    .slice()
    .sort(function (a, b) {
      return a.fecha.localeCompare(b.fecha);
    })
    .forEach(function (entrenamiento) {
      const clave = claveDia(new Date(entrenamiento.fecha));
      if (!porDia[clave]) {
        porDia[clave] = [];
      }
      porDia[clave].push(entrenamiento);
    });
  return porDia;
}

// Dibuja el calendario de un mes. diaElegido es una clave como "2026-10-20"
// (o null): si ese día tiene entrenamientos, se muestra su lista debajo.
function pintarProgreso(anio, mes, diaElegido) {
  mesEnProgreso = { anio: anio, mes: mes };

  const hoy = new Date();
  const claveHoy = claveDia(hoy);
  const porDia = entrenamientosPorDia();
  const nombreMes = new Date(anio, mes, 1).toLocaleDateString("es-ES", { month: "long" });

  document.getElementById("calendario-mes").textContent =
    nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1) + " " + anio;

  const dias = document.getElementById("calendario-dias");
  dias.innerHTML = "";

  // Huecos antes del día 1, para que caiga en su día de la semana.
  // getDay() da 0 = domingo; se pasa a 0 = lunes, porque la semana empieza en lunes.
  const huecos = (new Date(anio, mes, 1).getDay() + 6) % 7;
  for (let i = 0; i < huecos; i++) {
    dias.appendChild(document.createElement("span"));
  }

  const diasDelMes = new Date(anio, mes + 1, 0).getDate(); // El "día 0" del mes siguiente es el último de este
  let totalMes = 0;

  for (let dia = 1; dia <= diasDelMes; dia++) {
    const clave = anio + "-" + dosCifras(mes + 1) + "-" + dosCifras(dia);
    const delDia = porDia[clave] || [];
    totalMes += delDia.length;

    // Los días con entrenamiento son botones; los demás, solo un número
    const celda = document.createElement(delDia.length > 0 ? "button" : "span");
    celda.className = "dia";
    celda.textContent = dia;
    celda.classList.toggle("dia-hoy", clave === claveHoy);

    if (delDia.length > 0) {
      celda.classList.add("dia-con-entreno");
      celda.classList.toggle("dia-elegido", clave === diaElegido);
      celda.setAttribute("aria-label", dia + " de " + nombreMes + ": " +
        (delDia.length === 1 ? "1 entrenamiento" : delDia.length + " entrenamientos"));
      celda.addEventListener("click", function () {
        if (delDia.length === 1) {
          irA("historial-" + delDia[0].id);
        } else {
          history.replaceState(history.state, "", "#progreso-" + clave);
          mostrarPantallaActual();
        }
      });
    }

    dias.appendChild(celda);
  }

  // "Este mes: 8 entrenamientos" o "En septiembre: 3 entrenamientos"
  let cuando = "Este mes";
  if (anio !== hoy.getFullYear() || mes !== hoy.getMonth()) {
    cuando = "En " + nombreMes + (anio !== hoy.getFullYear() ? " de " + anio : "");
  }
  document.getElementById("calendario-total").textContent =
    cuando + ": " + (totalMes === 1 ? "1 entrenamiento" : totalMes + " entrenamientos");

  pintarDiaElegido(diaElegido, porDia[diaElegido] || []);
}

// Lista para elegir cuando un día tiene más de un entrenamiento
function pintarDiaElegido(clave, delDia) {
  const panel = document.getElementById("dia-elegido");
  panel.hidden = delDia.length === 0;
  if (delDia.length === 0) {
    return;
  }

  const partes = clave.split("-").map(Number);
  document.getElementById("dia-elegido-titulo").textContent =
    fechaLegibleTitulo(new Date(partes[0], partes[1] - 1, partes[2]));

  const lista = document.getElementById("dia-elegido-lista");
  lista.innerHTML = "";
  delDia.forEach(function (entrenamiento) {
    const hora = new Date(entrenamiento.fecha).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    const subtitulo = hora + " · " + textoCantidad(entrenamiento) + " · " + textoSeries(entrenamiento);
    const tarjeta = crearTarjeta(entrenamiento.rutina.nombre, subtitulo, crearFlecha());
    tarjeta.addEventListener("click", function () {
      irA("historial-" + entrenamiento.id);
    });
    lista.appendChild(tarjeta);
  });

  panel.scrollIntoView({ block: "nearest" });
}

// Al entrar en "Progreso": el mes actual
function abrirProgreso() {
  const hoy = new Date();
  pintarProgreso(hoy.getFullYear(), hoy.getMonth(), null);
}

// Cambia de mes con las flechas (-1 = anterior, +1 = siguiente)
function cambiarMes(cuanto) {
  // new Date se encarga de pasar de diciembre a enero (y al revés)
  const fecha = new Date(mesEnProgreso.anio, mesEnProgreso.mes + cuanto, 1);
  history.replaceState(history.state, "", "#progreso-" + fecha.getFullYear() + "-" + dosCifras(fecha.getMonth() + 1));
  mostrarPantallaActual();
}

document.getElementById("mes-anterior").addEventListener("click", function () {
  cambiarMes(-1);
});

document.getElementById("mes-siguiente").addEventListener("click", function () {
  cambiarMes(1);
});


// ============================================================
// COPIA DE SEGURIDAD
// "Exportar" crea un archivo con las rutinas, los ejercicios propios y
// los entrenamientos. "Importar" lo lee y reemplaza los datos actuales.
// El archivo lleva el número de versión del formato, así que una copia
// antigua se puede convertir al formato nuevo con actualizarFormato().
// El entrenamiento en curso (si lo hay) no entra en la copia ni se toca.
// ============================================================
const TIPO_COPIA = "copia-de-seguridad-mi-app-gym";

// Los datos que entran en la copia, y cómo se comprueba cada elemento
const CLAVES_COPIA = [CLAVE_MIS_RUTINAS, CLAVE_MIS_EJERCICIOS, CLAVE_ENTRENAMIENTOS];

// "1 rutina", "3 rutinas"...
function cantidad(numero, singular, plural) {
  return numero === 1 ? "1 " + singular : numero + " " + plural;
}

// "2 rutinas, 1 ejercicio propio y 5 entrenamientos"
function textoDatos(datos) {
  return cantidad(datos[CLAVE_MIS_RUTINAS].length, "rutina", "rutinas") + ", " +
    cantidad(datos[CLAVE_MIS_EJERCICIOS].length, "ejercicio propio", "ejercicios propios") + " y " +
    cantidad(datos[CLAVE_ENTRENAMIENTOS].length, "entrenamiento", "entrenamientos");
}

function datosActuales() {
  const datos = {};
  CLAVES_COPIA.forEach(function (clave) {
    datos[clave] = leerLista(clave);
  });
  return datos;
}

// Al entrar en la pantalla: mensajes ocultos y resumen de lo que hay guardado
function abrirCopia() {
  document.getElementById("error-copia").hidden = true;
  document.getElementById("exito-copia").hidden = true;
  document.getElementById("datos-actuales").textContent = "Ahora tienes " + textoDatos(datosActuales()) + ".";
}

function mostrarExito(mensaje) {
  document.getElementById("error-copia").hidden = true;
  const exito = document.getElementById("exito-copia");
  exito.textContent = mensaje;
  exito.hidden = false;
}

function mostrarErrorCopia(mensaje) {
  document.getElementById("exito-copia").hidden = true;
  mostrarError(document.getElementById("error-copia"), mensaje);
}

// ---------- Exportar ----------

// "Exportar datos": crea el archivo y lo descarga.
// En el móvil se abre el menú de compartir (para guardarlo en Archivos,
// mandarlo por correo...), si el navegador lo permite con este tipo de archivo.
async function exportarDatos() {
  const copia = {
    tipo: TIPO_COPIA,
    version: VERSION_DATOS,
    fecha: new Date().toISOString(),
    datos: datosActuales()
  };
  const nombreArchivo = "copia-gym-" + claveDia(new Date()) + ".json";
  const archivo = new File([JSON.stringify(copia, null, 2)], nombreArchivo, { type: "application/json" });

  const esMovil = window.matchMedia("(pointer: coarse)").matches;
  if (esMovil && navigator.canShare && navigator.canShare({ files: [archivo] })) {
    try {
      await navigator.share({ files: [archivo], title: "Copia de seguridad" });
      mostrarExito("Copia creada. Guárdala en un sitio seguro.");
      return;
    } catch (error) {
      if (error.name === "AbortError") {
        return; // La persona cerró el menú de compartir: no pasa nada
      }
      // Si compartir falla por otro motivo, se descarga de la forma normal
    }
  }

  const enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(archivo);
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(function () {
    URL.revokeObjectURL(enlace.href);
  }, 10000);

  mostrarExito("Copia descargada: " + nombreArchivo + ". Guárdala en un sitio seguro.");
}

document.getElementById("boton-exportar").addEventListener("click", exportarDatos);

// ---------- Comprobar un archivo ----------

function esTexto(valor) {
  return typeof valor === "string" && valor !== "";
}

function esFecha(valor) {
  return typeof valor === "string" && !isNaN(Date.parse(valor));
}

function esMedicion(valor) {
  return Object.prototype.hasOwnProperty.call(NOMBRES_MEDICION, valor);
}

function esListaDe(valor, comprobar) {
  return Array.isArray(valor) && valor.every(comprobar);
}

function esRutinaValida(rutina) {
  return Boolean(rutina) && esTexto(rutina.id) && esTexto(rutina.nombre) && esListaDe(rutina.ejercicios, esTexto);
}

function esEjercicioValido(ejercicio) {
  return Boolean(ejercicio) && esTexto(ejercicio.id) && esTexto(ejercicio.nombre) &&
    typeof ejercicio.grupo === "string" && esMedicion(ejercicio.medicion);
}

// Una serie guardada tiene números en los campos de su tipo: { kg: 40, reps: 10 }
function esSerieValida(serie, medicion) {
  return Boolean(serie) && camposDe(medicion).every(function (campo) {
    return typeof serie[campo.nombre] === "number" && isFinite(serie[campo.nombre]);
  });
}

function esEntrenamientoValido(entrenamiento) {
  return Boolean(entrenamiento) && esTexto(entrenamiento.id) &&
    esFecha(entrenamiento.fecha) && esFecha(entrenamiento.inicio) &&
    // Duración en segundos, o null si no se sabe (las copias antiguas ya llegan con ella calculada)
    (entrenamiento.duracion === null || (typeof entrenamiento.duracion === "number" && isFinite(entrenamiento.duracion) && entrenamiento.duracion >= 0)) &&
    Boolean(entrenamiento.rutina) && typeof entrenamiento.rutina.nombre === "string" &&
    esListaDe(entrenamiento.ejercicios, function (ejercicio) {
      return Boolean(ejercicio) && esTexto(ejercicio.id) && esTexto(ejercicio.nombre) && esMedicion(ejercicio.medicion) &&
        typeof ejercicio.nota === "string" && // Las copias antiguas, sin notas, ya llegan aquí con nota "" (actualizarFormato)
        esListaDe(ejercicio.series, function (serie) {
          return esSerieValida(serie, ejercicio.medicion);
        });
    });
}

const COMPROBAR_COPIA = {};
COMPROBAR_COPIA[CLAVE_MIS_RUTINAS] = esRutinaValida;
COMPROBAR_COPIA[CLAVE_MIS_EJERCICIOS] = esEjercicioValido;
COMPROBAR_COPIA[CLAVE_ENTRENAMIENTOS] = esEntrenamientoValido;

// Lee el texto de un archivo de copia. Devuelve { datos } si es válido
// (ya convertido al formato actual) o { error } con un mensaje si no lo es.
function comprobarCopia(texto) {
  let copia;
  try {
    copia = JSON.parse(texto);
  } catch (error) {
    return { error: "Este archivo no es una copia de seguridad de la app." };
  }

  if (!copia || copia.tipo !== TIPO_COPIA || typeof copia.version !== "number" || !copia.datos) {
    return { error: "Este archivo no es una copia de seguridad de la app." };
  }
  if (copia.version > VERSION_DATOS) {
    return { error: "Esta copia es de una versión más nueva de la app. Actualiza la app (recarga la página) e inténtalo de nuevo." };
  }

  const datos = {};
  for (const clave of CLAVES_COPIA) {
    const lista = actualizarFormato(clave, copia.version, copia.datos[clave]);
    if (!esListaDe(lista, COMPROBAR_COPIA[clave])) {
      return { error: "El archivo está dañado o incompleto. No se ha cambiado nada." };
    }
    datos[clave] = lista;
  }
  return { datos: datos };
}

// ---------- Importar ----------

const campoArchivo = document.getElementById("archivo-importar");

// "Importar datos" abre el selector de archivos
document.getElementById("boton-importar").addEventListener("click", function () {
  campoArchivo.click();
});

// Cuando se elige un archivo: se comprueba, se pide confirmación y se reemplazan los datos
campoArchivo.addEventListener("change", async function () {
  const archivo = campoArchivo.files[0];
  campoArchivo.value = ""; // Así se puede volver a elegir el mismo archivo
  if (!archivo) {
    return;
  }

  let texto;
  try {
    texto = await archivo.text();
  } catch (error) {
    mostrarErrorCopia("No se ha podido leer el archivo.");
    return;
  }

  const resultado = comprobarCopia(texto);
  if (resultado.error) {
    mostrarErrorCopia(resultado.error);
    return;
  }

  const seguro = confirm(
    "Se reemplazarán TODOS tus datos actuales (" + textoDatos(datosActuales()) + ") " +
    "por los del archivo (" + textoDatos(resultado.datos) + "). Esto no se puede deshacer. ¿Continuar?"
  );
  if (!seguro) {
    return;
  }

  // Se guarda lo que había, para dejarlo como estaba si algo falla a medias
  const anteriores = CLAVES_COPIA.map(leerDatos);
  const todoGuardado = CLAVES_COPIA.every(function (clave) {
    return guardarDatos(clave, resultado.datos[clave]);
  });

  if (!todoGuardado) {
    CLAVES_COPIA.forEach(function (clave, posicion) {
      if (anteriores[posicion] === null) {
        borrarDatos(clave);
      } else {
        guardarDatos(clave, anteriores[posicion]);
      }
    });
    mostrarErrorCopia("No se ha podido importar. Puede que tu navegador no permita guardar datos. No se ha cambiado nada.");
    return;
  }

  abrirCopia(); // Actualiza el resumen de lo que hay guardado
  mostrarExito("Datos importados: " + textoDatos(resultado.datos) + ".");
});


// ============================================================
// NOMBRE DE LA APP
// El nombre está en marca.js (NOMBRE_APP). Aquí se pone en la página:
// en lo que tiene el atributo data-nombre-app y en el logo del inicio.
// ============================================================
document.querySelectorAll("[data-nombre-app]").forEach(function (elemento) {
  elemento.textContent = NOMBRE_APP;
});
document.getElementById("logo-inicio").alt = NOMBRE_APP;


// ============================================================
// INICIO
// Si hay un entrenamiento sin terminar, se ofrece continuarlo.
// ============================================================
function pintarInicio() {
  document.getElementById("aviso-continuar").hidden = !entrenamientoEnCurso;
  if (entrenamientoEnCurso) {
    document.getElementById("continuar-nombre").textContent = entrenamientoEnCurso.rutina.nombre;
  }
}

document.getElementById("boton-continuar").addEventListener("click", function () {
  irA("entrenamiento");
});

// ---------- Aviso de entrenamiento muy largo ----------
// Si al abrir la app (o al volver a ella) hay un entrenamiento que empezó
// hace más de 4 horas, seguramente se olvidó terminarlo. Se pregunta qué
// hacer. Si se elige continuar, se apunta en el entrenamiento
// (avisoLargoRespondido) para no volver a preguntar.

const HORAS_AVISO_LARGO = 4;
const ventanaLargo = document.getElementById("ventana-entreno-largo");

function avisarSiEsMuyLargo() {
  if (!entrenamientoEnCurso || entrenamientoEnCurso.avisoLargoRespondido || ventanaLargo.open || ventanaDuracion.open) {
    return;
  }
  const segundos = segundosDesde(entrenamientoEnCurso.inicio);
  if (segundos < HORAS_AVISO_LARGO * 3600) {
    return;
  }
  document.getElementById("largo-nombre").textContent = entrenamientoEnCurso.rutina.nombre;
  document.getElementById("largo-tiempo").textContent = textoDuracion(segundos);
  ventanaLargo.showModal();
}

// Lleva al entrenamiento en curso, si no se está ya en él
function irAlEntrenamiento() {
  if (pantallaActual().id !== "pantalla-entrenamiento") {
    irA("entrenamiento");
  }
}

document.getElementById("boton-largo-continuar").addEventListener("click", function () {
  ventanaLargo.close();
  entrenamientoEnCurso.avisoLargoRespondido = true;
  guardarEntrenamientoEnCurso();
  irAlEntrenamiento();
});

// "Terminarlo ahora": lo mismo que "Terminar entrenamiento"; después sale
// la ventana para corregir la duración
document.getElementById("boton-largo-terminar").addEventListener("click", function () {
  ventanaLargo.close();
  irAlEntrenamiento();
  terminarEntrenamiento();
  const error = document.getElementById("error-entreno");
  if (!error.hidden) {
    error.scrollIntoView({ block: "center" }); // Por ejemplo, si no hay ninguna serie hecha
  }
});

// Al volver a la app (después de bloquear el móvil o cambiar de aplicación)
document.addEventListener("visibilitychange", function () {
  if (document.visibilityState !== "visible") {
    return;
  }
  if (temporizadorCronometro) {
    actualizarCronometro(); // Para que no se vea un momento el tiempo de antes
  }
  avisarSiEsMuyLargo();
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
  inicio: { id: "pantalla-inicio", alEntrar: pintarInicio },
  rutinas: { id: "pantalla-rutinas", padre: "inicio", alEntrar: pintarRutinas },
  "crear-rutina": { id: "pantalla-crear-rutina", padre: "rutinas", alEntrar: abrirCrearRutina },
  "buscar-ejercicio": {
    id: "pantalla-buscar-ejercicio",
    padre: "crear-rutina",
    alEntrar: function () { abrirBuscador({ modo: "rutina" }); }
  },
  "nuevo-ejercicio": {
    id: "pantalla-nuevo-ejercicio",
    padre: "crear-rutina",
    alEntrar: function () { abrirNuevoEjercicio({ modo: "rutina" }); }
  },
  entrenar: { id: "pantalla-elegir-rutina", padre: "inicio", alEntrar: pintarElegirRutina },
  entrenamiento: { id: "pantalla-entrenamiento", padre: "inicio", alEntrar: pintarEntrenamiento },
  historial: { id: "pantalla-historial", padre: "inicio", alEntrar: pintarHistorial },
  progreso: { id: "pantalla-progreso", padre: "inicio", alEntrar: abrirProgreso },
  copia: { id: "pantalla-copia", padre: "inicio", alEntrar: abrirCopia }
};

// Averigua qué pantalla toca según la dirección.
// Las rutinas usan nombres como "predeterminada-cuerpo-completo-a" o "mia-r123",
// y la edición de una rutina propia, "editar-mia-r123".
// Un entrenamiento guardado usa "resumen-t123" justo al terminarlo
// y "historial-t123" cuando se abre desde el historial.
// El calendario de otro mes usa "progreso-2026-09" (y "progreso-2026-09-14" con un día elegido).
function pantallaActual() {
  const nombre = location.hash.slice(1);

  const progreso = nombre.match(/^progreso-(\d{4})-(\d{2})(-\d{2})?$/);
  if (progreso) {
    const anio = Number(progreso[1]);
    const mes = Number(progreso[2]) - 1;
    if (mes >= 0 && mes <= 11) {
      return {
        id: "pantalla-progreso",
        padre: "inicio",
        alEntrar: function () {
          pintarProgreso(anio, mes, progreso[3] ? nombre.slice("progreso-".length) : null);
        }
      };
    }
    return PANTALLAS.progreso;
  }

  // Sin entrenamiento en curso, toca elegir una rutina para empezar uno
  if (nombre === "entrenamiento" && !entrenamientoEnCurso) {
    return PANTALLAS.entrenar;
  }

  // Buscar o crear un ejercicio para el entrenamiento en curso:
  // "entrenamiento-anadir-buscar", "entrenamiento-anadir-crear" (añadirlo al final),
  // "entrenamiento-reemplazar-buscar-2", "entrenamiento-reemplazar-crear-2" (ponerlo en lugar del 2.º)
  const cambio = nombre.match(/^entrenamiento-(anadir|reemplazar)-(buscar|crear)(?:-(\d+))?$/);
  if (cambio) {
    const destino = cambio[1] === "anadir" ? { modo: "anadir" } : { modo: "reemplazar", numero: Number(cambio[3]) };
    const valido = Boolean(entrenamientoEnCurso) &&
      (destino.modo === "anadir" ? !cambio[3] : Boolean(entrenamientoEnCurso.ejercicios[destino.numero - 1]));
    if (!valido) {
      return entrenamientoEnCurso ? PANTALLAS.entrenamiento : PANTALLAS.entrenar;
    }
    const buscar = cambio[2] === "buscar";
    return {
      id: buscar ? "pantalla-buscar-ejercicio" : "pantalla-nuevo-ejercicio",
      padre: "entrenamiento",
      alEntrar: function () {
        if (buscar) {
          abrirBuscador(destino);
        } else {
          abrirNuevoEjercicio(destino);
        }
      }
    };
  }

  const guardado = nombre.match(/^(resumen|historial)-(.+)$/);
  if (guardado) {
    const recienTerminado = guardado[1] === "resumen";
    const entrenamiento = leerLista(CLAVE_ENTRENAMIENTOS).find(function (posible) {
      return posible.id === guardado[2];
    });
    if (entrenamiento) {
      return {
        id: "pantalla-resumen",
        padre: recienTerminado ? "inicio" : "historial",
        alEntrar: function () {
          pintarResumen(entrenamiento, recienTerminado);
        }
      };
    }
    return recienTerminado ? PANTALLAS.inicio : PANTALLAS.historial;
  }

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

  // El cronómetro solo corre en la pantalla del entrenamiento (se vuelve a
  // poner en marcha al entrar), y las ventanas no se quedan abiertas
  // encima de otra pantalla (por ejemplo, al usar la flecha de atrás)
  detenerCronometro();
  document.querySelectorAll("dialog.ventana[open]").forEach(function (ventana) {
    ventana.close();
  });

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
avisarSiEsMuyLargo();


// ============================================================
// FUNCIONAR SIN CONEXIÓN
// Se registra el service worker (sw.js), que guarda los archivos de la
// app para poder abrirla sin internet. Solo funciona cuando la app está
// publicada en una web (https); al abrir index.html directamente desde
// el ordenador no hace nada, y la app funciona igual.
// ============================================================
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("sw.js").catch(function () {
      // Si no se puede, la app sigue funcionando, solo que necesitará internet
    });
  });
}
