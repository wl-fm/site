/**
 * Cloudflare Pages Function: /callback
 * Completes the GitHub OAuth flow and sends the token back to Decap CMS
 * via postMessage so the CMS popup can authenticate.
 * Env vars required: OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET
 */
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return new Response("Missing OAuth code", { status: 400 });
  }

  // Exchange code for access token
  const tokenResponse = await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: env.OAUTH_CLIENT_ID,
        client_secret: env.OAUTH_CLIENT_SECRET,
        code,
      }),
    }
  );

  const tokenData = await tokenResponse.json();

  if (tokenData.error) {
    const errorHtml = `<!DOCTYPE html><html><body>
      <script>
        window.opener.postMessage(
          'authorization:github:error:' + JSON.stringify({ message: "${tokenData.error_description}" }),
          '*'
        );
      </script>
    </body></html>`;
    return new Response(errorHtml, {
      headers: { "Content-Type": "text/html" },
    });
  }

  const token = tokenData.access_token;

  // Return the postMessage script Decap CMS expects
  const successHtml = `<!DOCTYPE html>
<html>
<head><title>Authorizing...</title></head>
<body>
<script>
(function() {
  function receiveMessage(e) {
    window.opener.postMessage(
      'authorization:github:success:' + JSON.stringify({ token: "${token}", provider: "github" }),
      e.origin
    );
  }
  window.addEventListener("message", receiveMessage, false);
  window.opener.postMessage("authorizing:github", "*");
})();
</script>
</body>
</html>`;

  return new Response(successHtml, {
    headers: { "Content-Type": "text/html" },
  });
}
