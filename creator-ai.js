/* ================================================================
   creator-ai.js — Dijo Content Creation Intelligence Engine
   ImpactGrid Creator Intelligence · v5.0
   ================================================================
   v5.0 adds:
   — generateCarousel() — calls Render/Groq backend directly
   — Carousel-specific prompt building
   — Backend URL constant
   ================================================================ */

const CreatorAI = (function () {

  /* ── BACKEND ─────────────────────────────────────────────────── */
  const BACKEND_URL = 'https://impactgrid-dijo.onrender.com';

  /* ── NICHE DATA ENGINE ──────────────────────────────────────── */
  const nicheData = {

    health: {
      label: 'Health & Wellness',
      peakDay: 'Monday',
      peakTime: '06:30–08:00',
      bestFormat: 'Transformation B-roll + voiceover',
      bestPlatform: 'Instagram Reels / TikTok',
      avgEngRate: '9.2%',
      primaryDemo: '20–38',
      hooks: [
        'I lost [X] lbs without cutting carbs — here\'s what actually worked.',
        'Stop wasting money on supplements until you know this.',
        'The fitness advice you\'re following is 10 years out of date.',
        'I trained like an athlete for 30 days. The results surprised me.',
        'Your "healthy" breakfast is probably why you\'re exhausted by noon.',
        'The workout that takes 18 minutes and outperforms a 60-minute gym session.',
        'Doctors don\'t talk about this because it\'s free.',
      ],
      captions: [
        'Short, punchy, 3 lines max. End with a polarising question to force comments.',
        'Lead with a stat or number. "93% of people doing X are making this mistake."',
        'Personal story format — first person, real timeline, specific result.',
      ],
      hashtags: [
        '#WellnessCreator', '#FitnessContent', '#HealthTips2026',
        '#FitnessTok', '#WellnessTok', '#NutritionTips',
        '#BodyTransformation', '#FitnessJourney', '#HealthyHabits',
        '#WorkoutMotivation', '#MindBodyFit', '#CreatorHealth',
      ],
      contentPillars: ['Education', 'Transformation', 'Myth-busting', 'Day-in-life', 'Product reviews'],
      audienceMotivation: 'Sustainable results without restriction or burnout',
      conversionNote: 'High-intent buyers. Supplement, app, and equipment integration converts at 3–5× platform average.',
      repurposeFlow: 'TikTok → Instagram Reels → YouTube Shorts → Pinterest static → email newsletter tip',
    },

    finance: {
      label: 'Personal Finance',
      peakDay: 'Sunday',
      peakTime: '18:00–20:30',
      bestFormat: 'Talking head with text overlay / screen recording',
      bestPlatform: 'TikTok / YouTube',
      avgEngRate: '6.8%',
      primaryDemo: '22–35',
      hooks: [
        'I turned £500 into £12,000 in 18 months — no luck involved.',
        'The savings account your bank doesn\'t want you to find.',
        'You\'re being taxed on money you don\'t have to pay tax on.',
        'Here\'s what a financial adviser actually does with their own money.',
        'The 4 money rules I wish someone told me at 22.',
        'Most people will never hit £100K. Here\'s the one habit separating those who do.',
        'Broke at 25 → debt-free at 28 → investing by 30. The exact system.',
      ],
      captions: [
        'Lead with a specific number. Vague finance content gets skipped.',
        'Structure: problem → mistake → solution. Keep under 150 words.',
        'Call to action should be "save this" not "follow me" — saves signal the algorithm.',
      ],
      hashtags: [
        '#MoneyTok', '#FinanceTok', '#PersonalFinance',
        '#FinancialFreedom', '#MoneyTips2026', '#InvestingTips',
        '#WealthBuilding', '#FinanceCreator', '#SideHustle',
        '#MoneyMindset', '#UKFinance', '#FinancialLiteracy',
      ],
      contentPillars: ['Money mistakes', 'Investment basics', 'Tax tips', 'Savings systems', 'Income streams'],
      audienceMotivation: 'Financial independence, security, and freedom from paycheck-to-paycheck living',
      conversionNote: 'Decision-makers and high-intent audience. Fintech, investment platform, and course integration converts extremely well.',
      repurposeFlow: 'TikTok → YouTube long-form breakdown → Twitter/X thread → LinkedIn post → newsletter',
    },

    business: {
      label: 'Business & Entrepreneurship',
      peakDay: 'Tuesday',
      peakTime: '07:00–09:00',
      bestFormat: 'Educational talking head / carousel',
      bestPlatform: 'LinkedIn / YouTube',
      avgEngRate: '5.9%',
      primaryDemo: '28–42',
      hooks: [
        'I built a £1M business with no investors. Here\'s the boring truth.',
        'The reason 90% of startups fail has nothing to do with their product.',
        'I fired my best employee. It was the best decision I ever made.',
        'Stop calling it a "side hustle." That mindset is why it stays small.',
        'The meeting that changed how I run every business I own.',
        '3 contracts I\'d never sign again — and what to demand instead.',
        'Our revenue dropped 40% in one month. Here\'s exactly how we recovered.',
      ],
      captions: [
        'Professional but direct. No jargon. Real operators don\'t talk in buzzwords.',
        'Lead with a result or decision. "I turned down £50K and it was right call."',
        'LinkedIn: longer format works. Three short paragraphs, end with a question.',
      ],
      hashtags: [
        '#BusinessCreator', '#EntrepreneurLife', '#StartupTok',
        '#BusinessTips2026', '#FounderMindset', '#SmallBusiness',
        '#BusinessGrowth', '#Entrepreneur', '#BusinessStrategy',
        '#UKBusiness', '#CreatorEconomy', '#ContentBusiness',
      ],
      contentPillars: ['Founder stories', 'Systems & processes', 'Leadership', 'Revenue growth', 'Business mistakes'],
      audienceMotivation: 'Autonomy, income growth, status, and recognition as a serious operator',
      conversionNote: 'B2B software, coaching, and consulting integration works well. Audience is in buying position.',
      repurposeFlow: 'LinkedIn post → TikTok clip → YouTube Shorts → Twitter/X thread → podcast episode',
    },

    ai_tech: {
      label: 'AI & Technology',
      peakDay: 'Wednesday',
      peakTime: '12:00–14:00',
      bestFormat: 'Screen recording + explainer voiceover',
      bestPlatform: 'YouTube / TikTok',
      avgEngRate: '7.2%',
      primaryDemo: '25–34',
      hooks: [
        'I automated 6 hours of work with one AI prompt. Here it is.',
        'The AI tools you\'re using are already obsolete. Here\'s what\'s next.',
        'I replaced my £500/month VA with a £20 AI workflow.',
        'GPT-4 couldn\'t do this. This model can. The difference matters.',
        'Stop using AI like a search engine. Here\'s how to actually leverage it.',
        'I tested 12 AI tools this month. Only 3 are worth your time.',
        'The AI prompt that 10× my output in one afternoon.',
      ],
      captions: [
        'Technical credibility first. Show you\'ve actually used the tool, not just read about it.',
        'Specific before general. "This prompt does X in Y seconds" beats "AI is amazing."',
        'Save-bait: "Save this before the algorithm buries it." Works extremely well in this niche.',
      ],
      hashtags: [
        '#AICreator', '#ArtificialIntelligence', '#AITok',
        '#TechTok', '#AITools2026', '#GenerativeAI',
        '#AIProductivity', '#ChatGPT', '#TechCreator',
        '#MachineLearning', '#AIWorkflow', '#FutureOfWork',
      ],
      contentPillars: ['Tool reviews', 'Prompt engineering', 'Workflow automation', 'AI news & takes', 'Tutorials'],
      audienceMotivation: 'Competitive edge, time savings, and staying ahead of the curve',
      conversionNote: 'High-intent, tool-curious audience. SaaS and AI platform integration sees excellent CTR.',
      repurposeFlow: 'YouTube tutorial → TikTok key insight clip → Twitter/X thread → newsletter deep dive → LinkedIn post',
    },

    productivity: {
      label: 'Productivity & Systems',
      peakDay: 'Thursday',
      peakTime: '06:00–08:30',
      bestFormat: 'Talking head with B-roll / screen recording',
      bestPlatform: 'YouTube / TikTok',
      avgEngRate: '6.4%',
      primaryDemo: '22–38',
      hooks: [
        'I deleted my to-do list and got more done. Here\'s the science.',
        'The morning routine that wastes your first 2 hours — without you knowing.',
        'How I do a 60-hour week of work in 38 hours. Documented.',
        'Stop multitasking. The data says you\'re working at 40% capacity.',
        'The note-taking method that actually makes you smarter over time.',
        'I track every minute of my day. Here\'s what I learned about myself.',
        'The one Notion template that runs my entire life and business.',
      ],
      captions: [
        'Actionable and specific. "Do this" beats "you should consider."',
        'Personal experiment format — "I tried X for Y days. Here\'s what happened."',
        'End with a saves CTA: "Save this for when you have 10 minutes to actually implement it."',
      ],
      hashtags: [
        '#ProductivityTok', '#SystemsThinking', '#DeepWork',
        '#ProductivityHacks2026', '#NotionTips', '#TimeManagement',
        '#WorkSmart', '#ProductivityCreator', '#DigitalOrganisation',
        '#FocusMode', '#SecondBrain', '#BuildingInPublic',
      ],
      contentPillars: ['Systems & tools', 'Time audits', 'Focus methods', 'Template walkthroughs', 'Daily routines'],
      audienceMotivation: 'Performing at a higher level without burnout or overwhelm',
      conversionNote: 'Audience implements recommendations immediately. App, planner, and course integration converts well.',
      repurposeFlow: 'YouTube full system breakdown → TikTok single tip → newsletter → Notion template download → Twitter thread',
    },

    creator: {
      label: 'Creator Economy',
      peakDay: 'Friday',
      peakTime: '17:00–20:00',
      bestFormat: 'Behind-the-scenes / tutorial',
      bestPlatform: 'TikTok / YouTube',
      avgEngRate: '8.1%',
      primaryDemo: '18–28',
      hooks: [
        'I made £0 for 8 months. Month 9 changed everything — here\'s what shifted.',
        'The only content strategy that actually compounds over time.',
        'Stop chasing trends. This is why your channel isn\'t growing.',
        'I posted every day for 90 days. Here\'s the honest data.',
        'The brand deal I turned down — and why it was the right call.',
        'My first £10,000 month as a creator. The exact breakdown.',
        'Nobody tells new creators this. I\'m telling you now.',
      ],
      captions: [
        'Be honest about the numbers. Specific beats vague every time in this niche.',
        'Community tone. Talk to them as a peer, not a guru.',
        'Transparency builds trust. "Here\'s what actually happened" outperforms "here\'s how to succeed."',
      ],
      hashtags: [
        '#CreatorTok', '#ContentCreator', '#CreatorEconomy',
        '#BuildingInPublic', '#ContentStrategy', '#CreatorTips2026',
        '#YouTubeCreator', '#TikTokCreator', '#GrowthTips',
        '#CreatorLife', '#ContentCreation', '#MonetiseContent',
      ],
      contentPillars: ['Income transparency', 'Growth systems', 'Platform strategy', 'Brand deals', 'Creator tools'],
      audienceMotivation: 'Audience growth, monetisation, and making a full-time living from content',
      conversionNote: 'Direct audience of aspiring and active creators. Creator platform, tool, and course integration converts well.',
      repurposeFlow: 'TikTok behind-the-scenes → YouTube full breakdown → Twitter/X thread → newsletter → Instagram carousel',
    },

    photography: {
      label: 'Photography & Visual',
      peakDay: 'Saturday',
      peakTime: '10:00–13:00',
      bestFormat: 'Before/after visual + process B-roll',
      bestPlatform: 'Instagram / YouTube',
      avgEngRate: '7.8%',
      primaryDemo: '24–40',
      hooks: [
        'I took 200 photos in one day and kept 3. Here\'s why that\'s the right ratio.',
        'The editing preset that saved my entire colour grading workflow.',
        'Stop buying camera gear. You need this skill first.',
        'I shot a £5,000 campaign on my phone. Client was thrilled.',
        'The composition rule that makes amateur photos look professional instantly.',
        'My full editing workflow in 4 minutes — start to final image.',
        'Photographers don\'t talk about this part of the job. They should.',
      ],
      captions: [
        'Visual-first. The caption should add context the image doesn\'t give.',
        'Behind-the-scene insights — gear, settings, location, process.',
        'Saving prompt: "Save this next time you\'re stuck on a shoot."',
      ],
      hashtags: [
        '#PhotographyTips', '#PhotographyTok', '#ContentPhotographer',
        '#PhotographyCreator', '#EditingTips', '#VisualContent',
        '#PhotoStrategy', '#BrandPhotography', '#CreatorPhotography',
        '#LightingTips', '#CompositionTips', '#PhotographyBusiness',
      ],
      contentPillars: ['Technique tutorials', 'Gear & equipment', 'Business of photography', 'Editing workflows', 'Client work'],
      audienceMotivation: 'Technical skill, creative development, and building a photography business',
      conversionNote: 'Gear and preset affiliate integration performs well. Course and editing software deals convert at above-average.',
      repurposeFlow: 'Instagram Reels → YouTube Shorts → Pinterest → blog post with tips → newsletter with raw + edited comparison',
    },

    lifestyle: {
      label: 'Lifestyle & Personal Brand',
      peakDay: 'Sunday',
      peakTime: '11:00–14:00',
      bestFormat: 'Vlog-style / talking head / montage',
      bestPlatform: 'Instagram / TikTok / YouTube',
      avgEngRate: '7.5%',
      primaryDemo: '18–32',
      hooks: [
        'I quit my 9–5 and this is what 90 days of freedom actually looks like.',
        'The life I was too scared to live — until I did.',
        'Moving to [City] alone at 26. Real, unfiltered first 30 days.',
        'I stopped pretending my life was perfect. My audience grew 3×.',
        'The brand deal that almost ruined my reputation. Full story.',
        'A day in my life — but I\'m showing you the parts nobody shares.',
        'This is what "making it" actually looks like at 28.',
      ],
      captions: [
        'Authenticity is the currency. Polished performances get scrolled past.',
        'Story arc in captions: tension → turning point → resolution. Every time.',
        'Community question at the end: "Which part of this do you relate to most?"',
      ],
      hashtags: [
        '#LifestyleCreator', '#PersonalBrand', '#LifestyleTok',
        '#AuthenticCreator', '#CreatorLife', '#DayInMyLife',
        '#LifestyleVlog', '#PersonalBrandTips', '#ContentAuthenticity',
        '#LifestyleContent', '#BuildingMyBrand', '#CreatorJourney',
      ],
      contentPillars: ['Day-in-the-life', 'Personal story', 'Travel', 'Self-development', 'Behind-the-scenes brand'],
      audienceMotivation: 'Inspiration, aspiration, and connection with someone living differently',
      conversionNote: 'Product integration works well when authentic. Audience is loyal but sceptical of hard sells.',
      repurposeFlow: 'YouTube vlog → TikTok best moment → Instagram Reels highlight → Stories poll → newsletter story',
    },
  };

  /* ── PLATFORM ALGORITHM KNOWLEDGE ──────────────────────────── */
  const platformAlgorithms = {
    TikTok: {
      primarySignal: 'Watch time & completion rate',
      secondarySignal: 'Shares, then comments, then likes',
      optimalLength: '21–34 seconds (hook) or 60–90 seconds (education)',
      firstHook: 'First 1.5 seconds must create pattern interrupt or unanswered question',
      distribution: 'FYP algorithm: starts small batch test → expands if engagement is strong within first 30 minutes',
      growthTip: 'Post at peak time, engage with comments in first 20 minutes to boost early velocity',
      avoidList: ['Watermarks from other platforms', 'Low-res footage', 'Mentioning competitor platforms'],
    },
    Instagram: {
      primarySignal: 'Saves and shares (Reels) · Time spent on post (carousels)',
      secondarySignal: 'Reach-to-follower ratio signals to Explore',
      optimalLength: 'Reels: 15–30s or 60–90s · Carousels: 7–10 slides',
      firstHook: 'First frame must stop the scroll — use bold text overlay or movement',
      distribution: 'Followers-first distribution → then hashtag reach → then Explore for high-save content',
      growthTip: 'Carousel posts get reshown to non-engagers at slide 1 — design slide 1 as a re-hook',
      avoidList: ['TikTok watermarks', 'Posting without alt text', 'Inconsistent posting schedule'],
    },
    YouTube: {
      primarySignal: 'Click-through rate × Watch time',
      secondarySignal: 'Subscriber conversion & likes',
      optimalLength: 'Shorts: 45–59s · Standard: 8–15 mins for most niches',
      firstHook: 'First 30 seconds: restate the promise of the title, tease the payoff, remove any reason to leave',
      distribution: 'Homepage → Suggested → Search. Shorts have separate discovery loop',
      growthTip: 'CTR is won in the thumbnail. Spend as long on the thumbnail as the video itself.',
      avoidList: ['Misleading thumbnails', 'Slow intros over 45 seconds', 'No chapters on long videos'],
    },
    LinkedIn: {
      primarySignal: 'Dwell time and early comments',
      secondarySignal: 'Shares within professional networks',
      optimalLength: 'Text posts: 150–300 words · Video: 1–3 minutes',
      firstHook: 'First line must stand alone — only 2 lines show before "see more"',
      distribution: 'Network-first. Connections\' engagement pushes to 2nd-degree network',
      growthTip: 'Comment on 3 creator posts in your niche before posting. Boosts distribution on your own post.',
      avoidList: ['Excessive hashtags (max 3)', 'Promotional tone', 'Cross-posting identical content from other platforms'],
    },
  };

  /* ── CONTENT STRATEGY FRAMEWORKS ───────────────────────────── */
  const strategyFrameworks = {
    'Hero-Hub-Help': {
      name: 'Hero-Hub-Help',
      description: 'YouTube\'s own framework — works across all platforms.',
      hero: 'Big-swing content: major tutorial, transformation, challenge. 1–2× per month. Drives subscriber spikes.',
      hub: 'Regular format content your audience expects. 2–3× per week. Builds consistency.',
      help: 'Search-driven, evergreen answers. What questions does your audience Google? Answer them.',
      bestFor: 'YouTube primary creators looking to build a searchable library',
    },
    'PAS': {
      name: 'Problem-Agitate-Solve',
      description: 'Copywriting framework applied to content structure.',
      step1: 'Problem: Name the exact pain. Specific is credible. Vague is forgettable.',
      step2: 'Agitate: Make them feel the cost of the problem. Not manipulative — honest.',
      step3: 'Solve: Your content IS the solution. Deliver on the hook fully.',
      bestFor: 'Educational and finance content on TikTok and YouTube',
    },
    'AIDA': {
      name: 'Attention-Interest-Desire-Action',
      description: 'Classic conversion framework — perfect for brand content and CTAs.',
      attention: 'The hook. Must stop the scroll in 1.5 seconds.',
      interest: 'Expand on the hook. Give them a reason to keep watching.',
      desire: 'Proof. Result. Transformation. Why they want what you\'re offering.',
      action: 'CTA. Be direct — "follow," "save," "click the link," "comment X."',
      bestFor: 'Partnership content, product integrations, and CTA-heavy posts',
    },
    'Document-Dont-Create': {
      name: 'Document, Don\'t Create',
      description: 'Gary Vee\'s framework — show your process, not just your outcome.',
      principle: 'You don\'t need to be an expert. Document where you are. The journey is the content.',
      application: 'Share what you\'re learning in real time. Authenticity converts better than polish.',
      bestFor: 'Lifestyle, business-building, and creator journey content',
    },
  };

  /* ── MONETISATION INTELLIGENCE ──────────────────────────────── */
  const monetisationPaths = {
    earlyStage: {
      primary: 'UGC (User Generated Content) — brands pay for content creation rights, not posting reach',
      secondary: 'Affiliate marketing — start before you have an audience. Seed the links now.',
      rates: 'UGC rates: £150–600 per video. Platform following is irrelevant at this stage.',
      advice: 'Don\'t wait for a large audience. Pitch UGC deals from day 1. You\'re selling content creation skills, not reach.',
    },
    growingStage: {
      primary: 'Sponsored integrations — you now have a monetisable audience',
      secondary: 'Digital products — templates, guides, presets, mini-courses',
      rates: 'Sponsored video: £800–4,000 depending on niche and engagement. Engagement rate > follower count.',
      advice: 'Your engagement rate is your negotiating power. A 12% engaged 20K audience outperforms a 1% 200K.',
    },
    establishedStage: {
      primary: 'Long-term brand partnerships and category exclusivity deals',
      secondary: 'Owned products, community, or paid membership',
      rates: 'Long-term partnerships: £2,000–15,000/month retainer. Category exclusivity commands 30–50% premium.',
      advice: 'The goal now is recurring revenue, not one-off deals. Build retainers.',
    },
  };

  /* ══════════════════════════════════════════════════════════════
     CAROUSEL AI — calls Render/Groq backend
     Primary function for the carousel builder in ai.html
  ══════════════════════════════════════════════════════════════ */
  async function generateCarousel(prompt, platform, tone, slideCount) {
    try {
      const response = await fetch(BACKEND_URL + '/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          mode: 'carousel'
        })
      });
      if (!response.ok) throw new Error('Backend returned ' + response.status);
      const data = await response.json();
      return data.reply || '';
    } catch (err) {
      console.error('[CreatorAI] generateCarousel error:', err);
      return null;
    }
  }

  /* ── LEGACY CHAT — now rerouted to Render backend ───────────── */
  async function askDijoAI(userMessage, conversationHistory) {
    try {
      const response = await fetch(BACKEND_URL + '/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          mode: 'creator'
        })
      });
      if (!response.ok) throw new Error('Backend error ' + response.status);
      const data = await response.json();
      return data.reply || null;
    } catch (err) {
      console.error('[Dijo AI]', err);
      return null;
    }
  }

  /* ── OFFLINE SMART REPLIES ──────────────────────────────────── */
  function offlineReply(message) {
    const m = message.toLowerCase();

    if (m.match(/hook|opening|first line|intro|start my/)) {
      return 'A strong hook does one of three things: <strong>states a specific contrarian fact</strong>, <strong>opens a curiosity loop</strong>, or <strong>names a painful problem instantly</strong>.<br><br>The golden rule: your first 1.5 seconds must make someone stop, or nothing else matters. Tell me your niche and I\'ll write you 5 hooks right now.';
    }
    if (m.match(/hashtag|#|tags/)) {
      return 'Hashtags are platform-specific. On <strong>TikTok</strong>, 3–5 niche-specific tags — avoid generic ones like #fyp (too competitive). On <strong>Instagram</strong>, 5–10 medium-volume tags (50K–500K posts). On <strong>YouTube</strong>, hashtags barely matter — optimise your title and description instead.<br><br>What platform and niche are you on? I\'ll give you the exact list.';
    }
    if (m.match(/how often|post|frequency|schedule|times? (?:a |per )?week/)) {
      return 'The rule: <strong>consistency beats frequency every time</strong>. A creator posting 3× a week for 6 months outperforms someone who posts daily for 3 weeks then burns out.<br><br>Minimum viable cadence by platform:<br>— TikTok: 3–5×/week<br>— Instagram Reels: 3–4×/week<br>— YouTube: 1–2×/week<br>— LinkedIn: 3×/week';
    }
    if (m.match(/algorithm|reach|views|viral|fyp|explore/)) {
      return 'Every platform has a different primary signal. <strong>TikTok</strong> cares most about watch time and completion rate — shares second. <strong>Instagram Reels</strong>: saves and shares push you to Explore. <strong>YouTube</strong>: it\'s CTR × watch time — a bad thumbnail kills everything else.<br><br>Which platform are you struggling with? I\'ll give you the exact fix.';
    }
    if (m.match(/brand deal|sponsor|rate|charge|how much|partnership|collab/)) {
      return 'Your rate should be based on <strong>engagement, not just follower count</strong>. Rough benchmark: £50–150 per 1,000 engaged followers per video integration.<br><br>Stages:<br>— Under 10K: pitch <strong>UGC deals</strong> (content rights, not posts). £150–600/video.<br>— 10K–100K: sponsored integrations. £800–4,000/video.<br>— 100K+: retainer deals. £2K–15K/month.<br><br>Never discount without justification. Engagement rate is your leverage.';
    }
    if (m.match(/media kit|press kit/)) {
      return 'A media kit needs exactly 6 things: <strong>your niche in one sentence</strong>, audience size + engagement rate, top content format, peak performance stats, partnership packages with rates, and contact details. One page. PDF or clean HTML.';
    }
    if (m.match(/caption|copy|writing/)) {
      return 'Captions that work have a clear structure: <strong>hook line</strong> (first 2 words must earn the "see more" tap) → <strong>core value</strong> → <strong>CTA</strong> (be direct — "save this," "comment X," or "follow for more of this").<br><br>The biggest mistake: writing captions about yourself instead of for your audience.';
    }
    if (m.match(/pillar|content plan|strategy|what to post/)) {
      return 'Every channel needs 3–5 content pillars — topics you own and return to. A good mix: <strong>1 education pillar</strong> (authority), <strong>1 story pillar</strong> (trust), <strong>1 opinion pillar</strong> (engagement), <strong>1 format pillar</strong> (your signature style).<br><br>Tell me your niche and I\'ll map your exact pillars with hook examples for each.';
    }
    if (m.match(/repurpos|cross.?post|reuse|recycle/)) {
      return 'One idea should live in at least 3 formats across 2 platforms. The system: <strong>long-form anchor</strong> → <strong>clip extraction</strong> → <strong>text adaptation</strong> → <strong>visual summary</strong> → <strong>email version</strong>.<br><br>Don\'t create more — extract more from what you\'ve already made.';
    }
    if (m.match(/grow|follower|subscriber|audience|not growing/)) {
      return 'Growth stalls for 3 reasons: <strong>weak hooks</strong>, <strong>no clear niche</strong>, or <strong>no CTA system</strong>.<br><br>Run this audit: check your average watch time. If it\'s under 30% of your video length, it\'s a hook problem. If watch time is fine but follows are low, it\'s a CTA problem. Tell me your numbers and I\'ll diagnose it.';
    }
    if (m.match(/monetis|monetiz|income|earn|make money/)) {
      return 'Monetisation isn\'t about follower count — it\'s about <strong>audience intent and trust</strong>. You can earn from content at 1,000 followers if you\'re solving a specific problem for a specific person.<br><br>Start with UGC, then affiliate links, then sponsored integrations as your audience grows.<br><br>What stage are you at? I\'ll give you the exact monetisation path.';
    }
    if (m.match(/^(hi|hello|hey|morning|afternoon|evening|what'?s up|sup)\b/)) {
      return 'Hey — I\'m Dijo. Tell me your niche, platform, and what you want to make — I\'ll generate your carousel instantly.';
    }

    return null;
  }

  /* ── PUBLIC API ─────────────────────────────────────────────── */
  return {
    nicheData,
    platformAlgorithms,
    strategyFrameworks,
    monetisationPaths,
    generateCarousel,
    askDijoAI,
    offlineReply,

    detectNiche(text) {
      const t = text.toLowerCase();
      if (t.match(/fitness|gym|workout|health|wellness|supplement|nutrition|body|weight/)) return 'health';
      if (t.match(/finance|money|invest|income|savings|budget|debt|wealth|tax/)) return 'finance';
      if (t.match(/business|startup|founder|agency|entrepreneur|company|revenue|client/)) return 'business';
      if (t.match(/ai|artificial intelligence|chatgpt|automation|saas|software|tech|prompt/)) return 'ai_tech';
      if (t.match(/productiv|notion|habit|routine|focus|deep work|system|time management/)) return 'productivity';
      if (t.match(/photo|camera|edit|lightroom|shoot|portrait|brand photo|visual/)) return 'photography';
      if (t.match(/lifestyle|travel|vlog|personal brand|day in my life|authentic/)) return 'lifestyle';
      return 'creator';
    },

    detectPlatform(text) {
      const t = text.toLowerCase();
      if (t.match(/youtube|yt|shorts/)) return 'YouTube';
      if (t.match(/instagram|ig|reels/)) return 'Instagram';
      if (t.match(/linkedin/)) return 'LinkedIn';
      if (t.match(/twitter|x\.com|tweets?/)) return 'Twitter/X';
      return 'TikTok';
    },

    parseFollowers(text) {
      const m = text.match(/(\d+(?:\.\d+)?)\s*([km]?)\s*(followers?|subscribers?|audience|community|subs)/i);
      if (!m) return null;
      let n = parseFloat(m[1]);
      if (m[2].toLowerCase() === 'k') n *= 1000;
      if (m[2].toLowerCase() === 'm') n *= 1000000;
      return n;
    },

    getMonetisationStage(followers) {
      if (!followers || followers < 10000) return monetisationPaths.earlyStage;
      if (followers < 100000) return monetisationPaths.growingStage;
      return monetisationPaths.establishedStage;
    },
  };

})();

window.CreatorAI = CreatorAI;
