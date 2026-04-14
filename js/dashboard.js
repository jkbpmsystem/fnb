let allData = [];
let currentFilter = 'ALL';

document.addEventListener("DOMContentLoaded", ()=>{
  initDashboard();
});

async function initDashboard(){
  const assets = await getAssets();

  allData = prepareData(assets);

  // ✅ KPI kira dari data sendiri
  let overdue = 0;
  let upcoming = 0;

  allData.forEach(a=>{
    if(a.daysLeft < 0) overdue++;
    else if(a.daysLeft < 30) upcoming++;
  });

  document.getElementById("totalAssets").innerText = allData.length;
  document.getElementById("overdueCount").innerText = overdue;
  document.getElementById("upcomingCount").innerText = upcoming;

  renderTable(allData);
}
function renderTable(data){
  const tbody = document.querySelector("#durationTable tbody");
  if(!tbody) return;

  tbody.innerHTML = "";

  data.forEach(function(a){

    const tr = document.createElement("tr");

    if(a.daysLeft < 0) tr.classList.add("blink");

    tr.innerHTML = `
      <td>${a.id}</td>
      <td>${a.name || "-"}</td>
      <td>${formatDate(a.startDate)}</td>
      <td>${formatDate(a.endDate)}</td>
      <td style="color:${a.daysLeft<0?'#ff3d57':a.daysLeft<30?'#ffc107':'#00e676'}">
        ${a.daysLeft}
      </td>
    `;

    tbody.appendChild(tr);

  });
}

function applyFilter(){
  const keyword = document.getElementById("searchInput").value.toLowerCase();

  let filtered = allData.filter(a=>{
    const matchSearch = a.id.toLowerCase().includes(keyword) || (a.name||"").toLowerCase().includes(keyword);

    if(currentFilter === 'OVERDUE') return matchSearch && a.daysLeft < 0;
    if(currentFilter === 'NEAR') return matchSearch && a.daysLeft >=0 && a.daysLeft < 30;

    return matchSearch;
  });

  renderTable(filtered);
}

function setFilter(type){
  currentFilter = type;

  document.querySelectorAll('.filter-bar button').forEach(b=>b.classList.remove('filter-active'));

  if(type==='ALL') document.getElementById('f_all').classList.add('filter-active');
  if(type==='OVERDUE') document.getElementById('f_overdue').classList.add('filter-active');
  if(type==='NEAR') document.getElementById('f_near').classList.add('filter-active');

  applyFilter();
}

function exportCSV(){
  let csv = "ID,Equipment,Start Date,End Date,Days Left\\n";

  const rows = document.querySelectorAll("#durationTable tbody tr");

  rows.forEach(function(tr){
    const cols = tr.querySelectorAll("td");
    let row = [];

    cols.forEach(function(td){
      let text = td.innerText
        .replace(/,/g, " ")
        .replace(/\\n/g, " ")
        .trim();

      row.push(text);
    });

    csv += row.join(",") + "\\n";
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

function prepareData(assets){
  const module = getModule().toUpperCase();
  const today = new Date();

  return assets.map(function(a){

    const data = (module === "BEMS")
      ? {
          id: a.id,
          name: a.assetDescription,
          startDate: a.purchaseDate,
          endDate: a.warrantyEnd
        }
      : {
          id: a.id,
          name: a.equipmentName,
          startDate: a.startDate,
          endDate: a.endDate
        };

    if(!data.endDate) return null;

    const diff = Math.ceil(
      (new Date(data.endDate) - today) / (1000*60*60*24)
    );

    return {
      ...data,
      daysLeft: diff
    };

  }).filter(Boolean);
}
