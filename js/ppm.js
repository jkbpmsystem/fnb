let dwData = [];
let assetMap = {};
let duringEvents = {};
let postEvents = {};
let events = {};
let currentMode = "during";
 
// MODULE CONFIG
const MODULES = {
  fems: { asset: "FEMS_ASSET", dw: "FEMS_DW" },
  bems: { asset: "BEMS_ASSET", dw: "BEMS_DW" }
};
 
// CURRENT MODULE (AUTO / SESSION)
let currentModule = (sessionStorage.getItem("cmmsModule") || "FEMS").toUpperCase().trim();
 
document.addEventListener("DOMContentLoaded", initPPM);
 
// ==========================
// INIT
// ==========================
async function initPPM(){
  await loadEvents();
  showDuring();
  setActiveButton("during");
}
 
// ==========================
// GET DATA (REUSABLE)
// ==========================
async function getAssetsByModule(){
  return await getAssets(); // dari api.js
}

function formatToISO(val){
  const d = new Date(val);
  return d.toISOString().split("T")[0];
}

function isValidDate(val){
  if(!val) return false;
  const d = new Date(val);
  return !isNaN(d);
}

// ==========================
// WARRANTY STATUS (3-state)
// ==========================
function getWarrantyStatus(asset){
  let start    = asset.startDate     || asset.warrantyStart;
  let duration = asset.warrantyPeriod || asset.warrantyDuration;
  if(!start || !duration) return "post";
  const s = new Date(start);
  if(isNaN(s)) return "post";
  const end = new Date(s);
  end.setMonth(end.getMonth() + parseInt(duration));
  return new Date() <= end ? "during" : "post";
}

// ==========================
// BUILD EVENT OBJECT (DRY)
// ==========================
function buildEvent(asset, freq, iso){
  return {
    id:        asset.id,
    equipment: asset.equipmentName || asset.assetDescription || "-",
    location:  asset.codeLocation  || asset.location          || "-",
    vendor:    asset.vendor         || asset.supplier          || "-",
    freq:      freq,
    date:      iso
  };
}

// ==========================
// LOAD DATA
// ==========================
async function loadEvents(){
  const assets = await getAssetsByModule();

  duringEvents = {};
  postEvents   = {};

  let countDuring = 0, countPost = 0, countSkipped = 0;

  assets.forEach(asset => {
    const warrantyStatus = getWarrantyStatus(asset); // "during" | "post" | "unknown"

    for(let i = 1; i <= 21; i++){
      const key  = getOrdinal(i);
      const date = asset[key];

      if(!isValidDate(date)){ countSkipped++; continue; }

      const iso = formatToISO(date);

      if(warrantyStatus === "during"){
        if(!duringEvents[iso]) duringEvents[iso] = [];
        duringEvents[iso].push(buildEvent(asset, key, iso));
        countDuring++;
      } else {
        // "post" atau "unknown" (no warranty data) → masuk postEvents
        if(!postEvents[iso]) postEvents[iso] = [];
        postEvents[iso].push(buildEvent(asset, key, iso));
        countPost++;
      }
    }
  });

  console.log(`[PPM] Loaded → During: ${countDuring}, Post: ${countPost}, Skipped: ${countSkipped}`);
}
 
// ==========================
// DETECT CYCLE
// ==========================
function detectCycleFromHeader(header){
  if(!header) return "-";
  const h = header.toLowerCase();
  if(h.includes("1")) return "1st Cycle";
  if(h.includes("2")) return "2nd Cycle";
  if(h.includes("3")) return "3rd Cycle";
  if(h.includes("4")) return "4th Cycle";
  return header;
}
 
function isValidDate(val){
  if(!val) return false;
  const d = new Date(val);
  return !isNaN(d);
}
 
 
// ==========================
// SWITCH MODULE
// ==========================
async function switchModule(module){
  currentModule = module;
  sessionStorage.setItem("cmmsModule", module);
  await loadEvents();
  showDuring();
}
 
// ==========================
// RENDER MONTH CARDS
// ==========================
function renderWarrantyView(){
  const container = document.getElementById("calendarGrid");
  if(!container) return;
 
  container.innerHTML = "";
 
  const months = {};
 
  Object.keys(events).forEach(date => {
    const d   = new Date(date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if(!months[key]) months[key] = [];
    months[key].push(...events[date]);
  });
 
  const sortedKeys = Object.keys(months).sort((a,b) => new Date(a) - new Date(b));
 
  sortedKeys.forEach(key => {
    const [year, month] = key.split("-");
    const monthName     = new Date(year, month).toLocaleString("default", { month: "long" });
    const label         = `${monthName} ${year}`;
 
    container.innerHTML += `
      <div class="month-card" onclick="openMonthDetail('${key}')">
        <h3>${label}</h3>
        <p>Total: ${months[key].length}</p>
      </div>
    `;
  });
}
 
// ==========================
// OPEN MODAL TABLE
// ==========================
function openMonthDetail(key){
  const modal = document.getElementById("monthModal");
  const tbody = document.querySelector("#monthTable tbody");
 
  if(!modal || !tbody) return;
 
  tbody.innerHTML = "";
 
  Object.keys(events).forEach(date => {
    const d = new Date(date);
    const k = `${d.getFullYear()}-${d.getMonth()}`;
 
    if(k === key){
      events[date].forEach(ev => {
        const today = new Date();
        const due   = new Date(ev.date);
        const diff  = Math.ceil((due - today) / (1000*60*60*24));
 
        let statusClass = "";
        if(diff <= 30 && diff >= 0) statusClass = "warning";
        if(diff < 0)                statusClass = "danger";
 
        tbody.innerHTML += `
          <tr>
            <td class="clickable" onclick="openAssetDetail('${ev.id}')">${ev.id}</td>
            <td>${ev.equipment}</td>
            <td>${ev.location}</td>
            <td>${ev.vendor}</td>
            <td>${ev.freq}</td>
            <td>${formatDate(ev.date)}</td>
            <td class="${statusClass}">${diff}</td>
          </tr>
        `;
      });
    }
  });
 
  modal.style.display = "flex";
}
 
// ==========================
// CLOSE MODAL
// ==========================
function closeMonthModal(){
  const modal = document.getElementById("monthModal");
  if(modal) modal.style.display = "none";
}
 
// ==========================
// FORMAT DATE
// ==========================
function formatDate(dateStr){
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB");
}
 
// ==========================
// CLICK ASSET
// ==========================
function openAssetDetail(id){
  console.log("OPEN ASSET:", id);
  if(typeof openAssetDetailById === "function"){
    openAssetDetailById(id);
  } else {
    console.error("openAssetDetailById not found");
  }
}
 
// ==========================
// SHOW DURING WARRANTY
// ✅ Tambah ganttSwitchTab
// ==========================
function showDuring(){
  currentMode = "during";
  events      = duringEvents;
  renderWarrantyView();
  setActiveButton("during");
 
  // update gantt chart ikut tab
  if(typeof ganttSwitchTab === "function"){
    ganttSwitchTab("during");
  }
}
 
// ==========================
// SHOW POST WARRANTY
// ✅ Tambah ganttSwitchTab
// ==========================
function showPost(){
  currentMode = "post";
  events      = postEvents;
  renderWarrantyView();
  setActiveButton("post");
 
  // update gantt chart ikut tab
  if(typeof ganttSwitchTab === "function"){
    ganttSwitchTab("post");
  }
}
 
// ==========================
// SET ACTIVE BUTTON
// ==========================
function setActiveButton(type){
  document.getElementById("btnDuring")?.classList.remove("active");
  document.getElementById("btnPost")?.classList.remove("active");
 
  if(type === "during"){
    document.getElementById("btnDuring")?.classList.add("active");
  } else {
    document.getElementById("btnPost")?.classList.add("active");
  }
}



