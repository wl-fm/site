/**
 * Cloudflare Pages Function: /callback
 * Completes the GitHub OAuth flow and sends the token back to Decap CMS
 * via postMessage. Shows visible errors instead of a blank white page.
 */
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return errorPage("Missing OAuth code — please try logging in again.");
  }

  // Exchange the code for an access token
  let tokenData;
  try {
    const resp = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id:     (env.OAUTH_CLIENT_ID     || "").trim(),
        client_secret: (env.OAUTH_CLIENT_SECRET || "").trim(),
        code,
      }),
    });
    tokenData = await resp.json();
  } catch (err) {
    return errorPage("Could not reach GitHub: " + err.message);
  }

  if (tokenData.error || !tokenData.access_token) {
    const msg = tokenData.error_description || tokenData.error || "Unknown error from GitHub.";
    return errorPage("GitHub OAuth error: " + msg);
  }

  const token = tokenData.access_token;

  // Return the postMessage handshake page Decap CMS expects
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Authorizing…</title>
</head>
<body>
  <p style="font-family:sans-serif;text-align:center;padding:2rem;color:#666">
    Completing login, please wait…
  </p>
  <script>
    (function () {
      var token = ${JSON.stringify(token)};

      function receiveMessage(e) {
        window.opener.postMessage(
          'authorization:github:success:' + JSON.stringify({ token: token, provider: 'github' }),
          e.origin
        );
      }

      window.addEventListener('message', receiveMessage, false);
      window.opener.postMessage('authorizing:github', '*');
    })();
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function errorPage(msg) {
  const escaped = msg.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><title>Auth Error</title></head>
<body>
  <div style="font-family:sans-serif;max-width:480px;margin:4rem auto;padding:2rem;border:1px solid #fca5a5;border-radius:8px;background:#fef2f2">
    <h2 style="color:#dc2626;margin:0 0 1rem">Authentication Error</h2>
    <p style="color:#7f1d1d;margin:0 0 1.5rem">${escaped}</p>
    <button onclick="window.close()" style="padding:.5rem 1.2rem;background:#dc2626;color:#fff;border:none;border-radius:4px;cursor:pointer">
      Close &amp; Try Again
    </button>
  </div>
  <script>
    if (window.opener) {
      window.opener.postMessage(
        'authorization:github:error:' + JSON.stringify({ message: ${JSON.stringify(msg)} }),
        '*'
      );
    }
  </script>
</body>
</html>`;
  return new Response(html, {
    status: 400,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
