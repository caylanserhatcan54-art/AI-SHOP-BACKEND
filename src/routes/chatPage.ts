// src/routes/chatPage.ts
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

  .header {
    padding: 14px 18px;
    text-align: center;
    font-size: 16px;
    font-weight: 600;
    background: radial-gradient(circle at top left, #1f2933, #111218);
    border-bottom: 1px solid #262832;
    letter-spacing: 0.02em;
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
    box-shadow: 0 2px 8px rgba(0,0,0,0.35);
    white-space: pre-wrap;
  }

  .bubble-ai {
    background: #22252f;
    border-top-left-radius: 6px;
    color: #e8e8e8;
  }

  .bubble-user {
    margin-left: auto;
    background: linear-gradient(135deg, #4f46e5, #22d3ee);
    border-top-right-radius: 6px;
    color: white;
  }

  /* ✅ INPUT HER ZAMAN AŞAĞIDA GÖRÜNSÜN DİYE STICKY */
  .input-box {
    position: sticky;
    bottom: 0;
    padding: 12px 10px 14px;
    background: #111218;
    border-top: 1px solid #262832;
    display: flex;
    gap: 10px;
    z-index: 5;
  }

  .input-box input {
    flex: 1;
    background: #1b1d25;
    border: 1px solid #303341;
    padding: 12px 14px;
    border-radius: 999px;
    outline: none;
    color: #f5f5f5;
    font-size: 14px;
  }

  .input-box input::placeholder {
    color: #777b8a;
  }

  .input-box button {
    width: 46px;
    height: 46px;
    background: linear-gradient(135deg, #14b8a6, #22d3ee);
    border-radius: 999px;
    border: none;
    color: #0b1020;
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* ---------------- SORU BALONCUKLARI ---------------- */
  .starter-bubbles {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    margin: 8px auto 16px;
    max-width: 520px;
  }

  .starter-bubble {
    padding: 8px 12px;
    border-radius: 999px;
    background: rgba(34, 211, 238, 0.12);
    border: 1px solid rgba(45, 212, 191, 0.45);
    color: #e0fbff;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s ease-out;
    white-space: nowrap;
    user-select: none;
  }

  .starter-bubble:hover {
    background: rgba(34, 211, 238, 0.25);
    transform: translateY(-1px);
  }

  /* ---------------- ÜRÜN KARTI ---------------- */
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
    box-shadow: 0 4px 14px rgba(0,0,0,0.5);
    color: white;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .product-card img {
    width: 100%;
    border-radius: 12px;
    cursor: pointer;
    transition: 0.2s;
    background: #000;
    object-fit: cover;
  }

  .product-card img:hover { opacity: 0.9; }

  .product-title {
    font-size: 13px;
    font-weight: 600;
    line-height: 1.3;
  }

  .product-price {
    font-size: 13px;
    color: #7dd3fc;
    font-weight: 500;
  }

  .product-cta {
    font-size: 12px;
    color: #a5b4fc;
  }

  .product-link {
    margin-top: 4px;
    padding: 8px 10px;
    background: linear-gradient(135deg, #4f46e5, #22c1c3);
    border-radius: 999px;
    text-align: center;
    color: white;
    font-size: 13px;
    text-decoration: none;
    font-weight: 500;
    display: inline-block;
  }

  /* ---------------- BÜYÜK GÖRSEL POPUP ---------------- */
  #imgModal {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.85);
    display: none;
    justify-content: center;
    align-items: center;
    z-index: 50;
  }

  #imgModal img {
    max-width: 92%;
    max-height: 92%;
    border-radius: 18px;
  }

  @media (max-width: 600px) {
    .product-card { width: 100%; max-width: 320px; }
  }
</style>
</head>

<body>
  <div class="header" id="shopName">Alışveriş’te Yapay Zekanız</div>

  <div class="chat" id="chat">
    <div id="starterArea">
      <div class="starter-bubbles">
        <div class="starter-bubble" data-q="Bana ürün öner.">Bana ürün öner ✨</div>
        <div class="starter-bubble" data-q="Kombin önerisi yapar mısın?">Kombin önerisi iste 👗</div>
        <div class="starter-bubble" data-q="Spor ayakkabı öner.">Spor ayakkabı öner 👟</div>
        <div class="starter-bubble" data-q="Kış için mont öner.">Kışlık mont öner 🧥</div>
        <div class="starter-bubble" data-q="Bütçeme uygun ürün öner.">Bütçeme göre ürün 💸</div>
        <div class="starter-bubble" data-q="Hediye almak istiyorum, ne önerirsin?">Hediye öner 🎁</div>
      </div>
    </div>
  </div>

  <!-- ✅ INPUT (SEND) BÖLÜMÜ MUTLAKA BODY İÇİNDE -->
  <div class="input-box">
    <input id="msgInput" type="text" placeholder="Alışveriş için hazırım, sorunuzu yazın 🛍️" />
    <button id="sendBtn" type="button">➤</button>
  </div>

  <!-- IMAGE MODAL -->
  <div id="imgModal">
    <img id="modalImage" />
  </div>

<script>
  const chat = document.getElementById("chat");
  const input = document.getElementById("msgInput");
  const sendBtn = document.getElementById("sendBtn");
  const starterArea = document.getElementById("starterArea");
  const shopId = "${shopId}";

  const imgModal = document.getElementById("imgModal");
  const modalImage = document.getElementById("modalImage");

  imgModal.addEventListener("click", () => {
    imgModal.style.display = "none";
  });

  function openImage(url) {
    if (!url) return;
    modalImage.src = url;
    imgModal.style.display = "flex";
  }

  function addBubble(text, sender) {
    if (!text) return;
    const div = document.createElement("div");
    div.className = sender === "user" ? "bubble-user" : "bubble-ai";
    div.innerText = String(text);
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
  }

  function buildPersuasiveText() {
    const candidates = [
      "Bu model günlük kullanımda hem rahat hem de şık duracak bir ürün.",
      "Son zamanlarda en çok tercih edilen parçalardan biri, gözden kaçmasın.",
      "Fiyat / performans olarak oldukça mantıklı bir tercih gibi görünüyor.",
      "Tarzını yükseltecek, kombinlerinde yıldız parça olabilir.",
      "Rahatlığı ve görünümüyle öne çıkan bir model gibi duruyor.",
      "Hem sade hem modern çizgisiyle çoğu ortama uyum sağlayabilir."
    ];
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  function addProductGroup(products) {
    if (!products || !products.length) return;

    const wrapperBubble = document.createElement("div");
    wrapperBubble.className = "bubble-ai";

    const wrapper = document.createElement("div");
    wrapper.className = "product-wrapper";

    products.forEach((p) => {
      const card = document.createElement("div");
      card.className = "product-card";

      const img = document.createElement("img");

      const imgSrc = Array.isArray(p.imageUrl)
        ? p.imageUrl[0]
        : (p.imageUrl || p.image || "");

      img.src = imgSrc;
      img.onclick = () => openImage(imgSrc);

      const title = document.createElement("div");
      title.className = "product-title";
      title.innerText = p.title || "";

      const price = document.createElement("div");
      price.className = "product-price";
      price.innerText = p.price || "";

      const cta = document.createElement("div");
      cta.className = "product-cta";
      cta.innerText = buildPersuasiveText();

      const link = document.createElement("a");
      link.className = "product-link";
      link.href = p.url || "#";
      link.target = "_blank";
      link.innerText = "Ürünü Gör →";

      card.appendChild(img);
      card.appendChild(title);
      if (p.price) card.appendChild(price);
      card.appendChild(cta);
      card.appendChild(link);

      wrapper.appendChild(card);
    });

    wrapperBubble.appendChild(wrapper);
    chat.appendChild(wrapperBubble);
    chat.scrollTop = chat.scrollHeight;
  }

  function hideStarter() {
    if (!starterArea) return;
    starterArea.style.display = "none";
  }

  async function sendMessage(textFromBubble) {
    const text = (textFromBubble || input.value || "").trim();
    if (!text) return;

    hideStarter();
    addBubble(text, "user");
    input.value = "";

    try {
      // ✅ SAME ORIGIN: render linki hardcode yok
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, message: text })
      });

      const data = await res.json();

      if (data.reply) addBubble(data.reply, "ai");

      if (Array.isArray(data.products) && data.products.length) {
        addProductGroup(data.products.slice(0, 4));
      }
    } catch (e) {
      console.error(e);
      addBubble("Şu anda bir bağlantı sorunu yaşıyorum, biraz sonra tekrar dener misin? ❌", "ai");
    }
  }

  // Mağaza adını çek ve header’a yaz
  fetch("/api/shop/public/${shopId}")
    .then(r => r.json())
    .then(data => {
      if (data && data.ok && data.shop) {
        const name = (data.shop.shopName || data.shop.shopId || "").toString().toUpperCase();
        const el = document.getElementById("shopName");
        if (el) el.innerText = name + " – Alışveriş’te Yapay Zekanız";
      }
    })
    .catch(() => {});

  // Başlangıç mesajı
  addBubble("Merhaba 👋 Nasıl yardımcı olabilirim? Ürün, kombin veya bütçene göre seçim yapabilirim.", "ai");

  // ✅ input odak
  setTimeout(() => { try { input.focus(); } catch(e) {} }, 100);

  // Input / buton events
  sendBtn.addEventListener("click", () => sendMessage());
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  // Starter baloncukları
  document.querySelectorAll(".starter-bubble").forEach((el) => {
    el.addEventListener("click", () => {
      const q = el.getAttribute("data-q") || "";
      sendMessage(q);
    });
  });
</script>

</body>
</html>`;

  res.send(html);
});

export default router;
