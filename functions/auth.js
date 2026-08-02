/**
 * Cloudflare Pages Function: /auth
 * Initiates the GitHub OAuth flow for Decap CMS.
 * Env vars required: OAUTH_CLIENT_ID, REDIRECT_URL
 */
export async function onRequest(context) {
  const { env } = context;

  const params = new URLSearchParams({
    client_id: env.OAUTH_CLIENT_ID,
    redirect_uri: env.REDIRECT_URL,
    scope: "repo,user",
    state: crypto.randomUUID(),
  });

  return Response.redirect(
    `https://github.com/login/oauth/authorize?${params}`,
    302
  );
}
