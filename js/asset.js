
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
        <td>
    <span class="open-asset" data-id="${a.id}">
      ${a.id}
    </span>
  </td>
      <td>${a.assetNo|| a.assetNumberKonsesi || ""}</td>
      <td>${a.codeLocation|| a.locationCode||""}</td>
      <td>${a.equipmentName|| a.assetDescription ||""}</td>
      <td>${a.typeCode||""}</td>
      <td>${a.discipline|| a.service ||""}</td>
      <td>
           ${a.startDate 
                ? formatDate(a.startDate) 
             : (a.warrantyStart ? formatDate(a.warrantyStart) : "")
            }
      </td>

      <td>
            ${a.endDate 
              ? formatDate(a.endDate) 
            : (a.warrantyEnd ? formatDate(a.warrantyEnd) : "")
            }
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderPagination(){

  const pageBox = document.getElementById("pagination");
  pageBox.innerHTML = "";

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const maxVisible = 5; // berapa page nak tunjuk
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if(endPage - startPage < maxVisible - 1){
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  // ===== PREV BUTTON =====
  const prev = document.createElement("button");
  prev.innerText = "Prev";
  prev.className = "btn";

  if(currentPage === 1){
    prev.disabled = true;
    prev.style.opacity = "0.4";
  }

  prev.onclick = () => {
    currentPage--;
    renderTable();
    renderPagination();
  };

  pageBox.appendChild(prev);

  // ===== PAGE NUMBERS =====
  for(let i = startPage; i <= endPage; i++){

    const btn = document.createElement("button");
    btn.innerText = i;
    btn.className = "btn";

    if(i === currentPage){
      btn.style.background = "#00e5ff";
      btn.style.color = "#000";
    }

    btn.onclick = () => {
      currentPage = i;
      renderTable();
      renderPagination();
    };

    pageBox.appendChild(btn);
  }

  // ===== NEXT BUTTON =====
  const next = document.createElement("button");
  next.innerText = "Next";
  next.className = "btn";

  if(currentPage === totalPages){
    next.disabled = true;
    next.style.opacity = "0.4";
  }

  next.onclick = () => {
    currentPage++;
    renderTable();
    renderPagination();
  };

  pageBox.appendChild(next);

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
  if(typeof locationMaster === "undefined") return; // 🔥 tambah ni

  if(locationMaster[code]){
    area.value = locationMaster[code];
    dept.value = code.split("-")[1] || "";
  }else{
    area.value = "";
    dept.value = "";
  }
}

// typecode autofill
function autoFillEquipmentDesc(){
  const typeCodeInput = document.getElementById("typeCode");
  const desc = document.getElementById("typeDescription");
  const task = document.getElementById("taskCode");

  const code = typeCodeInput.value.toUpperCase();
  typeCodeInput.value = code;

 if(equipmentMap[code]){
  desc.value = equipmentMap[code].desc;
  task.value = equipmentMap[code].task;
}else{
  desc.value = "";
  task.value = "";
}
}

// simple add modal (reuse global modal body)
async function openAddAsset(){
  const body = document.getElementById("detailBody");
  document.getElementById("detailTitle").innerText = "Add Asset";
  document.getElementById("globalDetailModal").style.display = "flex";
  const idRes = await generateId();
  const mod = (sessionStorage.getItem("cmmsModule") || "FEMS");
  console.log(idRes);
  
  const modNow = (sessionStorage.getItem("cmmsModule") || "FEMS");
  if(modNow === "BEMS"){
    body.innerHTML = renderBEMSForm(idRes);
  }else{
    body.innerHTML = `

    <input type="hidden" id="module">
    <div class="form-grid">
      <div><label>Module</label><input id="moduleDisplay" readonly></div>
    
    <div class="form-grid">
      <input id="assetId" value="${idRes.id}" readonly>
      <input id="assetNo" placeholder="Asset No">
      <input id="equipmentName" placeholder="Equipment Name">
      <input id="typeCode" placeholder="Type Code">
      <input id="typeDescription" placeholder="Type Description" readonly>
      <input id="taskCode" placeholder="Task Code" readonly>
      <select id="discipline">
            <option>Select Discipline</option>
            <option>Mechanical</option>
            <option>Electrical</option>
      </select>
      <input id="codeLocation" placeholder="Code Location">
      <input id="area" placeholder="Area" readonly>
      <input id="department" placeholder="Department" readonly>
      <input id="bumi" placeholder="Bumi">
      <input id="bumi contact" placeholder="Bumi Contact">
      <input id="supplier" placeholder="Supplier">
      <input id="supplierContact" placeholder="Supplier Contact">
      <input id="manufacture" placeholder="Manufacturer">
      <input id="model" placeholder="Model">
      <input id="serialNumber" placeholder="Serial Number">
      <input id="price" placeholder="Price">
      <input id="lpoNo" placeholder="LPO No">
      <select id="category">
            <option>Category</option>
            <option>ASSET</option>
            <option>INVENTORY</option> 
      </select>
      <input id="startDate" type="date">
      <input id="endDate" type="date">
      <input id="ppmFrequency" placeholder="PPM Frequency">
      <select id="status">
            <option>Status dalam Kontrak Konsesi</option>
            <option>YES</option>
            <option>NO</option>
      </select>
    </div>
    <button class="btn btn-primary" id="saveAssetBtn">Save</button>
  `;
  }
  
  // set module values
  const modVal = (sessionStorage.getItem("cmmsModule") || "FEMS");
  const modInput = document.getElementById("module");
  if(modInput){
  modInput.value = modVal;
  }
  const md = document.getElementById("moduleDisplay");
  if(md) md.value = modVal;

  document.getElementById("saveAssetBtn").onclick = saveAsset;

  // 🔥 TAMBAH SINI
  setTimeout(()=>{
    const typeInput = document.getElementById("typeCode");
    if(typeInput){
      typeInput.addEventListener("input", autoFillEquipmentDesc);
    }

    const locInput = document.getElementById("codeLocation");
    if(locInput){
      locInput.addEventListener("input", function(){
        this.value = this.value.toUpperCase();
        autoFillLocation(this.value);
      });
    }
  }, 0);

}

async function saveAsset(){
  const data = {
    action:"saveAsset",
    id:assetId.value,
    assetNo:assetNo.value,
    equipmentName:equipmentName.value,
    typeCode:typeCode.value,
    taskCode:taskCode.value,
    typeDescription:typeDescription.value,
    discipline:discipline.value,
    codeLocation:codeLocation.value,
    area:area.value,
    department:department.value,
    bumi:bumi.value,
    supplier:supplier.value,
    supplierContact:supplierContact.value,
    manufacturer:manufacturer.value,
    model:model.value,
    serialNumber:serialNumber.value,
    price:price.value,
    lpoNo:lpoNo.value,
    category:category.value,
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


function renderBEMSForm(idRes){
return `
<input type="hidden" id="module">
    <div class="form-grid">
      <div><label>Module</label><input id="moduleDisplay" readonly></div>
<input id="assetId" value="${idRes?.id || ""}" readonly>
<input id="assetNumber" placeholder="Asset Number">
<input id="assetNumberKonsesi" placeholder="Asset Number Konsesi">

<input id="typeCode" placeholder="Type Code">
<input id="typeDescription" placeholder="Type Description" readonly>
<input id="taskCode" placeholder="Task Code" readonly>

<input id="assetDescription" placeholder="Asset Description">

<input id="service" placeholder="Service">
<input id="department" placeholder="Department" readonly>
<input id="area" placeholder="Area" readonly>

<input id="codeLocation" placeholder="Code Location">
<input id="location" placeholder="Location">

<input id="ppmFrequency" placeholder="PPM Frequency">

<input type="date" id="purchaseDate" placeholder="Purchase Date">
<input type="date" id="commissioningDate" placeholder="Comissioning Date">

<input type="date" id="warrantyStart" placeholder="Warranty Start">
<input type="date" id="warrantyEnd" placeholder="Warranty End">
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

<select id="contract">
<option value="">Contract Edgenta</option>
<option>YES</option>
<option>NO</option>

<select id="maintenanceType">
<option value="">Maintenance Type</option>
<option>PPM</option>
<option>RI</option>
<option>CALIBRATION</option>
</select>

<input id="month" placeholder="Month">
<input id="statusWarranty" placeholder="Warranty Status">
<input id="ppm" placeholder="PPM">
<input id="remark" placeholder="Remark">

</div>

<button class="btn btn-primary" onclick="saveBEMS()">Save</button>
`;
}

async function saveBEMS(){

const data = {
action:"saveAsset",

id:assetId.value,
assetNumber:assetNumber.value,
assetNumberKonsesi:assetNumberKonsesi.value,
typeCode:typeCode.value,
typeDescription:typeDescription.value,
assetDescription:assetDescription.value,

service:service.value,
department:department.value,
area:area.value,

locationCode:codeLocation.value,
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
remark:remark.value,

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

document.addEventListener("click", function(e){
  const btn = e.target.closest(".open-asset"); // 🔥 guna closest
  if(btn){
    const id = btn.dataset.id;
    console.log("CLICK ID:", id);
    openAssetDetailById(id);
  }
});
