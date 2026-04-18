// ================================================================
//  IMPACTGRID / DIJO — Main Server
//  server.js
//
//  Render env vars required:
//    GROQ_API_KEY
//    SUPABASE_URL
//    SUPABASE_SERVICE_KEY
//    TIKTOK_CLIENT_KEY
//    TIKTOK_CLIENT_SECRET
//    TIKTOK_REDIRECT_URI
//    YOUTUBE_CLIENT_ID
//    YOUTUBE_CLIENT_SECRET
//    YOUTUBE_REDIRECT_URI
//    YOUTUBE_API_KEY          ← YouTube Data API v3 key (for ingestion)
//    INSTAGRAM_APP_ID
//    INSTAGRAM_APP_SECRET
//    INSTAGRAM_REDIRECT_URI
//    META_WEBHOOK_VERIFY_TOKEN
//    PEXELS_API_KEY           ← Pexels API key (for carousel media)
//    STRIPE_SECRET_KEY        ← Stripe secret key
//    STRIPE_WEBHOOK_SECRET    ← Stripe webhook signing secret
// ================================================================

import express from "express";
import cors    from "cors";
import dotenv  from "dotenv";
import Groq    from "groq-sdk";
import { startIngestion, addIngestionRoutes } from "./ingestion.js";
import { generateCarousel }                   from "./carousel-engine.js";
import { generatePortfolioContent }           from "./portfolio-engine.js";
import { Resend }                             from "resend";
import Stripe                                from "stripe";

dotenv.config();

const app    = express();
const resend = new Resend(process.env.RESEND_API_KEY);
const groq   = new Groq({ apiKey: process.env.GROQ_API_KEY });
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors());

/* ================================================================
   STRIPE WEBHOOK
   ⚠️  Must be BEFORE app.use(express.json()) — Stripe needs raw body
================================================================ */
app.post("/stripe-webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("[Stripe] Webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const email   = session.customer_details?.email;

    console.log("[Stripe] Payment received from:", email);

    try {
      let plan = "pro"; // default
      // if (session.amount_total > 1300) plan = "enterprise"; // upgrade later

      const { error } = await _aiSupabase
        .from("users")
        .update({ plan })
        .eq("email", email);

      if (error) {
        console.error("[Stripe] Supabase update error:", error.message);
      } else {
        console.log("[Stripe] Plan updated to:", plan, "for", email);
      }
    } catch (err) {
      console.error("[Stripe] Update failed:", err.message);
    }
  }

  res.json({ received: true });
});

app.use(express.json());

/* ── Health check ── */
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "ImpactGrid Dijo", ts: new Date().toISOString() });
});

/* ── Keep-warm ping ── */
app.get("/ping", (req, res) => res.json({ pong: true }));


/* ================================================================
   CHAT ENDPOINT
================================================================ */
app.post("/chat", async (req, res) => {
  try {
    const { message, mode = "adviser" } = req.body;
    if (!message) return res.status(400).json({ error: "No message provided" });

    const systemPrompts = {
      adviser: `You are Dijo, ImpactGrid's AI financial adviser for small business owners.
You speak plainly and directly — no jargon, no waffle.
You give specific, actionable financial advice based on the data provided.
Always be honest even if the news is tough.
Keep responses concise and practical.
Format responses clearly with short paragraphs.
Use bullet points sparingly.`,

      dashboard: `You are Dijo, an AI financial analyst embedded in ImpactGrid.
Analyse the financial data provided and give clear, specific insights.
Focus on trends, risks, and opportunities.
Be direct and numbers-focused.`,

      group: `You are Dijo, ImpactGrid's AI adviser for the ImpactGrid Group platform.
You help business owners and investors understand financial performance.
Be professional, clear, and actionable.`,

      creator: `You are the ImpactGrid Creator Intelligence Engine — a data-driven AI that helps creators and businesses identify viral content opportunities.
You analyse trends and generate optimised content for TikTok, YouTube, and Instagram.
When asked to generate content, respond with a hook, caption, hashtags, and posting advice.
Be specific, direct, and data-driven. No generic advice.`,

      carousel: `You are Dijo, ImpactGrid's carousel content engine.
You generate structured carousel slide content for LinkedIn, Instagram, and TikTok.
Your output must follow the EXACT format requested — no deviations, no commentary.
Every headline is SHORT (max 8 words), punchy, and scroll-stopping.
Every sub-line adds context without padding.
The first slide is always the hook. The last slide is always a CTA.
You write like a top creator, not a copywriter. Sharp, real, direct.
Never write more than is asked for. Format only. No explanations.`
    };

    const systemPrompt = systemPrompts[mode] || systemPrompts.adviser;

    const completion = await groq.chat.completions.create({
      model:       "llama-3.3-70b-versatile",
      max_tokens:  1024,
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: message }
      ]
    });

    const reply = completion.choices[0]?.message?.content || "I couldn't generate a response.";
    res.json({ reply });

  } catch (err) {
    console.error("[Dijo] Error:", err.message);
    res.status(500).json({ error: "AI service error", details: err.message });
  }
});


/* ================================================================
   META WEBHOOK
================================================================ */
app.get("/webhook", (req, res) => {
  const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN;
  const mode         = req.query["hub.mode"];
  const token        = req.query["hub.verify_token"];
  const challenge    = req.query["hub.challenge"];
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[Meta Webhook] Verified");
    res.status(200).send(challenge);
  } else {
    res.status(403).json({ error: "Verification failed" });
  }
});

app.post("/webhook", (req, res) => {
  console.log("[Meta Webhook] Event:", JSON.stringify(req.body));
  if (req.body.object === "instagram") {
    req.body.entry?.forEach((e) => e.changes?.forEach((c) =>
      console.log("[Meta Webhook] Instagram:", c.field, c.value)
    ));
  }
  res.status(200).send("EVENT_RECEIVED");
});


/* ================================================================
   TIKTOK ROUTES
================================================================ */
app.post("/tiktok/token", async (req, res) => {
  const { code, redirect_uri, code_verifier } = req.body;
  if (!code || !code_verifier) return res.status(400).json({ error: "Missing code or code_verifier" });
  try {
    const response = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key:    process.env.TIKTOK_CLIENT_KEY,
        client_secret: process.env.TIKTOK_CLIENT_SECRET,
        code,
        grant_type:    "authorization_code",
        redirect_uri:  redirect_uri || process.env.TIKTOK_REDIRECT_URI,
        code_verifier
      }).toString()
    });
    const data = await response.json();
    if (!response.ok || data.error) return res.status(400).json({ error: data.error || "Token exchange failed", details: data });
    res.json({
      access_token:  data.access_token,
      open_id:       data.open_id,
      expires_in:    data.expires_in,
      refresh_token: data.refresh_token,
      scope:         data.scope
    });
  } catch (err) {
    res.status(500).json({ error: "Token exchange failed", details: err.message });
  }
});

app.post("/tiktok/profile", async (req, res) => {
  const { access_token } = req.body;
  if (!access_token) return res.status(400).json({ error: "Missing access_token" });
  try {
    const fields = "open_id,avatar_url,display_name,bio_description,is_verified,follower_count,following_count,likes_count,video_count";
    const response = await fetch(
      `https://open.tiktokapis.com/v2/user/info/?fields=${fields}`,
      { method: "GET", headers: { "Authorization": "Bearer " + access_token } }
    );
    const data = await response.json();
    console.log("[TikTok /profile] Response:", JSON.stringify(data).slice(0, 300));
    if (data?.error?.code && data.error.code !== "ok") {
      return res.status(400).json({ error: "TikTok profile error", details: data });
    }
    res.json(data);
  } catch (err) {
    console.error("[TikTok /profile] Exception:", err.message);
    res.status(500).json({ error: "Profile fetch failed", details: err.message });
  }
});

app.post("/tiktok/videos", async (req, res) => {
  const { access_token, max_count } = req.body;
  if (!access_token) return res.status(400).json({ error: "Missing access_token" });
  try {
    const fields = "id,title,cover_image_url,video_description,duration,like_count,comment_count,share_count,view_count,create_time";
    const response = await fetch(
      `https://open.tiktokapis.com/v2/video/list/?fields=${fields}`,
      {
        method:  "POST",
        headers: { "Authorization": "Bearer " + access_token, "Content-Type": "application/json" },
        body:    JSON.stringify({ max_count: max_count || 10 })
      }
    );
    const data = await response.json();
    console.log("[TikTok /videos] Status:", response.status, "Response:", JSON.stringify(data).slice(0, 300));
    if (data?.error?.code && data.error.code !== "ok") {
      return res.status(400).json({ error: "TikTok videos error", details: data });
    }
    res.json(data);
  } catch (err) {
    console.error("[TikTok /videos] Exception:", err.message);
    res.status(500).json({ error: "Videos fetch failed", details: err.message });
  }
});

app.post("/tiktok/publish", async (req, res) => {
  const { access_token, video_url, caption, privacy_level } = req.body;
  if (!access_token || !video_url) return res.status(400).json({ error: "Missing access_token or video_url" });
  try {
    const response = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
      method:  "POST",
      headers: { "Authorization": "Bearer " + access_token, "Content-Type": "application/json" },
      body: JSON.stringify({
        post_info:   { title: caption || "", privacy_level: privacy_level || "PUBLIC_TO_EVERYONE", disable_duet: false, disable_comment: false, disable_stitch: false },
        source_info: { source: "PULL_FROM_URL", video_url }
      })
    });
    const data = await response.json();
    if (!response.ok || (data.error && data.error.code !== "ok")) return res.status(400).json({ error: "Publish failed", details: data });
    res.json({ publish_id: data.data?.publish_id, status: "publishing" });
  } catch (err) {
    res.status(500).json({ error: "Publish failed", details: err.message });
  }
});

app.post("/tiktok/share", async (req, res) => {
  const { access_token, video_url, title } = req.body;
  if (!access_token || !video_url) return res.status(400).json({ error: "Missing access_token or video_url" });
  try {
    const verify = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id", {
      headers: { "Authorization": "Bearer " + access_token }
    });
    if (!verify.ok) return res.status(401).json({ error: "Invalid or expired access token" });
    res.json({ share_url: video_url, title: title || "", client_key: process.env.TIKTOK_CLIENT_KEY, status: "ready" });
  } catch (err) {
    res.status(500).json({ error: "Share failed", details: err.message });
  }
});

app.post("/tiktok/refresh", async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) return res.status(400).json({ error: "Missing refresh_token" });
  try {
    const response = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key:    process.env.TIKTOK_CLIENT_KEY,
        client_secret: process.env.TIKTOK_CLIENT_SECRET,
        grant_type:    "refresh_token",
        refresh_token
      }).toString()
    });
    const data = await response.json();
    if (!response.ok || data.error) return res.status(400).json({ error: "Token refresh failed", details: data });
    res.json({ access_token: data.access_token, expires_in: data.expires_in, refresh_token: data.refresh_token });
  } catch (err) {
    res.status(500).json({ error: "Token refresh failed", details: err.message });
  }
});

app.post("/tiktok/save-token", async (req, res) => {
  const { open_id, access_token, refresh_token, expires_in, scope, display_name, avatar_url } = req.body;
  if (!open_id || !access_token) return res.status(400).json({ error: "Missing open_id or access_token" });
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const expiresAt = new Date(Date.now() + (expires_in || 86400) * 1000).toISOString();
    const { error } = await sb.from("tiktok_tokens").upsert({
      open_id,
      access_token,
      refresh_token: refresh_token || "",
      expires_at:    expiresAt,
      scope:         scope || "",
      display_name:  display_name || "",
      avatar_url:    avatar_url || "",
      updated_at:    new Date().toISOString()
    }, { onConflict: "open_id" });
    if (error) {
      console.error("[TikTok save-token] Supabase error:", error.message);
      return res.status(500).json({ error: "Failed to save token", details: error.message });
    }
    console.log("[TikTok save-token] Saved token for:", display_name || open_id);
    res.json({ saved: true, open_id });
  } catch (err) {
    console.error("[TikTok save-token] Exception:", err.message);
    res.status(500).json({ error: "Token save failed", details: err.message });
  }
});


/* ================================================================
   INSTAGRAM ROUTES
================================================================ */
app.post("/instagram/token", async (req, res) => {
  const { code, redirect_uri } = req.body;
  if (!code) return res.status(400).json({ error: "Missing code" });
  try {
    const shortRes  = await fetch("https://api.instagram.com/oauth/access_token", {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id:     process.env.INSTAGRAM_APP_ID,
        client_secret: process.env.INSTAGRAM_APP_SECRET,
        grant_type:    "authorization_code",
        redirect_uri:  redirect_uri || process.env.INSTAGRAM_REDIRECT_URI,
        code
      }).toString()
    });
    const shortData = await shortRes.json();
    if (!shortRes.ok || shortData.error) return res.status(400).json({ error: "Token exchange failed", details: shortData });
    const longRes  = await fetch(`https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_APP_SECRET}&access_token=${shortData.access_token}`);
    const longData = await longRes.json();
    if (!longRes.ok || longData.error) return res.json({ access_token: shortData.access_token, user_id: shortData.user_id, expires_in: 3600 });
    res.json({ access_token: longData.access_token, user_id: shortData.user_id, expires_in: longData.expires_in || 5184000 });
  } catch (err) {
    res.status(500).json({ error: "Token exchange failed", details: err.message });
  }
});

app.post("/instagram/profile", async (req, res) => {
  const { access_token, user_id } = req.body;
  if (!access_token) return res.status(400).json({ error: "Missing access_token" });
  try {
    const uid  = user_id || "me";
    const data = await (await fetch(`https://graph.instagram.com/v19.0/${uid}?fields=id,username,name,biography,followers_count,follows_count,media_count,profile_picture_url,website&access_token=${access_token}`)).json();
    if (data.error) return res.status(400).json({ error: "Failed to fetch profile", details: data });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Profile fetch failed", details: err.message });
  }
});

app.post("/instagram/media", async (req, res) => {
  const { access_token, user_id } = req.body;
  if (!access_token) return res.status(400).json({ error: "Missing access_token" });
  try {
    const uid  = user_id || "me";
    const data = await (await fetch(`https://graph.instagram.com/v19.0/${uid}/media?fields=id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count,permalink&limit=12&access_token=${access_token}`)).json();
    if (data.error) return res.status(400).json({ error: "Failed to fetch media", details: data });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Media fetch failed", details: err.message });
  }
});

app.post("/instagram/insights", async (req, res) => {
  const { access_token, user_id } = req.body;
  if (!access_token) return res.status(400).json({ error: "Missing access_token" });
  try {
    const uid  = user_id || "me";
    const data = await (await fetch(`https://graph.instagram.com/v19.0/${uid}/insights?metric=reach,impressions,profile_views,follower_count&period=day&access_token=${access_token}`)).json();
    if (data.error) return res.status(400).json({ error: "Failed to fetch insights", details: data });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Insights fetch failed", details: err.message });
  }
});

app.post("/instagram/publish", async (req, res) => {
  const { access_token, user_id, image_url, caption } = req.body;
  if (!access_token || !image_url) return res.status(400).json({ error: "Missing access_token or image_url" });
  try {
    const uid           = user_id || "me";
    const containerData = await (await fetch(`https://graph.instagram.com/v19.0/${uid}/media`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ image_url, caption: caption || "", access_token })
    })).json();
    if (containerData.error) return res.status(400).json({ error: "Failed to create container", details: containerData });
    const publishData = await (await fetch(`https://graph.instagram.com/v19.0/${uid}/media_publish`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ creation_id: containerData.id, access_token })
    })).json();
    if (publishData.error) return res.status(400).json({ error: "Failed to publish", details: publishData });
    res.json({ media_id: publishData.id, status: "published" });
  } catch (err) {
    res.status(500).json({ error: "Publish failed", details: err.message });
  }
});


/* ================================================================
   YOUTUBE ROUTES
================================================================ */
app.post("/youtube/token", async (req, res) => {
  const { code, redirect_uri } = req.body;
  if (!code) return res.status(400).json({ error: "Missing code" });
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id:     process.env.YOUTUBE_CLIENT_ID,
        client_secret: process.env.YOUTUBE_CLIENT_SECRET,
        redirect_uri:  redirect_uri || process.env.YOUTUBE_REDIRECT_URI,
        grant_type:    "authorization_code"
      }).toString()
    });
    const data = await response.json();
    if (!response.ok || data.error) {
      console.error("[YouTube /token] Error:", data);
      return res.status(400).json({ error: "Token exchange failed", details: data });
    }
    res.json({
      access_token:  data.access_token,
      refresh_token: data.refresh_token,
      expires_in:    data.expires_in,
      token_type:    data.token_type
    });
  } catch (err) {
    console.error("[YouTube /token] Exception:", err.message);
    res.status(500).json({ error: "Token exchange failed", details: err.message });
  }
});

app.post("/youtube/channel", async (req, res) => {
  const { access_token } = req.body;
  if (!access_token) return res.status(400).json({ error: "Missing access_token" });
  try {
    const response = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&mine=true",
      { headers: { "Authorization": "Bearer " + access_token } }
    );
    const data = await response.json();
    if (!response.ok || data.error) {
      console.error("[YouTube /channel] Error:", data);
      return res.status(400).json({ error: "Failed to fetch channel", details: data });
    }
    res.json(data);
  } catch (err) {
    console.error("[YouTube /channel] Exception:", err.message);
    res.status(500).json({ error: "Channel fetch failed", details: err.message });
  }
});

app.post("/youtube/videos", async (req, res) => {
  const { access_token, max_results } = req.body;
  if (!access_token) return res.status(400).json({ error: "Missing access_token" });
  try {
    const channelRes  = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true",
      { headers: { "Authorization": "Bearer " + access_token } }
    );
    const channelData = await channelRes.json();
    const uploadsId   = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsId) return res.status(404).json({ error: "No uploads playlist found" });

    const videosRes  = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsId}&maxResults=${max_results || 10}`,
      { headers: { "Authorization": "Bearer " + access_token } }
    );
    const videosData = await videosRes.json();
    if (!videosRes.ok || videosData.error) {
      console.error("[YouTube /videos] Error:", videosData);
      return res.status(400).json({ error: "Failed to fetch videos", details: videosData });
    }

    const videoIds = videosData.items?.map((v) => v.contentDetails.videoId).join(",");
    if (!videoIds) return res.json({ items: [] });

    const statsRes  = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}`,
      { headers: { "Authorization": "Bearer " + access_token } }
    );
    const statsData = await statsRes.json();
    res.json(statsData);
  } catch (err) {
    console.error("[YouTube /videos] Exception:", err.message);
    res.status(500).json({ error: "Videos fetch failed", details: err.message });
  }
});

app.post("/youtube/analytics", async (req, res) => {
  const { access_token } = req.body;
  if (!access_token) return res.status(400).json({ error: "Missing access_token" });
  try {
    const endDate   = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const response  = await fetch(
      `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&startDate=${startDate}&endDate=${endDate}&metrics=views,estimatedMinutesWatched,averageViewDuration,subscribersGained,subscribersLost,likes,comments&dimensions=day&sort=day`,
      { headers: { "Authorization": "Bearer " + access_token } }
    );
    const data = await response.json();
    if (!response.ok || data.error) {
      console.error("[YouTube /analytics] Error:", data);
      return res.status(400).json({ error: "Failed to fetch analytics", details: data });
    }
    res.json(data);
  } catch (err) {
    console.error("[YouTube /analytics] Exception:", err.message);
    res.status(500).json({ error: "Analytics fetch failed", details: err.message });
  }
});

app.post("/youtube/refresh", async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) return res.status(400).json({ error: "Missing refresh_token" });
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token,
        client_id:     process.env.YOUTUBE_CLIENT_ID,
        client_secret: process.env.YOUTUBE_CLIENT_SECRET,
        grant_type:    "refresh_token"
      }).toString()
    });
    const data = await response.json();
    if (!response.ok || data.error) return res.status(400).json({ error: "Token refresh failed", details: data });
    res.json({ access_token: data.access_token, expires_in: data.expires_in });
  } catch (err) {
    console.error("[YouTube /refresh] Exception:", err.message);
    res.status(500).json({ error: "Token refresh failed", details: err.message });
  }
});


/* ================================================================
   GOOGLE TRENDS PROXY
================================================================ */
app.get("/trends/google", async (req, res) => {
  const geo = req.query.geo || "GB";
  try {
    const response = await fetch(
      `https://trends.google.com/trends/trendingsearches/daily/rss?geo=${geo}`,
      { headers: { "User-Agent": "Mozilla/5.0 (compatible; ImpactGrid/1.0)" } }
    );
    const xml    = await response.text();
    const titles = [];
    const regex  = /<title><!\[CDATA\[([^\]]+)\]\]><\/title>/g;
    let match;
    while ((match = regex.exec(xml)) !== null) {
      if (match[1] !== "Google Trends" && match[1] !== "Daily Search Trends") {
        titles.push(match[1]);
      }
    }
    res.json({ geo, trends: titles.slice(0, 20), ts: new Date().toISOString() });
  } catch (err) {
    console.error("[Google Trends] Exception:", err.message);
    res.status(500).json({ error: "Failed to fetch Google Trends", details: err.message });
  }
});


/* ── GET /trends/live?limit=20 ── */
/*
 *  Used by CaptionEngine.fetchLiveTrends() in carousel-studio.js and
 *  the creator-studio dashboard trend feed.
 *  Queries the trends table directly (ordered by trend_score) so all
 *  platform sources — tiktok | youtube | cross | google — are surfaced.
 *  Adds `plat` field mapped from platform_source so the frontend
 *  badge renderer (t.plat === 'tt' / 'yt' / 'cross') works without
 *  any client-side changes.
 */
app.get("/trends/live", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const { data, error } = await _aiSupabase
      .from("trends")
      .select("*")
      .order("trend_score", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);

    const trends = (data || []).map(t => ({
      topic:           t.topic,
      trend_score:     t.trend_score,
      platform_source: t.platform_source,
      video_count:     t.video_count,
      total_views:     t.total_views,
      status:          t.status,
      confidence_score: t.velocity_score || 60
    }));

    // 🔥 PRIORITISE CROSS-PLATFORM (THIS IS THE MAGIC)
    trends.sort((a, b) => {
      if (a.platform_source === 'cross') return -1;
      if (b.platform_source === 'cross') return 1;
      return b.trend_score - a.trend_score;
    });

    res.json({
      trends,
      ts: new Date().toISOString()
    });
  } catch (err) {
    console.error("[Trends /live] Error:", err.message);
    res.status(500).json({ error: "Failed to fetch live trends", details: err.message, trends: [] });
  }
});


/* ================================================================
   PHASE 3 — AI RECOMMENDATION LAYER
================================================================ */

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const _aiSupabase = createSupabaseClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function getTopTrends(limit = 10) {
  const { data } = await _aiSupabase
    .from("v_top_trends")
    .select("*")
    .limit(limit);
  return data || [];
}

async function dijoAI(userPrompt, systemOverride = null) {
  const system = systemOverride || `You are Dijo, ImpactGrid's Creator Intelligence Engine.
You analyse real trend data and give creators specific, actionable advice.
You speak directly and confidently. No waffle, no generic advice.
Always reference the actual data provided. Be specific about platforms, formats, and timing.
Format responses clearly. Use short paragraphs. Keep it punchy.`;

  const completion = await groq.chat.completions.create({
    model:       "llama-3.3-70b-versatile",
    max_tokens:  1200,
    temperature: 0.75,
    messages: [
      { role: "system", content: system },
      { role: "user",   content: userPrompt }
    ]
  });
  return completion.choices[0]?.message?.content || "";
}

let _dailyBriefingCache = { data: null, cachedAt: 0 };

app.post("/ai/recommendations", async (req, res) => {
  try {
    const { niche = "", platform = "All", goal = "grow", connected_platforms = [] } = req.body;
    const trends = await getTopTrends(10);
    if (!trends.length) {
      return res.json({ recommendations: [], message: "No trend data yet — check back in 30 minutes." });
    }
    const trendContext = trends.map((t, i) =>
      `${i+1}. "${t.topic}" — Score: ${t.trend_score}/100 | Platform: ${t.platform_source} | Status: ${t.status} | Views: ${Number(t.total_views).toLocaleString()} | IG Prediction: ${t.instagram_prediction}%`
    ).join("\n");
    const nicheCtx     = niche ? `Creator niche: ${niche}` : "General creator";
    const platformCtx  = platform !== "All" ? `Primary platform: ${platform}` : "Multi-platform creator";
    const connectedCtx = connected_platforms.length ? `Connected platforms: ${connected_platforms.join(", ")}` : "";
    const prompt = `Here is today's real trend intelligence data from ImpactGrid:\n\n${trendContext}\n\nCreator context:\n- ${nicheCtx}\n- ${platformCtx}\n- Goal: ${goal}\n${connectedCtx}\n\nBased on this REAL data, give me:\n\n1. TOP 3 CONTENT OPPORTUNITIES — for each one:\n   - Topic name\n   - Why it's a good opportunity RIGHT NOW (use the actual scores)\n   - Best platform for this creator\n   - Exact content format (e.g. "60-second explainer", "talking head reaction")\n   - Best posting time (day + time)\n   - One specific hook idea\n\n2. ONE TREND TO AVOID — and why\n\n3. THIS WEEK'S STRATEGY — 2-3 sentences on what to focus on\n\nBe specific. Reference the actual scores and data. No generic advice.`;
    const reply = await dijoAI(prompt);
    res.json({ recommendations: parseRecommendations(reply, trends), raw: reply, trends_analysed: trends.length, top_trend: trends[0]?.topic || "", ts: new Date().toISOString() });
  } catch (err) {
    console.error("[AI /recommendations] Error:", err.message);
    res.status(500).json({ error: "AI recommendation failed", details: err.message });
  }
});

app.post("/ai/content-brief", async (req, res) => {
  try {
    const { topic, platform = "TikTok", style = "Educational", niche = "" } = req.body;
    if (!topic) return res.status(400).json({ error: "Missing topic" });
    const { data: trendData } = await _aiSupabase.from("trends").select("*").ilike("topic", `%${topic}%`).order("trend_score", { ascending: false }).limit(1);
    const trend    = trendData?.[0];
    const trendCtx = trend ? `Trend Score: ${trend.trend_score}/100 | Status: ${trend.status} | Views: ${Number(trend.total_views).toLocaleString()} | Hashtags: ${(trend.hashtags||[]).join(", ")} | IG Prediction: ${trend.instagram_prediction}%` : "Live trending topic";
    const prompt   = `Create a complete content brief for a creator making a video about: "${topic}"\n\nReal trend data: ${trendCtx}\nPlatform: ${platform}\nStyle: ${style}\n${niche ? `Niche: ${niche}` : ""}\n\nProvide:\n\nHOOK (2 versions):\n- Version A (curiosity): \n- Version B (bold claim):\n\nSCRIPT OUTLINE:\n- 0-3s: Hook\n- 3-15s: Setup/context\n- 15-45s: Core value (3 key points)\n- 45-55s: Proof/example\n- 55-60s: CTA\n\nCAPTION (ready to copy, with emojis):\n\nHASHTAGS (10, mix of niche + trending):\n\nBEST POSTING TIME: Day + time for ${platform}\n\nTHUMBNAIL/COVER IDEA:\n\nTREND WINDOW: How long this topic will stay relevant`;
    const reply    = await dijoAI(prompt);
    res.json({ topic, platform, style, brief: reply, trend_score: trend?.trend_score || null, trend_status: trend?.status || "trending", hashtags: trend?.hashtags || [], ts: new Date().toISOString() });
  } catch (err) {
    console.error("[AI /content-brief] Error:", err.message);
    res.status(500).json({ error: "Content brief failed", details: err.message });
  }
});

app.post("/ai/trend-analysis", async (req, res) => {
  try {
    const trends = await getTopTrends(15);
    if (!trends.length) return res.json({ analysis: "No trend data available yet." });
    const trendContext  = trends.map((t, i) => `${i+1}. "${t.topic}" | Score: ${t.trend_score} | ${t.platform_source} | ${t.status} | ${Number(t.total_views).toLocaleString()} views | IG: ${t.instagram_prediction}%`).join("\n");
    const crossPlatform = trends.filter(t => t.platform_source === "cross");
    const peakTopics    = trends.filter(t => t.status === "peak");
    const risingTopics  = trends.filter(t => t.status === "rising");
    const igOpps        = trends.filter(t => t.instagram_prediction >= 50);
    const prompt        = `Analyse these real ImpactGrid trend scores from ${new Date().toLocaleDateString("en-GB", {weekday:"long",day:"numeric",month:"long"})}:\n\n${trendContext}\n\nSummary stats:\n- Peak topics: ${peakTopics.map(t=>t.topic).join(", ") || "none"}\n- Rising topics: ${risingTopics.map(t=>t.topic).join(", ") || "none"}\n- Cross-platform hits: ${crossPlatform.map(t=>t.topic).join(", ") || "none"}\n- Strong IG predictions: ${igOpps.map(t=>t.topic).join(", ") || "none"}\n\nGive creators:\n1. THE STORY TODAY (2-3 sentences on what the overall trend landscape looks like)\n2. BIGGEST OPPORTUNITY RIGHT NOW (1 topic, why, what to make)\n3. RISING BEFORE IT PEAKS (1 early-stage topic to jump on)\n4. INSTAGRAM PLAY (best topic for IG right now based on predictions)\n5. WHAT TO IGNORE (1-2 topics that look trending but won't convert)\n\nKeep it sharp. Creators are busy — give them signal, not noise.`;
    const reply = await dijoAI(prompt);
    res.json({ analysis: reply, trends_count: trends.length, ts: new Date().toISOString() });
  } catch (err) {
    console.error("[AI /trend-analysis] Error:", err.message);
    res.status(500).json({ error: "Trend analysis failed", details: err.message });
  }
});

app.get("/ai/daily-briefing", async (req, res) => {
  try {
    const now    = Date.now();
    const ONE_HR = 60 * 60 * 1000;
    if (_dailyBriefingCache.data && (now - _dailyBriefingCache.cachedAt) < ONE_HR) {
      return res.json({ ..._dailyBriefingCache.data, cached: true });
    }
    const trends = await getTopTrends(10);
    if (!trends.length) return res.json({ briefing: "No trend data yet.", cached: false });
    const top3         = trends.slice(0, 3);
    const trendContext = top3.map((t, i) => `${i+1}. "${t.topic}" — ${t.trend_score}/100 — ${t.status} — ${t.platform_source}`).join("\n");
    const today        = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const prompt       = `You are Dijo. Give creators their daily intelligence briefing for ${today}.\n\nTop 3 trends right now:\n${trendContext}\n\nWrite a sharp 4-5 sentence daily briefing that:\n1. Opens with what's hot today (reference actual topics)\n2. Gives one specific action to take today\n3. Mentions the best platform play right now\n4. Ends with a motivating but realistic note\n\nSound like a smart adviser talking to a creator over morning coffee. Be specific, not generic.`;
    const briefing     = await dijoAI(prompt);
    const result = { briefing, top_trends: top3.map(t => ({ topic: t.topic, score: t.trend_score, status: t.status })), date: today, cached: false, ts: new Date().toISOString() };
    _dailyBriefingCache = { data: result, cachedAt: now };
    res.json(result);
  } catch (err) {
    console.error("[AI /daily-briefing] Error:", err.message);
    res.status(500).json({ error: "Daily briefing failed", details: err.message });
  }
});

function parseRecommendations(text, trends) {
  const recs    = [];
  const matches = text.match(/(?:^|\n)\s*\d+\.\s+(?:CONTENT OPPORTUNITY|TOP|OPPORTUNITY)?[:\s]*([^\n]{5,80})/gm) || [];
  matches.slice(0, 3).forEach((m, i) => {
    const topic        = m.replace(/^\s*\d+\.\s+(?:CONTENT OPPORTUNITY|TOP|OPPORTUNITY)?[:\s]*/i, "").trim();
    const matchedTrend = trends.find(t => topic.toLowerCase().includes(t.topic.toLowerCase()));
    recs.push({ rank: i + 1, topic: topic.slice(0, 80), score: matchedTrend?.trend_score || null, platform: matchedTrend?.platform_source || "multi", ig_prediction: matchedTrend?.instagram_prediction || 0 });
  });
  return recs.length ? recs : trends.slice(0, 3).map((t, i) => ({ rank: i + 1, topic: t.topic, score: t.trend_score, platform: t.platform_source, ig_prediction: t.instagram_prediction }));
}


/* ================================================================
   CAROUSEL ROUTES
   POST /carousel/generate  — full AI carousel with media
   GET  /pexels/video        — proxy Pexels video search
   GET  /pexels/image        — proxy Pexels image search (NEW v2.3)
================================================================ */

/* ── POST /carousel/generate ── */
app.post("/carousel/generate", async (req, res) => {
  try {
    const {
      topic,
      platform     = "Instagram",
      tone         = "Bold & Direct",
      count        = 7,
      themeOverride = null
    } = req.body;

    if (!topic || topic.trim().length < 3) {
      return res.status(400).json({ error: "Missing or too-short topic" });
    }

    console.log(`[Carousel] Generating ${count}-slide carousel: "${topic}" | ${platform} | ${tone}`);

    const result = await generateCarousel({
      topic:         topic.trim(),
      platform,
      tone,
      count:         Math.min(Math.max(parseInt(count) || 7, 3), 12),
      themeOverride
    });

    console.log(`[Carousel] Done — theme: ${result.theme}, slides: ${result.slideCount}`);
    res.json(result);

  } catch (err) {
    console.error("[Carousel /generate] Error:", err.message);
    res.status(500).json({
      error:   "Carousel generation failed",
      details: err.message,
      fallback: true
    });
  }
});


/* ── GET /pexels/video?theme=lifestyle&q=morning+routine ── */
app.get("/pexels/video", async (req, res) => {
  const PEXELS_KEY = process.env.PEXELS_API_KEY;
  if (!PEXELS_KEY) {
    return res.status(503).json({ error: "Pexels API key not configured", video: null });
  }

  const { theme = "lifestyle", q = "" } = req.query;

  const THEME_KEYWORDS = {
    "cozy-home":  ["cozy home interior", "warm living room candle", "fireplace cozy home"],
    "workspace":  ["modern workspace desk", "laptop working office", "productive home office"],
    "minimal":    ["minimal interior white", "scandinavian design room", "clean modern apartment"],
    "luxury":     ["luxury hotel interior", "penthouse apartment luxury", "luxury resort pool"],
    "lifestyle":  ["lifestyle people happy", "travel adventure outdoor", "fitness workout active"]
  };

  const fallbacks = THEME_KEYWORDS[theme] || THEME_KEYWORDS["lifestyle"];
  const queries   = [q, ...fallbacks].filter(Boolean);

  try {
    for (const query of queries) {
      const response = await fetch(
        `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=10&orientation=square&size=medium`,
        { headers: { Authorization: PEXELS_KEY } }
      );

      if (!response.ok) {
        console.warn(`[Pexels] ${response.status} for query: "${query}"`);
        continue;
      }

      const data   = await response.json();
      const videos = (data.videos || []).filter(v => v.duration >= 5 && v.duration <= 30);

      if (videos.length) {
        const v      = videos[Math.floor(Math.random() * Math.min(3, videos.length))];
        const hdFile = v.video_files.find(f => f.quality === "hd") || v.video_files[0];

        return res.json({
          url:      hdFile?.link || null,
          thumb:    v.image,
          duration: v.duration,
          pexelsId: v.id,
          query
        });
      }
    }

    res.json({ video: null, message: "No suitable video found" });

  } catch (err) {
    console.error("[Pexels /video] Error:", err.message);
    res.status(500).json({ error: "Pexels fetch failed", details: err.message, video: null });
  }
});


/* ── GET /pexels/image?q=cozy+morning+bedroom&theme=cozy-home ── */
/*
 *  NEW in v2.3
 *  Used by the frontend carousel-studio to fetch a single on-topic
 *  Pexels photo when it needs to override or refresh a slide image.
 *  Also used as a fallback by the engine's fetchPexelsImage() internally.
 *
 *  Query params:
 *    q        — search query (required)
 *    theme    — theme hint for fallback queries (optional)
 *    exclude  — comma-separated Pexels IDs to exclude (optional)
 */
app.get("/pexels/image", async (req, res) => {
  const PEXELS_KEY = process.env.PEXELS_API_KEY;
  if (!PEXELS_KEY) {
    return res.status(503).json({ error: "Pexels API key not configured", image: null });
  }

  const { q = "", theme = "lifestyle", exclude = "" } = req.query;

  if (!q.trim()) {
    return res.status(400).json({ error: "Missing query parameter: q" });
  }

  const THEME_FALLBACKS = {
    "cozy-home":  ["cozy home interior warm", "bedroom natural light", "living room warm"],
    "workspace":  ["modern workspace desk", "laptop coffee minimal", "home office bright"],
    "minimal":    ["minimal white interior", "scandinavian clean room", "minimal design space"],
    "luxury":     ["luxury hotel interior", "premium elegant interior", "luxury apartment"],
    "lifestyle":  ["lifestyle people happy", "people outdoor active", "travel adventure"],
  };

  const fallbacks = THEME_FALLBACKS[theme] || THEME_FALLBACKS["lifestyle"];
  const queries   = [q.trim(), ...fallbacks];

  // Parse excluded IDs
  const excludeIds = new Set(
    exclude.split(",").map(s => s.trim()).filter(Boolean).map(Number)
  );

  try {
    for (const query of queries) {
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=square`,
        { headers: { Authorization: PEXELS_KEY } }
      );

      if (!response.ok) {
        console.warn(`[Pexels /image] ${response.status} for: "${query}"`);
        continue;
      }

      const data   = await response.json();
      const photos = (data.photos || []).filter(p => !excludeIds.has(p.id));

      if (!photos.length) continue;

      // Random pick from top 5 to avoid always returning same image
      const pick = photos[Math.floor(Math.random() * Math.min(5, photos.length))];

      console.log(`[Pexels /image] Found: "${query}" → id ${pick.id}`);

      return res.json({
        url:      pick.src.large2x || pick.src.large,
        thumb:    pick.src.medium,
        pexelsId: pick.id,
        alt:      pick.alt || "",
        query,
      });
    }

    // All queries exhausted — no image found
    res.json({ image: null, message: "No image found for query" });

  } catch (err) {
    console.error("[Pexels /image] Error:", err.message);
    res.status(500).json({ error: "Pexels image fetch failed", details: err.message, image: null });
  }
});


/* ================================================================
   PORTFOLIO ROUTES
================================================================ */

/* ── POST /portfolio/generate ── */
app.post("/portfolio/generate", async (req, res) => {
  try {
    const {
      name,
      niche,
      bio             = "",
      location        = "",
      email           = "",
      theme           = "dark",
      services        = [],
      projects        = [],
      testimonials    = [],
      youtube_url     = "",
      tiktok_url      = "",
      instagram_url   = "",
      linkedin_url    = "",
      twitter_url     = "",
      total_followers = "",
      engagement_rate = "",
      monthly_views   = "",
      slug            = "",
    } = req.body;

    if (!name || !niche) {
      return res.status(400).json({ error: "name and niche are required" });
    }

    console.log(`[Portfolio /generate] "${name}" | niche: "${niche}" | theme: ${theme}`);

    const result = await generatePortfolioContent({
      name, niche, bio, location, email, theme,
      services, projects, testimonials,
      youtube_url, tiktok_url, instagram_url, linkedin_url, twitter_url,
      total_followers, engagement_rate, monthly_views,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]/g, ""),
    });

    console.log(`[Portfolio /generate] Done — headline: "${result.ai_headline}"`);
    res.json(result);

  } catch (err) {
    console.error("[Portfolio /generate] Error:", err.message);
    res.status(500).json({
      error:    "Portfolio generation failed",
      details:  err.message,
      fallback: true,
    });
  }
});


/* ── POST /portfolio/regen ── */
app.post("/portfolio/regen", async (req, res) => {
  try {
    const { section, portfolio } = req.body;

    if (!section || !portfolio) {
      return res.status(400).json({ error: "section and portfolio are required" });
    }

    if (!["copy", "media", "legal", "services"].includes(section)) {
      return res.status(400).json({ error: "section must be: copy | media | legal | services" });
    }

    console.log(`[Portfolio /regen] section: ${section} | "${portfolio.name}"`);

    const full = await generatePortfolioContent(portfolio);

    const sectionMap = {
      copy:     { ai_headline: full.ai_headline, ai_tagline: full.ai_tagline, ai_bio: full.ai_bio, ai_meta: full.ai_meta, ai_cta: full.ai_cta },
      media:    { hero_media: full.hero_media },
      legal:    { ai_terms: full.ai_terms, ai_privacy: full.ai_privacy },
      services: { services: full.services },
    };

    res.json(sectionMap[section]);

  } catch (err) {
    console.error("[Portfolio /regen] Error:", err.message);
    res.status(500).json({ error: "Regen failed", details: err.message });
  }
});


/* ── POST /portfolio/save ── */
app.post("/portfolio/save", async (req, res) => {
  try {
    const { portfolio, session } = req.body;

    if (!portfolio) {
      return res.status(400).json({ error: "portfolio is required" });
    }

    console.log(`[Portfolio /save] "${portfolio.name}" | session: ${session || "guest"}`);

    const { data, error } = await _aiSupabase
      .from("portfolios")
      .insert([{
        user_id: session || null,
        user_session: session || null,

        name: portfolio.name || "",
        niche: portfolio.niche || "",
        bio: portfolio.bio || "",

        theme: portfolio.theme || "dark",

        services: portfolio.services || [],
        projects: portfolio.projects || [],
        testimonials: portfolio.testimonials || [],
        hero_media: portfolio.hero_media || [],

        ai_headline: portfolio.ai_headline || "",
        ai_tagline: portfolio.ai_tagline || "",
        ai_bio: portfolio.ai_bio || "",
        ai_cta: portfolio.ai_cta || "",

        total_followers: portfolio.total_followers || "",
        engagement_rate: portfolio.engagement_rate || "",
        monthly_views: portfolio.monthly_views || "",

        email: portfolio.email || "",

        slug: (portfolio.name || "creator")
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-") + "-" + Date.now()
      }]);

    if (error) {
      console.error("[Portfolio /save] Supabase error:", error.message);
      return res.status(500).json({ error: "Save failed", details: error.message });
    }

    console.log("[Portfolio /save] Saved successfully");
    res.json({ saved: true, data });

  } catch (err) {
    console.error("[Portfolio /save] Exception:", err.message);
    res.status(500).json({ error: "Save failed", details: err.message });
  }
});


/* ================================================================
   BOOK CALL
================================================================ */
app.post("/book-call", async (req, res) => {
  try {
    const { name, email, date } = req.body;

    if (!name || !email || !date) {
      return res.json({ error: "Missing fields" });
    }

    // 🔒 CHECK IF DATE EXISTS
    const { data: existing } = await _aiSupabase
      .from("bookings")
      .select("*")
      .eq("date", date)
      .single();

    if (existing) {
      return res.json({ error: "Date already booked" });
    }

    // 💾 SAVE BOOKING
    await _aiSupabase.from("bookings").insert({ name, email, date });

    // 📧 SEND EMAIL (RESEND)
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from:    "support@impactgridgroup.com",
        to:      ["Ogunmoyerodara@gmail.com"],
        subject: "New Call Booking",
        html: `
          <p><b>Name:</b> ${name}</p>
          <p><b>Email:</b> ${email}</p>
          <p><b>Date:</b> ${date}</p>
        `
      })
    });

    res.json({ success: true });

  } catch (err) {
    console.error("[Book Call] Error:", err.message);
    res.json({ error: "Server error" });
  }
});


/* ================================================================
   CONTACT FORM
================================================================ */
app.post("/contact", async (req, res) => {
  const { firstName, email, subject, message } = req.body;

  try {
    await resend.emails.send({
      from: "ImpactGrid <support@impactgridgroup.com>",
      to: "Ogunmoyerodara@gmail.com",
      subject: `New Contact: ${subject}`,
      html: `
        <h3>New Message</h3>
        <p><strong>Name:</strong> ${firstName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong><br>${message}</p>
      `
    });

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send email" });
  }
});


/* ================================================================
   START SERVER
================================================================ */
const PORT = process.env.PORT || 3000;

// Routes and ingestion must be registered BEFORE listen —
// any request arriving at startup would 404 if registered inside the callback.
addIngestionRoutes(app);
startIngestion();

app.listen(PORT, () => {
  console.log(`ImpactGrid Dijo running on port ${PORT}`);
});
