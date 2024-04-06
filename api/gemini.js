const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI("AIzaSyCJUTsqENspO1wbyu3Fd1oyP67B0pQnyhw");
const app = require("express")();
const axios = require("axios");
const cors = require("cors");

app.use(cors());

app.get("/", async function (req, res) {
  try {
    const { prompt, url } = req.query;

    if (!prompt) {
      return res.status(400).json({ error: "No prompt provided." });
    }

    if (url) {
      if (!url.startsWith("https://")) {
        return res.status(400).json({ error: "Invalid URL" });
      }

      const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

      const img = (await axios.get(url, { responseType: "arraybuffer" })).data;
      const base64 = Buffer.from(img).toString("base64");
      const image = {
        inlineData: {
          data: base64,
          mimeType: "image/png",
        },
      };

      const result = await model.generateContent([prompt, image]);
      return res.status(200).json({ response: result.response.text() });
    }

    if (prompt === "clear" || prompt === "reset" || prompt === "clear history") {
      return res.json({ response: "Your history has been cleared." });
    }

    if (prompt === "clear all") {
      return res.status(403).json({ error: "You do not have permission to use this feature." });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const chat = model.startChat({
      generationConfig: {
        maxOutputTokens: 1024,
        topP: 1,
        temperature: 1,
        topK: 40,
      },
    });

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = response.text();

    return res.json({ response: text });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = app;
