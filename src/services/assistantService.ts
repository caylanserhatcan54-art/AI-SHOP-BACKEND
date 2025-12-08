export async function getAssistantReply(shopId: string, userMessage: string) {
  userMessage = userMessage.toLowerCase();

  // Temel cevap kuralları
  if (userMessage.includes("merhaba") || userMessage.includes("selam")) {
    return "Merhaba 👋! Sana nasıl yardımcı olabilirim?";
  }

  if (userMessage.includes("kargo")) {
    return "Kargo takip için sipariş numaranızı iletir misiniz? 📦";
  }

  if (userMessage.includes("fiyat")) {
    return "Ürün fiyatlarımız modele ve özelliklere göre değişmektedir. Hangi ürünün fiyatını öğrenmek istersiniz?";
  }

  if (userMessage.includes("iade") || userMessage.includes("iptal")) {
    return "İade ve iptal süreçleri mağaza politikalarına göre değişmektedir. Sipariş numarasını iletir misiniz?";
  }

  if (userMessage.includes("ürün tavsiye") || userMessage.includes("ne önerirsin")) {
    return "Kullanım amacını söylersen uygun ürün önerisi yapabilirim 🤖";
  }

  // Her soruda fallback cevap
  return "Sorunuzu tam anlayamadım 😔 biraz daha detaylandırabilir misiniz?";
}
