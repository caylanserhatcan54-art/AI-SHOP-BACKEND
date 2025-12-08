// src/services/assistantService.ts

// Fake AI cevapları burada olacak
export async function getAIResponse(shopId: string, message: string) {
  // Geçici fake cevap üret
  let reply = "";

  if (message.toLowerCase().includes("merhaba")) {
    reply = "Merhaba! Size nasıl yardımcı olabilirim? 😊";
  } else if (message.toLowerCase().includes("kargo")) {
    reply = "Kargonuz hazırlanıyor 🚚 Kısa süre içinde yola çıkacak!";
  } else if (message.toLowerCase().includes("ürün öner")) {
    reply = "Harika seçim! Sana uygun ürünler araştırıyorum 🔍";
  } else {
    reply = `Tam olarak anlayamadım ama size yardımcı olmak isterim! 😊`;
  }

  return reply;
}
