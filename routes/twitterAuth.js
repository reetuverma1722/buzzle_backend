require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const app = express();

app.use(cors());
app.use(express.json());

const {
  TWITTER_CLIENT_ID,
  TWITTER_CLIENT_SECRET,
  TWITTER_CALLBACK_URL,
} = process.env;

let access_token = ""; // store in DB/session for real use

app.get("/api/auth/twitter/callback", async (req, res) => {
  const { code } = req.query;
  try {
    const tokenRes = await axios.post(
      "https://api.twitter.com/2/oauth2/token",
      new URLSearchParams({
        code,
        grant_type: "authorization_code",
        client_id: TWITTER_CLIENT_ID,
        redirect_uri: TWITTER_CALLBACK_URL,
        code_verifier: "challenge", // static
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString("base64"),
        },
      }
    );

    access_token = tokenRes.data.access_token;
    res.redirect(`http://localhost:3000/dashboard?accessToken=${access_token}`);
  } catch (err) {
    console.error("Token exchange failed", err.response?.data || err.message);
    res.status(500).send("Twitter login failed");
  }
});

app.post("/api/tweet", async (req, res) => {
  const { text } = req.body;

  if (!access_token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const result = await axios.post(
      "https://api.twitter.com/2/tweets",
      { text },
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({ success: true, tweet: result.data });
  } catch (err) {
    console.error("Tweet error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to post tweet" });
  }
});

app.listen(5000, () => console.log("✅ Server running on http://localhost:5000"));
