// ============================================================
// SERVICE WORKER: LA APP SIN CONEXIÓN
// Es un pequeño programa que el navegador guarda aparte y que se pone
// "en medio" cada vez que la app pide un archivo.
//
// Cómo funciona:
//   1. La primera vez, guarda una copia de todos los archivos de la app.
//   2. Después, cada vez que la app pide un archivo, primero lo intenta
//      descargar de internet (así siempre llega la última versión) y
//      guarda la copia nueva.
//   3. Si no hay internet, o tarda demasiado, usa la copia guardada.
//
// Por eso las versiones nuevas llegan solas: no hace falta cambiar nada
// aquí cada vez que se cambia la app. Solo hay que tocar este archivo si
// se añade, quita o renombra un archivo de la app (lista ARCHIVOS); en ese
// caso, subir también el número de CACHE.
//
// Los datos de cada persona (localStorage) no se guardan aquí ni se tocan.
// ============================================================

const CACHE = "gym-v1";

const ARCHIVOS = [
  "./",
  "./index.html",
  "./estilos.css",
  "./ejercicios.js",
  "./rutinas-predeterminadas.js",
  "./app.js",
  "./manifest.webmanifest",
  "./iconos/icono-180.png",
  "./iconos/icono-192.png",
  "./iconos/icono-512.png"
];

// Si internet tarda más que esto (en milisegundos), se usa la copia guardada.
// Así la app abre rápido aunque haya poca cobertura (por ejemplo, en el gimnasio).
const ESPERA_MAXIMA_RED = 3000;

// Al instalarse: guarda todos los archivos.
// { cache: "reload" } pide los archivos de verdad a internet, no una copia vieja del navegador.
self.addEventListener("install", function (evento) {
  evento.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ARCHIVOS.map(function (archivo) {
        return new Request(archivo, { cache: "reload" });
      }));
    })
  );
  self.skipWaiting(); // La versión nueva de este archivo se usa enseguida, sin esperar
});

// Al activarse: borra las copias de versiones anteriores (si se subió el número de CACHE)
self.addEventListener("activate", function (evento) {
  evento.waitUntil(
    caches.keys()
      .then(function (nombres) {
        return Promise.all(nombres
          .filter(function (nombre) { return nombre !== CACHE; })
          .map(function (nombre) { return caches.delete(nombre); }));
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

// Cada vez que la app pide un archivo de su propia web
self.addEventListener("fetch", function (evento) {
  const peticion = evento.request;
  if (peticion.method !== "GET" || new URL(peticion.url).origin !== location.origin) {
    return; // Lo demás va directo a internet, como siempre
  }
  evento.respondWith(primeroInternet(peticion));
});

async function primeroInternet(peticion) {
  const cache = await caches.open(CACHE);

  // Se pide a internet. { cache: "no-cache" } evita que el navegador
  // devuelva una copia vieja suya en vez de preguntar si hay versión nueva.
  // Si llega bien, se guarda la copia nueva (aunque llegue tarde).
  const desdeInternet = fetch(peticion, { cache: "no-cache" }).then(function (respuesta) {
    if (respuesta.ok) {
      cache.put(peticion, respuesta.clone());
    }
    return respuesta;
  });

  try {
    return await conLimiteDeTiempo(desdeInternet, ESPERA_MAXIMA_RED);
  } catch (error) {
    // Sin internet o tarda demasiado: la copia guardada.
    // Si se abre una dirección de la app que no está guardada, se da la página principal.
    const guardada = await cache.match(peticion, { ignoreSearch: true }) ||
      (peticion.mode === "navigate" ? await cache.match("./index.html") : undefined);
    if (guardada) {
      return guardada;
    }
    return desdeInternet; // No hay copia: se sigue esperando a internet
  }
}

// Falla si la promesa no termina antes de "milisegundos"
function conLimiteDeTiempo(promesa, milisegundos) {
  return new Promise(function (resolver, rechazar) {
    const temporizador = setTimeout(function () {
      rechazar(new Error("Internet tarda demasiado"));
    }, milisegundos);
    promesa.then(
      function (valor) { clearTimeout(temporizador); resolver(valor); },
      function (error) { clearTimeout(temporizador); rechazar(error); }
    );
  });
}
