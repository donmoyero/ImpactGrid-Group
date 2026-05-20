#!/usr/bin/env bash
# =============================================================================
# reorganise.sh
# Reorganises your project root into a clean professional folder structure.
# Run from the ROOT of your project (same folder as index.html).
# Usage:
#   chmod +x reorganise.sh
#   ./reorganise.sh
# =============================================================================

set -e  # stop on any error

echo ""
echo "============================================="
echo "  ImpactGrid — Project Reorganisation Script"
echo "============================================="
echo ""

# ── Safety check ─────────────────────────────────────────────────────────────
if [ ! -f "index.html" ]; then
  echo "ERROR: index.html not found."
  echo "Please run this script from the ROOT of your project."
  exit 1
fi

echo "Root confirmed. Starting reorganisation..."
echo ""

# ── Create folder structure ───────────────────────────────────────────────────
echo "[1/9] Creating folders..."

mkdir -p assets/images
mkdir -p assets/video
mkdir -p assets/fonts
mkdir -p styles
mkdir -p auth
mkdir -p studio
mkdir -p events
mkdir -p dashboard
mkdir -p pages
mkdir -p chat
mkdir -p core
mkdir -p routes

echo "      Folders created."
echo ""

# ── Helper: move only if file exists ─────────────────────────────────────────
move() {
  if [ -f "$1" ]; then
    mv "$1" "$2"
    echo "      Moved: $1 → $2"
  else
    echo "      Skipped (not found): $1"
  fi
}

# ── Assets: images ───────────────────────────────────────────────────────────
echo "[2/9] Moving images..."
move "Earth.png"       "assets/images/Earth.png"
move "dara.jpg"        "assets/images/dara.jpg"
move "dijo-mascot.png" "assets/images/dijo-mascot.png"
move "joy.jpg"         "assets/images/joy.jpg"
move "logo.png"        "assets/images/logo.png"
echo ""

# ── Assets: video ────────────────────────────────────────────────────────────
echo "[3/9] Moving video..."
move "impactgrid-demo.mp4" "assets/video/impactgrid-demo.mp4"
echo ""

# ── Styles ───────────────────────────────────────────────────────────────────
echo "[4/9] Moving stylesheets..."
move "shared.css"                    "styles/shared.css"
move "carousel-studio.css"           "styles/carousel-studio.css"
move "carousel-studio-additions.css" "styles/carousel-studio-additions.css"
move "carousel-studio-mobile.css"    "styles/carousel-studio-mobile.css"
move "creator-studio.css"            "styles/creator-studio.css"
move "portfolio-studio.css"          "styles/portfolio-studio.css"
echo ""

# ── Auth ─────────────────────────────────────────────────────────────────────
echo "[5/9] Moving auth files..."
move "auth.js"                   "auth/auth.js"
move "instagram-auth.js"         "auth/instagram-auth.js"
move "instagram-callback.html"   "auth/instagram-callback.html"
move "tiktok-auth.js"            "auth/tiktok-auth.js"
move "tiktok-callback.html"      "auth/tiktok-callback.html"
move "youtube-auth.js"           "auth/youtube-auth.js"
move "youtube-callback.html"     "auth/youtube-callback.html"
move "login.html"                "auth/login.html"
move "join.html"                 "auth/join.html"
echo ""

# ── Studio ───────────────────────────────────────────────────────────────────
echo "[6/9] Moving studio files..."
move "carousel-studio.html"      "studio/carousel-studio.html"
move "carousel-studio.js"        "studio/carousel-studio.js"
move "carousel-style-tokens.js"  "studio/carousel-style-tokens.js"
move "creator-studio.html"       "studio/creator-studio.html"
move "creator-studio.js"         "studio/creator-studio.js"
move "creator-ai.js"             "studio/creator-ai.js"
move "portfolio-studio.html"     "studio/portfolio-studio.html"
move "portfolio-studio.js"       "studio/portfolio-studio.js"
echo ""

# ── Events ───────────────────────────────────────────────────────────────────
echo "[7/9] Moving events files..."
move "event.html"        "events/event.html"
move "events-pages.html" "events/events-pages.html"
move "events-script.js"  "events/events-script.js"
echo ""

# ── Dashboard ────────────────────────────────────────────────────────────────
echo "[8/9] Moving dashboard files..."
move "dashboard.html"          "dashboard/dashboard.html"
move "employer-dashboard.html" "dashboard/employer-dashboard.html"
move "owner.html"              "dashboard/owner.html"
move "admin.html"              "dashboard/admin.html"
move "settings.html"           "dashboard/settings.html"
echo ""

# ── Pages ────────────────────────────────────────────────────────────────────
echo "[9/9] Moving pages..."
move "about.html"      "pages/about.html"
move "contact.html"    "pages/contact.html"
move "consulting.html" "pages/consulting.html"
move "pricing.html"    "pages/pricing.html"
move "network.html"    "pages/network.html"
move "jobs.html"       "pages/jobs.html"
move "dijo.html"       "pages/dijo.html"
move "privacy.html"    "pages/privacy.html"
move "terms.html"      "pages/terms.html"
move "success.html"    "pages/success.html"
move "p.html"          "pages/p.html"
echo ""

# ── Chat ─────────────────────────────────────────────────────────────────────
echo "[+] Moving chat files..."
move "chat-bubble-snippet.html"  "chat/chat-bubble-snippet.html"
move "impactgrid-chat-bubble.js" "chat/impactgrid-chat-bubble.js"
echo ""

# ── Core ─────────────────────────────────────────────────────────────────────
echo "[+] Moving core JS files..."
move "nav.js"                  "core/nav.js"
move "plan-config.js"          "core/plan-config.js"
move "plan-gate.js"            "core/plan-gate.js"
move "supabase-config.js"      "core/supabase-config.js"
move "ig-supabase.js"          "core/ig-supabase.js"
move "homepage-slides-loader.js" "core/homepage-slides-loader.js"
move "reviews-script.js"       "core/reviews-script.js"
move "sw.js"                   "core/sw.js"
echo ""

# ── Routes ───────────────────────────────────────────────────────────────────
echo "[+] Moving route files..."
move "book-consulting-route.js" "routes/book-consulting-route.js"
move "contact-route.js"         "routes/contact-route.js"
move "calendar.js"              "routes/calendar.js"
echo ""

# ── Root-level files (stay put) ───────────────────────────────────────────────
echo "[+] Root-level files staying in place:"
echo "      index.html   (keep at root — entry point)"
echo "      manifest.json (keep at root — PWA requirement)"
echo "      CNAME         (keep at root — GitHub Pages requirement)"
echo ""

# ── Done ─────────────────────────────────────────────────────────────────────
echo "============================================="
echo "  Reorganisation complete!"
echo "============================================="
echo ""
echo "NEXT STEPS:"
echo "  1. Update all <script src=>, <link href=>, import paths"
echo "     in your HTML/JS files to reflect the new folder paths."
echo "  2. Run your site locally to check for broken paths."
echo "  3. Then commit:"
echo "     git add ."
echo '     git commit -m "chore: reorganise project into feature folders"'
echo "     git push"
echo ""
echo "  When ready, run the emoji-scan script next:"
echo "     chmod +x scan-emoji.sh && ./scan-emoji.sh"
echo ""
