import type { Dictionary } from "@types";

/**
 * Spanish. `headlineClamp` is lower than English on purpose: the translated
 * headline is wider and would break the two-line rule at 1280px otherwise.
 */
export const es: Dictionary = {
  nav: { home: "Inicio", about: "Quiénes somos", vision: "Visión", contact: "Contacto" },

  cta: {
    community: "Únete al Discord",
    partnership: "Hazte socio",
  },

  a11y: {
    skipToContent: "Ir al contenido",
    backToTop: "Nexus Series, volver arriba",
    primaryNav: "Principal",
    openMenu: "Abrir menú",
    closeMenu: "Cerrar menú",
    switchTheme: "Cambiar el tema de color",
    switchLanguage: "Cambiar de idioma",
    broadcastChannels: "Canales oficiales de transmisión",
    openSlot: (n, total) => `Espacio de patrocinio libre ${n} de ${total}`,
  },

  tagline: "Conectamos regiones. Elevamos la competición.",

  hero: {
    headline: [
      { text: "Conectamos regiones." },
      { text: "Elevamos la competición.", accent: true },
    ],
    headlineClamp: "clamp(1.85rem, 4.9vw, 4rem)",
    lede: "Una plataforma de competición de esports creada para conectar regiones, organizaciones y jugadores mediante competición internacional estructurada.",
  },

  channels: {
    intro: "En directo en Twitch en tres idiomas.",
    languages: { es: "Español", en: "Inglés", ru: "Ruso" },
  },

  about: {
    eyebrow: "Quiénes somos",
    heading: "Creada para conectar la competición entre regiones.",
    body: [
      "Nexus Series es una plataforma de competición de esports creada para conectar regiones, organizaciones y jugadores mediante competición internacional estructurada.",
      "Nuestro objetivo es crear un entorno competitivo profesional capaz de crecer entre regiones, manteniendo estándares sólidos de organización, integridad y excelencia competitiva.",
    ],
  },

  vision: {
    heading: "Construimos la próxima conexión en los esports competitivos.",
    lede: "Queremos construir una plataforma competitiva sostenible donde organizaciones, jugadores y comunidades puedan conectarse mediante competición de esports de alto nivel.",
    pillars: [
      {
        title: "Competición",
        body: "Entornos estructurados diseñados para sostener una competición seria y profesional.",
      },
      {
        title: "Conexión",
        body: "Creamos nuevas oportunidades para que equipos y comunidades compitan entre regiones.",
      },
      {
        title: "Crecimiento",
        body: "Construimos una plataforma capaz de expandirse junto al ecosistema competitivo de los esports.",
      },
    ],
  },

  partners: {
    heading: "Socios y colaboradores",
    lede: "Hay espacios de patrocinio abiertos para marcas que construyen en los esports competitivos.",
    slotLabel: "Tu marca aquí",
  },

  contact: {
    eyebrow: "Contacto",
    heading: ["Conecta con", "Nexus Series."],
    lede: "Para equipos, socios, medios y consultas comerciales.",
  },

  competition: {
    navLabel: "Torneos",
    eyebrow: "Competición",
    heading: "Torneos, equipos y resultados.",
    lede: "Todos los torneos de Nexus Series, los equipos que compiten en ellos, lo que viene y cómo terminó.",
    tournaments: "Torneos",
    schedule: "Calendario",
    results: "Resultados",
    teams: "Equipos",
    empty: "Todavía no hay nada programado.",
    status: { upcoming: "Próximo", live: "En directo", finished: "Finalizado" },
    format: {
      doubleElimination: "Doble eliminación",
      singleElimination: "Eliminación directa",
      roundRobin: "Todos contra todos",
      swiss: "Sistema suizo",
    },
    stage: {
      groupStage: "Fase de grupos",
      quarterfinal: "Cuartos de final",
      semifinal: "Semifinal",
      final: "Final",
      thirdPlace: "Tercer puesto",
    },
    teamCount: (n) => `${n} equipos`,
    timeZoneNote: "Todos los horarios en UTC.",
  },
  footer: { rights: "Todos los derechos reservados." },
};
