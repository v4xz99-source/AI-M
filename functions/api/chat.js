
const MODEL = "@cf/zai-org/glm-4.7-flash";

const SYSTEM_PROMPT = `
You are AI M, a powerful, intelligent and reliable AI assistant.

LANGUAGE:
- Reply in the same language as the user.
- Understand Egyptian Arabic and Modern Standard Arabic.
- Use natural Egyptian Arabic when the user speaks Egyptian Arabic.
- Avoid awkward translations and broken sentences.

MEMORY:
- Use the saved user information provided in the system context.
- Remember the user's name and use it naturally.
- If asked for their name, answer using saved information.
- Never invent personal information.
- Do not claim to remember information that is not provided.

INTELLIGENCE:
- Understand the user's actual intention and conversation context.
- Solve math and science problems carefully.
- Write, explain, debug and improve code.
- Give accurate and practical answers.
- Explain difficult topics clearly.
- Admit uncertainty instead of inventing facts.

BEHAVIOR:
- Be friendly and conversational.
- Avoid unnecessary introductions.
- Keep simple answers short.
- Give detailed explanations when needed.
- Follow the user's instructions carefully.

TOOLS:
- Never claim to search the internet or execute actions unless a real tool was used.
- Never invent sources or results.

LOCATION:
- Only use location information explicitly provided.
- Never guess the user's address or location.
`;

function wantsLocation(message) {
  return /أنا فين|موقعي|مكاني|موقعي الحالي|مكاني الحالي|قريب مني|بالقرب مني|أقرب|المنطقة اللي أنا فيها|عنواني|where am i|my location|near me|nearby|closest/i.test(message);
}

function extractName(message) {
  const patterns = [
    /^(?:أنا\s+)?اسمي\s+([\p{L}][\p{L}\s'-]{0,40})[.!؟،]?$/iu,
    /^(?:my name is)\s+([\p{L}][\p{L}\s'-]{0,40})[.!?]?$/iu
  ];

  for (const pattern of patterns) {
    const match = message.trim().match(pattern);

    if (match) {
      return match[1].trim().replace(/[.!؟،]+$/, "");
    }
  }

  return null;
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

async function getMemory(db, userId) {
  const result = await db
    .prepare(
      "SELECT memory_key, memory_value FROM user_memory WHERE user_id = ?"
    )
    .bind(userId)
    .all();

  return result.results || [];
}

async function saveMemory(db, userId, key, value) {
  await db
    .prepare(`
      INSERT INTO user_memory
        (user_id, memory_key, memory_value, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, memory_key)
      DO UPDATE SET
        memory_value = excluded.memory_value,
        updated_at = CURRENT_TIMESTAMP
    `)
    .bind(userId, key, value)
    .run();
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.AI) {
      return Response.json(
        { reply: "AI M غير متصل بمحرك الذكاء الاصطناعي." },
        { status: 503 }
      );
    }

    if (!env.DB) {
      return Response.json(
        { reply: "قاعدة بيانات الذاكرة غير متصلة." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const message = body.message;

    const history = Array.isArray(body.history)
      ? body.history
      : [];

    const userId = body.userId;

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

    if (
      typeof userId !== "string" ||
      !/^[0-9a-f-]{36}$/i.test(userId)
    ) {
      return Response.json(
        { reply: "معرّف المستخدم غير صالح. حدّث الصفحة وحاول مرة أخرى." },
        { status: 400 }
      );
    }

    const cleanMessage = message.trim();

    // Save the name only when the user explicitly introduces themselves.
    const name = extractName(cleanMessage);

    if (name) {
      await saveMemory(env.DB, userId, "name", name);
    }

    // Load saved memories.
    const memories = await getMemory(env.DB, userId);

    const memoryContext = memories.length
      ? `
SAVED USER MEMORY:
${memories.map(item => `${item.memory_key}: ${item.memory_value}`).join("\n")}

Use these saved facts when relevant.
`
      : "No saved user information is available yet.";

    let locationContext = "";

    if (wantsLocation(cleanMessage)) {
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
      {
        role: "system",
        content: memoryContext
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
        content: cleanMessage
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
