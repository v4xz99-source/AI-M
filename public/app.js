
const $ = (id) => document.getElementById(id);

const form = $("chatForm");
const input = $("messageInput");
const messages = $("messages");
const welcome = $("welcome");
const historyBox = $("history");

let chats = [];
let currentChat = [];
let english = false;
let busy = false;
let userLocation = null;

const locationStatus = document.createElement("div");
locationStatus.style.cssText =
  "padding:8px 12px;font-size:13px;opacity:.8;text-align:center;";
locationStatus.textContent = "📍 جاري تحديد موقعك...";
form.parentNode.insertBefore(locationStatus, form);

function updateLocationStatus(message) {
  locationStatus.textContent = message;
}

function getUserLocation() {
  if (!("geolocation" in navigator)) {
    updateLocationStatus("📍 متصفحك لا يدعم تحديد الموقع");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      userLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      };

      updateLocationStatus("📍 تم تحديد موقعك بنجاح");
    },
    (error) => {
      userLocation = null;

      if (error.code === error.PERMISSION_DENIED) {
        updateLocationStatus("📍 إذن الموقع مرفوض. فعّله من إعدادات المتصفح.");
      } else {
        updateLocationStatus("📍 لم نتمكن من تحديد موقعك. حاول مرة أخرى.");
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 300000
    }
  );
}

function updateLanguage() {
  document.documentElement.lang = english ? "en" : "ar";
  document.documentElement.dir = english ? "ltr" : "rtl";
  document.body.classList.toggle("english", english);

  document.querySelectorAll("[data-ar]").forEach(el => {
    el.textContent = english ? el.dataset.en : el.dataset.ar;
  });

  input.placeholder = english
    ? "Type your message..."
    : "اكتب رسالتك هنا...";

  $("languageBtn").textContent = english
    ? "🌐 العربية"
    : "🌐 English";
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

  chats.forEach((chat, index) => {
    const button = document.createElement("button");
    button.className = "history-item";
    button.textContent = chat.title;
    button.onclick = () => openChat(index);
    historyBox.appendChild(button);
  });
}

function saveCurrentChat() {
  if (!currentChat.length) return;

  const title =
    currentChat.find(m => m.role === "user")?.text ||
    "محادثة جديدة";

  chats.unshift({
    title: title.slice(0, 35),
    messages: [...currentChat]
  });

  if (chats.length > 20) chats.pop();

  currentChat = [];
  renderHistory();
}

function openChat(index) {
  currentChat = [...chats[index].messages];
  messages.replaceChildren();
  welcome.hidden = true;

  currentChat.forEach(m => addMessage(m.role, m.text));
  $("sidebar").classList.remove("open");
}

function newChat() {
  saveCurrentChat();
  currentChat = [];
  messages.replaceChildren();
  welcome.hidden = false;
}

async function sendMessage(text) {
  text = text.trim();

  if (!text || busy) return;

  welcome.hidden = true;
  busy = true;
  $("sendBtn").disabled = true;

  const history = currentChat
    .slice(-12)
    .map(m => ({
      role: m.role === "bot" ? "assistant" : "user",
      text: m.text
    }));

  addMessage("user", text);
  currentChat.push({ role: "user", text });

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

    loading.textContent = data.reply || "No response";

    currentChat.push({
      role: "bot",
      text: loading.textContent
    });

  } catch (error) {
    loading.textContent = english
      ? "Something went wrong. Please try again."
      : "حصل خطأ أثناء الاتصال. حاول مرة تانية.";

    console.error(error);
  }

  busy = false;
  $("sendBtn").disabled = false;
  input.focus();
}

form.addEventListener("submit", event => {
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

document.querySelectorAll(".suggestion").forEach(button => {
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
