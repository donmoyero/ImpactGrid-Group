/* ═══════════════════════════════════════════════════════════
   IMPACTGRID — Carousel Studio
   carousel-studio.js  v4.0

   Sections:
   1.  Asset library (DA)
   2.  Theme detection
   3.  Asset picking & overlay helpers
   4.  Layout assignment
   5.  State
   6.  Topic input → intel detection
   7.  AI generation (callAI → server, fallback)
   8.  Slide parsing
   9.  Render engine
       - FULL_BLEED, SPLIT_LEFT/RIGHT, CORNER_FLOAT, DUAL_IMAGE
       - OVERLAP_BAND, BOTTOM_STRIP, TOP_STRIP, MAGAZINE_SPLIT
       - STAT_HERO, QUOTE_PULL, GRID_POINTS
       - EDITORIAL_COVER, EDITORIAL_COLLAGE, EDITORIAL_COLLAGE_3  (Salford & Co. — v4 pixel-accurate)
       - HABIT_COVER, HABIT_SLIDE  (Thynk Unlimited — v4 pixel-accurate)
   10. Strip builder
   11. Navigation
   12. Edit panel
   13. Image upload
   14. Accent / brand / theme
   15. Copy & Export
   16. Toast
   17. Keyboard
   18. Init
   ═══════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────
   1. ASSET LIBRARY
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
   2. THEME DETECTION
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
   3. ASSET PICKING & OVERLAY HELPERS
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
  if(layout==='SPLIT_LEFT'||layout==='SPLIT_RIGHT'||layout==='MAGAZINE_SPLIT') return 'none';
  if(['EDITORIAL_COLLAGE','EDITORIAL_COLLAGE_3','STAT_HERO','QUOTE_PULL','GRID_POINTS'].indexOf(layout)!==-1) return 'none';
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
   4. LAYOUT ASSIGNMENT
   ───────────────────────────────────────────────────────── */
var LAYOUT_SEQUENCE = [
  'FULL_BLEED','SPLIT_LEFT','CORNER_FLOAT','OVERLAP_BAND','SPLIT_RIGHT',
  'BOTTOM_STRIP','STAT_HERO','QUOTE_PULL','DUAL_IMAGE','GRID_POINTS',
  'TOP_STRIP','MAGAZINE_SPLIT',
  'EDITORIAL_COVER','EDITORIAL_COLLAGE','EDITORIAL_COLLAGE_3',
  'HABIT_COVER','HABIT_SLIDE'
];

function assignLayout(slideType,idx,total){
  var sets={
    hook:['FULL_BLEED','CORNER_FLOAT','OVERLAP_BAND','EDITORIAL_COVER','HABIT_COVER'],
    cta:['SPLIT_RIGHT','CORNER_FLOAT','FULL_BLEED'],
    stat:['STAT_HERO','SPLIT_RIGHT','SPLIT_LEFT'],
    value:['SPLIT_LEFT','FULL_BLEED','CORNER_FLOAT','SPLIT_RIGHT','OVERLAP_BAND','BOTTOM_STRIP','EDITORIAL_COLLAGE'],
    insight:['OVERLAP_BAND','SPLIT_RIGHT','FULL_BLEED','TOP_STRIP','HABIT_SLIDE'],
    lesson:['SPLIT_LEFT','BOTTOM_STRIP','FULL_BLEED','MAGAZINE_SPLIT','EDITORIAL_COLLAGE_3'],
    proof:['SPLIT_RIGHT','DUAL_IMAGE','CORNER_FLOAT'],
    quote:['QUOTE_PULL','FULL_BLEED'],
    story:['FULL_BLEED','CORNER_FLOAT','TOP_STRIP'],
    problem:['FULL_BLEED','OVERLAP_BAND','SPLIT_LEFT'],
    list:['GRID_POINTS','SPLIT_LEFT','BOTTOM_STRIP','EDITORIAL_COLLAGE_3'],
    tip:['SPLIT_LEFT','CORNER_FLOAT','OVERLAP_BAND','BOTTOM_STRIP','HABIT_SLIDE']
  };
  var set=sets[slideType]||LAYOUT_SEQUENCE;
  return set[idx%set.length];
}

function headlineSize(text){
  var l=(text||'').length;
  if(l<20) return 38; if(l<30) return 33; if(l<45) return 28; if(l<60) return 24; return 20;
}

/* ─────────────────────────────────────────────────────────
   5. STATE
   ───────────────────────────────────────────────────────── */
var ST={slides:[],cur:0,count:7,theme:null,zoom:100,format:'square',accent:'#2563eb',brand:'',userImages:{},assetOffset:0,exportType:'png',fontPair:'syne'};

/* Font pairs */
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
   6. TOPIC INPUT → INTEL DETECTION
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
  document.getElementById('intelLbl').textContent='THEME DETECTED';
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
   7. AI GENERATION
   ───────────────────────────────────────────────────────── */
var DIJO_SERVER='https://impactgrid-dijo.onrender.com';

async function generate(){
  var topic=document.getElementById('topicInput').value.trim();
  if(!topic){toast('⚠️ Add a topic first');document.getElementById('topicInput').focus();return;}
  if(!ST.theme) ST.theme=detectTheme(topic);
  var platform=document.getElementById('platSelect').value;
  var tone=document.getElementById('toneSelect').value;
  var count=ST.count;
  var btn=document.getElementById('genBtn');
  btn.innerHTML='<div class="spin"></div> Generating…';btn.disabled=true;
  document.getElementById('emptyState').style.display='none';
  document.getElementById('slideWrap').style.display='block';
  document.getElementById('loadingOv').classList.add('show');
  var hints=['Detecting theme…','Scoring images with AI vision…','Writing copy & hashtags…','Designing layouts…','Polishing your carousel…'];
  var hi=0,hTimer=setInterval(function(){hi=(hi+1)%hints.length;document.getElementById('loadingHint').textContent=hints[hi];},1800);
  try{
    var data=await callAI(topic,platform,tone,count);
    ST.slides=parseServerSlides(data,topic,platform,tone,count);
    if(data.theme&&DA[data.theme]) ST.theme=data.theme;
    if(data.accentColor) ST.accent=data.accentColor;
    document.querySelectorAll('.cdot').forEach(function(d){d.classList.remove('on');});
  }catch(e){
    console.warn('[Carousel] Server error, using fallback:',e);
    ST.slides=fallbackSlides(topic,platform,tone,count);
    toast('⚡ Generated offline — server busy');
  }
  clearInterval(hTimer);
  document.getElementById('loadingOv').classList.remove('show');
  ST.cur=0;
  buildStrip();renderSlide();updateCounter();fillEdit();
  btn.innerHTML='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Regenerate';
  btn.disabled=false;
  toast('✦ '+ST.slides.length+'-slide carousel · '+DA[ST.theme].label+' · tap any slide to edit');
}

async function callAI(topic,platform,tone,count){
  var res=await fetch(DIJO_SERVER+'/carousel/generate',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({topic:topic,platform:platform,tone:tone,count:count,themeOverride:ST.theme||null})
  });
  if(!res.ok) throw new Error('Server responded '+res.status);
  return await res.json();
}

/* ─────────────────────────────────────────────────────────
   8. SLIDE PARSING
   ───────────────────────────────────────────────────────── */
function parseServerSlides(data,topic,platform,tone,count){
  try{
    if(!data.slides||!Array.isArray(data.slides)) throw new Error('no slides');
    var total=data.slides.length;
    return data.slides.map(function(sl,i){
      var primaryImage=null;
      if(sl.image) primaryImage={url:sl.image,tone:sl.imageMood||'neutral',brightness:'medium'};
      else if(sl.primaryImage) primaryImage=sl.primaryImage;
      var secondImage=null;
      if(sl.image2) secondImage={url:sl.image2,tone:'neutral',brightness:'medium'};
      else if(sl.secondImage) secondImage=sl.secondImage;
      var rawLayout=sl.aiLayout||sl.layout||'';
      var layout=LAYOUT_SEQUENCE.indexOf(rawLayout)!==-1?rawLayout:assignLayout(sl.type||'value',i,total);
      var headline=sl.headline||sl.title||'';
      if(!headline||headline.length<3){
        headline=i===0?'Everything changes when you know this':i===total-1?'Ready to take action?':'Slide '+(i+1)+': '+topic;
      }
      var body=sl.body||sl.subline||sl.description||'';
      var caption=sl.caption||buildCaption(sl,i,data.trendHashtags||[]);
      var hashtags=sl.hashtags||data.trendHashtags||[];
      return {
        type:sl.type||(i===0?'hook':i===total-1?'cta':'value'),
        layout:layout,
        tag:sl.tag||String(i+1).padStart(2,'0'),
        headline:headline,
        subline:sl.subline||'',
        body:body,
        stat:sl.stat||null,
        quote:sl.quote||null,
        points:sl.points||null,
        gridPoints:sl.gridPoints||(sl.points?sl.points.map(function(p,pi){
          var glyphs=['→','★','◆','✦','●','▲'];
          return {glyph:glyphs[pi%glyphs.length],text:p};
        }):null),
        cta:sl.cta||'',
        caption:caption,
        hashtags:Array.isArray(hashtags)?hashtags.slice(0,8):[],
        primaryImage:primaryImage,
        secondImage:secondImage,
        video:sl.video||null,
        useVideo:!!(sl.video&&sl.video.url)
      };
    });
  }catch(e){
    console.warn('[parseServerSlides] Error:',e.message);
    return fallbackSlides(topic,platform,tone,count);
  }
}

function buildCaption(sl,idx,trendTags){
  if(sl.caption) return sl.caption;
  var tags=(sl.hashtags&&sl.hashtags.length?sl.hashtags:trendTags||[]).join(' ');
  var base=(sl.headline||'')+(sl.body?'\n\n'+sl.body:'')+'\n\n'+tags;
  return base.trim();
}

function fallbackSlides(topic,platform,tone,count){
  var hooks=['Nobody talks about this — but it changed everything.','I spent years getting this wrong. Here\'s the truth.','Most people skip this. That\'s why they struggle.','One shift. Everything clicks.'];
  var hook=hooks[Math.floor(Math.random()*hooks.length)];
  var vals=[
    {type:'value',headline:'The problem nobody admits',body:'Most people focus on the wrong thing entirely. Here\'s what actually moves the needle.',layout:'SPLIT_LEFT'},
    {type:'insight',headline:'The shift that changes everything',body:'Once you understand this, you can\'t go back.',layout:'OVERLAP_BAND'},
    {type:'stat',headline:'The numbers don\'t lie',body:'Creators who do this consistently outperform those who don\'t.',layout:'STAT_HERO',stat:'87%'},
    {type:'quote',headline:'',body:'',quote:'The secret was never the strategy. It was the consistency.',layout:'QUOTE_PULL'},
    {type:'lesson',headline:'What I wish I\'d known sooner',body:'Three years in, I finally understood this.',layout:'BOTTOM_STRIP'},
    {type:'proof',headline:'Here\'s what happened next',body:'The results weren\'t overnight. But they were real.',layout:'DUAL_IMAGE'},
    {type:'list',headline:'Four things to do today',body:'',layout:'GRID_POINTS',gridPoints:[{glyph:'→',text:'Start before you\'re ready'},{glyph:'★',text:'Ship consistently'},{glyph:'◆',text:'Study what works'},{glyph:'✦',text:'Double down fast'}]},
    {type:'value',headline:'The counterintuitive truth',body:'Everything you\'ve been told is backwards.',layout:'CORNER_FLOAT'},
    {type:'insight',headline:'Nobody will tell you this',body:'It\'s not about working harder. Order matters.',layout:'SPLIT_RIGHT'},
    {type:'tip',headline:'Start here, not there',body:'This single action creates the most momentum.',layout:'TOP_STRIP'}
  ];
  var slides=[{type:'hook',tag:'01',headline:hook,body:'Swipe through — breaking it all down. →',cta:'',layout:'FULL_BLEED',caption:hook+'\n\nSave this — you\'ll want it.\n\n#contentcreator #growthmindset #creatoreconomy',hashtags:['#contentcreator','#growthmindset','#creatoreconomy','#digitalmarketing','#socialmediatips']}];
  for(var i=1;i<count-1;i++){
    var v=vals[(i-1)%vals.length];
    slides.push({type:v.type,tag:String(i+1).padStart(2,'0'),headline:v.headline,body:v.body,cta:'',layout:v.layout,stat:v.stat||null,quote:v.quote||null,gridPoints:v.gridPoints||null,caption:'',hashtags:[]});
  }
  slides.push({type:'cta',tag:String(count).padStart(2,'0'),headline:'Ready to make this real?',body:'Follow for more. Save this post.',cta:'Follow for more →',layout:'SPLIT_RIGHT',caption:'Which slide hit hardest? Drop a number 👇\n\n#contentcreator #growthmindset #creatoreconomy',hashtags:['#contentcreator','#growthmindset','#creatoreconomy']});
  return slides.slice(0,count);
}

/* ─────────────────────────────────────────────────────────
   9. RENDER ENGINE
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

  /* Video background */
  var videoData=slide.video||null;
  var useVideo=videoData&&videoData.url&&(layout==='FULL_BLEED'||layout==='OVERLAP_BAND'||layout==='HABIT_COVER'||layout==='HABIT_SLIDE');
  if(useVideo){
    sBgImg.style.opacity='0';
    sVideo.innerHTML='<video autoplay muted loop playsinline style="width:100%;height:100%;object-fit:cover;opacity:.85"><source src="'+videoData.url+'" type="video/mp4"></video>';
    sVideo.style.display='block';
    sBg.style.background='#111';
  } else {
    sVideo.innerHTML='';sVideo.style.display='none';
    var needsBg=['FULL_BLEED','CORNER_FLOAT','DUAL_IMAGE','OVERLAP_BAND','TOP_STRIP','BOTTOM_STRIP',
                 'EDITORIAL_COVER','HABIT_COVER','HABIT_SLIDE'].indexOf(layout)!==-1;
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

  /* ════════════════════════════════════════════════════════
     RENDER EACH LAYOUT
  ════════════════════════════════════════════════════════ */
  switch(layout){

    case 'FULL_BLEED':
    default:{
      var sContent=document.getElementById('sContent');
      showLayout('sContent');
      sContent.className='s-content '+(slide.type==='hook'||slide.type==='quote'?'layout-center':'layout-bottom');
      sContent.innerHTML=buildFullBleedHTML(slide,tc,accent2);
      break;
    }

    case 'SPLIT_LEFT':{
      sBgImg.style.opacity='0'; sBg.style.background=T.palette[0];
      showLayout('sSplit');
      var sSplit=document.getElementById('sSplit');
      sSplit.className='s-split-wrap'; sSplit.style.gridTemplateColumns='1fr 1fr';
      var si=document.getElementById('sSplitImg'); var st=document.getElementById('sSplitText');
      if(primaryUrl){si.style.backgroundImage='url('+primaryUrl+')';si.style.backgroundSize='cover';si.style.backgroundPosition='center';}
      else{si.style.background=T.palette[1];}
      si.style.order='2'; st.style.order='1';
      st.style.cssText='display:flex;flex-direction:column;justify-content:center;padding:32px 28px;gap:10px;background:'+pBg+';color:'+pText;
      st.innerHTML=buildSplitTextHTML(slide,accent2,pText,pBg);
      break;
    }

    case 'SPLIT_RIGHT':{
      sBgImg.style.opacity='0'; sBg.style.background=T.palette[0];
      showLayout('sSplit');
      var sSplit2=document.getElementById('sSplit');
      sSplit2.className='s-split-wrap'; sSplit2.style.gridTemplateColumns='1fr 1fr';
      var si2=document.getElementById('sSplitImg'); var st2=document.getElementById('sSplitText');
      if(primaryUrl){si2.style.backgroundImage='url('+primaryUrl+')';si2.style.backgroundSize='cover';si2.style.backgroundPosition='center';}
      else{si2.style.background=T.palette[1];}
      si2.style.order='1'; st2.style.order='2';
      st2.style.cssText='display:flex;flex-direction:column;justify-content:center;padding:32px 28px;gap:10px;background:'+pBg+';color:'+pText;
      st2.innerHTML=buildSplitTextHTML(slide,accent2,pText,pBg);
      break;
    }

    case 'CORNER_FLOAT':{
      showLayout('sCorner');
      var sCorner=document.getElementById('sCorner');
      sCorner.className='s-corner-float';
      var cImg=document.getElementById('sCornerImg');
      var cText=document.getElementById('sCornerText');
      if(cImg&&primaryUrl) cImg.innerHTML='<img src="'+primaryUrl+'" alt="" style="width:100%;height:100%;object-fit:cover;display:block;"/>';
      if(cText){
        var ch='';
        if(slide.tag) ch+='<div style="font-size:9px;font-weight:700;font-family:'+getFont('mono')+';letter-spacing:2.5px;text-transform:uppercase;color:'+accent2+';margin-bottom:10px">'+esc(slide.tag)+'</div>';
        ch+='<div style="font-family:'+getFont('head')+';font-size:'+headlineSize(slide.headline)+'px;font-weight:800;line-height:1.15;color:'+tc.head+';text-shadow:0 2px 16px rgba(0,0,0,.5);margin-bottom:10px">'+esc(slide.headline)+'</div>';
        if(slide.body) ch+='<div style="font-size:13px;line-height:1.6;color:'+tc.body+';margin-bottom:10px">'+esc(slide.body)+'</div>';
        if(slide.cta) ch+='<div style="display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:8px;font-size:11px;font-weight:700;font-family:'+getFont('head')+';background:'+accent2+';color:#fff;width:fit-content">'+esc(slide.cta)+' →</div>';
        cText.innerHTML=ch;
      }
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

    case 'MAGAZINE_SPLIT':{
      sBgImg.style.opacity='0'; sBg.style.background=T.palette[0];
      showLayout('sSplit');
      var msSplit=document.getElementById('sSplit');
      msSplit.className='s-split-wrap'; msSplit.style.gridTemplateColumns='45% 55%';
      var msImg=document.getElementById('sSplitImg'); var msText=document.getElementById('sSplitText');
      if(primaryUrl){msImg.style.backgroundImage='url('+primaryUrl+')';msImg.style.backgroundSize='cover';msImg.style.backgroundPosition='center';}
      else{msImg.style.background=T.palette[1];}
      msImg.style.order='2'; msText.style.order='1';
      msText.style.cssText='display:flex;flex-direction:column;justify-content:center;padding:28px 22px;gap:8px;background:'+pBg+';color:'+pText+';border-right:3px solid '+accent2;
      var mgh='';
      if(slide.tag) mgh+='<div style="font-size:8px;font-weight:700;font-family:'+getFont('mono')+';letter-spacing:3px;text-transform:uppercase;color:'+accent2+';margin-bottom:4px">'+esc(slide.tag)+'</div>';
      mgh+='<div style="font-family:'+getFont('head')+';font-size:'+Math.min(22,headlineSize(slide.headline))+'px;font-weight:800;line-height:1.2;color:'+pText+';margin-bottom:6px">'+esc(slide.headline)+'</div>';
      if(slide.body) mgh+='<div style="font-size:11px;line-height:1.65;color:'+pText+';opacity:.75;margin-bottom:8px">'+esc(slide.body)+'</div>';
      msText.innerHTML=mgh;
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
      sBgImg.style.opacity='0'; sBg.style.background=T.palette[0];
      showLayout('sQuote');
      var sQuote=document.getElementById('sQuote');
      sQuote.className='s-quote-wrap'; sQuote.style.background=T.palette[0];
      var qColor=(['minimal','cozy-home','health'].indexOf(theme)!==-1)?T.textColors.primary:'#f0ede8';
      var qText=slide.quote||slide.headline||'';
      var qh='<div class="s-quote-marks" style="color:'+accent2+'">"</div>';
      qh+='<div class="s-quote-text" style="font-family:'+getFont('head')+';color:'+qColor+';font-size:'+Math.min(22,headlineSize(qText))+'px">'+esc(qText)+'</div>';
      if(slide.tag) qh+='<div class="s-quote-attr" style="color:'+accent2+'">'+esc(slide.tag)+'</div>';
      if(slide.body&&!slide.quote) qh+='<div style="font-size:12px;color:'+qColor+';opacity:.65;margin-top:6px">'+esc(slide.body)+'</div>';
      sQuote.innerHTML=qh;
      break;
    }

    case 'GRID_POINTS':{
      sBgImg.style.opacity='0'; sBg.style.background=T.palette[0];
      showLayout('sGrid');
      var sGrid=document.getElementById('sGrid');
      sGrid.className='s-grid-wrap'; sGrid.style.background=T.palette[0];
      var gColor=(['minimal','cozy-home','health'].indexOf(theme)!==-1)?T.textColors.primary:'#f0ede8';
      var pts=slide.gridPoints||[{glyph:'→',text:'First point'},{glyph:'★',text:'Second point'},{glyph:'◆',text:'Third point'},{glyph:'✦',text:'Fourth point'}];
      var gh='';
      if(slide.tag) gh+='<div style="font-size:9px;font-weight:700;font-family:'+getFont('mono')+';letter-spacing:2.5px;text-transform:uppercase;color:'+accent2+';margin-bottom:4px">'+esc(slide.tag)+'</div>';
      gh+='<div class="s-grid-header" style="font-family:'+getFont('head')+';color:'+gColor+'">'+esc(slide.headline)+'</div>';
      if(slide.body) gh+='<div style="font-size:11px;color:'+gColor+';opacity:.65;margin-top:-6px;margin-bottom:4px">'+esc(slide.body)+'</div>';
      gh+='<div class="s-grid-points">';
      pts.forEach(function(p){
        gh+='<div class="s-grid-point" style="background:rgba(128,128,128,.1)">';
        gh+='<div class="s-grid-glyph" style="color:'+accent2+'">'+esc(p.glyph||'→')+'</div>';
        gh+='<div class="s-grid-ptxt" style="color:'+gColor+'">'+esc(p.text||p)+'</div>';
        gh+='</div>';
      });
      gh+='</div>';
      sGrid.innerHTML=gh;
      break;
    }

    /* ══════════════════════════════════════════════════════
       THYNK UNLIMITED — HABIT_COVER  (v4 pixel-accurate)
       Full-bleed moody photo · thin hairline top bar with brand + handle
       Giant bold yellow/accent display title (mid-left, 2–3 lines)
       Italic serif subtitle below title · Decorative swirl arrow SVG
       Bottom bar: URL left · SLIDE 0X right
    ══════════════════════════════════════════════════════ */
    case 'HABIT_COVER':{
      /* bg image shows through from sBgImg */
      var hcEl=ensureContainer('sHabitCover');
      showLayout('sHabitCover');
      hcEl.innerHTML='';
      hcEl.style.cssText='position:absolute;inset:0;z-index:4;';

      /* Dark tint — moody, not black */
      var hcOv=document.createElement('div');
      hcOv.style.cssText='position:absolute;inset:0;background:rgba(8,8,6,.38);z-index:1;pointer-events:none;';
      hcEl.appendChild(hcOv);

      /* Top hairline bar */
      var hcTop=document.createElement('div');
      hcTop.style.cssText='position:absolute;top:0;left:0;right:0;z-index:2;padding:12px 18px;display:flex;justify-content:space-between;align-items:center;border-bottom:0.5px solid rgba(255,255,255,.22);';
      hcTop.innerHTML='<span style="font-size:9px;font-weight:700;font-family:'+getFont('mono')+';color:rgba(255,255,255,.82);letter-spacing:.14em;text-transform:uppercase;">'+(ST.brand?ST.brand.toUpperCase():'THYNK UNLIMITED')+'</span>'
        +'<span style="font-size:9px;font-weight:700;font-family:'+getFont('mono')+';color:rgba(255,255,255,.82);letter-spacing:.14em;text-transform:uppercase;">@'+(ST.brand?ST.brand.toLowerCase().replace(/\s+/g,''):'REALLYGREATSITE')+'</span>';
      hcEl.appendChild(hcTop);

      /* Main title block — left-aligned, mid-to-bottom */
      var hcTitle=document.createElement('div');
      hcTitle.style.cssText='position:absolute;left:16px;right:16px;bottom:80px;z-index:2;';

      /* Split headline into words for big display */
      var words=(slide.headline||'Habits That Changed My Life').split(' ');
      var mid=Math.ceil(words.length/2);
      var line1=words.slice(0,mid).join(' ');
      var line2=words.slice(mid).join(' ');
      var titleFontSize=Math.min(72,Math.max(42,Math.round(560/Math.max(slide.headline.length,6))));

      hcTitle.innerHTML=
        '<div style="font-family:'+getFont('head')+';font-size:'+titleFontSize+'px;font-weight:800;color:'+accent2+';line-height:.92;letter-spacing:-.5px;margin-bottom:2px;">'+esc(line1)+'</div>'
        +'<div style="font-family:'+getFont('head')+';font-size:'+titleFontSize+'px;font-weight:800;color:'+accent2+';line-height:.92;letter-spacing:-.5px;">'+esc(line2||line1)+'</div>';
      hcEl.appendChild(hcTitle);

      /* Italic subtitle */
      if(slide.body||slide.subline){
        var hcSub=document.createElement('div');
        var subText=slide.body||slide.subline||'';
        hcSub.style.cssText='position:absolute;left:16px;right:40%;bottom:52px;z-index:2;font-family:'+getFont('body')+';font-size:10px;font-weight:400;color:'+accent2+';line-height:1.5;letter-spacing:.02em;text-transform:uppercase;';
        hcSub.textContent=subText;
        hcEl.appendChild(hcSub);
      }

      /* Decorative swirl arrow — signature Thynk Unlimited element */
      var hcSwirl=document.createElement('div');
      hcSwirl.style.cssText='position:absolute;right:24px;bottom:120px;z-index:2;width:70px;height:70px;opacity:.9;';
      hcSwirl.innerHTML='<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" fill="none">'
        +'<path d="M55 20 C55 20 70 30 62 48 C54 66 30 62 22 46 C14 30 28 14 44 18" stroke="white" stroke-width="1.8" fill="none" stroke-linecap="round"/>'
        +'<path d="M44 18 L38 10 M44 18 L52 14" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'
        +'</svg>';
      hcEl.appendChild(hcSwirl);

      /* Bottom bar */
      var hcBot=document.createElement('div');
      hcBot.style.cssText='position:absolute;bottom:0;left:0;right:0;z-index:2;padding:11px 18px;display:flex;justify-content:space-between;align-items:center;';
      hcBot.innerHTML='<span style="font-size:9px;font-family:'+getFont('mono')+';color:rgba(255,255,255,.55);letter-spacing:.06em;">'+(ST.brand?'WWW.'+ST.brand.toUpperCase().replace(/\s+/g,'')+'.COM':'WWW.REALLYGREATSITE.COM')+'</span>'
        +'<span style="font-size:9px;font-family:'+getFont('mono')+';color:rgba(255,255,255,.55);letter-spacing:.08em;">SLIDE '+String(ST.cur+1).padStart(2,'0')+'</span>';
      hcEl.appendChild(hcBot);
      break;
    }

    /* ══════════════════════════════════════════════════════
       THYNK UNLIMITED — HABIT_SLIDE  (v4 pixel-accurate)
       Full-bleed photo · top hairline bar · italic "Habit 0X" label
       Giant bold accent headline (2 lines) · Decorative loop-arrow SVG
       Body copy below in accent colour, centred · Bottom bar
    ══════════════════════════════════════════════════════ */
    case 'HABIT_SLIDE':{
      var hsEl=ensureContainer('sHabitSlide');
      showLayout('sHabitSlide');
      hsEl.innerHTML='';
      hsEl.style.cssText='position:absolute;inset:0;z-index:4;';

      /* Dark tint */
      var hsOv=document.createElement('div');
      hsOv.style.cssText='position:absolute;inset:0;background:rgba(8,8,6,.4);z-index:1;pointer-events:none;';
      hsEl.appendChild(hsOv);

      /* Top bar */
      var hsTop=document.createElement('div');
      hsTop.style.cssText='position:absolute;top:0;left:0;right:0;z-index:2;padding:12px 18px;display:flex;justify-content:space-between;align-items:center;border-bottom:0.5px solid rgba(255,255,255,.22);';
      hsTop.innerHTML='<span style="font-size:9px;font-weight:700;font-family:'+getFont('mono')+';color:rgba(255,255,255,.82);letter-spacing:.14em;text-transform:uppercase;">'+(ST.brand?ST.brand.toUpperCase():'THYNK UNLIMITED')+'</span>'
        +'<span style="font-size:9px;font-weight:700;font-family:'+getFont('mono')+';color:rgba(255,255,255,.82);letter-spacing:.14em;text-transform:uppercase;">@'+(ST.brand?ST.brand.toLowerCase().replace(/\s+/g,''):'REALLYGREATSITE')+'</span>';
      hsEl.appendChild(hsTop);

      /* Content block — bottom half */
      var hsContent=document.createElement('div');
      hsContent.style.cssText='position:absolute;left:16px;right:16px;bottom:48px;z-index:2;';

      /* Italic serif "Habit 01" label */
      var labelNum=slide.tag||String(ST.cur+1).padStart(2,'0');
      var labelText='Habit '+labelNum;
      var hsLabel=document.createElement('div');
      hsLabel.style.cssText='font-family:Georgia,"Times New Roman",serif;font-size:16px;font-style:italic;font-weight:400;color:rgba(255,255,255,.9);margin-bottom:4px;';
      hsLabel.textContent=labelText;
      hsContent.appendChild(hsLabel);

      /* Big bold accent headline — break into 2 lines */
      var hsWords=(slide.headline||'Morning Clarity').split(' ');
      var hsMid=Math.ceil(hsWords.length/2);
      var hsLine1=hsWords.slice(0,hsMid).join(' ');
      var hsLine2=hsWords.slice(hsMid).join(' ');
      var hsFontSize=Math.min(68,Math.max(36,Math.round(440/Math.max(slide.headline.length,4))));

      var hsHead=document.createElement('div');
      hsHead.innerHTML='<div style="font-family:'+getFont('head')+';font-size:'+hsFontSize+'px;font-weight:800;color:'+accent2+';line-height:.92;letter-spacing:-.5px;">'+esc(hsLine1)+'</div>'
        +(hsLine2?'<div style="font-family:'+getFont('head')+';font-size:'+hsFontSize+'px;font-weight:800;color:'+accent2+';line-height:.92;letter-spacing:-.5px;">'+esc(hsLine2)+'</div>':'');
      hsHead.style.cssText='margin-bottom:14px;';
      hsContent.appendChild(hsHead);

      /* Body copy — centred, 2 lines in accent colour */
      if(slide.body){
        var bodyWords=slide.body.split(' ');
        var bMid=Math.ceil(bodyWords.length/2);
        var bLine1=bodyWords.slice(0,bMid).join(' ');
        var bLine2=bodyWords.slice(bMid).join(' ');
        var hsBody=document.createElement('div');
        hsBody.style.cssText='font-family:'+getFont('body')+';text-align:center;margin-bottom:4px;';
        hsBody.innerHTML='<div style="font-size:13px;line-height:1.55;color:'+accent2+';font-weight:400;">'+esc(bLine1)+'</div>'
          +(bLine2?'<div style="font-size:13px;line-height:1.55;color:'+accent2+';font-weight:400;">'+esc(bLine2)+'</div>':'');
        hsContent.appendChild(hsBody);
      }

      hsEl.appendChild(hsContent);

      /* Decorative loop arrow SVG — overlaps text block, left-center */
      var hsSwirl=document.createElement('div');
      hsSwirl.style.cssText='position:absolute;left:16px;bottom:160px;z-index:2;width:64px;height:64px;opacity:.88;';
      hsSwirl.innerHTML='<svg viewBox="0 0 70 70" xmlns="http://www.w3.org/2000/svg" fill="none">'
        +'<path d="M20 50 C10 30 20 10 38 12 C56 14 60 32 50 44 C40 56 24 54 20 50 Z" stroke="white" stroke-width="1.6" fill="none" stroke-linecap="round"/>'
        +'<path d="M16 38 L22 50 M22 50 L32 46" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>'
        +'</svg>';
      hsEl.appendChild(hsSwirl);

      /* Bottom bar */
      var hsBot=document.createElement('div');
      hsBot.style.cssText='position:absolute;bottom:0;left:0;right:0;z-index:2;padding:11px 18px;display:flex;justify-content:space-between;align-items:center;';
      hsBot.innerHTML='<span style="font-size:9px;font-family:'+getFont('mono')+';color:rgba(255,255,255,.55);letter-spacing:.06em;">'+(ST.brand?'WWW.'+ST.brand.toUpperCase().replace(/\s+/g,'')+'.COM':'WWW.REALLYGREATSITE.COM')+'</span>'
        +'<span style="font-size:9px;font-family:'+getFont('mono')+';color:rgba(255,255,255,.55);letter-spacing:.08em;">SLIDE '+String(ST.cur+1).padStart(2,'0')+'</span>';
      hsEl.appendChild(hsBot);
      break;
    }

    /* ══════════════════════════════════════════════════════
       SALFORD & CO. — EDITORIAL_COVER  (v4 pixel-accurate)
       Full-bleed photo · oval pill badge top-left · plain brand name top-right
       Mixed-serif giant title: sans-serif lines + italic script last word
       @handle bottom-left · decorative snowflake ✽✽✽ bottom-right
    ══════════════════════════════════════════════════════ */
    case 'EDITORIAL_COVER':{
      var ecEl=ensureContainer('sEditorialCover');
      showLayout('sEditorialCover');
      ecEl.innerHTML='';
      ecEl.style.cssText='position:absolute;inset:0;z-index:4;';

      /* Gradient overlay — lighter than Thynk */
      var ecOv=document.createElement('div');
      ecOv.style.cssText='position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.55) 0%,rgba(0,0,0,.12) 55%,rgba(0,0,0,.04) 100%);z-index:1;pointer-events:none;';
      ecEl.appendChild(ecOv);

      /* Oval pill badge top-left */
      var ecBadge=document.createElement('div');
      ecBadge.textContent='Page '+String(ST.cur+1).padStart(2,'0');
      ecBadge.style.cssText='position:absolute;top:14px;left:14px;z-index:2;font-size:10px;font-family:'+getFont('body')+';font-weight:400;color:rgba(255,255,255,.92);border:1px solid rgba(255,255,255,.6);border-radius:40px;padding:4px 14px;letter-spacing:.3px;';
      ecEl.appendChild(ecBadge);

      /* Plain brand name top-right — no border, just text */
      var ecBrand=document.createElement('div');
      ecBrand.textContent=ST.brand||'Salford & Co.';
      ecBrand.style.cssText='position:absolute;top:16px;right:16px;z-index:2;font-size:11px;font-family:'+getFont('body')+';font-weight:400;color:rgba(255,255,255,.88);letter-spacing:.4px;';
      ecEl.appendChild(ecBrand);

      /* Mixed-serif title — bottom left */
      var words2=(slide.headline||'3 Ways to Style Your Own Home').split(' ');
      /* Last 2 words get the italic script treatment */
      var scriptWordCount=Math.min(2,Math.ceil(words2.length/3));
      var normalWords=words2.slice(0,-scriptWordCount);
      var scriptWords=words2.slice(-scriptWordCount);
      var titleFontSz=Math.min(62,Math.max(34,Math.round(500/Math.max(slide.headline.length,6))));

      var ecTitle=document.createElement('div');
      ecTitle.style.cssText='position:absolute;bottom:50px;left:18px;right:18px;z-index:2;';
      ecTitle.innerHTML='<div style="font-family:Georgia,\'Times New Roman\',serif;font-size:'+titleFontSz+'px;font-weight:400;color:#fff;line-height:1.0;text-shadow:0 2px 24px rgba(0,0,0,.4);">'+esc(normalWords.join(' '))+'</div>'
        +'<div style="font-family:Georgia,\'Times New Roman\',serif;font-size:'+(titleFontSz+4)+'px;font-style:italic;font-weight:400;color:#fff;line-height:1.0;text-shadow:0 2px 24px rgba(0,0,0,.4);">'+esc(scriptWords.join(' '))+'</div>';
      ecEl.appendChild(ecTitle);

      /* @handle bottom-left */
      var ecHandle=document.createElement('div');
      ecHandle.textContent='@'+(ST.brand?ST.brand.toLowerCase().replace(/\s+/g,''):'reallygreatsite');
      ecHandle.style.cssText='position:absolute;bottom:16px;left:18px;z-index:2;font-size:10px;font-family:'+getFont('body')+';color:rgba(255,255,255,.65);letter-spacing:.2px;';
      ecEl.appendChild(ecHandle);

      /* Snowflake decorative ✽✽✽ bottom-right */
      var ecStars=document.createElement('div');
      ecStars.innerHTML='✽ ✽ ✽';
      ecStars.style.cssText='position:absolute;bottom:14px;right:16px;z-index:2;font-size:13px;color:rgba(255,255,255,.55);letter-spacing:5px;';
      ecEl.appendChild(ecStars);
      break;
    }

    /* ══════════════════════════════════════════════════════
       SALFORD & CO. — EDITORIAL_COLLAGE  (v4 pixel-accurate)
       Linen #f0ebe1 bg · oval badge top-left · brand name top-right
       Giant italic number top-right (black, ~100px)
       2 photos LEFT side — overlapping/staggered (not just stacked)
       RIGHT side: mixed-serif headline + justified body · ✽✽✽ + @handle footer
    ══════════════════════════════════════════════════════ */
    case 'EDITORIAL_COLLAGE':{
      sBgImg.style.opacity='0';
      sBg.style.background='#f0ebe1';
      var ecolEl=ensureContainer('sEditorialCollage');
      showLayout('sEditorialCollage');
      ecolEl.innerHTML='';
      ecolEl.style.cssText='position:absolute;inset:0;z-index:4;background:#f0ebe1;';

      /* Oval badge top-left */
      var ecolBadge=document.createElement('div');
      ecolBadge.textContent='Page '+String(ST.cur+1).padStart(2,'0');
      ecolBadge.style.cssText='position:absolute;top:14px;left:14px;z-index:2;font-size:10px;font-family:'+getFont('body')+';color:#888;border:1px solid #b0a898;border-radius:40px;padding:3px 12px;letter-spacing:.3px;';
      ecolEl.appendChild(ecolBadge);

      /* Brand name top-right */
      var ecolBrand=document.createElement('div');
      ecolBrand.textContent=ST.brand||'Salford & Co.';
      ecolBrand.style.cssText='position:absolute;top:16px;right:14px;z-index:2;font-size:11px;font-family:'+getFont('body')+';color:#888;letter-spacing:.3px;';
      ecolEl.appendChild(ecolBrand);

      /* Giant italic number top-right — big, black, proper weight */
      var ecolNum=document.createElement('div');
      ecolNum.textContent=String(ST.cur+1).padStart(2,'0');
      ecolNum.style.cssText='position:absolute;top:36px;right:14px;z-index:2;font-family:Georgia,"Times New Roman",serif;font-size:108px;font-style:italic;font-weight:700;color:#1a1814;line-height:1;opacity:.9;';
      ecolEl.appendChild(ecolNum);

      /* LEFT: 2 overlapping/staggered photos */
      /* Photo 1 — taller, sits top-left of the photo area */
      var ecolP1=document.createElement('div');
      ecolP1.style.cssText='position:absolute;left:14px;top:54px;width:44%;height:48%;background-size:cover;background-position:center;background-color:#c8b89a;border-radius:3px;'+(primaryUrl?'background-image:url('+primaryUrl+')':'');
      ecolEl.appendChild(ecolP1);

      /* Photo 2 — overlaps photo 1, shifted right and down */
      var ecolP2=document.createElement('div');
      var p2url=secondUrl||(primaryUrl||'');
      ecolP2.style.cssText='position:absolute;left:26%;top:42%;width:40%;height:46%;background-size:cover;background-position:center top;background-color:#a89070;border-radius:3px;box-shadow:0 4px 20px rgba(0,0,0,.15);'+(p2url?'background-image:url('+p2url+')':'');
      ecolEl.appendChild(ecolP2);

      /* RIGHT text panel — vertically centred */
      var ecolText=document.createElement('div');
      ecolText.style.cssText='position:absolute;left:52%;right:14px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:10px;z-index:3;';

      /* Mixed-serif headline */
      var ecWords=(slide.headline||'Create a Cozy & Functional Space').split(' ');
      var ecScriptCount=Math.min(1,ecWords.length-1);
      var ecNormal=ecWords.slice(0,-ecScriptCount||undefined).join(' ');
      var ecScript=ecScriptCount?ecWords.slice(-ecScriptCount).join(' '):'';
      var ecFontSz=Math.min(24,headlineSize(slide.headline));

      var ecolH='';
      ecolH+='<div style="font-family:Georgia,\'Times New Roman\',serif;font-size:'+ecFontSz+'px;font-weight:400;line-height:1.15;color:#1a1814;margin-bottom:0;">'+esc(ecNormal)+'</div>';
      if(ecScript) ecolH+='<div style="font-family:Georgia,\'Times New Roman\',serif;font-size:'+(ecFontSz+2)+'px;font-style:italic;font-weight:400;line-height:1.1;color:#1a1814;margin-top:-4px;">'+esc(ecScript)+'</div>';
      if(slide.body) ecolH+='<div style="font-size:11px;line-height:1.7;color:#555;text-align:justify;margin-top:6px;">'+esc(slide.body)+'</div>';
      ecolText.innerHTML=ecolH;
      ecolEl.appendChild(ecolText);

      /* Footer */
      var ecolFoot=document.createElement('div');
      ecolFoot.style.cssText='position:absolute;bottom:12px;left:14px;z-index:2;font-size:10px;font-family:'+getFont('body')+';color:#a09888;';
      ecolFoot.textContent='@'+(ST.brand?ST.brand.toLowerCase().replace(/\s+/g,''):'reallygreatsite');
      ecolEl.appendChild(ecolFoot);

      var ecolStars=document.createElement('div');
      ecolStars.innerHTML='✽ ✽ ✽';
      ecolStars.style.cssText='position:absolute;bottom:12px;right:14px;z-index:2;font-size:14px;color:#b0a090;letter-spacing:4px;';
      ecolEl.appendChild(ecolStars);
      break;
    }

    /* ══════════════════════════════════════════════════════
       SALFORD & CO. — EDITORIAL_COLLAGE_3  (v4 pixel-accurate)
       Linen bg · badge + brand · italic number top-LEFT this time
       LEFT text panel · RIGHT: 3-photo grid (1 wide top + 2 bottom)
       Photos have slight stagger for visual interest
    ══════════════════════════════════════════════════════ */
    case 'EDITORIAL_COLLAGE_3':{
      sBgImg.style.opacity='0';
      sBg.style.background='#f0ebe1';
      var ec3El=ensureContainer('sEditorialCollage');
      showLayout('sEditorialCollage');
      ec3El.innerHTML='';
      ec3El.style.cssText='position:absolute;inset:0;z-index:4;background:#f0ebe1;';

      /* Badge top-left */
      var ec3Badge=document.createElement('div');
      ec3Badge.textContent='Page '+String(ST.cur+1).padStart(2,'0');
      ec3Badge.style.cssText='position:absolute;top:14px;left:14px;z-index:2;font-size:10px;font-family:'+getFont('body')+';color:#888;border:1px solid #b0a898;border-radius:40px;padding:3px 12px;';
      ec3El.appendChild(ec3Badge);

      var ec3Brand=document.createElement('div');
      ec3Brand.textContent=ST.brand||'Salford & Co.';
      ec3Brand.style.cssText='position:absolute;top:16px;right:14px;z-index:2;font-size:11px;font-family:'+getFont('body')+';color:#888;';
      ec3El.appendChild(ec3Brand);

      /* Giant italic number — top LEFT (different from COLLAGE) */
      var ec3Num=document.createElement('div');
      ec3Num.textContent=String(ST.cur+1).padStart(2,'0');
      ec3Num.style.cssText='position:absolute;top:36px;left:12px;z-index:2;font-family:Georgia,"Times New Roman",serif;font-size:108px;font-style:italic;font-weight:700;color:#1a1814;line-height:1;opacity:.9;';
      ec3El.appendChild(ec3Num);

      /* LEFT text panel — vertically centred, below the big number */
      var ec3Text=document.createElement('div');
      ec3Text.style.cssText='position:absolute;left:12px;right:52%;top:55%;transform:translateY(-50%);display:flex;flex-direction:column;gap:8px;z-index:3;';

      var ec3Words=(slide.headline||'Keep It Clean & Organized').split(' ');
      var ec3ScriptCount=Math.min(1,ec3Words.length-1);
      var ec3Normal=ec3Words.slice(0,-ec3ScriptCount||undefined).join(' ');
      var ec3Script=ec3ScriptCount?ec3Words.slice(-ec3ScriptCount).join(' '):'';
      var ec3FontSz=Math.min(22,headlineSize(slide.headline));

      var ec3H='';
      ec3H+='<div style="font-family:Georgia,\'Times New Roman\',serif;font-size:'+ec3FontSz+'px;font-weight:400;line-height:1.15;color:#1a1814;">'+esc(ec3Normal)+'</div>';
      if(ec3Script) ec3H+='<div style="font-family:Georgia,\'Times New Roman\',serif;font-size:'+(ec3FontSz+2)+'px;font-style:italic;font-weight:400;line-height:1.1;color:#1a1814;margin-top:-4px;">'+esc(ec3Script)+'</div>';
      if(slide.body) ec3H+='<div style="font-size:11px;line-height:1.7;color:#555;text-align:justify;margin-top:6px;">'+esc(slide.body)+'</div>';
      ec3Text.innerHTML=ec3H;
      ec3El.appendChild(ec3Text);

      /* RIGHT: 3-photo grid */
      var imgUrls=[primaryUrl||'',secondUrl||'',thirdUrl||primaryUrl||''];

      /* Wide top photo */
      var ec3Wide=document.createElement('div');
      ec3Wide.style.cssText='position:absolute;left:50%;right:12px;top:44px;height:46%;background-size:cover;background-position:center;background-color:#c8b89a;border-radius:3px;'+(imgUrls[0]?'background-image:url('+imgUrls[0]+')':'');
      ec3El.appendChild(ec3Wide);

      /* Bottom-left photo */
      var ec3b1=document.createElement('div');
      ec3b1.style.cssText='position:absolute;left:50%;right:calc(26% + 8px);bottom:36px;height:44%;background-size:cover;background-position:center;background-color:#a89070;border-radius:3px;'+(imgUrls[1]?'background-image:url('+imgUrls[1]+')':'');
      ec3El.appendChild(ec3b1);

      /* Bottom-right photo — slight top offset for stagger */
      var ec3b2=document.createElement('div');
      ec3b2.style.cssText='position:absolute;right:12px;width:24%;bottom:28px;height:46%;background-size:cover;background-position:center top;background-color:#8a7258;border-radius:3px;box-shadow:0 4px 16px rgba(0,0,0,.12);'+(imgUrls[2]?'background-image:url('+imgUrls[2]+')':'');
      ec3El.appendChild(ec3b2);

      /* Footer */
      var ec3Foot=document.createElement('div');
      ec3Foot.style.cssText='position:absolute;bottom:12px;left:12px;z-index:2;font-size:10px;font-family:'+getFont('body')+';color:#a09888;';
      ec3Foot.textContent='@'+(ST.brand?ST.brand.toLowerCase().replace(/\s+/g,''):'reallygreatsite');
      ec3El.appendChild(ec3Foot);

      var ec3Stars=document.createElement('div');
      ec3Stars.innerHTML='✽ ✽ ✽';
      ec3Stars.style.cssText='position:absolute;bottom:12px;right:12px;z-index:2;font-size:14px;color:#b0a090;letter-spacing:4px;';
      ec3El.appendChild(ec3Stars);
      break;
    }

  } /* end switch */

  /* ── Always-on chrome ── */
  document.getElementById('sNum').textContent=(ST.cur+1)+' / '+ST.slides.length;
  var brandEl=document.getElementById('sBrand');
  var editorialLayouts=['EDITORIAL_COVER','EDITORIAL_COLLAGE','EDITORIAL_COLLAGE_3','HABIT_COVER','HABIT_SLIDE'];
  brandEl.textContent=editorialLayouts.indexOf(layout)===-1?(ST.brand||''):'';
  brandEl.style.color=tc.head;

  var badge2=document.getElementById('layoutBadge');
  if(badge2) badge2.textContent=layout.replace(/_/g,' ');

  /* Active layout button highlight */
  document.querySelectorAll('.layout-btn').forEach(function(btn){
    var match=btn.getAttribute('onclick')||'';
    btn.classList.toggle('active',match.indexOf("'"+layout+"'")!==-1||match.indexOf('"'+layout+'"')!==-1);
  });

  var chips=document.getElementById('hashtagChips');
  var hashSec=document.getElementById('hashtagSection');
  if(chips&&slide.hashtags&&slide.hashtags.length){
    chips.innerHTML=slide.hashtags.map(function(t){return '<span class="hashtag-chip">'+esc(t)+'</span>';}).join('');
    if(hashSec) hashSec.style.display='flex';
  } else {
    if(hashSec) hashSec.style.display='none';
  }

  updateThumbActive();
}

/* ── Full-bleed HTML builder ── */
function buildFullBleedHTML(slide,tc,accent2){
  var fc='';
  if(slide.tag) fc+='<div class="s-tag" style="background:'+tc.tagBg+';color:'+tc.tagColor+';border:1px solid rgba(255,255,255,.12)">'+esc(slide.tag)+'</div>';
  fc+='<div class="s-headline" style="font-family:'+getFont('head')+';font-size:'+headlineSize(slide.headline)+'px;color:'+tc.head+'">'+esc(slide.headline)+'</div>';
  if(slide.body) fc+='<div class="s-body" style="color:'+tc.body+'">'+esc(slide.body)+'</div>';
  if(slide.hashtags&&slide.hashtags.length) fc+='<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:10px">'+slide.hashtags.slice(0,5).map(function(t){return '<span style="font-size:10px;font-family:'+getFont('mono')+';color:rgba(255,255,255,.55)">'+esc(t)+'</span>';}).join('')+'</div>';
  if(slide.cta) fc+='<div class="s-cta" style="background:'+accent2+';color:#fff">'+esc(slide.cta)+' <span>→</span></div>';
  var n=String(ST.cur+1).padStart(2,'0');
  fc+='<div class="s-giant-num" style="color:'+(tc.head==='#ffffff'?'rgba(255,255,255,.06)':'rgba(0,0,0,.05)')+'">'+n+'</div>';
  return fc;
}

/* ── Split/strip text panel builder ── */
function buildSplitTextHTML(slide,accent2,pText,pBg){
  var h='';
  if(slide.tag) h+='<div style="font-size:9px;font-weight:700;font-family:'+getFont('mono')+';letter-spacing:2px;text-transform:uppercase;color:'+accent2+';margin-bottom:4px">'+esc(slide.tag)+'</div>';
  h+='<div style="font-family:'+getFont('head')+';font-size:'+Math.min(26,headlineSize(slide.headline))+'px;font-weight:800;line-height:1.2;color:'+pText+';margin-bottom:6px">'+esc(slide.headline)+'</div>';
  if(slide.body) h+='<div style="font-size:12px;line-height:1.65;color:'+pText+';opacity:.75;margin-bottom:8px">'+esc(slide.body)+'</div>';
  if(slide.hashtags&&slide.hashtags.length) h+='<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px">'+slide.hashtags.slice(0,4).map(function(t){return '<span style="font-size:9px;font-family:'+getFont('mono')+';color:'+accent2+';opacity:.85">'+esc(t)+'</span>';}).join('')+'</div>';
  if(slide.cta) h+='<div style="display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:8px;font-size:11px;font-weight:700;font-family:'+getFont('head')+';background:'+accent2+';color:'+pBg+';width:fit-content">'+esc(slide.cta)+' →</div>';
  return h;
}

function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

/* ─────────────────────────────────────────────────────────
   10. STRIP BUILDER
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
   11. NAVIGATION
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
   12. EDIT PANEL
   ───────────────────────────────────────────────────────── */
function fillEdit(){
  if(!ST.slides.length) return;
  var s=ST.slides[ST.cur];
  document.getElementById('eHead').value=s.headline||'';
  document.getElementById('eBody').value=s.body||s.subline||'';
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
  ST.slides[ST.cur].headline=document.getElementById('eHead').value;
  ST.slides[ST.cur].body=document.getElementById('eBody').value;
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
function updateBrand(){ST.brand=document.getElementById('brandInput').value;if(ST.slides.length) renderSlide();}

function changeLayout(newLayout){
  if(!ST.slides.length) return;
  ST.slides[ST.cur].layout=newLayout;
  renderSlide();fillEdit();
  toast('Layout → '+newLayout.replace(/_/g,' '));
}

/* Font pair switcher — called from right panel */
function setFontPair(pair){
  ST.fontPair=pair;
  document.querySelectorAll('.font-btn').forEach(function(b){b.classList.toggle('active',b.dataset.pair===pair);});
  if(ST.slides.length) renderSlide();
  toast('Font → '+pair);
}

/* ─────────────────────────────────────────────────────────
   13. IMAGE UPLOAD
   ───────────────────────────────────────────────────────── */
function handleUpload(e){var f=e.target.files[0];if(!f) return;var r=new FileReader();r.onload=function(ev){ST.userImages[ST.cur]=ev.target.result;renderSlide();buildStrip();toast('🖼️ Image added to slide '+(ST.cur+1));};r.readAsDataURL(f);}
function dzOver(e){e.preventDefault();document.getElementById('dzone').classList.add('over');}
function dzLeave(){document.getElementById('dzone').classList.remove('over');}
function dzDrop(e){e.preventDefault();document.getElementById('dzone').classList.remove('over');var f=e.dataTransfer.files[0];if(!f||!f.type.startsWith('image/')) return;var r=new FileReader();r.onload=function(ev){ST.userImages[ST.cur]=ev.target.result;renderSlide();buildStrip();toast('🖼️ Image dropped on slide '+(ST.cur+1));};r.readAsDataURL(f);}

/* ─────────────────────────────────────────────────────────
   14. ACCENT / THEME / BRAND / FONT
   ───────────────────────────────────────────────────────── */
function setAccent(c,el){ST.accent=c;document.querySelectorAll('.cdot').forEach(function(d){d.classList.remove('on');});el.classList.add('on');if(ST.slides.length) renderSlide();}
function toggleTheme(){var isDark=document.documentElement.getAttribute('data-theme')==='dark';document.documentElement.setAttribute('data-theme',isDark?'light':'dark');document.querySelector('[onclick="toggleTheme()"]').textContent=isDark?'🌙':'☀️';}

/* ─────────────────────────────────────────────────────────
   15. COPY & EXPORT
   ───────────────────────────────────────────────────────── */
function copyCaption(){
  var c=document.getElementById('eCap').value;
  if(!c){toast('No caption on this slide');return;}
  navigator.clipboard.writeText(c).then(function(){toast('✓ Caption copied');});
}

function copyAll(){
  if(!ST.slides.length){toast('Generate a carousel first');return;}
  var all=ST.slides.map(function(s,i){
    var tags=(s.hashtags&&s.hashtags.length)?'\n\n'+s.hashtags.join(' '):'';
    return '── SLIDE '+(i+1)+' ──\nHeadline: '+(s.headline||'')+'\nBody: '+(s.body||'')+'\n\nCaption:\n'+(s.caption||'')+tags;
  }).join('\n\n');
  navigator.clipboard.writeText(all).then(function(){toast('✓ All copy + captions copied');});
}

function openExport(){document.getElementById('exportModal').classList.add('show');}
function closeExport(){document.getElementById('exportModal').classList.remove('show');}
function selExport(t){ST.exportType=t;['png','copy','json','video'].forEach(function(x){var el=document.getElementById('eo'+x.charAt(0).toUpperCase()+x.slice(1));if(el)el.classList.toggle('sel',x===t);});}

function doExport(){
  closeExport();
  if(ST.exportType==='copy'){
    copyAll();
  } else if(ST.exportType==='json'){
    var j=JSON.stringify({
      slides:ST.slides.map(function(s){return {headline:s.headline,body:s.body,caption:s.caption,hashtags:s.hashtags,layout:s.layout,type:s.type};}),
      theme:ST.theme,accentColor:ST.accent,fontPair:ST.fontPair,
      platform:document.getElementById('platSelect').value,
      generatedAt:new Date().toISOString()
    },null,2);
    var b=new Blob([j],{type:'application/json'});
    triggerBlobDownload(b,'carousel-data.json');
    toast('✓ JSON exported');
  } else if(ST.exportType==='png'){
    exportSlidesAsPNG();
  } else if(ST.exportType==='video'){
    toast('📹 Full MP4 export coming soon — screenshot each slide for now.');
  }
}

function exportSlidesAsPNG(){
  if(typeof html2canvas==='undefined'){
    toast('💡 html2canvas not loaded — use JSON export or screenshot each slide.');
    return;
  }
  var canvas=document.getElementById('slideCanvas');
  toast('📸 Capturing slide '+(ST.cur+1)+'…');
  html2canvas(canvas,{useCORS:true,allowTaint:false,scale:2,backgroundColor:null}).then(function(c){
    c.toBlob(function(blob){
      triggerBlobDownload(blob,'ImpactGrid-slide-'+(ST.cur+1)+'.png');
      toast('✓ Slide '+(ST.cur+1)+' saved as PNG');
    },'image/png');
  }).catch(function(err){
    console.warn('html2canvas error:',err);
    toast('💡 Screenshot this slide — PNG capture needs HTTPS & CORS images');
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
  }catch(e){
    toast('⚠️ Download failed — try Copy or JSON');
  }
}

/* ─────────────────────────────────────────────────────────
   16. TOAST
   ───────────────────────────────────────────────────────── */
function toast(msg){
  var shelf=document.getElementById('toastShelf');
  var el=document.createElement('div');el.className='toast';el.textContent=msg;
  shelf.appendChild(el);
  setTimeout(function(){el.remove();},3400);
}

/* ─────────────────────────────────────────────────────────
   17. KEYBOARD
   ───────────────────────────────────────────────────────── */
document.addEventListener('keydown',function(e){
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA') return;
  if(e.key==='ArrowRight'||e.key==='ArrowDown') nextSlide();
  if(e.key==='ArrowLeft'||e.key==='ArrowUp') prevSlide();
  if(e.key==='Escape') closeExport();
});

/* ─────────────────────────────────────────────────────────
   18. INIT
   ───────────────────────────────────────────────────────── */
(function(){
  updateCounter();
  setInterval(function(){fetch(DIJO_SERVER+'/ping').catch(function(){});},600000);
})();
