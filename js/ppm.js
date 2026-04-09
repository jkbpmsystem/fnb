let dwData = [];
let assetMap = {};
let duringEvents = {};
let postEvents = {};
let events = {};
let currentMode = "during";

// 🔥 MODULE CONFIG
const MODULES = {
  fems: {
    asset: "FEMS_ASSET",
    dw: "FEMS_DW"
  },
  bems: {
    asset: "BEMS_ASSET",
    dw: "BEMS_DW"
  }
};

// 🔥 CURRENT MODULE (AUTO / SESSION)
let currentModule = sessionStorage.getItem("cmmsModule") || "fems";

document.addEventListener("DOMContentLoaded", initPPM);

// ==========================
// INIT
// ==========================
async function initPPM(){
  await loadEvents();
  showDuring();
}

// ==========================
// GET DATA (REUSABLE)
// ==========================
async function getAssetsByModule(){
  const sheet = MODULES[currentModule].asset;
  return await getSheetData(sheet);
}

async function getDWByModule(){
  const sheet = MODULES[currentModule].dw;
  return await getSheetData(sheet);
}

// ==========================
// LOAD DATA
// ==========================
async function loadEvents(){

  const assets = await getAssetsByModule();
  assetMap = {};
  assets.forEach(a => assetMap[a.id] = a);

  dwData = await getDWByModule();

  duringEvents = {};
  postEvents = {};

dwData.forEach(row => {

  const asset = assetMap[row.id] || {};

  Object.keys(row).forEach(key => {

    const value = row[key];

    if(!isValidDate(value)) return;

    const date = formatToISO(value);

    const target = isDuringWarranty(asset) ? duringEvents : postEvents;

    if(!target[date]) target[date] = [];

    const freq = detectCycleFromHeader(key);

    target[date].push({
      id: row.id,
      equipment: asset.equipmentName || asset.assetDescription || "-",
      location: asset.codeLocation || "-",
      vendor: asset.vendor || asset.supplier || "-",
      freq: freq,
      date: date
    });

  });

});
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

  return header; // fallback
}

  function isValidDate(val){
  if(!val) return false;

  const d = new Date(val);
  return !isNaN(d);
}
// ==========================
// WARRANTY CHECK
// ==========================
function isDuringWarranty(asset){
  if(!asset.startDate || !asset.warrantyPeriod) return false;

  const start = new Date(asset.startDate);
  const end = new Date(start);

  end.setMonth(end.getMonth() + parseInt(asset.warrantyPeriod));

  return new Date() <= end;
}

// ==========================
// SWITCH MODE
// ==========================
function showDuring(){
  currentMode = "during";
  events = duringEvents;
  renderWarrantyView();
}

function showPost(){
  currentMode = "post";
  events = postEvents;
  renderWarrantyView();
}

  function formatToISO(val){
  const d = new Date(val);
  return d.toISOString().split("T")[0];
}
  
// ==========================
// SWITCH MODULE (🔥 IMPORTANT)
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
    const d = new Date(date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;

    if(!months[key]) months[key] = [];
    months[key].push(...events[date]);
  });

  const sortedKeys = Object.keys(months).sort((a,b)=>{
    return new Date(a) - new Date(b);
  });

  sortedKeys.forEach(key => {
    const [year,month] = key.split("-");
    const monthName = new Date(year,month).toLocaleString("default",{month:"long"});

    container.innerHTML += `
      <div class="month-card" onclick="openMonthDetail('${key}')">
        <h3>${monthName}</h3>
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
        const due = new Date(ev.date);

        const diff = Math.ceil((due - today) / (1000*60*60*24));

        let statusClass = "";
        if(diff <= 30 && diff >= 0) statusClass = "warning";
        if(diff < 0) statusClass = "danger";

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

  if(typeof showAssetModal === "function"){
    showAssetModal(id);
  }
}
