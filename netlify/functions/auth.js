import crypto from "node:crypto";

export const handler = async (event) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return { statusCode: 500, body: "Falta la variable de entorno GITHUB_CLIENT_ID en Netlify." };
  }

  const scope = process.env.GITHUB_OAUTH_SCOPES || "repo,user";
  const state = crypto.randomBytes(16).toString("hex");

  const host = event.headers["x-forwarded-host"] || event.headers.host;
  const proto = event.headers["x-forwarded-proto"] || "https";
  const redirectUri = `${proto}://${host}/api/callback`;

  const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("scope", scope);
  authorizeUrl.searchParams.set("state", state);

  return {
    statusCode: 302,
    headers: {
      Location: authorizeUrl.toString(),
      "Set-Cookie": `decap_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
    },
    body: "",
  };
};
