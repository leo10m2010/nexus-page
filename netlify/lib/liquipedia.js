const DOTA_API = "https://liquipedia.net/dota2/api.php";
const COMMONS_API = "https://liquipedia.net/commons/api.php";
const REQUEST_INTERVAL_MS = 2100;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 100;
const USER_AGENT = process.env.LIQUIPEDIA_USER_AGENT || "NexusSeriesAdmin/1.0 (https://nexusseries.org)";

const COUNTRY_CODES = {
  argentina: "AR",
  australia: "AU",
  austria: "AT",
  belarus: "BY",
  belgium: "BE",
  bolivia: "BO",
  brazil: "BR",
  bulgaria: "BG",
  canada: "CA",
  chile: "CL",
  china: "CN",
  colombia: "CO",
  croatia: "HR",
  "czech republic": "CZ",
  czechia: "CZ",
  denmark: "DK",
  ecuador: "EC",
  estonia: "EE",
  finland: "FI",
  france: "FR",
  georgia: "GE",
  germany: "DE",
  greece: "GR",
  india: "IN",
  indonesia: "ID",
  israel: "IL",
  italy: "IT",
  japan: "JP",
  kazakhstan: "KZ",
  korea: "KR",
  latvia: "LV",
  lithuania: "LT",
  malaysia: "MY",
  mexico: "MX",
  mongolia: "MN",
  netherlands: "NL",
  "new zealand": "NZ",
  norway: "NO",
  paraguay: "PY",
  peru: "PE",
  philippines: "PH",
  poland: "PL",
  portugal: "PT",
  romania: "RO",
  russia: "RU",
  serbia: "RS",
  singapore: "SG",
  slovakia: "SK",
  slovenia: "SI",
  "south africa": "ZA",
  "south korea": "KR",
  spain: "ES",
  sweden: "SE",
  switzerland: "CH",
  taiwan: "TW",
  thailand: "TH",
  turkey: "TR",
  ukraine: "UA",
  "united kingdom": "GB",
  "united states": "US",
  uruguay: "UY",
  venezuela: "VE",
  vietnam: "VN",
};

const FLAG_ALIASES = {
  el: "GR",
  en: "GB",
  esmx: "MX",
  kr: "KR",
  ptbr: "BR",
  ru: "RU",
  uk: "GB",
  us: "US",
};

const REGION_NAMES = {
  cis: "Eastern Europe",
  cn: "China",
  eeu: "Eastern Europe",
  eu: "Europe",
  mena: "Middle East and North Africa",
  na: "North America",
  sa: "South America",
  sea: "Southeast Asia",
  weu: "Western Europe",
};

const cache = new Map();
let nextRequestAt = 0;

export class LiquipediaImportError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "LiquipediaImportError";
    this.statusCode = statusCode;
  }
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function scheduledFetch(url, options = {}) {
  const scheduledAt = Math.max(Date.now(), nextRequestAt);
  nextRequestAt = scheduledAt + REQUEST_INTERVAL_MS;
  if (scheduledAt > Date.now()) await sleep(scheduledAt - Date.now());

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    return await fetch(url, {
      ...options,
      headers: {
        Accept: options.accept || "application/json",
        "Accept-Encoding": "gzip",
        "User-Agent": USER_AGENT,
        ...options.headers,
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchJson(url) {
  const response = await scheduledFetch(url);
  if (!response.ok) {
    throw new LiquipediaImportError(`Liquipedia respondió con HTTP ${response.status}.`, 502);
  }
  const payload = await response.json();
  if (payload.error) {
    throw new LiquipediaImportError(payload.error.info || "Liquipedia rechazó la consulta.", 502);
  }
  return payload;
}

function normalizeKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value) {
  return normalizeKey(value).replace(/\s+/g, "-");
}

function stripMarkup(value) {
  return String(value || "")
    .replace(/<!--[^]*?-->/g, "")
    .replace(/\[\[[^\]|]+\|([^\]]+)\]\]/g, "$1")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\{\{[^{}]*\}\}/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/'''?/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function splitTopLevel(value, separator) {
  const parts = [];
  let start = 0;
  let templateDepth = 0;
  let linkDepth = 0;

  for (let index = 0; index < value.length; index += 1) {
    const pair = value.slice(index, index + 2);
    if (pair === "{{") {
      templateDepth += 1;
      index += 1;
      continue;
    }
    if (pair === "}}") {
      templateDepth = Math.max(0, templateDepth - 1);
      index += 1;
      continue;
    }
    if (pair === "[[") {
      linkDepth += 1;
      index += 1;
      continue;
    }
    if (pair === "]]" && linkDepth > 0) {
      linkDepth -= 1;
      index += 1;
      continue;
    }
    if (value[index] === separator && templateDepth === 0 && linkDepth === 0) {
      parts.push(value.slice(start, index));
      start = index + 1;
    }
  }
  parts.push(value.slice(start));
  return parts;
}

function findTopLevelEquals(value) {
  let templateDepth = 0;
  let linkDepth = 0;
  for (let index = 0; index < value.length; index += 1) {
    const pair = value.slice(index, index + 2);
    if (pair === "{{") {
      templateDepth += 1;
      index += 1;
    } else if (pair === "}}") {
      templateDepth = Math.max(0, templateDepth - 1);
      index += 1;
    } else if (pair === "[[") {
      linkDepth += 1;
      index += 1;
    } else if (pair === "]]" && linkDepth > 0) {
      linkDepth -= 1;
      index += 1;
    } else if (value[index] === "=" && templateDepth === 0 && linkDepth === 0) {
      return index;
    }
  }
  return -1;
}

function parseTemplate(raw) {
  const parts = splitTopLevel(raw, "|");
  const params = {};
  let positional = 1;
  for (const part of parts.slice(1)) {
    const equalsAt = findTopLevelEquals(part);
    if (equalsAt === -1) {
      params[String(positional)] = part.trim();
      positional += 1;
    } else {
      const key = normalizeKey(part.slice(0, equalsAt)).replace(/ /g, "");
      params[key] = part.slice(equalsAt + 1).trim();
    }
  }
  return { name: normalizeKey(parts[0]), params, raw };
}

export function extractTemplates(source, templateName) {
  const target = normalizeKey(templateName);
  const stack = [];
  const templates = [];
  for (let index = 0; index < source.length - 1; index += 1) {
    const pair = source.slice(index, index + 2);
    if (pair === "{{") {
      stack.push(index);
      index += 1;
    } else if (pair === "}}" && stack.length) {
      const start = stack.pop();
      const raw = source.slice(start + 2, index);
      const parsed = parseTemplate(raw);
      if (parsed.name === target) templates.push(parsed);
      index += 1;
    }
  }
  return templates;
}

function normalizeFlag(value) {
  const flag = normalizeKey(stripMarkup(value)).replace(/ /g, "");
  if (!flag) return undefined;
  if (FLAG_ALIASES[flag]) return FLAG_ALIASES[flag];
  if (/^[a-z]{2}$/.test(flag)) return flag.toUpperCase();
  return COUNTRY_CODES[normalizeKey(flag)];
}

function countryFromLocation(value) {
  return COUNTRY_CODES[normalizeKey(stripMarkup(value))];
}

function deriveTag(name) {
  const ignored = new Set(["esports", "e", "gaming", "team", "club"]);
  const words = normalizeKey(name).split(" ").filter((word) => word && !ignored.has(word));
  if (!words.length) return "TEAM";
  if (words.length === 1) return words[0].slice(0, Math.min(3, words[0].length)).toUpperCase().padEnd(2, "X");
  const initials = words.map((word) => word[0]).join("").slice(0, 4).toUpperCase();
  return initials.length >= 2 ? initials : words.join("").slice(0, 3).toUpperCase();
}

function getRevisionContent(page) {
  return page?.revisions?.[0]?.slots?.main?.content || "";
}

export function parseTeamWikitext(wikitext, pageTitle) {
  const source = String(wikitext || "").replace(/<!--[^]*?-->/g, "");
  const infobox = extractTemplates(source, "Infobox team")[0];
  if (!infobox) return null;

  const name = stripMarkup(infobox.params.name) || pageTitle;
  const location = stripMarkup(infobox.params.location);
  const region = stripMarkup(infobox.params.region);
  const explicitTag = stripMarkup(
    infobox.params.tag || infobox.params.shortname || infobox.params.abbreviation || infobox.params.acronym,
  );
  const activeSquads = extractTemplates(source, "Squad").filter(
    (squad) => normalizeKey(stripMarkup(squad.params.status)) === "active",
  );
  const players = [];
  const seenPlayers = new Set();

  for (const squad of activeSquads) {
    for (const person of extractTemplates(squad.raw, "Person")) {
      const handle = stripMarkup(person.params.id || person.params.handle || person.params.nickname);
      if (!handle || seenPlayers.has(handle.toLowerCase())) continue;
      const positionCopy = stripMarkup(person.params.position);
      const position = Number(positionCopy);
      const role = normalizeKey(stripMarkup(person.params.role || (Number.isFinite(position) ? "" : positionCopy)));
      if (/coach|manager|analyst|owner|staff|substitute|stand in/.test(role)) continue;
      seenPlayers.add(handle.toLowerCase());
      players.push({
        handle,
        country: normalizeFlag(person.params.flag || person.params.country),
        position: Number.isFinite(position) && position > 0 ? position : 99,
      });
    }
  }

  players.sort((left, right) => left.position - right.position || left.handle.localeCompare(right.handle));
  return {
    id: slugify(name),
    name,
    tag: /^[A-Za-z0-9]{2,4}$/.test(explicitTag) ? explicitTag.toUpperCase() : deriveTag(name),
    country: countryFromLocation(location),
    location: location || undefined,
    region: REGION_NAMES[normalizeKey(region)] || region || undefined,
    players: players.map(({ handle, country }) => (country ? { handle, country } : { handle })),
  };
}

function buildApiUrl(base, params) {
  const url = new URL(base);
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== "") url.searchParams.set(key, String(value));
  }
  return url.toString();
}

function parseInput(input) {
  const value = String(input || "").trim();
  if (!value || value.length > 220) {
    throw new LiquipediaImportError("Escribe un nombre o una URL válida de Liquipedia.");
  }

  if (!/^https?:\/\//i.test(value)) return { query: value, exact: false };

  let url;
  try {
    url = new URL(value);
  } catch {
    throw new LiquipediaImportError("La URL de Liquipedia no es válida.");
  }
  if (url.hostname !== "liquipedia.net" && url.hostname !== "www.liquipedia.net") {
    throw new LiquipediaImportError("La URL debe pertenecer a liquipedia.net.");
  }
  if (!url.pathname.startsWith("/dota2/")) {
    throw new LiquipediaImportError("Usa una página de equipo de Liquipedia Dota 2.");
  }

  const title = decodeURIComponent(url.pathname.slice("/dota2/".length)).replace(/_/g, " ").trim();
  if (!title || title === "api.php" || title === "index.php") {
    throw new LiquipediaImportError("No se pudo reconocer el equipo en esa URL.");
  }
  return { query: title, exact: true };
}

async function loadExactPage(title) {
  const payload = await fetchJson(buildApiUrl(DOTA_API, {
    action: "query",
    prop: "info|revisions",
    redirects: 1,
    titles: title,
    inprop: "url",
    rvprop: "content",
    rvslots: "main",
    format: "json",
    formatversion: 2,
  }));
  const page = payload.query?.pages?.find((candidate) => !candidate.missing);
  if (!page) throw new LiquipediaImportError("No encontramos ese equipo en Liquipedia.", 404);
  return page;
}

async function searchPage(query) {
  const payload = await fetchJson(buildApiUrl(DOTA_API, {
    action: "query",
    generator: "search",
    gsrsearch: query,
    gsrnamespace: 0,
    gsrlimit: 8,
    prop: "info|revisions",
    inprop: "url",
    rvprop: "content",
    rvslots: "main",
    format: "json",
    formatversion: 2,
  }));
  const pages = (payload.query?.pages || []).sort((left, right) => (left.index || 99) - (right.index || 99));
  const exactKey = normalizeKey(query);
  const teamPages = pages.filter((page) => parseTeamWikitext(getRevisionContent(page), page.title));
  const exact = teamPages.find((page) => normalizeKey(page.title) === exactKey);
  const page = exact || teamPages[0];
  if (!page) throw new LiquipediaImportError("No encontramos una página de equipo con ese nombre.", 404);
  return page;
}

function imageInfoFromPage(page) {
  const info = page?.imageinfo?.[0];
  if (!info || !String(info.mime || "").startsWith("image/")) return null;
  return {
    fileName: String(page.title || "").replace(/^File:/, ""),
    mime: info.mime,
    width: info.thumbwidth || info.width,
    height: info.thumbheight || info.height,
    downloadUrl: info.thumburl || info.url,
    originalUrl: info.url,
    descriptionUrl: info.descriptionurl,
    sha1: info.sha1 || null,
    timestamp: info.timestamp || info.extmetadata?.DateTime?.value || null,
    licenseName: stripMarkup(info.extmetadata?.LicenseShortName?.value) || null,
    licenseUrl: info.extmetadata?.LicenseUrl?.value || null,
    artist: stripMarkup(info.extmetadata?.Artist?.value) || null,
  };
}

function logoScore(candidate, teamName) {
  const file = normalizeKey(candidate.fileName.replace(/\.[^.]+$/, ""));
  const team = normalizeKey(teamName);
  const stripped = file
    .replace(/\b(19|20)\d{2}\b/g, "")
    .replace(/\b(allmode|lightmode|darkmode|logo|temporary|icon)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
  let score = 0;
  if (stripped === team) score += 120;
  if (file.startsWith(team)) score += 70;
  if (file.includes(team)) score += 30;
  if (file.includes("allmode")) score += 35;
  else if (file.includes("lightmode")) score += 18;
  else if (file.includes("darkmode")) score += 8;
  if (file.includes("logo")) score += 10;
  if (file.includes("temporary")) score -= 20;
  if (file.includes("icon")) score -= 8;
  return score;
}

async function loadLogoCandidates(teamName) {
  const payload = await fetchJson(buildApiUrl(COMMONS_API, {
    action: "query",
    generator: "allimages",
    gaiprefix: teamName,
    gailimit: 20,
    prop: "imageinfo",
    iiprop: "url|mime|size|sha1|timestamp|extmetadata",
    iiurlwidth: 512,
    format: "json",
    formatversion: 2,
  }));
  return (payload.query?.pages || []).map(imageInfoFromPage).filter(Boolean);
}

async function loadRenderedLogoCandidates(pageTitle) {
  const payload = await fetchJson(buildApiUrl(DOTA_API, {
    action: "query",
    generator: "images",
    titles: pageTitle,
    gimlimit: 500,
    prop: "imageinfo",
    iiprop: "url|mime|size|sha1|timestamp|extmetadata",
    iiurlwidth: 512,
    format: "json",
    formatversion: 2,
  }));
  return (payload.query?.pages || []).map(imageInfoFromPage).filter(Boolean);
}

async function resolveLogo(teamName, pageTitle) {
  let candidates = await loadLogoCandidates(teamName);
  if (!candidates.length) candidates = await loadRenderedLogoCandidates(pageTitle);
  return candidates
    .map((candidate) => ({ ...candidate, score: logoScore(candidate, teamName) }))
    .filter((candidate) => candidate.score > 30)
    .sort((left, right) => right.score - left.score)[0] || null;
}

async function downloadLogo(logo) {
  if (!logo) return null;
  const response = await scheduledFetch(logo.downloadUrl, { accept: "image/*" });
  if (!response.ok) throw new LiquipediaImportError("No se pudo descargar el logo del equipo.", 502);
  const mime = response.headers.get("content-type") || logo.mime;
  if (!mime.startsWith("image/")) throw new LiquipediaImportError("Liquipedia devolvió un logo inválido.", 502);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > 2_500_000) throw new LiquipediaImportError("El logo de Liquipedia es demasiado pesado.", 413);
  return { ...logo, mime, dataUrl: `data:${mime};base64,${bytes.toString("base64")}` };
}

function readCache(key) {
  const item = cache.get(key);
  if (!item || item.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return item.value;
}

function writeCache(keys, value) {
  for (const key of keys) cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  while (cache.size > MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value);
}

export async function importLiquipediaTeam(input) {
  const parsedInput = parseInput(input);
  const inputCacheKey = normalizeKey(parsedInput.query);
  const cached = readCache(inputCacheKey);
  if (cached) return cached;

  const page = parsedInput.exact ? await loadExactPage(parsedInput.query) : await searchPage(parsedInput.query);
  const wikitext = getRevisionContent(page);
  const parsedTeam = parseTeamWikitext(wikitext, page.title);
  if (!parsedTeam) throw new LiquipediaImportError("La página encontrada no corresponde a un equipo.", 404);

  const logo = await downloadLogo(await resolveLogo(parsedTeam.name, page.title));
  const pageUrl = page.fullurl || `https://liquipedia.net/dota2/${encodeURIComponent(page.title.replace(/ /g, "_"))}`;
  const value = {
    team: {
      ...parsedTeam,
      liquipediaUrl: pageUrl,
      logo,
    },
    fetchedAt: new Date().toISOString(),
    attribution: "Datos de Liquipedia disponibles bajo CC BY-SA 3.0. El logo conserva la licencia indicada en su página de archivo.",
  };
  writeCache([inputCacheKey, normalizeKey(page.title), normalizeKey(parsedTeam.name)], value);
  return value;
}
