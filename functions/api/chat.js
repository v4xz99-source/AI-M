
export async function onRequestPost({ request }) {
  try {
    const body = await request.json();

    if (!body || typeof body.message !== "string" || !body.message.trim()) {
      return Response.json(
        { error: "A message is required." },
        { status: 400 }
      );
    }

    return Response.json({
      reply: "واجهة AI M تعمل بنجاح، لكن لم يتم توصيل مزود الذكاء الاصطناعي بعد."
    });

  } catch {
    return Response.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }
}
