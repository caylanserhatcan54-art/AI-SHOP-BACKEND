export function randomPick(list) {
    return list[Math.floor(Math.random() * list.length)];
}
export function buildPersuasiveCopy(category) {
    const copies = {
        ayakkabi: [
            "Bu model günlük kullanımda inanılmaz rahat ve kombinlemesi çok kolay.",
            "Tarzını yormadan şık görünmek istiyorsan bu ayakkabı tam sana göre.",
            "Hem spor hem casual kombinlerde rahatça kullanabileceğin bir parça.",
            "Uzun süre ayakta kaldığında bile konforunu koruyan bir model."
        ],
        giyim: [
            "Günlük hayatta sıkça kullanabileceğin, kurtarıcı bir parça.",
            "Tek başına bile kombini taşıyabilecek kadar şık duruyor.",
            "Hem rahat hem de stil sahibi görünmek isteyenler için ideal.",
            "Dolabında uzun süre yer bulacak zamansız bir ürün."
        ],
        genel: [
            "Birçok farklı kullanım senaryosuna uyum sağlayabilecek bir ürün.",
            "Hediye olarak da tercih edilebilecek güvenli bir seçim.",
            "İhtiyaca yönelik, risksiz ve kullanışlı bir ürün."
        ]
    };
    return randomPick(copies[category] || copies["genel"]);
}
