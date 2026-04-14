let allData = [];
let currentFilter = 'ALL';

document.addEventListener("DOMContentLoaded", ()=>{
  document.getElementById("moduleName").innerText = sessionStorage.getItem("cmmsModule") || "FEMS";
  initDashboard();
});

async function initDashboard(){
  const assets = await getAssets();
  const dash = await getDashboard();

  allData = prepareData(assets);

  document.getElementById("totalAssets").innerText = assets.length;
  document.getElementById("overdueCount").innerText = dash?.overdue || 0;
  document.getElementById("upcomingCount").innerText = (dash?.recent || []).length;

  renderTable(allData);
}

function prepareData(assets){
  const module = getModule().toUpperCase();
  const today = new Date();

  return assets.map(a=>{
    const data = (module === "BEMS")
      ? {id:a.id,name:a.assetDescription,startDate:a.purchaseDate,endDate:a.warrantyEnd}
      : {id:a.id,name:a.equipmentName,startDate:a.startDate,endDate:a.endDate};

    if(!data.endDate) return null;

    const diff = Math.ceil((new Date(data.endDate)-today)/(1000*60*60*24));

    return {...data, daysLeft: diff};
  }).filter(Boolean);
}

function renderTable(data){
  const tbody = document.querySelector("#durationTable tbody");
  tbody.innerHTML = "";

  data.sort((a,b)=>a.daysLeft-b.daysLeft);

  data.forEach(a=>{
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
  let csv = "ID,Equipment,Start Date,End Date,Days Left
";

  // guna data yang sama dalam table (filtered)
  const rows = document.querySelectorAll("#durationTable tbody tr");

  rows.forEach(tr=>{
    const cols = tr.querySelectorAll("td");
    const row = Array.from(cols).map(td=>td.innerText.trim());
    csv += row.join(",") + "
";
  });

  const blob = new Blob([csv], {type:"text/csv"});
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "contract_duration.csv";
  a.click();
},${a.equipmentName},${a.startDate},${a.endDate},${diff}\n`;
  });

  const blob = new Blob([csv], {type:"text/csv"});
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "duration_report.csv";
  a.click();
}
