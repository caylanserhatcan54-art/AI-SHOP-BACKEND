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
  body {
    margin: 0;
    height: 100vh;
    background: #1a1a1a;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    display: flex;
    flex-direction: column;
    color: white;
  }

  .header {
    padding: 16px;
    text-align: center;
    font-size: 18px;
    font-weight: 600;
    background: #222;
    border-bottom: 1px solid #333;
  }

  .chat {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 10px;
  }

  .suggestion-btn {
    padding: 10px 14px;
    background: #2d2d2d;
    border-radius: 14px;
    font-size: 14px;
    cursor: pointer;
    border: 1px solid #3a3a3a;
    color: #8be0ff;
    transition: 0.2s;
  }
  .suggestion-btn:hover { background: #333; }

  .bubble-ai {
    max-width: 80%;
    padding: 14px 18px;
    background: #2c2c2c;
    border-radius: 16px;
    border-top-left-radius: 4px;
    color: #e6e6e6;
    font-size: 15px;
    line-height: 1.5;
  }

  .bubble-user {
    max-width: 80%;
    margin-left: auto;
    padding: 14px 18px;
    background: #4c8bf5;
    border-radius: 16px;
    border-top-right-radius: 4px;
    color: white;
    font-size: 15px;
  }

  .input-box {
    padding: 14px;
    background: #222;
    border-top: 1px solid #333;
    display: flex;
    gap: 10px;
  }

  .input-box input {
    flex: 1;
    background: #333;
    border: none;
    padding: 14px;
    border-radius: 22px;
    color: white;
    font-size: 15px;
  }

  .input-box button {
    width: 50px;
    height: 50px;
    background: #4c8bf5;
    border-radius: 50%;
    border: none;
    font-size: 20px;
    color: white;
    cursor: pointer;
  }
</style>
</head>
<body>

<div class="header" id="shopName">Yükleniyor...</div>

<div class="chat" id="chat">

  <div class="suggestions" id="suggestions">
    <div class="suggestion-btn" onclick="quickAsk('Kombin önerisi verir misin?')">🧥 Kombin Önerisi</div>
    <div class="suggestion-btn" onclick="quickAsk('Bana ürün önerir misin?')">🛍️ Ürün Önerisi</div>
    <div class="suggestion-btn" onclick="quickAsk('Bu mağazada ne var?')">📦 Ürünlere Bak</div>
    <div class="suggestion-btn" onclick="quickAsk('Fiyat performans ürünü öner')">💎 FP Ürün Öner</div>
    <div class="suggestion-btn" onclick="quickAsk('Yeni gelenler neler?')">✨ Yeni Gelenler</div>
  </div>

</div>

<div class="input-box">
  <input id="msgInput" type="text" placeholder="Alışveriş için hazırım, sorunuzu yazın 🛍️" />
  <button onclick="sendMessage()">➤</button>
</div>

<script>
  const chat = document.getElementById("chat");
  const input = document.getElementById("msgInput");
  const shopId = "${shopId}";

  function addBubble(text, sender) {
    const div = document.createElement("div");
    div.className = sender === "user" ? "bubble-user" : "bubble-ai";
    div.innerText = text;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
  }

  // 🔥 MAĞAZA ADINI GETİR
  fetch("https://ai-shop-backend-2.onrender.com/api/shop/public/" + shopId)
    .then(r => r.json())
    .then(data => {
      if (data.ok && data.shop && data.shop.shopName) {
        document.getElementById("shopName").innerText =
          data.shop.shopName + " – Alışveriş'te Yapay Zekanız";
      } else {
        document.getElementById("shopName").innerText = "Mağaza bulunamadı ❌";
      }
    });

  // AI karşılama mesajı
  addBubble("Merhaba 👋 Nasıl yardımcı olabilirim?", "ai");

  // 🔥 Hızlı soru balonları → otomatik sor
  function quickAsk(txt) {
    addBubble(txt, "user");
    sendToAI(txt);
    document.getElementById("suggestions").style.display = "none";
  }

  // Mesaj gönderme
  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    addBubble(text, "user");
    input.value = "";
    sendToAI(text);
  }

  // AI API
  async function sendToAI(text) {
    const res = await fetch("https://ai-shop-backend-2.onrender.com/api/assistant/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shopId,
        message: text
      })
    });

    const data = await res.json();
    addBubble(data.reply || "Bir hata oluştu ❌", "ai");
  }
</script>

</body>
</html>
  `;
    res.send(html);
});
export default router;
