import { Router } from "express";
import "dotenv/config";
import axios from "axios";

const router = Router();

// Local AI server URL
const LOCAL_AI_SERVER = process.env.LOCAL_AI_SERVER || "http://localhost:5005";

router.post("/chat", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    // Forward request to local AI server
    const response = await axios.post(`${LOCAL_AI_SERVER}/chat`, { prompt });

    res.json(response.data);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "AI server request failed" });
  }
});

export default router;
