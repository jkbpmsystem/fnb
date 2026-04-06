let assetCache = [];
let currentAsset = null;

// ======================
// CACHE
// ======================
async function getAssetCached(){
  if(assetCache.length===0){
    assetCache = await getAssets();
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
  const module = asset.module || "FEMS";

  let detailHTML = "";

  if(module === "BEMS"){
    detailHTML = renderBEMSDetail(asset);
  }else{
    detailHTML = renderFEMSDetail(asset);
  }

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

  const ppmList = [];

  Object.keys(asset).forEach(key => {

    if(key.includes("_PPM") && !key.includes("Done")){

      const date = asset[key];
      if(!date) return;

      const statusKey = "Done_" + key;
      const status = asset[statusKey] || "";

      ppmList.push({
        label: key.replace("_PPM",""),
        date: date,
        status: status
      });

    }

  });

  ppmList.sort((a,b)=> new Date(a.date) - new Date(b.date));

  if(ppmList.length === 0){
    return "<div>No PPM Data</div>";
  }

  let html = "<div class='ppm-grid'>";

  ppmList.forEach((p,i) => {

    let cls = "";

    if(p.status){
      cls = "green";
    } else {
      const d = new Date(p.date);
      const today = new Date();
      today.setHours(0,0,0,0);

      if(d < today) cls = "red";
      else cls = "orange";
    }

    html += `
      <div class="ppm-card ${cls}" data-asset-id="${asset.id}" data-ppm-index="${i+1}">
        <b>${p.label}</b>
        <div>${formatDate(p.date)}</div>
        <small>${p.status || "Pending"}</small>
      </div>
    `;
  });

  html += "</div>";

  return html;
}

// ======================
// EVENT HANDLER (FIXED)
// ======================
document.addEventListener("click", async function(e){

  // OPEN DETAIL
  const el = e.target.closest("[data-asset-id]");
  if(el && !el.classList.contains("ppm-card")){
    openAssetDetailById(el.dataset.assetId);
    return;
  }

  // CLOSE MODAL
  if(e.target.closest(".close-btn")){
    const modal = e.target.closest(".modal");
    if(modal) modal.style.display = "none";
  }

  // TAB SWITCH
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

  // CLICK PPM CARD
  if(e.target.closest(".ppm-card")){
    const card = e.target.closest(".ppm-card");
    showPPMDetail(card.dataset.assetId, card.dataset.ppmIndex);
  }

});

// ======================
// PPM DETAIL
// ======================
function showPPMDetail(assetId, index){
  alert("PPM Detail\nAsset: " + assetId + "\nPPM #" + index);
}
