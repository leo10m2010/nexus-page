function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

function renderMessagePage(status, payload) {
  const body = JSON.stringify(payload);
  return `<!doctype html>
<html>
  <body>
    <script>
      (function() {
        function receiveMessage(e) {
          window.removeEventListener("message", receiveMessage, false);
          e.source.postMessage(
            "authorization:github:${status}:${body.replace(/"/g, '\\"')}",
            e.origin
          );
        }
        window.addEventListener("message", receiveMessage, false);
        window.opener.postMessage("authorizing:github", "*");
      })();
    </script>
  </body>
</html>`;
}

export const handler = async (event) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return {
      statusCode: 500,
      body: "Faltan GITHUB_CLIENT_ID y/o GITHUB_CLIENT_SECRET en las variables de entorno de Netlify.",
    };
  }

  const { code, state } = event.queryStringParameters || {};
  const cookies = parseCookies(event.headers.cookie);

  if (!code || !state || state !== cookies.decap_oauth_state) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "text/html" },
      body: renderMessagePage("error", { message: "Estado inválido o solicitud expirada. Vuelve a intentar iniciar sesión." }),
    };
  }

  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  });

  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok || tokenData.error || !tokenData.access_token) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "text/html" },
      body: renderMessagePage("error", {
        message: tokenData.error_description || "No se pudo obtener el token de acceso de GitHub.",
      }),
    };
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/html",
      "Set-Cookie": "decap_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
    },
    body: renderMessagePage("success", { token: tokenData.access_token, provider: "github" }),
  };
};
