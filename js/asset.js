
let assetData = [];
let filteredData = [];
let currentPage = 1;
const rowsPerPage = 12;

document.addEventListener("DOMContentLoaded", initAsset);

async function initAsset(){
  const input = document.getElementById("searchBox");
  if(input){
    input.addEventListener("keyup", searchTable);
  }
  await loadAssets();
}

async function loadAssets(){
  assetData = await getAssets();
  filteredData = assetData;
  renderTable();
  renderPagination();
}

function renderTable(){
  const tbody = document.querySelector("#assetTable tbody");
  if(!tbody) return;
  tbody.innerHTML = "";

  const start = (currentPage-1)*rowsPerPage;
  const page = filteredData.slice(start, start+rowsPerPage);

  page.forEach((a,i)=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><span class="clickable-id" data-asset-id="${a.id}">${a.id||""}</span></td>
      <td>${a.assetNo||""}</td>
      <td>${a.equipmentName||""}</td>
      <td>${a.typeCode||""}</td>
      <td>${a.discipline||""}</td>
      <td>${a.codeLocation||""}</td>
      <td>${formatDate(a.startDate)||""}</td>
      <td>${formatDate(a.endDate)||""}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderPagination(){
  const box = document.getElementById("pagination");
  if(!box) return;
  box.innerHTML = "";
  const total = Math.ceil(filteredData.length/rowsPerPage);
  for(let i=1;i<=total;i++){
    const b = document.createElement("button");
    b.className = "btn";
    b.innerText = i;
    if(i===currentPage){ b.style.background="#00e5ff"; b.style.color="#000"; }
    b.onclick = ()=>{ currentPage=i; renderTable(); renderPagination(); };
    box.appendChild(b);
  }
}

function searchTable(){
  const k = document.getElementById("searchBox").value.toLowerCase();
  filteredData = assetData.filter(a => JSON.stringify(a).toLowerCase().includes(k));
  currentPage = 1;
  renderTable();
  renderPagination();
}

// location autofill
function autoFillLocation(code){
  const area = document.getElementById("area");
  const dept = document.getElementById("department");
  if(!area || !dept) return;
  if(locationMaster[code]){
    area.value = locationMaster[code];
    dept.value = code.split("-")[1] || "";
  }else{
    area.value = "";
    dept.value = "";
  }
}

// simple add modal (reuse global modal body)
async function openAddAsset(){
  const body = document.getElementById("detailBody");
  document.getElementById("detailTitle").innerText = "Add Asset";
  document.getElementById("globalDetailModal").style.display = "flex";
  const idRes = await generateId();
  body.innerHTML = `
    <div class="form-grid">
      <input id="assetId" value="${idRes.id}" readonly>
      <input id="assetNo" placeholder="Asset No">
      <input id="equipmentName" placeholder="Equipment Name">
      <input id="typeCode" placeholder="Type Code">
      <input id="discipline" placeholder="Discipline">
      <input id="codeLocation" placeholder="Code Location" oninput="this.value=this.value.toUpperCase(); autoFillLocation(this.value)">
      <input id="area" placeholder="Area" readonly>
      <input id="department" placeholder="Department" readonly>
      <input id="startDate" type="date">
      <input id="endDate" type="date">
      <input id="ppmFrequency" placeholder="PPM Frequency">
      <input id="status" placeholder="Status">
    </div>
    <button class="btn btn-primary" id="saveAssetBtn">Save</button>
  `;
  document.getElementById("saveAssetBtn").onclick = saveAsset;
}

async function saveAsset(){
  const data = {
    action:"saveAsset",
    id:assetId.value,
    assetNo:assetNo.value,
    equipmentName:equipmentName.value,
    typeCode:typeCode.value,
    discipline:discipline.value,
    codeLocation:codeLocation.value,
    area:area.value,
    department:department.value,
    startDate:startDate.value,
    endDate:endDate.value,
    ppmFrequency:ppmFrequency.value,
    status:status.value
  };
  const res = await saveAssetAPI(data);
  if(res.status==="success"){
    alert("Saved");
    document.getElementById("globalDetailModal").style.display = "none";
    assetCache = []; // reset cache
    loadAssets();
  }else{
    alert("Save failed");
  }
}
