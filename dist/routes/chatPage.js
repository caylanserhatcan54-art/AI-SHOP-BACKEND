import { Router } from "express";
const router = Router();
router.get("/:shopId", (req, res) => {
    const { shopId } = req.params;
    res.send(`
<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<title>${shopId} - AI Asistan</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0" />

<style>
  body {
    font-family: Arial, sans-serif;
    background: #111;
    color: white;
    margin: 0;
    padding: 0;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background-image: url('https://flowai-client.vercel.app/bg-pattern.png');
    background-size: cover;
  }

  .header {
    padding: 15px;
    background: rgba(0,0,0,0.6);
    text-align: center;
    font-size: 20px;
    font-weight: bold;
    border-bottom: 1px solid #333;
  }

  .chat-box {
    flex: 1;
    padding: 15px;
    overflow-y: auto;
  }

  .msg {
    max-width: 70%;
    padding: 10px 15px;
    margin-bottom: 12px;
    border-radius: 14px;
    line-height: 1.4;
  }

  .user {
    background: #4a90e2;
    margin-left: auto;
    text-align: right;
  }

  .bot {
    background: #2b2b2b;
    margin-right: auto;
  }

  .input-area {
    display: flex;
    padding: 10px;
    background: rgba(0,0,0,0.85);
  }

  input {
    flex: 1;
    padding: 12px;
    border-radius: 10px;
    border: none;
    outline: none;
  }

  button {
    padding: 12px 18px;
    border: none;
    background: #4a90e2;
    color: white;
    margin-left: 10px;
    border-radius: 10px;
    cursor: pointer;
  }
</style>

</head>

<body>

<div class="header">${shopId} Mağaza Asistanı 🤖</div>

<div class="chat-box" id="chatBox">
  <div class="msg bot">Merhaba! Ben ${shopId} mağazasının yapay zeka asistanıyım. Size nasıl yardımcı olabilirim?</div>
</div>

<div class="input-area">
  <input id="msgInput" placeholder="Mesajınızı yazın..." />
  <button onclick="sendMsg()">Gönder</button>
</div>

<script>
const API_URL = "https://ai-shop-backend-2.onrender.com";

async function sendMsg() {
    const input = document.getElementById("msgInput");
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, "user");
    input.value = "";

    const res = await fetch(API_URL + "/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId: "${shopId}", message: text })
    });

    const data = await res.json();
    addMessage(data.reply, "bot");
}

function addMessage(text, type) {
    const box = document.getElementById("chatBox");
    const div = document.createElement("div");
    div.className = "msg " + type;
    div.innerText = text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}
</script>

</body>
</html>
`);
});
export default router;
