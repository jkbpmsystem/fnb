
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
  const mod = (sessionStorage.getItem("cmmsModule") || "FEMS");
  
  const modNow = (sessionStorage.getItem("cmmsModule") || "FEMS");
  if(modNow === "BEMS"){
    body.innerHTML = renderBEMSForm();
  }else{
    body.innerHTML = `

    <input type="hidden" id="module">
    <div class="form-grid">
      <div><label>Module</label><input id="moduleDisplay" readonly></div>
    

       <div class="modal-body">
       
                        <div class="form-group">
                            <label>ID</label>
                            <input id="assetId" value="${idRes.id}" readonly>
                        </div>

                        <div class="form-group">
                            <label>Code Location</label>
                            <input type="text"
                                id="codeLocation"
                                placeholder="L1-BEM-001"
                                oninput="checkLocation(); this.value=this.value.toUpperCase();">
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

                    <button class="save-btn" onclick="saveAsset()">Save Asset</button>

                </div>
  `;
  }
  
  // set module values
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
