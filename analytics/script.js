/* ================= BASE RESET ================= */

* {
    box-sizing: border-box;
}

body {
    margin: 0;
    font-family: 'Inter', sans-serif;
}

/* ================= APP LAYOUT ================= */

.app-layout {
    display: flex;
    min-height: 100vh;
    background: linear-gradient(135deg, #0f172a, #1e293b);
    color: #e2e8f0;
}

.hidden {
    display: none !important;
}

/* ================= AUTH SCREEN ================= */

.auth-screen {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
}

.auth-card {
    background: rgba(255,255,255,0.05);
    backdrop-filter: blur(12px);
    padding: 40px;
    border-radius: 16px;
    width: 320px;
    text-align: center;
    box-shadow: 0 10px 40px rgba(0,0,0,0.4);
}

.auth-card input {
    width: 100%;
    padding: 10px;
    margin-bottom: 12px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.05);
    color: white;
}

/* ================= SIDEBAR ================= */

.sidebar {
    width: 240px;
    background: #0f172a;
    padding: 25px 20px;
    border-right: 1px solid rgba(255,255,255,0.05);
    transition: width 0.3s ease;
}

.sidebar.collapsed {
    width: 80px;
}

.sidebar-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
}

.logo-container {
    display: flex;
    align-items: center;
    gap: 8px;
}

.logo-img {
    height: 28px;  /* FIXED LOGO SIZE */
    width: auto;
}

.logo-text {
    font-weight: 700;
    font-size: 16px;
}

.collapse-btn {
    background: none;
    border: none;
    color: #94a3b8;
    font-size: 20px;
    cursor: pointer;
}

.sidebar ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

.sidebar li {
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 8px;
    cursor: pointer;
    color: #94a3b8;
    transition: 0.2s;
}

.sidebar li:hover {
    background: rgba(59,130,246,0.1);
    color: white;
}

.sidebar li.active {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
}

/* ================= MAIN CONTENT ================= */

.main-content {
    flex: 1;
    padding-bottom: 40px;
}

.dashboard-header {
    padding: 30px 5%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
}

.dashboard-header h1 {
    font-size: 24px;
}

.header-actions {
    display: flex;
    gap: 10px;
}

/* ================= SECTIONS ================= */

.page-section {
    display: none;
    padding: 0 5% 50px 5%;
}

.active-section {
    display: block;
}

/* ================= CARDS ================= */

.card {
    background: rgba(255,255,255,0.05);
    padding: 25px;
    border-radius: 18px;
    margin-bottom: 25px;
    border: 1px solid rgba(255,255,255,0.05);
}

/* ================= HOW TO USE SECTION ================= */

.card h2 {
    margin-bottom: 15px;
}

.card label {
    font-size: 13px;
    color: #94a3b8;
}

.card p {
    font-size: 14px;
}

.card strong {
    color: #3b82f6;
}

/* ================= INPUT GRID ================= */

.grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 15px;
}

.grid input {
    padding: 10px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.05);
    color: white;
}

/* ================= BUTTONS ================= */

.btn-primary {
    padding: 10px 16px;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    border: none;
    border-radius: 8px;
    color: white;
    cursor: pointer;
    font-weight: 600;
}

.btn-secondary {
    padding: 10px 16px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    color: #e2e8f0;
    cursor: pointer;
}

/* ================= KPI ================= */

.kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
}

.kpi {
    background: linear-gradient(135deg, #1e293b, #0f172a);
    padding: 20px;
    border-radius: 14px;
    text-align: center;
}

.kpi p {
    font-size: 22px;
    font-weight: 700;
    color: #3b82f6;
}

/* ================= CHARTS ================= */

.charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
}

.chart-card {
    height: 350px;
    position: relative;
}

.chart-card canvas {
    width: 100% !important;
    height: 100% !important;
}

/* ================= PRICING ================= */

.pricing-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 20px;
}

.pricing-card {
    background: rgba(255,255,255,0.05);
    padding: 20px;
    border-radius: 16px;
    text-align: center;
}

.price {
    font-size: 22px;
    font-weight: bold;
    color: #3b82f6;
}

/* ================= FOOTER ================= */

.dashboard-footer {
    text-align: center;
    padding: 20px;
    color: #64748b;
}

/* ================= LIGHT MODE ================= */

body.light-mode .app-layout {
    background: #f1f5f9;
    color: #1e293b;
}

body.light-mode .card,
body.light-mode .pricing-card {
    background: white;
    border: 1px solid #e2e8f0;
}

body.light-mode .sidebar {
    background: white;
    border-right: 1px solid #e2e8f0;
}

/* ================= MOBILE ================= */

@media (max-width: 900px) {
    .app-layout {
        flex-direction: column;
    }

    .sidebar {
        width: 100%;
    }

    .dashboard-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
    }
}
