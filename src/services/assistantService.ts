export async function getAssistantReply(shopId: string, userMessage: string) {
  // Basit örnek — sonra geliştirilecek
  if (userMessage.toLowerCase().includes("hoşgeldin")) {
    return "Hoş geldiniz 🤝 Mağazamıza göz atabilirsiniz.";
  }

  if (userMessage.toLowerCase().includes("kargo")) {
    return "Siparişler en geç 2 iş günü içinde kargoya verilir 📦.";
  }

  if (userMessage.toLowerCase().includes("indirim")) {
    return "Bu hafta seçili ürünlerde %30 indirim var 🎉";
  }

  return "Tam olarak anlayamadım ama size yardımcı olmak isterim 😊";
}
