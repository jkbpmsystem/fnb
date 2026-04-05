// =====================
// STATE
// =====================
let searchTimeout;

let assetData = [];
let filteredData = [];
let currentPage = 1;
const rowsPerPage = 12;

window.assetCache = window.assetCache || [];

// =====================
// INIT
// =====================
document.addEventListener("DOMContentLoaded", initAsset);

async function initAsset(){

  const input = document.getElementById("searchBox");

  if(input){
    input.addEventListener("keyup", debounceSearch);
  }

  await loadAssets();
}
 
// =====================
// DEBOUNCE SEARCH
// =====================
function debounceSearch(){

  clearTimeout(searchTimeout);

  searchTimeout = setTimeout(()=>{
    searchTable();
  },300);

}


// =====================
// LOAD DATA (FIX VERSION)
// =====================
async function loadAssets(){

  const tbody = document.querySelector("#assetTable tbody");

  if(tbody){
    tbody.innerHTML = "<tr><td colspan='10'>Loading...</td></tr>";
  }

  try{

    const res = await getAssets();

    console.log("🔥 RAW DATA:", res);

    if(!Array.isArray(res)){
      console.error("Data bukan array:", res);
      return;
    }

    let html = "";

res.forEach(a => {

  html += `
    <tr>
      <td>${a.id}</td>
      <td>${a.equipmentName}</td>
      <td>${a.typeCode}</td>
      <td>${a.discipline}</td>
      <td>${a.manufacture}</td>
      <td>${a.model}</td>
      <td>${formatDate(a.startDate)}</td>
      <td>${formatDate(a.endDate)}</td>
    </tr>
  `;

});

    tbody.innerHTML = html;

  }catch(err){

    console.error("❌ ERROR:", err);

    if(tbody){
      tbody.innerHTML = "<tr><td colspan='10'>Error</td></tr>";
    }

  }

}

// =====================
// RENDER TABLE (ULTRA FAST)
// =====================
function normalize(a){
  return {
    id: a.id || "-",

    assetNo: a.assetno || a.assetnumber || "-",

    equipment: a.equipment || a.equipmentname || a.assetdescription || "-",

    type: a.type || a.typecode || "-",

    discipline: a.discipline || "-",

    location: a.location || a.codelocation || "-",

    start: a.start || a.startdate || a.purchasedate || "",

    end: a.end || a.enddate || a.warrantyenddate || ""
  };
}

function renderTable(){

  console.log("🔥 renderTable jalan");

  const tbody = document.querySelector("#assetTable tbody");
  if(!tbody) return;

  const start = (currentPage - 1) * rowsPerPage;
  const page = filteredData.slice(start, start + rowsPerPage);

  let html = "";

  page.forEach(a => {

    console.log("SAMPLE OBJECT:", a);

    const x = normalize(a);

    html += `
      <tr>
        <td>
          <span class="clickable-id" data-asset-id="${x.id}">
            ${x.id}
          </span>
        </td>
        <td>${x.assetNo}</td>
        <td>${x.equipment}</td>
        <td>${x.type}</td>
        <td>${x.discipline}</td>
        <td>${x.location}</td>
        <td>${formatDate(x.start)}</td>
        <td>${formatDate(x.end)}</td>
      </tr>
    `;

  });

  tbody.innerHTML = html;
}


// =====================
// PAGINATION
// =====================
function renderPagination(){

  const box = document.getElementById("pagination");
  if(!box) return;

  box.innerHTML = "";

  const total = Math.ceil(filteredData.length / rowsPerPage);
  if(total <= 1) return;

  const maxVisible = 5;

  let start = Math.max(1, currentPage - 2);
  let end = Math.min(total, start + maxVisible - 1);

  if(end - start < maxVisible - 1){
    start = Math.max(1, end - maxVisible + 1);
  }

  // ===== FIRST =====
  box.appendChild(createNavBtn("First", currentPage > 1, ()=> {
    currentPage = 1;
    updatePage();
  }));

  // ===== PREV =====
  box.appendChild(createNavBtn("Prev", currentPage > 1, ()=> {
    currentPage--;
    updatePage();
  }));

  // ===== PAGE RANGE =====
  if(start > 1){
    box.appendChild(createPageBtn(1));

    if(start > 2){
      box.appendChild(createDots());
    }
  }

  for(let i = start; i <= end; i++){
    box.appendChild(createPageBtn(i));
  }

  if(end < total){
    if(end < total - 1){
      box.appendChild(createDots());
    }
    box.appendChild(createPageBtn(total));
  }

  // ===== NEXT =====
  box.appendChild(createNavBtn("Next", currentPage < total, ()=> {
    currentPage++;
    updatePage();
  }));

  // ===== LAST =====
  box.appendChild(createNavBtn("Last", currentPage < total, ()=> {
    currentPage = total;
    updatePage();
  }));

  // ===== PAGE INFO =====
  const info = document.createElement("span");
  info.innerText = ` Page ${currentPage} of ${total} `;
  info.style.margin = "0 10px";
  box.appendChild(info);

  // ===== JUMP TO PAGE =====
  const input = document.createElement("input");
  input.type = "number";
  input.placeholder = "Go";
  input.style.width = "60px";
  input.style.padding = "4px";

  input.onchange = ()=>{
    let val = Number(input.value);
    if(val >= 1 && val <= total){
      currentPage = val;
      updatePage();
    }
  };

  box.appendChild(input);

}

function createPageBtn(i){

  const b = document.createElement("button");
  b.innerText = i;
  b.className = "btn";

  if(i === currentPage){
    b.style.background = "#00e5ff";
    b.style.color = "#000";
  }

  b.onclick = ()=>{
    currentPage = i;
    updatePage();
  };

  return b;
}

function createNavBtn(text, enabled, action){

  const btn = document.createElement("button");
  btn.innerText = text;
  btn.className = "btn";

  if(!enabled){
    btn.disabled = true;
    btn.style.opacity = "0.4";
  }

  btn.onclick = action;

  return btn;
}

function createDots(){
  const dots = document.createElement("span");
  dots.innerText = "...";
  dots.style.padding = "6px";
  return dots;
}

// =====================
// UPDATE PAGE
// =====================
function updatePage(){

  renderTable();
  renderPagination();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}

// =====================
// SEARCH
// =====================
function searchTable(){

  const k = document.getElementById("searchBox").value.toLowerCase();

  filteredData = assetData.filter(a =>
    JSON.stringify(a).toLowerCase().includes(k)
  );

  currentPage = 1;

  updatePage();
}

// =====================
// CLEAR CACHE (CALL LEPAS SAVE)
// =====================
function clearCache(){

  localStorage.removeItem("assets");
  localStorage.removeItem("assets_time");

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

  const modNow = (sessionStorage.getItem("cmmsModule") || "FEMS");

  if(modNow === "BEMS"){
    body.innerHTML = renderBEMSForm();
  }else{
    body.innerHTML = `

    <input type="hidden" id="module">
    <div class="form-grid">
      <div><label>Module</label><input id="moduleDisplay" readonly></div>
    
 <div class="form-group">
                            <label>ID</label>
                            <input id="assetId" value="${idRes.id}" readonly>
                        </div>

                        <div class="form-group">
                            <label>Code Location</label>
                            <input type="text"
                                id="codeLocation"
                                placeholder="L1-BEM-001"
                                oninput="this.value=this.value.toUpperCase(); autoFillLocation(this.value)"
                        </div>

                        <div class="form-group">
                            <label>Area</label>
                            <input type="text" id="area" readonly>
                        </div>

                        <div class="form-group">
                            <label>Department</label>
                            <input type="text" id="department" readonly>
                        </div>

                        <div class="form-group">
                            <label>Asset No</label>
                            <input id="assetNo" type="text" placeholder="Enter manufacturer"required>
                        </div>

                        <div class="form-group">
                            <label>Asset No Hosza</label>
                            <input id="assetNoHosza" type="text" placeholder="Enter model"required>
                        </div>

                        <div class="form-group">
                            <label>Equipment Name</label>
                            <input id="equipmentName" type="text" placeholder="Enter serial number"required>
                        </div>
                        <div class="form-group">
                            <label>Type Code</label>
                            <input id="typeCode"
                                   type="text"
                                    placeholder="Enter Type Code"
                                   oninput="autoFillEquipmentDesc()"
                                   required>
                        </div>

                        <div class="form-group">
                            <label>Equipment Descriptions</label>
                            <input type="text" id="equipmentDescriptions" readonly>
                        </div>

                      <div class="form-group">
                            <label>Discipline</label>

                            <select id="discipline" required>
                                    <option value="">Select Discipline</option>
                                    <option value="Mechanical">MECHANICAL</option>
                                    <option value="Electrical">ELECTRICAL</option>
                            </select>

                        </div>

                        <div class="form-group">
                            <label>Bumi</label>
                            <input id="bumi" type="text" placeholder="Enter Bumi"required>
                        </div>

                        <div class="form-group">
                            <label>Bumi Contact</label>
                            <input id="bumiContact" type="text" placeholder="Enter Bumi Contact"required>
                        </div>

                        <div class="form-group">
                            <label>Supplier</label>
                            <input id="supplier" type="text" placeholder="Enter Supplier"required>
                        </div>

                        <div class="form-group">
                            <label>Supplier Contact</label>
                            <input id="supplierContact" type="text" placeholder="Enter Supplier Contact"required>
                        </div>

                        <div class="form-group">
                            <label>Manufacture</label>
                            <input id="manufacture" type="text" placeholder="Enter Manufacture"required>
                        </div>

                        <div class="form-group">
                            <label>Model</label>
                            <input id="model" type="text" placeholder="Enter Model"required>
                        </div>

                        <div class="form-group">
                            <label>Serial Number</label>
                            <input id="serialNumber" type="text" placeholder="Enter Serial Number"required>
                        </div>

                        <div class="form-group">
                            <label>Price</label>
                            <input id="price" type="text" placeholder="Enter Price"required>
                        </div>

                        <div class="form-group">
                            <label>LPO No</label>
                            <input id="lpoNo"type="text" placeholder="Enter LPO No"required>
                        </div>

                        <div class="form-group">
                            <label>Category</label>
                            <input id="category" type="text" placeholder="ASSET or INVENTORY"required>
                        </div>

                        <div class="form-group">
                            <label>Start Date</label>
                            <input id="startDate" type="date"required>
                        </div>

                        <div class="form-group">
                            <label>End Date</label>
                            <input id="endDate" type="date"required>
                        </div>

                       <div class="form-group">
                            <label>Frequency PPM by Vendor *base on T&C*</label>
                            <input id="ppmFrequency" type="text" placeholder="Enter Frequency"required>
                        </div>

                       <div class="form-group">
                            <label>Asset dalam kontrak Edgenta?</label>

                            <select id="status" required>
                                    <option value="">Select</option>
                                    <option value="NO">NO</option>
                                    <option value="YES">YES</option>
                            </select>

                        </div>

                    </div>
    <button class="btn btn-primary" id="saveAssetBtn">Save</button>
  `;
  }
  
const codeInput = document.getElementById("codeLocation");
  if(codeInput){
    codeInput.addEventListener("input", e=>{
      autoFillLocation(e.target.value);
    });
  }

  // set module
  const modVal = (sessionStorage.getItem("cmmsModule") || "FEMS");
  document.getElementById("module").value = modVal;

  const md = document.getElementById("moduleDisplay");
  if(md) md.value = modVal;

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
    status:status.value,
    module: (document.getElementById("module") ? document.getElementById("module").value : (sessionStorage.getItem("cmmsModule")||"FEMS"))
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


function renderBEMSForm(){
return `
<div class="form-grid">

<input id="id" placeholder="ID" readonly>
<input id="assetNumber" placeholder="Asset Number">
<input id="assetNumberKonsesi" placeholder="Asset Number Konsesi">

<input id="typeCode" placeholder="Type Code">
<input id="typeDescription" placeholder="Type Description">

<input id="assetDescription" placeholder="Asset Description">

<input id="service" placeholder="Service">
<input id="department" placeholder="Department">
<input id="area" placeholder="Area">

<input id="locationCode" placeholder="Location Code">
<input id="location" placeholder="Location">

<input id="ppmFrequency" placeholder="PPM Frequency">

<input type="date" id="purchaseDate">
<input type="date" id="commissioningDate">

<input type="date" id="warrantyStart">
<input type="date" id="warrantyEnd">
<input id="warrantyDuration" placeholder="Warranty Duration">

<input id="manufacturer" placeholder="Manufacturer">
<input id="brand" placeholder="Brand">
<input id="model" placeholder="Model">
<input id="serialNo" placeholder="Serial No">

<input id="loNo" placeholder="LO No">
<input id="loPrice" placeholder="LO Price">
<input id="pricePerUnit" placeholder="Price Per Unit">

<input id="bumiAgent" placeholder="Bumi Agent">
<input id="vendor" placeholder="Vendor">

<input id="remarks" placeholder="Remarks">

<input id="contract" placeholder="Contract Info">

<select id="maintenanceType">
<option value="">Maintenance Type</option>
<option>PPM</option>
<option>RI</option>
<option>CALIBRATION</option>
</select>

<input id="month" placeholder="Month">
<input id="statusWarranty" placeholder="Warranty Status">
<input id="ppm" placeholder="PPM">
<input id="remarks2" placeholder="Remarks">

</div>

<button class="btn btn-primary" onclick="saveBEMS()">Save</button>
`;
}

async function saveBEMS(){

const data = {
action:"saveAsset",

id:id.value,
assetNumber:assetNumber.value,
assetNumberKonsesi:assetNumberKonsesi.value,
typeCode:typeCode.value,
typeDescription:typeDescription.value,
assetDescription:assetDescription.value,

service:service.value,
department:department.value,
area:area.value,

locationCode:locationCode.value,
location:location.value,

ppmFrequency:ppmFrequency.value,

purchaseDate:purchaseDate.value,
commissioningDate:commissioningDate.value,

warrantyStart:warrantyStart.value,
warrantyEnd:warrantyEnd.value,
warrantyDuration:warrantyDuration.value,

manufacturer:manufacturer.value,
brand:brand.value,
model:model.value,
serialNo:serialNo.value,

loNo:loNo.value,
loPrice:loPrice.value,
pricePerUnit:pricePerUnit.value,

bumiAgent:bumiAgent.value,
vendor:vendor.value,

remarks:remarks.value,
contract:contract.value,

maintenanceType:maintenanceType.value,
month:month.value,
statusWarranty:statusWarranty.value,
ppm:ppm.value,
remarks2:remarks2.value,

module:"BEMS"
};

const res = await saveAssetAPI(data);

if(res.status==="success"){
alert("BEMS Asset Saved");
document.getElementById("globalDetailModal").style.display="none";
assetCache = [];
loadAssets();
}else{
alert("Error saving BEMS");
}

}

// =====================
// CLICK ID -> OPEN MODAL
// =====================
document.addEventListener("click", function(e){

  // ✅ OPEN DETAIL
  if(e.target.closest(".clickable-id")){
    openAssetDetailById(e.target.closest(".clickable-id").dataset.id);
    return;
  }

  // ✅ ADD ASSET
  if(e.target.closest("#addAssetBtn")){
    openAddAssetModal();
    return;
  }

});

function formatDate(dateStr){
  if(!dateStr) return "-";
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2,"0");
  const month = String(d.getMonth()+1).padStart(2,"0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}
