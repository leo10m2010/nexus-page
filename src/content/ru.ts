import type { Dictionary } from "@types";

/** 1-е, 2-е, 3-е. Используется только для призовых мест. */
const place = (n: number): string => `${n}-е`;

/**
 * Russian. Sentences are phrased so the copula is never omitted, which keeps
 * the page free of em-dashes without producing ungrammatical Russian.
 * Worth a native review before launch.
 */
export const ru: Dictionary = {
  nav: { home: "Главная", about: "О нас", vision: "Видение", contact: "Контакты" },

  cta: {
    community: "Вступить в Discord",
    partnership: "Стать партнёром",
  },

  a11y: {
    skipToContent: "Перейти к содержанию",
    backToTop: "Nexus Series, наверх",
    primaryNav: "Основная навигация",
    openMenu: "Открыть меню",
    closeMenu: "Закрыть меню",
    switchTheme: "Сменить цветовую тему",
    switchLanguage: "Сменить язык",
    broadcastChannels: "Официальные каналы трансляций",
    openSlot: (n, total) => `Свободное партнёрское место ${n} из ${total}`,
  },

  tagline: "Соединяем регионы. Развиваем соревнования.",

  hero: {
    headline: [
      { text: "Соединяем регионы." },
      { text: "Развиваем соревнования.", accent: true },
    ],
    headlineClamp: "clamp(2rem, 5.2vw, 4.5rem)",
    lede: "Киберспортивная соревновательная платформа, созданная чтобы соединять регионы, организации и игроков через структурированные международные турниры.",
  },

  channels: {
    intro: "Прямые трансляции на Twitch на трёх языках.",
    languages: { es: "Испанский", en: "Английский", ru: "Русский" },
  },

  about: {
    eyebrow: "О нас",
    heading: "Создана, чтобы соединять соревнования между регионами.",
    body: [
      "Nexus Series представляет собой киберспортивную соревновательную платформу, созданную чтобы соединять регионы, организации и игроков через структурированные международные турниры.",
      "Наша цель состоит в том, чтобы создать профессиональную соревновательную среду, способную расти между регионами, сохраняя высокие стандарты организации, честности и соревновательного мастерства.",
    ],
  },

  vision: {
    heading: "Создаём следующую связь в соревновательном киберспорте.",
    lede: "Мы стремимся построить устойчивую соревновательную платформу, где организации, игроки и сообщества смогут соединяться через киберспорт высокого уровня.",
    pillars: [
      {
        title: "Соревнование",
        body: "Структурированная среда, созданная для серьёзных и профессиональных соревнований.",
      },
      {
        title: "Связь",
        body: "Создаём новые возможности для команд и сообществ соревноваться между регионами.",
      },
      {
        title: "Рост",
        body: "Строим платформу, способную расширяться вместе с соревновательной киберспортивной экосистемой.",
      },
    ],
  },

  partners: {
    heading: "Партнёры и сотрудничество",
    lede: "Партнёрские места открыты для брендов, которые строят соревновательный киберспорт.",
    slotLabel: "Ваш бренд здесь",
  },

  contact: {
    eyebrow: "Контакты",
    heading: ["Свяжитесь с", "Nexus Series."],
    lede: "Для команд, партнёров, СМИ и деловых запросов.",
  },

  competition: {
    navLabel: "Турниры",
    eyebrow: "Турниры",
    heading: "Турниры, команды и результаты.",
    lede: "Все турниры Nexus Series, команды которые в них играют, ближайшие матчи и итоговые результаты.",
    tournaments: "Турниры",
    schedule: "Расписание",
    results: "Результаты",
    teams: "Команды",
    empty: "Пока ничего не запланировано.",
    status: { upcoming: "Скоро", live: "В эфире", finished: "Завершён" },
    format: {
      doubleElimination: "Двойное выбывание",
      singleElimination: "Одиночное выбывание",
      roundRobin: "Круговая система",
      swiss: "Швейцарская система",
    },
    stage: {
      groupStage: "Групповой этап",
      lowerRound: "Нижняя сетка",
      quarterfinal: "Четвертьфинал",
      semifinal: "Полуфинал",
      upperFinal: "Финал верхней сетки",
      lowerFinal: "Финал нижней сетки",
      final: "Финал",
      grandFinal: "Гранд-финал",
      thirdPlace: "Матч за третье место",
    },
    teamCount: (n) => `Команд: ${n}`,
    timeZoneNote: "Всё время указано в UTC.",
    section: {
      overview: "Обзор",
      format: "Формат",
      participants: "Участники",
      standings: "Таблица",
      bracket: "Сетка",
      matches: "Матчи",
    },
    info: {
      organizer: "Организатор",
      venue: "Формат проведения",
      location: "Место",
      dates: "Даты",
      prizePool: "Призовой фонд",
      teams: "Команды",
      format: "Формат",
      broadcast: "Трансляция",
    },
    venue: { online: "Онлайн", offline: "LAN", hybrid: "Онлайн и LAN" },
    qualification: {
      invited: "Приглашение",
      qualifier: "Квалификация",
      regional: "Региональный слот",
      defending: "Действующий чемпион",
    },
    phase: {
      qualifier: "Квалификация",
      groupStage: "Групповой этап",
      swissStage: "Швейцарка",
      playoffs: "Плей-офф",
      finals: "Финалы",
    },
    bracketSide: { upper: "Верхняя сетка", lower: "Нижняя сетка", final: "Гранд-финал" },
    prizeHead: { place: "Место", prize: "Приз", team: "Команда" },
    standingsHead: { team: "Команда", series: "Серии", maps: "Карты", diff: "Разн." },
    bestOf: (n) => `Bo${n}`,
    advance: (n) => `Проходят: ${n}`,
    round: (n) => `Раунд ${n}`,
    place,
    placeRange: (from, to) => `${place(from)} - ${place(to)}`,
    tbd: "Будет определено",
    roster: "Состав",
    allTournaments: "Все турниры",
    viewTournament: "Страница турнира",
  },
  footer: { rights: "Все права защищены." },
};
