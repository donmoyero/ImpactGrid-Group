/* ================= GLOBAL STATE ================= */

let businessData = [];
let revenueChart = null;
let profitChart = null;
let expenseChart = null;
let forecastChart = null;
let comparisonChart = null;
let companyLogoData = localStorage.getItem("impactLogo") || null;

let userPlan = localStorage.getItem("impactPlan") || "free";

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", () => {

    loadFromStorage();
    autoLogin();
    loadTheme();
    setupLogoUpload();
    restoreLogoPreview();

});

/* ================= MOBILE SIDEBAR ================= */

function toggleSidebar(){
    document.getElementById("sidebar")?.classList.toggle("mobile-active");
}

/* ================= PLAN SYSTEM ================= */

function setPlan(plan) {
    userPlan = plan;
    localStorage.setItem("impactPlan", plan);
    alert("Plan updated to: " + plan.toUpperCase());
}

/* ================= AUTH ================= */

function login() {
    const user = document.getElementById("username")?.value;
    const pass = document.getElementById("password")?.value;

    if (user && pass) {
        localStorage.setItem("impactUser", user);
        showApp();
    } else {
        alert("Enter credentials");
    }
}

function autoLogin() {
    if (localStorage.getItem("impactUser")) {
        showApp();
    }
}

function logout() {
    localStorage.removeItem("impactUser");
    location.reload();
}

function showApp() {
    document.getElementById("authScreen").style.display = "none";
    document.getElementById("app").classList.remove("hidden");
}

/* ================= THEME ================= */

function toggleTheme() {
    document.body.classList.toggle("light-mode");
    localStorage.setItem(
        "impactTheme",
        document.body.classList.contains("light-mode") ? "light" : "dark"
    );
}

function loadTheme() {
    if (localStorage.getItem("impactTheme") === "light") {
        document.body.classList.add("light-mode");
    }
}

/* ================= SECTION NAV ================= */

function showSection(id, evt) {

    if ((id === "forecast" || id === "comparison") && userPlan === "free") {
        alert("Upgrade to Growth or Premium to access this feature.");
        return;
    }

    document.querySelectorAll(".page-section")
        .forEach(s => s.classList.remove("active-section"));

    document.getElementById(id)?.classList.add("active-section");

    document.querySelectorAll(".sidebar li")
        .forEach(li => li.classList.remove("active"));

    if (evt) evt.target.classList.add("active");

    if (id === "forecast") renderForecast();
    if (id === "comparison") renderComparison();
}

/* ================= DATA ================= */

function addData() {

    if (userPlan === "free" && businessData.length >= 3) {
        alert("Free plan supports only 3 months of data.");
        return;
    }

    const month = document.getElementById("month")?.value;
    const revenue = parseFloat(document.getElementById("revenue")?.value);
    const expenses = parseFloat(document.getElementById("expenses")?.value);
    const customers = parseFloat(document.getElementById("customers")?.value) || 0;
    const marketing = parseFloat(document.getElementById("marketing")?.value) || 0;

    if (!month || isNaN(revenue) || isNaN(expenses)) {
        alert("Fill required fields.");
        return;
    }

    const profit = revenue - expenses;

    businessData.push({ month, revenue, expenses, profit, customers, marketing });

    saveToStorage();
    updateAll();
}

/* ================= STORAGE ================= */

function saveToStorage() {
    localStorage.setItem("impactGridData", JSON.stringify(businessData));
}

function loadFromStorage() {
    const saved = localStorage.getItem("impactGridData");
    if (saved) {
        businessData = JSON.parse(saved);
        updateAll();
    }
}

function clearAllData() {
    localStorage.removeItem("impactGridData");
    location.reload();
}

/* ================= MASTER UPDATE ================= */

function updateAll() {
    if (!businessData.length) return;
    renderKPIs();
    renderCoreCharts();
    generateReport();
}

/* ================= KPI ================= */

function renderKPIs() {

    const container = document.getElementById("kpiContainer");
    if (!container) return;

    const totalRevenue = sum("revenue");
    const totalProfit = sum("profit");
    const totalCustomers = sum("customers");
    const totalMarketing = sum("marketing");

    const margin = totalRevenue ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0;
    const avgRevenuePerCustomer = totalCustomers ? totalRevenue / totalCustomers : 0;

    const marketingROI = totalMarketing
        ? (((totalRevenue - totalMarketing) / totalMarketing) * 100).toFixed(1)
        : 0;

    const breakEven = calculateBreakEven();

    container.innerHTML = `
        <div class="kpi"><h3>Total Revenue</h3><p>${formatCurrency(totalRevenue)}</p></div>
        <div class="kpi"><h3>Total Profit</h3><p>${formatCurrency(totalProfit)}</p></div>
        <div class="kpi"><h3>Profit Margin</h3><p>${margin}%</p></div>
        <div class="kpi"><h3>Marketing ROI</h3><p>${marketingROI}%</p></div>
        <div class="kpi"><h3>Break-even Target</h3><p>${breakEven}</p></div>
        <div class="kpi"><h3>Avg Revenue / Customer</h3><p>${formatCurrency(avgRevenuePerCustomer)}</p></div>
    `;
}

function calculateBreakEven(){
    const avgRevenue = sum("revenue") / businessData.length;
    const avgExpenses = sum("expenses") / businessData.length;
    if (avgRevenue <= avgExpenses) return "Not profitable yet";
    const needed = avgExpenses;
    return formatCurrency(needed) + " / month";
}

/* ================= CORE CHARTS ================= */

function renderCoreCharts() {

    if (typeof Chart === "undefined") return;

    destroyCharts();

    const labels = businessData.map(d => d.month);

    revenueChart = createChart("revenueChart", "line", labels, map("revenue"), "#4CAF50", "Revenue");
    profitChart = createChart("profitChart", "line", labels, map("profit"), "#2196F3", "Profit");
    expenseChart = createChart("expenseChart", "bar", labels, map("expenses"), "#FF5252", "Expenses");
}

function createChart(id, type, labels, data, color, label) {
    const canvas = document.getElementById(id);
    if (!canvas) return null;

    return new Chart(canvas, {
        type,
        data: {
            labels,
            datasets: [{
                label,
                data,
                borderColor: color,
                backgroundColor: type === "bar" ? color : "transparent",
                tension: 0.4
            }]
        },
        options: baseChartOptions()
    });
}

/* ================= FORECAST ================= */

function getForecastValues(){

    const values = map("revenue");
    if (values.length < 2) return [];

    const growthRates = [];
    for (let i = 1; i < values.length; i++) {
        if (values[i - 1] > 0) {
            growthRates.push((values[i] - values[i - 1]) / values[i - 1]);
        }
    }

    const avgGrowth = growthRates.length
        ? growthRates.reduce((a, b) => a + b, 0) / growthRates.length
        : 0.05;

    let lastValue = values[values.length - 1];
    const predictions = [];

    for (let i = 0; i < 3; i++) {
        lastValue = lastValue * (1 + avgGrowth);
        predictions.push(lastValue);
    }

    return predictions;
}

function renderForecast() {

    if (!businessData.length) return;
    if (forecastChart) forecastChart.destroy();

    const values = map("revenue");
    const predictions = getForecastValues();

    if (!predictions.length) return;

    forecastChart = new Chart(
        document.getElementById("forecastChart"),
        {
            type: "line",
            data: {
                labels: [...businessData.map(d => d.month), "F1", "F2", "F3"],
                datasets: [{
                    label: "Revenue Forecast",
                    data: [...values, ...predictions],
                    borderColor: "#3b82f6",
                    borderDash: [5,5],
                    tension: 0.4
                }]
            },
            options: baseChartOptions()
        }
    );
}

/* ================= REPORT ================= */

function generateReport() {

    const reportBox = document.getElementById("performanceReport");
    if (!reportBox) return;

    const totalRevenue = sum("revenue");
    const totalProfit = sum("profit");
    const margin = totalRevenue ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0;

    const breakEven = calculateBreakEven();
    const forecast = getForecastValues();

    reportBox.innerHTML = `
        <p><strong>Business Health:</strong> ${margin < 15 ? "Warning" : "Stable"}</p>
        <p>Total Revenue: ${formatCurrency(totalRevenue)}</p>
        <p>Total Profit: ${formatCurrency(totalProfit)}</p>
        <p>Profit Margin: ${margin}%</p>
        <p>Break-even Target: ${breakEven}</p>
        ${forecast.length ? `<p>Next 3 Month Forecast: 
        ${forecast.map(v => formatCurrency(v)).join(" | ")}</p>` : ""}
    `;
}

/* ================= EXECUTIVE PDF ================= */

async function exportExecutivePDF() {

    if (!businessData.length) {
        alert("No data to export.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const businessName = document.getElementById("businessName")?.value || "Business";
    const startDate = document.getElementById("businessStartDate")?.value || "N/A";

    const totalRevenue = sum("revenue");
    const totalProfit = sum("profit");
    const margin = totalRevenue
        ? ((totalProfit / totalRevenue) * 100).toFixed(1)
        : 0;

    /* Gradient Header */
    doc.setFillColor(37,99,235);
    doc.rect(0,0,210,40,"F");

    doc.setTextColor(255,255,255);
    doc.setFontSize(16);
    doc.text(businessName + " Executive Report", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.text("Established: " + startDate, 105, 28, { align: "center" });

    doc.setTextColor(0,0,0);

    let y = 55;

    doc.text("Total Revenue: " + formatCurrency(totalRevenue), 20, y); y+=8;
    doc.text("Total Profit: " + formatCurrency(totalProfit), 20, y); y+=8;
    doc.text("Profit Margin: " + margin + "%", 20, y); y+=12;

    /* Forecast in PDF */
    const forecast = getForecastValues();
    if (forecast.length){
        doc.text("Next 3 Month Forecast:", 20, y); y+=8;
        forecast.forEach((val,i)=>{
            doc.text("F"+(i+1)+": "+formatCurrency(val), 30, y);
            y+=8;
        });
    }

    /* Embed Chart */
    if (revenueChart){
        const imgData = revenueChart.toBase64Image();
        doc.addImage(imgData, "PNG", 20, y, 170, 60);
    }

    /* Premium Watermark */
    if (userPlan === "premium"){
        doc.setTextColor(150);
        doc.setFontSize(40);
        doc.text("CONFIDENTIAL", 105, 200, { align:"center", angle:45 });
    }

    doc.save("ImpactGrid_Executive_Report.pdf");
}

/* ================= HELPERS ================= */

function destroyCharts(){
    revenueChart?.destroy();
    profitChart?.destroy();
    expenseChart?.destroy();
}

function sum(key){
    return businessData.reduce((a,b)=>a+(b[key]||0),0);
}

function map(key){
    return businessData.map(d=>d[key]||0);
}

function formatCurrency(val){
    return "£"+Number(val).toLocaleString(undefined,{
        minimumFractionDigits:2,
        maximumFractionDigits:2
    });
}

function baseChartOptions(){
    return { responsive:true, maintainAspectRatio:false };
}
