import express from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("file"), async (req, res, next) => {
  try {
    const folder = req.body.folder || "eventhive";
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return next(error);
        res.json({ url: result.secure_url, public_id: result.public_id });
      }
    );
    stream.end(req.file.buffer);
  } catch (err) {
    next(err);
  }
});

export default router;
