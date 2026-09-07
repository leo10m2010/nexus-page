import type { Locale } from "@types";

export interface MediakitCopy {
  metaTitle: string;
  metaDescription: string;
  documentLabel: string;
  talk: string;
  requestProposal: string;
  explore: string;
  home: string;
  online: string;
  region: string;
  heroLines: [string, string, string];
  heroCopy: string;
  nav: {
    tournament: string;
    schedule: string;
    broadcast: string;
    visibility: string;
    season: string;
    contact: string;
  };
  tournamentTitle: [string, string];
  tournamentCopy: string;
  prizePool: string;
  participants: string;
  teamsLabel: string;
  dates: string;
  teamsTitle: string;
  invited: string;
  tournamentLink: string;
  liquipediaLink: string;
  liquipediaNote: string;
  scheduleTitle: [string, string];
  scheduleCopy: string;
  scheduleNote: string;
  group: string;
  openingMatches: string;
  fullSchedule: string;
  versus: string;
  broadcastTitle: [string, string];
  broadcastCopy: string;
  previewLabel: string;
  previewNote: string;
  sponsorPlaceholder: string;
  sponsorSlot: string;
  broadcastScenes: [
    { label: string; title: string; description: string },
    { label: string; title: string; description: string },
    { label: string; title: string; description: string },
    { label: string; title: string; description: string },
  ];
  visibilityTitle: [string, string];
  visibilityCopy: string;
  placements: [
    { title: string; description: string; items: string[] },
    { title: string; description: string; items: string[] },
    { title: string; description: string; items: string[] },
    { title: string; description: string; items: string[] },
  ];
  channelsTitle: string;
  officialChannels: string;
  socialPages: string;
  languageNames: { ES: string; EN: string; RU: string };
  coStreamNote: string;
  seasonTitle: [string, string];
  seasonCopy: string;
  currentEdition: string;
  nextEdition: string;
  announcedPrize: string;
  seasonValue: string;
  seasonCta: string;
  proposalTitle: [string, string];
  proposalCopy: string;
  proposalSteps: [
    { title: string; description: string },
    { title: string; description: string },
    { title: string; description: string },
  ];
  termsNote: string;
  contactTitle: [string, string];
  contactCopy: string;
  emailSubject: string;
  emailBody: string;
  footer: string;
  scheduleToggle: string;
  channelsToggle: string;
  proposalToggle: string;
  previewExpand: string;
  previewHighlight: string;
  previewOriginal: string;
}

export const mediakitCopy = {
  es: {
    metaTitle: "Nexus | Alianzas y patrocinio",
    metaDescription: "Consulta el torneo, el calendario y los espacios de patrocinio de Nexus en transmisiones y redes sociales, para esta edición y futuros torneos.",
    documentLabel: "Media kit · Alianzas comerciales",
    talk: "Hablemos",
    requestProposal: "Solicitar propuesta",
    explore: "Ver espacios de patrocinio",
    home: "Inicio",
    online: "En línea",
    region: "Región",
    heroLines: ["Tu marca.", "En Nexus", "Series."],
    heroCopy: "Opciones de patrocinio en las transmisiones y redes sociales de Nexus. Acordamos los espacios, las menciones y las fechas según los objetivos de tu marca.",
    nav: {
      tournament: "Torneo",
      schedule: "Calendario",
      broadcast: "Transmisión",
      visibility: "Patrocinio",
      season: "Próximas ediciones",
      contact: "Contacto",
    },
    tournamentTitle: ["Dota 2", "en Sudamérica."],
    tournamentCopy: "Ocho equipos compiten en este torneo de Dota 2 sudamericano. Consulta los participantes, el formato y la bolsa de premios.",
    prizePool: "Bolsa de premios",
    participants: "Participantes",
    teamsLabel: "Equipos",
    dates: "Fechas",
    teamsTitle: "Equipos del torneo",
    invited: "Invitados",
    tournamentLink: "Ver el torneo",
    liquipediaLink: "Consultar en Liquipedia",
    liquipediaNote: "Referencia externa para consultar la información competitiva; no implica afiliación ni aval comercial.",
    scheduleTitle: ["Partidos", "y horarios."],
    scheduleCopy: "Consulta los partidos en horario de Perú y de Europa Central para planificar las apariciones de tu marca.",
    scheduleNote: "Fechas de Perú (PET). +1 indica el día siguiente en Europa Central. Horarios sujetos a cambios.",
    group: "Grupo",
    openingMatches: "Partidos de apertura",
    fullSchedule: "Ver calendario completo",
    versus: "contra",
    broadcastTitle: ["Tu marca,", "dentro de la transmisión."],
    broadcastCopy: "Estos ejemplos muestran espacios para tu logo en distintas pantallas de la transmisión. El HUD es el conjunto de gráficos superpuestos en la transmisión, como marcos y paneles de información.",
    previewLabel: "Ejemplos de pantallas de transmisión",
    previewNote: "Diseños de referencia, no una transmisión en vivo. Los logos, jugadores y horarios de las artes son ilustrativos. Los espacios y menciones de tu marca se acuerdan en la propuesta.",
    sponsorPlaceholder: "TU MARCA",
    sponsorSlot: "Ejemplo de espacio para el logo del patrocinador",
    broadcastScenes: [
      { label: "Espera", title: "Antes del partido", description: "Ejemplo de espacio para tu logo en la pantalla de espera, junto a la información de la jornada." },
      { label: "Selección", title: "Selección de héroes", description: "La marca se integra entre la zona de transmisión y el panel de selecciones, sin cubrir la información de los equipos." },
      { label: "Jugadores", title: "Presentación de jugadores", description: "Ejemplo de espacio para tu logo junto a la lista de jugadores, separado de sus nombres y datos." },
      { label: "Partida", title: "Durante el partido", description: "Ejemplo de logo en el borde de la pantalla, sin cubrir la información del juego. El equipo de transmisión debe confirmar que la ubicación sea viable." },
    ],
    visibilityTitle: ["Espacios", "de patrocinio"],
    visibilityCopy: "Cuatro opciones para mostrar o mencionar tu marca. Los formatos y la disponibilidad se acuerdan en la propuesta.",
    placements: [
      { title: "Banners", description: "Tu identidad visual en anuncios, programación y resultados del torneo.", items: ["Ubicación y formato por acuerdo", "Cantidad y periodo de exhibición definidos en la propuesta"] },
      { title: "Redes sociales", description: "Menciones y etiquetado de tu marca en publicaciones de las páginas de Nexus.", items: ["Anuncio de la alianza y contenido del torneo", "Cantidad de publicaciones y frecuencia acordadas"] },
      { title: "Transmisiones oficiales", description: "Tu logo en pantalla y menciones del equipo de transmisión, con frecuencia, duración e idiomas por acuerdo.", items: ["Gráficos en pantalla y mensajes de marca aprobados", "Frecuencia, duración e idiomas definidos por edición"] },
      { title: "Transmisiones de creadores", description: "Banners y menciones en canales de creadores que transmitan el torneo, sujetos a su confirmación y acuerdo.", items: ["Participación sujeta a confirmación del creador", "Formato y frecuencia acordados con cada canal"] },
    ],
    channelsTitle: "Canales de Nexus",
    officialChannels: "Canales oficiales",
    socialPages: "Perfiles sociales",
    languageNames: { ES: "Español", EN: "Inglés", RU: "Ruso" },
    coStreamNote: "Las transmisiones de creadores (co-streams) son independientes de los canales oficiales. Mencionar un canal no confirma que vaya a transmitir el torneo ni a promocionar una marca.",
    seasonTitle: ["Esta edición", "y las que vienen."],
    seasonCopy: "Puedes consultar opciones de patrocinio para esta edición y las próximas de Nexus. Los espacios y las condiciones se acuerdan para cada torneo.",
    currentEdition: "Edición actual",
    nextEdition: "Próxima edición",
    announcedPrize: "Premio anunciado",
    seasonValue: "Tu logo y materiales de marca pueden adaptarse a cada edición, con publicaciones y apariciones en pantalla acordadas por separado.",
    seasonCta: "Planificar próximas ediciones",
    proposalTitle: ["Tus objetivos.", "Una propuesta a medida."],
    proposalCopy: "Acordemos dónde aparecerá tu marca, qué materiales se necesitan y quién debe aprobarlos antes de su publicación.",
    proposalSteps: [
      { title: "Cuéntanos tus objetivos", description: "Indica qué quieres conseguir, en qué mercados, en qué fechas y con qué presupuesto de referencia." },
      { title: "Elijamos los espacios", description: "Seleccionamos torneos, canales y formatos; comprobamos la disponibilidad y los materiales necesarios." },
      { title: "Acordemos el trabajo", description: "Definimos las publicaciones, las apariciones de marca, las fechas, las aprobaciones y las condiciones antes de empezar." },
    ],
    termsNote: "Cantidades, frecuencias, idiomas, derechos de uso, exclusividad, presupuesto y participación de creadores se establecen por contrato. No se prometen impresiones ni resultados comerciales.",
    contactTitle: ["Hablemos", "de tu marca."],
    contactCopy: "Escríbenos con tu objetivo, las ediciones que te interesan y un presupuesto de referencia para consultar disponibilidad y solicitar una propuesta.",
    emailSubject: "Consulta de patrocinio y alianzas | Nexus",
    emailBody: "Hola, equipo de Nexus Series:\n\nNos interesa recibir una propuesta de patrocinio.\n\nMarca o empresa:\nEdiciones de interés:\nObjetivo de la colaboración:\nEspacios de interés (banners, redes, transmisión o creadores):\nPresupuesto orientativo (opcional):\nNombre y contacto:\n\nGracias.",
    footer: "Nexus · Patrocinio con condiciones acordadas por edición.",
    scheduleToggle: "Ver partidos y horarios de Perú / Europa Central",
    channelsToggle: "Consultar canales y redes de Nexus",
    proposalToggle: "Proceso y condiciones del patrocinio",
    previewExpand: "Ver diseño completo",
    previewHighlight: "Señalar espacios de marca",
    previewOriginal: "Diseño de transmisión",
  },
  en: {
    metaTitle: "Nexus | Partnerships & Sponsorship",
    metaDescription: "View the Nexus tournament, schedule and sponsorship spaces on broadcasts and social media for this edition and future tournaments.",
    documentLabel: "Media kit · Brand partnerships",
    talk: "Let's talk",
    requestProposal: "Request a proposal",
    explore: "View sponsorship spaces",
    home: "Home",
    online: "Online",
    region: "Region",
    heroLines: ["Your brand.", "At Nexus", "Series."],
    heroCopy: "Sponsorship options on Nexus broadcasts and social media. We agree on placements, mentions and dates based on your brand's goals.",
    nav: {
      tournament: "Tournament",
      schedule: "Schedule",
      broadcast: "Broadcast",
      visibility: "Sponsorship",
      season: "Future editions",
      contact: "Contact",
    },
    tournamentTitle: ["Dota 2", "in South America."],
    tournamentCopy: "Eight teams compete in this South American Dota 2 tournament. View the participants, format and prize pool.",
    prizePool: "Prize pool",
    participants: "Participants",
    teamsLabel: "Teams",
    dates: "Dates",
    teamsTitle: "Tournament teams",
    invited: "Invited",
    tournamentLink: "View the tournament",
    liquipediaLink: "View on Liquipedia",
    liquipediaNote: "An external reference for tournament information, not an indication of affiliation or commercial endorsement.",
    scheduleTitle: ["Matches", "and times."],
    scheduleCopy: "Check matches in Peru and Central European time to plan when your brand will appear.",
    scheduleNote: "Dates use Peru time (PET). +1 means the next day in Central Europe. Times are subject to change.",
    group: "Group",
    openingMatches: "Opening matches",
    fullSchedule: "View full schedule",
    versus: "vs.",
    broadcastTitle: ["Your brand,", "part of the broadcast."],
    broadcastCopy: "These examples show spaces for your logo on different broadcast screens. HUD refers to graphics overlaid on the broadcast, such as frames and information panels.",
    previewLabel: "Broadcast screen examples",
    previewNote: "Reference designs, not a live broadcast. Logos, players and times in the artwork are illustrative. Your brand's placements and mentions are agreed in the proposal.",
    sponsorPlaceholder: "YOUR BRAND",
    sponsorSlot: "Example space for a sponsor logo",
    broadcastScenes: [
      { label: "Waiting", title: "Before the match", description: "Example space for your logo on the waiting screen, alongside information about the day's matches." },
      { label: "Hero selection", title: "Teams choosing their heroes", description: "Branding sits between the broadcast area and the selection panel, keeping team information unobstructed." },
      { label: "Players", title: "Player introductions", description: "Example space for your logo alongside the player list, separate from names and player information." },
      { label: "Game", title: "During the match", description: "Example logo at the edge of the screen, without covering game information. The broadcast team must confirm that the placement is feasible." },
    ],
    visibilityTitle: ["Sponsorship", "opportunities"],
    visibilityCopy: "Four options for displaying or mentioning your brand. Formats and availability are agreed in the proposal.",
    placements: [
      { title: "Banners", description: "Your visual identity across tournament announcements, schedules and results.", items: ["Placement and format by agreement", "Quantity and display period defined in the proposal"] },
      { title: "Social media", description: "Brand mentions and tags in posts on Nexus social pages.", items: ["Partnership announcements and tournament content", "Post count and publishing frequency agreed in advance"] },
      { title: "Official broadcasts", description: "Your logo on screen and mentions by the broadcast team, with frequency, duration and languages subject to agreement.", items: ["On-screen graphics and approved brand messages", "Frequency, duration and languages defined per edition"] },
      { title: "Creator broadcasts", description: "Banners and mentions on creators' tournament broadcasts, subject to their confirmation and agreement.", items: ["Participation subject to creator confirmation", "Format and frequency agreed with each channel"] },
    ],
    channelsTitle: "Nexus channels",
    officialChannels: "Official channels",
    socialPages: "Social profiles",
    languageNames: { ES: "Spanish", EN: "English", RU: "Russian" },
    coStreamNote: "Creator broadcasts (co-streams) are independent of the official channels. Mentioning a channel does not confirm that it will cover the tournament or promote a brand.",
    seasonTitle: ["This edition", "and what comes next."],
    seasonCopy: "Ask about sponsorship options for this Nexus edition and future editions. Placements and terms are agreed for each tournament.",
    currentEdition: "Current edition",
    nextEdition: "Next edition",
    announcedPrize: "Announced prize pool",
    seasonValue: "Your logo and brand materials can be adapted for each edition, with posts and on-screen appearances agreed separately.",
    seasonCta: "Plan future editions",
    proposalTitle: ["Your objectives.", "A tailored proposal."],
    proposalCopy: "Let's agree on where your brand will appear, which materials are needed and who must approve them before publication.",
    proposalSteps: [
      { title: "Tell us your goals", description: "Share what you want to achieve, your target markets, dates and approximate budget." },
      { title: "Choose placements", description: "We select tournaments, channels and formats, then check availability and the materials needed." },
      { title: "Agree on the work", description: "We define posts, brand appearances, dates, approvals and terms before work begins." },
    ],
    termsNote: "Quantities, frequencies, languages, usage rights, exclusivity, budget and creator participation are established by contract. No impressions or commercial results are promised.",
    contactTitle: ["Let's talk", "about your brand."],
    contactCopy: "Send us your goals, the editions you are interested in and an approximate budget to check availability and request a proposal.",
    emailSubject: "Sponsorship and partnership inquiry | Nexus",
    emailBody: "Hello Nexus Series team,\n\nWe would like to receive a sponsorship proposal.\n\nBrand or company:\nEditions of interest:\nPartnership objective:\nPreferred placements (banners, social media, broadcast or creators):\nIndicative budget (optional):\nName and contact:\n\nThank you.",
    footer: "Nexus · Sponsorship terms agreed for each edition.",
    scheduleToggle: "View matches and Peru / Central Europe times",
    channelsToggle: "Explore Nexus channels and social pages",
    proposalToggle: "Sponsorship process and terms",
    previewExpand: "View full design",
    previewHighlight: "Highlight brand spaces",
    previewOriginal: "Broadcast design",
  },
  ru: {
    metaTitle: "Nexus | Партнёрство и спонсорство",
    metaDescription: "Турнир Nexus, расписание и спонсорские размещения в трансляциях и социальных сетях для текущего и будущих турниров.",
    documentLabel: "Медиакит · Партнёрство с брендами",
    talk: "Обсудить сотрудничество",
    requestProposal: "Запросить предложение",
    explore: "Посмотреть варианты размещения",
    home: "Главная",
    online: "Онлайн",
    region: "Регион",
    heroLines: ["Ваш бренд.", "На Nexus", "Series."],
    heroCopy: "Варианты спонсорства в трансляциях и социальных сетях Nexus. Согласуем размещения, упоминания и даты с учётом целей вашего бренда.",
    nav: {
      tournament: "Турнир",
      schedule: "Расписание",
      broadcast: "Трансляция",
      visibility: "Размещения",
      season: "Будущие турниры",
      contact: "Контакты",
    },
    tournamentTitle: ["Dota 2", "в Южной Америке."],
    tournamentCopy: "Восемь команд участвуют в южноамериканском турнире по Dota 2. Ознакомьтесь с участниками, форматом и призовым фондом.",
    prizePool: "Призовой фонд",
    participants: "Участники",
    teamsLabel: "Команды",
    dates: "Даты",
    teamsTitle: "Команды турнира",
    invited: "Приглашённые",
    tournamentLink: "Открыть страницу турнира",
    liquipediaLink: "Посмотреть на Liquipedia",
    liquipediaNote: "Внешний источник турнирной информации. Ссылка не означает аффилированность или коммерческую поддержку.",
    scheduleTitle: ["Матчи", "и время начала."],
    scheduleCopy: "Сверяйте матчи по времени Перу и Центральной Европы, чтобы спланировать показы и упоминания вашего бренда.",
    scheduleNote: "Даты указаны по времени Перу (PET). +1 означает следующий день в Центральной Европе. Время может измениться.",
    group: "Группа",
    openingMatches: "Стартовые матчи",
    fullSchedule: "Полное расписание",
    versus: "против",
    broadcastTitle: ["Ваш бренд", "в трансляции."],
    broadcastCopy: "Примеры показывают места для вашего логотипа на разных экранах трансляции. HUD означает графику поверх изображения трансляции, например рамки и информационные панели.",
    previewLabel: "Примеры экранов трансляции",
    previewNote: "Это примеры оформления, а не прямой эфир. Логотипы, игроки и время в макетах приведены для иллюстрации. Размещения и упоминания вашего бренда согласуются в предложении.",
    sponsorPlaceholder: "ВАШ БРЕНД",
    sponsorSlot: "Пример места для логотипа спонсора",
    broadcastScenes: [
      { label: "Ожидание", title: "До начала матча", description: "Пример места для вашего логотипа на экране ожидания рядом с информацией о матчах дня." },
      { label: "Выбор героев", title: "Команды выбирают героев", description: "Брендинг размещается между областью трансляции и панелью выбора героев, не закрывая информацию о командах." },
      { label: "Игроки", title: "Представление игроков", description: "Пример места для вашего логотипа рядом со списком игроков, отдельно от их имён и данных." },
      { label: "Игра", title: "Во время матча", description: "Пример логотипа у края экрана, не закрывающего игровую информацию. Команда трансляции должна подтвердить возможность такого размещения." },
    ],
    visibilityTitle: ["Форматы", "спонсорства"],
    visibilityCopy: "Четыре варианта показа или упоминания вашего бренда. Форматы и доступность согласуются в предложении.",
    placements: [
      { title: "Баннеры", description: "Фирменный стиль вашего бренда в анонсах, расписаниях и результатах турнира.", items: ["Позиции и форматы по соглашению", "Количество и период размещения фиксируются в предложении"] },
      { title: "Социальные сети", description: "Упоминания и отметки вашего бренда в публикациях на страницах Nexus.", items: ["Анонс партнёрства и материалы о турнире", "Количество и частоту публикаций согласуем заранее"] },
      { title: "Официальные трансляции", description: "Ваш логотип на экране и упоминания командой трансляции. Частота, длительность и языки согласуются заранее.", items: ["Графика на экране и согласованные сообщения бренда", "Частота, длительность и языки определяются для каждого турнира"] },
      { title: "Трансляции авторов", description: "Баннеры и упоминания в эфирах авторов, освещающих турнир, при условии их подтверждения и согласования.", items: ["Участие требует подтверждения автора", "Формат и частота согласуются с каждым каналом"] },
    ],
    channelsTitle: "Каналы Nexus",
    officialChannels: "Официальные каналы",
    socialPages: "Социальные сети",
    languageNames: { ES: "Испанский", EN: "Английский", RU: "Русский" },
    coStreamNote: "Трансляции авторов (co-streams) независимы от официальных каналов. Упоминание канала не подтверждает, что он будет транслировать турнир или продвигать бренд.",
    seasonTitle: ["Этот турнир", "и следующие."],
    seasonCopy: "Обсудите варианты спонсорства для текущего и будущих турниров Nexus. Размещения и условия согласуются для каждого турнира.",
    currentEdition: "Текущий турнир",
    nextEdition: "Следующий турнир",
    announcedPrize: "Объявленный призовой фонд",
    seasonValue: "Ваш логотип и материалы бренда можно адаптировать для каждого турнира. Публикации и показы в эфире согласуются отдельно.",
    seasonCta: "Спланировать будущие турниры",
    proposalTitle: ["Ваши задачи.", "Индивидуальное предложение."],
    proposalCopy: "Определим, где появится ваш бренд, какие материалы нужны и кто должен утвердить их до публикации.",
    proposalSteps: [
      { title: "Расскажите о целях", description: "Укажите, чего хотите достичь, на каких рынках, в какие сроки и с каким примерным бюджетом." },
      { title: "Выберем размещения", description: "Определим турниры, каналы и форматы, проверим доступность мест и требования к материалам." },
      { title: "Согласуем работу", description: "Зафиксируем публикации, показы бренда, даты, порядок утверждения и условия до начала работы." },
    ],
    termsNote: "Количество, частота, языки, права использования, эксклюзивность, бюджет и участие авторов закрепляются в договоре. Число показов и коммерческие результаты не обещаются.",
    contactTitle: ["Поговорим", "о вашем бренде."],
    contactCopy: "Напишите нам о целях, интересующих турнирах и примерном бюджете, чтобы уточнить доступность размещений и запросить предложение.",
    emailSubject: "Запрос о спонсорстве и партнёрстве | Nexus",
    emailBody: "Здравствуйте, команда Nexus Series!\n\nМы хотели бы получить предложение о спонсорстве.\n\nБренд или компания:\nИнтересующие турниры:\nЦель сотрудничества:\nИнтересующие размещения (баннеры, соцсети, трансляции или авторы):\nОриентир по бюджету (необязательно):\nИмя и контакт:\n\nСпасибо!",
    footer: "Nexus · Условия спонсорства согласуются для каждого турнира.",
    scheduleToggle: "Матчи и время Перу / Центральной Европы",
    channelsToggle: "Каналы и социальные сети Nexus",
    proposalToggle: "Процесс и условия спонсорства",
    previewExpand: "Открыть полный дизайн",
    previewHighlight: "Показать места для бренда",
    previewOriginal: "Оформление трансляции",
  },
} satisfies Record<Locale, MediakitCopy>;
