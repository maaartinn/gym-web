// ============================================================
// NOMBRE DE LA APP
// Para cambiar el nombre, cámbialo solo aquí. Se usa en el título de la
// pestaña, en el nombre bajo el icono del iPhone, en el texto alternativo
// del logo de la cabecera y encima del calendario.
// (El archivo manifest.webmanifest no puede leer este código: allí hay
// que escribir también el nombre a mano, en "name" y "short_name".)
//
// Este archivo se carga en <head>, antes que nada, para que el título
// de la pestaña salga bien desde el principio.
// ============================================================
const NOMBRE_APP = "OneStep";

document.title = NOMBRE_APP;
document.querySelector('meta[name="apple-mobile-web-app-title"]').content = NOMBRE_APP;
