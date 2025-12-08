import { Router } from "express";
import multer from "multer";
import { firestoreAdmin } from "../config/firebase-admin.js";

const upload = multer({ storage: multer.memoryStorage() });
export const uploadRouter = Router();

uploadRouter.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: "file_missing" });
    }

    const fileName = `logos/${Date.now()}-${req.file.originalname}`;
    const file = bucket.file(fileName);

    await file.save(req.file.buffer, {
      metadata: { contentType: req.file.mimetype },
    });

    const url = await file.getSignedUrl({
      action: "read",
      expires: "03-09-2030",
    });

    return res.json({ ok: true, url: url[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, error: "upload_failed" });
  }
});
