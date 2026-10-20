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
const VERSION_DATOS = 1;

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

  // Cuando exista la versión 2, aquí irá algo así:
  // if (version === 1) {
  //   datos = ...convertir los datos...;
  //   version = 2;
  // }

  return datos;
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
  if (!guardarDatos(CLAVE_MIS_EJERCICIOS, misEjercicios)) {
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

// "Última vez: 40 kg x 10": la última serie de ese ejercicio en el
// entrenamiento guardado más reciente que lo tenga. null si nunca se hizo.
function textoUltimaVez(idEjercicio, entrenamientos) {
  for (let i = entrenamientos.length - 1; i >= 0; i--) {
    const ejercicio = entrenamientos[i].ejercicios.find(function (hecho) {
      return hecho.id === idEjercicio;
    });
    if (ejercicio && ejercicio.series.length > 0) {
      const ultimaSerie = ejercicio.series[ejercicio.series.length - 1];
      return "Última vez: " + textoSerie(ultimaSerie, ejercicio.medicion);
    }
  }
  return null;
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
    const series = [];
    for (let i = 0; i < SERIES_POR_DEFECTO; i++) {
      series.push(serieVacia(ejercicio.medicion));
    }
    ejercicios.push({ id: ejercicio.id, nombre: ejercicio.nombre, medicion: ejercicio.medicion, series: series });
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

  const anteriores = leerLista(CLAVE_ENTRENAMIENTOS);
  const contenedor = document.getElementById("entreno-ejercicios");
  contenedor.innerHTML = "";
  entrenamientoEnCurso.ejercicios.forEach(function (ejercicio) {
    contenedor.appendChild(crearBloqueEjercicio(ejercicio, anteriores));
  });

  document.getElementById("error-entreno").hidden = true;
}

// Lo que pasa cada vez que se escribe algo o se marca una casilla
function alCambiarEntrenamiento() {
  guardarEntrenamientoEnCurso();
  document.getElementById("error-entreno").hidden = true;
}

// El bloque de un ejercicio: nombre, "Última vez", filas de series y botones
function crearBloqueEjercicio(ejercicio, anteriores) {
  const bloque = document.createElement("div");
  bloque.className = "bloque-ejercicio";

  const titulo = document.createElement("h3");
  titulo.className = "bloque-titulo";
  titulo.textContent = ejercicio.nombre;
  bloque.appendChild(titulo);

  const ultimaVez = textoUltimaVez(ejercicio.id, anteriores);
  if (ultimaVez) {
    const referencia = document.createElement("p");
    referencia.className = "ultima-vez";
    referencia.textContent = ultimaVez;
    bloque.appendChild(referencia);
  }

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
    const tieneDatos = ultima.hecha || campos.some(function (campo) {
      return ultima[campo.nombre].trim() !== "";
    });
    if (tieneDatos && !confirm("La serie " + ejercicio.series.length + " tiene datos apuntados. ¿Quitarla?")) {
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

    if (seriesHechas.length > 0) {
      ejerciciosHechos.push({ id: ejercicio.id, nombre: ejercicio.nombre, medicion: ejercicio.medicion, series: seriesHechas });
    }
  }

  if (ejerciciosHechos.length === 0) {
    mostrarError(error, "Marca como hecha al menos una serie (la casilla de la derecha). Si no quieres guardar nada, pulsa «Cancelar entrenamiento».");
    return;
  }

  if (haySeriesSinMarcar) {
    const seguro = confirm("Hay series con datos que no están marcadas como hechas. Esas no se guardarán. ¿Terminar igualmente?");
    if (!seguro) {
      return;
    }
  }

  const entrenamiento = {
    id: entrenamientoEnCurso.id,
    fecha: new Date().toISOString(),
    inicio: entrenamientoEnCurso.inicio,
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

// "Cancelar entrenamiento" pregunta antes de tirar lo apuntado
document.getElementById("boton-cancelar-entreno").addEventListener("click", function () {
  const seguro = confirm("¿Seguro que quieres cancelar el entrenamiento? Se perderá todo lo que has apuntado.");
  if (!seguro) {
    return;
  }
  descartarEntrenamientoEnCurso();
  volver();
});


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

// Rellena la pantalla "Historial": una tarjeta por entrenamiento, del más reciente al más antiguo
function pintarHistorial() {
  const entrenamientos = leerLista(CLAVE_ENTRENAMIENTOS).slice().sort(function (a, b) {
    return b.fecha.localeCompare(a.fecha); // Las fechas guardadas se pueden comparar como texto
  });

  const lista = document.getElementById("lista-historial");
  lista.innerHTML = "";
  entrenamientos.forEach(function (entrenamiento) {
    const subtitulo = entrenamiento.rutina.nombre + " · " + textoCantidad(entrenamiento) + " · " + textoSeries(entrenamiento);
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
  const minutos = Math.round((fin - new Date(entrenamiento.inicio)) / 60000);

  const fecha = fechaLegibleTitulo(fin) + ", " + fin.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  const duracion = minutos < 1 ? "menos de 1 min" : minutos + " min";

  document.getElementById("resumen-titulo").textContent = recienTerminado ? "¡Entrenamiento guardado!" : "Entrenamiento";
  document.getElementById("boton-resumen-listo").textContent = recienTerminado ? "Volver al inicio" : "Volver al historial";
  document.getElementById("error-resumen").hidden = true;
  document.getElementById("resumen-rutina").textContent = entrenamiento.rutina.nombre;
  document.getElementById("resumen-datos").textContent = fecha + " · " + duracion + " · " + textoSeries(entrenamiento);

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
  "buscar-ejercicio": { id: "pantalla-buscar-ejercicio", padre: "crear-rutina", alEntrar: abrirBuscador },
  "nuevo-ejercicio": { id: "pantalla-nuevo-ejercicio", padre: "crear-rutina", alEntrar: abrirNuevoEjercicio },
  entrenar: { id: "pantalla-elegir-rutina", padre: "inicio", alEntrar: pintarElegirRutina },
  entrenamiento: { id: "pantalla-entrenamiento", padre: "inicio", alEntrar: pintarEntrenamiento },
  historial: { id: "pantalla-historial", padre: "inicio", alEntrar: pintarHistorial },
  progreso: { id: "pantalla-proximamente", titulo: "Progreso", padre: "historial" }
};

// Averigua qué pantalla toca según la dirección.
// Las rutinas usan nombres como "predeterminada-cuerpo-completo-a" o "mia-r123",
// y la edición de una rutina propia, "editar-mia-r123".
// Un entrenamiento guardado usa "resumen-t123" justo al terminarlo
// y "historial-t123" cuando se abre desde el historial.
function pantallaActual() {
  const nombre = location.hash.slice(1);

  // Sin entrenamiento en curso, toca elegir una rutina para empezar uno
  if (nombre === "entrenamiento" && !entrenamientoEnCurso) {
    return PANTALLAS.entrenar;
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
