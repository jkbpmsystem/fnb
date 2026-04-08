let assetCache = [];
let currentAsset = null;
let selectedPPM = {
  assetId: null,
  cycle: null
};

// ======================
// CACHE
// ======================
async function getAssetCached(){

  if(assetCache.length === 0){

    const res = await getAssets();

    assetCache = res.map(row => ({
      id: row.id,
      codeLocation: row.codeLocation,
      area: row.area,
      department: row.department,
      assetNo: row.assetNo,
      assetNoHosza: row.assetNoHosza,
      equipmentName: row.equipmentName,
      typeCode: row.typeCode,
      equipmentDescriptions: row.equipmentDescriptions,
      discipline: row.discipline,
      bumi: row.bumi,
      supplier: row.supplier,
      manufacture: row.manufacture,
      model: row.model,
      serialNumber: row.serialNumber,
      price: row.price,
      lpoNo: row.lpoNo,
      category: row.category,
      startDate: row.startDate,
      endDate: row.endDate,
      ppmFrequency: row.ppmFrequency,
      status: row.status,
      1st: row.1st,
      2nd: row.2nd,
      3rd: row.3rd,
      4th: row.4th,
      5th: row.5th,
      6th: row.6th,
      7th: row.7th,
      8th: row.8th,
      9th: row.9th,
      10th: row.10th,
      11th: row.11th,
      12th: row.12th,
      13th: row.13th,
      14th: row.14th,
      15th: row.15th,
      16th: row.16th,
      17th: row.17th,
      18th: row.18th,
      19th: row.19th,
      20th: row.20th,
      21st: row.21st,
      done_1st: row.done_1st,
      done_2nd: row.done_2nd,
      done_3rd: row.done_3rd,
      done_4th: row.done_4th,
      done_5th: row.done_5th,
      done_6th: row.done_6th,
      done_7th: row.done_7th,
      done_8th: row.done_8th,
      done_9th: row.done_9th,
      done_10th: row.done_10th,
      done_11th: row.done_11th,
      done_12th: row.done_12th,
      done_13th: row.done_13th,
      done_14th: row.done_14th,
      done_15th: row.done_15th,
      done_16th: row.done_16th,
      done_17th: row.done_17th,
      done_18th: row.done_18th,
      done_19th: row.done_19th,
      done_20th: row.done_20th,
      done_21st: row.done_21st

    }));

  }

  return assetCache;
}

// ======================
// OPEN DETAIL
// ======================
async function openAssetDetailById(assetId){

  const assets = await getAssetCached();
  const asset = assets.find(a => a.id == assetId);

  if(!asset){ 
    alert("Asset not found"); 
    return; 
  }

  currentAsset = asset;

  // 🔥 detect module
  const module = getModule().toUpperCase();

  let detailHTML = "";

  if(module === "BEMS"){
    detailHTML = renderBEMSDetail(asset);
  }else{
    detailHTML = renderFEMSDetail(asset);
  }
console.log("ASSET CLICKED:", asset);
  document.getElementById("detailBody").innerHTML = renderDetailWithTab(detailHTML);

  document.getElementById("globalDetailModal").style.display = "flex";
}

function closeGlobalModal(){
  document.getElementById("globalDetailModal").style.display = "none";
}

// ======================
// TAB SYSTEM
// ======================
function renderDetailWithTab(detailHTML){
  return `
  <div class="tab-header">
    <button class="tab-btn active" data-tab="detail">Detail</button>
    <button class="tab-btn" data-tab="ppm">PPM</button>
  </div>

  <div id="tab-detail" class="tab-content active">
    ${detailHTML}
  </div>

  <div id="tab-ppm" class="tab-content">
    <div>Loading...</div>
  </div>
  `;
}

// ======================
// DETAIL VIEW
// ======================
function renderFEMSDetail(a){
  return `
<div class="asset-grid">

  <div class="asset-card">
    <h4>Basic</h4>
    <b>ID</b><div>${a.id}</div>
    <b>Asset No</b><div>${a.assetNo}</div>
    <b>Asset No Hosza</b><div>${a.assetNoHosza}</div>
    <b>Equipment Name</b><div>${a.equipmentName}</div>
    <b>Description</b><div>${a.equipmentDescriptions}</div>
    <b>Category</b><div>${a.category}</div>
  </div>
  
  <div class="asset-card">
    <h4>Location</h4>
    <b>Code</b><div>${a.codeLocation}</div>
    <b>Area</b><div>${a.area}</div>
    <b>Department</b><div>${a.department}</div>
  </div>
  
  <div class="asset-card">
    <h4>Technical</h4>
    <b>Type Code</b><div>${a.typeCode}</div>
    <b>Manufacturer</b><div>${a.manufacture}</div>
    <b>Model</b><div>${a.model}</div>
    <b>Serial No</b><div>${a.serialNumber}</div>
  </div>
   
  <div class="asset-card">
    <h4>Supplier</h4>
    <b>Bumi</b><div>${a.bumi}</div>
    <b>Supplier</b><div>${a.supplier}</div>
  </div>
    
  <div class="asset-card">
    <h4>Financial</h4>
    <b>Price</b><div>${a.price}</div>
    <b>LPO No</b><div>${a.lpoNo}</div>
  </div>
    
  <div class="asset-card">
    <h4>Warranty</h4>
    <b>Start</b><div>${formatDate(a.startDate|| "")}</div>
    <b>End</b><div>${formatDate(a.endDate|| "")}</div>
    <b>Freq/Year</b><div>${a.ppmFrequency}</div>
    <b>Status</b><div>${a.status}</div>
  </div>

</div>
  `;
}

function renderBEMSDetail(a){
  return `
<div class="asset-grid">

  <div class="asset-card">
    <h4>Basic</h4>
    <b>ID</b><div>${a.id}</div>
    <b>Asset No</b><div>${a.assetNumber}</div>
    <b>Asset No Konsesi</b><div>${a.assetNumberKonsesi}</div>
    <b>Service</b><div>${a.service}</div>
    <b>As Per Contract Nov 2022 - Nov 2024</b><div>${a.contract}</div>
  </div>
  
  <div class="asset-card">
    <h4>Location</h4>
    <b>Code</b><div>${a.codeLocation}</div>
    <b>Area</b><div>${a.area}</div>
    <b>Department</b><div>${a.department}</div>
  </div>
  
  <div class="asset-card">
    <h4>Technical</h4>
    <b>Type Code</b><div>${a.typeCode}</div>
    <b>Type Description</b><div>${a.typeDescription}</div>
    <b>Asset Description</b><div>${a.assetDescription}</div>
    <b>Manufacturer</b><div>${a.manufacturer}</div>
    <b>Model</b><div>${a.model}</div>
    <b>Serial No</b><div>${a.serialNo}</div>
  </div>
   
  <div class="asset-card">
    <h4>Supplier</h4>
    <b>Bumi</b><div>${a.bumiAgent}</div>
    <b>Supplier</b><div>${a.vendor}</div>
    <b>Remarks</b><div>${a.remarks}</div>
  </div>
    
  <div class="asset-card">
    <h4>Financial</h4>
    <b>LO Price</b><div>${a.loPrice}</div>
    <b>Price per Unit</b><div>${a.pricePerUnit}</div>
    <b>LPO No</b><div>${a.loNo}</div>
    <b>Purchase Date</b><div>${formatDate(a.purchaseDate|| "")}</div>
    <b>Commissioning Date</b><div>${formatDate(a.commissioningDate|| "")}</div>
  </div>
    
  <div class="asset-card">
    <h4>Warranty</h4>
    <b>Start Warranty</b><div>${formatDate(a.warrantyStartDate|| "")}</div>
    <b>End Warranty</b><div>${formatDate(a.warrantyEndDate|| "")}</div>
    <b>Freq/Year</b><div>${a.ppmFrequency}</div>
    <b>Warranty Duration</b><div>${a.warrantyDuration}</div>
  </div>

    <div class="asset-card">
    <h4>Other</h4>
    <b>Type of Maintenance</b><div>${a.maintenanceType}</div>
    <b>Month</b><div>${a.month}</div>
    <b>Status Warranty</b><div>${a.statusWarranty}</div>
    <b>PPM</b><div>${a.ppm}</div>
    <b>Remark</b><div>${a.remark}</div>
  </div>

</div>
  `;
}
// ======================
// FORMAT DATE
// ======================
window.formatDate = function(dateStr){
  if(!dateStr) return "-";
  const d = new Date(dateStr);
  if(isNaN(d.getTime())) return "-";
  const day = String(d.getDate()).padStart(2,"0");
  const month = String(d.getMonth()+1).padStart(2,"0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// ======================
// 🔥 NEW PPM RENDER (AUTO DETECT)
// ======================
function renderPPM(asset){

  const list = [];

  for(let i=1; i<=21; i++){

    const suffix = getOrdinal(i); // 1st, 2nd...

    const key = suffix;              // 🔥 updated
    const statusKey = "done_" + suffix; // 🔥 updated

    const planned = asset[key];
    if(!planned) continue;

    const actual = asset[statusKey] || "";

    list.push({
      cycle: i,
      planned,
      actual
    });
  }

  if(list.length === 0){
    return "<div>No PPM Data</div>";
  }

  let html = `<div class="ppm-wrapper">`;

  html += `
  <h3>During Warranty</h3>
  <table class="ppm-table">
    <tr>
      <th>Cycle</th>
      <th>Planned</th>
      <th>Actual</th>
      <th>Status</th>
    </tr>
  `;

  list.forEach(p => {

    let cls = "";

    if(p.actual){
      cls = "green";
    }else{
      const d = new Date(p.planned);
      const today = new Date();
      today.setHours(0,0,0,0);

      if(d < today) cls = "red";
      else cls = "orange";
    }

    html += `
      <tr class="${cls}" data-asset-id="${asset.id}" data-cycle="${p.cycle}">
        <td>${p.cycle}</td>
        <td>${formatDate(p.planned)}</td>
        <td>${p.actual ? formatDate(p.actual) : "-"}</td>
        <td>${p.actual ? "Done" : "Pending"}</td>
      </tr>
    `;
  });

  html += `</table>`;

  html += `<h3 style="margin-top:20px;">Post Warranty</h3>
  <div style="padding:10px; background:#f5f5f5; border-radius:8px;">
    Coming Soon
  </div>`;

  html += `</div>`;

  return html;
}

  // ======================
  // GET ELEMENT
  // ======================
  const el = e.target.closest("[data-asset-id]");

  // ======================
  // CLICK PPM ROW (PRIORITY)
  // ======================
  const row = e.target.closest("tr[data-cycle]");
  if(row){
    const assetId = row.dataset.assetId;
    const cycle = row.dataset.cycle;

    showPPMDetail(assetId, cycle);
    return;
  }

  // ======================
  // OPEN DETAIL (ASSET)
  // ======================
  if(el && !el.closest(".ppm-table")){
    openAssetDetailById(el.dataset.assetId);
    return;
  }

  // ======================
  // CLOSE MODAL
  // ======================
  if(e.target.closest(".close-btn")){
    const modal = e.target.closest(".modal");
    if(modal) modal.style.display = "none";
  }

  // ======================
  // TAB SWITCH
  // ======================
  if(e.target.classList.contains("tab-btn")){
    document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c=>c.classList.remove("active"));

    e.target.classList.add("active");

    const tab = e.target.dataset.tab;
    document.getElementById("tab-"+tab).classList.add("active");

    if(tab === "ppm" && currentAsset){
      document.getElementById("tab-ppm").innerHTML = renderPPM(currentAsset);
    }
  }

});

  // CLICK PPM CARD
  if(e.target.closest(".ppm-card")){
    const card = e.target.closest(".ppm-card");
    showPPMDetail(card.dataset.assetId, card.dataset.ppmIndex);
  }

});

// ======================
// PPM DETAIL
// ======================
function showPPMDetail(assetId, cycle){

  const asset = assetCache.find(a => a.id == assetId);
  if(!asset) return;

  const key = "done_" + getOrdinal(cycle);

  const newDate = prompt(`Update Actual Date (PPM ${cycle})\nFormat: YYYY-MM-DD`);

  if(!newDate) return;

  // 🔥 update data
  asset[key] = newDate;

  // 🔥 re-render table
  document.getElementById("tab-ppm").innerHTML = renderPPM(asset);
}


function getOrdinal(n){
  const s = ["th","st","nd","rd"];
  const v = n % 100;
  return n + (s[(v-20)%10] || s[v] || s[0]);
}

function closePPMModal(){
  document.getElementById("ppmModal").style.display = "none";
}

async function savePPM(){

  const { assetId, cycle } = selectedPPM;
  const date = document.getElementById("ppmActualDate").value;

  if(!date){
    alert("Please select date");
    return;
  }

  // ❌ block future date
  if(new Date(date) > new Date()){
    alert("Tak boleh isi future date");
    return;
  }

  const asset = assetCache.find(a => a.id == assetId);
  if(!asset) return;

  const key = "done_" + getOrdinal(cycle);

  // ======================
  // 🔥 UPDATE FRONTEND
  // ======================
  asset[key] = date;

  document.getElementById("tab-ppm").innerHTML = renderPPM(asset);

  closePPMModal();

  // ======================
  // 🔥 SAVE TO BACKEND
  // ======================
  await updatePPMToServer(assetId, cycle, date);

}
