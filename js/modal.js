
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
<div class="asset-grid"> <!-- BASIC -->
    <div class="asset-card">
        <h4>Basic Info</h4> <b>ID</b>
        <div>${asset.id}</div> <b>Asset No</b>
        <div>${asset.assetNo || "-"}</div> <b>Asset No Hosza</b>
        <div>${asset.assetNoHosza || "-"}</div> <b>Equipment</b>
        <div>${asset.equipmentName || "-"}</div> <b>Description</b>
        <div>${asset.equipmentDescriptions || "-"}</div> <b>Category</b>
        <div>${asset.category || "-"}</div>
    </div> <!-- LOCATION -->
    <div class="asset-card">
        <h4>Location</h4> <b>Code Location</b>
        <div>${asset.codeLocation || "-"}</div> <b>Area</b>
        <div>${asset.area || "-"}</div> <b>Department</b>
        <div>${asset.department || "-"}</div>
    </div> <!-- TECHNICAL -->
    <div class="asset-card">
        <h4>Technical</h4> <b>Type Code</b>
        <div>${asset.typeCode || "-"}</div> <b>Discipline</b>
        <div>${asset.discipline || "-"}</div> <b>Manufacturer</b>
        <div>${asset.manufacture || "-"}</div> <b>Model</b>
        <div>${asset.model || "-"}</div> <b>Serial No</b>
        <div>${asset.serialNumber || "-"}</div>
    </div> <!-- SUPPLIER -->
    <div class="asset-card">
        <h4>Supplier</h4> <b>Bumi</b>
        <div>${asset.bumi || "-"}</div> <b>Bumi Contact</b>
        <div>${asset.bumiContact || "-"}</div> <b>Supplier</b>
        <div>${asset.supplier || "-"}</div> <b>Supplier Contact</b>
        <div>${asset.supplierContact || "-"}</div>
    </div> <!-- FINANCIAL -->
    <div class="asset-card">
        <h4>Financial</h4> <b>Price</b>
        <div>${asset.price || "-"}</div> <b>LPO No</b>
        <div>${asset.lpoNo || "-"}</div>
    </div> <!-- WARRANTY -->
    <div class="asset-card">
        <h4>Warranty</h4> <b>Start Date</b>
        <div>${formatDate(asset.startDate)}</div> <b>End Date</b>
        <div>${formatDate(asset.endDate)}</div> <b>Status</b>
        <div><span class="badge ${statusClass}">${statusText}</span></div> <b>Days Left</b>
        <div>${daysLeft} days</div>
    </div>
</div>
  `;
}

function formatDate(dateStr){
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

// Event delegation
document.addEventListener("click", async (e)=>{
  // open detail from any element with data-asset-id
  const idEl = e.target.closest("[data-asset-id]");
  if(idEl && !idEl.classList.contains("ppm-card")){
    const id = idEl.dataset.assetId;
    if(id) openAssetDetailById(id);
  }

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

