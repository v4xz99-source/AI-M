
const MODEL = "@cf/zai-org/glm-4.7-flash";

const SYSTEM_PROMPT = `
You are AI M, a powerful, intelligent and reliable AI assistant.

IDENTITY:
- Your name is AI M.
- You are the user's personal AI assistant.
- Never confuse the user's name with a question.
- Never invent the user's name or personal information.

LANGUAGE:
- Reply in the same language as the user.
- Understand Egyptian Arabic, Modern Standard Arabic and English.
- Use natural, fluent Egyptian Arabic when appropriate.
- Avoid awkward translations and broken sentences.

MEMORY AND CONTEXT:
- Carefully read the entire conversation history provided to you.
- Remember facts the user explicitly shared earlier in the conversation.
- If the user asks "What is my name?", find their name in previous messages.
- If the user says "My name is Ahmed", remember that name in the conversation.
- Distinguish questions from statements.
- Only update personal information when the user clearly corrects or changes it.
- Never pretend to remember information that is not in the conversation.

INTELLIGENCE:
- Understand the user's actual intention, not just individual words.
- Reason carefully before answering.
- Solve mathematical and scientific problems step by step.
- Write, explain, debug and improve code.
- Give accurate, useful and practical answers.
- Explain difficult topics simply.
- Admit uncertainty instead of inventing facts.

BEHAVIOR:
- Be friendly, natural and conversational.
- Avoid unnecessary introductions.
- Do not repeat the user's question.
- Keep simple answers short.
- Give detailed explanations when the task needs them.
- Follow the user's instructions carefully.

TOOLS AND HONESTY:
- Never claim to search the internet unless a search tool was actually used.
- Never claim to execute an action unless a tool actually executed it.
- Never invent sources, links, files or results.
- If a capability is unavailable, explain that honestly.

LOCATION:
- Only use location information explicitly provided to you.
- Never guess the user's address or location.
- Explain when location information is unavailable.
`;

function wantsLocation(message) {
  return /أنا فين|موقعي|مكاني|موقعي الحالي|مكاني الحالي|قريب مني|بالقرب مني|أقرب|المنطقة اللي أنا فيها|عنواني|where am i|my location|near me|nearby|closest/i.test(message);
}

async function getAddress(location) {
  if (
    !location ||
    typeof location.latitude !== "number" ||
    typeof location.longitude !== "number" ||
    !Number.isFinite(location.latitude) ||
    !Number.isFinite(location.longitude) ||
    location.latitude < -90 ||
    location.latitude > 90 ||
    location.longitude < -180 ||
    location.longitude > 180
  ) {
    return null;
  }

  const url = new URL("https://nominatim.openstreetmap.org/reverse");

  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(location.latitude));
  url.searchParams.set("lon", String(location.longitude));
  url.searchParams.set("zoom", "18");
  url.searchParams.set("addressdetails", "1");

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent": "AI-M-Location-App/1.0",
      "Accept-Language": "ar,en"
    }
  });

  if (!response.ok) {
    throw new Error("Location service unavailable");
  }

  const data = await response.json();

  if (!data || !data.address) {
    return null;
  }

  const a = data.address;

  return {
    displayName: data.display_name || null,
    country: a.country || null,
    state: a.state || a.governorate || null,
    city: a.city || a.town || a.village || a.municipality || null,
    suburb: a.suburb || a.neighbourhood || a.quarter || null,
    road: a.road || null
  };
}

function extractReply(result) {
  if (typeof result?.response === "string") {
    return result.response;
  }

  const content = result?.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .filter(item => item && item.type === "text")
      .map(item => item.text || "")
      .join("");
  }

  return null;
}

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

    const history = Array.isArray(body.history)
      ? body.history
      : [];

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

    let locationContext = "";

    if (wantsLocation(message.trim())) {
      if (body.location) {
        try {
          const address = await getAddress(body.location);

          if (address) {
            locationContext = `
LOCATION INFORMATION:

Country: ${address.country || "Unknown"}
Region: ${address.state || "Unknown"}
City: ${address.city || "Unknown"}
Neighborhood: ${address.suburb || "Unknown"}
Street: ${address.road || "Not available"}
Mapped address: ${address.displayName || "Not available"}

This information comes from reverse geocoding.
Some fields may be approximate.
Never invent missing details.
`;
          } else {
            locationContext =
              "Location lookup returned no address. Do not guess.";
          }
        } catch (error) {
          console.error("Geocoding error:", error);

          locationContext =
            "Location lookup failed. Tell the user honestly.";
        }
      } else {
        locationContext =
          "GPS location is unavailable. Do not guess the user's location.";
      }
    }

    const safeHistory = history
      .filter(item =>
        item &&
        ["user", "assistant"].includes(item.role) &&
        typeof item.text === "string"
      )
      .slice(-12)
      .map(item => ({
        role: item.role,
        content: item.text.slice(0, 3000)
      }));

    const messages = [
      {
        role: "system",
        content: SYSTEM_PROMPT
      },

      ...(locationContext
        ? [{
            role: "system",
            content: locationContext
          }]
        : []),

      ...safeHistory,

      {
        role: "user",
        content: message.trim()
      }
    ];

    const result = await env.AI.run(MODEL, {
      messages,
      max_completion_tokens: 700
    });

    const reply = extractReply(result);

    if (!reply || !reply.trim()) {
      console.error("Empty model response:", result);

      return Response.json(
        {
          reply: "لم يصل رد مكتمل من محرك الذكاء الاصطناعي. حاول مرة أخرى."
        },
        { status: 502 }
      );
    }

    return Response.json({
      reply: reply.trim()
    });

  } catch (error) {
    console.error("AI M server error:", error);

    return Response.json(
      {
        reply: "حصل خطأ أثناء تشغيل AI M. حاول مرة تانية."
      },
      { status: 500 }
    );
  }
}
