require("dotenv").config();

const express = require("express");
const path = require("path");
const { handler: contactHandler } = require("./netlify/functions/contact");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.disable("x-powered-by");
app.use(express.json({ limit: "20kb" }));

app.post("/.netlify/functions/contact", async (req, res) => {
  try {
    const result = await contactHandler({
      httpMethod: "POST",
      headers: req.headers,
      body: JSON.stringify(req.body || {}),
    });

    Object.entries(result.headers || {}).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    return res.status(result.statusCode || 200).send(result.body || "");
  } catch (error) {
    console.error("Local function bridge error:", error);
    return res.status(500).json({ error: "Function failed" });
  }
});

app.use("/images", express.static(path.join(__dirname, "images")));
app.use("/videos", express.static(path.join(__dirname, "videos")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/styles.css", (req, res) => {
  res.sendFile(path.join(__dirname, "styles.css"));
});

app.get("/script.js", (req, res) => {
  res.sendFile(path.join(__dirname, "script.js"));
});

app.listen(PORT, () => {
  console.log(`PINKER site is running on http://localhost:${PORT}`);
});
