
export async function onRequestPost(context) {
  try {
    const { request, env } = context;

    if (!env.AI) {
      return Response.json(
        { reply: "الذكاء الاصطناعي غير متصل حاليًا." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const message = body.message;

    if (
      typeof message !== "string" ||
      !message.trim() ||
      message.length > 10000
    ) {
      return Response.json(
        { reply: "من فضلك اكتب رسالة صحيحة." },
        { status: 400 }
      );
    }

    const result = await env.AI.run(
      "@cf/meta/llama-3.2-3b-instruct",
      {
        messages: [
          {
            role: "system",
            content:
              "You are AI M, an intelligent, capable and thoughtful AI assistant. Understand the user's language and reply naturally in the same language. Be accurate, helpful, creative and detailed when needed. Never invent facts. Explain complex topics clearly."
          },
          {
            role: "user",
            content: message.trim()
          }
        ],
        max_tokens: 1200
      }
    );

    return Response.json({
      reply: result.response || "لم أتمكن من إنشاء رد. حاول مرة أخرى."
    });

  } catch (error) {
    return Response.json(
      { reply: "حدث خطأ أثناء تشغيل AI M. حاول مرة أخرى." },
      { status: 500 }
    );
  }
}
