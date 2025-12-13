import { Router } from "express";
const router = Router();
router.get("/:shopId", (req, res) => {
    const { shopId } = req.params;
    const html = `
<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>AI Shop Assistant</title>

<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    height: 100vh;
    background: #14151a;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif;
    display: flex;
    flex-direction: column;
    color: #f5f5f5;
  }
  .header {
    padding: 14px 18px;
    text-align: center;
    font-size: 16px;
    font-weight: 600;
    background: radial-gradient(circle at top left, #1f2933, #111218);
    border-bottom: 1px solid #262832;
  }
  .chat {
    flex: 1;
    overflow-y: auto;
    padding: 18px 16px 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .bubble-ai, .bubble-user {
    max-width: 85%;
    padding: 12px 14px;
    border-radius: 18px;
    font-size: 14px;
    line-height: 1.5;
  }
  .bubble-ai {
    background: #22252f;
    border-top-left-radius: 6px;
  }
  .bubble-user {
    margin-left: auto;
    background: linear-gradient(135deg, #4f46e5, #22d3ee);
    border-top-right-radius: 6px;
    color: white;
  }
  .input-box {
    padding: 12px;
    background: #111218;
    border-top: 1px solid #262832;
    display: flex;
    gap: 10px;
  }
  .input-box input {
    flex: 1;
    background: #1b1d25;
    border: 1px solid #303341;
    padding: 12px 14px;
    border-radius: 999px;
    color: white;
  }
  .input-box button {
    width: 46px;
    height: 46px;
    border-radius: 999px;
    border: none;
    background: linear-gradient(135deg, #14b8a6, #22d3ee);
    cursor: pointer;
  }

  .starter-bubbles {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    margin-bottom: 12px;
  }
  .starter-bubble {
    padding: 8px 12px;
    border-radius: 999px;
    background: rgba(34,211,238,0.15);
    border: 1px solid rgba(34,211,238,0.4);
    cursor: pointer;
    font-size: 13px;
  }

  .product-wrapper {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .product-card {
    width: 210px;
    background: #1b1e27;
    border-radius: 16px;
    padding: 10px;
  }
  .product-card img {
    width: 100%;
    border-radius: 12px;
    object-fit: cover;
    cursor: pointer;
  }
  .product-title {
    font-size: 13px;
    font-weight: 600;
  }
  .product-link {
    display: block;
    margin-top: 6px;
    text-align: center;
    padding: 8px;
    border-radius: 999px;
    background: linear-gradient(135deg,#4f46e5,#22c1c3);
    color: white;
    text-decoration: none;
    font-size: 13px;
  }

  #imgModal {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.85);
    display: none;
    justify-content: center;
    align-items: center;
    z-index: 100;
  }
  #imgModal img {
    max-width: 90%;
    max-height: 90%;
    border-radius: 18px;
  }
</style>
</head>

<body>

<div class="header" id="shopName">Alışveriş’te Yapay Zekanız</div>

<div class="chat" id="chat">
  <div id="starterArea">
    <div class="starter-bubbles">
      <div class="starter-bubble" data-q="Bana ürün öner">Bana ürün öner ✨</div>
      <div class="starter-bubble" data-q="Kombin öner">Kombin öner 👗</div>
      <div class="starter-bubble" data-q="Spor ayakkabı öner">Spor ayakkabı 👟</div>
      <div class="starter-bubble" data-q="Kış için mont öner">Kışlık mont 🧥</div>
      <div class="starter-bubble" data-q="Bütçeme uygun ürün öner">Bütçeye göre 💸</div>
      <div class="starter-bubble" data-q="Hediye almak istiyorum">Hediye 🎁</div>
    </div>
  </div>
</div>

<div class="input-box">
  <input id="msgInput" placeholder="Alışveriş için hazırım…" />
  <button id="sendBtn">➤</button>
</div>

<div id="imgModal"><img id="modalImage"></div>

<script>
  const chat = document.getElementById("chat");
  const input = document.getElementById("msgInput");
  const sendBtn = document.getElementById("sendBtn");
  const starterArea = document.getElementById("starterArea");
  const shopId = "${shopId}";

  function addBubble(text, who) {
    const d = document.createElement("div");
    d.className = who === "user" ? "bubble-user" : "bubble-ai";
    d.innerText = text;
    chat.appendChild(d);
    chat.scrollTop = chat.scrollHeight;
  }

  function addProducts(products) {
    const bubble = document.createElement("div");
    bubble.className = "bubble-ai";
    const wrap = document.createElement("div");
    wrap.className = "product-wrapper";

    products.forEach(p => {
      const card = document.createElement("div");
      card.className = "product-card";

      const img = document.createElement("img");
      img.src = p.imageUrl || "";
      img.onclick = () => openImage(img.src);

      const title = document.createElement("div");
      title.className = "product-title";
      title.innerText = p.title || "";

      const link = document.createElement("a");
      link.className = "product-link";
      link.href = p.url || "#";
      link.target = "_blank";
      link.innerText = "Ürünü Gör →";

      card.appendChild(img);
      card.appendChild(title);
      card.appendChild(link);
      wrap.appendChild(card);
    });

    bubble.appendChild(wrap);
    chat.appendChild(bubble);
  }

  function openImage(src) {
    const m = document.getElementById("imgModal");
    const i = document.getElementById("modalImage");
    i.src = src;
    m.style.display = "flex";
    m.onclick = () => m.style.display = "none";
  }

  async function sendMessage(textFromBubble) {
    const text = (textFromBubble || input.value).trim();
    if (!text) return;

    if (starterArea) starterArea.style.display = "none";
    addBubble(text, "user");
    input.value = "";

    const res = await fetch("/api/assistant/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shopId, message: text })
    });

    const data = await res.json();

    if (data.reply) addBubble(data.reply, "ai");
    if (Array.isArray(data.products) && data.products.length) {
      addProducts(data.products.slice(0,4));
    }
  }

  sendBtn.onclick = () => sendMessage();
  input.onkeydown = e => e.key === "Enter" && sendMessage();

  document.querySelectorAll(".starter-bubble").forEach(b => {
    b.onclick = () => sendMessage(b.dataset.q);
  });

  addBubble("Merhaba 👋 Nasıl yardımcı olabilirim?", "ai");
</script>

</body>
</html>
`;
    res.send(html);
});
export default router;
