
const MODEL = "@cf/zai-org/glm-4.7-flash";

const SYSTEM_PROMPT = `
You are AI M, an intelligent, helpful and accurate AI assistant.

LANGUAGE:
- Reply in the same language the user uses.
- Understand Egyptian Arabic and Modern Standard Arabic.
- Use natural, fluent Arabic when the user writes Arabic.
- Do not produce random, broken or meaningless text.

PERSONALITY:
- Be friendly, natural and conversational.
- Be professional when needed.
- Avoid unnecessary introductions and repetition.

INTELLIGENCE:
- Understand the user's intent and conversation context.
- Explain difficult topics step by step.
- Solve math and science problems carefully.
- Help with programming and debugging.
- Give practical and useful answers.
- Never invent facts, sources or search results.
- Clearly admit uncertainty when information is unavailable.

LOCATION RULES:
- Use location information only when it is provided.
- Never guess the user's country, city, neighborhood or street.
- Distinguish GPS coordinates from a mapped address.
- If location is unavailable, say so clearly.
- A mapped address may be approximate.
- Never claim to have searched for nearby places unless actual search results were provided.

IMPORTANT:
- You are AI M.
- You must prioritize accuracy, clarity and usefulness.
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
    city:
      a.city ||
      a.town ||
      a.village ||
      a.municipality ||
      null,
    suburb:
      a.suburb ||
      a.neighbourhood ||
      a.quarter ||
      null,
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
LOCATION INFORMATION FROM BROWSER GPS AND REVERSE GEOCODING:

Country: ${address.country || "Unknown"}
Region: ${address.state || "Unknown"}
City: ${address.city || "Unknown"}
Neighborhood: ${address.suburb || "Unknown"}
Street: ${address.road || "Not available"}
Mapped address: ${address.displayName || "Not available"}

These details were obtained by reverse geocoding browser-provided GPS coordinates.
Some fields may be approximate or unavailable.
Never invent missing details.
`;

          } else {
            locationContext =
              "Location lookup returned no mapped address. Do not guess the user's location.";
          }
        } catch (error) {
          console.error("AI M geocoding error:", error);

          locationContext =
            "Location lookup failed. Tell the user that the location could not be retrieved. Do not guess.";
        }
      } else {
        locationContext =
          "The user's GPS location is unavailable. Do not guess their location.";
      }
    }

    const safeHistory = history
      .filter(item =>
        item &&
        ["user", "assistant"].includes(item.role) &&
        typeof item.text === "string"
      )
      .slice(-10)
      .map(item => ({
        role: item.role,
        content: item.text.slice(0, 4000)
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
      max_completion_tokens: 1500
    });

    const reply = extractReply(result);

    if (!reply || !reply.trim()) {
      console.error("AI M empty model response:", result);

      return Response.json(
        {
          reply: "وصلني رد غير مكتمل من محرك الذكاء الاصطناعي. حاول مرة أخرى."
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
