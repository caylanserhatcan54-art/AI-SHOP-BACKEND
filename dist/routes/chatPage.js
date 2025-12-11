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
    background: #1a1d21;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif;
    display: flex;
    flex-direction: column;
    color: white;
  }

  .header {
    padding: 18px;
    text-align: center;
    font-size: 20px;
    font-weight: 600;
    background: #1f2328;
    border-bottom: 1px solid #2a2e33;
  }

  .chat {
    flex: 1;
    overflow-y: auto;
    padding: 22px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  /* AI mesaj balonu */
  .bubble-ai {
    max-width: 80%;
    padding: 14px 18px;
    background: #2a2f35;
    border-radius: 18px;
    border-top-left-radius: 6px;
    font-size: 16px;
    line-height: 1.5;
    color: #d9d9d9;
    box-shadow: 0 2px 8px rgba(0,0,0,0.35);
    white-space: pre-line;
  }

  /* Kullanıcı mesajı */
  .bubble-user {
    max-width: 80%;
    margin-left: auto;
    padding: 14px 18px;
    background: #4bc3ff;
    border-radius: 18px;
    border-top-right-radius: 6px;
    font-size: 16px;
    color: #fff;
    line-height: 1.5;
    box-shadow: 0 2px 8px rgba(0,0,0,0.35);
  }

  /* Öneri buton tasarımı */
  .suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 10px;
  }

  .suggestion-btn {
    padding: 14px 20px;
    background: #24292e;
    border-radius: 18px;
    border: 1px solid #333;
    color: #4bc3ff;
    font-size: 15px;
    cursor: pointer;
    transition: 0.2s;
  }

  .suggestion-btn:hover {
    background: #2d3339;
  }

  .input-box {
    padding: 14px;
    background: #1f2328;
    border-top: 1px solid #2a2e33;
    display: flex;
    gap: 10px;
  }

  .input-box input {
    flex: 1;
    background: #2a2f35;
    border: none;
    padding: 14px;
    border-radius: 22px;
    outline: none;
    color: white;
    font-size: 15px;
  }

  .input-box button {
    width: 52px;
    height: 52px;
    background: #4bc3ff;
    border-radius: 50%;
    border: none;
    color: #fff;
    font-size: 22px;
  }

  @media (max-width: 600px) {
    .bubble-ai,
    .bubble-user {
      max-width: 90%;
    }
  }
</style>

</head>
<body>

<div class="header" id="shopName">AI Asistan</div>

<div class="chat" id="chat">

  <!-- İlk girişte öneri baloncukları -->
  <div id="suggestionArea">
    <p style="color:#4bc3ff; font-size:17px; font-weight:600; margin-bottom:10px;">
      Başlamak için bir konu seç:
    </p>

    <div class="suggestions">
      <div class="suggestion-btn" onclick="autoAsk('Kombin önerisi verir misin?')">
        👗 Kombin Önerisi
      </div>
      <div class="suggestion-btn" onclick="autoAsk('Bir ürün bulur musun?')">
        🔍 Ürün Ara
      </div>
      <div class="suggestion-btn" onclick="autoAsk('Benzer ürün öner')">
        🛍️ Benzer Ürün
      </div>
      <div class="suggestion-btn" onclick="autoAsk('Stilime göre öneriler ver')">
        ✨ Stil Önerisi
      </div>
      <div class="suggestion-btn" onclick="autoAsk('Fiyat analizi yap')">
        💰 Fiyat Analizi
      </div>
    </div>
  </div>

</div>

<div class="input-box">
  <input id="msgInput" type="text" placeholder="Alışveriş için hazırım, sorabilirsiniz 🛍️" />
  <button onclick="sendMessage()">➤</button>
</div>

<script>
  const shopId = "${shopId}";
  const chat = document.getElementById("chat");
  const input = document.getElementById("msgInput");

  // Baloncuk ekleme
  function addBubble(text, sender) {
    const div = document.createElement("div");
    div.className = sender === "user" ? "bubble-user" : "bubble-ai";
    div.innerText = text;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
  }

  // Öneri balonu tıklandığında otomatik soru sor
  function autoAsk(question) {
    document.getElementById("suggestionArea").style.display = "none";
    addBubble(question, "user");
    askBackend(question);
  }

  // Mesaj gönderme
  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    addBubble(text, "user");
    input.value = "";

    askBackend(text);
  }

  // Backend API
  async function askBackend(msg) {
    const res = await fetch("https://ai-shop-backend-2.onrender.com/api/assistant/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shopId, message: msg })
    });

    const data = await res.json();
    addBubble(data.reply || "Bir hata oluştu ❌", "ai");
  }

  // Mağaza adı
  fetch("https://ai-shop-backend-2.onrender.com/api/shop/public/${shopId}")
    .then(r => r.json())
    .then(d => {
      if (d.ok) {
        document.getElementById("shopName").innerText =
  data.shop.shopName + " – Alışverişte ";
      }
    });
</script>

</body>
</html>
  `;
    res.send(html);
});
export default router;
