import { handler } from "../netlify/functions/liquipedia-team.js";
import { handler as syncHandler } from "../netlify/functions/liquipedia-sync.js";

export function liquipediaDevApi() {
  return {
    name: "nexus-liquipedia-dev-api",
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const url = new URL(request.url || "/", "http://localhost");
        if (!["/api/liquipedia/team", "/api/liquipedia/sync"].includes(url.pathname)) {
          next();
          return;
        }

        let body = "";
        for await (const chunk of request) { body += chunk; if (body.length > 12000) { response.statusCode = 413; response.end(); return; } }
        const result = await (url.pathname.endsWith("/sync") ? syncHandler : handler)({
          httpMethod: request.method || "GET",
          headers: request.headers,
          queryStringParameters: Object.fromEntries(url.searchParams),
          body,
        });
        response.statusCode = result.statusCode;
        Object.entries(result.headers || {}).forEach(([name, value]) => response.setHeader(name, value));
        response.end(result.body || "");
      });
    },
  };
}
