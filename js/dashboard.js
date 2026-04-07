
document.addEventListener("DOMContentLoaded", ()=>{
  document.getElementById("moduleName").innerText = sessionStorage.getItem("cmmsModule") || "FEMS";
  initDashboard();
});

async function initDashboard(){
  const assets = await getAssets();
  const dash = await getDashboard();
  const dw = await getDWList();

  const totalEl = document.getElementById("totalAssets");
  const overdueEl = document.getElementById("overdueCount");
  const upcomingEl = document.getElementById("upcomingCount");

  if(totalEl) totalEl.innerText = assets.length;
  if(overdueEl) overdueEl.innerText = dash?.overdue || 0;
  if(upcomingEl) upcomingEl.innerText = (dw||[]).length;

  renderRecent(dw||[]);
  renderAssetChart(assets);
  renderPPMChart(dw);
  renderTrendChart(dw);
  renderDurationTable(assets);
  showAlerts(assets);
}

function renderRecent(dw){
  const box = document.getElementById("recentList");
  if(!box) return;
  const list = dw.slice(0,6);
  box.innerHTML = list.map(r=>`
    <div class="asset-card">
      <b data-asset-id="${r.id}">${r.id}</b>
      <div>${r.date||"-"}</div>
      <div>${r.status||"-"}</div>
    </div>
  `).join("");
}


function mapDurationData(a, module){

  if(module === "BEMS"){
    return {
      id: a.id,
      name: a.assetDescription,
      startDate: a.purchaseDate,
      endDate: a.warrantyEnd
    };
  }

  // FEMS
  return {
    id: a.id,
    name: a.equipmentName,
    startDate: a.startDate,
    endDate: a.endDate
  };
}

function renderDurationTable(assets){

  const tbody = document.querySelector("#durationTable tbody");
  if(!tbody) return;
  tbody.innerHTML = "";

  const module = getModule().toUpperCase();
  const today = new Date();

  // 🔥 STEP 1: map + filter + kira daysLeft
  const sorted = assets
    .map(a => {

      const x = mapDurationData(a, module);

      if(!x.endDate) return null;

      const end = new Date(x.endDate);
      const diff = Math.ceil((end - today)/(1000*60*60*24));

      return {
        ...x,
        daysLeft: diff
      };

    })
    .filter(Boolean)
    .sort((a,b) => a.daysLeft - b.daysLeft);

  // 🔥 STEP 2: render
  sorted.forEach(a => {

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td><span class="clickable-id" data-asset-id="${a.id}">${a.id}</span></td>
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

function showAlerts(assets){
  const today = new Date();
  let overdue = 0;
  let near = 0;

  assets.forEach(a=>{
    if(!a.endDate) return;
    const diff = Math.ceil((new Date(a.endDate) - today)/(1000*60*60*24));
    if(diff < 0) overdue++;
    else if(diff < 30) near++;
  });

  if(overdue || near){
    alert(`⚠ ALERT:\nOverdue: ${overdue}\nExpiring Soon: ${near}`);
  }
}

function exportCSV(assets){
  let csv = "ID,Equipment,Start Date,End Date,Days Left\n";
  const today = new Date();

  assets.forEach(a=>{
    if(!a.endDate) return;
    const diff = Math.ceil((new Date(a.endDate) - today)/(1000*60*60*24));
    csv += `${a.id},${a.equipmentName},${a.startDate},${a.endDate},${diff}\n`;
  });

  const blob = new Blob([csv], {type:"text/csv"});
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "duration_report.csv";
  a.click();
}



function renderAssetChart(assets){
  let healthy=0, overdue=0;
  const today = new Date();
  assets.forEach(a=>{
    if(!a.endDate) return;
    const diff = new Date(a.endDate) - today;
    if(diff < 0) overdue++;
    else healthy++;
  });

  new Chart(document.getElementById("assetChart"),{
    type:"doughnut",
    data:{
      labels:["Healthy","Overdue"],
      datasets:[{ data:[healthy,overdue] }]
    }
  });
}

function renderPPMChart(dw){
  let completed=0, pending=0, breakdown=0;
  dw.forEach(d=>{
    if(d.status==="Completed") completed++;
    else if(d.status==="Breakdown") breakdown++;
    else pending++;
  });

  new Chart(document.getElementById("ppmChart"),{
    type:"bar",
    data:{
      labels:["Completed","Pending","Breakdown"],
      datasets:[{ data:[completed,pending,breakdown] }]
    }
  });
}

function renderTrendChart(dw){
  const months = {};
  dw.forEach(d=>{
    if(!d.date) return;
    const m = new Date(d.date).toLocaleString("default",{month:"short"});
    months[m] = (months[m] || 0) + 1;
  });

  new Chart(document.getElementById("trendChart"),{
    type:"line",
    data:{
      labels:Object.keys(months),
      datasets:[{ label:"PPM", data:Object.values(months) }]
    }
  });
}
