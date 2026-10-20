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
  { id: "sentadilla-bulgara", nombre: "Sentadilla búlgara", grupo: "Piernas", medicion: "peso" },
  { id: "curl-femoral-tumbado", nombre: "Curl femoral tumbado", grupo: "Piernas", medicion: "peso" },
  { id: "abductores", nombre: "Abductores", grupo: "Piernas", medicion: "peso" },
  { id: "aductores", nombre: "Aductores", grupo: "Piernas", medicion: "peso" },

  // Pecho
  { id: "press-banca", nombre: "Press de banca", grupo: "Pecho", medicion: "peso" },
  { id: "press-inclinado-mancuernas", nombre: "Press inclinado con mancuernas", grupo: "Pecho", medicion: "peso" },
  { id: "aperturas-mancuernas", nombre: "Aperturas con mancuernas", grupo: "Pecho", medicion: "peso" },
  { id: "flexiones", nombre: "Flexiones", grupo: "Pecho", medicion: "peso-corporal" },
  { id: "fondos", nombre: "Fondos en paralelas", grupo: "Pecho", medicion: "peso-corporal" },
  { id: "press-pecho-maquina", nombre: "Press de pecho en máquina", grupo: "Pecho", medicion: "peso" },
  { id: "aperturas-maquina", nombre: "Aperturas en máquina (pec deck)", grupo: "Pecho", medicion: "peso" },
  { id: "cruces-polea", nombre: "Cruces en polea", grupo: "Pecho", medicion: "peso" },

  // Espalda
  { id: "dominadas", nombre: "Dominadas", grupo: "Espalda", medicion: "peso-corporal" },
  { id: "jalon-pecho", nombre: "Jalón al pecho", grupo: "Espalda", medicion: "peso" },
  { id: "remo-mancuerna", nombre: "Remo con mancuerna", grupo: "Espalda", medicion: "peso" },
  { id: "remo-barra", nombre: "Remo con barra", grupo: "Espalda", medicion: "peso" },
  { id: "remo-polea-baja", nombre: "Remo en polea baja", grupo: "Espalda", medicion: "peso" },
  { id: "remo-invertido", nombre: "Remo invertido", grupo: "Espalda", medicion: "peso-corporal" },
  { id: "remo-maquina", nombre: "Remo en máquina", grupo: "Espalda", medicion: "peso" },
  { id: "remo-t", nombre: "Remo en T", grupo: "Espalda", medicion: "peso" },
  { id: "pullover-polea", nombre: "Pullover en polea", grupo: "Espalda", medicion: "peso" },

  // Hombros
  { id: "press-militar-mancuernas", nombre: "Press militar con mancuernas", grupo: "Hombros", medicion: "peso" },
  { id: "press-militar-barra", nombre: "Press militar con barra", grupo: "Hombros", medicion: "peso" },
  { id: "elevaciones-laterales", nombre: "Elevaciones laterales", grupo: "Hombros", medicion: "peso" },
  { id: "face-pull", nombre: "Face pull", grupo: "Hombros", medicion: "peso" },
  { id: "elevaciones-frontales", nombre: "Elevaciones frontales", grupo: "Hombros", medicion: "peso" },
  { id: "vuelos-posteriores", nombre: "Vuelos posteriores (pec deck)", grupo: "Hombros", medicion: "peso" },
  { id: "remo-menton", nombre: "Remo al mentón", grupo: "Hombros", medicion: "peso" },

  // Brazos
  { id: "curl-biceps-mancuernas", nombre: "Curl de bíceps con mancuernas", grupo: "Brazos", medicion: "peso" },
  { id: "curl-biceps-barra", nombre: "Curl de bíceps con barra", grupo: "Brazos", medicion: "peso" },
  { id: "curl-martillo", nombre: "Curl martillo", grupo: "Brazos", medicion: "peso" },
  { id: "extension-triceps-polea", nombre: "Extensión de tríceps en polea", grupo: "Brazos", medicion: "peso" },
  { id: "press-frances", nombre: "Press francés", grupo: "Brazos", medicion: "peso" },
  { id: "fondos-banco", nombre: "Fondos en banco", grupo: "Brazos", medicion: "peso-corporal" },

  // Bíceps
  { id: "curl-martillo-polea", nombre: "Curl martillo en polea", grupo: "Bíceps", medicion: "peso" },
  { id: "curl-predicador-barra", nombre: "Curl predicador barra", grupo: "Bíceps", medicion: "peso" },
  { id: "curl-predicador-mancuernas", nombre: "Curl predicador mancuernas", grupo: "Bíceps", medicion: "peso" },
  { id: "curl-predicador", nombre: "Curl predicador", grupo: "Bíceps", medicion: "peso" },
  { id: "curl-predicador-maquina", nombre: "Curl predicador máquina", grupo: "Bíceps", medicion: "peso" },
  { id: "curl-polea", nombre: "Curl en polea", grupo: "Bíceps", medicion: "peso" },
  { id: "curl-concentrado", nombre: "Curl concentrado", grupo: "Bíceps", medicion: "peso" },
  { id: "curl-arana", nombre: "Curl araña", grupo: "Bíceps", medicion: "peso" },
  { id: "curl-bayesian", nombre: "Curl bayesian", grupo: "Bíceps", medicion: "peso" },

  // Tríceps
  { id: "patada-triceps", nombre: "Patada de tríceps", grupo: "Tríceps", medicion: "peso" },
  { id: "extension-sobre-cabeza", nombre: "Extensión sobre la cabeza", grupo: "Tríceps", medicion: "peso" },
  { id: "press-cerrado", nombre: "Press cerrado", grupo: "Tríceps", medicion: "peso" },

  // Abdomen
  { id: "plancha", nombre: "Plancha", grupo: "Abdomen", medicion: "tiempo" },
  { id: "plancha-lateral", nombre: "Plancha lateral", grupo: "Abdomen", medicion: "tiempo" },
  { id: "crunch", nombre: "Crunch abdominal", grupo: "Abdomen", medicion: "peso-corporal" },
  { id: "elevacion-piernas", nombre: "Elevación de piernas", grupo: "Abdomen", medicion: "peso-corporal" },
  { id: "rueda-abdominal", nombre: "Rueda abdominal", grupo: "Abdomen", medicion: "peso-corporal" },
  { id: "encogimientos-polea", nombre: "Encogimientos en polea", grupo: "Abdomen", medicion: "peso" },

  // Calistenia
  { id: "flexiones-diamante", nombre: "Flexiones diamante", grupo: "Calistenia", medicion: "peso-corporal" },
  { id: "pino-pared", nombre: "Pino contra la pared", grupo: "Calistenia", medicion: "tiempo" },
  { id: "l-sit", nombre: "L-sit", grupo: "Calistenia", medicion: "tiempo" },
  { id: "muscle-up", nombre: "Muscle-up", grupo: "Calistenia", medicion: "peso-corporal" },

  // Cuerpo completo y cardio
  { id: "burpees", nombre: "Burpees", grupo: "Cuerpo completo", medicion: "peso-corporal" },
  { id: "mountain-climbers", nombre: "Mountain climbers", grupo: "Cuerpo completo", medicion: "tiempo" },
  { id: "comba", nombre: "Saltar a la comba", grupo: "Cardio", medicion: "tiempo" },
  { id: "cinta", nombre: "Cinta de correr", grupo: "Cardio", medicion: "tiempo" }
];
