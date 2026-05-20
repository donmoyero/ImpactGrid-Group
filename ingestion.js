// ================================================================
//  IMPACTGRID / DIJO — Data Ingestion Engine
//  ingestion.js
//
//  Handles:
//    - TikTok video ingestion (keyword-based, every 30 min)
//    - YouTube trending + keyword ingestion (every 30 min)
//    - Google Trends RSS ingestion (every 30 min)
//    - Hashtag velocity tracking
//    - Velocity-based trend scoring engine (every 35 min)
//    - Instagram prediction scoring (inferred, no API needed)
//    - API routes: /trends/live, /trends/rising, /trends/cross,
//                  /trends/instagram-predictions,
//                  /ingestion/status, /ingestion/trigger
//
//  Wired into server.js via:
//    import { startIngestion, addIngestionRoutes } from './ingestion.js';
//    addIngestionRoutes(app);
//    startIngestion();
//
//  Render env vars required:
//    SUPABASE_URL
//    SUPABASE_SERVICE_KEY
//    TIKTOK_CLIENT_KEY
//    TIKTOK_CLIENT_SECRET
//    YOUTUBE_API_KEY
// ================================================================

// ── Supabase — service-role client for ingestion writes ──────────────────
// Uses SERVICE_KEY (not anon key) so ingestion can write to protected tables.
// This client is private to the backend — never expose SERVICE_KEY to the browser.
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ── Config ──
// GEO_LIST defines every country the ingestion engine scrapes trends for.
// Each entry gets its own tagged rows in the trends table (country column),
// so the frontend can filter by the user's detected location automatically.
// Add or remove codes as needed — each extra country costs ~1 YouTube API
// quota unit per category/keyword fetch (very cheap).
const GEO_LIST = [
  "GB",   // United Kingdom  (original)
  "US",   // United States
  "NG",   // Nigeria
  "GH",   // Ghana
  "ZA",   // South Africa
  "CA",   // Canada
  "AU",   // Australia
  "IE",   // Ireland
  "DE",   // Germany
  "FR",   // France
  "IN",   // India
  "AE",   // UAE
];
// Legacy single-geo alias — used by any code that still references GEO directly
const GEO        = GEO_LIST[0];
const YT_API_KEY = process.env.YOUTUBE_API_KEY;

// ── TikTok seed keywords ──
const TIKTOK_SEED_QUERIES = [
  "ai tools",
  "side hustle",
  "finance tips",
  "productivity",
  "content creator",
  "digital marketing",
  "entrepreneurship",
  "fitness motivation",
  "tech review",
  "life hack",
  "passive income",
  "investing",
  "chatgpt",
  "viral trend"
];

// ── YouTube categories (UK trending) ──
const YT_CATEGORIES = [
  { name: "tech",     categoryId: "28" },
  { name: "business", categoryId: "25" },
  { name: "howto",    categoryId: "26" },
  { name: "people",   categoryId: "22" }
];

// ── YouTube keyword searches ──
// These are FALLBACK only — used when Google Trends RSS returns nothing.
// Each ingestYouTube() run fetches fresh keywords from Google Trends RSS first,
// so the dashboard reflects what people are actually searching right now.
const YT_KEYWORDS_FALLBACK = [
  "ai tools 2026",
  "side hustle uk",
  "content creator tips",
  "passive income"
];

// ── Fetch live trending keywords from Google Trends RSS for a given geo ──
// Returns up to 8 clean topic strings. Falls back to YT_KEYWORDS_FALLBACK
// if RSS is blocked or returns nothing.
async function fetchTrendingKeywords(geoCode = "GB") {
  const UAS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
  ];
  for (const ua of UAS) {
    try {
      const res = await fetch(
        `https://trends.google.com/trends/trendingsearches/daily/rss?geo=${geoCode}`,
        { headers: { "User-Agent": ua } }
      );
      const xml = await res.text();
      if (!xml || xml.trim().startsWith("<html") || xml.length < 200) continue;
      const cdataRe = /<title><!\[CDATA\[([^\]]+)\]\]><\/title>/g;
      const titles = [];
      let m;
      while ((m = cdataRe.exec(xml)) !== null) {
        const t = m[1].trim();
        if (t && !["Google Trends", "Daily Search Trends"].includes(t)) titles.push(t);
      }
      if (titles.length > 0) {
        log("YouTube", `Dynamic keywords from Google Trends RSS [${geoCode}]: ${titles.slice(0, 8).join(", ")}`);
        return titles.slice(0, 8);
      }
    } catch (e) { /* try next UA */ }
  }
  log("YouTube", `Google Trends RSS unavailable for ${geoCode} — using fallback keywords`);
  return YT_KEYWORDS_FALLBACK;
}

// ── Topic grouping keywords ──
// STATIC baseline — always present so common niches are always scored.
const TOPIC_KEYWORDS_STATIC = [
  "ai", "chatgpt", "automation", "llm",
  "side hustle", "passive income", "make money",
  "finance", "investing", "stocks", "crypto",
  "fitness", "gym", "workout", "health",
  "content creator", "youtube growth", "tiktok growth",
  "productivity", "morning routine", "life hack",
  "entrepreneur", "business", "startup",
  "tech", "review", "unboxing",
  "digital marketing", "seo", "social media"
];

// Runtime cache — populated with live Google Trends topics each scoring run
let _dynamicTopicKeywords = [];

// Call this at the start of runTrendScoring() to merge live topics in
async function refreshTopicKeywords() {
  try {
    const live = await fetchTrendingKeywords("GB");
    // Normalise: lowercase, trim, unique
    const normalised = live.map(t => t.toLowerCase().trim()).filter(Boolean);
    _dynamicTopicKeywords = [...new Set([...TOPIC_KEYWORDS_STATIC, ...normalised])];
    log("Scoring", `Topic keywords refreshed — ${_dynamicTopicKeywords.length} total (${normalised.length} live)`);
  } catch (e) {
    _dynamicTopicKeywords = TOPIC_KEYWORDS_STATIC;
  }
}

// Always use this getter so scoring always has the freshest list
function getTopicKeywords() {
  return _dynamicTopicKeywords.length ? _dynamicTopicKeywords : TOPIC_KEYWORDS_STATIC;
}

// ── Cron intervals ──
const INTERVALS = {
  TIKTOK_MS:  30 * 60 * 1000,
  YOUTUBE_MS: 30 * 60 * 1000,
  GOOGLE_MS:  30 * 60 * 1000,
  SCORING_MS: 35 * 60 * 1000
};


// ================================================================
//  UTILITIES
// ================================================================

function log(source, msg, data = "") {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [Ingestion:${source}] ${msg}`, data || "");
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function hoursAgo(n) {
  return new Date(Date.now() - n * 60 * 60 * 1000);
}

function formatDateYYYYMMDD(date) {
  return date.toISOString().split("T")[0].replace(/-/g, "");
}

function extractHashtags(text = "") {
  const matches = text.match(/#[a-zA-Z][a-zA-Z0-9_]*/g) || [];
  return [...new Set(matches.map((h) => h.toLowerCase()))];
}

function parseTraffic(str) {
  if (!str) return 0;
  const s = str.replace(/[^0-9.KMBkmb+]/g, "").replace("+", "");
  if (/b/i.test(str)) return parseFloat(s) * 1_000_000_000;
  if (/m/i.test(str)) return parseFloat(s) * 1_000_000;
  if (/k/i.test(str)) return parseFloat(s) * 1_000;
  return parseFloat(s) || 0;
}

function googleTrafficToScore(traffic) {
  if (traffic >= 5_000_000) return 95;
  if (traffic >= 1_000_000) return 85;
  if (traffic >= 500_000)   return 75;
  if (traffic >= 100_000)   return 65;
  if (traffic >= 50_000)    return 55;
  if (traffic >= 10_000)    return 45;
  return 35;
}

function getStatus(score) {
  if (score >= 80) return "peak";
  if (score >= 60) return "rising";
  return "emerging";
}

function buildIGReason(hasTikTok, hasYouTube, velocityScore, prediction) {
  if (prediction >= 75) {
    if (hasTikTok && hasYouTube)
      return "Strong TikTok velocity + YouTube validation — high IG adoption likely";
    if (hasTikTok)
      return "High TikTok velocity detected — likely to reach Instagram within 24-48h";
    return "Cross-platform signals suggest Instagram traction incoming";
  }
  if (prediction >= 50) return "Moderate cross-platform signals — watch for Instagram growth";
  return "Early signals — Instagram adoption uncertain";
}


// ================================================================
//  PEXELS IMAGE HELPER
//  Called once per trend during scoring — result stored in image_url.
//  Requires PEXELS_API_KEY env var. Fails silently (returns null) so
//  a missing key or rate-limit never breaks the scoring run.
// ================================================================

async function fetchPexelsImage(topic) {
  const PEXELS_KEY = process.env.PEXELS_API_KEY;
  if (!PEXELS_KEY) return null;

  // Build a clean search query from the topic keyword
  const query = encodeURIComponent(topic.trim());

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${query}&per_page=5&orientation=square`,
      { headers: { Authorization: PEXELS_KEY } }
    );
    if (!res.ok) return null;

    const data   = await res.json();
    const photos = data.photos || [];
    if (!photos.length) return null;

    // Pick from top 3 so results vary a little between runs
    const pick = photos[Math.floor(Math.random() * Math.min(3, photos.length))];
    return pick.src?.medium || pick.src?.original || null;
  } catch {
    return null;
  }
}


// ================================================================
//  INGESTION RUN TRACKING
// ================================================================

async function startRun(platform) {
  try {
    const { data, error } = await supabase
      .from("ingestion_runs")
      .insert({ platform, status: "running", started_at: new Date().toISOString() })
      .select()
      .single();
    if (error) log(platform, "Failed to create run record", error.message);
    return data?.id || null;
  } catch (e) {
    return null;
  }
}

async function completeRun(runId, platform, counts) {
  if (!runId) return;
  try {
    await supabase
      .from("ingestion_runs")
      .update({
        status:          "completed",
        videos_fetched:  counts.videos   || 0,
        trends_detected: counts.trends   || 0,
        completed_at:    new Date().toISOString(),
        duration_ms:     counts.duration || 0
      })
      .eq("id", runId);
  } catch (e) {}
}

async function failRun(runId, platform, errorMsg) {
  if (!runId) return;
  try {
    await supabase
      .from("ingestion_runs")
      .update({
        status:        "failed",
        error_message: errorMsg,
        completed_at:  new Date().toISOString()
      })
      .eq("id", runId);
  } catch (e) {}
}


// ================================================================
//  HASHTAG TRACKER
// ================================================================

async function updateHashtagCounts(hashtags, platform) {
  if (!hashtags || !hashtags.length) return;

  const counts = {};
  hashtags.forEach((h) => { if (h) counts[h] = (counts[h] || 0) + 1; });

  for (const [hashtag, count] of Object.entries(counts)) {
    try {
      const { data: existing } = await supabase
        .from("hashtags")
        .select("*")
        .eq("hashtag", hashtag)
        .eq("platform", platform)
        .single();

      if (existing) {
        const prevCount  = existing.usage_count || 0;
        const newCount   = prevCount + count;
        const growthRate = prevCount > 0 ? ((count / prevCount) * 100) : 100;
        const count2h    = (existing.count_2h  || 0) + count;
        const count24h   = (existing.count_24h || 0) + count;
        const velocity   = count24h > 0 ? count2h / count24h : 0;

        await supabase
          .from("hashtags")
          .update({
            prev_usage_count: prevCount,
            usage_count:      newCount,
            growth_rate:      parseFloat(growthRate.toFixed(2)),
            count_2h:         count2h,
            count_24h:        count24h,
            velocity_score:   parseFloat(velocity.toFixed(4)),
            last_seen_at:     new Date().toISOString(),
            updated_at:       new Date().toISOString()
          })
          .eq("hashtag", hashtag)
          .eq("platform", platform);
      } else {
        await supabase.from("hashtags").insert({
          hashtag,
          platform,
          usage_count:    count,
          growth_rate:    100,
          count_2h:       count,
          count_24h:      count,
          velocity_score: 1,
          last_seen_at:   new Date().toISOString()
        });
      }
    } catch (e) {}
  }
}


// ================================================================
//  1. TIKTOK INGESTION
//  Uses video.list (approved scope) — reads connected users' videos.
//  Runs per stored TikTok access token in Supabase.
//  Falls back to YouTube keyword matching for trend detection
//  until more TikTok users connect their accounts.
// ================================================================

async function ingestTikTok() {
  const start = Date.now();
  const runId = await startRun("tiktok");
  log("TikTok", "Starting ingestion run");

  let totalVideos = 0;

  try {
    // Get all stored TikTok access tokens from Supabase
    // (tokens saved when users connect their TikTok accounts)
    const { data: tokens } = await supabase
      .from("tiktok_tokens")
      .select("access_token, open_id, display_name")
      .gt("expires_at", new Date().toISOString());

    if (!tokens || !tokens.length) {
      log("TikTok", "No connected accounts — fetching TikTok trends via YouTube proxy for all geos");

      // Geo-aware TikTok proxy queries — one set per country in GEO_LIST.
      // Each country gets localised search terms so trends reflect that market.
      const TIKTOK_GEO_QUERIES = {
        GB: ["trending tiktok UK today 2026", "viral tiktok UK this week", "tiktok trend UK 2026"],
        US: ["trending tiktok US today 2026", "viral tiktok USA this week", "tiktok trend United States 2026"],
        NG: ["trending tiktok Nigeria today", "viral tiktok Nigeria 2026", "naija tiktok trend"],
        GH: ["trending tiktok Ghana today", "viral tiktok Ghana 2026"],
        ZA: ["trending tiktok South Africa today", "viral tiktok SA 2026"],
        CA: ["trending tiktok Canada today", "viral tiktok Canada 2026"],
        AU: ["trending tiktok Australia today", "viral tiktok Australia 2026"],
        IE: ["trending tiktok Ireland today", "viral tiktok Ireland 2026"],
        DE: ["trending tiktok Deutschland", "viral tiktok Germany 2026"],
        FR: ["trending tiktok France aujourd hui", "viral tiktok France 2026"],
        IN: ["trending tiktok India today", "viral tiktok India 2026"],
        AE: ["trending tiktok UAE today", "viral tiktok Dubai 2026"],
      };
      const DEFAULT_TT_QUERIES = ["trending tiktok today 2026", "viral tiktok this week"];

      let allProxyVideos = [];

      for (const geoCode of GEO_LIST) {
        const queries = TIKTOK_GEO_QUERIES[geoCode] || DEFAULT_TT_QUERIES;
        let proxyVideos = [];

        for (const q of queries) {
          try {
            const res  = await fetch(
              `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=video&order=viewCount&publishedAfter=${hoursAgo(12).toISOString()}&regionCode=${geoCode}&maxResults=5&key=${YT_API_KEY}`
            );
            const data = await res.json();
            if (data.error) { log("TikTok", `Proxy API error [${geoCode}]: ${data.error.message}`); break; }
            const items = data.items || [];
            items.forEach(item => {
              const title = item.snippet?.title;
              const id    = item.id?.videoId;
              if (title && id) {
                proxyVideos.push({
                  platform:          "tiktok_signal",   // ← honest label: YouTube-proxied TikTok signal
                  platform_video_id: `tt_proxy_${geoCode}_${id}`,
                  creator_id:        null,
                  creator_name:      item.snippet?.channelTitle || "trending",
                  title:             `[TT] ${title}`,
                  description:       `[TT] ${item.snippet?.description || title}`,
                  hashtags:          extractHashtags(title + " " + (item.snippet?.description || "")),
                  views:             0,   // ← no fake view counts — proxy rows excluded from velocity
                  likes:             0,
                  comments:          0,
                  shares:            0,
                  published_at:      item.snippet?.publishedAt || new Date().toISOString(),
                  fetched_at:        new Date().toISOString(),
                  country:           geoCode   // ← tag with country so scoring groups correctly
                });
              }
            });
            await sleep(200);
          } catch (e) {
            log("TikTok", `Proxy query failed [${geoCode}]: ${q}`, e.message);
          }
        }

        // Deduplicate within this geo
        const seen = new Set();
        proxyVideos = proxyVideos.filter(v => {
          if (seen.has(v.platform_video_id)) return false;
          seen.add(v.platform_video_id);
          return true;
        });

        if (proxyVideos.length) {
          allProxyVideos.push(...proxyVideos);
          log("TikTok", `Proxy [${geoCode}]: ${proxyVideos.length} videos`);
        } else {
          log("TikTok", `Proxy [${geoCode}]: no results`);
        }

        await sleep(300);
      }

      if (!allProxyVideos.length) {
        log("TikTok", "No proxy data for any geo — skipping TikTok ingestion");
        await completeRun(runId, "tiktok", { videos: 0, duration: Date.now() - start });
        return;
      }

      const { error: proxyErr } = await supabase.from("videos").insert(allProxyVideos);
      if (proxyErr) log("TikTok", "Proxy insert error", proxyErr.message);
      else log("TikTok", `Proxy: inserted ${allProxyVideos.length} TikTok-trend videos across ${GEO_LIST.length} geos`);

      await updateHashtagCounts(allProxyVideos.flatMap(v => v.hashtags), "tiktok");
      await completeRun(runId, "tiktok", { videos: allProxyVideos.length, duration: Date.now() - start });
      return;
    }

    log("TikTok", `Found ${tokens.length} connected accounts — fetching videos`);

    for (const token of tokens) {
      try {
        // video.list — reads the connected user's own videos
        const res = await fetch(
          "https://open.tiktokapis.com/v2/video/list/?fields=id,title,video_description,duration,cover_image_url,like_count,comment_count,share_count,view_count,create_time",
          {
            method:  "POST",
            headers: {
              "Authorization": "Bearer " + token.access_token,
              "Content-Type":  "application/json"
            },
            body: JSON.stringify({ max_count: 20 })
          }
        );

        const data   = await res.json();
        const videos = data?.data?.videos || [];

        if (!videos.length) {
          log("TikTok", `No videos for ${token.display_name || token.open_id}`);
          continue;
        }

        const rows = videos.map((v) => ({
          platform:          "tiktok",
          platform_video_id: v.id,
          creator_id:        token.open_id   || null,
          creator_name:      token.display_name || null,
          title:             v.title || v.video_description || null,
          description:       v.video_description || null,
          hashtags:          extractHashtags(v.video_description || ""),
          duration_secs:     v.duration      || null,
          thumbnail_url:     v.cover_image_url || null,
          views:             parseInt(v.view_count    || 0),
          likes:             parseInt(v.like_count    || 0),
          comments:          parseInt(v.comment_count || 0),
          shares:            parseInt(v.share_count   || 0),
          published_at:      v.create_time
            ? new Date(v.create_time * 1000).toISOString()
            : null,
          fetched_at: new Date().toISOString()
        }));

        const { error } = await supabase.from("videos").insert(rows);
        if (error) log("TikTok", `Insert error — ${token.display_name}`, error.message);
        else totalVideos += rows.length;

        await updateHashtagCounts(
          videos.flatMap((v) => extractHashtags(v.video_description || "")),
          "tiktok"
        );

        log("TikTok", `Stored ${rows.length} videos for: ${token.display_name || token.open_id}`);
        await sleep(600);

      } catch (tokenErr) {
        log("TikTok", `Error for account ${token.open_id}`, tokenErr.message);
      }
    }

    await completeRun(runId, "tiktok", { videos: totalVideos, duration: Date.now() - start });
    log("TikTok", `Run complete — ${totalVideos} videos stored`);

  } catch (err) {
    log("TikTok", "Run FAILED", err.message);
    await failRun(runId, "tiktok", err.message);
  }
}


// ================================================================
//  2. YOUTUBE INGESTION
// ================================================================

async function ingestYouTube() {
  const start = Date.now();
  const runId = await startRun("youtube");
  log("YouTube", "Starting ingestion run");

  if (!YT_API_KEY) {
    log("YouTube", "YOUTUBE_API_KEY not set — skipping");
    await failRun(runId, "youtube", "YOUTUBE_API_KEY not configured");
    return;
  }

  let totalVideos = 0;

  // ── Loop every country in GEO_LIST ──────────────────────────────────────
  for (const regionCode of GEO_LIST) {
    log("YouTube", `Fetching for region: ${regionCode}`);

  try {
    // Part 1 — Trending by category
    for (const cat of YT_CATEGORIES) {
      try {
        const url    = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&chart=mostPopular&regionCode=${regionCode}&videoCategoryId=${cat.categoryId}&maxResults=25&key=${YT_API_KEY}`;
        const res    = await fetch(url);
        const data   = await res.json();

        // Surface quota/auth errors immediately rather than silently getting 0 videos
        if (data.error) {
          log("YouTube", `API error [${regionCode}/${cat.name}]: ${data.error.message} (code ${data.error.code})`);
          continue;
        }

        const videos = data.items || [];

        if (!videos.length) continue;

        const rows = videos.map((v) => {
          // Parse ISO 8601 duration → seconds  e.g. PT45S→45, PT1M10S→70
          const durStr = v.contentDetails?.duration || "";
          const durMatch = durStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
          const durSecs = durMatch
            ? (parseInt(durMatch[1]||0)*3600 + parseInt(durMatch[2]||0)*60 + parseInt(durMatch[3]||0))
            : null;
          const isShort = durSecs !== null && durSecs <= 60;

          return {
          platform:          "youtube",
          platform_video_id: `${regionCode}_${v.id}`,   // prefix keeps rows unique per country
          creator_id:        v.snippet?.channelId    || null,
          creator_name:      v.snippet?.channelTitle  || null,
          title:             v.snippet?.title         || null,
          description:       (v.snippet?.description  || "").slice(0, 500),
          hashtags:          extractHashtags(
            (v.snippet?.tags || []).join(" ") + " " + (v.snippet?.description || "")
          ),
          thumbnail_url:     v.snippet?.thumbnails?.medium?.url || null,
          views:             parseInt(v.statistics?.viewCount    || 0),
          likes:             parseInt(v.statistics?.likeCount    || 0),
          comments:          parseInt(v.statistics?.commentCount || 0),
          shares:            0,
          duration_secs:     durSecs,
          is_short:          isShort,   // ← true if ≤60s — used in prediction scoring
          published_at:      v.snippet?.publishedAt || null,
          fetched_at:        new Date().toISOString(),
          country:           regionCode
          };
        });

        // Delete videos older than 25h for this region/category.
        // Aligned with the 25h scoring-engine purge so velocity windows
        // (views_2h / views_24h) always have a consistent denominator.
        await supabase
          .from("videos")
          .delete()
          .eq("platform", "youtube")
          .eq("country", regionCode)
          .lt("fetched_at", hoursAgo(25).toISOString());

        // Dedup within this run — avoid PK conflicts if the same video appears
        // in multiple categories for the same region
        const newIds = rows.map(r => r.platform_video_id);
        const { data: existing } = await supabase
          .from("videos")
          .select("platform_video_id")
          .in("platform_video_id", newIds)
          .eq("platform", "youtube");
        const existingSet = new Set((existing || []).map(r => r.platform_video_id));
        const freshRows   = rows.filter(r => !existingSet.has(r.platform_video_id));
        if (!freshRows.length) { log("YouTube", `All videos already stored — ${regionCode}/${cat.name}`); continue; }

        const { error } = await supabase.from("videos").insert(freshRows);
        if (error) log("YouTube", `Insert error — ${regionCode}/${cat.name}`, error.message);
        else totalVideos += freshRows.length;

        await updateHashtagCounts(
          videos.flatMap((v) =>
            extractHashtags(
              (v.snippet?.tags || []).join(" ") + " " + (v.snippet?.description || "")
            )
          ),
          "youtube"
        );

        log("YouTube", `Stored ${rows.length} videos — ${regionCode}/${cat.name}`);
        await sleep(400);

      } catch (catErr) {
        log("YouTube", `Error — ${regionCode}/${cat.name}`, catErr.message);
      }
    }

    // Part 2 — Keyword searches (dynamic — pulled fresh from Google Trends RSS)
    const YT_KEYWORDS = await fetchTrendingKeywords(regionCode);
    for (const kw of YT_KEYWORDS) {
      try {
        const searchUrl  = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(kw)}&type=video&order=viewCount&publishedAfter=${daysAgo(1).toISOString()}&regionCode=${regionCode}&maxResults=15&key=${YT_API_KEY}`;
        const searchRes  = await fetch(searchUrl);
        const searchData = await searchRes.json();
        const items      = searchData.items || [];

        if (!items.length) continue;

        const ids       = items.map((i) => i.id.videoId).filter(Boolean).join(",");
        const statsRes  = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${ids}&key=${YT_API_KEY}`);
        const statsData = await statsRes.json();
        const videos    = statsData.items || [];

        const rows = videos.map((v) => ({
          platform:          "youtube",
          platform_video_id: `${regionCode}_kw_${v.id}`,
          creator_id:        v.snippet?.channelId    || null,
          creator_name:      v.snippet?.channelTitle  || null,
          title:             v.snippet?.title         || null,
          description:       (v.snippet?.description  || "").slice(0, 500),
          hashtags:          extractHashtags(v.snippet?.description || ""),
          thumbnail_url:     v.snippet?.thumbnails?.medium?.url || null,
          views:             parseInt(v.statistics?.viewCount    || 0),
          likes:             parseInt(v.statistics?.likeCount    || 0),
          comments:          parseInt(v.statistics?.commentCount || 0),
          shares:            0,
          published_at:      v.snippet?.publishedAt || null,
          fetched_at:        new Date().toISOString(),
          country:           regionCode
        }));

        const { error } = await supabase.from("videos").insert(rows);
        if (error) log("YouTube", `Insert error — ${regionCode} kw "${kw}"`, error.message);
        else totalVideos += rows.length;

        log("YouTube", `Stored ${rows.length} videos — ${regionCode}/${kw}`);
        await sleep(400);

      } catch (kwErr) {
        log("YouTube", `Error — ${regionCode} keyword "${kw}"`, kwErr.message);
      }
    }

  } catch (err) {
    log("YouTube", `Region ${regionCode} FAILED`, err.message);
  }

  await sleep(500); // small pause between countries to be kind to the API
  } // end GEO_LIST loop

  await completeRun(runId, "youtube", { videos: totalVideos, duration: Date.now() - start });
  log("YouTube", `Run complete — ${totalVideos} videos stored across ${GEO_LIST.length} countries`);
}


// ================================================================
//  3. GOOGLE TRENDS + NEWS RSS INGESTION
//
//  Completely quota-free. Four layered strategies per country:
//    S1: Google Trends RSS (daily)        — no key, best signal
//    S2: News RSS feeds (BBC, Guardian…)  — no key, real-time topics
//    S3: Reddit r/worldnews + geo subs    — no key, comment velocity
//    S4: GB topics reused for near-geos   — last resort, beats empty
//
//  All strategies write DIRECTLY to the trends table — no video
//  table intermediary. This means fresh trends appear immediately
//  even when the YouTube quota is exhausted.
// ================================================================

// Free news RSS feeds per geo — no API key, no quota
const NEWS_RSS = {
  GB: [
    "https://feeds.bbci.co.uk/news/rss.xml",
    "https://www.theguardian.com/uk/rss",
    "https://feeds.skynews.com/feeds/rss/home.xml",
  ],
  US: [
    "https://feeds.npr.org/1001/rss.xml",
    "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
    "https://feeds.washingtonpost.com/rss/national",
  ],
  NG: [
    "https://punchng.com/feed/",
    "https://www.vanguardngr.com/feed/",
    "https://techcabal.com/feed/",
  ],
  GH: [
    "https://www.myjoyonline.com/feed/",
    "https://www.graphic.com.gh/feed",
  ],
  ZA: [
    "https://feeds.news24.com/articles/news24/TopStories/rss",
    "https://www.dailymaverick.co.za/feed/",
  ],
  CA: [
    "https://rss.cbc.ca/lineup/topstories.xml",
    "https://www.theglobeandmail.com/arc/outboundfeeds/rss/category/canada/",
  ],
  AU: [
    "https://www.abc.net.au/news/feed/51120/rss.xml",
    "https://feeds.smh.com.au/rssheadlines/top.xml",
  ],
  IE: [
    "https://www.irishtimes.com/cmlink/the-irish-times-news-1.1319192",
    "https://feeds.rte.ie/rtenews.xml",
  ],
  DE: [
    "https://www.spiegel.de/schlagzeilen/tops/index.rss",
    "https://www.tagesschau.de/xml/rss2/",
  ],
  FR: [
    "https://www.lemonde.fr/rss/une.xml",
    "https://www.lefigaro.fr/rss/figaro_actualites.xml",
  ],
  IN: [
    "https://feeds.feedburner.com/ndtvnews-top-stories",
    "https://timesofindia.indiatimes.com/rssfeedstopstories.cms",
  ],
  AE: [
    "https://www.thenationalnews.com/arc/outboundfeeds/rss/?outputType=xml",
    "https://gulfnews.com/rss",
  ],
};

// Parse an RSS/Atom feed string — returns array of { title, link }
function parseRSS(xml) {
  const items = [];
  // Match <item> or <entry> blocks
  const itemRe = /<(?:item|entry)[^>]*>([\s\S]*?)<\/(?:item|entry)>/gi;
  let block;
  while ((block = itemRe.exec(xml)) !== null) {
    // Title: CDATA or plain
    const titleMatch =
      block[1].match(/<title><!\[CDATA\[([^\]]+)\]\]><\/title>/) ||
      block[1].match(/<title[^>]*>([^<]{3,120})<\/title>/);
    const title = titleMatch ? titleMatch[1].trim().replace(/&amp;/g, "&").replace(/&quot;/g, '"') : null;
    if (title && title.length > 5) items.push({ title });
  }
  return items;
}

// Extract a clean 2-3 word topic phrase from a news headline
function headlineToTopic(headline) {
  // Remove common news cruft
  const clean = headline
    .replace(/\s*[-–|:]\s*.*/g, "")   // strip "Foo: bar" → "Foo"
    .replace(/['"()[\]]/g, "")
    .replace(/\s+/g, " ").trim();

  const words = clean.split(" ").filter(w =>
    w.length > 2 && !STOP_WORDS.has(w.toLowerCase())
  );

  if (words.length >= 2) return words.slice(0, 3).join(" ").toLowerCase();
  if (words.length === 1 && words[0].length > 5) return words[0].toLowerCase();
  return null;
}

async function fetchGoogleTrendsRSS(geoCode) {
  const UAS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  ];
  for (const ua of UAS) {
    try {
      const res = await fetch(
        `https://trends.google.com/trends/trendingsearches/daily/rss?geo=${geoCode}`,
        { headers: { "User-Agent": ua }, signal: AbortSignal.timeout(8000) }
      );
      const xml = await res.text();
      if (!xml || xml.trim().startsWith("<html") || xml.length < 200) continue;

      const titles   = [];
      const traffics = [];
      const titleRe  = /<title><!\[CDATA\[([^\]]+)\]\]><\/title>/g;
      const trafficRe = /<ht:approx_traffic>([^<]+)<\/ht:approx_traffic>/g;
      let m;
      while ((m = titleRe.exec(xml))   !== null) {
        const t = m[1].trim();
        if (t && !["Google Trends", "Daily Search Trends"].includes(t)) titles.push(t);
      }
      while ((m = trafficRe.exec(xml)) !== null) traffics.push(m[1]);

      if (titles.length > 0) {
        log("Google", `RSS success [${geoCode}]: ${titles.length} topics`);
        return { titles, traffics };
      }
    } catch (e) { /* try next UA */ }
    await sleep(400);
  }
  return null;
}

async function fetchNewsRSS(geoCode) {
  const feeds = NEWS_RSS[geoCode] || NEWS_RSS.GB;
  const topics = new Map(); // topic → count (dedup + rank)

  for (const feedUrl of feeds) {
    try {
      const res = await fetch(feedUrl, {
        headers: { "User-Agent": "ImpactGrid/1.0 (trend-intelligence)" },
        signal: AbortSignal.timeout(7000)
      });
      if (!res.ok) continue;
      const xml    = await res.text();
      const items  = parseRSS(xml);
      for (const { title } of items.slice(0, 15)) {
        const topic = headlineToTopic(title);
        if (topic && topic.split(" ").length >= 2) {
          topics.set(topic, (topics.get(topic) || 0) + 1);
        }
      }
      log("Google", `News RSS [${geoCode}] ${feedUrl.split("/")[2]}: ${items.length} headlines`);
    } catch (e) {
      log("Google", `News RSS failed [${geoCode}] ${feedUrl.split("/")[2]}: ${e.message}`);
    }
    await sleep(200);
  }

  // Return sorted by frequency (topics appearing in multiple feeds rank higher)
  return [...topics.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([topic]) => topic)
    .slice(0, 20);
}

function buildTrendRows(topics, traffics, geoCode, source) {
  const now = new Date().toISOString();
  return topics.slice(0, 20).map((topic, i) => {
    const traffic = parseTraffic(traffics?.[i] || "0");
    // News RSS topics don't have traffic — assign realistic scores based on position
    const baseScore = traffic
      ? Math.round(googleTrafficToScore(traffic) * 0.7)
      : Math.max(35, 65 - i * 2);   // top news story = 65, fades down

    const words = topic.trim().split(/\s+/).filter(w => w.length > 2);
    const hashtags = words.length === 1
      ? ["#" + words[0]]
      : ["#" + words.join(""), ...words.slice(0, 2).map(w => "#" + w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())].slice(0, 3);

    return {
      topic,
      platform_source:      source,       // "google" (covers direct RSS, news RSS, and Reddit fallback)
      trend_score:          baseScore,
      velocity_score:       baseScore * 0.9,
      engagement_score:     50,
      cross_platform_boost: 0,
      instagram_prediction: baseScore * 0.4,
      instagram_reason:     source === "google"
        ? "Based on Google search demand — cross-platform signals pending"
        : "Breaking news topic — high Instagram story potential",
      video_count:          0,
      total_views:          traffic || 50000,
      total_likes:          0,
      hashtags,
      status:               i < 5 ? "peak" : i < 10 ? "rising" : "emerging",
      detected_at:          now,
      window_start:         daysAgo(1).toISOString(),
      window_end:           now,
      country:              geoCode
    };
  });
}

async function ingestGoogleTrends() {
  const start = Date.now();
  const runId = await startRun("google");
  log("Google", `Starting ingestion run for ${GEO_LIST.length} countries`);

  let totalTrends = 0;

  // Cache GB results as a fallback for near-geos that fail all sources
  let gbTopics = null;

  for (const geoCode of GEO_LIST) {
    log("Google", `Processing ${geoCode}`);
    let rows = [];

    // ── Strategy 1: Google Trends RSS ────────────────────────────────────────
    const rssResult = await fetchGoogleTrendsRSS(geoCode);
    if (rssResult && rssResult.titles.length) {
      rows = buildTrendRows(rssResult.titles, rssResult.traffics, geoCode, "google");
      if (geoCode === "GB") gbTopics = rssResult.titles;  // cache GB for fallback
    }

    // ── Strategy 2: News RSS feeds (quota-free, always works) ────────────────
    if (!rows.length) {
      log("Google", `RSS unavailable for ${geoCode} — trying news feeds`);
      const newsTopics = await fetchNewsRSS(geoCode);
      if (newsTopics.length) {
        rows = buildTrendRows(newsTopics, null, geoCode, "google");
        log("Google", `News RSS [${geoCode}]: ${newsTopics.length} topics`);
      }
    }

    // ── Strategy 3: Reddit geo-specific posts ────────────────────────────────
    if (!rows.length) {
      log("Google", `News RSS failed for ${geoCode} — trying Reddit`);
      const GEO_REDDIT = {
        GB: "unitedkingdom", US: "news", NG: "Nigeria", GH: "ghana",
        ZA: "southafrica", CA: "canada", AU: "australia", IN: "india",
        IE: "ireland", DE: "germany", FR: "france", AE: "dubai"
      };
      const sub = GEO_REDDIT[geoCode] || "worldnews";
      try {
        const r = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=15`, {
          headers: { "User-Agent": "ImpactGrid/1.0" },
          signal: AbortSignal.timeout(8000)
        });
        const j = await r.json();
        const redditTopics = (j?.data?.children || [])
          .filter(p => !p.data?.stickied)
          .map(p => headlineToTopic(p.data?.title || ""))
          .filter(Boolean);
        if (redditTopics.length) {
          rows = buildTrendRows(redditTopics, null, geoCode, "google");
          log("Google", `Reddit [${geoCode}] r/${sub}: ${redditTopics.length} topics`);
        }
      } catch (e) {
        log("Google", `Reddit fallback failed [${geoCode}]`, e.message);
      }
    }

    // ── Strategy 4: Reuse GB as final fallback ────────────────────────────────
    if (!rows.length && gbTopics && geoCode !== "GB") {
      rows = buildTrendRows(gbTopics, null, geoCode, "google");
      log("Google", `[${geoCode}] using GB topics as fallback (${rows.length} rows)`);
    }

    if (!rows.length) {
      log("Google", `All strategies failed for ${geoCode} — skipping`);
      await sleep(300);
      continue;
    }

    // Delete stale trends for this country/source before inserting fresh ones
    await supabase.from("trends").delete()
      .eq("platform_source", "google")
      .eq("country", geoCode)
      .lt("detected_at", hoursAgo(2).toISOString());

    const { error } = await supabase.from("trends").insert(rows);
    if (error) log("Google", `Insert error [${geoCode}]`, error.message);
    else {
      totalTrends += rows.length;
      log("Google", `Stored ${rows.length} trends for ${geoCode} (source: ${rows[0].platform_source})`);
    }

    await sleep(400);
  }

  await completeRun(runId, "google", { trends: totalTrends, duration: Date.now() - start });
  log("Google", `Run complete — ${totalTrends} trends stored across ${GEO_LIST.length} countries`);
}


// ================================================================
//  4. TOPIC GROUPING
//  Real title-first extraction — surfaces actual trending topics
//  instead of generic seed keywords like "fyp", "viral", "ai".
// ================================================================

const STOP_WORDS = new Set([
  "the","a","an","and","or","but","in","on","at","to","for","of","with",
  "is","are","was","were","be","been","being","have","has","had","do","does",
  "did","will","would","could","should","may","might","shall","can",
  "i","you","he","she","it","we","they","my","your","his","her","its","our",
  "this","that","these","those","what","which","who","how","why","when","where",
  "all","some","any","no","not","so","just","more","than","then","now","up",
  "new","best","top","viral","trending","fyp","foryou","foryoupage","trend",
  "video","watch","see","look","like","follow","subscribe","comment",
  "reaction","react","reacts","reacting","review","reviews","reviewing",
  "ft","feat","vs","part","ep","episode","vlog","shorts",
  "2024","2025","2026","uk","us","gb","full","official","original",
  // Generic content words that produce meaningless single-word topics
  "routine","challenge","hack","hacks","tips","tip","trick","tricks",
  "guide","tutorial","explained","explanation","update","updates","news",
  "story","stories","thing","things","time","day","week","month","year",
  "way","ways","life","make","made","making","using","used","uses","use",
  "here","there","their","about","after","before","from","into","over",
  "good","great","amazing","crazy","insane","wild","real","true","first",
  "last","next","every","each","much","many","most","even","also","back",
  "got","get","gets","getting","done","want","need","know","said","says",
  "went","come","came","take","took","people","someone","everyone","anyone"
]);

function extractTopic(title) {
  const clean = (title || "")
    .replace(/\[TT\]\s*/gi, "")
    .replace(/[|#@!?*\[\]()]/g, " ")
    .replace(/\s+/g, " ").trim();

  const words = clean.split(" ").filter(w => w.length > 1);

  // 1. Named entity run: 2-3 consecutive capitalised words (proper noun / brand).
  // Skip position 0 — always capitalised as sentence start, causes false positives.
  for (let i = 1; i < words.length - 1; i++) {
    const w1 = words[i], w2 = words[i + 1];
    const cap1 = /^[A-Z]/.test(w1) && !STOP_WORDS.has(w1.toLowerCase()) && w1.length > 2;
    const cap2 = /^[A-Z]/.test(w2) && !STOP_WORDS.has(w2.toLowerCase()) && w2.length > 2;
    if (cap1 && cap2 && w1.toLowerCase() !== w2.toLowerCase()) {
      // Grab a third word if also capitalised (e.g. "Taylor Swift Era")
      const w3 = words[i + 2];
      if (w3 && /^[A-Z]/.test(w3) && !STOP_WORDS.has(w3.toLowerCase()) && w3.length > 2) {
        return (w1 + " " + w2 + " " + w3).toLowerCase();
      }
      return (w1 + " " + w2).toLowerCase();
    }
  }

  // 2. Meaningful noun phrase: collect 2-3 non-stop content words.
  // This prevents bare fragments like "tooth", "hack", "routine" from
  // being stored as topics — single words have no standalone meaning to a creator.
  const contentWords = words.filter(w => !STOP_WORDS.has(w.toLowerCase()) && w.length > 2);
  if (contentWords.length >= 2) {
    const phrase = contentWords.slice(0, 3);
    // Remove adjacent duplicates
    const deduped = phrase.filter((w, i) => i === 0 || w.toLowerCase() !== phrase[i - 1].toLowerCase());
    if (deduped.length >= 2) return deduped.join(" ").toLowerCase();
  }

  // 3. Single content word only if genuinely descriptive (>5 chars)
  const single = contentWords.find(w => w.length > 5);
  if (single) return single.toLowerCase();

  return null; // too vague to be a useful trend topic — reject
}

function groupByTopic(videos) {
  const groups = {};

  // Live Google Trends topics (real searches, not our seed keywords)
  const liveTopics = _dynamicTopicKeywords.filter(t => !TOPIC_KEYWORDS_STATIC.includes(t));

  for (const video of videos) {
    const text = ((video.title || "") + " " + (video.description || "")).toLowerCase();
    let matched = false;

    // 1. Match live Google Trends topic first (highest signal)
    for (const topic of liveTopics) {
      if (text.includes(topic.toLowerCase())) {
        if (!groups[topic]) groups[topic] = [];
        groups[topic].push(video);
        matched = true;
        break;
      }
    }

    // 2. Extract real topic from title.
    // For Google Trends rows the title IS the full trending search phrase —
    // use it directly rather than extracting from it (avoids stripping context).
    if (!matched) {
      let extracted;
      if (video.platform === "google" && video.title && video.title.length > 3 && !video.title.startsWith("[")) {
        // Google Trends title is already the full search phrase (e.g. "tooth whitening kit")
        extracted = video.title.trim().toLowerCase();
      } else {
        extracted = extractTopic(video.title || "");
      }
      // Require at least 2 words OR >6 chars — rejects bare single words like "tooth", "hack"
      const wordCount = extracted ? extracted.split(" ").filter(w => w.length > 1).length : 0;
      if (extracted && (wordCount >= 2 || extracted.length > 6)) {
        if (!groups[extracted]) groups[extracted] = [];
        groups[extracted].push(video);
        matched = true;
      }
    }

    // 3. Last resort: first non-generic hashtag (only if it reads as a real phrase)
    if (!matched && video.hashtags?.length) {
      const tag = video.hashtags[0].replace("#", "").toLowerCase();
      if (tag && !STOP_WORDS.has(tag) && tag.length > 4) {
        if (!groups[tag]) groups[tag] = [];
        groups[tag].push(video);
      }
    }
  }

  return groups;
}


// ================================================================
//  REDDIT INGESTION
//  Fetches hot posts from creator-niche subreddits — no API key needed.
//  Tracks comment velocity (comments / post_age_hours) as a TikTok
//  prediction signal: high comment velocity precedes TikTok virality
//  by 24–72 hours.
// ================================================================

const REDDIT_SUBS = [
  "OutOfTheLoop",       // things going viral right now
  "TikTokCringe",       // TikTok content discussed on Reddit = early awareness
  "LifeProTips",        // reliably becomes TikTok content
  "relationship_advice",// emotional topics = TikTok gold
  "personalfinance",
  "UKPersonalFinance",
  "Entrepreneur",
  "ContentCreators",
  "socialmedia",
  "mildlyinfuriating",  // emotional reaction = shareable
  "loseit",
  "todayilearned"
];

async function ingestReddit() {
  const start = Date.now();
  log("Reddit", "Starting ingestion run");

  const redditRows = [];

  for (const sub of REDDIT_SUBS) {
    try {
      const res = await fetch(
        `https://www.reddit.com/r/${sub}/hot.json?limit=10`,
        { headers: { "User-Agent": "ImpactGrid/1.0 (trend-intelligence)" } }
      );
      if (!res.ok) { log("Reddit", `HTTP ${res.status} for r/${sub}`); continue; }

      const json = await res.json();
      const posts = (json?.data?.children || []).filter(p => !p.data?.stickied);

      for (const post of posts) {
        const d         = post.data;
        const ageHours  = (Date.now() / 1000 - (d.created_utc || 0)) / 3600;
        const velocity  = ageHours > 0 ? (d.num_comments || 0) / ageHours : 0;

        redditRows.push({
          platform:          "reddit",
          platform_video_id: `reddit_${d.id}`,
          creator_id:        null,
          creator_name:      d.author || "reddit",
          title:             d.title  || "",
          description:       (d.selftext || "").slice(0, 500),
          hashtags:          [],
          views:             0,
          likes:             d.score          || 0,
          comments:          d.num_comments   || 0,
          shares:            0,
          duration_secs:     null,
          is_short:          false,
          reddit_velocity:   parseFloat(velocity.toFixed(2)),  // comments/hour — key signal
          subreddit:         sub,
          published_at:      d.created_utc
            ? new Date(d.created_utc * 1000).toISOString()
            : new Date().toISOString(),
          fetched_at:        new Date().toISOString(),
          country:           "GB"   // Reddit is global; tag GB as default
        });
      }

      await sleep(200);
    } catch (e) {
      log("Reddit", `Error for r/${sub}`, e.message);
    }
  }

  if (!redditRows.length) {
    log("Reddit", "No posts fetched");
    return;
  }

  // Upsert — avoid duplicate posts across runs
  const { error } = await supabase
    .from("videos")
    .upsert(redditRows, { onConflict: "platform_video_id", ignoreDuplicates: false });

  if (error) log("Reddit", "Insert error", error.message);
  else       log("Reddit", `Stored ${redditRows.length} posts across ${REDDIT_SUBS.length} subreddits (${Date.now() - start}ms)`);
}


// ================================================================
//  PREDICTION SIGNAL DETECTION
//  Called inside runTrendScoring() after scoring completes.
//  Writes to dijo_predictions table when signal confidence ≥ 40.
//
//  Supabase SQL — run once to create the table:
//
//  CREATE TABLE IF NOT EXISTS dijo_predictions (
//    id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
//    topic               text NOT NULL,
//    country             text NOT NULL DEFAULT 'GB',
//    prediction_type     text NOT NULL,   -- 'search_surge'|'shorts_surge'|'platform_migration'|'reddit_velocity'|'audio_surge'
//    predicted_score     numeric,
//    predicted_platform  text,            -- 'tiktok'|'instagram'|'both'
//    predicted_peak_window text,          -- e.g. '24-48h'
//    signal_sources      jsonb,           -- array of contributing signals
//    confidence          int,             -- 0-100
//    predicted_at        timestamptz DEFAULT now(),
//    verified_at         timestamptz,
//    actual_peak_score   numeric,
//    was_accurate        boolean
//  );
//  CREATE INDEX IF NOT EXISTS idx_dijo_predictions_topic ON dijo_predictions (topic, country);
//  CREATE INDEX IF NOT EXISTS idx_dijo_predictions_predicted_at ON dijo_predictions (predicted_at);
// ================================================================

function parseDuration(durStr = "") {
  const m = durStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return null;
  return parseInt(m[1]||0)*3600 + parseInt(m[2]||0)*60 + parseInt(m[3]||0);
}

async function detectAndWritePredictions(videos, scoredTopics) {
  const now = new Date();

  for (const topicRow of scoredTopics) {
    const { topic, country, trend_score } = topicRow;
    const topicLower = topic.toLowerCase();

    // Get all videos for this topic
    const topicVideos = videos.filter(v => {
      const text = ((v.title || "") + " " + (v.description || "")).toLowerCase();
      return text.includes(topicLower);
    });

    const signals      = [];
    let   confidence   = 0;
    let   predType     = null;
    let   peakWindow   = "24-48h";
    let   predPlatform = "tiktok";

    // ── Signal 1: Reddit comment velocity ───────────────────────────────────
    const redditPosts     = topicVideos.filter(v => v.platform === "reddit");
    const maxRedditVeloc  = Math.max(0, ...redditPosts.map(v => v.reddit_velocity || 0));
    if (maxRedditVeloc >= 30) {   // 30+ comments/hour = strong signal
      signals.push({ type: "reddit_velocity", value: maxRedditVeloc, subreddit: redditPosts[0]?.subreddit });
      confidence  += maxRedditVeloc >= 60 ? 30 : 20;
      predType     = predType || "reddit_velocity";
      peakWindow   = "24-72h";
    }

    // ── Signal 2: YouTube Shorts surge ──────────────────────────────────────
    const shorts6h = topicVideos.filter(v =>
      v.is_short &&
      v.platform === "youtube" &&
      new Date(v.fetched_at) >= new Date(Date.now() - 6 * 60 * 60 * 1000)
    );
    if (shorts6h.length >= 2) {   // 2+ Shorts in last 6h = early TikTok signal
      signals.push({ type: "shorts_surge", count: shorts6h.length });
      confidence += shorts6h.length >= 4 ? 30 : 20;
      predType    = predType || "shorts_surge";
      peakWindow  = "12-36h";
    }

    // ── Signal 3: Platform migration (Google → YouTube) ─────────────────────
    const platforms = [...new Set(topicVideos.map(v => v.platform))];
    const hasGoogle = platforms.includes("google");
    const hasYT     = platforms.includes("youtube");
    const hasTT     = platforms.includes("tiktok") || platforms.includes("tiktok_signal");

    if (hasGoogle && hasYT && !hasTT) {
      // Topic crossed from Google search to YouTube but not yet on TikTok
      signals.push({ type: "platform_migration", from: "google+youtube", to: "tiktok" });
      confidence  += 20;
      predType     = predType || "platform_migration";
      peakWindow   = "12-48h";
      predPlatform = "tiktok";
    }

    if (hasTT && !platforms.includes("instagram")) {
      // Topic on TikTok but not Instagram yet → Instagram prediction
      signals.push({ type: "tiktok_to_instagram", from: "tiktok", to: "instagram" });
      confidence  += 25;
      predType     = predType || "tiktok_to_instagram";
      peakWindow   = "48-96h";
      predPlatform = "instagram";
    }

    // ── Signal 4: Google Trends velocity acceleration ───────────────────────
    // Check if this topic appeared in Google AND has a high trend_score
    if (hasGoogle && trend_score >= 55) {
      signals.push({ type: "search_surge", score: trend_score });
      confidence += trend_score >= 75 ? 25 : 15;
      predType    = predType || "search_surge";
    }

    // Skip if not enough signal
    if (confidence < 40 || !predType || !signals.length) continue;

    // ── Check if we already have a recent prediction for this topic ─────────
    try {
      const { data: existing } = await supabase
        .from("dijo_predictions")
        .select("id")
        .eq("topic", topic)
        .eq("country", country)
        .gte("predicted_at", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
        .limit(1);

      if (existing && existing.length) continue; // already predicted recently

      await supabase.from("dijo_predictions").insert({
        topic,
        country,
        prediction_type:      predType,
        predicted_score:      trend_score,
        predicted_platform:   predPlatform,
        predicted_peak_window: peakWindow,
        signal_sources:       signals,
        confidence:           Math.min(100, confidence),
        predicted_at:         now.toISOString()
      });

      log("Predictions", `🔮 New prediction: "${topic}" [${country}] — ${predType} — confidence ${confidence}%`);
    } catch (e) {
      log("Predictions", `Write error for "${topic}"`, e.message);
    }
  }
}


// ================================================================
//  PREDICTION VERIFICATION (runs every 6 hours)
//  Checks predictions made 24-72h ago and marks them accurate/inaccurate.
// ================================================================

async function verifyPredictions() {
  log("Verify", "Running prediction verification");
  try {
    const cutoffOld = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
    const cutoffNew = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: pending } = await supabase
      .from("dijo_predictions")
      .select("*")
      .is("verified_at", null)
      .lt("predicted_at", cutoffNew)
      .gt("predicted_at", cutoffOld);

    if (!pending || !pending.length) {
      log("Verify", "No pending predictions to verify");
      return;
    }

    for (const pred of pending) {
      try {
        const { data: current } = await supabase
          .from("trends")
          .select("trend_score")
          .eq("topic", pred.topic)
          .eq("country", pred.country)
          .order("detected_at", { ascending: false })
          .limit(1)
          .single();

        const currentScore  = current?.trend_score || 0;
        const scoreDelta    = currentScore - (pred.predicted_score || 0);
        const wasAccurate   = scoreDelta >= 20;  // rose ≥20 points since prediction

        await supabase
          .from("dijo_predictions")
          .update({
            verified_at:      new Date().toISOString(),
            actual_peak_score: currentScore,
            was_accurate:      wasAccurate
          })
          .eq("id", pred.id);

        log("Verify", `"${pred.topic}" [${pred.country}] — ${wasAccurate ? "✅ ACCURATE" : "❌ missed"} (Δ${scoreDelta.toFixed(1)})`);
      } catch (e) {
        // Topic may have been purged — mark as unverifiable (was_accurate: false)
        await supabase
          .from("dijo_predictions")
          .update({ verified_at: new Date().toISOString(), was_accurate: false })
          .eq("id", pred.id);
      }
    }

    log("Verify", `Verified ${pending.length} predictions`);
  } catch (e) {
    log("Verify", "Verification run failed", e.message);
  }
}




async function runTrendScoring() {
  log("Scoring", "Starting trend scoring run");

  // Refresh topic keywords with live Google Trends topics before scoring
  await refreshTopicKeywords();

  // Housekeeping — purge videos older than 25h so the scoring engine only
  // ever sees the last ~24h of data. 72h was too long — it caused the same
  // videos to keep scoring, making trends appear frozen/hardcoded.
  try {
    const cutoff = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    const { error: purgeErr } = await supabase
      .from("videos")
      .delete()
      .lt("fetched_at", cutoff);
    if (purgeErr) log("Scoring", "Stale video purge error", purgeErr.message);
    else           log("Scoring", "Purged videos older than 25h");
  } catch (e) {
    log("Scoring", "Purge failed (non-fatal)", e.message);
  }

  try {
    const now    = new Date();
    const ago24h = hoursAgo(24).toISOString();
    const now2h  = hoursAgo(2);

    const { data: recentVideos, error: fetchError } = await supabase
      .from("videos")
      .select("*")
      .gte("fetched_at", ago24h)
      .order("fetched_at", { ascending: false });

    if (fetchError) {
      log("Scoring", "Fetch error", fetchError.message);
      return;
    }

    if (!recentVideos || !recentVideos.length) {
      log("Scoring", "No recent videos — skipping");
      return;
    }

    log("Scoring", `Processing ${recentVideos.length} videos`);

    const topicMap = groupByTopic(recentVideos);
    const scored   = [];

    for (const [topic, videos] of Object.entries(topicMap)) {
      if (videos.length < 1) continue;   // YouTube topics are less repetitive — allow singles

      const videos2h  = videos.filter((v) => new Date(v.fetched_at) >= now2h);
      const videos24h = videos;

      const views2h     = videos2h.reduce((s, v)  => s + (v.views    || 0), 0);
      const views24h    = videos24h.reduce((s, v) => s + (v.views    || 0), 0);
      const likes24h    = videos24h.reduce((s, v) => s + (v.likes    || 0), 0);
      const comments24h = videos24h.reduce((s, v) => s + (v.comments || 0), 0);
      const shares24h   = videos24h.reduce((s, v) => s + (v.shares   || 0), 0);

      // Velocity (0-100)
      // Exclude tiktok_signal proxy rows (views=0) from velocity — they poison the denominator.
      const realVideos24h = videos24h.filter(v => v.platform !== "tiktok_signal");
      const realViews24h  = realVideos24h.reduce((s, v) => s + (v.views || 0), 0);
      const realViews2h   = videos2h.filter(v => v.platform !== "tiktok_signal").reduce((s, v) => s + (v.views || 0), 0);
      const velocityRaw   = realViews24h > 0 ? realViews2h / realViews24h : 0;
      const velocityScore = Math.min(100, velocityRaw * 200);

      // Engagement (0-100)
      const engagementRaw   = views24h > 0
        ? (likes24h + comments24h + shares24h) / views24h
        : 0;
      const engagementScore = Math.min(100, engagementRaw * 500);

      // Comments growth component (0-100)
      const commentsScore = views24h > 0
        ? Math.min(100, (comments24h / views24h) * 1000)
        : 0;

      // Recency (0-100, decays over 25h)
      const latestVideo  = [...videos].sort(
        (a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0)
      )[0];
      const hoursOld     = latestVideo?.published_at
        ? (now - new Date(latestVideo.published_at)) / (1000 * 60 * 60)
        : 24;
      const recencyScore = Math.max(0, 100 - hoursOld * 4);

      // Cross-platform boost
      // tiktok_signal = YouTube-proxied TikTok estimate (no real TikTok accounts connected yet).
      // For cross-platform detection we treat it as tiktok presence, but we track whether
      // the "tiktok" signal is real or proxy so platform_source can be labelled honestly.
      const rawPlatforms   = [...new Set(videos.map(v => v.platform))];
      const hasRealTikTok  = rawPlatforms.includes("tiktok");
      const hasProxyTikTok = rawPlatforms.includes("tiktok_signal");
      const normPlatforms  = [...new Set(rawPlatforms.map(p =>
        p === "tiktok_signal" ? "tiktok" : p
      ))];
      const crossPlatformBoost =
        normPlatforms.includes("tiktok") && normPlatforms.includes("youtube") ? 35 :
        normPlatforms.length >= 2 ? 25 : 0;

      // platform_source rules:
      //   "tiktok"        — real TikTok accounts connected, data is genuine
      //   "tiktok_signal" — YouTube-proxied estimate only, no real TikTok data
      //   "cross"         — appears on 2+ platforms (proxy tiktok_signal still earns cross
      //                     when paired with real YouTube/Google data, but never alone)
      //   "youtube"       — YouTube only
      //   "google"        — Google/news/Reddit only
      const platformSource =
        normPlatforms.length >= 2
          ? "cross"
          : hasRealTikTok
            ? "tiktok"
            : hasProxyTikTok
              ? "tiktok_signal"   // ← honest label: YouTube-proxied, not real TikTok
              : normPlatforms[0] === "youtube"
                ? "youtube"
                : "google";

      // Final weighted score
      const finalScore = Math.min(100,
        (velocityScore   * 0.4) +
        (engagementScore * 0.3) +
        (commentsScore   * 0.2) +
        (recencyScore    * 0.1) +
        crossPlatformBoost
      );

      // Instagram prediction
      const hasTikTok  = normPlatforms.includes("tiktok");  // includes proxy
      const hasYouTube = normPlatforms.includes("youtube");
      const instagramPrediction = Math.min(100,
        (hasTikTok  ? velocityScore   * 0.5 : 0) +
        (hasYouTube ? engagementScore * 0.3 : 0) +
        (crossPlatformBoost * 1.5)
      );

      // Strip [TT] namespace prefix before storing — keeps UI topic names clean
      const cleanTopic = topic.replace(/^\[TT\]\s*/i, "");

      // Determine country from the videos in this topic group.
      // Most videos will share the same country; take the most common one.
      const countryCounts = {};
      videos.forEach(v => {
        const c = v.country || "GB";
        countryCounts[c] = (countryCounts[c] || 0) + 1;
      });
      const topCountry = Object.entries(countryCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || "GB";

      scored.push({
        topic:                cleanTopic,
        platform_source:      platformSource,
        trend_score:          parseFloat(finalScore.toFixed(2)),
        velocity_score:       parseFloat(velocityScore.toFixed(2)),
        engagement_score:     parseFloat(engagementScore.toFixed(2)),
        cross_platform_boost: crossPlatformBoost,
        instagram_prediction: parseFloat(instagramPrediction.toFixed(2)),
        instagram_reason:     buildIGReason(hasTikTok, hasYouTube, velocityScore, instagramPrediction),
        video_count:          videos.length,
        total_views:          views24h,
        total_likes:          likes24h,
        hashtags:             [...new Set(videos.flatMap((v) => v.hashtags || []))].slice(0, 10),
        sample_video_ids:     videos.slice(0, 5).map((v) => v.platform_video_id),
        status:               getStatus(finalScore),
        detected_at:          now.toISOString(),
        window_start:         ago24h,
        window_end:           now.toISOString(),
        country:              topCountry    // ← tag each scored trend with its country
      });
    }

    if (!scored.length) {
      log("Scoring", "No topics scored — need more data");
      return;
    }

    scored.sort((a, b) => b.trend_score - a.trend_score);
    const top50 = scored.slice(0, 50);

    log("Scoring", `Top topic: "${top50[0].topic}" — score: ${top50[0].trend_score}`);

    // ── Fetch a Pexels image for each trend (once per scoring cycle) ─────────
    // Staggered 200 ms apart to stay well within Pexels rate limits.
    // Fails silently — a missing image never blocks the insert.
    log("Scoring", "Fetching Pexels images for top trends…");
    for (let i = 0; i < top50.length; i++) {
      top50[i].image_url = await fetchPexelsImage(top50[i].topic);
      await sleep(200);
    }
    log("Scoring", "Pexels image fetch complete");

    // Delete existing trends for same topics before inserting fresh scores
    // This prevents duplicates building up across ingestion runs
    const topicList = [...new Set(top50.map(t => t.topic))];
    await supabase
      .from("trends")
      .delete()
      .in("topic", topicList)
      .gte("detected_at", hoursAgo(12).toISOString());

    const { data: insertedTrends, error: trendError } = await supabase
      .from("trends")
      .insert(top50)
      .select();

    if (trendError) {
      log("Scoring", "Trend insert error", trendError.message);
      return;
    }

    // Only keep latest score per trend — clean old score rows
    if (insertedTrends && insertedTrends.length) {
      const scoreRows = insertedTrends.map((t) => ({
        trend_id:             t.id,
        topic:                t.topic,
        velocity_score:       t.velocity_score,
        engagement_score:     t.engagement_score,
        cross_platform_score: t.cross_platform_boost,
        recency_score:        50,
        final_score:          t.trend_score,
        video_count:          t.video_count,
        total_views:          t.total_views,
        views_last_2h:        0,
        views_last_24h:       t.total_views,
        scored_at:            now.toISOString()
      }));

      const { error: scoreError } = await supabase.from("trend_scores").insert(scoreRows);
      if (scoreError) log("Scoring", "Score rows error", scoreError.message);
    }

    log("Scoring", `Complete — ${top50.length} trends written to Supabase`);

    // ── Prediction signal detection ─────────────────────────────────────────
    // Run after scoring so we have fresh trend_score values to compare against.
    try {
      await detectAndWritePredictions(recentVideos, top50);
    } catch (predErr) {
      log("Predictions", "Detection failed (non-fatal)", predErr.message);
    }

  } catch (err) {
    log("Scoring", "FAILED", err.message);
  }
}


// ================================================================
//  FULL INGESTION CYCLE
// ================================================================

async function runAllIngestion() {
  log("Scheduler", "Running full ingestion cycle");
  await Promise.allSettled([
    ingestTikTok(),
    ingestYouTube(),
    ingestGoogleTrends(),
    ingestReddit()          // ← Reddit comment velocity signals
  ]);
  await runTrendScoring();
  log("Scheduler", "Full cycle complete");
}


// ================================================================
//  API ROUTES
// ================================================================

export function addIngestionRoutes(app) {

  // NOTE: /trends/live is owned by server.js — it queries the trends table
  // directly, ordered by trend_score. Do not re-register it here.

  // ── Dijo Intelligence — top 3 cross-platform picks ──────────────────────
  // dijoScore weights the real scored columns:
  //   velocity_score       → TikTok-style momentum    (0-100)
  //   engagement_score     → YouTube-style validation (0-100)
  //   cross_platform_boost → multi-platform bonus     (0 | 25 | 35)
  // Fetch top 20 by trend_score first, then re-rank by dijoScore in JS
  // so the query stays fast (no computed column needed in Supabase).
  app.get("/trends/dijo", async (req, res) => {
    try {
      const geo = (req.query.geo || "GB").toUpperCase().slice(0, 2);

      // Primary: filter by user's country
      let { data, error } = await supabase
        .from("trends")
        .select("*")
        .eq("country", geo)
        .order("trend_score", { ascending: false })
        .limit(20);

      if (error) throw error;

      // Fallback: no rows for this country yet — return global top trends
      if (!data || !data.length) {
        log("Dijo", `No rows for geo=${geo} — falling back to global`);
        const fallback = await supabase
          .from("trends")
          .select("*")
          .order("trend_score", { ascending: false })
          .limit(20);
        if (fallback.error) throw fallback.error;
        data = fallback.data || [];
      }

      if (!data.length) return res.json([]);

      const enriched = data.map(t => ({
        ...t,
        dijoScore:
          (t.velocity_score       || 0) * 0.4 +
          (t.engagement_score     || 0) * 0.3 +
          (t.cross_platform_boost || 0) * 0.3
      }));

      const top3 = enriched
        .sort((a, b) => b.dijoScore - a.dijoScore)
        .slice(0, 3);

      res.json(top3);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Dijo predictions — active and verified
  app.get("/trends/predictions", async (req, res) => {
    try {
      const geo   = (req.query.geo || "GB").toUpperCase().slice(0, 2);
      const since = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();

      // Fetch unverified (active) predictions
      let { data: active, error: activeErr } = await supabase
        .from("dijo_predictions")
        .select("*")
        .eq("country", geo)
        .is("verified_at", null)
        .gte("predicted_at", since)
        .order("confidence", { ascending: false })
        .limit(20);

      if (activeErr) throw activeErr;

      // Fetch recently verified accurate predictions (for "Dijo called this" badges)
      let { data: verified, error: verErr } = await supabase
        .from("dijo_predictions")
        .select("*")
        .eq("country", geo)
        .eq("was_accurate", true)
        .gte("verified_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order("verified_at", { ascending: false })
        .limit(10);

      if (verErr) throw verErr;

      // Accuracy stat — last 30 days
      const { data: allRecent } = await supabase
        .from("dijo_predictions")
        .select("was_accurate")
        .eq("country", geo)
        .not("was_accurate", "is", null)
        .gte("predicted_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const total    = (allRecent || []).length;
      const accurate = (allRecent || []).filter(p => p.was_accurate).length;
      const accuracy = total > 0 ? Math.round((accurate / total) * 100) : null;

      res.json({
        active:   active   || [],
        verified: verified || [],
        accuracy_30d: accuracy,
        total_verified: total,
        geo,
        ts: new Date().toISOString()
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Manual trigger for verification (admin/testing)
  app.post("/ingestion/verify-predictions", async (req, res) => {
    res.json({ message: "Verification triggered" });
    verifyPredictions().catch(e => log("Verify", "Manual trigger error", e.message));
  });


  // Rising hashtags
  app.get("/trends/rising", async (req, res) => {
    try {
      const geo = (req.query.geo || "GB").toUpperCase().slice(0, 2);

      let { data, error } = await supabase
        .from("v_rising_hashtags")
        .select("*")
        .eq("country", geo)
        .limit(30);

      if (error) throw error;

      if (!data || !data.length) {
        const fallback = await supabase.from("v_rising_hashtags").select("*").limit(30);
        if (fallback.error) throw fallback.error;
        data = fallback.data || [];
      }

      res.json({ hashtags: data });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Cross-platform trends
  app.get("/trends/cross", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("v_cross_platform_trends")
        .select("*")
        .limit(20);
      if (error) throw error;
      res.json({ trends: data || [] });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Instagram predictions
  app.get("/trends/instagram-predictions", async (req, res) => {
    try {
      const geo = (req.query.geo || "GB").toUpperCase().slice(0, 2);

      let { data, error } = await supabase
        .from("trends")
        .select("topic,instagram_prediction,instagram_reason,trend_score,platform_source,detected_at,country")
        .eq("country", geo)
        .gte("instagram_prediction", 50)
        .gte("detected_at", hoursAgo(24).toISOString())
        .order("instagram_prediction", { ascending: false })
        .limit(15);

      if (error) throw error;

      if (!data || !data.length) {
        const fallback = await supabase
          .from("trends")
          .select("topic,instagram_prediction,instagram_reason,trend_score,platform_source,detected_at,country")
          .gte("instagram_prediction", 50)
          .gte("detected_at", hoursAgo(24).toISOString())
          .order("instagram_prediction", { ascending: false })
          .limit(15);
        if (fallback.error) throw fallback.error;
        data = fallback.data || [];
      }

      res.json({ predictions: data });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Debug — pipeline health snapshot (no auth needed for local dev)
  app.get("/ingestion/debug", async (req, res) => {
    try {
      const [videosRes, trendsRes, hashtagsRes] = await Promise.all([
        supabase
          .from("videos")
          .select("platform, fetched_at")
          .gte("fetched_at", hoursAgo(24).toISOString()),
        supabase
          .from("trends")
          .select("platform_source, trend_score, topic, detected_at")
          .gte("detected_at", hoursAgo(24).toISOString())
          .order("trend_score", { ascending: false })
          .limit(10),
        supabase
          .from("hashtags")
          .select("platform, hashtag, velocity_score")
          .order("velocity_score", { ascending: false })
          .limit(10)
      ]);

      // Count videos per platform
      const videoCounts = {};
      for (const v of (videosRes.data || [])) {
        videoCounts[v.platform] = (videoCounts[v.platform] || 0) + 1;
      }

      // Count trends per platform_source
      const trendCounts = {};
      for (const t of (trendsRes.data || [])) {
        trendCounts[t.platform_source] = (trendCounts[t.platform_source] || 0) + 1;
      }

      res.json({
        videos_last_24h:    videoCounts,
        trends_last_24h:    trendCounts,
        top_trends:         trendsRes.data  || [],
        top_hashtags:       hashtagsRes.data || [],
        ts:                 new Date().toISOString()
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Ingestion status per platform
  app.get("/ingestion/status", async (req, res) => {
    try {
      const platforms = ["tiktok", "youtube", "google"];
      const status    = {};
      for (const p of platforms) {
        const { data } = await supabase
          .from("ingestion_runs")
          .select("*")
          .eq("platform", p)
          .order("started_at", { ascending: false })
          .limit(1)
          .single();
        status[p] = data || null;
      }
      res.json(status);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Manual trigger (admin)
  app.post("/ingestion/trigger", async (req, res) => {
    const { platform } = req.body;
    res.json({ message: "Ingestion triggered", platform: platform || "all" });
    if      (platform === "tiktok")  ingestTikTok();
    else if (platform === "youtube") ingestYouTube();
    else if (platform === "google")  ingestGoogleTrends();
    else if (platform === "scoring") runTrendScoring();
    else                             runAllIngestion();
  });
}


// ================================================================
//  SCHEDULER — called once from server.js after app.listen()
// ================================================================

export async function startIngestion() {
  // Validate required env vars before scheduling any work
  const missing = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY'].filter(k => !process.env[k]);
  if (missing.length) {
    console.error('[Ingestion] ❌ Missing required env vars:', missing.join(', '), '— ingestion will not start.');
    return;
  }

  log("Scheduler", "ImpactGrid ingestion engine starting");

  // One-time purge of stale generic/placeholder topics on every deploy
  const GENERIC_TOPICS = ["fyp","viral","ai","foryou","foryoupage","trending","trend","tiktok","youtube"];
  try {
    const { error: purgeErr } = await supabase.from("trends").delete().in("topic", GENERIC_TOPICS);
    if (purgeErr) log("Scheduler", "Startup purge error (non-fatal)", purgeErr.message);
    else          log("Scheduler", "Purged generic topics: " + GENERIC_TOPICS.join(", "));
  } catch (e) {
    log("Scheduler", "Startup purge failed (non-fatal)", e.message);
  }

  // Run immediately on startup
  runAllIngestion().catch((e) => log("Scheduler", "Startup cycle error", e.message));

  // Schedule recurring runs
  setInterval(
    () => ingestTikTok().catch((e)       => log("TikTok",  "Scheduled run error", e.message)),
    INTERVALS.TIKTOK_MS
  );
  setInterval(
    () => ingestYouTube().catch((e)      => log("YouTube", "Scheduled run error", e.message)),
    INTERVALS.YOUTUBE_MS
  );
  setInterval(
    () => ingestGoogleTrends().catch((e) => log("Google",  "Scheduled run error", e.message)),
    INTERVALS.GOOGLE_MS
  );
  setInterval(
    () => runTrendScoring().catch((e)    => log("Scoring", "Scheduled run error", e.message)),
    INTERVALS.SCORING_MS
  );

  // Reddit: every 20 min (lighter than main ingestion)
  setInterval(
    () => ingestReddit().catch((e)       => log("Reddit",  "Scheduled run error", e.message)),
    20 * 60 * 1000
  );

  // Prediction verification: every 6 hours
  setInterval(
    () => verifyPredictions().catch((e)  => log("Verify",  "Cron error", e.message)),
    6 * 60 * 60 * 1000
  );

  log("Scheduler", "All ingestion jobs scheduled — 30 min intervals");
}
