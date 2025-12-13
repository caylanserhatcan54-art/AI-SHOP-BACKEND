// src/routes/chatPage.ts
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

.bubble-ai,
.bubble-user {
  max-width: 85%;
  padding: 12px 14px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.5;
  box-shadow: 0 2px 8px rgba(0,0,0,0.35);
}

.bubble-ai {
  background: #22252f;
  border-top-left-radius: 6px;
}

.bubble-user {
  margin-left: auto;
  background: linear-gradient(135deg, #4f46e5, #22d3ee);
  border-top-right-radius: 6px;
  color: #fff;
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
  color: #fff;
}

.input-box button {
  width: 46px;
  height: 46px;
  background: linear-gradient(135deg, #14b8a6, #22d3ee);
  border-radius: 999px;
  border: none;
  font-size: 18px;
  cursor: pointer;
}

/* ÜRÜN KARTI */
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
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.product-card img {
  width: 100%;
  border-radius: 12px;
  cursor: pointer;
  object-fit: cover;
}

.product-title { font-size: 13px; font-weight: 600; }
.product-price { font-size: 13px; color: #7dd3fc; }
.product-cta { font-size: 12px; color: #a5b4fc; }

.product-link {
  margin-top: 4px;
  padding: 8px;
  background: linear-gradient(135deg, #4f46e5, #22c1c3);
  border-radius: 999px;
  text-align: center;
  color: #fff;
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
}

#imgModal img {
  max-width: 92%;
  max-height: 92%;
  border-radius: 18px;
}
</style>
</head>

<body>

<div class="header" id="shopName">Alışveriş’te Yapay Zekanız</div>
<div class="chat" id="chat"></div>

<div class="input-box">
  <input id="msgInput" placeholder="Sorunu yaz..." />
  <button id="sendBtn">➤</button>
</div>

<div id="imgModal"><img id="modalImage"></div>

<script>
const API_BASE = window.location.origin;
const shopId = "${shopId}";
const chat = document.getElementById("chat");
const input = document.getElementById("msgInput");

function addBubble(text, sender) {
  const div = document.createElement("div");
  div.className = sender === "user" ? "bubble-user" : "bubble-ai";
  div.innerText = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function openImage(url) {
  document.getElementById("modalImage").src = url;
  document.getElementById("imgModal").style.display = "flex";
}

document.getElementById("imgModal").onclick = () =>
  document.getElementById("imgModal").style.display = "none";

function addProductGroup(products) {
  if (!products || !products.length) return;

  const bubble = document.createElement("div");
  bubble.className = "bubble-ai";

  const wrapper = document.createElement("div");
  wrapper.className = "product-wrapper";

  products.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";

    const img = document.createElement("img");
    const src = Array.isArray(p.imageUrl) ? p.imageUrl[0] : p.imageUrl;
    img.src = src || "";
    img.onclick = () => openImage(src);

    const title = document.createElement("div");
    title.className = "product-title";
    title.innerText = p.title || "";

    const price = document.createElement("div");
    price.className = "product-price";
    price.innerText = p.price || "";

    const link = document.createElement("a");
    link.className = "product-link";
    link.href = p.url || "#";
    link.target = "_blank";
    link.innerText = "Ürünü Gör →";

    card.append(img, title, price, link);
    wrapper.appendChild(card);
  });

  bubble.appendChild(wrapper);
  chat.appendChild(bubble);
}

async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  addBubble(text, "user");
  input.value = "";

  try {
    const res = await fetch(API_BASE + "/api/assistant/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shopId, message: text })
    });

    const data = await res.json();

    if (data.reply) addBubble(data.reply, "ai");
    if (Array.isArray(data.products) && data.products.length) {
      addProductGroup(data.products.slice(0, 4));
    }

  } catch {
    addBubble("Bağlantı hatası ❌", "ai");
  }
}

document.getElementById("sendBtn").onclick = sendMessage;
input.onkeydown = e => e.key === "Enter" && sendMessage();

addBubble("Merhaba 👋 Nasıl yardımcı olabilirim?", "ai");
</script>

</body>
</html>
`;

  res.send(html);
});

export default router;
