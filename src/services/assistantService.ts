export async function getAIResponse(shopId: string, message: string) {
  let reply = "";

  const msg = message.toLowerCase();

  if (msg.includes("merhaba")) {
    reply = "Merhaba! Size nasıl yardımcı olabilirim? 😊";
  } else if (msg.includes("kargo")) {
    reply = "Kargonuz hazırlanıyor 🚚 Kısa süre içinde yola çıkacak!";
  } else if (msg.includes("fiyat")) {
    reply = "Hangi ürün için fiyat bilgisi istersiniz?";
  } else if (msg.includes("ürün")) {
    reply = "Elimizdeki ürünleri inceliyorum 🔍 Sizin için en iyilerini sunacağım.";
  } else {
    reply = "Tam anlayamadım ama yardımcı olmak isterim 😊";
  }

  return reply;
}
