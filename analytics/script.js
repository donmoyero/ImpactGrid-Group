/* ================= GLOBAL STATE ================= */

let businessData = [];
let revenueChart = null;
let profitChart = null;
let expenseChart = null;
let forecastChart = null;
let comparisonChart = null;
let companyLogoData = null;

let userPlan = localStorage.getItem("impactPlan") || "free";

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", () => {

    loadFromStorage();
    autoLogin();
    loadTheme();
    setupLogoUpload();

});

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

    if (!month || isNaN(revenue) || isNaN(expenses)) {
        alert("Fill required fields.");
        return;
    }

    const profit = revenue - expenses;

    businessData.push({ month, revenue, expenses, profit });

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

    container.innerHTML = `
        <div class="kpi">
            <h3>Total Revenue</h3>
            <p>${formatCurrency(totalRevenue)}</p>
        </div>
        <div class="kpi">
            <h3>Total Profit</h3>
            <p>${formatCurrency(totalProfit)}</p>
        </div>
    `;
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

function renderForecast() {

    if (!businessData.length) return;
    if (forecastChart) forecastChart.destroy();

    const values = map("revenue");
    if (values.length < 2) return;

    const predictions = simpleRegression(values, 3);

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

/* ================= MULTI METRIC ================= */

function renderComparison() {

    if (!businessData.length) return;
    if (comparisonChart) comparisonChart.destroy();

    comparisonChart = new Chart(
        document.getElementById("comparisonChart"),
        {
            type: "line",
            data: {
                labels: businessData.map(d => d.month),
                datasets: [
                    dataset("Revenue","revenue","#4CAF50"),
                    dataset("Profit","profit","#2196F3"),
                    dataset("Expenses","expenses","#FF5252")
                ]
            },
            options: baseChartOptions()
        }
    );
}

function dataset(label,key,color){
    return {
        label,
        data: map(key),
        borderColor: color,
        tension: 0.4
    };
}

/* ================= SMART REPORT ================= */

function generateReport() {

    const reportBox = document.getElementById("performanceReport");
    if (!reportBox) return;

    const totalRevenue = sum("revenue");
    const totalProfit = sum("profit");

    if (!totalRevenue) return;

    const latest = businessData[businessData.length - 1];

    let health = "Stable";
    if (totalProfit <= 0) health = "Critical";
    else if (totalProfit < totalRevenue * 0.15) health = "Warning";

    reportBox.innerHTML = `
        <p><strong>Business Health:</strong> ${health}</p>
        <p>Total Revenue: ${formatCurrency(totalRevenue)}</p>
        <p>Total Profit: ${formatCurrency(totalProfit)}</p>
        <p>Latest Month Revenue: ${formatCurrency(latest.revenue)}</p>
    `;
}

/* ================= LOGO UPLOAD ================= */

function setupLogoUpload() {

    const input = document.getElementById("companyLogoInput");
    if (!input) return;

    input.addEventListener("change", function(e) {

        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(event) {
            companyLogoData = event.target.result;
        };
        reader.readAsDataURL(file);

    });
}

/* ================= EXPORT CONTROL ================= */

function canExportPDF() {

    if (userPlan === "free") {
        alert("Upgrade to export Executive PDFs.");
        return false;
    }

    if (userPlan === "premium") return true;

    let month = new Date().getMonth();
    let savedMonth = localStorage.getItem("exportMonth");
    let count = parseInt(localStorage.getItem("exportCount") || "0");

    if (savedMonth != month) {
        count = 0;
        localStorage.setItem("exportMonth", month);
        localStorage.setItem("exportCount", "0");
    }

    if (count >= 3) {
        alert("Monthly export limit reached.");
        return false;
    }

    localStorage.setItem("exportCount", count + 1);
    return true;
}

/* ================= EXECUTIVE PDF ================= */

async function exportExecutivePDF() {

    if (!businessData.length) {
        alert("No data to export.");
        return;
    }

    if (!canExportPDF()) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const totalRevenue = sum("revenue");
    const totalProfit = sum("profit");
    const margin = totalRevenue
        ? ((totalProfit / totalRevenue) * 100).toFixed(1)
        : 0;

    let y = 20;

    if (companyLogoData && userPlan === "premium") {
        doc.addImage(companyLogoData, "PNG", 15, 10, 30, 30);
    }

    doc.setFontSize(18);
    doc.text("ImpactGrid Intelligence Report", 105, y, { align: "center" });
    y += 12;

    doc.setFontSize(12);
    doc.text("Enterprise Performance Overview", 105, y, { align: "center" });
    y += 20;

    doc.setFontSize(11);
    doc.text("Total Revenue: " + formatCurrency(totalRevenue), 20, y);
    y += 8;
    doc.text("Total Profit: " + formatCurrency(totalProfit), 20, y);
    y += 8;
    doc.text("Profit Margin: " + margin + "%", 20, y);

    doc.save("ImpactGrid_Executive_Report.pdf");
}

/* ================= HELPERS ================= */

function destroyCharts(){
    revenueChart?.destroy();
    profitChart?.destroy();
    expenseChart?.destroy();
}

function sum(key){
    return businessData.reduce((a,b)=>a+b[key],0);
}

function map(key){
    return businessData.map(d=>d[key]);
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

function simpleRegression(data, periods){

    const n = data.length;
    const x = [...Array(n).keys()];
    const sumX = x.reduce((a,b)=>a+b,0);
    const sumY = data.reduce((a,b)=>a+b,0);
    const sumXY = x.reduce((s,xi,i)=>s+xi*data[i],0);
    const sumXX = x.reduce((s,xi)=>s+xi*xi,0);

    const slope = (n*sumXY - sumX*sumY) / (n*sumXX - sumX*sumX);
    const intercept = (sumY - slope*sumX)/n;

    const result = [];
    for(let i=1;i<=periods;i++){
        result.push(slope*(n+i-1)+intercept);
    }

    return result;
}
