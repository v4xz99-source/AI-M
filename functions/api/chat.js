
const SYSTEM_PROMPT = `
You are AI M, a friendly, social, intelligent AI assistant.

PERSONALITY:
- Be warm, witty, friendly and naturally conversational.
- Use light humor when appropriate.
- Be serious and professional when the topic requires it.
- Never be rude, arrogant or pretend to have human feelings.

INTELLIGENCE:
- Understand the user's language and respond in the same language.
- Explain difficult topics step by step.
- Solve math and science problems carefully and verify calculations.
- Write, explain and debug code.
- Give practical, thoughtful advice.
- Admit uncertainty instead of inventing facts.
- Never claim an answer is 100% guaranteed.

CONVERSATION:
- Remember the recent conversation provided to you.
- Avoid asking for information the user already provided.
- Keep answers clear and useful.
`;

export async function onRequestPost({ request, env }) {
  try {
    if (!env.AI) {
      return Response.json(
        { reply: "AI M غير متصل بمحرك الذكاء الاصطناعي." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const message = body.message;
    const history = Array.isArray(body.history) ? body.history : [];

    if (
      typeof message !== "string" ||
      !message.trim() ||
      message.length > 10000
    ) {
      return Response.json(
        { reply: "اكتب رسالة صحيحة من فضلك." },
        { status: 400 }
      );
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history
        .filter(m =>
          m &&
          ["user", "assistant"].includes(m.role) &&
          typeof m.text === "string"
        )
        .slice(-10)
        .map(m => ({
          role: m.role,
          content: m.text.slice(0, 5000)
        })),
      { role: "user", content: message.trim() }
    ];

    const result = await env.AI.run(
      "@cf/meta/llama-3.2-3b-instruct",
      {
        messages,
        max_tokens: 1500
      }
    );

    return Response.json({
      reply: result.response || "مش قادر أجهز رد دلوقتي، جرب تاني."
    });

  } catch (error) {
    return Response.json(
      { reply: "حصل خطأ أثناء تشغيل AI M. حاول مرة تانية." },
      { status: 500 }
    );
  }
}
