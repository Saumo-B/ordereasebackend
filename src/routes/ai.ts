import { Router } from "express";
import "dotenv/config";
import axios from "axios";

const router = Router();

// Local AI server URL
const LOCAL_AI_SERVER = process.env.LOCAL_AI_SERVER || "http://localhost:5005";

router.get("/", async (req, res) => {
  try {
    // Call Python AI server root to see if alive
    const response = await axios.get(LOCAL_AI_SERVER);

    if (response.status === 200) {
      return res.json({ status: "AI server is alive" });
    } else {
      return res.status(503).json({ status: "AI server not responding properly" });
    }
  } catch (err: any) {
    console.error("AI server check failed:", err.message);
    return res.status(503).json({ status: "AI server is down", error: err.message });
  }
});

router.post("/chat", async (req, res) => {
  try {
    console.log("Received body:", req.body); // <-- log the request body

    // Check if body exists
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: "Request body is required" });
    }

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
