import { handler } from "../netlify/functions/liquipedia-team.js";

export function liquipediaDevApi() {
  return {
    name: "nexus-liquipedia-dev-api",
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const url = new URL(request.url || "/", "http://localhost");
        if (url.pathname !== "/api/liquipedia/team") {
          next();
          return;
        }

        const result = await handler({
          httpMethod: request.method || "GET",
          headers: request.headers,
          queryStringParameters: Object.fromEntries(url.searchParams),
        });
        response.statusCode = result.statusCode;
        Object.entries(result.headers || {}).forEach(([name, value]) => response.setHeader(name, value));
        response.end(result.body || "");
      });
    },
  };
}
