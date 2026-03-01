/* ================= GLOBAL STATE ================= */

let businessData = [];
let revenueChart = null;
let profitChart = null;
let expenseChart = null;
let forecastChart = null;
let comparisonChart = null;

/* ================= PLAN SYSTEM ================= */

let userPlan = localStorage.getItem("impactPlan") || "free";

function setPlan(plan) {
    userPlan = plan;
    localStorage.setItem("impactPlan", plan);
    alert("Plan updated to: " + plan.toUpperCase());
}

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", () => {
    loadFromStorage();
    autoLogin();
    loadTheme();
});

/* ================= AUTH ================= */

function login() {
    const user = document.getElementById("username").value;
    const pass = document.getElementById("password").value;

    if (user && pass) {
        localStorage.setItem("impactUser", user);
        showApp();
    } else {
        alert("Enter credentials");
    }
}

function autoLogin() {
    const user = localStorage.getItem("impactUser");
    if (user) showApp();
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
    localStorage.setItem("impactTheme",
        document.body.classList.contains("light-mode") ? "light" : "dark"
    );
}

function loadTheme() {
    if (localStorage.getItem("impactTheme") === "light") {
        document.body.classList.add("light-mode");
    }
}

/* ================= SIDEBAR ================= */

function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("collapsed");
}

/* ================= SECTION NAV ================= */

function showSection(id, evt) {

    if ((id === "forecast" || id === "comparison") && userPlan === "free") {
        alert("This feature is available on Growth and Premium plans.");
        return;
    }

    document.querySelectorAll(".page-section").forEach(s =>
        s.classList.remove("active-section")
    );

    document.getElementById(id).classList.add("active-section");

    document.querySelectorAll(".sidebar li").forEach(li =>
        li.classList.remove("active")
    );

    if (evt) evt.target.classList.add("active");
}

/* ================= DATA ================= */

function addData() {

    if (userPlan === "free" && businessData.length >= 3) {
        alert("Free plan supports only 3 months of data. Upgrade to unlock unlimited history.");
        return;
    }

    const month = document.getElementById("month").value;
    const revenue = parseFloat(document.getElementById("revenue").value);
    const expenses = parseFloat(document.getElementById("expenses").value);

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
    if (businessData.length === 0) return;

    renderKPIs();
    renderCoreCharts();

    if (userPlan !== "free") {
        renderForecast();
        renderComparison();
    }

    generateReport();
}

/* ================= KPI ================= */

function renderKPIs() {
    const container = document.getElementById("kpiContainer");

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

    destroyCharts();
    const labels = businessData.map(d => d.month);

    revenueChart = new Chart(
        document.getElementById("revenueChart"),
        {
            type: "line",
            data: {
                labels,
                datasets: [{
                    label: "Revenue",
                    data: map("revenue"),
                    borderColor: "#4CAF50",
                    tension: 0.4
                }]
            },
            options: baseChartOptions()
        }
    );

    profitChart = new Chart(
        document.getElementById("profitChart"),
        {
            type: "line",
            data: {
                labels,
                datasets: [{
                    label: "Profit",
                    data: map("profit"),
                    borderColor: "#2196F3",
                    tension: 0.4
                }]
            },
            options: baseChartOptions()
        }
    );

    expenseChart = new Chart(
        document.getElementById("expenseChart"),
        {
            type: "bar",
            data: {
                labels,
                datasets: [{
                    label: "Expenses",
                    data: map("expenses"),
                    backgroundColor: "#FF5252"
                }]
            },
            options: baseChartOptions()
        }
    );
}

/* ================= FORECAST ================= */

function renderForecast() {
    if (forecastChart) forecastChart.destroy();

    const labels = businessData.map(d => d.month);
    const values = map("revenue");
    if (values.length < 2) return;

    const predictions = simpleRegression(values, 3);

    forecastChart = new Chart(
        document.getElementById("forecastChart"),
        {
            type: "line",
            data: {
                labels: [...labels, "F1", "F2", "F3"],
                datasets: [{
                    label: "Revenue Forecast",
                    data: [...values, ...predictions],
                    borderColor: "#3b82f6",
                    borderDash: [5,5]
                }]
            },
            options: baseChartOptions()
        }
    );
}

/* ================= MULTI METRIC ================= */

function renderComparison() {
    if (comparisonChart) comparisonChart.destroy();

    comparisonChart = new Chart(
        document.getElementById("comparisonChart"),
        {
            type: "line",
            data: {
                labels: businessData.map(d => d.month),
                datasets: [
                    { label:"Revenue", data: map("revenue"), borderColor:"#4CAF50" },
                    { label:"Profit", data: map("profit"), borderColor:"#2196F3" },
                    { label:"Expenses", data: map("expenses"), borderColor:"#FF5252" }
                ]
            },
            options: baseChartOptions()
        }
    );
}

/* ================= SMART REPORT ================= */

function generateReport() {
    const reportBox = document.getElementById("performanceReport");

    const totalRevenue = sum("revenue");
    const totalProfit = sum("profit");
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

/* ================= EXPORT CONTROL ================= */

function canExportPDF() {

    if (userPlan === "free") {
        alert("Executive PDF export available on Growth and Premium plans.");
        return false;
    }

    if (userPlan === "premium") return true;

    let currentMonth = new Date().getMonth();
    let savedMonth = localStorage.getItem("exportMonth");
    let exportCount = parseInt(localStorage.getItem("exportCount") || "0");

    if (savedMonth != currentMonth) {
        exportCount = 0;
        localStorage.setItem("exportMonth", currentMonth);
        localStorage.setItem("exportCount", "0");
    }

    if (exportCount >= 3) {
        alert("You have reached your 3 exports this month. Upgrade to Premium for unlimited reports.");
        return false;
    }

    localStorage.setItem("exportCount", exportCount + 1);
    return true;
}

/* ================= EXECUTIVE PDF ================= */

async function exportExecutivePDF() {

    if (!canExportPDF()) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const totalRevenue = sum("revenue");
    const totalProfit = sum("profit");
    const margin = ((totalProfit / totalRevenue) * 100).toFixed(1);

    let y = 20;

    doc.setFontSize(18);
    doc.text("ImpactGridGroup", 105, y, { align: "center" });
    y += 8;

    doc.setFontSize(12);
    doc.text("Enterprise Intelligence Report", 105, y, { align: "center" });
    y += 15;

    doc.setFontSize(11);
    doc.text("Total Revenue: " + formatCurrency(totalRevenue), 20, y);
    y += 8;
    doc.text("Total Profit: " + formatCurrency(totalProfit), 20, y);
    y += 8;
    doc.text("Profit Margin: " + margin + "%", 20, y);
    y += 15;

    if (userPlan === "premium") {
        doc.setFontSize(13);
        doc.text("Executive Risk Assessment: Moderate", 20, y);
        y += 8;
        doc.text("Growth Opportunity Score: 82/100", 20, y);
        y += 12;

        doc.setFontSize(40);
        doc.setTextColor(220);
        doc.text("Premium Intelligence", 105, 160, { align: "center", angle: 45 });
        doc.setTextColor(0);
    }

    doc.setFontSize(10);
    doc.text("Analysis by ImpactGrid Intelligence", 105, 285, { align: "center" });

    doc.save("ImpactGrid_Executive_Report.pdf");
}

/* ================= HELPERS ================= */

function destroyCharts() {
    if (revenueChart) revenueChart.destroy();
    if (profitChart) profitChart.destroy();
    if (expenseChart) expenseChart.destroy();
}

function sum(key){ return businessData.reduce((a,b)=>a+b[key],0); }
function map(key){ return businessData.map(d=>d[key]); }

function formatCurrency(val){
    return "£"+Number(val).toLocaleString(undefined,{
        minimumFractionDigits:2,
        maximumFractionDigits:2
    });
}

function baseChartOptions(){
    return {
        responsive: true,
        maintainAspectRatio: false
    };
}

function simpleRegression(data, periods){
    const n = data.length;
    const x = [...Array(n).keys()];
    const sumX = x.reduce((a,b)=>a+b);
    const sumY = data.reduce((a,b)=>a+b);
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
