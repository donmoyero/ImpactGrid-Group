/* ═══════════════════════════════════════════════════════════
   IMPACTGRID — Carousel Studio
   carousel-studio.js  v4.5

   v4.5 upgrades (integrated from carousel-studio-captions.js):
   - CaptionEngine merged inline — no separate file needed
   - callAI() now sends a full storytelling brief to the server
     so every slide gets punchy, specific, non-generic copy
   - enrichDeck() — live Google Trends pulled per-generate,
     AI writes real platform-native captions for every slide
   - pickHashtagsForSlide() — scored tags: 🔥 Trending, 🎯 Niche,
     📱 Platform (no generic filler unless under count)
   - buildCaption() — uses AI caption from enrichDeck first,
     falls back to smart template, never blank
   - populateHashtagPanel() — chips + copy-all button

   v4.4 patch:
   - normalizeSlidesDeck() — hashtags NO LONGER zeroed
   - buildCaption()        — uses slide.caption from server
   - parseServerSlides()   — hashtags preserved from server
   - fillEdit()            — uses buildCaption(slide)

   v4.3 patch:
   - trimHeadline / limitBody / headlineSize improvements
   - fallbackSlides() — full narrative arcs
   - makeEditable() inline editing
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
   getSlideIntent — maps slide position to narrative intent
   Powers data-intent attributes + server brief construction
   ───────────────────────────────────────────────────────── */
var SLIDE_INTENTS = ['hook','problem','pain','insight','solution','result','cta'];
function getSlideIntent(i, total){
  total = total || 7;
  if(i === 0) return 'hook';
  if(i === total - 1) return 'cta';
  // Distribute middle intents evenly across available slides
  var midIntents = SLIDE_INTENTS.slice(1, -1); // problem,pain,insight,solution,result
  var midIndex = Math.round((i - 1) / (total - 2) * (midIntents.length - 1));
  return midIntents[midIndex] || 'insight';
}

/* ─────────────────────────────────────────────────────────
   detectNiche — maps theme to content niche label
   Sent to server so AI writes niche-specific copy
   ───────────────────────────────────────────────────────── */
var NICHE_MAP = {
  workspace:   'creator-business',
  luxury:      'luxury-lifestyle',
  'cozy-home': 'home-interior',
  minimal:     'minimalism-design',
  finance:     'personal-finance',
  health:      'health-wellness',
  fashion:     'fashion-style',
  lifestyle:   'lifestyle-general'
};
function detectNiche(theme){
  return NICHE_MAP[theme] || 'lifestyle-general';
}

function detectPlatformIntent(topic){
  var t = (topic || '').toLowerCase();

  if(t.includes('linkedin') || t.includes('career') || t.includes('job')){
    return 'LinkedIn';
  }

  if(t.includes('tiktok') || t.includes('viral') || t.includes('trend')){
    return 'TikTok';
  }

  if(t.includes('aesthetic') || t.includes('inspo') || t.includes('ideas')){
    return 'Pinterest';
  }

  if(t.includes('thread') || t.includes('tweet')){
    return 'Twitter/X';
  }

  return 'Instagram'; // default
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
   4. LAYOUT ASSIGNMENT
   ───────────────────────────────────────────────────────── */
var LAYOUT_SEQUENCE = [
  'FULL_BLEED','OVERLAP_BAND','BOTTOM_STRIP','DUAL_IMAGE',
  'TOP_STRIP','STAT_HERO','QUOTE_PULL',
  'EDITORIAL_COVER','EDITORIAL_COLLAGE','EDITORIAL_COLLAGE_3',
  'HABIT_COVER'
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
    tip:['OVERLAP_BAND','BOTTOM_STRIP','TOP_STRIP','FULL_BLEED']
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

/* ─────────────────────────────────────────────────────────
   COPY HELPERS
   ───────────────────────────────────────────────────────── */
function trimHeadline(text){
  return stripHashtags(text).replace(/\s{2,}/g,' ').trim();
}

function limitBody(text){
  var clean = stripHashtags(text).replace(/\s{2,}/g,' ').trim();
  if(clean.length <= 280) return clean;
  var cutAt = clean.lastIndexOf('.', 280);
  if(cutAt > 80) return clean.slice(0, cutAt + 1);
  return clean.slice(0, 280).trim() + '…';
}

function headlineSize(text){
  var l = (text||'').length;
  if(l < 20) return 38;
  if(l < 35) return 32;
  if(l < 50) return 27;
  if(l < 70) return 23;
  if(l < 90) return 20;
  return 17;
}

/* ─────────────────────────────────────────────────────────
   normalizeSlidesDeck — v4.4+
   hashtags preserved; only fills genuinely empty fields
   ───────────────────────────────────────────────────────── */
function normalizeSlidesDeck(slides){
  if(!Array.isArray(slides)) return [];
  return slides.map(function(slide, i){
    var out = Object.assign({}, slide || {});
    var total = slides.length;
    out.type = i === 0 ? 'hook' : (i === total - 1 ? 'cta' : (out.type || 'insight'));
    out.layout = normalizeLayoutSafe(out.layout, out.type, i, total);
    if(!out.headline || out.headline.length < 3){
      out.headline = out.type === 'hook' ? 'This Changes Everything'
        : out.type === 'cta' ? 'Ready to Apply This?'
        : 'Key Insight';
    }
    out.headline = trimHeadline(out.headline);
    if(!out.body || out.body.trim().length < 5){
      if(out.type !== 'hook'){
        out.body = 'Apply this consistently and the results compound faster than you expect.';
      }
    }
    out.body = limitBody(out.body || '');
    out.quote = stripHashtags(out.quote || '');
    out.cta   = stripHashtags(out.cta || '');
    if(!Array.isArray(out.hashtags) || out.hashtags.length === 0) out.hashtags = [];
    if(!out.caption || out.caption.trim().length < 3) out.caption = buildCaption(out);
    if(out.type === 'cta' && !out.cta) out.cta = 'Follow for more →';
    return out;
  });
}

/* ─────────────────────────────────────────────────────────
   5. STATE
   ───────────────────────────────────────────────────────── */
var ST={slides:[],cur:0,count:7,theme:null,zoom:100,format:'square',accent:'#2563eb',brand:'',userImages:{},assetOffset:0,exportType:'png',fontPair:'syne',trendHashtags:[]};
var currentTrend = null;

/* ── MONETISATION ───────────────────────────── */
var IG_USER        = null;
var IG_PLAN        = "free"; // free | pro | enterprise
var IG_USES        = parseInt(localStorage.getItem("ig_carousel_uses") || "0");
var IG_LIMIT       = 3;
var IG_ADMIN_EMAIL = "admin@impactgridgroup.com";
var IG_IS_ADMIN    = false;

async function getUser() {
  try {
    // Prefer nav.js's already-authenticated client (avoids double-init race)
    if (typeof getSupabase === 'function') {
      const client = getSupabase();
      if (client) {
        const { data } = await client.auth.getSession();
        return data?.session?.user || null;
      }
    }
    // nav.js populates window.igUser after auth resolves — use it if available
    if (window.igUser && window.igUser.id) {
      return { id: window.igUser.id, email: window.igUser.email };
    }
    // Last resort: raw supabase SDK
    const sb = window.supabase;
    if (!sb) return null;
    const sbClient = sb.createClient
      ? sb.createClient(
          'https://wedjsnizcvtgptobwugc.supabase.co',
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlZGpzbml6Y3Z0Z3B0b2J3dWdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzU3MzcsImV4cCI6MjA4OTQ1MTczN30._o8QcqElPb1ug3DgTi5uUaILMI40yLcZl1Uk21uWrkc'
        )
      : sb;
    const { data } = await sbClient.auth.getSession();
    return data?.session?.user || null;
  } catch {
    return null;
  }
}

async function checkCarouselAccess() {
  // Wait up to 2s for nav.js to finish its auth resolution before checking
  if (!window.igUser) {
    await new Promise(function(resolve) {
      var done = false;
      function finish() { if (!done) { done = true; resolve(); } }
      document.addEventListener('ig-user-ready', finish, { once: true });
      setTimeout(finish, 2000);
    });
  }

  IG_USER = await getUser();

  // ❌ Not logged in
  if (!IG_USER) {
    showUpgradeBar("Login to generate and save carousels");
    return false;
  }

  // 👑 Admin override
  if (IG_USER.email === IG_ADMIN_EMAIL) {
    IG_IS_ADMIN = true;
    IG_PLAN = "enterprise";
    console.log("👑 Admin mode active");
  }

  // 👑 Admin bypass
  if (IG_IS_ADMIN) return true;

  // ❌ Free limit reached
  if (IG_PLAN === "free" && IG_USES >= IG_LIMIT) {
    showUpgradeBar("Free limit reached — upgrade for unlimited carousels");
    return false;
  }

  return true;
}

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
   7. AI GENERATION — v4.5: smarter prompt brief
   ───────────────────────────────────────────────────────── */
var DIJO_SERVER='https://impactgrid-dijo.onrender.com';

function onTrendClick(trend){
  if(!trend) return;

  currentTrend = trend;

  var input = document.getElementById('topicInput');
  if(input){
    input.value = trend.topic || trend.keyword || '';
  }

  toast('🔥 Trend loaded — generating...');

  setTimeout(function(){
    generate();
  }, 200);
}

async function generate(){
  if (!(await checkCarouselAccess())) return;
  var topic=document.getElementById('topicInput').value.trim();
  if(!topic){toast('⚠️ Add a topic first');document.getElementById('topicInput').focus();return;}
  if(!ST.theme) ST.theme=detectTheme(topic);

  var selectedPlatform = document.getElementById('platSelect').value;
  var detectedPlatform = detectPlatformIntent(topic);
  var platform = selectedPlatform || detectedPlatform;
  var tone=document.getElementById('toneSelect').value;
  var count=ST.count;

  // ── STEP 1: Build full intelligence context before API call ──
  var theme  = ST.theme || detectTheme(topic);
  var niche  = detectNiche(theme);
  var intents = Array.from({length:count},function(_,i){ return getSlideIntent(i, count); });
  // Grab live trend from CaptionEngine if already prefetched
  var trendContext = '';
  try{
    var trends = window.CaptionEngine && window.CaptionEngine._liveTrends;
    if(trends && trends.length){
      trendContext = trends.slice(0,3).map(function(t){return t.topic||t.keyword||t;}).join(', ');
    }
  }catch(e){}

  var btn=document.getElementById('genBtn');
  btn.innerHTML='<div class="spin"></div> Generating…';btn.disabled=true;
  document.getElementById('emptyState').style.display='none';
  document.getElementById('slideWrap').style.display='block';
  document.getElementById('loadingOv').classList.add('show');
  var hints=['Detecting theme…','Scoring images with AI vision…','Writing punchy copy…','Designing layouts…','Adding captions + hashtags…'];
  var hi=0,hTimer=setInterval(function(){hi=(hi+1)%hints.length;document.getElementById('loadingHint').textContent=hints[hi];},1800);
  try{
    // ── STEP 2: Pass niche + intents + trend to callAI ──
    var data = await callAI(
      topic,
      platform,
      tone,
      count,
      niche,
      intents,
      trendContext,
      currentTrend
    );
    ST.trendHashtags = data.trendHashtags || [];
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

  // ── STEP 3: Stamp data-intent on every slide object ──
  ST.slides.forEach(function(s, i){
    s.intent = getSlideIntent(i, ST.slides.length);
  });

  buildStrip();renderSlide();updateCounter();fillEdit();
  btn.innerHTML='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Regenerate';
  btn.disabled=false;
  if (!IG_IS_ADMIN) {
    IG_USES++;
    localStorage.setItem("ig_carousel_uses", IG_USES);
  }
  toast('✦ '+ST.slides.length+'-slide carousel · '+DA[ST.theme].label+' · tap any text to edit');

  // ── STEP 4: enrich with live captions + hashtags after render ──
  var topicVal=topic, platformVal=platform;
  setTimeout(function(){ CaptionEngine.enrichDeck(topicVal, platformVal); }, 600);
}

/* ─────────────────────────────────────────────────────────
   v4.5 UPGRADED callAI — sends a full storytelling brief
   so the server AI writes punchy, specific, non-generic copy
   ───────────────────────────────────────────────────────── */
async function callAI(topic, platform, tone, count, niche, intents, trendContext, trendData){

  niche        = niche        || detectNiche(ST.theme || detectTheme(topic));
  intents      = intents      || Array.from({length:count},function(_,i){return getSlideIntent(i,count);});
  trendContext  = trendContext  || '';
  trendData     = trendData     || null;

  // Build a detailed narrative brief so the AI writes GREAT copy
  var platformVoice = {
    Instagram: 'Instagram: visual, community-first, emoji-friendly, mix of personal story + value. Avoid corporate language.',
    LinkedIn:  'LinkedIn: professional but human, insight-driven, thought-leader tone. Data and specifics beat generalities.',
    TikTok:    'TikTok: fast, punchy, Gen-Z aware, conversational. Short sentences. Hook in first 5 words.',
    'Twitter/X':'Twitter/X: opinionated, hot-take energy, shareable single ideas. Under 240 chars per slide headline.',
    Pinterest: 'Pinterest: aspirational, keyword-rich, descriptive, outcome-focused.'
  };
  var voiceNote = platformVoice[platform] || platformVoice.Instagram;

  var toneNote = {
    'Bold & Direct':  'Be direct and unapologetic. No hedging. Short punchy sentences.',
    Conversational:   'Write like you\'re texting a smart friend. First-person, informal, honest.',
    Professional:     'Authoritative but warm. Data-backed where possible. No jargon.',
    Inspirational:    'Emotionally resonant. Speak to transformation. Avoid clichés.',
    Educational:      'Teach one clear thing per slide. Use concrete examples, not vague advice.',
    Playful:          'Light, witty, fun. Wordplay welcome. Keep it high-energy.'
  }[tone] || '';

  // Use intent-based slide sequence rather than generic type labels
  var slideTypes = intents.map(function(intent, i){
    var desc = {
      hook:     'hook: pattern-interrupt opener, make the reader stop scrolling',
      problem:  'problem: name the specific pain point without being preachy',
      pain:     'pain: deepen the problem — make the reader feel it personally',
      insight:  'insight: the counterintuitive truth that reframes everything',
      solution: 'solution: the clear, actionable fix — one step, not a list',
      result:   'result: what success actually looks like — specific outcomes',
      cta:      'cta: ask a direct question, invite a comment or save'
    }[intent] || 'value: one actionable, specific step';
    return String(i+1)+'. '+desc;
  }).join('\n');

  var trendLine = trendContext ? '\nCurrently trending in this niche: '+trendContext+'.' : '';

  var brief = 'You are Dijo, a world-class social media content strategist.\n\n'
    + 'TASK: Write a ' + count + '-slide carousel on: "' + topic + '"\n'
    + 'Niche: ' + niche + '\n'
    + 'Platform: ' + platform + ' — ' + voiceNote + '\n'
    + 'Tone: ' + tone + ' — ' + toneNote + '\n'
    + trendLine + '\n\n'
    + 'SLIDE SEQUENCE (follow this narrative arc exactly):\n' + slideTypes + '\n\n'
    + 'COPY RULES (non-negotiable):\n'
    + '- Headlines: punchy, specific, under 12 words. NO generic openers like "In today\'s world"\n'
    + '- Body: 2-3 sentences max. Be concrete. Name specific outcomes, numbers, feelings\n'
    + '- No hollow phrases: "game-changing", "skyrocket", "unlock your potential"\n'
    + '- Captions: platform-native voice. No hashtags inside caption body\n'
    + '- Hashtags: 5 per slide — niche-specific + platform-appropriate, never generic filler\n'
    + '- Each slide must feel like a different part of a story arc, not a random list\n\n'
    + 'Return JSON: { slides: [...], theme, accentColor, trendHashtags: [] }';

  console.log('[AI INPUT]', { topic: topic, niche: niche, platform: platform, trend: trendData });

  var res=await fetch(DIJO_SERVER+'/carousel/generate',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      topic:    topic,
      platform: platform,
      tone:     tone,
      count:    count,
      niche:    niche,
      intents:  intents,
      trend:        trendData,
      trendContext: trendContext,
      themeOverride: ST.theme || null,
      brief:    brief
    })
  });
  if(!res.ok) throw new Error('Server responded '+res.status);
  return await res.json();
}

/* ─────────────────────────────────────────────────────────
   8. SLIDE PARSING — v4.4+: hashtags preserved
   ───────────────────────────────────────────────────────── */
function parseServerSlides(data, topic, platform, tone, count){
  try{
    if(!data.slides || !Array.isArray(data.slides)) throw new Error('no slides array');
    var total = data.slides.length;
    var parsed = data.slides.map(function(sl, i){
      var primaryImage = null;
      if(sl.image) primaryImage = {url:sl.image, tone:sl.imageMood||'neutral', brightness:'medium'};
      else if(sl.primaryImage) primaryImage = sl.primaryImage;
      var secondImage = null;
      if(sl.image2) secondImage = {url:sl.image2, tone:'neutral', brightness:'medium'};
      else if(sl.secondImage) secondImage = sl.secondImage;
      var layout = normalizeLayoutSafe(sl.layout, sl.type||'value', i, total);
      var headline = stripHashtags(sl.headline || sl.title || '');
      if(!headline || headline.length < 3){
        headline = i === 0 ? 'The Truth About ' + topic
          : i === total - 1 ? 'Here\'s Your Next Step'
          : 'Slide ' + (i + 1) + ': ' + topic;
      }
      if(headline.length > 120) headline = headline.slice(0, 117) + '…';
      var body = limitBody(sl.body || sl.subline || sl.description || '');
      var caption = buildCaption(sl);
      var hashtags = (Array.isArray(sl.hashtags) && sl.hashtags.length > 0) ? sl.hashtags : [];
      return {
        type:       sl.type || (i === 0 ? 'hook' : i === total - 1 ? 'cta' : 'value'),
        layout:     layout,
        mediaType:  sl.mediaType || 'image',
        tag:        sl.tag || String(i + 1).padStart(2, '0'),
        headline:   headline,
        subline:    sl.subline || '',
        body:       body,
        stat:       sl.stat || null,
        quote:      sl.quote || null,
        points:     sl.points || null,
        gridPoints: sl.gridPoints || (sl.points ? sl.points.map(function(p, pi){
          var glyphs = ['→','★','◆','✦','●','▲'];
          return {glyph: glyphs[pi % glyphs.length], text: p};
        }) : null),
        cta:        sl.cta || '',
        caption:    caption,
        hashtags:   hashtags,
        primaryImage: primaryImage,
        secondImage:  secondImage,
        video:      sl.video || null,
        useVideo:   sl.mediaType === 'video' && !!(sl.video && sl.video.url)
      };
    });
    return normalizeSlidesDeck(parsed);
  } catch(e){
    console.warn('[parseServerSlides] Error:', e.message);
    return fallbackSlides(topic, platform, tone, count);
  }
}

/* ─────────────────────────────────────────────────────────
   buildCaption — v4.4+: server caption first, smart fallback
   ───────────────────────────────────────────────────────── */
function buildCaption(sl){
  if(sl.caption && sl.caption.trim().length > 3) return sl.caption.trim();
  var headline = (sl.headline || '').trim();
  var emoji = sl.type === 'hook' ? '👇'
    : sl.type === 'cta'    ? '🔖'
    : sl.type === 'stat'   ? '📊'
    : sl.type === 'quote'  ? '💬'
    : '💡';
  return headline ? (headline + ' ' + emoji) : 'Save this — you will want it later 👇';
}

/* ─────────────────────────────────────────────────────────
   populateHashtagPanel — shows chips + copy button
   ───────────────────────────────────────────────────────── */
function populateHashtagPanel(slide){
  var panel = document.getElementById('hashtagSection');
  if(!panel) return;
  var tags = [];
  if(Array.isArray(slide.hashtags) && slide.hashtags.length > 0) tags = slide.hashtags;
  else if(Array.isArray(ST.trendHashtags) && ST.trendHashtags.length > 0) tags = ST.trendHashtags.slice(0, 5);
  if(!tags.length){ panel.style.display = 'none'; return; }
  panel.style.display = 'block';
  var chipsEl = document.getElementById('hashtagChips');
  var copyBtn = document.getElementById('hashtagCopyBtn');
  if(chipsEl){
    chipsEl.innerHTML = tags.map(function(tag){
      var clean = tag.startsWith('#') ? tag : '#' + tag;
      return '<span class="hashtag-chip" onclick="copyTag(\'' + clean.replace(/'/g,"\\'") + '\')" title="Click to copy">' + esc(clean) + '</span>';
    }).join('');
  }
  if(copyBtn) copyBtn.style.display = 'flex';
}

window.copyTag = function(tag){
  navigator.clipboard.writeText(tag).then(function(){ toast('✓ ' + tag + ' copied'); });
};

window.copyHashtags = function(){
  if(!window.ST || !ST.slides.length) return;
  var tags = (ST.slides[ST.cur].hashtags || []).slice(0, 5);
  if(!tags.length){ toast('No hashtags on this slide'); return; }
  var out = tags.map(function(t){ return t.startsWith('#') ? t : '#' + t; }).join(' ');
  navigator.clipboard.writeText(out).then(function(){ toast('✓ 5 hashtags copied'); });
};

/* ─────────────────────────────────────────────────────────
   FALLBACK SLIDES — full narrative arc
   ───────────────────────────────────────────────────────── */
function fallbackSlides(topic, platform, tone, count){
  var topicClean = topic || 'this topic';
  var topicTitle = topicClean.charAt(0).toUpperCase() + topicClean.slice(1);
  var arc = [
    {type:'hook',layout:'FULL_BLEED',
     headline:'Everything You\'ve Been Told About ' + topicTitle + ' Is Backwards',
     body:'I spent three years getting this wrong before I found the thing that actually works. Swipe through — this one\'s going to sting a little.'},
    {type:'problem',layout:'OVERLAP_BAND',
     headline:'Here\'s Why Most People Fail at ' + topicTitle,
     body:'It\'s not effort. It\'s not talent. It\'s not even strategy. The real reason is something far more uncomfortable — and nobody talks about it.'},
    {type:'insight',layout:'BOTTOM_STRIP',
     headline:'The Shift That Changes Everything',
     body:'Once you stop focusing on the output and start obsessing over the inputs, the whole game changes. The result isn\'t the goal — the system is.'},
    {type:'stat',layout:'STAT_HERO',stat:'3×',
     headline:'People Who Do This Consistently Outperform Everyone Else',
     body:'Three times the result, in the same time window, with less stress. The difference is one repeatable behaviour.'},
    {type:'quote',layout:'QUOTE_PULL',
     quote:'You don\'t rise to the level of your goals. You fall to the level of your systems.',
     headline:'',body:''},
    {type:'lesson',layout:'EDITORIAL_COLLAGE',
     headline:'What I Wish I Had Known Three Years Ago',
     body:'Nobody tells you this at the start. You have to earn it through trial and error, or find someone who\'s already been through it.'},
    {type:'proof',layout:'DUAL_IMAGE',
     headline:'This Is What the Results Actually Looked Like',
     body:'Not overnight. Not magic. A slow build that suddenly becomes undeniable. The compound effect is real — but only if you start the right system.'},
    {type:'value',layout:'TOP_STRIP',
     headline:'The Three-Part Framework That Runs Everything',
     body:'Step one: identify the one lever that moves everything else. Step two: protect that lever at all costs. Step three: ignore everything that isn\'t that lever.'},
    {type:'insight',layout:'OVERLAP_BAND',
     headline:'The Counterintuitive Truth Nobody Wants to Hear',
     body:'Doing less, more consistently, beats doing everything sporadically. Your brain resists this because it feels like giving up. It isn\'t.'},
    {type:'cta',layout:'FULL_BLEED',
     headline:'Save This. Come Back to It When You\'re Stuck.',
     body:'The people who actually apply this will be in a completely different position six months from now. Which slide hit closest to home? Drop the number in the comments.',
     cta:'Follow for more →'}
  ];
  var selected = [arc[0]];
  var middle = arc.slice(1, arc.length - 1);
  var need = count - 2;
  for(var i = 0; i < need; i++) selected.push(middle[i % middle.length]);
  selected.push(arc[arc.length - 1]);
  selected = selected.slice(0, count);
  var built = selected.map(function(sl, i){
    return {
      type:      sl.type || (i === 0 ? 'hook' : i === count - 1 ? 'cta' : 'insight'),
      layout:    normalizeLayoutSafe(sl.layout, sl.type, i, count),
      mediaType: 'image',
      tag:       String(i + 1).padStart(2, '0'),
      headline:  trimHeadline(sl.headline || ''),
      body:      limitBody(sl.body || ''),
      stat:      sl.stat || null,
      quote:     sl.quote || null,
      cta:       sl.cta || (i === count - 1 ? 'Follow for more →' : ''),
      caption:   i === 0
        ? topicTitle + ' — here\'s the honest version nobody tells you.\n\nSave this if it hits. Share it if someone needs it.'
        : i === count - 1
        ? 'Which slide hit hardest? Drop a number 👇\n\nFollow for more like this.'
        : '',
      hashtags:  [],
      primaryImage: null,
      secondImage:  null
    };
  });
  return normalizeSlidesDeck(built);
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

  var videoData=slide.video||null;
  var useVideo=(slide.mediaType==='video'||slide.useVideo)&&videoData&&videoData.url;

  if(useVideo){
    sBgImg.style.opacity='0';
    sVideo.innerHTML='<video autoplay muted loop playsinline style="width:100%;height:100%;object-fit:cover;opacity:.85"><source src="'+videoData.url+'" type="video/mp4"></video>';
    sVideo.style.display='block';
    sBg.style.background='#111';
  } else {
    sVideo.innerHTML='';sVideo.style.display='none';
    var needsBg=['FULL_BLEED','DUAL_IMAGE','OVERLAP_BAND','TOP_STRIP','BOTTOM_STRIP','EDITORIAL_COVER','HABIT_COVER'].indexOf(layout)!==-1;
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
        dh+='<div class="s-headline" style="font-family:'+getFont('head')+';font-size:'+headlineSize(slide.headline)+'px;font-weight:800;line-height:1.15;color:#fff;text-shadow:0 2px 16px rgba(0,0,0,.6);margin-bottom:8px">'+esc(slide.headline)+'</div>';
        if(slide.body) dh+='<div class="s-body" style="font-size:13px;line-height:1.6;color:rgba(255,255,255,.85);margin-bottom:10px">'+esc(slide.body)+'</div>';
        if(slide.cta) dh+='<div class="s-cta" style="display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:8px;font-size:11px;font-weight:700;font-family:'+getFont('head')+';background:'+accent2+';color:#fff;width:fit-content">'+esc(slide.cta)+' →</div>';
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
        +'<div class="s-headline" style="font-family:'+getFont('head')+';font-size:'+Math.min(26,headlineSize(slide.headline))+'px;font-weight:800;line-height:1.15;color:#fff">'+esc(slide.headline)+'</div>'
        +(slide.body?'<div class="s-body" style="font-size:12px;line-height:1.5;color:rgba(255,255,255,.85);margin-top:2px">'+esc(slide.body)+'</div>':'')
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
      sh+='<div class="s-headline" style="font-family:'+getFont('head')+';font-size:'+Math.min(24,headlineSize(slide.headline))+'px;font-weight:700;line-height:1.2;color:'+sColor+';margin-top:6px">'+esc(slide.headline)+'</div>';
      if(slide.body) sh+='<div class="s-body" style="font-size:12px;line-height:1.55;opacity:.72;margin-top:8px;color:'+sColor+'">'+esc(slide.body)+'</div>';
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
      qh+='<div class="s-headline" style="font-family:'+getFont('head')+';font-size:'+qFontSize+'px;font-weight:700;line-height:1.4;color:'+qColor+';letter-spacing:-0.3px;max-width:88%;margin:0 auto;">'+esc(qText)+'</div>';
      qh+='<div style="width:40px;height:2px;background:'+accent2+';border-radius:1px;margin-top:28px;"></div>';
      if(slide.tag) qh+='<div style="margin-top:16px;font-size:10px;font-family:'+getFont('mono')+';letter-spacing:2.5px;text-transform:uppercase;color:'+accent2+';opacity:0.8;">'+esc(slide.tag)+'</div>';
      if(slide.body&&!slide.quote) qh+='<div class="s-body" style="margin-top:14px;font-size:12px;line-height:1.65;color:'+qColor+';opacity:0.6;max-width:80%;">'+esc(slide.body)+'</div>';
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
      hcTop.innerHTML='<span style="font-size:9px;font-weight:700;font-family:'+getFont('mono')+';color:rgba(255,255,255,.82);letter-spacing:.14em;text-transform:uppercase;">'+(ST.brand?ST.brand.toUpperCase():'IMPACTGRID')+'</span>'
        +'<span style="font-size:9px;font-weight:700;font-family:'+getFont('mono')+';color:rgba(255,255,255,.82);letter-spacing:.14em;text-transform:uppercase;">@'+(ST.brand?ST.brand.toLowerCase().replace(/\s+/g,''):'impactgridgroup')+'</span>';
      hcEl.appendChild(hcTop);
      var hcTitle=document.createElement('div');
      hcTitle.style.cssText='position:absolute;left:16px;right:16px;bottom:80px;z-index:2;';
      var words=(slide.headline||'Habits That Changed My Life').split(' ');
      var mid=Math.ceil(words.length/2);
      var line1=words.slice(0,mid).join(' ');
      var line2=words.slice(mid).join(' ');
      var titleFontSize=Math.min(72,Math.max(42,Math.round(560/Math.max(slide.headline.length,6))));
      hcTitle.innerHTML='<div class="s-headline" style="font-family:'+getFont('head')+';font-size:'+titleFontSize+'px;font-weight:800;color:'+accent2+';line-height:.92;letter-spacing:-.5px;margin-bottom:2px;">'+esc(line1)+'</div>'
        +'<div style="font-family:'+getFont('head')+';font-size:'+titleFontSize+'px;font-weight:800;color:'+accent2+';line-height:.92;letter-spacing:-.5px;">'+esc(line2||line1)+'</div>';
      hcEl.appendChild(hcTitle);
      if(slide.body||slide.subline){
        var hcSub=document.createElement('div');
        hcSub.style.cssText='position:absolute;left:16px;right:40%;bottom:52px;z-index:2;font-family:'+getFont('body')+';font-size:10px;font-weight:400;color:'+accent2+';line-height:1.5;letter-spacing:.02em;text-transform:uppercase;';
        hcSub.textContent=slide.body||slide.subline||'';
        hcEl.appendChild(hcSub);
      }
      var hcSwirl=document.createElement('div');
      hcSwirl.style.cssText='position:absolute;right:24px;bottom:120px;z-index:2;width:70px;height:70px;opacity:.9;';
      hcSwirl.innerHTML='<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" fill="none"><path d="M55 20 C55 20 70 30 62 48 C54 66 30 62 22 46 C14 30 28 14 44 18" stroke="white" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M44 18 L38 10 M44 18 L52 14" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      hcEl.appendChild(hcSwirl);
      var hcBot=document.createElement('div');
      hcBot.style.cssText='position:absolute;bottom:0;left:0;right:0;z-index:2;padding:11px 18px;display:flex;justify-content:space-between;align-items:center;';
      hcBot.innerHTML='<span style="font-size:9px;font-family:'+getFont('mono')+';color:rgba(255,255,255,.55);letter-spacing:.06em;">'+(ST.brand?'WWW.'+ST.brand.toUpperCase().replace(/\s+/g,'')+'.COM':'WWW.IMPACTGRIDGROUP.COM')+'</span>'
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
      ecBrand.textContent=ST.brand||'ImpactGrid';
      ecBrand.style.cssText='position:absolute;top:16px;right:16px;z-index:2;font-size:11px;font-family:'+getFont('body')+';font-weight:400;color:rgba(255,255,255,.88);letter-spacing:.4px;';
      ecEl.appendChild(ecBrand);
      var words2=(slide.headline||'3 Ways to Style Your Own Home').split(' ');
      var scriptWordCount=Math.min(2,Math.ceil(words2.length/3));
      var normalWords=words2.slice(0,-scriptWordCount);
      var scriptWords=words2.slice(-scriptWordCount);
      var titleFontSz=Math.min(62,Math.max(34,Math.round(500/Math.max(slide.headline.length,6))));
      var ecTitle=document.createElement('div');
      ecTitle.style.cssText='position:absolute;bottom:50px;left:18px;right:18px;z-index:2;';
      ecTitle.innerHTML='<div class="s-headline" style="font-family:Georgia,\'Times New Roman\',serif;font-size:'+titleFontSz+'px;font-weight:400;color:#fff;line-height:1.0;text-shadow:0 2px 24px rgba(0,0,0,.4);">'+esc(normalWords.join(' '))+'</div>'
        +'<div style="font-family:Georgia,\'Times New Roman\',serif;font-size:'+(titleFontSz+4)+'px;font-style:italic;font-weight:400;color:#fff;line-height:1.0;text-shadow:0 2px 24px rgba(0,0,0,.4);">'+esc(scriptWords.join(' '))+'</div>';
      ecEl.appendChild(ecTitle);
      if(slide.body){
        var ecBody=document.createElement('div');
        ecBody.style.cssText='position:absolute;bottom:18px;left:18px;right:18px;z-index:2;font-size:11px;font-family:'+getFont('body')+';color:rgba(255,255,255,.75);line-height:1.55;';
        ecBody.textContent=slide.body;
        ecEl.appendChild(ecBody);
      }
      var ecHandle=document.createElement('div');
      ecHandle.textContent='@'+(ST.brand?ST.brand.toLowerCase().replace(/\s+/g,''):'impactgridgroup');
      ecHandle.style.cssText='position:absolute;bottom:16px;left:18px;z-index:2;font-size:10px;font-family:'+getFont('body')+';color:rgba(255,255,255,.65);letter-spacing:.2px;';
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
      ecolBrand.textContent=ST.brand||'ImpactGrid';
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
      var ecWords=(slide.headline||'Create a Cozy & Functional Space').split(' ');
      var ecScriptCount=Math.min(1,ecWords.length-1);
      var ecNormal=ecWords.slice(0,-ecScriptCount||undefined).join(' ');
      var ecScript=ecScriptCount?ecWords.slice(-ecScriptCount).join(' '):'';
      var ecFontSz=Math.min(24,headlineSize(slide.headline));
      var ecolH='';
      ecolH+='<div class="s-headline" style="font-family:Georgia,\'Times New Roman\',serif;font-size:'+ecFontSz+'px;font-weight:400;line-height:1.15;color:#1a1814;margin-bottom:0;">'+esc(ecNormal)+'</div>';
      if(ecScript) ecolH+='<div style="font-family:Georgia,\'Times New Roman\',serif;font-size:'+(ecFontSz+2)+'px;font-style:italic;font-weight:400;line-height:1.1;color:#1a1814;margin-top:-4px;">'+esc(ecScript)+'</div>';
      if(slide.body) ecolH+='<div class="s-body" style="font-size:11px;line-height:1.7;color:#555;margin-top:6px;">'+esc(slide.body)+'</div>';
      ecolText.innerHTML=ecolH;
      ecolEl.appendChild(ecolText);
      var ecolFoot=document.createElement('div');
      ecolFoot.style.cssText='position:absolute;bottom:12px;left:14px;z-index:6;font-size:10px;font-family:'+getFont('body')+';color:#a09888;';
      ecolFoot.textContent='@'+(ST.brand?ST.brand.toLowerCase().replace(/\s+/g,''):'impactgridgroup');
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
      ec3Brand.textContent=ST.brand||'ImpactGrid';
      ec3Brand.style.cssText='position:absolute;top:16px;right:14px;z-index:6;font-size:11px;font-family:'+getFont('body')+';color:#888;';
      ec3El.appendChild(ec3Brand);
      var ec3Num=document.createElement('div');
      ec3Num.textContent=String(ST.cur+1).padStart(2,'0');
      ec3Num.style.cssText='position:absolute;top:36px;left:12px;z-index:2;font-family:Georgia,"Times New Roman",serif;font-size:108px;font-style:italic;font-weight:700;color:#1a1814;line-height:1;opacity:.9;';
      ec3El.appendChild(ec3Num);
      var ec3Text=document.createElement('div');
      ec3Text.style.cssText='position:absolute;left:0;right:52%;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;padding:24px 14px 24px 14px;gap:8px;z-index:5;background:#f0ebe1;border-right:2px solid rgba(180,160,130,.25);';
      var ec3Words=(slide.headline||'Keep It Clean & Organized').split(' ');
      var ec3ScriptCount=Math.min(1,ec3Words.length-1);
      var ec3Normal=ec3Words.slice(0,-ec3ScriptCount||undefined).join(' ');
      var ec3Script=ec3ScriptCount?ec3Words.slice(-ec3ScriptCount).join(' '):'';
      var ec3FontSz=Math.min(22,headlineSize(slide.headline));
      var ec3H='';
      ec3H+='<div class="s-headline" style="font-family:Georgia,\'Times New Roman\',serif;font-size:'+ec3FontSz+'px;font-weight:400;line-height:1.15;color:#1a1814;">'+esc(ec3Normal)+'</div>';
      if(ec3Script) ec3H+='<div style="font-family:Georgia,\'Times New Roman\',serif;font-size:'+(ec3FontSz+2)+'px;font-style:italic;font-weight:400;line-height:1.1;color:#1a1814;margin-top:-4px;">'+esc(ec3Script)+'</div>';
      if(slide.body) ec3H+='<div class="s-body" style="font-size:11px;line-height:1.7;color:#555;margin-top:6px;">'+esc(slide.body)+'</div>';
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
      ec3Foot.textContent='@'+(ST.brand?ST.brand.toLowerCase().replace(/\s+/g,''):'impactgridgroup');
      ec3El.appendChild(ec3Foot);
      var ec3Stars=document.createElement('div');
      ec3Stars.innerHTML='✽ ✽ ✽';
      ec3Stars.style.cssText='position:absolute;bottom:12px;right:12px;z-index:6;font-size:14px;color:#b0a090;letter-spacing:4px;';
      ec3El.appendChild(ec3Stars);
      break;
    }

  } /* end switch */

  document.getElementById('sNum').textContent=(ST.cur+1)+' / '+ST.slides.length;
  var brandEl=document.getElementById('sBrand');
  var editorialLayouts=['EDITORIAL_COVER','EDITORIAL_COLLAGE','EDITORIAL_COLLAGE_3','HABIT_COVER'];
  brandEl.textContent=editorialLayouts.indexOf(layout)===-1?(ST.brand||''):'';
  brandEl.style.color=tc.head;

  var badge2=document.getElementById('layoutBadge');
  if(badge2) badge2.textContent=layout.replace(/_/g,' ');

  document.querySelectorAll('.layout-btn').forEach(function(btn){
    var match=btn.getAttribute('onclick')||'';
    btn.classList.toggle('active',match.indexOf("'"+layout+"'")!==-1||match.indexOf('"'+layout+'"')!==-1);
  });

  updateThumbActive();
  makeEditable();
}

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
  h+='<div class="s-headline" style="font-family:'+getFont('head')+';font-size:'+Math.min(26,headlineSize(slide.headline))+'px;font-weight:800;line-height:1.2;color:'+pText+';margin-bottom:6px">'+esc(slide.headline)+'</div>';
  if(slide.body) h+='<div class="s-body" style="font-size:12px;line-height:1.65;color:'+pText+';opacity:.75;margin-bottom:8px">'+esc(slide.body)+'</div>';
  if(slide.cta) h+='<div class="s-cta" style="display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:8px;font-size:11px;font-weight:700;font-family:'+getFont('head')+';background:'+accent2+';color:'+pBg+';width:fit-content">'+esc(slide.cta)+' →</div>';
  return h;
}

function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

/* ─────────────────────────────────────────────────────────
   INLINE EDITING
   ───────────────────────────────────────────────────────── */
function makeEditable(){
  var canvas = document.getElementById('slideCanvas');
  if(!canvas) return;
  // All text elements across every layout — headline, body, cta, tag, stat, quote, brand
  var editableSelectors = [
    '.s-headline','.s-body','.s-cta','.s-tag',
    '.s-stat-num','.s-quote-text','.s-quote-attr',
    '.s-grid-header','.s-grid-ptxt',
    '.s-split-text .s-headline','.s-split-text .s-body',
    '.s-dual-text .s-headline','.s-dual-text .s-body',
    '.s-editorial .s-headline','.s-editorial .s-body',
    '.s-stat-wrap .s-headline','.s-stat-wrap .s-body'
  ];
  var targets = canvas.querySelectorAll(editableSelectors.join(','));
  targets.forEach(function(el){
    if(el.dataset.editable === '1') return;
    el.dataset.editable = '1';
    el.style.cursor = 'text';
    el.title = 'Click to edit';
    el.addEventListener('click', function(e){
      e.stopPropagation();
      startInlineEdit(el);
    });
  });
  if(!canvas.dataset.editDelegated){
    canvas.dataset.editDelegated = '1';
    canvas.addEventListener('click', function(e){
      var t = e.target;
      while(t && t !== canvas){
        var isEditable = t.classList.contains('s-headline') ||
                         t.classList.contains('s-body') ||
                         t.classList.contains('s-cta') ||
                         t.classList.contains('s-tag') ||
                         t.classList.contains('s-stat-num') ||
                         t.classList.contains('s-quote-text') ||
                         t.classList.contains('s-quote-attr') ||
                         t.classList.contains('s-grid-header') ||
                         t.classList.contains('s-grid-ptxt') ||
                         t.dataset.editKey;
        if(isEditable){ startInlineEdit(t); return; }
        t = t.parentElement;
      }
    });
  }
}

function startInlineEdit(el){
  if(el.dataset.editing === '1') return;
  el.dataset.editing = '1';
  var original = el.textContent;
  el.setAttribute('contenteditable', 'true');
  el.style.outline = '2px solid rgba(255,255,255,0.6)';
  el.style.outlineOffset = '4px';
  el.style.borderRadius = '3px';
  el.style.minWidth = '40px';
  el.style.cursor = 'text';
  el.focus();
  var range = document.createRange();
  range.selectNodeContents(el);
  var sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  function commit(){
    el.removeAttribute('contenteditable');
    el.dataset.editing = '0';
    el.style.outline = '';
    el.style.outlineOffset = '';
    el.style.borderRadius = '';
    var newText = el.textContent.trim();
    if(!newText) el.textContent = original;
    if(ST.slides && ST.slides[ST.cur]){
      var s = ST.slides[ST.cur];
      var txt = el.textContent.trim();
      if(el.classList.contains('s-headline')||el.classList.contains('s-title')){
        s.headline = txt;
      } else if(el.classList.contains('s-body')){
        s.body = txt;
      } else if(el.classList.contains('s-cta')){
        s.cta = txt.replace(/\s*→\s*$/, '');
      } else if(el.classList.contains('s-tag')){
        s.tag = txt;
      } else if(el.classList.contains('s-stat-num')){
        s.stat = txt;
        var eStatEl = document.getElementById('eStat');
        if(eStatEl) eStatEl.value = txt;
      } else if(el.classList.contains('s-quote-text')){
        s.quote = txt; s.headline = txt;
        var eQuoteEl = document.getElementById('eQuote');
        if(eQuoteEl) eQuoteEl.value = txt;
      } else if(el.classList.contains('s-quote-attr')){
        s.quoteAttr = txt;
      } else if(el.classList.contains('s-grid-header')){
        s.headline = txt;
      } else if(el.classList.contains('s-grid-ptxt')){
        // find which point this is and update
        var pts = el.closest('.s-grid-wrap') && el.closest('.s-grid-wrap').querySelectorAll('.s-grid-ptxt');
        if(pts && s.points){ pts.forEach(function(p,i){ if(p===el && s.points[i]) s.points[i]=txt; }); }
      }
    }
  }
  el.addEventListener('blur', commit, {once:true});
  el.addEventListener('keydown', function(e){
    if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();el.blur();}
    if(e.key==='Escape'){el.textContent=original;el.blur();}
  });
}

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
function setFmt(f){
  ST.format=f;
  // update old icon buttons (in right panel header if still present)
  ['square','portrait','landscape'].forEach(function(x){
    var el=document.getElementById('fmt'+x.charAt(0).toUpperCase()+x.slice(1));
    if(el) el.classList.toggle('on',x===f);
  });
  // update new left panel fmt-btn buttons
  document.querySelectorAll('.fmt-btn').forEach(function(btn){
    btn.classList.toggle('active', btn.id==='fmt'+f.charAt(0).toUpperCase()+f.slice(1));
  });
  var c=document.getElementById('slideCanvas');
  c.className='slide-canvas';
  if(f==='portrait') c.classList.add('portrait');
  else if(f==='landscape') c.classList.add('landscape');
  else if(f==='story'){ c.style.width='372px'; c.style.height='664px'; }
  if(f!=='story'){ c.style.width=''; c.style.height=''; }
}
function shuffleAssets(){ST.assetOffset=(ST.assetOffset+1)%10;buildStrip();renderSlide();toast('🔀 New assets selected');}

/* ─────────────────────────────────────────────────────────
   12. EDIT PANEL — v4.5: uses buildCaption + populateHashtagPanel
   ───────────────────────────────────────────────────────── */
function fillEdit(){
  if(!ST.slides.length) return;
  var s=ST.slides[ST.cur];
  var eHead=document.getElementById('eHead');
  var eBody=document.getElementById('eBody');
  if(eHead) eHead.value=s.headline||'';
  if(eBody) eBody.value=s.body||s.subline||'';
  var capEl=document.getElementById('eCap');
  if(capEl) capEl.value=buildCaption(s);
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
  populateHashtagPanel(s);
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
function updateBrand(){ST.brand=document.getElementById('brandInput')?document.getElementById('brandInput').value:'';if(ST.slides.length) renderSlide();}

function changeLayout(newLayout){
  if(!ST.slides.length) return;
  ST.slides[ST.cur].layout=newLayout;
  renderSlide();fillEdit();
  toast('Layout → '+newLayout.replace(/_/g,' '));
}

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
   14. ACCENT / THEME / FONT
   ───────────────────────────────────────────────────────── */
function setAccent(c,el){ST.accent=c;document.querySelectorAll('.cdot').forEach(function(d){d.classList.remove('on');});el.classList.add('on');if(ST.slides.length) renderSlide();}
function toggleTheme(){var isDark=document.documentElement.getAttribute('data-theme')==='dark';document.documentElement.setAttribute('data-theme',isDark?'light':'dark');document.querySelector('[onclick="toggleTheme()"]').textContent=isDark?'🌙':'☀️';}

/* ─────────────────────────────────────────────────────────
   15. COPY & EXPORT
   ───────────────────────────────────────────────────────── */
function copyCaption(){
  var capEl=document.getElementById('eCap');
  var c=capEl?capEl.value:'';
  if(!c){toast('No caption on this slide');return;}
  navigator.clipboard.writeText(c).then(function(){toast('✓ Caption copied');});
}

function copyAll(){
  if(!ST.slides.length){toast('Generate a carousel first');return;}
  var all=ST.slides.map(function(s,i){
    var cap=buildCaption(s);
    var tags=(s.hashtags&&s.hashtags.length)?'\n\n'+s.hashtags.join(' '):'';
    return '── SLIDE '+(i+1)+' ──\nHeadline: '+(s.headline||'')+'\nBody: '+(s.body||'')+'\n\nCaption:\n'+cap+tags;
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
      slides:ST.slides.map(function(s){return {headline:s.headline,body:s.body,caption:buildCaption(s),hashtags:s.hashtags,layout:s.layout,type:s.type};}),
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
    exportSlidesAsMP4();
  }
}

async function exportSlidesAsPNG(){
  if(typeof html2canvas==='undefined'){
    toast('💡 html2canvas not loaded — please refresh the page');
    return;
  }

  if(!ST.slides.length){
    toast('Generate a carousel first');
    return;
  }

  toast('📦 Preparing full carousel…');

  var originalIndex=ST.cur;
  var canvas=document.getElementById('slideCanvas');
  // Output at 1080px (Instagram native) regardless of display size
  var displayW=canvas.offsetWidth||620;
  var targetPx=1080;
  var exportScale=Math.round((targetPx/displayW)*10)/10;

  for(var i=0;i<ST.slides.length;i++){
    ST.cur=i;
    renderSlide();

    // Wait for background images to paint — poll until all imgs inside canvas are complete
    await new Promise(function(r){setTimeout(r,600);});
    var imgs=canvas.querySelectorAll('img');
    await Promise.all(Array.from(imgs).map(function(img){
      if(img.complete) return Promise.resolve();
      return new Promise(function(res){
        img.onload=res; img.onerror=res;
        setTimeout(res,2000); // safety cap
      });
    }));
    // Extra settle time for CSS background-image transitions
    await new Promise(function(r){setTimeout(r,300);});

    try{
      var c=await html2canvas(canvas,{
        useCORS:true,
        allowTaint:true,
        scale:exportScale,
        backgroundColor:'#111111',
        imageTimeout:8000,
        logging:false
      });

      await new Promise(function(resolve){
        c.toBlob(function(blob){
          if(blob){
            triggerBlobDownload(blob,'ImpactGrid-slide-'+String(i+1).padStart(2,'0')+'.png');
          }
          resolve();
        },'image/png');
      });
    }catch(e){
      console.warn('[exportSlidesAsPNG] slide '+(i+1)+' failed:',e);
      toast('⚠️ Slide '+(i+1)+' capture failed — skipped');
    }

    await new Promise(function(r){setTimeout(r,400);});
  }

  ST.cur=originalIndex;
  renderSlide();

  toast('✓ '+ST.slides.length+' slides saved at 1080px');
}

async function exportSlidesAsMP4(){
  if(typeof html2canvas==='undefined'){
    toast('💡 html2canvas not loaded — please refresh the page');
    return;
  }
  if(!ST.slides.length){
    toast('Generate a carousel first');
    return;
  }

  // Check MediaRecorder support
  var mimeType = '';
  var candidates = ['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm','video/mp4'];
  for(var m=0;m<candidates.length;m++){
    if(MediaRecorder.isTypeSupported(candidates[m])){ mimeType=candidates[m]; break; }
  }
  if(!mimeType){
    toast('⚠️ Your browser doesn\'t support video recording — try Chrome');
    return;
  }

  toast('🎬 Building video — please wait…');

  var canvas=document.getElementById('slideCanvas');
  var displayW=canvas.offsetWidth||620;
  var displayH=canvas.offsetHeight||620;
  // Create an offscreen canvas at 1080×1080 for recording
  var offCanvas=document.createElement('canvas');
  offCanvas.width=1080; offCanvas.height=1080;
  var ctx=offCanvas.getContext('2d');

  var originalIndex=ST.cur;
  var chunks=[];
  var stream=offCanvas.captureStream(30);
  var recorder=new MediaRecorder(stream,{mimeType:mimeType,videoBitsPerSecond:8000000});
  recorder.ondataavailable=function(e){ if(e.data&&e.data.size>0) chunks.push(e.data); };

  var secPerSlide=3; // seconds per slide in video
  var fps=30;
  var framesPerSlide=secPerSlide*fps;

  recorder.start();

  var scale=1080/displayW;

  for(var i=0;i<ST.slides.length;i++){
    ST.cur=i; renderSlide();
    // Wait for slide + images
    await new Promise(function(r){setTimeout(r,700);});
    var imgs=canvas.querySelectorAll('img');
    await Promise.all(Array.from(imgs).map(function(img){
      if(img.complete) return Promise.resolve();
      return new Promise(function(res){ img.onload=res; img.onerror=res; setTimeout(res,2000); });
    }));
    await new Promise(function(r){setTimeout(r,300);});

    // Capture slide to offscreen canvas
    try{
      var captured=await html2canvas(canvas,{
        useCORS:true,allowTaint:true,scale:scale,
        backgroundColor:'#111111',imageTimeout:8000,logging:false
      });
      // Hold this frame for secPerSlide seconds
      for(var f=0;f<framesPerSlide;f++){
        ctx.drawImage(captured,0,0,1080,1080);
        await new Promise(function(r){setTimeout(r,1000/fps);});
      }
    }catch(e){
      console.warn('[exportMP4] slide '+(i+1)+' failed:',e);
    }
    toast('🎬 Slide '+(i+1)+' of '+ST.slides.length+' rendered…');
  }

  recorder.stop();
  ST.cur=originalIndex; renderSlide();

  await new Promise(function(r){ recorder.onstop=r; });

  var ext = mimeType.startsWith('video/mp4') ? 'mp4' : 'webm';
  var blob=new Blob(chunks,{type:mimeType});
  triggerBlobDownload(blob,'ImpactGrid-carousel.'+ext);
  toast('✓ Video downloaded ('+ST.slides.length+' slides · '+secPerSlide+'s each)');
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


/* ═══════════════════════════════════════════════════════════
   ╔═══════════════════════════════════════════════════════╗
   ║   CAPTION ENGINE v1.5 — merged from                  ║
   ║   carousel-studio-captions.js                        ║
   ║   Live trends · AI captions · Scored hashtags        ║
   ╚═══════════════════════════════════════════════════════╝
   ═══════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  /* ── Live trend cache ── */
  var _liveHashtags = [];
  var _liveTrends   = [];
  var _lastFetch    = 0;
  var CACHE_MS      = 30 * 60 * 1000; // 30 min

  /* ═══ 1. FETCH LIVE TRENDS ═══════════════════════════════ */
  async function fetchLiveTrends(){
    var now = Date.now();
    if(_liveHashtags.length && (now - _lastFetch) < CACHE_MS) return;
    try{
      var res  = await fetch(DIJO_SERVER + '/trends/live?limit=20');
      var data = await res.json();
      if(data.trends && data.trends.length){
        _liveTrends   = data.trends;
        _liveHashtags = extractHashtagsFromTrends(data.trends);
        _lastFetch    = now;
        if(typeof ST !== 'undefined') ST.trendHashtags = _liveHashtags.slice(0,8);
      }
    }catch(e){
      console.warn('[CaptionEngine] Trend fetch failed:', e.message);
    }
  }

  function extractHashtagsFromTrends(trends){
    var tags=[], seen={};
    trends.forEach(function(t){
      if(Array.isArray(t.hashtags)){
        t.hashtags.forEach(function(h){
          var clean = h.startsWith('#') ? h : '#'+h;
          if(!seen[clean]){seen[clean]=1;tags.push(clean);}
        });
      }
      if(t.topic){
        var derived = '#'+t.topic.replace(/[^a-zA-Z0-9]/g,'').toLowerCase();
        if(derived.length>2 && !seen[derived]){seen[derived]=1;tags.push(derived);}
      }
    });
    return tags;
  }

  /* ═══ 2. SCORED HASHTAG PICKER ═══════════════════════════ */
  var NICHE_MAP = {
    money:       ['#financetips','#moneymoves','#wealthbuilding','#passiveincome','#financialfreedom'],
    invest:      ['#investing101','#stockmarket','#buildwealth','#investsmart','#moneymatters'],
    business:    ['#entrepreneurship','#businessgrowth','#smallbusiness','#startups','#businesstips'],
    creator:     ['#contentcreator','#creatortips','#growthstrategy','#creatoreconomy','#contentmarketing'],
    fitness:     ['#fitnessmotivation','#workoutgoals','#healthylifestyle','#gymlife','#fitfam'],
    food:        ['#foodie','#foodphotography','#easyrecipes','#homecooking','#foodlover'],
    travel:      ['#wanderlust','#travelgram','#travellife','#exploremore','#travelphotography'],
    fashion:     ['#ootd','#fashionstyle','#styleinspo','#fashionblogger','#outfitideas'],
    home:        ['#homedecor','#interiordesign','#homeinspo','#cozyvibes','#homestyle'],
    mindset:     ['#mindsetshift','#personaldevelopment','#selfgrowth','#motivationquotes','#growthmindset'],
    health:      ['#wellnessjourney','#healthyliving','#mentalhealth','#selfcare','#mindbody'],
    ai:          ['#artificialintelligence','#aitools','#techtrends','#futureofwork','#digitaltransformation'],
    productivity:['#productivityhacks','#timemanagement','#deepwork','#morningroutine','#focusmode']
  };

  var PLATFORM_TAGS = {
    Instagram:  ['#instagramcreators','#reels','#igdaily','#explorepage','#contentcreator'],
    LinkedIn:   ['#linkedintips','#thoughtleadership','#careergrowth','#professionaladvice','#leadership'],
    TikTok:     ['#fyp','#foryoupage','#tiktokcreator','#viraltiktok','#trendingvideo'],
    'Twitter/X':['#twittermarketing','#growthhacking','#viralcontent','#digitalmarketing','#contentcreator'],
    Pinterest:  ['#pinterestmarketing','#savethis','#pinterestinspired','#pinit','#pinterestcreator']
  };

  var SLIDE_TYPE_TAGS = {
    hook:'#stopit', cta:'#savethis', stat:'#data',
    quote:'#quotestoliveby', proof:'#results', lesson:'#lessonslearned'
  };

  function pickHashtagsForSlide(topic, platform, slideType){
    var topicLower = (topic||'').toLowerCase();
    var tags=[], seen={};

    // A) Niche match
    Object.keys(NICHE_MAP).forEach(function(kw){
      if(topicLower.indexOf(kw)!==-1){
        NICHE_MAP[kw].forEach(function(t){
          if(!seen[t]){seen[t]=1;tags.push({tag:t,score:10});}
        });
      }
    });

    // B) Platform tags
    var platTags = PLATFORM_TAGS[platform]||PLATFORM_TAGS.Instagram;
    platTags.forEach(function(t){
      if(!seen[t]){seen[t]=1;tags.push({tag:t,score:7});}
    });

    // C) Live trending — highest signal
    _liveHashtags.slice(0,10).forEach(function(t,i){
      if(!seen[t]){seen[t]=1;tags.push({tag:t,score:9-i*0.3});}
    });

    // D) Slide-type tag
    var typeTag = SLIDE_TYPE_TAGS[slideType];
    if(typeTag && !seen[typeTag]) tags.push({tag:typeTag,score:5});

    tags.sort(function(a,b){return b.score-a.score;});
    var final=[], finalSeen={};
    tags.forEach(function(t){
      var clean=t.tag.startsWith('#')?t.tag:'#'+t.tag;
      if(!finalSeen[clean]&&final.length<5){finalSeen[clean]=1;final.push(clean);}
    });
    // Pad to 5
    ['#viral','#trending','#explore','#instagood','#content'].forEach(function(t){
      if(final.length<5&&!finalSeen[t]){finalSeen[t]=1;final.push(t);}
    });
    return final;
  }

  /* ═══ 3. AI CAPTION WRITER ════════════════════════════════ */
  var CAPTION_GOAL = {
    hook:   'Write a pattern-interrupt hook. Bold statement, stops scroll. 1-2 lines. End with "Swipe →" variant.',
    cta:    'Write a strong CTA. Ask a direct question. Tell them exactly what to do (save/share/follow/comment).',
    stat:   'Amplify the stat with real-world implication. Make the number personal. 2-3 sentences.',
    quote:  'Extend the quote\'s meaning. 1-2 sentences. Ask reader what they think.',
    value:  'Preview the value inside. Use curiosity gap. 2-3 sentences.',
    insight:'Tease the insight without giving it away. Create urgency to swipe.',
    lesson: '"I used to think…" or "Nobody told me…" framing. 2 sentences.',
    proof:  'Reference results or transformation. Invite reader to imagine their own.',
    problem:'Validate the reader\'s frustration. Promise relief inside.',
    list:   'Tease the list. Say what it is and why it matters. "Save this before you forget" at end.',
    story:  'Drop reader into the middle of a moment. 2 sentences, cinematic.'
  };

  var PLATFORM_VOICE = {
    Instagram:  'Instagram: community-first, emoji-rich, personal. Mix punchy line + question + CTA.',
    LinkedIn:   'LinkedIn: professional but human, insight-driven. Data > generalities. No emoji unless natural.',
    TikTok:     'TikTok: fast, punchy, Gen-Z aware. Hook in first 3 words. Max 150 chars before line break.',
    'Twitter/X':'Twitter/X: opinionated, shareable, under 240 chars. Hot take energy.',
    Pinterest:  'Pinterest: descriptive, keyword-rich, aspirational. Focus on the outcome.'
  };

  async function generateCaption(topic, platform, slide){
    var slideType = slide.type || 'insight';
    var headline  = slide.headline || topic;
    var body      = slide.body || '';
    var goal      = CAPTION_GOAL[slideType] || CAPTION_GOAL.insight;
    var voice     = PLATFORM_VOICE[platform] || PLATFORM_VOICE.Instagram;
    var trendStr  = '';
    if(_liveTrends.length){
      var topTrends = _liveTrends.slice(0,3).map(function(t){return t.topic;});
      trendStr = ' Currently trending: '+topTrends.join(', ')+'.';
    }
    var prompt = 'You are a world-class social media copywriter. Write ONE caption only — no labels, no preamble, just the text.\n\n'
      +'Topic: "'+topic+'"\n'
      +'Slide type: '+slideType+'\n'
      +'Headline: '+headline+'\n'
      +(body?'Body: '+body+'\n':'')
      +'Platform: '+platform+' — '+voice+'\n'
      +trendStr+'\n\n'
      +'Goal: '+goal+'\n\n'
      +'Rules: No hashtags in caption. No filler phrases. Be specific, human, direct. '
      +'Write exactly what a top creator in this niche would post.';
    try{
      var res = await fetch(DIJO_SERVER+'/chat',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({message:prompt,mode:'creator'})
      });
      if(!res.ok) throw new Error('Caption API '+res.status);
      var data = await res.json();
      return (data.reply||'').trim();
    }catch(e){
      console.warn('[CaptionEngine] Caption API failed:', e.message);
      return buildFallbackCaption(topic, platform, slide);
    }
  }

  function buildFallbackCaption(topic, platform, slide){
    var type = slide.type||'insight';
    var headline = slide.headline||topic;
    var fallbacks = {
      hook:   'Most people get this completely wrong. Swipe to see what nobody tells you about '+topic+' →',
      cta:    'Save this. Share it with someone who needs it. Which slide hit hardest? Drop a number 👇',
      stat:   headline+'\n\nThe numbers don\'t lie — but most people never look. Save this for later.',
      quote:  '"'+(slide.quote||headline)+'"\n\nDoes this land for you? Tell me below 👇',
      value:  headline+'\n\nSwipe through for the full breakdown. This one\'s worth saving 🔖',
      insight:'Here\'s what changed everything for me about '+topic+'. Slide 3 is the one nobody talks about →',
      lesson: 'I wish someone told me this sooner. Everything about '+topic+' — the honest version.'
    };
    return fallbacks[type]||(headline+'\n\nSave this. You\'ll want to come back to it. 🔖');
  }

  /* ═══ 4. ENRICH DECK — real captions + hashtags for every slide ═══ */
  async function enrichDeck(topic, platform){
    if(!window.ST || !ST.slides.length) return;
    await fetchLiveTrends();
    if(typeof toast === 'function') toast('🔥 Writing AI captions + live hashtags…');
    for(var i=0; i<ST.slides.length; i++){
      var slide = ST.slides[i];
      // ── Caption guard: only write if server didn't already provide one ──
      if(!slide.caption || slide.caption.trim().length < 4){
        var caption = await generateCaption(topic, platform, slide);
        ST.slides[i].caption = caption;
      }
      // ── Hashtag guard: only fill if server left them empty ──
      if(!ST.slides[i].hashtags || ST.slides[i].hashtags.length === 0){
        ST.slides[i].hashtags = pickHashtagsForSlide(topic, platform, slide.type);
      }
    }
    // Refresh current slide's edit panel
    if(typeof fillEdit === 'function') fillEdit();
    if(typeof toast === 'function') toast('✦ AI captions + trending hashtags ready');
  }

  /* ═══ 5. PREFETCH on load ══════════════════════════════════ */
  window.addEventListener('load', function(){
    setTimeout(function(){
      fetchLiveTrends().catch(function(){});
    }, 800);
  });

  /* ═══ 6. EXPOSE globally ═════════════════════════════════== */
  window.CaptionEngine = {
    fetchLiveTrends:      fetchLiveTrends,
    pickHashtagsForSlide: pickHashtagsForSlide,
    generateCaption:      generateCaption,
    enrichDeck:           enrichDeck,
    get _liveTrends(){ return _liveTrends; }
  };

})();

/* ══════════════════════════════════════════════════════════
   UPGRADE BAR
══════════════════════════════════════════════════════════ */
function showUpgradeBar(message) {
  let el = document.getElementById("upgradeBar");

  if (!el) {
    el = document.createElement("div");
    el.id = "upgradeBar";
    document.body.appendChild(el);
  }

  el.innerHTML =
    '<div class="upgrade-inner">'
    + '<span>' + message + '</span>'
    + '<div style="display:flex;gap:8px;">'
    + '<a href="pricing.html" class="btn btn-primary">Upgrade</a>'
    + '<a href="login.html" class="btn btn-secondary">Login</a>'
    + '</div></div>';

  el.classList.add("show");

  setTimeout(() => {
    el.classList.remove("show");
  }, 4000);
}

(function() {
  const style = document.createElement("style");
  style.innerHTML = [
    "#upgradeBar {",
    "  position: fixed;",
    "  top: 80px;",
    "  left: 50%;",
    "  transform: translateX(-50%) translateY(-20px);",
    "  background: var(--card);",
    "  border: 1px solid var(--border);",
    "  border-radius: 999px;",
    "  padding: 10px 16px;",
    "  box-shadow: var(--sh2);",
    "  opacity: 0;",
    "  transition: all .3s ease;",
    "  z-index: 9999;",
    "}",
    "#upgradeBar.show {",
    "  opacity: 1;",
    "  transform: translateX(-50%) translateY(0);",
    "}",
    ".upgrade-inner {",
    "  display: flex;",
    "  gap: 12px;",
    "  align-items: center;",
    "  font-size: 12px;",
    "}"
  ].join("\n");
  document.head.appendChild(style);
})();
