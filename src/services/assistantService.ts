export async function getAssistantReply(shopId: string, userMessage: string) {

  const msg = userMessage.toLowerCase();

  if (msg.includes("hoş")) {
    return "Hoş geldiniz 🤝 Mağazamıza göz atabilirsiniz.";
  }

  if (msg.includes("kargo")) {
    return "Siparişlerimiz genelde 2 iş günü içinde çıkmaktadır 📦";
  }

  if (msg.includes("indirim")) {
    return "Bu hafta sepette %20 indirim bulunuyor 🎉";
  }

  return "Tam anlamadım fakat yardımcı olmak isterim 😊";
}
