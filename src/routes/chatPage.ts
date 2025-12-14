import { Router } from "express";

const router = Router();

router.get("/:shopId", (req, res) => {
  const { shopId } = req.params;

  const html = `<!DOCTYPE html>
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

/* HEADER */
.header {
  padding: 14px 18px;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  background: radial-gradient(circle at top left, #1f2933, #111218);
  border-bottom: 1px solid #262832;
}

/* CHAT */
.chat {
  flex: 1;
  overflow-y: auto;
  padding: 18px 16px 120px;
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
  white-space: pre-wrap;
}

.bubble-ai {
  background: #22252f;
  border-top-left-radius: 6px;
}

.bubble-user {
  margin-left: auto;
  background: linear-gradient(135deg, #14b8a6, #22d3ee);
  border-top-right-radius: 6px;
  color: #001018;
}

/* INPUT */
.input-box {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
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
  outline: none;
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

/* PRODUCTS */
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
  object-fit: cover;
}

.product-title {
  font-size: 13px;
  font-weight: 600;
}

.product-price {
  font-size: 13px;
  color: #7dd3fc;
}

.product-link {
  padding: 8px;
  background: linear-gradient(135deg, #14b8a6, #22d3ee);
  border-radius: 999px;
  text-align: center;
  color: #001018;
  text-decoration: none;
  font-size: 13px;
}

/* 🔥 QUICK ACTIONS – TAM ORTA */
.quick-actions {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  max-width: 600px;
  padding: 20px;
  z-index: 10;
}

.quick-actions button {
  background: linear-gradient(135deg, #14b8a6, #22d3ee);
  border: none;
  color: #001018;
  padding: 10px 18px;
  border-radius: 999px;
  font-size: 13px;
  cursor: pointer;
  font-weight: 600;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.quick-actions button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(34,211,238,0.35);
}
</style>
</head>

<body>

<div class="header" id="shopName">Alışveriş’te Yapay Zekanız</div>

<div class="chat" id="chat"></div>

<!-- 🔥 ORTA BUTONLAR -->
<div class="quick-actions" id="quickActions">
  <button onclick="quickSend('Bana ürün öner')">⭐ Bana ürün öner</button>
  <button onclick="quickSend('Kombin önerisi iste')">👗 Kombin öner</button>
  <button onclick="quickSend('Spor ayakkabı öner')">👟 Spor ayakkabı</button>
  <button onclick="quickSend('Kışlık mont öner')">🧥 Kışlık mont</button>
  <button onclick="quickSend('Bütçeme göre ürün öner')">💸 Bütçeme göre</button>
  <button onclick="quickSend('Hediye öner')">🎁 Hediye öner</button>
</div>

<div class="input-box">
  <input id="msgInput" placeholder="Sorunuzu yazın…" />
  <button id="sendBtn">➤</button>
</div>

<script>
const shopId = "${shopId}";
const chat = document.getElementById("chat");
const input = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");
const quickActions = document.getElementById("quickActions");

let sessionId = localStorage.getItem("sessionId");
if (!sessionId) {
  sessionId = crypto.randomUUID();
  localStorage.setItem("sessionId", sessionId);
}

function hideQuickActions() {
  if (quickActions) quickActions.style.display = "none";
}

function quickSend(text) {
  input.value = text;
  hideQuickActions();
  sendMessage();
}

function addBubble(text, sender) {
  const div = document.createElement("div");
  div.className = sender === "user" ? "bubble-user" : "bubble-ai";
  div.innerText = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function addProducts(products) {
  const wrap = document.createElement("div");
  wrap.className = "bubble-ai";

  const grid = document.createElement("div");
  grid.className = "product-wrapper";

  products.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";

    if (p.imageUrl) {
      const img = document.createElement("img");
      img.src = p.imageUrl;
      card.appendChild(img);
    }

    const t = document.createElement("div");
    t.className = "product-title";
    t.innerText = p.title;
    card.appendChild(t);

    if (p.price) {
      const pr = document.createElement("div");
      pr.className = "product-price";
      pr.innerText = p.price;
      card.appendChild(pr);
    }

    if (p.url) {
      const a = document.createElement("a");
      a.className = "product-link";
      a.href = p.url;
      a.target = "_blank";
      a.innerText = "Ürünü Gör →";
      card.appendChild(a);
    }

    grid.appendChild(card);
  });

  wrap.appendChild(grid);
  chat.appendChild(wrap);
  chat.scrollTop = chat.scrollHeight;
}

async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  hideQuickActions();
  addBubble(text, "user");
  input.value = "";

  try {
    const res = await fetch(\`/api/assistant/\${shopId}\`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, sessionId })
    });

    const data = await res.json();
    if (data.reply) addBubble(data.reply, "ai");
    if (Array.isArray(data.products) && data.products.length) {
      addProducts(data.products);
    }
  } catch {
    addBubble("Bağlantı hatası oluştu.", "ai");
  }
}

sendBtn.onclick = sendMessage;
input.onkeydown = e => { if (e.key === "Enter") sendMessage(); };

fetch(\`/api/shop/public/\${shopId}\`)
  .then(r => r.json())
  .then(d => {
    if (d?.shop?.shopName) {
      document.getElementById("shopName").innerText =
        d.shop.shopName + " – Alışveriş’te Yapay Zekanız";
    }
  });

addBubble("Merhaba 👋 Nasıl yardımcı olabilirim?", "ai");
</script>

</body>
</html>`;

  res.send(html);
});

export default router;
