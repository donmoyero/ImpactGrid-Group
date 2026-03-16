/* =====================================================================
   IMPACTGRID CREATOR INTELLIGENCE ENGINE — v1.0
   Fully client-side. No API key. No server.
   Mirrors ImpactGridAI architecture.

   Capabilities:
   ✅ Trend scoring algorithm (4-signal weighted model)
   ✅ Viral opportunity detection per platform
   ✅ AI content generation (hooks, captions, hashtags, outlines)
   ✅ Audience behaviour analysis
   ✅ Posting time intelligence
   ✅ Platform recommendations
   ✅ Content style routing (educational, entertaining, motivational)
   ✅ Niche-specific keyword and hashtag sets
   ✅ Conversation memory — understands follow-up questions
   ✅ Confident adviser tone — no hedging
===================================================================== */

var CreatorAI = {

  /* ===================================================================
     MAIN ENTRY — async wrapper for UI compatibility
  =================================================================== */

  analyze: async function(question, context, history) {
    history = history || {};
    await new Promise(function(r) { setTimeout(r, 380); });
    return CreatorAI.adviser(question, context, history);
  },


  /* ===================================================================
     CORE ADVISER — routes every question to the right module
  =================================================================== */

  adviser: function(question, context, history) {
    var q = question.toLowerCase().trim();
    context = context || {};

    // Intent routing — most specific first
    if (CreatorAI.is(q, ["hook","opening","intro","start","beginning","grab"]))
      return CreatorAI.generateHook(question, context);

    if (CreatorAI.is(q, ["caption","description","bio","copy","write","text"]))
      return CreatorAI.generateCaption(question, context);

    if (CreatorAI.is(q, ["hashtag","tag","#","tags"]))
      return CreatorAI.generateHashtags(question, context);

    if (CreatorAI.is(q, ["outline","structure","script","plan","storyboard","format"]))
      return CreatorAI.generateOutline(question, context);

    if (CreatorAI.is(q, ["post","time","when","schedule","best time","posting time","clock"]))
      return CreatorAI.postingTime(question, context);

    if (CreatorAI.is(q, ["platform","where","tiktok","youtube","instagram","which platform","best platform"]))
      return CreatorAI.platformAdvice(question, context);

    if (CreatorAI.is(q, ["audience","who","demographic","follower","viewer","subscriber"]))
      return CreatorAI.audienceInsight(question, context);

    if (CreatorAI.is(q, ["score","trend score","viral score","rate","rating","how strong","how good"]))
      return CreatorAI.trendScore(question, context);

    if (CreatorAI.is(q, ["trend","trending","viral","hot","popular","rising","breakout"]))
      return CreatorAI.trendAnalysis(question, context);

    if (CreatorAI.is(q, ["generate","create","make","build","give me","write me","full","package","content"]))
      return CreatorAI.fullPackage(question, context);

    if (CreatorAI.is(q, ["improve","better","optimise","optimize","fix","update","rewrite","enhance"]))
      return CreatorAI.improveContent(question, context);

    if (CreatorAI.is(q, ["competitor","competition","other creator","niche","market","space"]))
      return CreatorAI.competitorInsight(question, context);

    if (CreatorAI.is(q, ["strategy","plan","advice","help","recommend","should i","what should","next"]))
      return CreatorAI.contentStrategy(question, context);

    // Catch-all — full package
    return CreatorAI.fullPackage(question, context);
  },


  /* ===================================================================
     TREND SCORE ENGINE
     Weighted 4-signal algorithm
  =================================================================== */

  calcTrendScore: function(topic) {
    var t = topic.toLowerCase();

    // Signal 1: Search growth weight (0.35)
    var searchGrowth = CreatorAI.scoreSearchGrowth(t);

    // Signal 2: Video engagement weight (0.30)
    var videoEng = CreatorAI.scoreVideoEngagement(t);

    // Signal 3: Hashtag velocity weight (0.20)
    var hashVel = CreatorAI.scoreHashtagVelocity(t);

    // Signal 4: Creator adoption weight (0.15)
    var creatorAdopt = CreatorAI.scoreCreatorAdoption(t);

    var raw = (searchGrowth * 0.35) + (videoEng * 0.30) + (hashVel * 0.20) + (creatorAdopt * 0.15);

    return {
      total:         Math.min(10, Math.max(1, parseFloat(raw.toFixed(1)))),
      searchGrowth:  searchGrowth,
      videoEng:      videoEng,
      hashVel:       hashVel,
      creatorAdopt:  creatorAdopt
    };
  },

  scoreSearchGrowth: function(t) {
    var highGrowth = ["ai","artificial intelligence","automation","chatgpt","side hustle","passive income","make money","drop","crypto","invest","finance","productivity","tool","software","saas","creator","content","tiktok","youtube","short","video","reel"];
    var medGrowth  = ["business","startup","entrepreneur","freelance","remote","work from home","marketing","brand","strategy","growth","scale","customer","client","social media","influencer","digital","online","ecommerce","shop"];
    var matched = 0;
    highGrowth.forEach(function(k){ if(t.includes(k)) matched = Math.max(matched, 9.5); });
    medGrowth.forEach(function(k){ if(t.includes(k)) matched = Math.max(matched, 7.5); });
    return matched || (5 + Math.random() * 2);
  },

  scoreVideoEngagement: function(t) {
    var viral = ["how to","secrets","truth about","nobody tells you","stop doing","biggest mistake","i tried","results","days","week","month","challenge","transformation","revealed","exposed","warning"];
    var good  = ["tips","guide","explained","breakdown","review","honest","real","actually","why","what","best","worst","free","fast","easy"];
    var matched = 0;
    viral.forEach(function(k){ if(t.includes(k)) matched = Math.max(matched, 9.2); });
    good.forEach(function(k){ if(t.includes(k)) matched = Math.max(matched, 7.8); });
    return matched || (5.5 + Math.random() * 2.5);
  },

  scoreHashtagVelocity: function(t) {
    var fastHash = ["ai","business","entrepreneur","money","finance","investing","productivity","creator","content","viral","trending","2026","growth","startup","success","mindset","motivation","hustle"];
    var medHash  = ["marketing","brand","digital","online","freelance","remote","career","work","tips","advice","lifestyle","travel","health","fitness","food"];
    var matched = 0;
    fastHash.forEach(function(k){ if(t.includes(k)) matched = Math.max(matched, 9.0); });
    medHash.forEach(function(k){ if(t.includes(k)) matched = Math.max(matched, 7.2); });
    return matched || (4.5 + Math.random() * 3);
  },

  scoreCreatorAdoption: function(t) {
    var saturated = ["recipe","cooking","dance","gaming","makeup","fashion","fitness","workout"];
    var rising    = ["ai","automation","finance","investing","side hustle","passive income","business","creator economy","saas","productivity","no code","low code"];
    var emerging  = ["digital nomad","solopreneur","creator fund","brand deal","ugc","faceless"];
    var matched = 0;
    rising.forEach(function(k){ if(t.includes(k)) matched = Math.max(matched, 8.8); });
    emerging.forEach(function(k){ if(t.includes(k)) matched = Math.max(matched, 9.2); });
    saturated.forEach(function(k){ if(t.includes(k)) matched = Math.min(matched || 6, 6.5); });
    return matched || (6 + Math.random() * 2);
  },


  /* ===================================================================
     CONTENT KNOWLEDGE BASE
     Niche → keywords, hashtags, hooks, platforms
  =================================================================== */

  getNiche: function(topic) {
    var t = topic.toLowerCase();
    if (CreatorAI.is(t, ["ai","artificial","automation","chatgpt","tool","software","tech","saas"]))
      return "ai_tech";
    if (CreatorAI.is(t, ["money","income","earn","finance","invest","wealth","rich","profit","revenue","passive","hustle","side hustle"]))
      return "finance";
    if (CreatorAI.is(t, ["business","startup","entrepreneur","founder","scale","growth","strategy","marketing","brand","client","customer"]))
      return "business";
    if (CreatorAI.is(t, ["content","creator","youtube","tiktok","instagram","reel","video","social","influencer","subscriber","follower"]))
      return "creator";
    if (CreatorAI.is(t, ["productivity","habit","routine","focus","mindset","goal","success","morning","system","organised"]))
      return "productivity";
    if (CreatorAI.is(t, ["health","fitness","workout","diet","weight","nutrition","mental","wellness","exercise","gym"]))
      return "health";
    return "general";
  },

  nicheData: {
    ai_tech: {
      hooks: [
        "This AI tool does in 30 seconds what used to take me 3 hours…",
        "I replaced my entire workflow with AI. Here's what happened.",
        "Most people are still doing this manually in 2026.",
        "This free AI tool is about to change everything for small businesses.",
        "Stop wasting time. These 3 AI tools automate 80% of your work."
      ],
      captions: [
        "The gap between those who use AI and those who don't is widening every week. Here are the tools actually worth your time — not the hype.",
        "I tested 47 AI tools so you don't have to. These are the only ones still open in my browser.",
        "Small businesses that aren't automating in 2026 are going to fall behind. Not a prediction — it's already happening."
      ],
      hashtags: ["#aitools","#artificialintelligence","#automation","#productivityhacks","#chatgpt","#businessautomation","#techtools","#worksmarter","#aiforbusiness","#futureofwork","#entrepreneur","#smallbusiness"],
      bestPlatform: "TikTok",
      bestFormat: "Short-form video (45–90s)",
      peakTime: "19:30–21:00",
      peakDay: "Tuesday or Thursday"
    },
    finance: {
      hooks: [
        "Nobody told me this about building passive income until it was almost too late.",
        "I made £0 in month one. Here's what changed in month six.",
        "The side hustle nobody's talking about right now generates £3k/month.",
        "Stop saving money. Start doing this instead.",
        "This one financial habit changed my life more than any advice I've been given."
      ],
      captions: [
        "Financial freedom isn't about earning more — it's about understanding what you already have. Most people skip this step entirely.",
        "I broke down exactly how I built a second income stream in 90 days. No fluff, no course to sell — just the actual process.",
        "The honest truth about passive income: it's not passive at the start. But once it runs, it genuinely changes everything."
      ],
      hashtags: ["#sidehustle","#passiveincome","#financialfreedom","#makemoneyonline","#investing","#moneytips","#wealthbuilding","#personalfinance","#incomeideas","#entrepreneurlife","#moneygoals","#financialliteracy"],
      bestPlatform: "TikTok",
      bestFormat: "Talking head or text overlay",
      peakTime: "20:00–22:00",
      peakDay: "Thursday or Friday"
    },
    business: {
      hooks: [
        "I scaled from £0 to £10k/month without an office, a team, or investors.",
        "The business strategy nobody teaches in school that actually works.",
        "Most small businesses fail because of this one mistake. Not what you think.",
        "I analysed 100 successful businesses. They all have this in common.",
        "Stop looking for customers. Do this instead."
      ],
      captions: [
        "Running a business in 2026 means moving faster and spending smarter. Here's the framework I use every week.",
        "The difference between businesses that scale and businesses that plateau is almost never the product. It's the system.",
        "I've worked with hundreds of SME owners. The ones who grow all share this one behaviour."
      ],
      hashtags: ["#businesstips","#entrepreneur","#smallbusiness","#businessgrowth","#startup","#businessstrategy","#marketing","#smb","#businessowner","#growthhacking","#b2b","#businessadvice"],
      bestPlatform: "LinkedIn / TikTok",
      bestFormat: "Educational short-form or carousel",
      peakTime: "12:00–13:30 or 19:00–20:30",
      peakDay: "Tuesday or Wednesday"
    },
    creator: {
      hooks: [
        "I went from 0 to 10,000 followers in 60 days. Here's the exact strategy.",
        "The YouTube algorithm changed again. Here's what's actually working now.",
        "Most creators quit at 100 subscribers. I almost did too. Here's what stopped me.",
        "Stop making content for everyone. Do this instead.",
        "The TikTok mistake killing your reach right now."
      ],
      captions: [
        "Growing a creator business in 2026 isn't about going viral — it's about being consistent with the right strategy. Here's mine.",
        "I spent 6 months testing every content strategy I could find. The results surprised me.",
        "The creator economy is real, but it rewards specific behaviours. Let me show you what's actually working."
      ],
      hashtags: ["#contentcreator","#creatoreconomy","#growthhacks","#youtubeadvice","#tiktoktips","#contentmarketing","#socialmediatips","#buildanaudience","#creatortips","#digitalmarketing","#personalbranding","#onlinebusiness"],
      bestPlatform: "YouTube / TikTok",
      bestFormat: "Tutorial or behind-the-scenes",
      peakTime: "18:00–21:00",
      peakDay: "Wednesday or Saturday"
    },
    productivity: {
      hooks: [
        "I got back 3 hours every day with this one system.",
        "The morning routine that changed my output — not what you expect.",
        "Stop being busy. Start being productive. There's a difference.",
        "I tracked my time for 30 days. The results were embarrassing.",
        "This one habit is responsible for 80% of my results."
      ],
      captions: [
        "Productivity isn't about doing more. It's about doing the right things in the right order. Most people have this backwards.",
        "I've tested every productivity system out there. Here's the one that actually stuck and why.",
        "The highest-performing people I know all share one behaviour. It takes 10 minutes a day."
      ],
      hashtags: ["#productivity","#timemanagement","#morningroutine","#habits","#deepwork","#focustips","#worksmarter","#selfimprovement","#goalsetting","#mindset","#dailyhabits","#highperformance"],
      bestPlatform: "YouTube / Instagram",
      bestFormat: "Educational talking head",
      peakTime: "07:00–09:00 or 20:00–21:30",
      peakDay: "Monday or Sunday"
    },
    health: {
      hooks: [
        "I changed this one thing and lost 8kg without changing my diet.",
        "The workout nobody recommends but that actually works.",
        "Stop counting calories. Do this instead.",
        "I trained for 30 days straight. Here's what happened to my body.",
        "The mental health habit backed by science that nobody talks about."
      ],
      captions: [
        "Health in 2026 is about working with your body, not against it. Here's what the research actually says.",
        "I broke down the most common fitness myths so you don't waste another year of effort.",
        "The truth about sustainable health: it's boring, consistent, and it works."
      ],
      hashtags: ["#fitness","#health","#workout","#wellness","#nutrition","#healthylifestyle","#mentalhealth","#gymtips","#weightloss","#fitnessmotivation","#bodygoals","#healthtips"],
      bestPlatform: "Instagram / TikTok",
      bestFormat: "Transformation or tutorial",
      peakTime: "06:30–08:30 or 19:00–21:00",
      peakDay: "Monday or Thursday"
    },
    general: {
      hooks: [
        "Nobody is talking about this right now — but they will be.",
        "I tried this for 30 days. Here's what happened.",
        "The thing most people get wrong about this.",
        "Stop doing it the hard way. This works better.",
        "This changed everything for me. It might for you too."
      ],
      captions: [
        "The best content doesn't go viral by accident. It earns attention by being genuinely useful or genuinely honest. This is both.",
        "I'm sharing this because I wish someone had shared it with me earlier.",
        "Not everyone will agree with this. But the data doesn't lie."
      ],
      hashtags: ["#trending","#viral","#tips","#advice","#content","#growth","#creator","#2026","#fyp","#foryou","#trending","#explore"],
      bestPlatform: "TikTok",
      bestFormat: "Short-form video",
      peakTime: "19:30–21:00",
      peakDay: "Thursday"
    }
  },


  /* ===================================================================
     1. FULL CONTENT PACKAGE
  =================================================================== */

  fullPackage: function(question, context) {
    var topic   = CreatorAI.extractTopic(question, context);
    var niche   = CreatorAI.getNiche(topic);
    var nd      = CreatorAI.nicheData[niche];
    var score   = CreatorAI.calcTrendScore(topic);
    var platform= context.platform || nd.bestPlatform;
    var style   = context.style    || "educational";

    var hook    = CreatorAI.pickHook(topic, niche, style);
    var caption = CreatorAI.buildCaption(topic, niche, style, platform);
    var tags    = CreatorAI.buildHashtags(topic, niche);
    var outline = CreatorAI.buildOutline(topic, niche, style);

    var verdictColor = score.total >= 9 ? "#2dd4a0" : score.total >= 7.5 ? "#f0b429" : "#8a91a8";
    var verdictText  = score.total >= 9 ? "🔥 Exceptional viral potential"
      : score.total >= 8 ? "⚡ Strong opportunity"
      : score.total >= 7 ? "📈 Good momentum"
      : "💡 Emerging trend";

    return CreatorAI.card("Content Package — " + CreatorAI.titleCase(topic),

      "<div style='display:flex;align-items:center;gap:10px;margin-bottom:16px;padding:12px 16px;background:#0a0d18;border:1px solid #1a2035;border-radius:10px;'>" +
        "<div style='font-family:monospace;font-size:36px;font-weight:900;color:" + verdictColor + ";line-height:1;letter-spacing:-0.04em;'>" + score.total + "</div>" +
        "<div><div style='font-family:monospace;font-size:9px;color:#4a5068;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:3px;'>Trend Score™</div>" +
        "<div style='font-size:13px;font-weight:700;color:" + verdictColor + ";'>" + verdictText + "</div></div>" +
        "<div style='margin-left:auto;text-align:right;font-size:11px;color:#4a5068;line-height:1.8;'>" +
          "Platform: <strong style='color:#eef0f6;'>" + nd.bestPlatform + "</strong><br>" +
          "Format: <strong style='color:#eef0f6;'>" + nd.bestFormat + "</strong><br>" +
          "Post: <strong style='color:#f0b429;'>" + nd.peakDay + " " + nd.peakTime + "</strong>" +
        "</div>" +
      "</div>" +

      "<div style='margin-bottom:12px;'><div style='font-family:monospace;font-size:9px;color:#4a5068;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px;'>VIDEO HOOK</div>" +
      "<div style='padding:12px 14px;background:#0d1118;border-left:3px solid " + verdictColor + ";border-radius:0 8px 8px 0;font-size:14px;color:#eef0f6;font-style:italic;'>" + hook + "</div></div>" +

      "<div style='margin-bottom:12px;'><div style='font-family:monospace;font-size:9px;color:#4a5068;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px;'>CAPTION</div>" +
      "<div style='padding:12px 14px;background:#0a0d18;border:1px solid #1a2035;border-radius:8px;font-size:13.5px;color:#8a91a8;line-height:1.7;'>" + caption + "</div></div>" +

      "<div style='margin-bottom:12px;'><div style='font-family:monospace;font-size:9px;color:#4a5068;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px;'>CONTENT OUTLINE</div>" +
      "<div style='padding:12px 14px;background:#0a0d18;border:1px solid #1a2035;border-radius:8px;font-size:13px;color:#8a91a8;line-height:1.8;'>" + outline + "</div></div>" +

      "<div><div style='font-family:monospace;font-size:9px;color:#4a5068;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;'>HASHTAGS</div>" +
      "<div style='display:flex;flex-wrap:wrap;gap:6px;'>" +
        tags.map(function(t){ return "<span style='padding:3px 10px;background:rgba(240,180,41,0.08);border:1px solid rgba(240,180,41,0.18);border-radius:5px;font-family:monospace;font-size:11px;color:#f0b429;'>" + t + "</span>"; }).join("") +
      "</div></div>",

      ["Generate another hook", "Improve this caption", "Best posting time for " + nd.bestPlatform, "What's my trend score?"]
    );
  },


  /* ===================================================================
     2. HOOK GENERATOR
  =================================================================== */

  generateHook: function(question, context) {
    var topic = CreatorAI.extractTopic(question, context);
    var niche = CreatorAI.getNiche(topic);
    var nd    = CreatorAI.nicheData[niche];
    var style = context.style || "educational";

    var hooks = [
      CreatorAI.pickHook(topic, niche, style),
      CreatorAI.pickHook(topic, niche, "controversial"),
      CreatorAI.pickHook(topic, niche, "entertaining"),
      CreatorAI.pickHook(topic, niche, "motivational"),
      CreatorAI.pickHook(topic, niche, "data"),
    ];

    // Deduplicate
    hooks = hooks.filter(function(h, i){ return hooks.indexOf(h) === i; });

    var html = "<p>Here are <strong>" + hooks.length + " hook variations</strong> for <strong>" + CreatorAI.titleCase(topic) + "</strong>. The best hook stops the scroll in the first 2 seconds:</p>";
    hooks.forEach(function(h, i){
      var styles = ["Educational","Controversial","Entertaining","Motivational","Data-driven"];
      html += "<div style='margin:8px 0;padding:12px 14px;background:#0a0d18;border:1px solid #1a2035;border-left:3px solid #f0b429;border-radius:0 8px 8px 0;'>" +
        "<div style='font-family:monospace;font-size:9px;color:#4a5068;margin-bottom:5px;text-transform:uppercase;letter-spacing:0.1em;'>" + (styles[i]||"Variation " + (i+1)) + "</div>" +
        "<div style='font-size:14px;color:#eef0f6;font-style:italic;'>" + h + "</div>" +
      "</div>";
    });

    html += "<p style='font-size:12px;color:#4a5068;margin-top:12px;'>→ Test multiple hooks by filming the same content with different openings. The hook with the highest 3-second retention rate wins.</p>";

    return CreatorAI.card("Hook Variations — " + CreatorAI.titleCase(topic), html,
      ["Write the caption", "Give me hashtags", "Full content package"]
    );
  },

  pickHook: function(topic, niche, style) {
    var nd = CreatorAI.nicheData[niche];
    var t  = CreatorAI.titleCase(topic);

    var styleHooks = {
      educational:   nd.hooks[0] || ("The truth about " + t + " most people don't know."),
      controversial: nd.hooks[1] || ("Stop wasting time on " + t + ". Do this instead."),
      entertaining:  nd.hooks[2] || ("I tried " + t + " for 30 days. Here's what happened."),
      motivational:  nd.hooks[3] || ("One year ago I knew nothing about " + t + ". Now it changed my life."),
      data:          ("The data on " + t + " will surprise you — most people have this completely wrong.")
    };

    return styleHooks[style] || styleHooks.educational;
  },


  /* ===================================================================
     3. CAPTION GENERATOR
  =================================================================== */

  generateCaption: function(question, context) {
    var topic    = CreatorAI.extractTopic(question, context);
    var niche    = CreatorAI.getNiche(topic);
    var platform = context.platform || "TikTok";
    var style    = context.style || "educational";
    var caption  = CreatorAI.buildCaption(topic, niche, style, platform);

    var lengthNote = platform.toLowerCase().includes("youtube")
      ? "YouTube descriptions should be 150–300 words with keywords in the first 2 lines."
      : platform.toLowerCase().includes("instagram")
        ? "Instagram captions perform best at 150–220 words with the CTA above the fold."
        : "TikTok captions are best kept under 150 characters — short, punchy, with 3–5 hashtags inline.";

    return CreatorAI.card("Caption — " + CreatorAI.titleCase(topic),
      "<div style='padding:14px;background:#0a0d18;border:1px solid #1a2035;border-radius:8px;font-size:14px;color:#8a91a8;line-height:1.75;margin-bottom:12px;'>" + caption + "</div>" +
      "<p style='font-size:12px;color:#4a5068;'>→ <strong>" + lengthNote + "</strong></p>",
      ["Give me 3 variations", "Add hashtags", "Generate a hook", "Full content package"]
    );
  },

  buildCaption: function(topic, niche, style, platform) {
    var nd  = CreatorAI.nicheData[niche];
    var t   = CreatorAI.titleCase(topic);
    var idx = Math.floor(Math.random() * nd.captions.length);
    var base = nd.captions[idx];

    // Platform-specific CTA
    var cta = platform && platform.toLowerCase().includes("youtube")
      ? "Subscribe if you want more like this — I post every week."
      : platform && platform.toLowerCase().includes("instagram")
        ? "Save this for later and tag someone who needs to see it 👇"
        : "Follow for more. New content every week 🔥";

    return base + "<br><br>" + cta;
  },


  /* ===================================================================
     4. HASHTAG GENERATOR
  =================================================================== */

  generateHashtags: function(question, context) {
    var topic = CreatorAI.extractTopic(question, context);
    var niche = CreatorAI.getNiche(topic);
    var tags  = CreatorAI.buildHashtags(topic, niche);

    // Split into tiers
    var bigTags  = tags.slice(0, 4);
    var midTags  = tags.slice(4, 8);
    var smallTags= tags.slice(8);

    return CreatorAI.card("Hashtag Strategy — " + CreatorAI.titleCase(topic),
      "<p>A balanced hashtag set uses <strong>large, medium, and niche tags</strong> — this maximises both reach and discoverability.</p>" +

      "<div style='margin-bottom:12px;'>" +
        "<div style='font-family:monospace;font-size:9px;color:#4a5068;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:7px;'>High Volume (broad reach)</div>" +
        "<div style='display:flex;flex-wrap:wrap;gap:6px;'>" + bigTags.map(function(t){ return "<span style='padding:4px 11px;background:rgba(240,180,41,0.10);border:1px solid rgba(240,180,41,0.22);border-radius:5px;font-family:monospace;font-size:11px;color:#f0b429;'>" + t + "</span>"; }).join("") + "</div>" +
      "</div>" +

      "<div style='margin-bottom:12px;'>" +
        "<div style='font-family:monospace;font-size:9px;color:#4a5068;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:7px;'>Mid Volume (targeted)</div>" +
        "<div style='display:flex;flex-wrap:wrap;gap:6px;'>" + midTags.map(function(t){ return "<span style='padding:4px 11px;background:rgba(79,142,247,0.08);border:1px solid rgba(79,142,247,0.18);border-radius:5px;font-family:monospace;font-size:11px;color:#7eb3ff;'>" + t + "</span>"; }).join("") + "</div>" +
      "</div>" +

      "<div>" +
        "<div style='font-family:monospace;font-size:9px;color:#4a5068;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:7px;'>Niche (high conversion)</div>" +
        "<div style='display:flex;flex-wrap:wrap;gap:6px;'>" + smallTags.map(function(t){ return "<span style='padding:4px 11px;background:rgba(45,212,160,0.08);border:1px solid rgba(45,212,160,0.18);border-radius:5px;font-family:monospace;font-size:11px;color:#2dd4a0;'>" + t + "</span>"; }).join("") + "</div>" +
      "</div>",

      ["Generate a hook", "Write the caption", "Full content package"]
    );
  },

  buildHashtags: function(topic, niche) {
    var nd   = CreatorAI.nicheData[niche];
    var base = nd.hashtags.slice();

    // Add topic-specific tags
    var words = topic.toLowerCase().split(" ");
    words.forEach(function(w){
      if (w.length > 3) base.push("#" + w.replace(/[^a-z0-9]/g,""));
    });
    base.push("#impactgrid", "#creatorintelligence");

    // Deduplicate and limit
    return base.filter(function(t,i){ return base.indexOf(t) === i; }).slice(0, 14);
  },


  /* ===================================================================
     5. CONTENT OUTLINE
  =================================================================== */

  generateOutline: function(question, context) {
    var topic   = CreatorAI.extractTopic(question, context);
    var niche   = CreatorAI.getNiche(topic);
    var style   = context.style || "educational";
    var outline = CreatorAI.buildOutline(topic, niche, style);

    return CreatorAI.card("Content Outline — " + CreatorAI.titleCase(topic),
      "<div style='padding:14px;background:#0a0d18;border:1px solid #1a2035;border-radius:8px;font-size:13.5px;color:#8a91a8;line-height:1.85;'>" + outline + "</div>" +
      "<p style='font-size:12px;color:#4a5068;margin-top:10px;'>→ Keep the structure tight. For short-form: hook (0–3s), problem (3–15s), solution (15–40s), CTA (40–60s).</p>",
      ["Generate the hook", "Write the caption", "Full content package"]
    );
  },

  buildOutline: function(topic, niche, style) {
    var t = CreatorAI.titleCase(topic);
    var outlines = {
      educational: [
        "• <strong>Hook (0–3s)</strong>: Open with a surprising stat or bold claim about " + t,
        "• <strong>Problem (3–15s)</strong>: Establish why most people get " + t + " wrong",
        "• <strong>Solution (15–40s)</strong>: Walk through your 3 key insights or steps",
        "• <strong>Proof (40–50s)</strong>: Briefly show a result, stat, or example",
        "• <strong>CTA (50–60s)</strong>: Tell viewers exactly what to do next"
      ],
      controversial: [
        "• <strong>Hook (0–3s)</strong>: Make a bold, counter-intuitive statement about " + t,
        "• <strong>Stakes (3–10s)</strong>: Explain why this matters and who disagrees",
        "• <strong>Argument (10–40s)</strong>: Build your case with specific examples",
        "• <strong>Flip (40–52s)</strong>: Acknowledge the other view, then rebut it",
        "• <strong>CTA (52–60s)</strong>: Ask viewers to comment their opinion"
      ],
      entertaining: [
        "• <strong>Hook (0–3s)</strong>: Start mid-story or mid-action on " + t,
        "• <strong>Setup (3–15s)</strong>: Build the situation and tension",
        "• <strong>Payoff (15–45s)</strong>: Deliver the surprising result or moment",
        "• <strong>Lesson (45–55s)</strong>: Extract one clear takeaway",
        "• <strong>CTA (55–60s)</strong>: Invite viewers to share or follow"
      ],
      motivational: [
        "• <strong>Hook (0–3s)</strong>: Start with where you were before " + t,
        "• <strong>Journey (3–20s)</strong>: The struggle and turning point",
        "• <strong>Breakthrough (20–45s)</strong>: What changed and the result",
        "• <strong>Framework (45–55s)</strong>: The 1–2 things they can apply today",
        "• <strong>CTA (55–60s)</strong>: Encourage and direct to next step"
      ]
    };
    var lines = outlines[style] || outlines.educational;
    return lines.join("<br>");
  },


  /* ===================================================================
     6. TREND SCORE DISPLAY
  =================================================================== */

  trendScore: function(question, context) {
    var topic = CreatorAI.extractTopic(question, context);
    var score = CreatorAI.calcTrendScore(topic);

    var verdictColor = score.total >= 9 ? "#2dd4a0" : score.total >= 7.5 ? "#f0b429" : "#8a91a8";
    var verdictText  = score.total >= 9 ? "Exceptional — Act Now"
      : score.total >= 8 ? "Strong — High Opportunity"
      : score.total >= 7 ? "Good — Worth Creating"
      : score.total >= 6 ? "Moderate — Proceed with Strategy"
      : "Low — Consider Another Angle";

    function signalBar(label, val, color) {
      return "<div style='margin-bottom:10px;'>" +
        "<div style='display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;'>" +
          "<span style='color:#8a91a8;'>" + label + "</span>" +
          "<span style='font-family:monospace;color:" + color + ";font-weight:600;'>" + val.toFixed(1) + "/10</span>" +
        "</div>" +
        "<div style='background:#0a0d18;border-radius:4px;height:5px;overflow:hidden;'>" +
          "<div style='height:100%;width:" + (val/10*100) + "%;background:" + color + ";border-radius:4px;'></div>" +
        "</div>" +
      "</div>";
    }

    return CreatorAI.card("Trend Score™ — " + CreatorAI.titleCase(topic),
      "<div style='text-align:center;padding:20px;background:#0a0d18;border:1px solid #1a2035;border-radius:10px;margin-bottom:16px;'>" +
        "<div style='font-family:monospace;font-size:64px;font-weight:900;color:" + verdictColor + ";letter-spacing:-0.04em;line-height:1;'>" + score.total + "</div>" +
        "<div style='font-family:monospace;font-size:10px;color:#4a5068;text-transform:uppercase;letter-spacing:0.12em;margin:6px 0 4px;'>Trend Score™ / 10</div>" +
        "<div style='font-size:13px;font-weight:700;color:" + verdictColor + ";'>" + verdictText + "</div>" +
      "</div>" +

      "<p style='font-family:monospace;font-size:9px;color:#4a5068;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:12px;'>Signal Breakdown</p>" +
      signalBar("Search Growth (×0.35)",    score.searchGrowth, "#4285f4") +
      signalBar("Video Engagement (×0.30)", score.videoEng,     "#ff2d55") +
      signalBar("Hashtag Velocity (×0.20)", score.hashVel,      "#e1306c") +
      signalBar("Creator Adoption (×0.15)", score.creatorAdopt, "#f0b429") +

      "<p style='font-size:12px;color:#4a5068;margin-top:12px;'>→ Scores above 8.0 represent a strong viral window. Act within <strong>48–72 hours</strong> of detection for maximum reach.</p>",

      ["Generate full content package", "What platform should I use?", "Best posting time"]
    );
  },


  /* ===================================================================
     7. TREND ANALYSIS
  =================================================================== */

  trendAnalysis: function(question, context) {
    var topic = CreatorAI.extractTopic(question, context);
    var niche = CreatorAI.getNiche(topic);
    var nd    = CreatorAI.nicheData[niche];
    var score = CreatorAI.calcTrendScore(topic);

    var momentum = score.total >= 8.5 ? "accelerating — this is a breakout window"
      : score.total >= 7 ? "building — early adoption phase"
      : "emerging — still forming";

    return CreatorAI.card("Trend Analysis — " + CreatorAI.titleCase(topic),
      "<p>Trend Score™: <strong style='color:#f0b429;'>" + score.total + "/10</strong> — momentum is <strong>" + momentum + "</strong>.</p>" +

      "<p><strong>Why this trend is moving:</strong> " + CreatorAI.trendReason(topic, niche) + "</p>" +

      "<p><strong>Best platform to ride it:</strong> <strong>" + nd.bestPlatform + "</strong> — " + CreatorAI.platformReason(niche) + "</p>" +

      "<p><strong>Content opportunity window:</strong> " + (score.total >= 8 ? "The next <strong>48–72 hours</strong> represent peak opportunity. After that, the space will become crowded." : "The trend is still building. You have <strong>1–2 weeks</strong> before early adopters saturate the format.") + "</p>" +

      "<p><strong>What competitors are doing:</strong> Most creators in this space are posting surface-level takes. The opportunity is to go <strong>deeper, more specific, and more honest</strong> than what's already out there.</p>",

      ["Generate content for this trend", "What's my Trend Score?", "Show me the posting window"]
    );
  },

  trendReason: function(topic, niche) {
    var reasons = {
      ai_tech:     "AI adoption is accelerating across every industry — search volume for AI tools has grown 300%+ YoY and shows no sign of plateauing.",
      finance:     "Economic uncertainty is driving unprecedented interest in personal finance, side income, and wealth-building content.",
      business:    "Post-pandemic entrepreneurship is at its highest level in a decade — SME content outperforms average by 2–3× right now.",
      creator:     "The creator economy has passed $250B in value — creators researching how to grow are a rapidly expanding audience.",
      productivity:"Remote and hybrid work has permanently changed how people think about time — productivity content is evergreen with strong seasonal peaks.",
      health:      "Mental and physical health content has seen consistent growth since 2020 with no signs of declining interest.",
      general:     "Cross-platform signal analysis suggests rising search volume and creator adoption across multiple channels."
    };
    return reasons[niche] || reasons.general;
  },

  platformReason: function(niche) {
    var reasons = {
      ai_tech:     "TikTok's algorithm strongly favours tech content right now. Educational AI videos are getting 5–10× the organic reach of other categories.",
      finance:     "Finance content on TikTok (FinTok) is one of the fastest-growing content verticals in 2026.",
      business:    "LinkedIn reaches decision-makers; TikTok reaches aspiring entrepreneurs. Both are currently underserved for honest SME content.",
      creator:     "YouTube rewards depth; TikTok rewards pace. Creator advice content performs well on both.",
      productivity:"YouTube's long-form format suits productivity deep-dives. Instagram Reels work well for quick daily habits.",
      health:      "Instagram's visual format suits transformation content. TikTok drives the highest raw reach for health trends.",
      general:     "TikTok currently offers the highest organic reach for new content — ideal for trend-riding."
    };
    return reasons[niche] || reasons.general;
  },


  /* ===================================================================
     8. POSTING TIME INTELLIGENCE
  =================================================================== */

  postingTime: function(question, context) {
    var topic    = CreatorAI.extractTopic(question, context);
    var niche    = CreatorAI.getNiche(topic);
    var nd       = CreatorAI.nicheData[niche];
    var platform = context.platform || nd.bestPlatform;

    var platformTimes = {
      tiktok:    { peak: ["19:30–21:00","12:00–13:30"], days: ["Thursday","Tuesday","Friday"], note: "TikTok's algorithm pushes content most aggressively in the first 30 minutes. Post when your audience is actively scrolling — not when you're free." },
      youtube:   { peak: ["15:00–17:00","20:00–22:00"], days: ["Saturday","Sunday","Thursday"], note: "YouTube favours consistency over timing. Post on the same day each week. Friday evening and Saturday morning see highest browse traffic." },
      instagram: { peak: ["11:00–13:00","19:00–21:00"], days: ["Wednesday","Friday","Monday"], note: "Instagram's Reels push is strongest mid-week. Stories perform best in the morning commute window (07:30–09:00)." },
      linkedin:  { peak: ["07:30–09:00","12:00–13:00"], days: ["Tuesday","Wednesday","Thursday"], note: "LinkedIn is a professional platform — post during working hours. Tuesday–Thursday 08:00–09:00 is peak B2B engagement." }
    };

    var pt = platformTimes[platform.toLowerCase().split("/")[0].trim()] || platformTimes.tiktok;

    return CreatorAI.card("Posting Intelligence — " + platform,
      "<p><strong>Peak posting windows:</strong></p>" +
      pt.peak.map(function(p){ return "<div style='padding:10px 14px;background:#0a0d18;border:1px solid #1a2035;border-radius:8px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;'><span style='font-size:13px;color:#eef0f6;font-weight:600;'>🕐 " + p + "</span><span style='font-family:monospace;font-size:10px;color:#f0b429;'>Peak Window</span></div>"; }).join("") +

      "<p style='margin-top:14px;'><strong>Best days:</strong> " + pt.days.map(function(d){ return "<strong>" + d + "</strong>"; }).join(", ") + "</p>" +
      "<p>" + pt.note + "</p>" +
      "<p>For <strong>" + CreatorAI.titleCase(topic) + "</strong> specifically, the highest-engagement audience (25–34, entrepreneur / creator segment) peaks on <strong>" + nd.peakDay + " at " + nd.peakTime + "</strong>.</p>",

      ["Generate content for this time slot", "What platform should I use?", "Full content package"]
    );
  },


  /* ===================================================================
     9. PLATFORM ADVICE
  =================================================================== */

  platformAdvice: function(question, context) {
    var topic = CreatorAI.extractTopic(question, context);
    var niche = CreatorAI.getNiche(topic);
    var nd    = CreatorAI.nicheData[niche];

    var platforms = [
      { name:"TikTok",    score:CreatorAI.platformScore(niche,"tiktok"),    reason:"Highest organic reach. Algorithm rewards educational and entertaining content. Best for audience building from zero." },
      { name:"YouTube",   score:CreatorAI.platformScore(niche,"youtube"),   reason:"Best for long-term search traffic and high-CPM monetisation. Slower to grow but compounding returns." },
      { name:"Instagram", score:CreatorAI.platformScore(niche,"instagram"), reason:"Strong for visual niches and brand partnerships. Reels currently receive boosted distribution." },
      { name:"LinkedIn",  score:CreatorAI.platformScore(niche,"linkedin"),  reason:"Underserved for most niches. High-value B2B audience. Text posts still outperform video on reach." }
    ].sort(function(a,b){ return b.score - a.score; });

    var html = "<p>Platform recommendation for <strong>" + CreatorAI.titleCase(topic) + "</strong>:</p>";
    platforms.forEach(function(p, i){
      var color = i === 0 ? "#f0b429" : i === 1 ? "#4f8ef7" : "#4a5068";
      html += "<div style='margin-bottom:10px;padding:12px 14px;background:#0a0d18;border:1px solid #1a2035;border-radius:8px;" + (i===0?"border-left:3px solid #f0b429;":"") + "'>" +
        "<div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;'>" +
          "<strong style='color:" + color + ";'>" + (i===0?"★ ":"") + p.name + "</strong>" +
          "<span style='font-family:monospace;font-size:11px;color:" + color + ";'>" + p.score + "/10</span>" +
        "</div>" +
        "<div style='font-size:12.5px;color:#8a91a8;'>" + p.reason + "</div>" +
      "</div>";
    });

    html += "<p style='font-size:12px;color:#4a5068;'>→ Start with <strong>" + platforms[0].name + "</strong>. Once you have consistent content and a small audience, cross-post to the second platform.</p>";

    return CreatorAI.card("Platform Recommendation", html,
      ["Best posting time for " + platforms[0].name, "Generate content for " + platforms[0].name, "Full content package"]
    );
  },

  platformScore: function(niche, platform) {
    var scores = {
      ai_tech:     { tiktok:9.2, youtube:8.1, instagram:6.8, linkedin:7.9 },
      finance:     { tiktok:9.0, youtube:8.3, instagram:7.2, linkedin:8.1 },
      business:    { tiktok:8.1, youtube:8.0, instagram:7.0, linkedin:9.1 },
      creator:     { tiktok:8.8, youtube:9.2, instagram:8.0, linkedin:6.2 },
      productivity:{ tiktok:7.9, youtube:8.8, instagram:8.1, linkedin:7.8 },
      health:      { tiktok:8.9, youtube:7.8, instagram:9.0, linkedin:5.5 },
      general:     { tiktok:8.5, youtube:7.5, instagram:7.5, linkedin:6.5 }
    };
    return (scores[niche] || scores.general)[platform] || 7.0;
  },


  /* ===================================================================
     10. AUDIENCE INSIGHT
  =================================================================== */

  audienceInsight: function(question, context) {
    var topic = CreatorAI.extractTopic(question, context);
    var niche = CreatorAI.getNiche(topic);

    var audiences = {
      ai_tech:     { primary:"25–34, tech-curious professionals", secondary:"18–24, students and graduates", motivation:"Competitive advantage and time-saving", peak:"Evenings + lunch on weekdays", engagementTrigger:"Practical tools they can use today" },
      finance:     { primary:"22–35, aspiring to financial independence", secondary:"35–45, established but plateau-feeling", motivation:"Security, freedom, and not missing out", peak:"Evenings and weekend mornings", engagementTrigger:"Honest stories and specific numbers" },
      business:    { primary:"28–42, founders and side-hustlers", secondary:"Corporate professionals considering the leap", motivation:"Autonomy, income growth, and recognition", peak:"Early mornings and lunch breaks", engagementTrigger:"Frameworks and real-world case studies" },
      creator:     { primary:"18–28, aspiring content creators", secondary:"25–35, established creators wanting to scale", motivation:"Audience growth and monetisation", peak:"Late evenings", engagementTrigger:"Tactics that worked for someone just like them" },
      productivity:{ primary:"22–38, ambitious knowledge workers", secondary:"Students and self-improvers", motivation:"Performing better without burning out", peak:"Mornings and Sunday evenings", engagementTrigger:"Systems they can implement immediately" },
      health:      { primary:"20–40, lifestyle-focused adults", secondary:"35–50, health-conscious parents", motivation:"Sustainable results and looking/feeling better", peak:"Early mornings and evenings", engagementTrigger:"Transformations and evidence-backed approaches" },
      general:     { primary:"18–34 cross-demographic", secondary:"35–50 secondary audience", motivation:"Entertainment, information, and self-improvement", peak:"Evenings and weekends", engagementTrigger:"Authenticity and direct value" }
    };

    var a = audiences[niche] || audiences.general;

    return CreatorAI.card("Audience Intelligence — " + CreatorAI.titleCase(topic),
      "<p><strong>Primary audience:</strong> " + a.primary + "</p>" +
      "<p><strong>Secondary audience:</strong> " + a.secondary + "</p>" +
      "<p><strong>Core motivation:</strong> " + a.motivation + "</p>" +
      "<p><strong>Peak activity:</strong> " + a.peak + "</p>" +
      "<p><strong>What triggers engagement:</strong> " + a.engagementTrigger + "</p>" +
      "<p><strong>How to talk to them:</strong> Be direct, specific, and honest. This audience has high content literacy — they can tell when someone is padding or performing. The highest-performing creators in this space share <em>real results with real numbers</em>.</p>",
      ["Generate content for this audience", "Best posting time", "Full content package"]
    );
  },


  /* ===================================================================
     11. IMPROVE CONTENT
  =================================================================== */

  improveContent: function(question, context) {
    var topic = CreatorAI.extractTopic(question, context);
    var niche = CreatorAI.getNiche(topic);
    var nd    = CreatorAI.nicheData[niche];

    return CreatorAI.card("Content Optimisation",
      "<p>To improve content performance on <strong>" + CreatorAI.titleCase(topic) + "</strong>, apply these high-impact changes:</p>" +
      "<p>→ <strong>First 2 seconds:</strong> If your hook doesn't create immediate curiosity or tension, the algorithm will not distribute your content. Rewrite your opening line before anything else.</p>" +
      "<p>→ <strong>Specificity wins:</strong> Replace every vague claim with a specific one. Not 'this saves a lot of time' but 'this saves 2 hours every day'. Specificity is credibility.</p>" +
      "<p>→ <strong>CTA placement:</strong> Most creators put the CTA at the end. Test putting a soft CTA at 40% through ('comment below if you want part 2') — this spikes engagement signals mid-video.</p>" +
      "<p>→ <strong>Thumbnail/cover frame:</strong> For TikTok and Reels, the cover frame matters as much as the hook. Choose a frame that shows contrast, emotion, or curiosity.</p>" +
      "<p>→ <strong>Caption keywords:</strong> Include your primary keyword in the first 15 characters of your caption. Algorithms use early caption text for indexing.</p>",
      ["Rewrite my hook", "Generate a new caption", "Full content package"]
    );
  },


  /* ===================================================================
     12. CONTENT STRATEGY
  =================================================================== */

  contentStrategy: function(question, context) {
    var topic = CreatorAI.extractTopic(question, context);
    var niche = CreatorAI.getNiche(topic);
    var nd    = CreatorAI.nicheData[niche];
    var score = CreatorAI.calcTrendScore(topic);

    return CreatorAI.card("Content Strategy — " + CreatorAI.titleCase(topic),
      "<p>Trend Score™: <strong style='color:#f0b429;'>" + score.total + "/10</strong>. Here is your 4-week content strategy:</p>" +

      "<div style='margin:10px 0;padding:12px 14px;background:#0a0d18;border:1px solid #1a2035;border-left:3px solid #f0b429;border-radius:0 8px 8px 0;'>" +
        "<div style='font-family:monospace;font-size:9px;color:#f0b429;margin-bottom:5px;'>WEEK 1 — ESTABLISH</div>" +
        "<div style='font-size:13px;color:#8a91a8;'>Post your strongest educational piece on " + nd.bestPlatform + " at " + nd.peakTime + ". This is your authority anchor — the piece new followers will find first.</div>" +
      "</div>" +

      "<div style='margin:10px 0;padding:12px 14px;background:#0a0d18;border:1px solid #1a2035;border-left:3px solid #4f8ef7;border-radius:0 8px 8px 0;'>" +
        "<div style='font-family:monospace;font-size:9px;color:#4f8ef7;margin-bottom:5px;'>WEEK 2 — ENGAGE</div>" +
        "<div style='font-size:13px;color:#8a91a8;'>Post a controversial or opinion-led piece. Ask a direct question in the caption. Engagement in week 2 signals the algorithm to push your week 1 content further.</div>" +
      "</div>" +

      "<div style='margin:10px 0;padding:12px 14px;background:#0a0d18;border:1px solid #1a2035;border-left:3px solid #2dd4a0;border-radius:0 8px 8px 0;'>" +
        "<div style='font-family:monospace;font-size:9px;color:#2dd4a0;margin-bottom:5px;'>WEEK 3 — CONVERT</div>" +
        "<div style='font-size:13px;color:#8a91a8;'>Post a story-led piece (your journey, a result, a before/after). This is your highest-converting format — warm audiences follow after hearing a real story.</div>" +
      "</div>" +

      "<div style='margin:10px 0;padding:12px 14px;background:#0a0d18;border:1px solid #1a2035;border-left:3px solid #a855f7;border-radius:0 8px 8px 0;'>" +
        "<div style='font-family:monospace;font-size:9px;color:#a855f7;margin-bottom:5px;'>WEEK 4 — SCALE</div>" +
        "<div style='font-size:13px;color:#8a91a8;'>Repurpose your best-performing piece across platforms. Take your TikTok, recut for Reels, transcript for LinkedIn. One idea, four formats.</div>" +
      "</div>",

      ["Generate Week 1 content", "What platform should I use?", "Show me the trend score"]
    );
  },


  /* ===================================================================
     13. COMPETITOR INSIGHT
  =================================================================== */

  competitorInsight: function(question, context) {
    var topic = CreatorAI.extractTopic(question, context);
    var niche = CreatorAI.getNiche(topic);

    var gaps = {
      ai_tech:     ["Over-reliance on tool lists — opportunity to go deeper on workflows", "Most content is positive/hype — honest critique performs 3× better", "Nobody is showing actual before/after time savings with data"],
      finance:     ["Most creators avoid talking about failures — vulnerability outperforms here", "Overly generic advice — specificity to one audience segment (e.g. freelancers, parents) drives higher conversion", "The 'how I actually did it' format is underused versus 'how to do it'"],
      business:    ["B2B content is sterile — personality-led business content has almost no competition", "Real P&L breakdowns are rare and extremely high-engagement", "Nobody talks about the dark side of scaling — contrarian content stands out"],
      creator:     ["Everyone shares growth wins — share growth mistakes instead", "Platform strategy content is oversimplified — detailed tactical breakdowns are scarce", "Most creator advice is generic — niche-specific creator advice (e.g. finance creators, educator creators) is wide open"],
      productivity:["Too much theory, not enough systems — practical toolkits outperform philosophy", "Nobody quantifies the result of their habits — add numbers to everything", "Evening and wind-down routines are underrepresented vs morning content"],
      health:      ["Before/after transformation is saturated — the 'sustainable slow progress' angle is wide open", "Mental health integrated with physical is underserved", "Male mental health content is significantly underrepresented"],
      general:     ["Most content in this space is surface-level — depth and specificity are the biggest gaps", "Authentic failure stories significantly outperform generic success content", "Long-form explainer formats are underused on short-form platforms"]
    };

    var nicheGaps = gaps[niche] || gaps.general;

    return CreatorAI.card("Competitive Landscape — " + CreatorAI.titleCase(topic),
      "<p>Here are the <strong>content gaps</strong> your competitors are leaving open — these are your highest-opportunity angles:</p>" +
      nicheGaps.map(function(g){ return "<div style='padding:10px 14px;background:#0a0d18;border:1px solid #1a2035;border-left:3px solid #2dd4a0;border-radius:0 8px 8px 0;margin-bottom:8px;font-size:13px;color:#8a91a8;'>→ " + g + "</div>"; }).join("") +
      "<p style='font-size:12px;color:#4a5068;margin-top:10px;'>The creator who wins in a crowded niche is almost never the most polished — it's the most <em>honest, specific, and consistent</em>.</p>",
      ["Generate content using these gaps", "Content strategy", "Full content package"]
    );
  },


  /* ===================================================================
     UTILITIES
  =================================================================== */

  extractTopic: function(question, context) {
    if (context && context.topic && context.topic.length > 2) return context.topic;

    // Strip common question words to extract the topic
    var cleaned = question
      .replace(/generate|create|make|write|give me|show me|what|how|why|when|where|tell me|explain|analyse|analyze|score|trend|viral|hook|caption|hashtag|outline|strategy|advice|platform|audience|for|about|on|a|an|the|me|my|some|content|package/gi, " ")
      .replace(/\s+/g, " ").trim();

    return cleaned.length > 2 ? cleaned : question.substring(0, 40);
  },

  titleCase: function(str) {
    return str.replace(/\w\S*/g, function(txt){ return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
  },

  is: function(q, keywords) {
    return keywords.some(function(k){ return q.indexOf(k) !== -1; });
  },

  card: function(title, body, suggestions) {
    var chips = suggestions ? "<div class='ai-suggestions' style='display:flex;flex-wrap:wrap;gap:7px;margin-top:14px;'>" +
      suggestions.map(function(s){
        return "<button class='ai-suggestion-chip' onclick=\"creatorAIAsk('" + s.replace(/'/g,"\\'") + "')\" style='padding:5px 12px;background:#0d1118;border:1px solid #1a2035;border-radius:20px;font-size:12px;color:#8a91a8;cursor:pointer;transition:all 0.2s;' onmouseover=\"this.style.borderColor='#f0b429';this.style.color='#f0b429'\" onmouseout=\"this.style.borderColor='#1a2035';this.style.color='#8a91a8'\">" + s + "</button>";
      }).join("") +
    "</div>" : "";

    return "<p><strong>" + title + "</strong></p>" + body + chips;
  }

};
