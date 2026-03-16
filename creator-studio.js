/* ═══════════════════════════════════════════════
   IMPACTGRID CREATOR INTELLIGENCE ENGINE — JS
   creator-studio.js
═══════════════════════════════════════════════ */

/* ── Theme ── */
var dark = true;
function toggleTheme() {
  dark = !dark;
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  var tb = document.getElementById('themeBtn');
  if (tb) tb.textContent = dark ? '🌙' : '☀️';
  var ftb = document.getElementById('footerThemeBtn');
  if (ftb) ftb.textContent = dark ? '🌙 Dark Mode' : '☀️ Light Mode';
  try { localStorage.setItem('igt', dark ? 'd' : 'l'); } catch(e){}
}
try {
  if (localStorage.getItem('igt') === 'l') {
    dark = false;
    document.documentElement.setAttribute('data-theme','light');
    var tb = document.getElementById('themeBtn');
    if (tb) tb.textContent = '☀️';
    var ftb = document.getElementById('footerThemeBtn');
    if (ftb) ftb.textContent = '☀️ Light Mode';
  }
} catch(e){}

/* ── Mobile nav ── */
var hamburger = document.getElementById('hamburger');
if (hamburger) {
  hamburger.addEventListener('click', function() {
    document.getElementById('mobNav').classList.toggle('open');
  });
}

/* ── Scroll animations ── */
var obs = new IntersectionObserver(function(entries) {
  entries.forEach(function(e) {
    if (e.isIntersecting) e.target.classList.add('visible');
  });
}, { threshold: 0.1 });
document.querySelectorAll('.anim').forEach(function(el) { obs.observe(el); });

/* ── Live-counting trends number ── */
(function() {
  var el = document.getElementById('trendsCount');
  if (!el) return;
  var base = 247;
  setInterval(function() {
    var delta = Math.floor(Math.random() * 3);
    if (Math.random() > 0.5) base += delta; else base = Math.max(240, base - 1);
    el.textContent = base;
  }, 4000);
})();

/* ── Trend score pulsing animation ── */
(function() {
  var el = document.getElementById('trendScore');
  if (!el) return;
  var scores = [8.7, 8.9, 8.6, 9.1, 8.8, 8.7];
  var i = 0;
  setInterval(function() {
    i = (i + 1) % scores.length;
    el.style.transform = 'scale(1.05)';
    el.style.transition = 'transform 0.3s ease';
    setTimeout(function() {
      el.textContent = scores[i].toFixed(1);
      el.style.transform = 'scale(1)';
    }, 300);
  }, 5000);
})();

/* ── Animate signal bars on scroll into view ── */
(function() {
  var bars = document.querySelectorAll('.sig-fill, .sm-fill, .pred-fill, .fmc-fill');
  bars.forEach(function(bar) {
    var target = bar.style.width;
    bar.style.width = '0%';
    var barObs = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) {
          setTimeout(function() { bar.style.width = target; }, 200);
          barObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.3 });
    barObs.observe(bar);
  });
})();

/* ── Keep-warm ping ── */
setInterval(function() {
  fetch('https://impactgrid-dijo.onrender.com/ping').catch(function(){});
}, 600000);
