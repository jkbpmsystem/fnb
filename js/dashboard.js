let allData = [];
let filteredData = [];
let currentFilter = 'ALL';
let currentPage = 1;
const rowsPerPage = 50;
const UPCOMING_DAYS = 365;

// Overdue & Upcoming table state
const MINI_ROWS = 10;
let overdueData = [];
let overduePage = 1;
let upcomingData = [];
let upcomingPage = 1;

document.addEventListener("DOMContentLoaded", () => {
  initDashboard();
});

async function initDashboard() {
  const mod = getModule();
  document.getElementById("moduleName").innerText = mod;

  // Highlight active module toggle
  document.querySelectorAll('#moduleToggle button').forEach(b => b.classList.remove('active'));
  const activeBtn = document.getElementById('btn_' + mod.toLowerCase());
  if (activeBtn) activeBtn.classList.add('active');

  const assets = await getAssets();
  allData = prepareData(assets);
  let duringWarranty = 0;
  let postWarranty = 0;
  overdueData = [];
  upcomingData = [];
  overduePage = 1;
  upcomingPage = 1;

  allData.forEach(a => {
    if (a.daysLeft < 0) {
      postWarranty++;
      overdueData.push(a);
    } else {
      if (a.daysLeft < UPCOMING_DAYS) upcomingData.push(a);
      duringWarranty++;
    }
  });

  // Sort: overdue by most overdue first, upcoming by soonest first
  overdueData.sort((a, b) => a.daysLeft - b.daysLeft);
  upcomingData.sort((a, b) => a.daysLeft - b.daysLeft);

  document.getElementById("totalAssets").innerText = allData.length;
  document.getElementById("overdueCount").innerText = overdueData.length;
  document.getElementById("upcomingCount").innerText = upcomingData.length;
  renderWarrantyPieChart(duringWarranty, postWarranty);
  renderOverdueTable();
  renderUpcomingTable();

  // Contract Duration Summary — 6 Components
  renderSummaryStats(allData);
  renderContractProgress(allData);
  renderExpiryTimeline(allData);
  renderDisciplineChart(allData);
  renderSupplierBreakdown(allData);
  renderExpiryByYear(allData);

  applyFilter();
}

function switchModule(mod) {
  sessionStorage.setItem("cmmsModule", mod.toUpperCase());
  initDashboard();
}

// =====================
// OVERDUE TABLE
// =====================
function renderOverdueTable() {
  const tbody = document.querySelector("#overdueTable tbody");
  if (!tbody) return;
  const keyword = (document.getElementById("searchOverdue").value || "").toLowerCase();
  const filtered = overdueData.filter(a => {
    return a.id.toLowerCase().includes(keyword) || (a.name || "").toLowerCase().includes(keyword);
  });

  document.getElementById("overdueTableCount").innerText = filtered.length;
  tbody.innerHTML = "";

  const start = (overduePage - 1) * MINI_ROWS;
  const pageData = filtered.slice(start, start + MINI_ROWS);

  for (let i = 0; i < MINI_ROWS; i++) {
    const tr = document.createElement("tr");
    if (i < pageData.length) {
      const a = pageData[i];
      tr.classList.add("blink");
      tr.innerHTML = `
        <td><span class="open-asset clickable-id" data-id="${a.id}">${a.id}</span></td>
        <td>${a.name || "-"}</td>
        <td>${formatDate(a.endDate)}</td>
        <td style="color:#ff3d57;font-weight:600">${a.daysLeft}</td>
      `;
    } else {
      tr.innerHTML = '<td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>';
      tr.style.opacity = "0";
    }
    tbody.appendChild(tr);
  }

  renderMiniPagination("overduePageBox", filtered.length, overduePage, function (p) {
    overduePage = p;
    renderOverdueTable();
  });
}

// =====================
// UPCOMING TABLE
// =====================
function renderUpcomingTable() {
  const tbody = document.querySelector("#upcomingTable tbody");
  if (!tbody) return;
  const keyword = (document.getElementById("searchUpcoming").value || "").toLowerCase();
  const filtered = upcomingData.filter(a => {
    return a.id.toLowerCase().includes(keyword) || (a.name || "").toLowerCase().includes(keyword);
  });

  document.getElementById("upcomingTableCount").innerText = filtered.length;
  tbody.innerHTML = "";

  const start = (upcomingPage - 1) * MINI_ROWS;
  const pageData = filtered.slice(start, start + MINI_ROWS);

  for (let i = 0; i < MINI_ROWS; i++) {
    const tr = document.createElement("tr");
    if (i < pageData.length) {
      const a = pageData[i];
      tr.innerHTML = `
        <td><span class="open-asset clickable-id" data-id="${a.id}">${a.id}</span></td>
        <td>${a.name || "-"}</td>
        <td>${formatDate(a.endDate)}</td>
        <td style="color:#ffc107;font-weight:600">${a.daysLeft}</td>
      `;
    } else {
      tr.innerHTML = '<td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>';
      tr.style.opacity = "0";
    }
    tbody.appendChild(tr);
  }

  renderMiniPagination("upcomingPageBox", filtered.length, upcomingPage, function (p) {
    upcomingPage = p;
    renderUpcomingTable();
  });
}

// =====================
// SHARED MINI PAGINATION
// =====================
function renderMiniPagination(containerId, totalItems, currentPg, onPageChange) {
  const box = document.getElementById(containerId);
  if (!box) return;
  box.innerHTML = "";
  const totalPages = Math.ceil(totalItems / MINI_ROWS);
  if (totalPages <= 1) return;

  const prev = document.createElement("button");
  prev.innerText = "‹";
  prev.className = "btn";
  prev.style.fontSize = "14px";
  if (currentPg === 1) { prev.disabled = true; prev.style.opacity = "0.4"; }
  prev.onclick = () => onPageChange(currentPg - 1);
  box.appendChild(prev);

  const maxVisible = 3;
  let startP = Math.max(1, currentPg - 1);
  let endP = Math.min(totalPages, startP + maxVisible - 1);
  if (endP - startP < maxVisible - 1) startP = Math.max(1, endP - maxVisible + 1);

  for (let i = startP; i <= endP; i++) {
    const btn = document.createElement("button");
    btn.innerText = i;
    btn.className = "btn";
    btn.style.fontSize = "12px";
    if (i === currentPg) { btn.style.background = "#00e5ff"; btn.style.color = "#000"; }
    btn.onclick = () => onPageChange(i);
    box.appendChild(btn);
  }

  const info = document.createElement("span");
  info.style.cssText = "font-size:11px;color:var(--subtext);padding:6px 4px;";
  info.innerText = `${currentPg}/${totalPages}`;
  box.appendChild(info);

  const next = document.createElement("button");
  next.innerText = "›";
  next.className = "btn";
  next.style.fontSize = "14px";
  if (currentPg === totalPages) { next.disabled = true; next.style.opacity = "0.4"; }
  next.onclick = () => onPageChange(currentPg + 1);
  box.appendChild(next);
}

function renderWarrantyPieChart(during, post) {
  const canvas = document.getElementById("warrantyPieChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const size = 220;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = size + "px";
  canvas.style.height = size + "px";
  ctx.scale(dpr, dpr);

  const total = during + post;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 85;
  const innerRadius = 52;

  const slices = [
    { label: "During Warranty", value: during, color: "#00e5ff", glow: "rgba(0,229,255,0.45)" },
    { label: "Post Warranty", value: post, color: "#ff3d57", glow: "rgba(255,61,87,0.45)" }
  ];

  // Clear canvas
  ctx.clearRect(0, 0, size, size);

  if (total === 0) {
    // Draw empty state
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2, true);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fill();
    ctx.font = "13px Segoe UI, sans-serif";
    ctx.fillStyle = "#8aa4b3";
    ctx.textAlign = "center";
    ctx.fillText("No Data", cx, cy + 5);
    return;
  }

  // Animate the chart
  let animProgress = 0;
  const animDuration = 800;
  const startTime = performance.now();

  function drawFrame(now) {
    animProgress = Math.min((now - startTime) / animDuration, 1);
    // ease-out cubic
    const ease = 1 - Math.pow(1 - animProgress, 3);
    const sweep = ease * Math.PI * 2;

    ctx.clearRect(0, 0, size, size);

    let startAngle = -Math.PI / 2;

    slices.forEach(function (slice) {
      if (slice.value === 0) return;
      const sliceAngle = (slice.value / total) * sweep;

      // Glow effect
      ctx.save();
      ctx.shadowColor = slice.glow;
      ctx.shadowBlur = 18;

      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
      ctx.arc(cx, cy, innerRadius, startAngle + sliceAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = slice.color;
      ctx.fill();
      ctx.restore();

      startAngle += sliceAngle;
    });

    // Center circle (donut hole)
    ctx.beginPath();
    ctx.arc(cx, cy, innerRadius - 1, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(10,20,35,0.92)";
    ctx.fill();

    // Center text
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#e8f4ff";
    ctx.font = "bold 26px Segoe UI, sans-serif";
    ctx.fillText(total, cx, cy - 6);
    ctx.font = "11px Segoe UI, sans-serif";
    ctx.fillStyle = "#8aa4b3";
    ctx.fillText("Total", cx, cy + 14);

    if (animProgress < 1) {
      requestAnimationFrame(drawFrame);
    }
  }

  requestAnimationFrame(drawFrame);

  // Render legend
  const legendBox = document.getElementById("warrantyLegend");
  if (legendBox) {
    legendBox.innerHTML = slices.map(function (s) {
      const pct = total > 0 ? ((s.value / total) * 100).toFixed(1) : "0.0";
      return `
        <div class="legend-item">
          <span class="legend-dot" style="background:${s.color};color:${s.color}"></span>
          <span class="legend-label">${s.label}<br><small style="opacity:.7">${pct}%</small></span>
          <span class="legend-value" style="color:${s.color}">${s.value}</span>
        </div>`;
    }).join("");
  }
}


function renderTable() {
  const tbody = document.querySelector("#durationTable tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const start = (currentPage - 1) * rowsPerPage;
  const pageData = filteredData.slice(start, start + rowsPerPage);

  pageData.forEach(function (a) {
    const tr = document.createElement("tr");
    if (a.daysLeft < 0) tr.classList.add("blink");
    tr.innerHTML = `
      <td><span class="open-asset clickable-id" data-id="${a.id}">${a.id}</span></td>
      <td>${a.name || "-"}</td>
      <td>${formatDate(a.startDate)}</td>
      <td>${formatDate(a.endDate)}</td>
      <td style="color:${a.daysLeft < 0 ? '#ff3d57' : a.daysLeft < UPCOMING_DAYS ? '#ffc107' : '#00e676'}">
        ${a.daysLeft}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderPagination() {
  const pageBox = document.getElementById("pagination");
  pageBox.innerHTML = "";
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  const prev = document.createElement("button");
  prev.innerText = "Prev";
  prev.className = "btn";
  if (currentPage === 1) {
    prev.disabled = true;
    prev.style.opacity = "0.4";
  }
  prev.onclick = () => {
    currentPage--;
    renderTable();
    renderPagination();
  };
  pageBox.appendChild(prev);

  for (let i = startPage; i <= endPage; i++) {
    const btn = document.createElement("button");
    btn.innerText = i;
    btn.className = "btn";
    if (i === currentPage) {
      btn.style.background = "#00e5ff";
      btn.style.color = "#000";
    }
    btn.onclick = () => {
      currentPage = i;
      renderTable();
      renderPagination();
    };
    pageBox.appendChild(btn);
  }

  const next = document.createElement("button");
  next.innerText = "Next";
  next.className = "btn";
  if (currentPage === totalPages || totalPages === 0) {
    next.disabled = true;
    next.style.opacity = "0.4";
  }
  next.onclick = () => {
    currentPage++;
    renderTable();
    renderPagination();
  };
  pageBox.appendChild(next);
}

function applyFilter() {
  const keyword = document.getElementById("searchInput").value.toLowerCase();
  filteredData = allData.filter(a => {
    const matchSearch = a.id.toLowerCase().includes(keyword) || (a.name || "").toLowerCase().includes(keyword);
    if (currentFilter === 'OVERDUE') return matchSearch && a.daysLeft < 0;
    if (currentFilter === 'NEAR') return matchSearch && a.daysLeft >= 0 && a.daysLeft < UPCOMING_DAYS;
    return matchSearch;
  });
  currentPage = 1;
  renderTable();
  renderPagination();
}

function setFilter(type) {
  currentFilter = type;
  document.querySelectorAll('.filter-bar button').forEach(b => b.classList.remove('filter-active'));
  if (type === 'ALL') document.getElementById('f_all').classList.add('filter-active');
  if (type === 'OVERDUE') document.getElementById('f_overdue').classList.add('filter-active');
  if (type === 'NEAR') document.getElementById('f_near').classList.add('filter-active');
  applyFilter();
}

function exportCSV() {
  let csv = "ID,Equipment,Start Date,End Date,Days Left\n";
  const rows = document.querySelectorAll("#durationTable tbody tr");
  rows.forEach(function (tr) {
    const cols = tr.querySelectorAll("td");
    let row = [];
    cols.forEach(function (td) {
      let text = td.innerText.replace(/,/g, " ").replace(/\n/g, " ").trim();
      row.push(text);
    });
    csv += row.join(",") + "\n";
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "contract_duration.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// =============================================
// CONTRACT DURATION SUMMARY — 6 COMPONENTS
// =============================================

// 1. SUMMARY STATS BAR
function renderSummaryStats(data) {
  if (!data.length) return;
  const durations = data.map(a => {
    if (!a.startDate || !a.endDate) return null;
    const s = new Date(a.startDate);
    const e = new Date(a.endDate);
    if (isNaN(s) || isNaN(e)) return null;
    return Math.ceil((e - s) / 86400000);
  }).filter(d => d !== null && d > 0);

  if (durations.length) {
    const avg = Math.round(durations.reduce((s, v) => s + v, 0) / durations.length);
    const shortest = Math.min(...durations);
    const longest = Math.max(...durations);
    document.getElementById("statAvgDuration").innerText = avg + " days";
    document.getElementById("statShortest").innerText = shortest + " days";
    document.getElementById("statLongest").innerText = longest + " days";
  }

  // Contract end — use first asset's endContract as reference
  const contractEnd = data.find(a => a.endContract)?.endContract;
  if (contractEnd) {
    document.getElementById("statContractEnd").innerText = formatDate(contractEnd);
  }
}

// 5. CONTRACT END PROGRESS BAR
function renderContractProgress(data) {
  const contractEnd = data.find(a => a.endContract)?.endContract;
  const contractStart = data.reduce((min, a) => {
    if (!a.startDate) return min;
    return (!min || a.startDate < min) ? a.startDate : min;
  }, null);

  if (!contractEnd || !contractStart) return;

  const startD = new Date(contractStart);
  const endD = new Date(contractEnd);
  const today = new Date();
  if (isNaN(startD) || isNaN(endD)) return;

  const totalDays = Math.ceil((endD - startD) / 86400000);
  const elapsed = Math.ceil((today - startD) / 86400000);
  const remaining = Math.ceil((endD - today) / 86400000);
  const pct = Math.min(100, Math.max(0, Math.round((elapsed / totalDays) * 100)));

  // Animate bar
  const bar = document.getElementById("contractProgressBar");
  if (bar) {
    bar.style.width = "0%";
    setTimeout(() => { bar.style.width = pct + "%"; }, 100);
  }

  const pctEl = document.getElementById("contractProgressPct");
  if (pctEl) pctEl.innerText = pct + "%";

  const daysEl = document.getElementById("contractProgressDays");
  if (daysEl) daysEl.innerText = remaining > 0 ? remaining + " hari lagi" : "Tamat!";

  const startLabel = document.getElementById("contractStartLabel");
  if (startLabel) startLabel.innerText = "Start: " + formatDate(contractStart);

  const endLabel = document.getElementById("contractEndLabel");
  if (endLabel) endLabel.innerText = "End: " + formatDate(contractEnd);

  // Color based on remaining
  if (bar) {
    if (remaining <= 0) bar.style.background = "linear-gradient(90deg,#ff3d57,#ff6b81)";
    else if (remaining < 180) bar.style.background = "linear-gradient(90deg,#ffc107,#ffaa00)";
  }
}

// 2. WARRANTY EXPIRY TIMELINE (bar chart by month)
function renderExpiryTimeline(data) {
  const container = document.getElementById("expiryTimeline");
  if (!container) return;

  const months = {};
  data.forEach(a => {
    if (!a.endDate) return;
    const d = new Date(a.endDate);
    if (isNaN(d)) return;
    const key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
    months[key] = (months[key] || 0) + 1;
  });

  const sorted = Object.entries(months).sort((a, b) => a[0].localeCompare(b[0]));
  if (!sorted.length) { container.innerHTML = '<div style="color:var(--subtext);padding:20px;text-align:center">No data</div>'; return; }

  const maxVal = Math.max(...sorted.map(e => e[1]));
  const colors = ["#00e5ff", "#00b4d8", "#0077b6", "#ffc107", "#ff3d57"];

  container.innerHTML = sorted.map(([month, count], i) => {
    const pct = Math.round((count / maxVal) * 100);
    const color = count === maxVal ? "#ff3d57" : (pct > 60 ? "#ffc107" : "#00e5ff");
    return `
      <div class="timeline-row">
        <span class="timeline-label">${month}</span>
        <div class="timeline-bar-wrap">
          <div class="timeline-bar" style="width:${pct}%;background:${color};box-shadow:0 0 8px ${color}44"></div>
        </div>
        <span class="timeline-count">${count}</span>
      </div>`;
  }).join("");
}

// 3. DISCIPLINE BREAKDOWN (donut chart)
function renderDisciplineChart(data) {
  const canvas = document.getElementById("disciplineChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const size = 180;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = size + "px";
  canvas.style.height = size + "px";
  ctx.scale(dpr, dpr);

  const counts = {};
  data.forEach(a => {
    const d = (a.discipline || "Unknown").toUpperCase().trim();
    counts[d] = (counts[d] || 0) + 1;
  });

  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const total = data.length;
  const palette = ["#00e5ff", "#ffc107", "#ff3d57", "#00ff9c", "#a78bfa", "#f97316", "#ec4899"];
  const cx = size / 2, cy = size / 2, radius = 70, inner = 42;

  ctx.clearRect(0, 0, size, size);

  if (!entries.length) return;

  let startAngle = -Math.PI / 2;
  entries.forEach(([, count], i) => {
    const slice = (count / total) * Math.PI * 2;
    ctx.save();
    ctx.shadowColor = palette[i % palette.length] + "66";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, startAngle + slice);
    ctx.arc(cx, cy, inner, startAngle + slice, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = palette[i % palette.length];
    ctx.fill();
    ctx.restore();
    startAngle += slice;
  });

  // Donut hole
  ctx.beginPath();
  ctx.arc(cx, cy, inner - 1, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(10,20,35,0.92)";
  ctx.fill();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#e8f4ff";
  ctx.font = "bold 20px Segoe UI, sans-serif";
  ctx.fillText(entries.length, cx, cy - 4);
  ctx.font = "10px Segoe UI, sans-serif";
  ctx.fillStyle = "#8aa4b3";
  ctx.fillText("Types", cx, cy + 12);

  // Legend
  const legendBox = document.getElementById("disciplineLegend");
  if (legendBox) {
    legendBox.innerHTML = entries.map(([name, count], i) => {
      const pct = ((count / total) * 100).toFixed(1);
      const color = palette[i % palette.length];
      return `
        <div class="legend-item">
          <span class="legend-dot" style="background:${color};color:${color}"></span>
          <span class="legend-label">${name}<br><small style="opacity:.7">${pct}%</small></span>
          <span class="legend-value" style="color:${color}">${count}</span>
        </div>`;
    }).join("");
  }
}

// 4. SUPPLIER BREAKDOWN (top 5)
function renderSupplierBreakdown(data) {
  const container = document.getElementById("supplierList");
  if (!container) return;

  const suppliers = {};
  data.forEach(a => {
    const name = (a.supplier || "Unknown").trim();
    if (!suppliers[name]) suppliers[name] = { total: 0, overdue: 0 };
    suppliers[name].total++;
    if (a.daysLeft < 0) suppliers[name].overdue++;
  });

  const sorted = Object.entries(suppliers).sort((a, b) => b[1].total - a[1].total).slice(0, 5);

  if (!sorted.length) { container.innerHTML = '<div style="color:var(--subtext);padding:20px;text-align:center">No data</div>'; return; }

  container.innerHTML = sorted.map(([name, info], i) => `
    <div class="supplier-row">
      <span class="supplier-rank">${i + 1}</span>
      <span class="supplier-name" title="${name}">${name}</span>
      <span class="supplier-count">${info.total}</span>
      <span class="supplier-overdue">${info.overdue > 0 ? info.overdue + " overdue" : "✓"}</span>
    </div>
  `).join("");
}

// 6. EXPIRY ALERT BY YEAR
function renderExpiryByYear(data) {
  const tbody = document.querySelector("#yearTable tbody");
  if (!tbody) return;

  const years = {};
  data.forEach(a => {
    if (!a.endDate) return;
    const d = new Date(a.endDate);
    if (isNaN(d)) return;
    const y = d.getFullYear();
    if (!years[y]) years[y] = { during: 0, post: 0 };
    if (a.daysLeft < 0) years[y].post++;
    else years[y].during++;
  });

  const sorted = Object.entries(years).sort((a, b) => Number(a[0]) - Number(b[0]));
  tbody.innerHTML = "";

  if (!sorted.length) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--subtext);padding:16px">No data</td></tr>';
    return;
  }

  sorted.forEach(([year, info]) => {
    const total = info.during + info.post;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="font-weight:600">${year}</td>
      <td style="color:#00e5ff">${info.during}</td>
      <td style="color:#ff3d57">${info.post}</td>
      <td style="font-weight:700">${total}</td>
    `;
    tbody.appendChild(tr);
  });
}

function prepareData(assets) {
  const module = getModule().toUpperCase();
  const today = new Date();
  return assets.map(function (a) {
    const base = (module === "BEMS")
      ? { id: a.id, name: a.assetDescription, startDate: a.purchaseDate, endDate: a.warrantyEnd }
      : { id: a.id, name: a.equipmentName, startDate: a.startDate, endDate: a.endDate };
    if (!base.endDate) return null;
    const diff = Math.ceil((new Date(base.endDate) - today) / (1000 * 60 * 60 * 24));
    // Extra fields for summary
    base.discipline = a.discipline || "";
    base.supplier = a.supplier || a.bumi || "";
    base.price = a.price || 0;
    base.endContract = a.endContract || "";
    base.department = a.department || "";
    return { ...base, daysLeft: diff };
  }).filter(Boolean);
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}
