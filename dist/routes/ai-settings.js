import { Router } from "express";
export const aiSettingsRouter = Router();
/**
 * GET /ai-settings/:shopId
 * Mağazanın AI ayarlarını döner
 */
aiSettingsRouter.get("/:shopId", async (req, res) => {
    try {
        const { shopId } = req.params;
        const ref = db
            .collection("shops")
            .doc(String(shopId))
            .collection("ai")
            .doc("settings");
        const snap = await ref.get();
        if (!snap.exists) {
            return res.json({
                ok: true,
                settings: {
                    logo: "",
                    storeName: "",
                    description: "",
                },
            });
        }
        return res.json({ ok: true, settings: snap.data() });
    }
    catch (err) {
        console.error(err);
        return res.json({ ok: false, error: "get_failed" });
    }
});
/**
 * POST /ai-settings/:shopId
 * Mağaza AI ayarlarını kaydeder
 */
aiSettingsRouter.post("/:shopId", async (req, res) => {
    try {
        const { shopId } = req.params;
        const { logo, storeName, description } = req.body;
        const ref = db
            .collection("shops")
            .doc(String(shopId))
            .collection("ai")
            .doc("settings");
        await ref.set({
            logo,
            storeName,
            description,
            updatedAt: Date.now(),
        }, { merge: true });
        return res.json({ ok: true });
    }
    catch (err) {
        console.error(err);
        return res.json({ ok: false, error: "save_failed" });
    }
});
