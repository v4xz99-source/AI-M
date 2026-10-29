export async function onRequestPost({ request, env }) {
  // This endpoint is intentionally not wired to a provider yet.
  // Store provider keys in Cloudflare Pages > Settings > Environment variables as secrets.
  // Never put API keys in public/app.js or commit them to GitHub.
  try {
    const body = await request.json();
    if (!body || typeof body.message !== "string" || !body.message.trim()) {
      return Response.json({ error: "A message is required." }, { status: 400 });
    }
    // TODO: Add a provider API call here, using env.AI_PROVIDER_API_KEY.
    // Keep request limits and provider usage controls enabled before public launch.
    return Response.json({
      reply: "واجهة AI M متصلة بالخادم، لكن مزود الذكاء الاصطناعي لم يُضف بعد. أضف تكامل النموذج في functions/api/chat.js."
    }, { status: 501 });
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
}
