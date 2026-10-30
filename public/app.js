
const $ = (id) => document.getElementById(id);

const form = $("chatForm");
const input = $("messageInput");
const messages = $("messages");
const welcome = $("welcome");
const historyBox = $("history");

let chats = [];
let currentChat = [];
let currentChatId = null;
let english = false;
let busy = false;
let userLocation = null;
let locationStatus = "loading";

const locationBox = document.createElement("div");
locationBox.style.cssText = `
  padding: 9px 12px;
  font-size: 13px;
  opacity: .85;
  text-align: center;
`;
form.parentNode.insertBefore(locationBox, form);

function updateLocationStatus(text) {
  locationBox.textContent = text;
}

function getUserLocation() {
  if (!navigator.geolocation) {
    locationStatus = "unavailable";
    updateLocationStatus(
      english
        ? "📍 Location is not supported by this browser"
        : "📍 المتصفح لا يدعم تحديد الموقع"
    );
    return;
  }

  updateLocationStatus(
    english
      ? "📍 Waiting for location permission..."
      : "📍 في انتظار إذن تحديد الموقع..."
  );

  navigator.geolocation.getCurrentPosition(
    (position) => {
      userLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      };

      locationStatus = "ready";

      updateLocationStatus(
        english
          ? "📍 Location detected successfully"
          : "📍 تم تحديد موقعك بنجاح"
      );

      console.log("AI M location status:", locationStatus);
    },
    (error) => {
      userLocation = null;
      locationStatus = "denied";

      let text = english
        ? "📍 Location unavailable"
        : "📍 الموقع غير متاح";

      if (error.code === error.PERMISSION_DENIED) {
        text = english
          ? "📍 Location permission denied"
          : "📍 إذن الموقع مرفوض. فعّله من إعدادات المتصفح.";
      } else if (error.code === error.TIMEOUT) {
        text = english
          ? "📍 Location request timed out"
          : "📍 انتهت مهلة تحديد الموقع. حاول مرة أخرى.";
      }

      updateLocationStatus(text);
      console.error("Location error:", error);
    },
    {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 300000
    }
  );
}

function updateLanguage() {
  document.documentElement.lang = english ? "en" : "ar";
  document.documentElement.dir = english ? "ltr" : "rtl";
  document.body.classList.toggle("english", english);

  document.querySelectorAll("[data-ar]").forEach((el) => {
    el.textContent = english ? el.dataset.en : el.dataset.ar;
  });

  input.placeholder = english
    ? "Type your message..."
    : "اكتب رسالتك هنا...";

  $("languageBtn").textContent = english
    ? "🌐 العربية"
    : "🌐 English";

  if (locationStatus === "ready") {
    updateLocationStatus(
      english
        ? "📍 Location detected successfully"
        : "📍 تم تحديد موقعك بنجاح"
    );
  } else if (locationStatus === "denied") {
    updateLocationStatus(
      english
        ? "📍 Location unavailable"
        : "📍 الموقع غير متاح"
    );
  } else {
    updateLocationStatus(
      english
        ? "📍 Waiting for location..."
        : "📍 جاري تحديد موقعك..."
    );
  }
}

function addMessage(role, text) {
  const div = document.createElement("div");
  div.className = "message " + role;
  div.textContent = text;

  messages.appendChild(div);

  $("chatArea").scrollTop = $("chatArea").scrollHeight;

  return div;
}

function renderHistory() {
  historyBox.replaceChildren();

  chats.forEach((chat) => {
    const button = document.createElement("button");

    button.className = "history-item";
    button.textContent = chat.title;

    button.onclick = () => openChat(chat.id);

    historyBox.appendChild(button);
  });
}

function updateCurrentChat() {
  if (!currentChat.length) return;

  let chat = chats.find((item) => item.id === currentChatId);

  const title =
    currentChat.find((item) => item.role === "user")?.text ||
    (english ? "New chat" : "محادثة جديدة");

  if (!chat) {
    chat = {
      id: currentChatId || String(Date.now()),
      title: title.slice(0, 35),
      messages: []
    };

    currentChatId = chat.id;
    chats.unshift(chat);
  }

  chat.title = title.slice(0, 35);
  chat.messages = [...currentChat];

  renderHistory();
}

function openChat(id) {
  const chat = chats.find((item) => item.id === id);
  if (!chat) return;

  currentChatId = chat.id;
  currentChat = [...chat.messages];

  messages.replaceChildren();
  welcome.hidden = true;

  currentChat.forEach((item) => {
    addMessage(item.role, item.text);
  });

  $("sidebar").classList.remove("open");
}

function newChat() {
  updateCurrentChat();

  currentChat = [];
  currentChatId = null;

  messages.replaceChildren();
  welcome.hidden = false;

  $("sidebar").classList.remove("open");
}

async function sendMessage(text) {
  text = text.trim();

  if (!text || busy) return;

  welcome.hidden = true;
  busy = true;
  $("sendBtn").disabled = true;

  if (!currentChatId) {
    currentChatId = String(Date.now());
  }

  const history = currentChat
    .slice(-10)
    .map((item) => ({
      role: item.role === "bot" ? "assistant" : "user",
      text: item.text
    }));

  addMessage("user", text);

  currentChat.push({
    role: "user",
    text
  });

  const loading = addMessage(
    "bot",
    english ? "Thinking..." : "جاري التفكير..."
  );

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: text,
        history,
        location: userLocation
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.reply || "Server error");
    }

    loading.textContent =
      data.reply ||
      (english ? "No response received." : "لم يصل رد من AI M.");

    currentChat.push({
      role: "bot",
      text: loading.textContent
    });

    updateCurrentChat();

  } catch (error) {
    console.error("AI M error:", error);

    loading.textContent = english
      ? "Connection error. Please try again."
      : "حصل خطأ أثناء الاتصال بـ AI M. حاول مرة تانية.";
  }

  busy = false;
  $("sendBtn").disabled = false;
  input.focus();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const text = input.value;

  input.value = "";
  input.style.height = "auto";

  sendMessage(text);
});

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height =
    Math.min(input.scrollHeight, 150) + "px";
});

$("newChat").onclick = newChat;
$("clearBtn").onclick = newChat;

$("menuBtn").onclick = () => {
  $("sidebar").classList.add("open");
};

$("closeSidebar").onclick = () => {
  $("sidebar").classList.remove("open");
};

$("languageBtn").onclick = () => {
  english = !english;
  updateLanguage();
};

document.querySelectorAll(".suggestion").forEach((button) => {
  button.onclick = () => {
    sendMessage(
      english
        ? button.dataset.promptEn
        : button.dataset.promptAr
    );
  };
});

updateLanguage();
getUserLocation();
