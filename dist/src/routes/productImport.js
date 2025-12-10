import { Router } from "express";
import firestoreAdmin from "../config/firebase-admin.js";
const router = Router();
// ürün importu (örnek endpoint)
router.post("/:shopId", async (req, res) => {
    const { shopId } = req.params;
    const productData = req.body;
    try {
        await firestoreAdmin
            .collection("magazalar")
            .doc(shopId)
            .collection("urunler")
            .add(productData);
        res.json({
            message: "Ürün başarıyla kaydedildi",
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ error: "Ürün kaydı sırasında hata oluştu." });
    }
});
export default router;
