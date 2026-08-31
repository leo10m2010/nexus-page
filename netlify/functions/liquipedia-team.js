import { importLiquipediaTeam, LiquipediaImportError } from "../lib/liquipedia.js";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
};
const SUCCESS_CACHE = "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800";
const NO_STORE = "no-store";

function response(statusCode, payload, headers = {}) {
  return {
    statusCode,
    headers: { ...JSON_HEADERS, ...headers },
    body: JSON.stringify(payload),
  };
}

export const handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return response(405, { error: "Método no permitido." }, { Allow: "GET", "Cache-Control": NO_STORE });
  }

  const input = event.queryStringParameters?.input;
  try {
    return response(200, await importLiquipediaTeam(input), { "Cache-Control": SUCCESS_CACHE });
  } catch (error) {
    if (error instanceof LiquipediaImportError) {
      return response(error.statusCode, { error: error.message }, { "Cache-Control": NO_STORE });
    }
    console.error("Liquipedia import failed", error);
    return response(500, { error: "No se pudo completar la importación desde Liquipedia." }, { "Cache-Control": NO_STORE });
  }
};
