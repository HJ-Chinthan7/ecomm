import express from "express";
import { v2 as cloudinary } from "cloudinary";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    console.log("CLOUDINARY env present:", {
      cloud: !!process.env.CLOUDINARY_CLOUD_NAME,
      key: !!process.env.CLOUDINARY_API_KEY,
      secret: !!process.env.CLOUDINARY_API_SECRET,
    });

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const imageStr = req.body?.image || req.fields?.image || req.query?.image;

    if (!imageStr) {
      console.warn("No image string provided in request");
      return res.status(400).json({ message: "No image provided. Send image string in `image` field." });
    }

    let result;
    try {
      result = await cloudinary.uploader.upload(imageStr, { folder: "products" });
    } catch (uploadErr) {
      console.error("Cloudinary upload (string) failed:", uploadErr);
      return res.status(500).json({ message: uploadErr?.message || "Cloudinary upload failed" });
    }

    console.log("Upload result:", { public_id: result.public_id, url: result.secure_url });

    return res.status(200).json({
      message: "Image uploaded successfully",
      image: result.secure_url,
      public_id: result.public_id,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ message: err?.message || "Upload failed" });
  }
});

export default router;
