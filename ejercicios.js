// ============================================================
// LISTA INICIAL DE EJERCICIOS (provisional)
// Es la lista que aparece en el buscador al crear una rutina.
// Para cambiarla, edita esta lista. Cada ejercicio necesita:
//   - id: un nombre corto sin espacios ni tildes, distinto en cada ejercicio.
//         Las rutinas guardan este id, así que no cambies el id de un
//         ejercicio que ya se esté usando (el nombre sí se puede cambiar).
//   - nombre: el que se ve en la app
//   - grupo: el grupo muscular principal
//   - medicion: cómo se mide el ejercicio. Puede ser:
//       "peso"           → se levanta un peso (kg)
//       "peso-corporal"  → se hace con el propio cuerpo (solo repeticiones)
//       "tiempo"         → se aguanta o se hace durante un tiempo
// ============================================================
const EJERCICIOS_BASE = [
  // Piernas
  { id: "sentadilla", nombre: "Sentadilla", grupo: "Piernas", medicion: "peso" },
  { id: "sentadilla-goblet", nombre: "Sentadilla goblet", grupo: "Piernas", medicion: "peso" },
  { id: "sentadilla-sin-peso", nombre: "Sentadilla sin peso", grupo: "Piernas", medicion: "peso-corporal" },
  { id: "prensa-piernas", nombre: "Prensa de piernas", grupo: "Piernas", medicion: "peso" },
  { id: "zancadas", nombre: "Zancadas", grupo: "Piernas", medicion: "peso" },
  { id: "peso-muerto", nombre: "Peso muerto", grupo: "Piernas", medicion: "peso" },
  { id: "peso-muerto-rumano", nombre: "Peso muerto rumano", grupo: "Piernas", medicion: "peso" },
  { id: "extension-cuadriceps", nombre: "Extensión de cuádriceps", grupo: "Piernas", medicion: "peso" },
  { id: "curl-femoral", nombre: "Curl femoral", grupo: "Piernas", medicion: "peso" },
  { id: "hip-thrust", nombre: "Hip thrust", grupo: "Piernas", medicion: "peso" },
  { id: "puente-gluteo", nombre: "Puente de glúteo", grupo: "Piernas", medicion: "peso-corporal" },
  { id: "elevacion-gemelos", nombre: "Elevación de gemelos", grupo: "Piernas", medicion: "peso" },

  // Pecho
  { id: "press-banca", nombre: "Press de banca", grupo: "Pecho", medicion: "peso" },
  { id: "press-inclinado-mancuernas", nombre: "Press inclinado con mancuernas", grupo: "Pecho", medicion: "peso" },
  { id: "aperturas-mancuernas", nombre: "Aperturas con mancuernas", grupo: "Pecho", medicion: "peso" },
  { id: "flexiones", nombre: "Flexiones", grupo: "Pecho", medicion: "peso-corporal" },
  { id: "fondos", nombre: "Fondos en paralelas", grupo: "Pecho", medicion: "peso-corporal" },

  // Espalda
  { id: "dominadas", nombre: "Dominadas", grupo: "Espalda", medicion: "peso-corporal" },
  { id: "jalon-pecho", nombre: "Jalón al pecho", grupo: "Espalda", medicion: "peso" },
  { id: "remo-mancuerna", nombre: "Remo con mancuerna", grupo: "Espalda", medicion: "peso" },
  { id: "remo-barra", nombre: "Remo con barra", grupo: "Espalda", medicion: "peso" },
  { id: "remo-polea-baja", nombre: "Remo en polea baja", grupo: "Espalda", medicion: "peso" },
  { id: "remo-invertido", nombre: "Remo invertido", grupo: "Espalda", medicion: "peso-corporal" },

  // Hombros
  { id: "press-militar-mancuernas", nombre: "Press militar con mancuernas", grupo: "Hombros", medicion: "peso" },
  { id: "press-militar-barra", nombre: "Press militar con barra", grupo: "Hombros", medicion: "peso" },
  { id: "elevaciones-laterales", nombre: "Elevaciones laterales", grupo: "Hombros", medicion: "peso" },
  { id: "face-pull", nombre: "Face pull", grupo: "Hombros", medicion: "peso" },

  // Brazos
  { id: "curl-biceps-mancuernas", nombre: "Curl de bíceps con mancuernas", grupo: "Brazos", medicion: "peso" },
  { id: "curl-biceps-barra", nombre: "Curl de bíceps con barra", grupo: "Brazos", medicion: "peso" },
  { id: "curl-martillo", nombre: "Curl martillo", grupo: "Brazos", medicion: "peso" },
  { id: "extension-triceps-polea", nombre: "Extensión de tríceps en polea", grupo: "Brazos", medicion: "peso" },
  { id: "press-frances", nombre: "Press francés", grupo: "Brazos", medicion: "peso" },
  { id: "fondos-banco", nombre: "Fondos en banco", grupo: "Brazos", medicion: "peso-corporal" },

  // Abdomen
  { id: "plancha", nombre: "Plancha", grupo: "Abdomen", medicion: "tiempo" },
  { id: "plancha-lateral", nombre: "Plancha lateral", grupo: "Abdomen", medicion: "tiempo" },
  { id: "crunch", nombre: "Crunch abdominal", grupo: "Abdomen", medicion: "peso-corporal" },
  { id: "elevacion-piernas", nombre: "Elevación de piernas", grupo: "Abdomen", medicion: "peso-corporal" },

  // Cuerpo completo y cardio
  { id: "burpees", nombre: "Burpees", grupo: "Cuerpo completo", medicion: "peso-corporal" },
  { id: "mountain-climbers", nombre: "Mountain climbers", grupo: "Cuerpo completo", medicion: "tiempo" },
  { id: "comba", nombre: "Saltar a la comba", grupo: "Cardio", medicion: "tiempo" },
  { id: "cinta", nombre: "Cinta de correr", grupo: "Cardio", medicion: "tiempo" }
];
