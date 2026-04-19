let assetCache = [];
let currentAsset = null;
let selectedPPM = {
  assetId: null,
  cycle: null
};
let isUserClick = false;

// ======================
// CACHE
// ======================
async function getAssetCached(){

  if(assetCache.length === 0){

    const res = await getAssets();

    assetCache = res.map(row => ({
      ...row   // 🔥 INI SAHAJA
    }));

  }

  return assetCache;
}

// ======================
// OPEN DETAIL
// ======================
async function openAssetDetailById(assetId){
  console.trace("📍 openAssetDetailById called:", assetId);
  console.trace("🔥 MODAL DIPANGGIL DARI SINI:", assetId);
  console.log("CALL SOURCE:", isUserClick, assetId);

 
  
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
  document.getElementById("tab-ppm").innerHTML = renderPPM(asset);
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
    <b>Description</b><div>${a.typeDescription}</div>
    <b>Task Code</b><div>${a.taskCode}</div>
    <b>Manufacturer</b><div>${a.manufacture}</div>
    <b>Model</b><div>${a.model}</div>
    <b>Serial No</b><div>${a.serialNumber}</div>
    <b>Discipline</b><div>${a.discipline}</div>
  </div>
   
  <div class="asset-card">
    <h4>Supplier</h4>
    <b>Bumi</b><div>${a.bumi}</div>
    <b>Bumi Contact</b><div>${a.bumiContact}</div>
    <b>Supplier</b><div>${a.supplier}</div>
    <b>Supplier Contact</b><div>${a.supplierContact}</div>
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
    <b>Status Kontrak</b><div>${a.status}</div>
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
    <b>Code</b><div>${a.locationCode}</div>
    <b>Area</b><div>${a.area}</div>
    <b>Department</b><div>${a.department}</div>
  </div>
  
  <div class="asset-card">
    <h4>Technical</h4>
    <b>Type Code</b><div>${a.typeCode}</div>
    <b>Type Description</b><div>${a.typeDescription}</div>
    <b>Task Code</b><div>${a.taskCode}</div>
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
    <b>Start Warranty</b><div>${formatDate(a.warrantyStart|| "")}</div>
    <b>End Warranty</b><div>${formatDate(a.warrantyEnd|| "")}</div>
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
// PPM RENDER — VIEW ONLY
// ======================
function renderPPM(asset){

  const list = [];

  for(let i=1; i<=21; i++){
    const suffix = getOrdinal(i);
    const planned = asset[suffix];
    if(!planned) continue;

    const actual = asset["done_" + suffix] || "";

    list.push({
      cycle: i,
      cycleLabel: suffix,
      planned,
      actual
    });
  }

  if(list.length === 0){
    return `<div style="padding:20px;color:#9ca3af;">No PPM Data</div>`;
  }

  // 🔥 dapat warranty end date
  const warrantyEnd = getWarrantyEnd(asset);

  let duringRows = "";
  let postRows = "";

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

    const badgeClass = p.actual ? "done" : (cls === "red" ? "overdue" : "pending");
    const badgeLabel = p.actual ? "Done" : (cls === "red" ? "Overdue" : "Pending");

    const row = `
      <tr class="${cls}">
        <td>${p.cycleLabel}</td>
        <td>${formatDate(p.planned)}</td>
        <td>${p.actual ? formatDate(p.actual) : "-"}</td>
        <td><span class="badge ${badgeClass}">${badgeLabel}</span></td>
      </tr>
    `;

    // 🔥 compare tarikh planned vs warranty end
    if(warrantyEnd && new Date(p.planned) <= warrantyEnd){
      duringRows += row;
    }else{
      postRows += row;
    }
  });

  const tableTemplate = (rows) => `
    <table class="ppm-table" style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead>
        <tr>
          <th style="padding:9px 12px;background:#f1f5f9;text-align:left;border-bottom:2px solid #e5e7eb;">Cycle</th>
          <th style="padding:9px 12px;background:#f1f5f9;text-align:left;border-bottom:2px solid #e5e7eb;">Planned Date</th>
          <th style="padding:9px 12px;background:#f1f5f9;text-align:left;border-bottom:2px solid #e5e7eb;">Actual Date</th>
          <th style="padding:9px 12px;background:#f1f5f9;text-align:left;border-bottom:2px solid #e5e7eb;">Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

const updateBtnDuring = `
    <div style="text-align:right; margin-top:8px; margin-bottom:16px;">
      <a href="update-ppm.html" style="
        display:inline-block;
        padding:8px 18px;
        background:#2563eb;
        color:#fff;
        border-radius:8px;
        text-decoration:none;
        font-size:13px;
        font-weight:600;
      ">✏️ Update PPM</a>
    </div>
  `;

const updateBtnPost = `
    <div style="text-align:right; margin-top:8px; margin-bottom:16px;">
      <a href="update-post.html" style="
        display:inline-block;
        padding:8px 18px;
        background:#2563eb;
        color:#fff;
        border-radius:8px;
        text-decoration:none;
        font-size:13px;
        font-weight:600;
      ">✏️ Update Post Warranty</a>
    </div>
  `;
  

  let html = `<div class="ppm-wrapper" style="padding:10px 0;">`;

  // 🔥 DURING WARRANTY
  html += `<h4 style="margin:0 0 10px;color:#1e293b;">🔵 During Warranty</h4>`;
  html += duringRows
    ? tableTemplate(duringRows)
    : `<div style="color:#9ca3af;padding:10px;">No data</div>`;
  html += updateBtnDuring;

  // 🔥 POST WARRANTY
  html += `<h4 style="margin:20px 0 10px;color:#1e293b;">🟠 Post Warranty</h4>`;
  html += postRows
    ? tableTemplate(postRows)
    : `<div style="color:#9ca3af;padding:10px;background:#f9fafb;border-radius:8px;">No post warranty PPM</div>`;
  html += updateBtnPost;

  html += `</div>`;
  return html;
}

// 🔥 helper — dapat warranty end date
function getWarrantyEnd(asset){

  // cara 1: ada endDate atau warrantyEnd terus
  const direct = asset.endDate || asset.warrantyEnd;
  if(direct){
    const d = new Date(direct);
    if(!isNaN(d)) return d;
  }

  // cara 2: startDate + duration (bulan)
  const start = asset.startDate || asset.warrantyStart;
  const duration = asset.warrantyPeriod || asset.warrantyDuration;
  if(start && duration){
    const s = new Date(start);
    s.setMonth(s.getMonth() + parseInt(duration));
    return s;
  }

  return null;
}
// 🔥 helper — dapat warranty end date
function getWarrantyEnd(asset){
  // cara 1: ada endDate/warrantyEnd terus
  const direct = asset.endDate || asset.warrantyEnd;
  if(direct){
    const d = new Date(direct);
    if(!isNaN(d)) return d;
  }

  // cara 2: startDate + warrantyPeriod/warrantyDuration (bulan)
  const start = asset.startDate || asset.warrantyStart;
  const duration = asset.warrantyPeriod || asset.warrantyDuration;
  if(start && duration){
    const s = new Date(start);
    s.setMonth(s.getMonth() + parseInt(duration));
    return s;
  }

  return null;
}

// ======================
// WARRANTY CHECK
// ======================
function isDuringWarranty(asset){
  let start = asset.startDate || asset.warrantyStart;
  let duration = asset.warrantyPeriod || asset.warrantyDuration;

  if(!start) return false;

  const s = new Date(start);

  // kalau ada duration, calculate end
  if(duration){
    const end = new Date(s);
    end.setMonth(end.getMonth() + parseInt(duration));
    return new Date() <= end;
  }

  // kalau ada endDate terus
  const end = new Date(asset.endDate || asset.warrantyEnd);
  if(!isNaN(end)) return new Date() <= end;

  return false;
}

// ======================
// CLICK HANDLER — FIX PATAH BALIK
// ======================
document.addEventListener("click", function(e){


  // ✅ PPM ROW — VIEW ONLY, STOP PROPAGATION
  const row = e.target.closest("tr[data-cycle]");
  if(row){
    // 🔥 buang — tak buat apa, view only
    return;
  }

  // ✅ CLOSE MODAL — only close globalDetailModal, jangan close ppmModal
  if(e.target.classList.contains("close-btn")){
    const modal = e.target.closest(".modal");
    if(modal) modal.style.display = "none";
    return;
  }

  // ✅ TAB SWITCH
  if(e.target.classList.contains("tab-btn")){
    // 🔥 cari tab container (parent) supaya tak affect modal lain
    const tabContainer = e.target.closest(".modal-content") || document;

    tabContainer.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    tabContainer.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

    e.target.classList.add("active");

    const tab = e.target.dataset.tab;
    const tabContent = tabContainer.querySelector("#tab-" + tab);
    if(tabContent) tabContent.classList.add("active");

    if(tab === "ppm" && currentAsset){
      const ppmTab = tabContainer.querySelector("#tab-ppm");
      if(ppmTab) ppmTab.innerHTML = renderPPM(currentAsset);
    }
    return;
  }

  // ✅ CLOSE MODAL bila click backdrop
  if(e.target.classList.contains("modal") && e.target.id === "globalDetailModal"){
    e.target.style.display = "none";
    return;
  }

});

function getOrdinal(n){
  const s = ["th","st","nd","rd"];
  const v = n % 100;
  return n + (s[(v-20)%10] || s[v] || s[0]);
}

