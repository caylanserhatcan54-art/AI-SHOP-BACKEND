import { Router } from "express";

const router = Router();

router.get("/:shopId", async (req, res) => {
  const { shopId } = req.params;

  const html = `
<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />

<title>AI Shop Assistant</title>

<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: linear-gradient(to bottom right, #f8f8fa, #e8e9ed);
    font-family: "Segoe UI", sans-serif;
    height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .header {
    padding: 16px;
    background: white;
    border-bottom: 1px solid #ddd;
    font-size: 18px;
    font-weight: 600;
    text-align: center;
  }

  .chat-container {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
  }

  .msg {
    max-width: 85%;
    padding: 14px 18px;
    margin-bottom: 14px;
    border-radius: 10px;
    font-size: 16px;
    line-height: 1.5;
  }

  .ai {
    background: white;
    border: 1px solid #ddd;
    align-self: flex-start;
  }

  .user {
    background: #2f8bfd;
    color: white;
    margin-left: auto;
    align-self: flex-end;
  }

  .input-area {
    padding: 12px;
    background: white;
    border-top: 1px solid #ddd;
    display: flex;
    gap: 10px;
  }

  .input-area input {
    flex: 1;
    padding: 14px;
    font-size: 16px;
    border-radius: 8px;
    border: 1px solid #ccc;
    outline: none;
  }

  .input-area button {
    background: #2f8bfd;
    color: white;
    padding: 0 18px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
  }
</style>
</head>
<body>

<div class="header" id="shopName">AI Shop Assistant</div>

<div class="chat-container" id="chat"></div>

<div class="input-area">
  <input id="msgInput" type="text" placeholder="Mesajınızı yazın..." />
  <button onclick="sendMsg()">Gönder</button>
</div>

<script>
  const chat = document.getElementById("chat");
  const input = document.getElementById("msgInput");

  const shopId = "${shopId}";

  fetch("https://ai-shop-backend-2.onrender.com/api/shop/public/${shopId}")
    .then(res => res.json())
    .then(data => {
      if (data.ok && data.shop.shopName) {
        document.getElementById("shopName").innerText =
          data.shop.shopName + " - AI Asistan";
      }
    });

  function addMessage(text, sender = "ai") {
    const div = document.createElement("div");
    div.className = "msg " + sender;
    div.innerText = text;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
  }

  addMessage("Merhaba! Size nasıl yardımcı olabilirim? 😊", "ai");

  async function sendMsg() {
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, "user");
    input.value = "";

    const response = await fetch("https://ai-shop-backend-2.onrender.com/api/assistant/chat", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        shopId,
        message: text
      })
    });

    const data = await response.json();
    addMessage(data.reply || "Bir hata oluştu ❌", "ai");
  }
</script>

</body>
</html>
  `;

  res.send(html);
});

export default router;
