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
    background: #1f1f1f;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif;
    display: flex;
    flex-direction: column;
    color: white;
  }

  .header {
    padding: 16px;
    text-align: center;
    font-size: 18px;
    font-weight: 600;
    background: #262626;
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

  .bubble-ai {
    max-width: 80%;
    padding: 14px 18px;
    background: #2f2f2f;
    border-radius: 16px;
    border-top-left-radius: 4px;
    font-size: 15px;
    line-height: 1.5;
    color: #e8e8e8;
    box-shadow: 0 2px 8px rgba(0,0,0,0.35);
  }

  .bubble-user {
    max-width: 80%;
    margin-left: auto;
    padding: 14px 18px;
    background: #4c8bf5;
    border-radius: 16px;
    border-top-right-radius: 4px;
    font-size: 15px;
    color: white;
    line-height: 1.5;
    box-shadow: 0 2px 8px rgba(0,0,0,0.35);
  }

  .input-box {
    padding: 14px;
    background: #262626;
    border-top: 1px solid #333;
    display: flex;
    gap: 10px;
  }

  .input-box input {
    flex: 1;
    background: #333;
    border: none;
    padding: 14px;
    border-radius: 24px;
    outline: none;
    color: white;
    font-size: 15px;
  }

  .input-box button {
    width: 50px;
    height: 50px;
    background: #4c8bf5;
    border-radius: 50%;
    border: none;
    color: white;
    font-size: 18px;
  }
</style>
</head>

<body>

<div class="header" id="shopName">Alışveriş'te Yapay Zekanız</div>

<div class="chat" id="chat"></div>

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

  // Mağaza adını çek
fetch("https://ai-shop-backend-2.onrender.com/api/shop/public/${shopId}")
  .then(r => r.json())
  .then(data => {
    if (data.ok) {
      // ÖRNEK: "SERHAT – Alışveriş’te Yapay Zekanız"
      document.getElementById("shopName").innerText =
        data.shop.shopId + " – Alışveriş’te Yapay Zekanız";
    }
  });

  addBubble("Merhaba 👋 Nasıl yardımcı olabilirim?", "ai");

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    addBubble(text, "user");
    input.value = "";

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
