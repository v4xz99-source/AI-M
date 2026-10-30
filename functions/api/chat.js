
const MODEL = "@cf/meta/llama-3.2-3b-instruct";

const SYSTEM_PROMPT = `
You are AI M, a friendly, intelligent and accurate AI assistant.

PERSONALITY:
- Be friendly, social and conversational.
- Respond in the same language as the user.
- Be serious when needed.

INTELLIGENCE:
- Understand the user's intent and context.
- Explain difficult topics step by step.
- Solve math and science problems carefully.
- Help with programming and debugging.
- Never invent facts or pretend to know something.
- Admit uncertainty when information is unavailable.

LOCATION RULES:
- Use the location information provided in the conversation.
- Never guess the user's country, city, neighborhood or street.
- Distinguish GPS coordinates from a reverse-geocoded address.
- If location is unavailable, say so clearly.
- A geocoded address may be approximate, not an exact residence.
- Never claim to have searched for nearby places unless search results were provided.
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

  const url = new URL(
    "https://nominatim.openstreetmap.org/reverse"
  );

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
    road: a.road || null,
    postcode: a.postcode || null
  };
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
VERIFIED LOCATION INFORMATION:
Country: ${address.country || "Unknown"}
Region: ${address.state || "Unknown"}
City: ${address.city || "Unknown"}
Neighborhood: ${address.suburb || "Unknown"}
Street: ${address.road || "Not available"}
Full mapped address: ${address.displayName || "Not available"}

These details come from reverse geocoding of browser-provided GPS coordinates.
Some address fields may be approximate or unavailable.
Do not invent missing details.
`;
          } else {
            locationContext =
              "The user requested location information, but no mapped address was returned. Do not guess.";
          }
        } catch (error) {
          console.error("Geocoding error:", error);

          locationContext =
            "Location lookup failed. Tell the user you could not retrieve their address. Do not guess.";
        }
      } else {
        locationContext =
          "The user's GPS location is unavailable or permission was not granted. Do not guess their location.";
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
      max_tokens: 1500
    });

    return Response.json({
      reply:
        result.response ||
        "مش قادر أجهز رد دلوقتي، جرب تاني."
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
