
let assetCache = [];
let currentAsset = null;
let dwCache = [];

async function getAssetCached(){
  if(assetCache.length===0){
    assetCache = await getAssets();
  }
  return assetCache;
}
async function getDWCached(){
  if(dwCache.length===0){
    dwCache = await getDWList();
  }
  return dwCache;
}

async function openAssetDetailById(assetId){
  const assets = await getAssetCached();
  const asset = assets.find(a => a.id == assetId);
  if(!asset){ alert("Asset not found"); return; }
  currentAsset = asset;
  document.getElementById("detailBody").innerHTML = renderDetailWithTab(asset);
  document.getElementById("globalDetailModal").style.display = "flex";
}

function closeGlobalModal(){
  document.getElementById("globalDetailModal").style.display = "none";
}

function renderDetailWithTab(asset){
  return `
  <div class="tab-header">
    <button class="tab-btn active" data-tab="detail">Detail</button>
    <button class="tab-btn" data-tab="ppm">PPM</button>
  </div>

  <div id="tab-detail" class="tab-content active">
    ${renderDetail(asset)}
  </div>

  <div id="tab-ppm" class="tab-content">
    <div>Loading...</div>
  </div>
  `;
}

function renderDetail(a){
  return `
<div class="asset-grid">
    <div class="asset-card">
      <h4>Basic</h4>
      <b>ID</b><div>${a.id||""}</div>
      <b>Asset No</b><div>${a.assetNo||""}</div>
      <b>Asset No Hosza</b><div>${a.assetNoHosza||""}</div>
      <b>Equipment Name</b><div>${a.equipmentName||""}</div>
      <b>Equipment Description</b><div>${a.equipmentDescriptions||""}</div>
      <b>Category</b><div>${a.category ||""}</div>
    </div>
    
    <div class="asset-card">
      <h4>Location</h4>
      <b>Code</b><div>${a.codeLocation||""}</div>
      <b>Area</b><div>${a.area||""}</div>
      <b>Department</b><div>${a.department||""}</div>
    </div>
    
    <div class="asset-card">
      <h4>Technical</h4>
      <b>Type Code</b><div>${a.typeCode||""}</div>
      <b>Discipline</b><div>${a.discipline||""}</div>
      <b>Manufacturer</b><div>${a.manufacture||""}</div>
      <b>Model</b><div>${a.model||""}</div>
      <b>Serial No</b><div>${a.serialNumber||""}</div>
    </div>
     
    <div class="asset-card">
      <h4>Supplier</h4>
      <b>Bumi</b><div>${a.bumi||""}</div>
      <b>Bumi Contact</b><div>${a.bumiContact||""}</div>
      <b>Supplier</b><div>${a.supplier||""}</div>
      <b>Supplier Contact</b><div>${a.supplierContact||""}</div>
    </div>
      
    <div class="asset-card">
      <h4>Financial</h4>
      <b>Price</b><div>${a.price||""}</div>
      <b>LPO No</b><div>${a.lpoNo||""}</div>
     </div>
      
    <div class="asset-card">
      <h4>Warranty</h4>
      <b>End</b><div>${formatDate(a.endDate)||""}</div>
      <b>Freq/Year</b><div>${a.ppmFrequency||""}</div>
      <b>Status</b><div>${a.status||""}</div>
    </div>
  </div>
  `;
}

window.formatDate = function(dateStr){
  if(!dateStr) return "-";
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2,"0");
  const month = String(d.getMonth()+1).padStart(2,"0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function renderPPM(asset, dwData){
  if(!asset.startDate || !asset.ppmFrequency){
    return "<div>No PPM Data</div>";
  }
  const start = new Date(asset.startDate);
  const freq = Number(asset.ppmFrequency);
  if(!freq || freq<=0) return "<div>No PPM Data</div>";

  const interval = 12 / freq;
  let html = "<div class='ppm-grid'>";
  for(let i=1; i<=freq; i++){
    const next = new Date(start);
    next.setMonth(start.getMonth() + (interval * (i-1)));

    // match DW by id + same month/year (best-effort without ppmIndex)
    let cls = "";
    const match = (dwData||[]).find(d => {
      if(d.id != asset.id) return false;
      if(!d.date) return false;
      const dd = new Date(d.date);
      return dd.getFullYear() === next.getFullYear() && dd.getMonth() === next.getMonth();
    });
    if(match?.status === "Completed") cls = "green";
    else if(match?.status === "Breakdown") cls = "red";
    else if(match?.status === "Inspection") cls = "orange";

    html += `
      <div class="ppm-card ${cls}" data-asset-id="${asset.id}" data-ppm-index="${i}">
        <b>PPM ${i}</b>
        <div>${formatDate(next)}</div>
      </div>
    `;
  }
  html += "</div>";
  return html;
}

document.addEventListener("click", async function(e){

  // ✅ ADD ASSET (letak paling atas supaya priority)
  if(e.target.closest("#addAssetBtn")){
    e.stopPropagation();
    openAddAsset(); // guna function sebenar kau
    return;
  }

  // ✅ OPEN DETAIL (table click)
const el = e.target.closest("[data-asset-id]");
if(el && !el.classList.contains("ppm-card")){
  openAssetDetailById(el.dataset.assetId);
  return;
}

  // ✅ OPEN DETAIL (generic)
  const idEl = e.target.closest("[data-asset-id]");
  if(idEl && !idEl.classList.contains("ppm-card")){
    const id = idEl.dataset.assetId;
    if(id) openAssetDetailById(id);
    return;
  }

  // ✅ CLOSE MODAL
  if(e.target.closest(".close-btn")){
    const modal = e.target.closest(".modal");
    if(modal) modal.style.display = "none";
  }

  // ✅ TAB
  if(e.target.classList.contains("tab-btn")){
    document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c=>c.classList.remove("active"));

    e.target.classList.add("active");

    const tab = e.target.dataset.tab;
    document.getElementById("tab-"+tab).classList.add("active");

    if(tab === "ppm" && currentAsset){
      const dw = await getDWCached();
      document.getElementById("tab-ppm").innerHTML = renderPPM(currentAsset, dw);
    }
  }

  // ✅ PPM CLICK
  if(e.target.closest(".ppm-card")){
    const card = e.target.closest(".ppm-card");
    showPPMDetail(card.dataset.assetId, card.dataset.ppmIndex);
  }

});
  

  // close modal
  if(e.target.closest(".close-btn")){
    const modal = e.target.closest(".modal");
    if(modal) modal.style.display = "none";
  }

  // tabs
  if(e.target.classList.contains("tab-btn")){
    document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c=>c.classList.remove("active"));
    e.target.classList.add("active");
    const tab = e.target.dataset.tab;
    document.getElementById("tab-"+tab).classList.add("active");

    if(tab === "ppm" && currentAsset){
      const dw = await getDWCached();
      document.getElementById("tab-ppm").innerHTML = renderPPM(currentAsset, dw);
    }
  }

  // click PPM card (hook for future detail)
  if(e.target.closest(".ppm-card")){
    const card = e.target.closest(".ppm-card");
    const idx = card.dataset.ppmIndex;
    showPPMDetail(card.dataset.assetId, idx);
  }
});


function showPPMDetail(assetId, index){
  alert("PPM Detail\nAsset: " + assetId + "\nPPM #" + index);
}

