let allData = [];
let currentFilter = 'ALL';
let currentPage = 1;
const rowsPerPage = 10;

document.addEventListener("DOMContentLoaded", () => {
  initDashboard();
});

async function initDashboard() {
  const assets = await getAssets();
  allData = prepareData(assets);
  let overdue = 0;
  let upcoming = 0;
  allData.forEach(a => {
    if (a.daysLeft < 0) overdue++;
    else if (a.daysLeft < 30) upcoming++;
  });
  document.getElementById("totalAssets").innerText = allData.length;
  document.getElementById("overdueCount").innerText = overdue;
  document.getElementById("upcomingCount").innerText = upcoming;
  applyFilter();
}

function renderTable(data) {
  const tbody = document.querySelector("#durationTable tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  // Pagination logic
  const totalPages = Math.ceil(data.length / rowsPerPage);
  if (currentPage > totalPages) currentPage = totalPages || 1;
  const start = (currentPage - 1) * rowsPerPage;
  const pageData = data.slice(start, start + rowsPerPage);

  pageData.forEach(function (a) {
    const tr = document.createElement("tr");
    if (a.daysLeft < 0) tr.classList.add("blink");
    tr.innerHTML = `
      <td>${a.id}</td>
      <td>${a.name || "-"}</td>
      <td>${formatDate(a.startDate)}</td>
      <td>${formatDate(a.endDate)}</td>
      <td style="color:${a.daysLeft < 0 ? '#ff3d57' : a.daysLeft < 30 ? '#ffc107' : '#00e676'}">
        ${a.daysLeft}
      </td>
    `;
    tbody.appendChild(tr);
  });

  renderPagination(data.length, totalPages);
}

function renderPagination(totalItems, totalPages) {
  let pag = document.getElementById("pagination");
  if (!pag) {
    pag = document.createElement("div");
    pag.id = "pagination";
    document.querySelector("#durationTable").after(pag);
  }
  pag.innerHTML = "";

  if (totalPages <= 1) return;

  // Info text
  const info = document.createElement("span");
  info.style.cssText = "font-size:12px;color:var(--subtext);margin-right:12px;";
  const start = (currentPage - 1) * rowsPerPage + 1;
  const end = Math.min(currentPage * rowsPerPage, totalItems);
  info.textContent = `${start}-${end} of ${totalItems}`;
  pag.appendChild(info);

  // Prev button
  const prev = document.createElement("button");
  prev.className = "btn";
  prev.textContent = "‹";
  prev.disabled = currentPage === 1;
  prev.style.cssText = "min-width:32px;opacity:" + (currentPage === 1 ? "0.4" : "1");
  prev.onclick = () => { currentPage--; applyFilter(); };
  pag.appendChild(prev);

  // Page buttons (max 5 visible)
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);
  if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

  for (let i = startPage; i <= endPage; i++) {
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = i;
    if (i === currentPage) {
      btn.style.cssText = "background:var(--primary);color:#fff;border-color:var(--primary);min-width:32px;";
    } else {
      btn.style.cssText = "min-width:32px;";
    }
    btn.onclick = () => { currentPage = i; applyFilter(); };
    pag.appendChild(btn);
  }

  // Next button
  const next = document.createElement("button");
  next.className = "btn";
  next.textContent = "›";
  next.disabled = currentPage === totalPages;
  next.style.cssText = "min-width:32px;opacity:" + (currentPage === totalPages ? "0.4" : "1");
  next.onclick = () => { currentPage++; applyFilter(); };
  pag.appendChild(next);
}

function applyFilter() {
  const keyword = document.getElementById("searchInput").value.toLowerCase();
  let filtered = allData.filter(a => {
    const matchSearch = a.id.toLowerCase().includes(keyword) || (a.name || "").toLowerCase().includes(keyword);
    if (currentFilter === 'OVERDUE') return matchSearch && a.daysLeft < 0;
    if (currentFilter === 'NEAR') return matchSearch && a.daysLeft >= 0 && a.daysLeft < 30;
    return matchSearch;
  });
  renderTable(filtered);
}

function setFilter(type) {
  currentFilter = type;
  currentPage = 1; // reset ke page 1 bila tukar filter
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

function prepareData(assets) {
  const module = getModule().toUpperCase();
  const today = new Date();
  return assets.map(function (a) {
    const data = (module === "BEMS")
      ? { id: a.id, name: a.assetDescription, startDate: a.purchaseDate, endDate: a.warrantyEnd }
      : { id: a.id, name: a.equipmentName, startDate: a.startDate, endDate: a.endDate };
    if (!data.endDate) return null;
    const diff = Math.ceil((new Date(data.endDate) - today) / (1000 * 60 * 60 * 24));
    return { ...data, daysLeft: diff };
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
