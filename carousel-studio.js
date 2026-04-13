/* ═══════════════════════════════════════════════════════════
   IMPACTGRID — Carousel Studio
   carousel-studio.js  v4.3

   v4.3 changes (v4.2 visuals 100% intact):
   - AI prompt replaced: writes real narrative carousel copy with story arc
   - detectFormat() picks arc type from topic (stats/myth-bust/how-to/transformation/quote/comparison/listicle)
   - Trend chip bar loads from Anthropic API — no dead server dependency
   - Caption + hashtag generator (punchy, platform-aware, SEO-optimised)
   - SEO / trend score strip rendered below toolbar
   - Brand = www.impactgridgroup.com hardcoded — bottom watermark only,
     never written on slide content, never duplicated
   ═══════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────
   0. CONSTANTS
   ───────────────────────────────────────────────────────── */
var BRAND   = 'www.impactgridgroup.com';
var AI_URL  = 'https://api.anthropic.com/v1/messages';
var AI_MODEL= 'claude-sonnet-4-20250514';

/* ─────────────────────────────────────────────────────────
   1. ASSET LIBRARY  (unchanged from v4.2)
   ───────────────────────────────────────────────────────── */
var DA = {
  "cozy-home":{
    label:"Cozy Home",mood:"warm",accentColor:"#c4956a",
    palette:["#f5e6d3","#c4956a","#8b6f47","#e8d5b7"],
    textColors:{onDark:"#f5e6d3",primary:"#2c1810"},
    assets:[
      {id:"ch-001",url:"https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1080&h=1080&fit=crop",tone:"warm",brightness:"medium",layout_hints:["background","full-bleed","split-right"],text_safe_zones:["bottom-left","bottom"]},
      {id:"ch-002",url:"https://images.unsplash.com/photo-1493666438817-866a91353ca9?w=1080&h=1080&fit=crop",tone:"warm",brightness:"low",layout_hints:["background","overlay-text","full-bleed"],text_safe_zones:["center","bottom"]},
      {id:"ch-004",url:"https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=1080&h=1080&fit=crop",tone:"warm",brightness:"medium",layout_hints:["background","full-bleed","split-right"],text_safe_zones:["left","bottom-left"]},
      {id:"ch-005",url:"https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1080&h=1080&fit=crop",tone:"warm",brightness:"medium",layout_hints:["background","overlay-text"],text_safe_zones:["bottom","center"]},
      {id:"ch-006",url:"https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=1080&h=1080&fit=crop",tone:"warm",brightness:"low",layout_hints:["background","full-bleed"],text_safe_zones:["top","bottom"]},
      {id:"ch-009",url:"https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1080&h=1080&fit=crop",tone:"warm",brightness:"medium",layout_hints:["background","overlay-text","full-bleed"],text_safe_zones:["center","bottom"]},
      {id:"ch-011",url:"https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1080&h=1080&fit=crop",tone:"warm",brightness:"medium",layout_hints:["background","split-right"],text_safe_zones:["left","bottom"]},
      {id:"ch-015",url:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1080&h=1080&fit=crop",tone:"warm",brightness:"low",layout_hints:["background","overlay-text","full-bleed"],text_safe_zones:["top","bottom"]},
      {id:"ch-016",url:"https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1080&h=1080&fit=crop",tone:"warm",brightness:"high",layout_hints:["background","full-bleed","thumbnail"],text_safe_zones:["bottom","center"]},
      {id:"ch-017",url:"https://images.unsplash.com/photo-1523413555250-4580a8bcd2df?w=1080&h=1080&fit=crop",tone:"warm",brightness:"medium",layout_hints:["background","thumbnail","split-left"],text_safe_zones:["right","bottom"]}
    ]
  },
  "workspace":{
    label:"Workspace",mood:"focused",accentColor:"#38bdf8",
    palette:["#0f172a","#1e293b","#334155","#e2e8f0"],
    textColors:{onDark:"#e2e8f0",primary:"#0f172a"},
    assets:[
      {id:"ws-001",url:"https://images.unsplash.com/photo-1492724441997-5dc865305da7?w=1080&h=1080&fit=crop",tone:"cool",brightness:"medium",layout_hints:["background","split-right","full-bleed"],text_safe_zones:["left","bottom-left"]},
      {id:"ws-004",url:"https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1080&h=1080&fit=crop",tone:"warm",brightness:"medium",layout_hints:["background","thumbnail","split-right"],text_safe_zones:["left","bottom-left"]},
      {id:"ws-005",url:"https://images.unsplash.com/photo-1487014679447-9f8336841d58?w=1080&h=1080&fit=crop",tone:"cool",brightness:"low",layout_hints:["background","overlay-text","full-bleed"],text_safe_zones:["center","top"]},
      {id:"ws-010",url:"https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1080&h=1080&fit=crop",tone:"cool",brightness:"medium",layout_hints:["background","full-bleed"],text_safe_zones:["center","bottom"]},
      {id:"ws-011",url:"https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=1080&h=1080&fit=crop",tone:"neutral",brightness:"high",layout_hints:["background","split-left","thumbnail"],text_safe_zones:["right","bottom-right"]},
      {id:"ws-013",url:"https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=1080&h=1080&fit=crop",tone:"cool",brightness:"low",layout_hints:["background","overlay-text","full-bleed"],text_safe_zones:["top","center"]},
      {id:"ws-017",url:"https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1080&h=1080&fit=crop",tone:"neutral",brightness:"medium",layout_hints:["background","full-bleed","thumbnail"],text_safe_zones:["left","bottom-left"]},
      {id:"ws-019",url:"https://images.unsplash.com/photo-1589561253898-768105ca91a8?w=1080&h=1080&fit=crop",tone:"warm",brightness:"medium",layout_hints:["background","overlay-text"],text_safe_zones:["center","bottom"]},
      {id:"ws-020",url:"https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1080&h=1080&fit=crop",tone:"cool",brightness:"medium",layout_hints:["background","full-bleed","thumbnail"],text_safe_zones:["bottom","center"]},
      {id:"ws-021",url:"https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1080&h=1080&fit=crop",tone:"warm",brightness:"medium",layout_hints:["background","split-right"],text_safe_zones:["left","bottom"]}
    ]
  },
  "minimal":{
    label:"Minimal",mood:"clean",accentColor:"#404040",
    palette:["#fafafa","#e5e5e5","#a3a3a3","#171717"],
    textColors:{onDark:"#fafafa",primary:"#171717"},
    assets:[
      {id:"mn-001",url:"https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=1080&h=1080&fit=crop",tone:"neutral",brightness:"high",layout_hints:["background","split-left","thumbnail"],text_safe_zones:["right","bottom-right"]},
      {id:"mn-002",url:"https://images.unsplash.com/photo-1494526585095-c41746248156?w=1080&h=1080&fit=crop",tone:"neutral",brightness:"high",layout_hints:["background","full-bleed","overlay-text"],text_safe_zones:["center","bottom"]},
      {id:"mn-004",url:"https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1080&h=1080&fit=crop",tone:"neutral",brightness:"high",layout_hints:["background","full-bleed","thumbnail"],text_safe_zones:["bottom","center"]},
      {id:"mn-005",url:"https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=1080&h=1080&fit=crop",tone:"cool",brightness:"high",layout_hints:["background","split-left"],text_safe_zones:["right","center"]},
      {id:"mn-009",url:"https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1080&h=1080&fit=crop",tone:"neutral",brightness:"high",layout_hints:["background","split-left"],text_safe_zones:["right","bottom-right"]},
      {id:"mn-011",url:"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1080&h=1080&fit=crop",tone:"neutral",brightness:"medium",layout_hints:["background","full-bleed","thumbnail"],text_safe_zones:["bottom","left"]},
      {id:"mn-014",url:"https://images.unsplash.com/photo-1519461593925-9af3e6d20e6b?w=1080&h=1080&fit=crop",tone:"neutral",brightness:"high",layout_hints:["background","full-bleed"],text_safe_zones:["bottom-left","center"]},
      {id:"mn-017",url:"https://images.unsplash.com/photo-1565183928294-7063f23ce0f8?w=1080&h=1080&fit=crop",tone:"neutral",brightness:"high",layout_hints:["background","full-bleed"],text_safe_zones:["bottom","right"]},
      {id:"mn-018",url:"https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=1080&h=1080&fit=crop",tone:"neutral",brightness:"high",layout_hints:["background","thumbnail","split-left"],text_safe_zones:["right","bottom"]},
      {id:"mn-019",url:"https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1080&h=1080&fit=crop",tone:"neutral",brightness:"high",layout_hints:["background","full-bleed"],text_safe_zones:["center","bottom"]}
    ]
  },
  "luxury":{
    label:"Luxury",mood:"dramatic",accentColor:"#c9a227",
    palette:["#1a1209","#3d2b0a","#8b6914","#f0e6d3"],
    textColors:{onDark:"#f0e6d3",primary:"#1a1209"},
    assets:[
      {id:"lx-001",url:"https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1080&h=1080&fit=crop",tone:"warm",brightness:"medium",layout_hints:["background","full-bleed","overlay-text"],text_safe_zones:["bottom","center"]},
      {id:"lx-002",url:"https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1080&h=1080&fit=crop",tone:"neutral",brightness:"high",layout_hints:["background","split-left","thumbnail"],text_safe_zones:["right","bottom-right"]},
      {id:"lx-004",url:"https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1080&h=1080&fit=crop",tone:"neutral",brightness:"high",layout_hints:["background","overlay-text","split-right"],text_safe_zones:["left","bottom-left"]},
      {id:"lx-006",url:"https://images.unsplash.com/photo-1567538096621-38d2284b23ff?w=1080&h=1080&fit=crop",tone:"neutral",brightness:"high",layout_hints:["background","split-left"],text_safe_zones:["right","center"]},
      {id:"lx-007",url:"https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=1080&h=1080&fit=crop",tone:"warm",brightness:"medium",layout_hints:["background","overlay-text","full-bleed"],text_safe_zones:["top","bottom"]},
      {id:"lx-010",url:"https://images.unsplash.com/photo-1619292560554-3c3462a59c95?w=1080&h=1080&fit=crop",tone:"warm",brightness:"low",layout_hints:["background","overlay-text"],text_safe_zones:["center","bottom"]},
      {id:"lx-012",url:"https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1080&h=1080&fit=crop",tone:"neutral",brightness:"high",layout_hints:["background","full-bleed","overlay-text"],text_safe_zones:["bottom","center"]},
      {id:"lx-018",url:"https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=1080&h=1080&fit=crop",tone:"neutral",brightness:"high",layout_hints:["background","full-bleed","thumbnail"],text_safe_zones:["bottom","left"]},
      {id:"lx-019",url:"https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=1080&h=1080&fit=crop",tone:"warm",brightness:"medium",layout_hints:["background","overlay-text","full-bleed"],text_safe_zones:["center","bottom"]},
      {id:"lx-020",url:"https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1080&h=1080&fit=crop",tone:"neutral",brightness:"high",layout_hints:["background","split-left","thumbnail"],text_safe_zones:["right","center"]}
    ]
  },
  "lifestyle":{
    label:"Lifestyle",mood:"vibrant",accentColor:"#e8a45a",
    palette:["#1e3a5f","#e8a45a","#2d6a4f","#f5f0eb"],
    textColors:{onDark:"#f5f0eb",primary:"#1a1a1a"},
    assets:[
      {id:"ls-002",url:"https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1080&h=1080&fit=crop",tone:"warm",brightness:"high",layout_hints:["background","full-bleed","overlay-text"],text_safe_zones:["bottom","center"]},
      {id:"ls-003",url:"https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1080&h=1080&fit=crop",tone:"warm",brightness:"high",layout_hints:["background","split-left","thumbnail"],text_safe_zones:["right","bottom-right"]},
      {id:"ls-005",url:"https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1080&h=1080&fit=crop",tone:"cool",brightness:"medium",layout_hints:["background","full-bleed","split-right"],text_safe_zones:["left","bottom-left"]},
      {id:"ls-007",url:"https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1080&h=1080&fit=crop",tone:"warm",brightness:"high",layout_hints:["background","full-bleed","overlay-text"],text_safe_zones:["bottom","center"]},
      {id:"ls-008",url:"https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1080&h=1080&fit=crop",tone:"warm",brightness:"high",layout_hints:["background","split-right"],text_safe_zones:["left","bottom-left"]},
      {id:"ls-009",url:"https://images.unsplash.com/photo-1511988617509-a57c8a288659?w=1080&h=1080&fit=crop",tone:"warm",brightness:"high",layout_hints:["background","overlay-text","full-bleed"],text_safe_zones:["top","bottom"]},
      {id:"ls-015",url:"https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=1080&h=1080&fit=crop",tone:"cool",brightness:"medium",layout_hints:["background","overlay-text","full-bleed"],text_safe_zones:["top","center"]},
      {id:"ls-016",url:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1080&h=1080&fit=crop",tone:"cool",brightness:"high",layout_hints:["background","full-bleed"],text_safe_zones:["bottom","center"]},
      {id:"ls-017",url:"https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1080&h=1080&fit=crop",tone:"warm",brightness:"high",layout_hints:["background","thumbnail","split-right"],text_safe_zones:["left","bottom"]},
      {id:"ls-018",url:"https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1080&h=1080&fit=crop",tone:"warm",brightness:"medium",layout_hints:["background","full-bleed","overlay-text"],text_safe_zones:["bottom","center"]}
    ]
  },
  "finance":{
    label:"Finance",mood:"authoritative",accentColor:"#22c55e",
    palette:["#0a0f0a","#0d1f0d","#1a3a1a","#e8f5e8"],
    textColors:{onDark:"#e8f5e8",primary:"#0a0f0a"},
    assets:[
      {id:"fn-001",url:"https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1080&h=1080&fit=crop",tone:"cool",brightness:"low",layout_hints:["background","full-bleed","overlay-text"],text_safe_zones:["bottom","center"]},
      {id:"fn-002",url:"https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1080&h=1080&fit=crop",tone:"neutral",brightness:"medium",layout_hints:["background","split-right","full-bleed"],text_safe_zones:["left","bottom-left"]},
      {id:"fn-003",url:"https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1080&h=1080&fit=crop",tone:"neutral",brightness:"high",layout_hints:["background","thumbnail","split-left"],text_safe_zones:["right","center"]},
      {id:"fn-004",url:"https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1080&h=1080&fit=crop",tone:"cool",brightness:"medium",layout_hints:["background","full-bleed"],text_safe_zones:["center","bottom"]},
      {id:"fn-005",url:"https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1080&h=1080&fit=crop",tone:"neutral",brightness:"medium",layout_hints:["background","full-bleed","thumbnail"],text_safe_zones:["left","bottom"]},
      {id:"fn-006",url:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1080&h=1080&fit=crop",tone:"neutral",brightness:"medium",layout_hints:["background","split-right"],text_safe_zones:["left","bottom-left"]},
      {id:"fn-007",url:"https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=1080&h=1080&fit=crop",tone:"cool",brightness:"low",layout_hints:["background","overlay-text","full-bleed"],text_safe_zones:["top","center"]},
      {id:"fn-008",url:"https://images.unsplash.com/photo-1565372195458-9de0b320ef04?w=1080&h=1080&fit=crop",tone:"neutral",brightness:"medium",layout_hints:["background","full-bleed","thumbnail"],text_safe_zones:["bottom","center"]},
      {id:"fn-009",url:"https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1080&h=1080&fit=crop",tone:"cool",brightness:"low",layout_hints:["background","overlay-text","full-bleed"],text_safe_zones:["center","bottom"]},
      {id:"fn-010",url:"https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?w=1080&h=1080&fit=crop",tone:"warm",brightness:"medium",layout_hints:["background","split-left","thumbnail"],text_safe_zones:["right","bottom"]}
    ]
  },
  "health":{
    label:"Health & Wellness",mood:"energetic",accentColor:"#84cc16",
    palette:["#f0fdf4","#dcfce7","#4ade80","#14532d"],
    textColors:{onDark:"#f0fdf4",primary:"#14532d"},
    assets:[
      {id:"hl-001",url:"https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1080&h=1080&fit=crop",tone:"cool",brightness:"medium",layout_hints:["background","full-bleed","overlay-text"],text_safe_zones:["bottom","center"]},
      {id:"hl-002",url:"https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1080&h=1080&fit=crop",tone:"warm",brightness:"high",layout_hints:["background","split-left","thumbnail"],text_safe_zones:["right","bottom-right"]},
      {id:"hl-003",url:"https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=1080&h=1080&fit=crop",tone:"warm",brightness:"high",layout_hints:["background","full-bleed","overlay-text"],text_safe_zones:["bottom","center"]},
      {id:"hl-004",url:"https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1080&h=1080&fit=crop",tone:"cool",brightness:"medium",layout_hints:["background","overlay-text","full-bleed"],text_safe_zones:["center","top"]},
      {id:"hl-005",url:"https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1080&h=1080&fit=crop",tone:"warm",brightness:"high",layout_hints:["background","split-right","thumbnail"],text_safe_zones:["left","bottom-left"]},
      {id:"hl-006",url:"https://images.unsplash.com/photo-1478144592103-25e218a04891?w=1080&h=1080&fit=crop",tone:"warm",brightness:"high",layout_hints:["background","full-bleed"],text_safe_zones:["bottom","center"]},
      {id:"hl-007",url:"https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=1080&h=1080&fit=crop",tone:"cool",brightness:"medium",layout_hints:["background","full-bleed","overlay-text"],text_safe_zones:["top","center"]},
      {id:"hl-008",url:"https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1080&h=1080&fit=crop",tone:"warm",brightness:"high",layout_hints:["background","thumbnail","split-left"],text_safe_zones:["right","bottom"]},
      {id:"hl-009",url:"https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=1080&h=1080&fit=crop",tone:"cool",brightness:"medium",layout_hints:["background","full-bleed","overlay-text"],text_safe_zones:["bottom","center"]},
      {id:"hl-010",url:"https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1080&h=1080&fit=crop",tone:"warm",brightness:"high",layout_hints:["background","split-right"],text_safe_zones:["left","center"]}
    ]
  },
  "fashion":{
    label:"Fashion",mood:"editorial",accentColor:"#f43f5e",
    palette:["#0c0c0c","#1c1c1c","#3c3c3c","#f5f5f5"],
    textColors:{onDark:"#f5f5f5",primary:"#0c0c0c"},
    assets:[
      {id:"fa-001",url:"https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1080&h=1080&fit=crop",tone:"neutral",brightness:"high",layout_hints:["background","split-left","thumbnail"],text_safe_zones:["right","bottom-right"]},
      {id:"fa-002",url:"https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1080&h=1080&fit=crop",tone:"neutral",brightness:"high",layout_hints:["background","full-bleed","overlay-text"],text_safe_zones:["bottom","center"]},
      {id:"fa-003",url:"https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1080&h=1080&fit=crop",tone:"neutral",brightness:"medium",layout_hints:["background","full-bleed","overlay-text"],text_safe_zones:["top","center"]},
      {id:"fa-004",url:"https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1080&h=1080&fit=crop",tone:"neutral",brightness:"high",layout_hints:["background","split-right"],text_safe_zones:["left","bottom"]},
      {id:"fa-005",url:"https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1080&h=1080&fit=crop",tone:"neutral",brightness:"medium",layout_hints:["background","full-bleed","overlay-text"],text_safe_zones:["bottom","center"]},
      {id:"fa-006",url:"https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=1080&h=1080&fit=crop",tone:"neutral",brightness:"high",layout_hints:["background","thumbnail","split-left"],text_safe_zones:["right","center"]},
      {id:"fa-007",url:"https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1080&h=1080&fit=crop",tone:"cool",brightness:"medium",layout_hints:["background","full-bleed","overlay-text"],text_safe_zones:["center","bottom"]},
      {id:"fa-008",url:"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1080&h=1080&fit=crop",tone:"neutral",brightness:"high",layout_hints:["background","split-right","thumbnail"],text_safe_zones:["left","bottom"]},
      {id:"fa-009",url:"https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=1080&h=1080&fit=crop",tone:"neutral",brightness:"medium",layout_hints:["background","full-bleed"],text_safe_zones:["bottom","center"]},
      {id:"fa-010",url:"https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=1080&h=1080&fit=crop",tone:"warm",brightness:"high",layout_hints:["background","full-bleed","overlay-text"],text_safe_zones:["top","center"]}
    ]
  }
};

/* ─────────────────────────────────────────────────────────
   2. THEME DETECTION  (unchanged from v4.2)
   ───────────────────────────────────────────────────────── */
var SIGNALS = {
  workspace:["produc","habit","routine","income","money","business","sales","revenue","market","strategy","content creator","social media","creator","brand","client","freelance","hustle","grow","audience","follower","engagement","post","reel","youtube","tiktok","linkedin","coach","consult","email","newsletter","launch","offer","scale","lead","funnel","analytics","workflow","system","tool","app","automat","schedule","outsource","team","agency","niche","platform","algorithm","viral","six figure","seven figure","passive income"],
  luxury:["luxury","premium","high-end","wealthy","rich","millionaire","billionaire","elite","exclusive","five-star","penthouse","yacht","villa","mansion","ferrari","rolex","designer","couture","champagne","caviar","bespoke","curated","aspirational","status","wealth","invest","portfolio","asset","financial freedom","retire early"],
  "cozy-home":["home","interior","cozy","cosi","decor","room","kitchen","bedroom","living room","candle","blanket","fireplace","warm","comfort","hygge","nest","sanctuary","organis","clean","tidy","minimalist home","aesthetic home","apartment","garden","plant","slow living","self care","morning at home"],
  minimal:["minimal","simple","clean","white","neutral","scandinavian","nordic","declutter","essentialism","less is more","capsule","wardrobe","fashion","style","aesthetic","photography","art","design","branding","logo","font","typography","architecture","layout","flat lay"],
  finance:["money","invest","stocks","crypto","bitcoin","etf","dividend","passive income","financial","wealth","savings","budget","debt","retire","portfolio","trading","market","compound","interest","tax","accounting","profit","revenue","cashflow","fund","asset","liabilit"],
  health:["health","wellness","fitness","nutrition","diet","exercise","workout","gym","yoga","meditation","mindfulness","sleep","stress","anxiety","mental","gut","immune","vitamin","supplement","hydrat","protein","carb","fat","calorie","macro","weight loss","muscle","recovery","inflammation"],
  fashion:["fashion","style","outfit","clothing","wear","dress","trend","season","look","capsule wardrobe","ootd","streetwear","luxury fashion","designer","brand","accessory","shoes","bag","jewellery","makeup","beauty","skincare","grooming","aesthetic"],
  lifestyle:["lifestyle","travel","food","fitness","health","wellness","workout","gym","run","yoga","mindfulness","meditation","adventure","explore","wander","beach","mountain","cafe","restaurant","friend","family","social","joy","happy","energy","motivation","inspire","morning","personal","authentic","real","story","journey","transform","glow up","before after","vlog"]
};

function detectTheme(text){
  if(!text||text.trim().length<3) return 'lifestyle';
  var t=text.toLowerCase(),scores={};
  Object.keys(SIGNALS).forEach(function(th){
    scores[th]=0;
    SIGNALS[th].forEach(function(kw){ if(t.indexOf(kw)!==-1) scores[th]+=(kw.split(' ').length>1?4:2); });
  });
  var best='lifestyle',bestScore=0;
  Object.keys(scores).forEach(function(th){ if(scores[th]>bestScore){bestScore=scores[th];best=th;} });
  return best;
}

/* ─────────────────────────────────────────────────────────
   3. FORMAT DETECTION + NARRATIVE ARCS  (new in v4.3)
   ───────────────────────────────────────────────────────── */
var FORMAT_ARCS = {
  STATS_STORY:    ['hook','stat','insight','proof','stat','takeaway','cta'],
  MYTH_BUST:      ['hook','myth','truth','myth','truth','pattern','cta'],
  HOW_TO:         ['hook','step','step','step','step','common_mistake','cta'],
  TRANSFORMATION: ['hook','before','turning_point','after','lesson','proof','cta'],
  QUOTE_SERIES:   ['hook','quote','context','quote','context','reflection','cta'],
  COMPARISON:     ['hook','option_a','option_b','verdict','nuance','proof','cta'],
  LISTICLE:       ['hook','point','point','point','point','point','cta']
};

var BEAT_TO_SLIDE_TYPE = {
  hook:'hook', stat:'stat', insight:'insight', proof:'proof',
  takeaway:'insight', myth:'insight', truth:'insight', pattern:'insight',
  step:'value', common_mistake:'insight', before:'before', turning_point:'insight',
  after:'after', lesson:'lesson', quote:'quote', context:'insight',
  reflection:'quote', option_a:'insight', option_b:'insight',
  verdict:'insight', nuance:'insight', point:'value', cta:'cta'
};

function detectFormat(topic){
  var t = topic.toLowerCase();
  if(/stat|data|number|research|study|percent|%|roi|metric|figure/.test(t)) return 'STATS_STORY';
  if(/mistake|wrong|avoid|stop|myth|lie|truth|debunk|actually/.test(t))      return 'MYTH_BUST';
  if(/how to|step|guide|ways|tips|hack|formula|framework|system/.test(t))    return 'HOW_TO';
  if(/before|after|transform|journey|went from|result|case study/.test(t))   return 'TRANSFORMATION';
  if(/quote|lesson|mindset|believe|philosophy|principle/.test(t))             return 'QUOTE_SERIES';
  if(/vs|versus|compare|which|better|difference|between/.test(t))            return 'COMPARISON';
  return 'LISTICLE';
}

function buildArc(format, count){
  var base = FORMAT_ARCS[format] || FORMAT_ARCS.LISTICLE;
  var arc  = ['hook'];
  var middle = base.slice(1, base.length - 1);
  for(var i = 1; i < count - 1; i++) arc.push(middle[(i-1) % middle.length]);
  arc.push('cta');
  return arc;
}

/* ─────────────────────────────────────────────────────────
   4. ASSET PICKING & OVERLAY HELPERS  (unchanged from v4.2)
   ───────────────────────────────────────────────────────── */
function pickAsset(theme, slideType, slideIndex, offset){
  var T=DA[theme]; if(!T||!T.assets.length) return null;
  var prefer={hook:'overlay-text',cta:'overlay-text',stat:'split-right',quote:'full-bleed',value:'full-bleed',list:'split-left',insight:'full-bleed',lesson:'full-bleed',problem:'overlay-text',proof:'split-right',story:'overlay-text'}[slideType]||'full-bleed';
  var scored=T.assets.map(function(a,i){
    var s=a.layout_hints.indexOf(prefer)!==-1?10:0;
    s+=a.layout_hints.indexOf('background')!==-1?2:0;
    return {a:a,s:s,i:i};
  }).sort(function(x,y){return y.s-x.s||x.i-y.i;});
  var idx=(slideIndex+(offset||0))%scored.length;
  return scored[idx].a;
}

function pickSecondAsset(theme, excludeId, slideIndex){
  var T=DA[theme]; if(!T) return null;
  var pool=T.assets.filter(function(a){ return a.id!==excludeId && a.layout_hints.indexOf('thumbnail')!==-1; });
  if(!pool.length) pool=T.assets.filter(function(a){ return a.id!==excludeId; });
  if(!pool.length) return null;
  return pool[(slideIndex+3)%pool.length];
}

function pickThirdAsset(theme, excludeIds, slideIndex){
  var T=DA[theme]; if(!T) return null;
  var pool=T.assets.filter(function(a){ return excludeIds.indexOf(a.id)===-1; });
  if(!pool.length) return T.assets[0];
  return pool[(slideIndex+5)%pool.length];
}

function getOverlay(tone,brightness,layout){
  if(['EDITORIAL_COLLAGE','EDITORIAL_COLLAGE_3','STAT_HERO','QUOTE_PULL'].indexOf(layout)!==-1) return 'none';
  if(brightness==='low') return 'linear-gradient(to top,rgba(0,0,0,.9) 0%,rgba(0,0,0,.5) 50%,rgba(0,0,0,.15) 100%)';
  if(tone==='neutral'&&brightness==='high') return 'linear-gradient(to top,rgba(0,0,0,.85) 0%,rgba(0,0,0,.25) 55%,transparent 100%)';
  if(tone==='warm') return 'linear-gradient(to top,rgba(12,7,3,.9) 0%,rgba(12,7,3,.4) 55%,rgba(12,7,3,.08) 100%)';
  if(tone==='cool') return 'linear-gradient(to top,rgba(8,12,22,.92) 0%,rgba(8,12,22,.4) 55%,transparent 100%)';
  return 'linear-gradient(to top,rgba(0,0,0,.88) 0%,rgba(0,0,0,.35) 55%,transparent 100%)';
}

function getTextColors(tone,brightness,themeKey){
  if((themeKey==='minimal'||themeKey==='cozy-home')&&brightness==='high'){
    return {head:'#1a1814',body:'rgba(26,24,20,.75)',tagBg:'rgba(26,24,20,.1)',tagColor:'#1a1814'};
  }
  return {head:'#ffffff',body:'rgba(255,255,255,.85)',tagBg:'rgba(0,0,0,.5)',tagColor:'#ffffff'};
}

function getPanelBg(theme){
  return {workspace:'#0f172a',luxury:'#1a1209',minimal:'#f7f7f5','cozy-home':'#f5e6d3',lifestyle:'#1e3a5f',finance:'#0a0f0a',health:'#f0fdf4',fashion:'#0c0c0c'}[theme]||'#1a1814';
}

function getPanelText(theme){
  return (['minimal','cozy-home','health'].indexOf(theme)!==-1)?'#1a1814':'#f0ede8';
}

/* ─────────────────────────────────────────────────────────
   5. LAYOUT ASSIGNMENT  (unchanged from v4.2)
   ───────────────────────────────────────────────────────── */
var LAYOUT_SEQUENCE = [
  'FULL_BLEED','OVERLAP_BAND','BOTTOM_STRIP','DUAL_IMAGE',
  'TOP_STRIP','STAT_HERO','QUOTE_PULL',
  'EDITORIAL_COVER','EDITORIAL_COLLAGE','EDITORIAL_COLLAGE_3','HABIT_COVER'
];

function assignLayout(slideType,idx,total){
  var sets={
    hook:['FULL_BLEED','OVERLAP_BAND','EDITORIAL_COVER','HABIT_COVER'],
    cta:['FULL_BLEED','BOTTOM_STRIP','OVERLAP_BAND'],
    stat:['STAT_HERO','OVERLAP_BAND','BOTTOM_STRIP'],
    value:['FULL_BLEED','OVERLAP_BAND','BOTTOM_STRIP','DUAL_IMAGE','EDITORIAL_COLLAGE'],
    insight:['OVERLAP_BAND','FULL_BLEED','TOP_STRIP','BOTTOM_STRIP'],
    lesson:['BOTTOM_STRIP','FULL_BLEED','EDITORIAL_COLLAGE_3','TOP_STRIP'],
    proof:['DUAL_IMAGE','OVERLAP_BAND','BOTTOM_STRIP'],
    quote:['QUOTE_PULL','FULL_BLEED'],
    story:['FULL_BLEED','TOP_STRIP','OVERLAP_BAND'],
    problem:['FULL_BLEED','OVERLAP_BAND','BOTTOM_STRIP'],
    list:['BOTTOM_STRIP','EDITORIAL_COLLAGE_3','OVERLAP_BAND'],
    tip:['OVERLAP_BAND','BOTTOM_STRIP','TOP_STRIP','FULL_BLEED'],
    before:['FULL_BLEED','BOTTOM_STRIP'],
    after:['FULL_BLEED','OVERLAP_BAND']
  };
  var set=sets[slideType]||LAYOUT_SEQUENCE;
  return set[idx%set.length];
}

function normalizeLayoutSafe(layout, slideType, idx, total){
  var fallback=assignLayout(slideType||'value',idx||0,total||1);
  var blocked=['SPLIT_LEFT','SPLIT_RIGHT','CORNER_FLOAT','GRID_POINTS','MAGAZINE_SPLIT','HABIT_SLIDE'];
  var allowed=['FULL_BLEED','OVERLAP_BAND','BOTTOM_STRIP','DUAL_IMAGE','TOP_STRIP','STAT_HERO','QUOTE_PULL','EDITORIAL_COVER','EDITORIAL_COLLAGE','EDITORIAL_COLLAGE_3','HABIT_COVER'];
  if(!layout||blocked.indexOf(layout)!==-1||allowed.indexOf(layout)===-1) return fallback;
  return layout;
}

function stripHashtags(text){
  return String(text||'').replace(/(^|\s)#[\w-]+/g,' ').replace(/\s+/g,' ').trim();
}

function trimHeadline(text){
  return stripHashtags(text).split(/\s+/).filter(Boolean).slice(0,8).join(' ');
}

function limitBody(text){
  var clean=stripHashtags(text);
  var parts=(clean.match(/[^.!?]+[.!?]?/g)||[]).map(function(p){return p.trim();}).filter(Boolean);
  return parts.slice(0,2).join(' ');
}

function normalizeSlidesDeck(slides){
  if(!Array.isArray(slides)) return [];
  return slides.map(function(slide,i){
    var out=Object.assign({},slide||{});
    out.type = out.type || (i===0?'hook':i===slides.length-1?'cta':'insight');
    out.layout=normalizeLayoutSafe(out.layout,out.type,i,slides.length);
    out.headline=trimHeadline(out.headline||(out.type==='hook'?'This changes everything':out.type==='cta'?'Ready to apply this?':'Key insight'));
    out.body=limitBody(out.body||'');
    out.quote=stripHashtags(out.quote||'');
    out.cta=stripHashtags(out.cta||'');
    out.hashtags=[];
    if(out.type==='cta'&&!out.cta) out.cta='Follow for more';
    if(out.type!=='hook'&&!out.body) out.body='Apply this consistently to see measurable progress.';
    return out;
  });
}

function headlineSize(text){
  var l=(text||'').length;
  if(l<20) return 38; if(l<30) return 33; if(l<45) return 28; if(l<60) return 24; return 20;
}

/* ─────────────────────────────────────────────────────────
   6. STATE
   ───────────────────────────────────────────────────────── */
var ST={
  slides:[], cur:0, count:7, theme:null, zoom:100,
  format:'square', accent:'#f5e400',
  brand: '', /* always overridden to BRAND constant — see init */
  userImages:{}, assetOffset:0, exportType:'png', fontPair:'syne'
};

var FONT_PAIRS={
  syne:{head:"'Syne',sans-serif",body:"'DM Sans',sans-serif",mono:"'Space Mono',monospace"},
  cormorant:{head:"'Cormorant Garant',Georgia,serif",body:"'DM Sans',sans-serif",mono:"'Space Mono',monospace"},
  playfair:{head:"'Playfair Display',Georgia,serif",body:"'DM Sans',sans-serif",mono:"'Space Mono',monospace"},
  inter:{head:"'Inter','DM Sans',sans-serif",body:"'Inter','DM Sans',sans-serif",mono:"'Space Mono',monospace"}
};

function getFont(type){
  var pair=FONT_PAIRS[ST.fontPair]||FONT_PAIRS.syne;
  return pair[type]||pair.head;
}

/* ─────────────────────────────────────────────────────────
   7. TOPIC INPUT → INTEL DETECTION
   ───────────────────────────────────────────────────────── */
var dTimer;
function onTopicInput(){
  clearTimeout(dTimer);
  var v=document.getElementById('topicInput').value.trim();
  document.getElementById('genBtn').disabled=v.length<4;
  if(v.length<4){resetIntel();return;}
  dTimer=setTimeout(function(){runDetect(v);},350);
}

function resetIntel(){
  document.getElementById('intelCard').classList.remove('active');
  document.getElementById('intelVal').textContent='Waiting for topic…';
  document.getElementById('intelLbl').textContent='DIJO INTELLIGENCE';
  for(var i=0;i<5;i++) document.getElementById('iseg'+i).classList.remove('on');
  document.getElementById('assetPreviewField').style.display='none';
}

function runDetect(topic){
  var theme=detectTheme(topic); ST.theme=theme;
  var T=DA[theme]; if(!T) return;
  var card=document.getElementById('intelCard');
  card.classList.add('active');
  var fmt=detectFormat(topic);
  document.getElementById('intelLbl').textContent='FORMAT: '+fmt.replace(/_/g,' ');
  document.getElementById('intelVal').textContent=T.label+' · '+T.mood;
  var t2=topic.toLowerCase(),score=0;
  (SIGNALS[theme]||[]).forEach(function(kw){if(t2.indexOf(kw)!==-1) score++;});
  var segs=Math.min(5,Math.max(1,Math.round(score/1.5)));
  for(var i=0;i<5;i++) document.getElementById('iseg'+i).classList.toggle('on',i<segs);
  showAssetPreview(theme);
}

function showAssetPreview(theme){
  var T=DA[theme],row=document.getElementById('assetRow');
  row.innerHTML='';
  T.assets.slice(0,6).forEach(function(a){
    var d=document.createElement('div'); d.className='ath';
    var img=document.createElement('img');
    img.src=a.url.replace('w=1080&h=1080','w=120&h=120');
    img.onload=function(){d.classList.add('loaded');};
    d.appendChild(img); row.appendChild(d);
  });
  document.getElementById('assetPreviewField').style.display='block';
}

/* ─────────────────────────────────────────────────────────
   8. TREND CHIPS  (new in v4.3 — loads from Anthropic API)
   ───────────────────────────────────────────────────────── */
var TREND_FALLBACK = [
  'AI Productivity','Creator Economy','Personal Branding',
  'Mental Health','Leadership','Financial Freedom',
  'Content Marketing','Remote Work','Entrepreneurship','Morning Routine'
];

async function loadTrendChips(){
  var bar = document.getElementById('tbar');
  if(!bar) return;
  bar.innerHTML = '<span class="tlbl">Trending</span><span style="font-size:.7rem;color:var(--text3);font-family:var(--fm)">Loading…</span>';

  var topics = TREND_FALLBACK; /* default */

  try {
    var res = await fetch(AI_URL, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: 200,
        system: 'Return ONLY a JSON array of 10 trending LinkedIn/Instagram carousel topics for 2025. No markdown, no explanation.',
        messages:[{role:'user',content:'Give me 10 trending social media carousel topics right now. JSON array of strings only.'}]
      })
    });
    if(res.ok){
      var d = await res.json();
      var raw = (d.content||[]).map(function(b){return b.text||'';}).join('');
      var match = raw.match(/\[[\s\S]*?\]/);
      if(match){
        var parsed = JSON.parse(match[0]);
        if(Array.isArray(parsed)&&parsed.length) topics = parsed.slice(0,10);
      }
    }
  } catch(e){ /* use fallback */ }

  renderTrendChips(bar, topics);
}

function renderTrendChips(bar, topics){
  bar.innerHTML = '<span class="tlbl" style="font-size:9px;font-weight:700;font-family:var(--fm);letter-spacing:.5px;color:var(--text3);text-transform:uppercase;white-space:nowrap;flex-shrink:0">Trending</span>';
  topics.forEach(function(topic){
    var chip = document.createElement('button');
    chip.className = 'trend-chip';
    chip.textContent = topic;
    chip.style.cssText = 'background:rgba(245,228,0,.06);border:1px solid rgba(245,228,0,.15);border-radius:20px;padding:3px 10px;font-size:10px;font-family:var(--fm);color:rgba(245,228,0,.7);cursor:pointer;white-space:nowrap;flex-shrink:0;transition:.15s;letter-spacing:.2px;';
    chip.addEventListener('mouseover', function(){ this.style.background='rgba(245,228,0,.15)'; this.style.color='var(--ig-yellow,#f5e400)'; });
    chip.addEventListener('mouseout',  function(){ this.style.background='rgba(245,228,0,.06)'; this.style.color='rgba(245,228,0,.7)'; });
    chip.addEventListener('click', function(){
      var inp = document.getElementById('topicInput');
      if(inp){ inp.value = topic; onTopicInput(); inp.focus(); }
    });
    bar.appendChild(chip);
  });
}

/* ─────────────────────────────────────────────────────────
   9. AI GENERATION  (v4.3 — direct Anthropic API, narrative prompt)
   ───────────────────────────────────────────────────────── */
async function generate(){
  var topic=document.getElementById('topicInput').value.trim();
  if(!topic){toast('⚠️ Add a topic first');document.getElementById('topicInput').focus();return;}
  if(!ST.theme) ST.theme=detectTheme(topic);

  var platform = document.getElementById('platSelect').value;
  var tone     = document.getElementById('toneSelect').value;
  var count    = ST.count;
  var format   = detectFormat(topic);
  var arc      = buildArc(format, count);

  var btn=document.getElementById('genBtn');
  btn.innerHTML='<div class="spin"></div> Generating…';btn.disabled=true;

  document.getElementById('emptyState').style.display='none';
  document.getElementById('slideWrap').style.display='block';
  document.getElementById('loadingOv').classList.add('show');

  var hints=[
    'Detecting narrative arc…',
    'Writing hook slide…',
    'Crafting insights…',
    'Building story structure…',
    'Writing captions + hashtags…',
    'Polishing your carousel…'
  ];
  var hi=0,hTimer=setInterval(function(){
    hi=(hi+1)%hints.length;
    document.getElementById('loadingHint').textContent=hints[hi];
  },1600);

  try {
    var data = await callAI(topic, platform, tone, count, format, arc);
    ST.slides = parseAISlides(data, topic, arc);
    if(data.accentColor) ST.accent=data.accentColor;
    renderSEOStrip(data);
    renderCaptionHashtags(data);
  } catch(e) {
    console.warn('[Carousel v4.3] AI error, using fallback:',e);
    ST.slides = fallbackSlides(topic, arc);
    toast('⚡ Generated offline — check API connection');
  }

  clearInterval(hTimer);
  document.getElementById('loadingOv').classList.remove('show');
  ST.cur=0;
  buildStrip(); renderSlide(); updateCounter(); fillEdit();

  btn.innerHTML='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Regenerate';
  btn.disabled=false;
  toast('✦ '+ST.slides.length+'-slide '+format.replace(/_/g,' ')+' · '+DA[ST.theme].label+' · click text to edit');
}

/* ─────────────────────────────────────────────────────────
   10. DIRECT ANTHROPIC API CALL  (v4.3)
   ───────────────────────────────────────────────────────── */
async function callAI(topic, platform, tone, count, format, arc){

  var systemPrompt = [
    'You are a world-class social media carousel copywriter.',
    'You write carousels that stop the scroll, build authority, and drive real engagement.',
    'Your copy is sharp, specific, and human — never generic, never fluffy.',
    'Platform: '+platform+'. Tone: '+tone+'.',
    'Respond ONLY with valid JSON — no markdown, no code fences, no extra text.'
  ].join(' ');

  var userPrompt = [
    'Write a '+count+'-slide carousel about: "'+topic+'"',
    '',
    'Narrative format: '+format,
    'Arc (one beat per slide): '+arc.join(' → '),
    '',
    'For each slide return:',
    '{',
    '  "beat": "<beat from arc>",',
    '  "type": "<hook|stat|quote|insight|value|lesson|before|after|cta>",',
    '  "tag": "<SLIDE 01 | THE TRUTH | STEP 1 | etc — short eyebrow label>",',
    '  "headline": "<max 8 words, punchy, specific — no fluff>",',
    '  "body": "<2 real, specific sentences — NO generalities, NAME actual things>",',
    '  "stat": "<only for stat beats: a concrete number e.g. 73%>",',
    '  "quote": "<only for quote beats: a sharp conversational quote>",',
    '  "cta": "<only for cta beat: a specific action, not just follow me>"',
    '}',
    '',
    'RULES:',
    '- Slide 1 (hook): scroll-stopping claim or provocative question. Specific, not vague.',
    '- Middle slides: ONE clear insight each. Build on the previous. No repetition.',
    '- Stat slides: use a real or realistic number (e.g. "73% of creators…").',
    '- Quote slides: must sound like a real person said it — conversational, not corporate.',
    '- CTA slide: specific action tied to the topic. Not "follow for more".',
    '- NEVER use: game-changer, level up, unlock, crush it, skyrocket.',
    '- NEVER put hashtags in slide text.',
    '',
    'Also include at the end of the JSON object:',
    '"caption": "<'+platform+' caption — hook line first, 3-4 punchy sentences, end with a question>",',
    '"hashtags": "<12 hashtags: mix niche + trending + broad, comma-separated, no # prefix>",',
    '"seo_score": <integer 1-100 based on topic demand>,',
    '"trend_note": "<1 sentence on why this topic is hot right now>",',
    '"topic": "<3-5 word label for this carousel>"',
    '',
    'Return ONE JSON object with keys: "slides" (array) + "caption" + "hashtags" + "seo_score" + "trend_note" + "topic"'
  ].join('\n');

  var res = await fetch(AI_URL, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({
      model:      AI_MODEL,
      max_tokens: 1000,
      system:     systemPrompt,
      messages:   [{role:'user', content: userPrompt}]
    })
  });

  if(!res.ok) throw new Error('API '+res.status+': '+await res.text());

  var d = await res.json();
  var raw = (d.content||[]).map(function(b){return b.text||'';}).join('');
  var clean = raw.replace(/```json|```/gi,'').trim();
  return JSON.parse(clean);
}

/* ─────────────────────────────────────────────────────────
   11. SLIDE PARSING  (v4.3 — maps AI JSON → ST.slides shape)
   ───────────────────────────────────────────────────────── */
function parseAISlides(data, topic, arc){
  try {
    if(!data.slides||!Array.isArray(data.slides)) throw new Error('no slides array');
    var total = data.slides.length;
    var parsed = data.slides.map(function(sl, i){
      var slideType = sl.type || BEAT_TO_SLIDE_TYPE[sl.beat] || (i===0?'hook':i===total-1?'cta':'insight');
      var layout    = normalizeLayoutSafe(null, slideType, i, total);

      /* Force STAT_HERO for stat beats */
      if(sl.stat && sl.stat.length) layout = normalizeLayoutSafe('STAT_HERO', slideType, i, total);
      /* Force QUOTE_PULL for quote beats */
      if(sl.quote && sl.quote.length) layout = normalizeLayoutSafe('QUOTE_PULL', slideType, i, total);

      return {
        type:     slideType,
        beat:     sl.beat || arc[i] || 'value',
        layout:   layout,
        mediaType:'image',
        tag:      stripHashtags(sl.tag || String(i+1).padStart(2,'0')),
        headline: trimHeadline(sl.headline || ''),
        body:     limitBody(sl.body || ''),
        stat:     sl.stat  || null,
        quote:    sl.quote || null,
        cta:      stripHashtags(sl.cta  || ''),
        caption:  '',
        hashtags: [],
        primaryImage: null,
        secondImage:  null
      };
    });
    return normalizeSlidesDeck(parsed);
  } catch(e){
    console.warn('[parseAISlides]', e.message);
    return fallbackSlides(topic, arc);
  }
}

/* ─────────────────────────────────────────────────────────
   12. CAPTION + HASHTAG RENDERER  (new in v4.3)
   ───────────────────────────────────────────────────────── */
function renderCaptionHashtags(data){
  /* Store caption on slide 0 for the edit panel */
  if(ST.slides.length && data.caption){
    ST.slides[0].caption = data.caption;
  }

  /* Update the caption textarea in the right panel */
  var capEl = document.getElementById('eCap');
  if(capEl && data.caption) capEl.value = data.caption;

  /* Render hashtags below the caption copy button */
  var hashSec = document.getElementById('hashtagSection');
  var hashChips = document.getElementById('hashtagChips');
  if(hashSec && hashChips && data.hashtags){
    var tags = typeof data.hashtags === 'string'
      ? data.hashtags.split(',').map(function(h){return h.trim();}).filter(Boolean)
      : (Array.isArray(data.hashtags) ? data.hashtags : []);
    hashChips.innerHTML = tags.map(function(h){
      return '<span class="hashtag-chip" style="cursor:pointer" title="Click to copy" onclick="copyTag(\''+h.replace(/'/g,"\\'")+'\')">#'+h.replace(/^#/,'')+'</span>';
    }).join('');
    hashSec.style.display = tags.length ? 'flex' : 'none';
  }
}

function copyTag(tag){
  navigator.clipboard.writeText('#'+tag.replace(/^#/,'')).then(function(){toast('✓ #'+tag+' copied');});
}

/* ─────────────────────────────────────────────────────────
   13. SEO / TREND SCORE STRIP  (new in v4.3)
   ───────────────────────────────────────────────────────── */
function renderSEOStrip(data){
  var strip = document.getElementById('seo-strip');
  if(!strip) return;

  var score = parseInt(data.seo_score,10) || 70;
  var tier  = score>=80 ? '🔥 High Demand' : score>=60 ? '📈 Trending' : '💡 Niche';
  var col   = score>=80 ? '#4ade80' : score>=60 ? '#f5e400' : '#94a3b8';
  var note  = data.trend_note || '';

  strip.innerHTML = [
    '<div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;overflow:hidden;">',
      '<span style="font-size:10px;white-space:nowrap;flex-shrink:0">'+tier+'</span>',
      '<span style="font-size:9px;font-family:var(--fm);color:var(--text3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">'+note+'</span>',
    '</div>',
    '<div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">',
      '<span style="font-size:9px;font-family:var(--fm);color:var(--text3);letter-spacing:.3px">SEO</span>',
      '<div style="width:60px;height:4px;background:var(--border);border-radius:2px;overflow:hidden;">',
        '<div style="width:'+score+'%;height:100%;background:'+col+';border-radius:2px;transition:width .5s;"></div>',
      '</div>',
      '<span style="font-size:9px;font-family:var(--fm);color:'+col+';font-weight:700;min-width:28px">'+score+'</span>',
    '</div>'
  ].join('');
  strip.style.display = 'flex';
}

/* ─────────────────────────────────────────────────────────
   14. FALLBACK SLIDES  (updated for arc structure)
   ───────────────────────────────────────────────────────── */
function fallbackSlides(topic, arc){
  var shortTopic = (topic||'this').split(' ').slice(0,3).join(' ');
  var slides = arc.map(function(beat, i){
    var type = BEAT_TO_SLIDE_TYPE[beat] || 'insight';
    var sl = { beat:beat, type:type, tag:String(i+1).padStart(2,'0'), hashtags:[], caption:'', primaryImage:null, secondImage:null };
    switch(beat){
      case 'hook':
        sl.headline='The truth nobody tells you about this';
        sl.body='Most people skip this completely. It\'s costing them results every single day.';
        break;
      case 'cta':
        sl.headline='Ready to do this differently?';
        sl.body='Pick one idea from this carousel and act on it today — not next week, today.';
        sl.cta='Save this for reference';
        break;
      case 'stat':
        sl.headline='The number that changes everything';
        sl.stat='73%';
        sl.body='That\'s how many people make this mistake. The data is clear on what works.';
        break;
      case 'quote':
        sl.headline='';
        sl.quote='The system you have is perfectly designed to give you the results you\'re getting.';
        sl.body='If the results aren\'t there — change the system, not just the effort.';
        break;
      case 'before':
        sl.headline='Where most people start';
        sl.body='Frustrated, stuck in the same cycle. Working hard but moving sideways.';
        break;
      case 'after':
        sl.headline='Where you could be in 90 days';
        sl.body='Consistent results, quiet confidence, a clear system that actually works.';
        break;
      default:
        sl.headline='What nobody tells you — part '+(i+1);
        sl.body='Once you understand this, everything else starts to click. It compounds fast.';
    }
    return sl;
  });
  return normalizeSlidesDeck(slides);
}

/* ─────────────────────────────────────────────────────────
   15. RENDER ENGINE  (unchanged from v4.2)
   ───────────────────────────────────────────────────────── */

function clearLayouts(){
  ['sContent','sSplit','sCorner','sDual','sBand','sEditorial','sQuote','sStat','sGrid','sTopStrip','sBottomStrip',
   'sEditorialCover','sEditorialCollage','sHabitCover','sHabitSlide'].forEach(function(id){
    var el=document.getElementById(id);
    if(el){el.innerHTML='';el.className=el.className.replace(/\bhidden\b/g,'').trim()+' hidden';}
  });
}

function showLayout(id){
  var el=document.getElementById(id);
  if(el) el.className=el.className.replace(/\bhidden\b/g,'').trim();
}

function ensureContainer(id){
  var el=document.getElementById(id);
  if(!el){
    el=document.createElement('div');
    el.id=id;
    document.getElementById('slideCanvas').appendChild(el);
  }
  return el;
}

function renderSlide(){
  if(!ST.slides.length) return;
  var slide=ST.slides[ST.cur];
  var theme=ST.theme||'lifestyle';
  var T=DA[theme];
  var layout=slide.layout||assignLayout(slide.type,ST.cur,ST.slides.length);

  var primaryUrl=ST.userImages[ST.cur]||
    (slide.primaryImage?slide.primaryImage.url:null)||
    (function(){var a=pickAsset(theme,slide.type,ST.cur,ST.assetOffset);return a?a.url:null;})();

  var secondUrl=(slide.secondImage?slide.secondImage.url:null)||
    (function(){
      var excludeId=slide.primaryImage?slide.primaryImage.id:'';
      var a=pickSecondAsset(theme,excludeId,ST.cur);
      return a?a.url:null;
    })();

  var thirdUrl=(function(){
    var excludeIds=[];
    if(slide.primaryImage) excludeIds.push(slide.primaryImage.id);
    var a=pickThirdAsset(theme,excludeIds,ST.cur);
    return a?a.url:null;
  })();

  var assetMeta=slide.primaryImage||{tone:'neutral',brightness:'medium'};
  var tone2=assetMeta.tone||'neutral';
  var bri=assetMeta.brightness||'medium';
  var tc=getTextColors(tone2,bri,theme);
  var accent2=ST.accent||T.accentColor;
  var pBg=getPanelBg(theme);
  var pText=getPanelText(theme);

  var sBgImg=document.getElementById('sBgImg');
  var sVideo=document.getElementById('sBgVideo');
  var sOverlay=document.getElementById('sOverlay');
  var sTexture=document.getElementById('sTexture');
  var sBg=document.getElementById('sBg');

  clearLayouts();

  var useVideo=false;
  if(!useVideo){
    sVideo.innerHTML='';sVideo.style.display='none';
    var needsBg=['FULL_BLEED','DUAL_IMAGE','OVERLAP_BAND','TOP_STRIP','BOTTOM_STRIP',
                 'EDITORIAL_COVER','HABIT_COVER'].indexOf(layout)!==-1;
    if(primaryUrl&&needsBg){
      sBgImg.style.backgroundImage='url('+primaryUrl+')';
      sBgImg.style.opacity='1';
      sBg.style.background='#111';
    } else if(!needsBg){
      sBgImg.style.opacity='0';
      sBg.style.background=T.palette[0];
    } else {
      sBgImg.style.backgroundImage=primaryUrl?'url('+primaryUrl+')':'none';
      sBgImg.style.opacity=primaryUrl?'1':'0';
      sBg.style.background=primaryUrl?'#111':T.palette[0];
    }
  }

  var ov=getOverlay(tone2,bri,layout);
  sOverlay.style.background=ov==='none'?'none':ov;

  sTexture.className='s-texture';
  if(theme==='luxury') sTexture.classList.add('tex-grain');
  else if(theme==='workspace') sTexture.classList.add('tex-lines');
  else if(theme==='minimal') sTexture.classList.add('tex-dots');

  switch(layout){

    case 'FULL_BLEED':
    default:{
      var sContent=document.getElementById('sContent');
      showLayout('sContent');
      sContent.className='s-content '+(slide.type==='hook'||slide.type==='quote'?'layout-center':'layout-bottom');
      sContent.innerHTML=buildFullBleedHTML(slide,tc,accent2);
      break;
    }

    case 'DUAL_IMAGE':{
      showLayout('sDual');
      var sDual=document.getElementById('sDual');
      sDual.className='s-dual-wrap';
      var dMain=document.getElementById('sDualMain');
      var dThumb=document.getElementById('sDualThumb');
      var dText=document.getElementById('sDualText');
      if(dMain&&primaryUrl) dMain.style.backgroundImage='url('+primaryUrl+')';
      if(dThumb&&secondUrl) dThumb.innerHTML='<img src="'+secondUrl+'" alt="" style="width:100%;height:100%;object-fit:cover;display:block;"/>';
      if(dText){
        var dh='';
        if(slide.tag) dh+='<div style="font-size:9px;font-weight:700;font-family:'+getFont('mono')+';letter-spacing:2.5px;text-transform:uppercase;color:'+accent2+';margin-bottom:10px">'+esc(slide.tag)+'</div>';
        dh+='<div style="font-family:'+getFont('head')+';font-size:'+headlineSize(slide.headline)+'px;font-weight:800;line-height:1.15;color:#fff;text-shadow:0 2px 16px rgba(0,0,0,.6);margin-bottom:8px">'+esc(slide.headline)+'</div>';
        if(slide.body) dh+='<div style="font-size:13px;line-height:1.6;color:rgba(255,255,255,.85);margin-bottom:10px">'+esc(slide.body)+'</div>';
        if(slide.cta) dh+='<div style="display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:8px;font-size:11px;font-weight:700;font-family:'+getFont('head')+';background:'+accent2+';color:#fff;width:fit-content">'+esc(slide.cta)+' →</div>';
        dText.innerHTML=dh;
      }
      break;
    }

    case 'OVERLAP_BAND':{
      showLayout('sBand');
      var sBandEl=document.getElementById('sBand');
      sBandEl.className='s-band-wrap';
      sBandEl.innerHTML='<div style="position:absolute;left:0;right:0;top:32%;padding:20px 32px 22px;background:'+accent2+';display:flex;flex-direction:column;gap:7px;">'
        +(slide.tag?'<div style="font-size:9px;font-weight:700;font-family:'+getFont('mono')+';letter-spacing:2.5px;text-transform:uppercase;color:rgba(255,255,255,.65)">'+esc(slide.tag)+'</div>':'')
        +'<div style="font-family:'+getFont('head')+';font-size:'+Math.min(26,headlineSize(slide.headline))+'px;font-weight:800;line-height:1.15;color:#fff">'+esc(slide.headline)+'</div>'
        +(slide.body?'<div style="font-size:12px;line-height:1.5;color:rgba(255,255,255,.85);margin-top:2px">'+esc(slide.body)+'</div>':'')
        +'</div>';
      break;
    }

    case 'BOTTOM_STRIP':{
      sBgImg.style.opacity='0'; sBg.style.background=T.palette[0];
      var bsEl=ensureContainer('sBottomStrip');
      showLayout('sBottomStrip');
      bsEl.innerHTML='';
      bsEl.style.cssText='position:absolute;inset:0;z-index:4;display:flex;flex-direction:column;';
      var imgDiv=document.createElement('div');
      imgDiv.style.cssText='flex:0 0 58%;background-size:cover;background-position:center;'+(primaryUrl?'background-image:url('+primaryUrl+')':'background:'+T.palette[1]);
      var textDiv=document.createElement('div');
      textDiv.style.cssText='flex:1;background:'+pBg+';padding:20px 28px;display:flex;flex-direction:column;justify-content:center;gap:8px;color:'+pText;
      textDiv.innerHTML=buildSplitTextHTML(slide,accent2,pText,pBg);
      bsEl.appendChild(imgDiv); bsEl.appendChild(textDiv);
      break;
    }

    case 'TOP_STRIP':{
      sBgImg.style.opacity='0'; sBg.style.background=T.palette[0];
      var tsEl=ensureContainer('sTopStrip');
      showLayout('sTopStrip');
      tsEl.innerHTML='';
      tsEl.style.cssText='position:absolute;inset:0;z-index:4;display:flex;flex-direction:column;';
      var textDivT=document.createElement('div');
      textDivT.style.cssText='flex:0 0 42%;background:'+pBg+';padding:22px 28px;display:flex;flex-direction:column;justify-content:center;gap:8px;color:'+pText;
      textDivT.innerHTML=buildSplitTextHTML(slide,accent2,pText,pBg);
      var imgDivT=document.createElement('div');
      imgDivT.style.cssText='flex:1;background-size:cover;background-position:center;'+(primaryUrl?'background-image:url('+primaryUrl+')':'background:'+T.palette[1]);
      tsEl.appendChild(textDivT); tsEl.appendChild(imgDivT);
      break;
    }

    case 'STAT_HERO':{
      sBgImg.style.opacity='0'; sBg.style.background=T.palette[0];
      showLayout('sStat');
      var sStat=document.getElementById('sStat');
      sStat.className='s-stat-wrap'; sStat.style.background=T.palette[0];
      var statStrip=document.getElementById('sStatStrip');
      if(statStrip&&primaryUrl){statStrip.style.backgroundImage='url('+primaryUrl+')';statStrip.style.display='block';}
      var sColor=(['minimal','cozy-home','health'].indexOf(theme)!==-1)?T.textColors.primary:'#f0ede8';
      var sh='';
      if(slide.tag) sh+='<div style="font-size:9px;font-weight:700;font-family:'+getFont('mono')+';letter-spacing:2.5px;text-transform:uppercase;color:'+accent2+';margin-bottom:8px">'+esc(slide.tag)+'</div>';
      sh+='<div class="s-stat-num" style="color:'+accent2+'">'+esc(slide.stat||'1×')+'</div>';
      sh+='<div style="font-family:'+getFont('head')+';font-size:'+Math.min(24,headlineSize(slide.headline))+'px;font-weight:700;line-height:1.2;color:'+sColor+';margin-top:6px">'+esc(slide.headline)+'</div>';
      if(slide.body) sh+='<div style="font-size:12px;line-height:1.55;opacity:.72;margin-top:8px;color:'+sColor+'">'+esc(slide.body)+'</div>';
      sStat.insertAdjacentHTML('beforeend',sh);
      break;
    }

    case 'QUOTE_PULL':{
      sBgImg.style.opacity='0';
      var qPalette=(['minimal','cozy-home','health'].indexOf(theme)!==-1);
      sBg.style.background=qPalette?'#f7f4ef':T.palette[0];
      showLayout('sQuote');
      var sQuote=document.getElementById('sQuote');
      sQuote.className='s-quote-wrap';
      sQuote.style.cssText='position:absolute;inset:0;z-index:4;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:44px 40px;text-align:center;gap:0;background:'+(qPalette?'#f7f4ef':T.palette[0]);
      var qColor=qPalette?'#1a1814':'#f0ede8';
      var qText=slide.quote||slide.headline||'';
      var qFontSize=Math.min(24,Math.max(16,headlineSize(qText)));
      var qh='';
      qh+='<div style="width:40px;height:2px;background:'+accent2+';border-radius:1px;margin-bottom:28px;"></div>';
      qh+='<div style="font-family:Georgia,serif;font-size:72px;line-height:0.5;color:'+accent2+';opacity:0.55;margin-bottom:20px;align-self:flex-start;">\u201C</div>';
      qh+='<div style="font-family:'+getFont('head')+';font-size:'+qFontSize+'px;font-weight:700;line-height:1.4;color:'+qColor+';letter-spacing:-0.3px;max-width:88%;margin:0 auto;">'+esc(qText)+'</div>';
      qh+='<div style="width:40px;height:2px;background:'+accent2+';border-radius:1px;margin-top:28px;"></div>';
      if(slide.tag){
        qh+='<div style="margin-top:16px;font-size:10px;font-family:'+getFont('mono')+';letter-spacing:2.5px;text-transform:uppercase;color:'+accent2+';opacity:0.8;">'+esc(slide.tag)+'</div>';
      }
      if(slide.body&&!slide.quote){
        qh+='<div style="margin-top:14px;font-size:12px;line-height:1.65;color:'+qColor+';opacity:0.6;max-width:80%;">'+esc(slide.body)+'</div>';
      }
      sQuote.innerHTML=qh;
      break;
    }

    case 'HABIT_COVER':{
      var hcEl=ensureContainer('sHabitCover');
      showLayout('sHabitCover');
      hcEl.innerHTML='';
      hcEl.style.cssText='position:absolute;inset:0;z-index:4;';
      var hcOv=document.createElement('div');
      hcOv.style.cssText='position:absolute;inset:0;background:rgba(8,8,6,.38);z-index:1;pointer-events:none;';
      hcEl.appendChild(hcOv);
      var hcTop=document.createElement('div');
      hcTop.style.cssText='position:absolute;top:0;left:0;right:0;z-index:2;padding:12px 18px;display:flex;justify-content:space-between;align-items:center;border-bottom:0.5px solid rgba(255,255,255,.22);';
      /* brand shows top bar of HABIT_COVER — this is fine, it's part of the editorial design */
      hcTop.innerHTML='<span style="font-size:9px;font-weight:700;font-family:'+getFont('mono')+';color:rgba(255,255,255,.82);letter-spacing:.14em;text-transform:uppercase;">IMPACT GRID GROUP</span>'
        +'<span style="font-size:9px;font-weight:700;font-family:'+getFont('mono')+';color:rgba(255,255,255,.82);letter-spacing:.14em;text-transform:uppercase;">@IMPACTGRIDGROUP</span>';
      hcEl.appendChild(hcTop);
      var hcTitle=document.createElement('div');
      hcTitle.style.cssText='position:absolute;left:16px;right:16px;bottom:80px;z-index:2;';
      var words=(slide.headline||'Change Your Life').split(' ');
      var mid=Math.ceil(words.length/2);
      var line1=words.slice(0,mid).join(' ');
      var line2=words.slice(mid).join(' ');
      var titleFontSize=Math.min(72,Math.max(42,Math.round(560/Math.max(slide.headline.length,6))));
      hcTitle.innerHTML=
        '<div style="font-family:'+getFont('head')+';font-size:'+titleFontSize+'px;font-weight:800;color:'+accent2+';line-height:.92;letter-spacing:-.5px;margin-bottom:2px;">'+esc(line1)+'</div>'
        +'<div style="font-family:'+getFont('head')+';font-size:'+titleFontSize+'px;font-weight:800;color:'+accent2+';line-height:.92;letter-spacing:-.5px;">'+esc(line2||line1)+'</div>';
      hcEl.appendChild(hcTitle);
      if(slide.body||slide.subline){
        var hcSub=document.createElement('div');
        var subText=slide.body||slide.subline||'';
        hcSub.style.cssText='position:absolute;left:16px;right:40%;bottom:52px;z-index:2;font-family:'+getFont('body')+';font-size:10px;font-weight:400;color:'+accent2+';line-height:1.5;letter-spacing:.02em;text-transform:uppercase;';
        hcSub.textContent=subText;
        hcEl.appendChild(hcSub);
      }
      var hcSwirl=document.createElement('div');
      hcSwirl.style.cssText='position:absolute;right:24px;bottom:120px;z-index:2;width:70px;height:70px;opacity:.9;';
      hcSwirl.innerHTML='<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" fill="none"><path d="M55 20 C55 20 70 30 62 48 C54 66 30 62 22 46 C14 30 28 14 44 18" stroke="white" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M44 18 L38 10 M44 18 L52 14" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      hcEl.appendChild(hcSwirl);
      /* Brand watermark — bottom strip, last slide only */
      var hcBot=document.createElement('div');
      hcBot.style.cssText='position:absolute;bottom:0;left:0;right:0;z-index:2;padding:11px 18px;display:flex;justify-content:space-between;align-items:center;';
      hcBot.innerHTML='<span style="font-size:9px;font-family:'+getFont('mono')+';color:rgba(255,255,255,.55);letter-spacing:.06em;">'+BRAND.toUpperCase()+'</span>'
        +'<span style="font-size:9px;font-family:'+getFont('mono')+';color:rgba(255,255,255,.55);letter-spacing:.08em;">SLIDE '+String(ST.cur+1).padStart(2,'0')+'</span>';
      hcEl.appendChild(hcBot);
      break;
    }

    case 'EDITORIAL_COVER':{
      var ecEl=ensureContainer('sEditorialCover');
      showLayout('sEditorialCover');
      ecEl.innerHTML='';
      ecEl.style.cssText='position:absolute;inset:0;z-index:4;';
      var ecOv=document.createElement('div');
      ecOv.style.cssText='position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.55) 0%,rgba(0,0,0,.12) 55%,rgba(0,0,0,.04) 100%);z-index:1;pointer-events:none;';
      ecEl.appendChild(ecOv);
      var ecBadge=document.createElement('div');
      ecBadge.textContent='Page '+String(ST.cur+1).padStart(2,'0');
      ecBadge.style.cssText='position:absolute;top:14px;left:14px;z-index:2;font-size:10px;font-family:'+getFont('body')+';font-weight:400;color:rgba(255,255,255,.92);border:1px solid rgba(255,255,255,.6);border-radius:40px;padding:4px 14px;letter-spacing:.3px;';
      ecEl.appendChild(ecBadge);
      var ecBrand=document.createElement('div');
      ecBrand.textContent='Impact Grid Group';
      ecBrand.style.cssText='position:absolute;top:16px;right:16px;z-index:2;font-size:11px;font-family:'+getFont('body')+';font-weight:400;color:rgba(255,255,255,.88);letter-spacing:.4px;';
      ecEl.appendChild(ecBrand);
      var words2=(slide.headline||'5 Ways to Transform Your Home').split(' ');
      var scriptWordCount=Math.min(2,Math.ceil(words2.length/3));
      var normalWords=words2.slice(0,-scriptWordCount);
      var scriptWords=words2.slice(-scriptWordCount);
      var titleFontSz=Math.min(62,Math.max(34,Math.round(500/Math.max(slide.headline.length,6))));
      var ecTitle=document.createElement('div');
      ecTitle.style.cssText='position:absolute;bottom:50px;left:18px;right:18px;z-index:2;';
      ecTitle.innerHTML='<div style="font-family:Georgia,\'Times New Roman\',serif;font-size:'+titleFontSz+'px;font-weight:400;color:#fff;line-height:1.0;text-shadow:0 2px 24px rgba(0,0,0,.4);">'+esc(normalWords.join(' '))+'</div>'
        +'<div style="font-family:Georgia,\'Times New Roman\',serif;font-size:'+(titleFontSz+4)+'px;font-style:italic;font-weight:400;color:#fff;line-height:1.0;text-shadow:0 2px 24px rgba(0,0,0,.4);">'+esc(scriptWords.join(' '))+'</div>';
      ecEl.appendChild(ecTitle);
      var ecHandle=document.createElement('div');
      ecHandle.textContent=BRAND;
      ecHandle.style.cssText='position:absolute;bottom:16px;left:18px;z-index:2;font-size:10px;font-family:'+getFont('body')+';color:rgba(255,255,255,.55);letter-spacing:.2px;';
      ecEl.appendChild(ecHandle);
      var ecStars=document.createElement('div');
      ecStars.innerHTML='✽ ✽ ✽';
      ecStars.style.cssText='position:absolute;bottom:14px;right:16px;z-index:2;font-size:13px;color:rgba(255,255,255,.55);letter-spacing:5px;';
      ecEl.appendChild(ecStars);
      break;
    }

    case 'EDITORIAL_COLLAGE':{
      sBgImg.style.opacity='0';
      sBg.style.background='#f0ebe1';
      var ecolEl=ensureContainer('sEditorialCollage');
      showLayout('sEditorialCollage');
      ecolEl.innerHTML='';
      ecolEl.style.cssText='position:absolute;inset:0;z-index:4;background:#f0ebe1;';
      var ecolBadge=document.createElement('div');
      ecolBadge.textContent='Page '+String(ST.cur+1).padStart(2,'0');
      ecolBadge.style.cssText='position:absolute;top:14px;left:14px;z-index:6;font-size:10px;font-family:'+getFont('body')+';color:#888;border:1px solid #b0a898;border-radius:40px;padding:3px 12px;letter-spacing:.3px;';
      ecolEl.appendChild(ecolBadge);
      var ecolBrand=document.createElement('div');
      ecolBrand.textContent='Impact Grid Group';
      ecolBrand.style.cssText='position:absolute;top:16px;right:14px;z-index:6;font-size:11px;font-family:'+getFont('body')+';color:#888;letter-spacing:.3px;';
      ecolEl.appendChild(ecolBrand);
      var ecolNum=document.createElement('div');
      ecolNum.textContent=String(ST.cur+1).padStart(2,'0');
      ecolNum.style.cssText='position:absolute;top:36px;right:14px;z-index:2;font-family:Georgia,"Times New Roman",serif;font-size:108px;font-style:italic;font-weight:700;color:#1a1814;line-height:1;opacity:.9;';
      ecolEl.appendChild(ecolNum);
      var ecolP1=document.createElement('div');
      ecolP1.style.cssText='position:absolute;left:14px;top:54px;width:44%;height:48%;background-size:cover;background-position:center;background-color:#c8b89a;border-radius:3px;z-index:3;'+(primaryUrl?'background-image:url('+primaryUrl+')':'');
      ecolEl.appendChild(ecolP1);
      var ecolP2=document.createElement('div');
      var p2url=secondUrl||(primaryUrl||'');
      ecolP2.style.cssText='position:absolute;left:26%;top:42%;width:40%;height:46%;background-size:cover;background-position:center top;background-color:#a89070;border-radius:3px;box-shadow:0 4px 20px rgba(0,0,0,.15);z-index:4;'+(p2url?'background-image:url('+p2url+')':'');
      ecolEl.appendChild(ecolP2);
      var ecolText=document.createElement('div');
      ecolText.style.cssText='position:absolute;left:52%;right:0;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;padding:24px 18px 24px 14px;gap:10px;z-index:5;background:#f0ebe1;border-left:2px solid rgba(180,160,130,.25);';
      var ecWords=(slide.headline||'Create Your Perfect Space').split(' ');
      var ecScriptCount=Math.min(1,ecWords.length-1);
      var ecNormal=ecWords.slice(0,-ecScriptCount||undefined).join(' ');
      var ecScript=ecScriptCount?ecWords.slice(-ecScriptCount).join(' '):'';
      var ecFontSz=Math.min(24,headlineSize(slide.headline));
      var ecolH='';
      ecolH+='<div style="font-family:Georgia,\'Times New Roman\',serif;font-size:'+ecFontSz+'px;font-weight:400;line-height:1.15;color:#1a1814;margin-bottom:0;">'+esc(ecNormal)+'</div>';
      if(ecScript) ecolH+='<div style="font-family:Georgia,\'Times New Roman\',serif;font-size:'+(ecFontSz+2)+'px;font-style:italic;font-weight:400;line-height:1.1;color:#1a1814;margin-top:-4px;">'+esc(ecScript)+'</div>';
      if(slide.body) ecolH+='<div style="font-size:11px;line-height:1.7;color:#555;margin-top:6px;">'+esc(slide.body)+'</div>';
      ecolText.innerHTML=ecolH;
      ecolEl.appendChild(ecolText);
      var ecolFoot=document.createElement('div');
      ecolFoot.style.cssText='position:absolute;bottom:12px;left:14px;z-index:6;font-size:10px;font-family:'+getFont('body')+';color:#a09888;';
      ecolFoot.textContent=BRAND;
      ecolEl.appendChild(ecolFoot);
      var ecolStars=document.createElement('div');
      ecolStars.innerHTML='✽ ✽ ✽';
      ecolStars.style.cssText='position:absolute;bottom:12px;right:14px;z-index:6;font-size:14px;color:#b0a090;letter-spacing:4px;';
      ecolEl.appendChild(ecolStars);
      break;
    }

    case 'EDITORIAL_COLLAGE_3':{
      sBgImg.style.opacity='0';
      sBg.style.background='#f0ebe1';
      var ec3El=ensureContainer('sEditorialCollage');
      showLayout('sEditorialCollage');
      ec3El.innerHTML='';
      ec3El.style.cssText='position:absolute;inset:0;z-index:4;background:#f0ebe1;';
      var ec3Badge=document.createElement('div');
      ec3Badge.textContent='Page '+String(ST.cur+1).padStart(2,'0');
      ec3Badge.style.cssText='position:absolute;top:14px;left:14px;z-index:6;font-size:10px;font-family:'+getFont('body')+';color:#888;border:1px solid #b0a898;border-radius:40px;padding:3px 12px;';
      ec3El.appendChild(ec3Badge);
      var ec3Brand=document.createElement('div');
      ec3Brand.textContent='Impact Grid Group';
      ec3Brand.style.cssText='position:absolute;top:16px;right:14px;z-index:6;font-size:11px;font-family:'+getFont('body')+';color:#888;';
      ec3El.appendChild(ec3Brand);
      var ec3Num=document.createElement('div');
      ec3Num.textContent=String(ST.cur+1).padStart(2,'0');
      ec3Num.style.cssText='position:absolute;top:36px;left:12px;z-index:2;font-family:Georgia,"Times New Roman",serif;font-size:108px;font-style:italic;font-weight:700;color:#1a1814;line-height:1;opacity:.9;';
      ec3El.appendChild(ec3Num);
      var ec3Text=document.createElement('div');
      ec3Text.style.cssText='position:absolute;left:0;right:52%;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;padding:24px 14px 24px 14px;gap:8px;z-index:5;background:#f0ebe1;border-right:2px solid rgba(180,160,130,.25);';
      var ec3Words=(slide.headline||'Keep It Clean & Organised').split(' ');
      var ec3ScriptCount=Math.min(1,ec3Words.length-1);
      var ec3Normal=ec3Words.slice(0,-ec3ScriptCount||undefined).join(' ');
      var ec3Script=ec3ScriptCount?ec3Words.slice(-ec3ScriptCount).join(' '):'';
      var ec3FontSz=Math.min(22,headlineSize(slide.headline));
      var ec3H='';
      ec3H+='<div style="font-family:Georgia,\'Times New Roman\',serif;font-size:'+ec3FontSz+'px;font-weight:400;line-height:1.15;color:#1a1814;">'+esc(ec3Normal)+'</div>';
      if(ec3Script) ec3H+='<div style="font-family:Georgia,\'Times New Roman\',serif;font-size:'+(ec3FontSz+2)+'px;font-style:italic;font-weight:400;line-height:1.1;color:#1a1814;margin-top:-4px;">'+esc(ec3Script)+'</div>';
      if(slide.body) ec3H+='<div style="font-size:11px;line-height:1.7;color:#555;margin-top:6px;">'+esc(slide.body)+'</div>';
      ec3Text.innerHTML=ec3H;
      ec3El.appendChild(ec3Text);
      var imgUrls=[primaryUrl||'',secondUrl||'',thirdUrl||primaryUrl||''];
      var ec3Wide=document.createElement('div');
      ec3Wide.style.cssText='position:absolute;left:50%;right:12px;top:44px;height:46%;background-size:cover;background-position:center;background-color:#c8b89a;border-radius:3px;z-index:3;'+(imgUrls[0]?'background-image:url('+imgUrls[0]+')':'');
      ec3El.appendChild(ec3Wide);
      var ec3b1=document.createElement('div');
      ec3b1.style.cssText='position:absolute;left:50%;right:calc(26% + 8px);bottom:36px;height:44%;background-size:cover;background-position:center;background-color:#a89070;border-radius:3px;z-index:3;'+(imgUrls[1]?'background-image:url('+imgUrls[1]+')':'');
      ec3El.appendChild(ec3b1);
      var ec3b2=document.createElement('div');
      ec3b2.style.cssText='position:absolute;right:12px;width:24%;bottom:28px;height:46%;background-size:cover;background-position:center top;background-color:#8a7258;border-radius:3px;box-shadow:0 4px 16px rgba(0,0,0,.12);z-index:3;'+(imgUrls[2]?'background-image:url('+imgUrls[2]+')':'');
      ec3El.appendChild(ec3b2);
      var ec3Foot=document.createElement('div');
      ec3Foot.style.cssText='position:absolute;bottom:12px;left:12px;z-index:6;font-size:10px;font-family:'+getFont('body')+';color:#a09888;';
      ec3Foot.textContent=BRAND;
      ec3El.appendChild(ec3Foot);
      var ec3Stars=document.createElement('div');
      ec3Stars.innerHTML='✽ ✽ ✽';
      ec3Stars.style.cssText='position:absolute;bottom:12px;right:12px;z-index:6;font-size:14px;color:#b0a090;letter-spacing:4px;';
      ec3El.appendChild(ec3Stars);
      break;
    }

  } /* end switch */

  document.getElementById('sNum').textContent=(ST.cur+1)+' / '+ST.slides.length;

  /* Brand element — only show on last slide, editorial layouts handle their own */
  var brandEl=document.getElementById('sBrand');
  var editorialLayouts=['EDITORIAL_COVER','EDITORIAL_COLLAGE','EDITORIAL_COLLAGE_3','HABIT_COVER'];
  var isLastSlide=(ST.cur===ST.slides.length-1);
  if(editorialLayouts.indexOf(layout)===-1){
    brandEl.textContent = isLastSlide ? BRAND : '';
    brandEl.style.color=tc.head;
  } else {
    brandEl.textContent='';
  }

  var badge2=document.getElementById('layoutBadge');
  if(badge2) badge2.textContent=layout.replace(/_/g,' ');
  document.querySelectorAll('.layout-btn').forEach(function(btn){
    var match=btn.getAttribute('onclick')||'';
    btn.classList.toggle('active',match.indexOf("'"+layout+"'")!==-1||match.indexOf('"'+layout+'"')!==-1);
  });
  var hashSec=document.getElementById('hashtagSection');
  if(hashSec) hashSec.style.display='none'; /* hashtags shown in right panel only */
  updateThumbActive();
}

/* ─────────────────────────────────────────────────────────
   16. TEXT BUILDERS  (unchanged from v4.2)
   ───────────────────────────────────────────────────────── */
function buildFullBleedHTML(slide,tc,accent2){
  var fc='';
  if(slide.tag) fc+='<div class="s-tag" style="background:'+tc.tagBg+';color:'+tc.tagColor+';border:1px solid rgba(255,255,255,.12)">'+esc(slide.tag)+'</div>';
  fc+='<div class="s-headline" style="font-family:'+getFont('head')+';font-size:'+headlineSize(slide.headline)+'px;color:'+tc.head+'">'+esc(slide.headline)+'</div>';
  if(slide.body) fc+='<div class="s-body" style="color:'+tc.body+'">'+esc(slide.body)+'</div>';
  if(slide.cta) fc+='<div class="s-cta" style="background:'+accent2+';color:#fff">'+esc(slide.cta)+' <span>→</span></div>';
  var n=String(ST.cur+1).padStart(2,'0');
  fc+='<div class="s-giant-num" style="color:'+(tc.head==='#ffffff'?'rgba(255,255,255,.06)':'rgba(0,0,0,.05)')+'">'+n+'</div>';
  return fc;
}

function buildSplitTextHTML(slide,accent2,pText,pBg){
  var h='';
  if(slide.tag) h+='<div style="font-size:9px;font-weight:700;font-family:'+getFont('mono')+';letter-spacing:2px;text-transform:uppercase;color:'+accent2+';margin-bottom:4px">'+esc(slide.tag)+'</div>';
  h+='<div style="font-family:'+getFont('head')+';font-size:'+Math.min(26,headlineSize(slide.headline))+'px;font-weight:800;line-height:1.2;color:'+pText+';margin-bottom:6px">'+esc(slide.headline)+'</div>';
  if(slide.body) h+='<div style="font-size:12px;line-height:1.65;color:'+pText+';opacity:.75;margin-bottom:8px">'+esc(slide.body)+'</div>';
  if(slide.cta) h+='<div style="display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:8px;font-size:11px;font-weight:700;font-family:'+getFont('head')+';background:'+accent2+';color:'+pBg+';width:fit-content">'+esc(slide.cta)+' →</div>';
  return h;
}

function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

/* ─────────────────────────────────────────────────────────
   17. STRIP BUILDER  (unchanged from v4.2)
   ───────────────────────────────────────────────────────── */
function buildStrip(){
  var strip=document.getElementById('strip');
  strip.innerHTML=ST.slides.map(function(s,i){
    var theme=ST.theme||'lifestyle';
    var T=DA[theme];
    var imgUrl=ST.userImages[i]||(s.primaryImage?s.primaryImage.url.replace('w=1080&h=1080','w=120&h=120'):null);
    if(!imgUrl){var a=pickAsset(theme,s.type,i,ST.assetOffset);if(a) imgUrl=a.url.replace('w=1080&h=1080','w=120&h=120');}
    var col=T.palette[0];
    var html='<div class="sthumb '+(i===ST.cur?'active':'')+'" onclick="goTo('+i+')" title="Slide '+(i+1)+'">';
    if(imgUrl) html+='<img class="sthumb-img" src="'+imgUrl+'" alt="" loading="lazy"/>';
    else html+='<div style="width:100%;height:100%;background:'+col+'"></div>';
    html+='<div class="sthumb-num" style="color:#fff;text-shadow:0 1px 5px rgba(0,0,0,.7);font-size:11px">'+(i+1)+'</div>';
    html+='</div>';
    return html;
  }).join('');
}

function updateThumbActive(){
  document.querySelectorAll('.sthumb').forEach(function(el,i){el.classList.toggle('active',i===ST.cur);});
}

/* ─────────────────────────────────────────────────────────
   18. NAVIGATION  (unchanged from v4.2)
   ───────────────────────────────────────────────────────── */
function goTo(idx){ST.cur=idx;renderSlide();updateCounter();fillEdit();}
function prevSlide(){if(ST.cur>0) goTo(ST.cur-1);}
function nextSlide(){if(ST.cur<ST.slides.length-1) goTo(ST.cur+1);}
function updateCounter(){document.getElementById('slideCtr').textContent=ST.slides.length?(ST.cur+1)+' / '+ST.slides.length:'0 / 0';}
function chgCount(d){ST.count=Math.max(3,Math.min(12,ST.count+d));document.getElementById('cntVal').textContent=ST.count;}
function prefill(t){document.getElementById('topicInput').value=t;onTopicInput();}
function zoom(d){ST.zoom=Math.max(40,Math.min(150,ST.zoom+d));document.getElementById('zoomLbl').textContent=ST.zoom+'%';document.getElementById('slideCanvas').style.transform='scale('+ST.zoom/100+')';}
function setFmt(f){ST.format=f;['square','portrait','landscape'].forEach(function(x){document.getElementById('fmt'+x.charAt(0).toUpperCase()+x.slice(1)).classList.toggle('on',x===f);});var c=document.getElementById('slideCanvas');c.className='slide-canvas'+(f!=='square'?' '+f:'');}
function shuffleAssets(){ST.assetOffset=(ST.assetOffset+1)%10;buildStrip();renderSlide();toast('🔀 New assets selected');}

/* ─────────────────────────────────────────────────────────
   19. EDIT PANEL  (unchanged from v4.2)
   ───────────────────────────────────────────────────────── */
function fillEdit(){
  if(!ST.slides.length) return;
  var s=ST.slides[ST.cur];
  var headEl=document.getElementById('eHead');
  var bodyEl=document.getElementById('eBody');
  if(headEl) headEl.value=s.headline||'';
  if(bodyEl) bodyEl.value=s.body||s.subline||'';
  document.getElementById('eCap').value=s.caption||'';
  document.getElementById('editNum').textContent='Slide '+(ST.cur+1);
  var badge=document.getElementById('layoutBadge');
  if(badge) badge.textContent=(s.layout||'').replace(/_/g,' ');
  var statSec=document.getElementById('eStatSection');
  var quoteSec=document.getElementById('eQuoteSection');
  if(statSec) statSec.style.display=(s.layout==='STAT_HERO')?'flex':'none';
  if(quoteSec) quoteSec.style.display=(s.layout==='QUOTE_PULL')?'flex':'none';
  var statInput=document.getElementById('eStat');
  if(statInput) statInput.value=s.stat||'';
  var quoteInput=document.getElementById('eQuote');
  if(quoteInput) quoteInput.value=s.quote||'';
}

function liveEdit(){
  if(!ST.slides.length) return;
  var headEl=document.getElementById('eHead');
  var bodyEl=document.getElementById('eBody');
  if(headEl) ST.slides[ST.cur].headline=headEl.value;
  if(bodyEl) ST.slides[ST.cur].body=bodyEl.value;
  renderSlide();
}

function liveEditStat(){
  if(!ST.slides.length) return;
  var statInput=document.getElementById('eStat');
  if(statInput) ST.slides[ST.cur].stat=statInput.value;
  renderSlide();
}

function liveEditQuote(){
  if(!ST.slides.length) return;
  var quoteInput=document.getElementById('eQuote');
  if(quoteInput) ST.slides[ST.cur].quote=quoteInput.value;
  renderSlide();
}

function updateCap(){if(!ST.slides.length) return;ST.slides[ST.cur].caption=document.getElementById('eCap').value;}
function updateBrand(){/* brand is hardcoded — this is a no-op */}

function changeLayout(newLayout){
  if(!ST.slides.length) return;
  var blocked=['SPLIT_LEFT','SPLIT_RIGHT','CORNER_FLOAT','GRID_POINTS','MAGAZINE_SPLIT','HABIT_SLIDE'];
  if(blocked.indexOf(newLayout)!==-1){toast('Layout unavailable');return;}
  var applyAll=document.getElementById('applyAllToggle');
  if(applyAll&&applyAll.checked){
    ST.slides.forEach(function(s){s.layout=newLayout;});
    buildStrip();renderSlide();fillEdit();
    toast('Layout → '+newLayout.replace(/_/g,' ')+' · all slides');
  } else {
    ST.slides[ST.cur].layout=newLayout;
    renderSlide();fillEdit();
    toast('Layout → '+newLayout.replace(/_/g,' '));
  }
}

function setFontPair(pair){
  ST.fontPair=pair;
  document.querySelectorAll('.font-btn').forEach(function(b){b.classList.toggle('active',b.dataset.pair===pair);});
  if(ST.slides.length) renderSlide();
  toast('Font → '+pair);
}

/* ─────────────────────────────────────────────────────────
   20. IMAGE UPLOAD  (unchanged from v4.2)
   ───────────────────────────────────────────────────────── */
function handleUpload(e){var f=e.target.files[0];if(!f) return;var r=new FileReader();r.onload=function(ev){ST.userImages[ST.cur]=ev.target.result;renderSlide();buildStrip();toast('🖼️ Image added to slide '+(ST.cur+1));};r.readAsDataURL(f);}
function dzOver(e){e.preventDefault();document.getElementById('dzone').classList.add('over');}
function dzLeave(){document.getElementById('dzone').classList.remove('over');}
function dzDrop(e){e.preventDefault();document.getElementById('dzone').classList.remove('over');var f=e.dataTransfer.files[0];if(!f||!f.type.startsWith('image/')) return;var r=new FileReader();r.onload=function(ev){ST.userImages[ST.cur]=ev.target.result;renderSlide();buildStrip();toast('🖼️ Image dropped on slide '+(ST.cur+1));};r.readAsDataURL(f);}

/* ─────────────────────────────────────────────────────────
   21. ACCENT / FONT / THEME  (unchanged from v4.2)
   ───────────────────────────────────────────────────────── */
function setAccent(c,el){ST.accent=c;document.querySelectorAll('.cdot').forEach(function(d){d.classList.remove('on');});el.classList.add('on');if(ST.slides.length) renderSlide();}
function toggleTheme(){var isDark=document.documentElement.getAttribute('data-theme')==='dark';document.documentElement.setAttribute('data-theme',isDark?'light':'dark');document.querySelector('[onclick="toggleTheme()"]').textContent=isDark?'🌙':'☀️';}

/* ─────────────────────────────────────────────────────────
   22. COPY & EXPORT  (unchanged from v4.2)
   ───────────────────────────────────────────────────────── */
function copyCaption(){
  var c=document.getElementById('eCap').value;
  if(!c){toast('No caption on this slide');return;}
  navigator.clipboard.writeText(c).then(function(){toast('✓ Caption copied');});
}

function copyAll(){
  if(!ST.slides.length){toast('Generate a carousel first');return;}
  var all=ST.slides.map(function(s,i){
    return '── SLIDE '+(i+1)+' ──\nHeadline: '+(s.headline||'')+'\nBody: '+(s.body||'')+'\n\nCaption:\n'+(s.caption||'');
  }).join('\n\n');
  navigator.clipboard.writeText(all).then(function(){toast('✓ All copy + captions copied');});
}

function openExport(){document.getElementById('exportModal').classList.add('show');}
function closeExport(){document.getElementById('exportModal').classList.remove('show');}
function selExport(t){ST.exportType=t;['png','copy','json','video'].forEach(function(x){var el=document.getElementById('eo'+x.charAt(0).toUpperCase()+x.slice(1));if(el)el.classList.toggle('sel',x===t);});}

function doExport(){
  closeExport();
  if(ST.exportType==='copy'){copyAll();}
  else if(ST.exportType==='json'){
    var j=JSON.stringify({
      slides:ST.slides.map(function(s){return{headline:s.headline,body:s.body,caption:s.caption,layout:s.layout,type:s.type,beat:s.beat};}),
      theme:ST.theme,accentColor:ST.accent,fontPair:ST.fontPair,
      platform:document.getElementById('platSelect').value,
      brand:BRAND,generatedAt:new Date().toISOString()
    },null,2);
    var b=new Blob([j],{type:'application/json'});
    triggerBlobDownload(b,'carousel-data.json');
    toast('✓ JSON exported');
  } else if(ST.exportType==='png'){
    exportSlidesAsPNG();
  } else if(ST.exportType==='video'){
    toast('📹 MP4 export coming soon — screenshot each slide for now.');
  }
}

function exportSlidesAsPNG(){
  if(typeof html2canvas==='undefined'){
    toast('💡 html2canvas not loaded — use JSON or screenshot each slide.');
    return;
  }
  var canvas=document.getElementById('slideCanvas');
  toast('📸 Capturing slide '+(ST.cur+1)+'…');
  html2canvas(canvas,{useCORS:true,allowTaint:false,scale:2,backgroundColor:null}).then(function(c){
    c.toBlob(function(blob){
      triggerBlobDownload(blob,'ImpactGrid-slide-'+(ST.cur+1)+'.png');
      toast('✓ Slide '+(ST.cur+1)+' saved');
    },'image/png');
  }).catch(function(err){
    console.warn('html2canvas error:',err);
    toast('💡 Screenshot this slide — PNG capture needs HTTPS');
  });
}

function triggerBlobDownload(blob,filename){
  try{
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');
    a.href=url;a.download=filename;
    a.style.cssText='position:fixed;top:-100px;left:-100px;opacity:0;pointer-events:none;';
    document.body.appendChild(a);a.click();
    setTimeout(function(){document.body.removeChild(a);URL.revokeObjectURL(url);},2500);
  }catch(e){toast('⚠️ Download failed — try Copy or JSON');}
}

/* ─────────────────────────────────────────────────────────
   23. TOAST  (unchanged from v4.2)
   ───────────────────────────────────────────────────────── */
function toast(msg){
  var shelf=document.getElementById('toastShelf');
  var el=document.createElement('div');el.className='toast';el.textContent=msg;
  shelf.appendChild(el);
  setTimeout(function(){el.remove();},3400);
}

/* ─────────────────────────────────────────────────────────
   24. KEYBOARD  (unchanged from v4.2)
   ───────────────────────────────────────────────────────── */
document.addEventListener('keydown',function(e){
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA') return;
  if(e.key==='ArrowRight'||e.key==='ArrowDown') nextSlide();
  if(e.key==='ArrowLeft'||e.key==='ArrowUp') prevSlide();
  if(e.key==='Escape') closeExport();
});

/* ─────────────────────────────────────────────────────────
   25. INIT
   ───────────────────────────────────────────────────────── */
(function init(){
  /* Hardcode brand — never changes, never taken from input */
  ST.brand = BRAND;
  ST.accent = '#f5e400'; /* IG yellow */

  updateCounter();

  /* Inject SEO strip into the toolbar row */
  (function injectSEOStrip(){
    var toolbar = document.querySelector('.toolbar');
    if(!toolbar) return;
    var strip = document.createElement('div');
    strip.id = 'seo-strip';
    strip.style.cssText = [
      'display:none',
      'align-items:center',
      'gap:10px',
      'padding:5px 14px',
      'background:var(--surface)',
      'border-bottom:1px solid var(--border)',
      'font-size:11px',
      'color:var(--text2)',
      'flex-shrink:0',
      'overflow:hidden'
    ].join(';');
    toolbar.insertAdjacentElement('afterend', strip);
  })();

  /* Inject trend chip bar below the panel header */
  (function injectTrendBar(){
    var pb = document.querySelector('.ph');
    if(!pb) return;
    var bar = document.createElement('div');
    bar.id = 'tbar';
    bar.style.cssText = [
      'display:flex',
      'align-items:center',
      'gap:6px',
      'padding:8px 16px',
      'overflow-x:auto',
      'flex-shrink:0',
      'scrollbar-width:none',
      'border-bottom:1px solid rgba(245,228,0,.08)'
    ].join(';');
    bar.style.msOverflowStyle = 'none';
    pb.insertAdjacentElement('afterend', bar);
    loadTrendChips();
  })();

})();
