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
    max-width: 85%;
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
    max-width: 85%;
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

  /* ----------- ÜRÜN KARTI TASARIMI ----------- */

  .product-card {
    width: 100%;
    max-width: 340px;
    background: #2b2b2b;
    border-radius: 16px;
    padding: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.35);
    color: white;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .product-card img {
    width: 100%;
    border-radius: 12px;
    cursor: pointer;
    transition: 0.2s;
  }

  .product-card img:hover {
    opacity: 0.85;
  }

  .product-title {
    font-size: 16px;
    font-weight: 600;
    line-height: 1.3;
  }

  .product-price {
    font-size: 15px;
    color: #58a6ff;
    font-weight: 500;
  }

  .product-link {
    margin-top: 8px;
    padding: 10px 12px;
    background: #4c8bf5;
    border-radius: 10px;
    text-align: center;
    color: white;
    font-size: 14px;
    text-decoration: none;
    font-weight: 500;
  }

  /* ----------- BÜYÜK GÖRSEL POP-UP ----------- */

  #imgModal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    display: none;
    justify-content: center;
    align-items: center;
    z-index: 999;
  }

  #imgModal img {
    max-width: 90%;
    max-height: 90%;
    border-radius: 12px;
  }
</style>
</head>

<body>

<div class="header" id="shopName">Alışveriş’te Yapay Zekanız</div>

<div class="chat" id="chat"></div>

<div class="input-box">
  <input id="msgInput" type="text" placeholder="Alışveriş için hazırım, sorunuzu yazın 🛍️" />
  <button onclick="sendMessage()">➤</button>
</div>

<!-- IMAGE MODAL -->
<div id="imgModal" onclick="this.style.display='none'">
  <img id="modalImage">
</div>

<script>
  const chat = document.getElementById("chat");
  const input = document.getElementById("msgInput");
  const shopId = "${shopId}";

  function openImage(url) {
    document.getElementById("modalImage").src = url;
    document.getElementById("imgModal").style.display = "flex";
  }

  function addProductCard(p) {
    const div = document.createElement("div");
    div.className = "bubble-ai";

    div.innerHTML = \`
      <div class="product-card">
        <img src="\${p.imageUrl}" onclick="openImage('\${p.imageUrl}')">
        <div class="product-title">\${p.title}</div>
        <div class="product-price">\${p.price || ""}</div>
        <a class="product-link" href="\${p.url}" target="_blank">Ürünü Gör →</a>
      </div>
    \`;

    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
  }

  function addBubble(text, sender) {
    const div = document.createElement("div");
    div.className = sender === "user" ? "bubble-user" : "bubble-ai";
    div.innerText = text;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
  }

  // Mağaza adı
  fetch("https://ai-shop-backend-2.onrender.com/api/shop/public/${shopId}")
    .then(r => r.json())
    .then(data => {
      if (data.ok) {
        const name = (data.shop.shopName || data.shop.shopId || "").toUpperCase();
        document.getElementById("shopName").innerText =
          name + " – Alışveriş’te Yapay Zekanız";
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
      body: JSON.stringify({ shopId, message: text })
    });

    const data = await res.json();

    if (Array.isArray(data.products)) {
      data.products.forEach(p => addProductCard(p));
    }

    if (data.reply) {
      addBubble(data.reply, "ai");
    }
  }
</script>

</body>
</html>
  `;
    res.send(html);
});
export default router;
