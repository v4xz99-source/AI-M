(() => {
  const $ = (id) => document.getElementById(id);
  const input = $("messageInput"), messages = $("messages"), welcome = $("welcome");
  const chatList = $("chatList"), sidebar = $("sidebar"), toast = $("toast");
  let lang = "ar", chats = [], activeId = null, toastTimer;
  const copy = {
    ar: {newChat:"محادثة جديدة",recent:"الأخيرة",ready:"جاهز للمحادثة",preview:"واجهة تجريبية",eyebrow:"مساعدك الذكي، بطريقتك",headline1:"فكّر أبعد.",headline2:"اصنع المستحيل.",welcomeCopy:"اسأل، استكشف، وابنِ أفكارك. مساحة واحدة لإبداعك وإنتاجيتك.",suggest1:"اشرح لي فكرة معقدة ببساطة",suggest2:"ساعدني أتعلم البرمجة",suggest3:"اقترح أفكار مشاريع جديدة",suggest4:"نظّم يومي وأولوياتي",inputPlaceholder:"اكتب رسالتك إلى AI M...",hint:"AI M قد يخطئ — راجع المعلومات المهمة",send:"إرسال",footer:"مساحتك الخاصة للأفكار. لا تشارك بيانات حساسة.",you:"أنت",ai:"AI M",thinking:"يفكر الآن...",demo:"الواجهة جاهزة، لكن نموذج الذكاء الاصطناعي غير متصل بعد. أضف مزود AI آمنًا في الخادم لتفعيل الردود الحقيقية.",empty:"اكتب رسالة أولًا.",error:"حصل خطأ أثناء الاتصال. حاول مرة أخرى.",newTitle:"محادثة جديدة",cleared:"تم مسح المحادثة الحالية."},
    en: {newChat:"New chat",recent:"RECENT",ready:"Ready to chat",preview:"UI preview",eyebrow:"YOUR AI, YOUR WAY",headline1:"Think beyond.",headline2:"Create the impossible.",welcomeCopy:"Ask, explore, and build your ideas. One space for creativity and productivity.",suggest1:"Explain a complex idea simply",suggest2:"Help me learn programming",suggest3:"Suggest fresh project ideas",suggest4:"Organize my day and priorities",inputPlaceholder:"Message AI M...",hint:"AI M can make mistakes — verify important info",send:"Send",footer:"Your space for ideas. Avoid sharing sensitive data.",you:"You",ai:"AI M",thinking:"Thinking...",demo:"The interface is ready, but the AI model is not connected yet. Add a secure AI provider on the server to enable real replies.",empty:"Write a message first.",error:"Something went wrong. Please try again.",newTitle:"New chat",cleared:"Current chat cleared."}
  };
  function t(k){return copy[lang][k] || k}
  function showToast(msg){toast.textContent=msg;toast.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove("show"),2800)}
  function applyLanguage(){
    document.documentElement.lang=lang;document.documentElement.dir=lang==="ar"?"rtl":"ltr";
    document.querySelectorAll("[data-i18n]").forEach(el=>{const key=el.dataset.i18n;if(t(key))el.textContent=t(key)});
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el=>{el.placeholder=t(el.dataset.i18nPlaceholder)});
    $("languageToggle").textContent=lang==="ar"?"EN":"عربي";
    input.placeholder=t("inputPlaceholder");
    renderChatList();
  }
  function makeChat(){const c={id:String(Date.now())+Math.random().toString(16).slice(2,6),title:t("newTitle"),items:[]};chats.unshift(c);activeId=c.id;renderChatList();renderMessages();return c}
  function current(){return chats.find(c=>c.id===activeId)}
  function renderChatList(){chatList.innerHTML="";chats.slice(0,12).forEach(c=>{const b=document.createElement("button");b.className="chat-item"+(c.id===activeId?" active":"");b.textContent=c.title;b.onclick=()=>{activeId=c.id;renderChatList();renderMessages();sidebar.classList.remove("open")};chatList.appendChild(b)})}
  function renderMessages(){
    messages.innerHTML="";const c=current();welcome.classList.toggle("is-hidden",!!(c&&c.items.length));
    if(!c)return;
    c.items.forEach(m=>addMessageNode(m.role,m.text));
    scrollBottom();
  }
  function addMessageNode(role,text){
    const row=document.createElement("div");row.className="message "+role;
    const avatar=document.createElement("div");avatar.className="avatar";avatar.textContent=role==="user"?(lang==="ar"?"أ":"Y"):"M.";
    const wrap=document.createElement("div");wrap.className="message-content";
    const label=document.createElement("div");label.className="message-label";label.textContent=role==="user"?t("you"):t("ai");
    const body=document.createElement("div");body.textContent=text;
    wrap.append(label,body);row.append(avatar,wrap);messages.appendChild(row);return row;
  }
  function scrollBottom(){const area=$("conversation");area.scrollTop=area.scrollHeight}
  function newChat(){makeChat();input.value="";input.focus();sidebar.classList.remove("open")}
  async function sendMessage(text){
    text=text.trim();if(!text){showToast(t("empty"));return}
    let c=current()||makeChat();c.items.push({role:"user",text});if(c.items.length===1)c.title=text.slice(0,30)+(text.length>30?"…":"");
    input.value="";input.style.height="auto";welcome.classList.add("is-hidden");renderChatList();addMessageNode("user",text);
    const row=addMessageNode("assistant","");row.querySelector(".message-content div:last-child").innerHTML='<span class="typing"><i></i><i></i><i></i></span>';
    $("sendButton").disabled=true;scrollBottom();
    try{
      // Secure integration point: implement /api/chat on the server and keep provider API keys there.
      const response=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:text,language:lang,history:c.items.slice(-12)})});
      if(response.status===404){
        const reply=t("demo");row.querySelector(".message-content div:last-child").textContent=reply;c.items.push({role:"assistant",text:reply});
      }else if(!response.ok){throw new Error("Request failed")}
      else{
        const data=await response.json();const reply=String(data.reply||t("error"));
        row.querySelector(".message-content div:last-child").textContent=reply;c.items.push({role:"assistant",text:reply});
      }
    }catch(e){const reply=t("error");row.querySelector(".message-content div:last-child").textContent=reply;c.items.push({role:"assistant",text:reply})}
    finally{$("sendButton").disabled=false;renderChatList();scrollBottom();input.focus()}
  }
  $("chatForm").addEventListener("submit",e=>{e.preventDefault();sendMessage(input.value)});
  input.addEventListener("input",()=>{input.style.height="auto";input.style.height=Math.min(input.scrollHeight,150)+"px"});
  input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();$("chatForm").requestSubmit()}});
  $("newChat").addEventListener("click",newChat);
  $("clearButton").addEventListener("click",()=>{if(current()){current().items=[];current().title=t("newTitle");renderMessages();renderChatList();showToast(t("cleared"))}});
  $("languageToggle").addEventListener("click",()=>{lang=lang==="ar"?"en":"ar";applyLanguage();renderMessages()});
  $("menuButton").addEventListener("click",()=>sidebar.classList.toggle("open"));
  document.querySelectorAll(".suggestion").forEach(b=>b.addEventListener("click",()=>sendMessage(lang==="ar"?b.dataset.promptAr:b.dataset.promptEn)));
  applyLanguage();makeChat();
})();