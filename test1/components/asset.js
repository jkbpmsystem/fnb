 const currentPath = window.location.pathname.split("/").pop();
            const items = document.querySelectorAll(".side-item");

            items.forEach(item => {
                if (item.getAttribute("onclick")?.includes(currentPage)) {
                    item.classList.add("active");
                }
            });

            document.querySelector(".logo").onclick = function() {
                document.getElementById("sidebar").classList.toggle("collapsed");
            }

            function openModal(){

                document.getElementById("assetModal").style.display="flex";

                    generateAssetId();

            }

            function closeModal() {
                document.getElementById("assetModal").style.display = "none";
            }

const API_URL = "https://script.google.com/macros/s/AKfycbwHDAybRqO3zs6SXSaP3wQcdkNH9bU6v2QAGNy2yKT2GqfRRfcOczkCCI94oWxZEVcbPw/exec";

let assetData = [];
let filteredData = [];
let currentPage = 1;
const rowsPerPage = 15;


/* LOAD DATA FROM GOOGLE SHEET */

async function loadAssets(){

assetData = await fetchData(API_URL + "?action=getAssets&t=" + Date.now());

  assetData.sort((a,b)=> b.id.localeCompare(a.id));

  filteredData = assetData;

  populateFilters();
  renderTable();
  renderPagination();

}

document.addEventListener("DOMContentLoaded", loadAssets);
console.log(assetData);



/* RENDER TABLE */

function renderTable(){

  const tbody = document.querySelector("#assetTable tbody");
  tbody.innerHTML = "";

  const start = (currentPage-1) * rowsPerPage;
  const end = start + rowsPerPage;

  const pageData = filteredData.slice(start,end);

  pageData.forEach((asset,index) => {

    const row = document.createElement("tr");

    row.innerHTML = `
      <td></td>
      <td>
        <span style="cursor:pointer;color:#00e5ff"
        onclick="showDetail(${start + index})">
        ${asset.id || ""}
        </span>
        </td>
      <td>${asset.assetNo || ""}</td>
      <td>${asset.equipmentName || ""}</td>
      <td>${asset.typeCode || ""}</td>
      <td>${asset.equipmentDescriptions || ""}</td>
      <td>${asset.discipline || ""}</td>
      <td>${asset.codeLocation || ""}</td>
      <td>${formatDate(asset.startDate || "")}</td>
      <td>${formatDate(asset.endDate || "")}</td>
    `;

    tbody.appendChild(row);

  });

  document.getElementById("assetTotal").innerHTML =
  `Showing ${(start+1)}-${Math.min(end,filteredData.length)} of ${filteredData.length} assets`;

}



/* PAGINATION */

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

  // PREV BUTTON
  if(currentPage > 1){

    const prev = document.createElement("button");
    prev.innerText = "Prev";
    prev.className = "btn";

    prev.onclick = () =>{
      currentPage--;
      renderTable();
      renderPagination();
    };

    pageBox.appendChild(prev);
  }

  // PAGE NUMBERS
  for(let i=startPage;i<=endPage;i++){

    const btn = document.createElement("button");

    btn.innerText = i;
    btn.className = "btn";

    if(i===currentPage){
      btn.style.background="#00e5ff";
      btn.style.color="#000";
    }

    btn.onclick = ()=>{
      currentPage = i;
      renderTable();
      renderPagination();
    };

    pageBox.appendChild(btn);
  }

  // NEXT BUTTON
  if(currentPage < totalPages){

    const next = document.createElement("button");
    next.innerText = "Next";
    next.className = "btn";

    next.onclick = ()=>{
      currentPage++;
      renderTable();
      renderPagination();
    };

    pageBox.appendChild(next);
  }

}



/* SEARCH */

function searchTable(){

  const keyword = document.getElementById("searchBox").value.toLowerCase();

  filteredData = assetData.filter(a =>
      Object.values(a).join(" ").toLowerCase().includes(keyword)
  );

  currentPage = 1;

  renderTable();
  renderPagination();
}



/* FILTER */

function filterTable(){

const discipline = document.getElementById("filterDiscipline").value;
const codelocation = document.getElementById("filtercodeLocation").value;

filteredData = assetData.filter(a =>

(discipline==="" || a.discipline===discipline) &&
(codelocation==="" || a.codeLocation===codelocation)

);

currentPage = 1;

renderTable();
renderPagination();

}



/* AUTO POPULATE FILTER */

function populateFilters(){

const disciplineSet = new Set();
const codelocationSet = new Set();

assetData.forEach(a=>{
disciplineSet.add(a.discipline);
codelocationSet.add(a.codeLocation);
});

const disciplineSelect = document.getElementById("filterDiscipline");
const codelocationSelect = document.getElementById("filtercodeLocation");

disciplineSet.forEach(d=>{
const opt=document.createElement("option");
opt.value=d;
opt.textContent=d;
disciplineSelect.appendChild(opt);
});

codelocationSet.forEach(l=>{
const opt=document.createElement("option");
opt.value=l;
opt.textContent=l;
if(codelocationSelect){
    codelocationSelect.appendChild(opt);
}
});

}
    
/*format tarikh*/
function formatDate(dateString){

  if(!dateString) return "";

  const date = new Date(dateString);

  return date.toLocaleDateString("en-GB");
}

/*Modal detail*/
function showDetail(index){

const asset = filteredData[index];

document.getElementById("detailModal").style.display = "flex";

const detail = document.getElementById("assetDetail");

detail.innerHTML = `

<div class="asset-grid">

<!-- BASIC INFO -->
<div class="asset-card">
<h4><i class="fa-solid fa-circle-info"></i> Basic Info</h4>

<b>ID</b><div>${asset.id}</div>
<b>Asset No</b><div>${asset.assetNo}</div>
<b>Asset No Hosza</b><div>${asset.assetNoHosza}</div>
<b>Equipment Name</b><div>${asset.equipmentName}</div>
<b>Description</b><div>${asset.equipmentDescriptions}</div>
<b>Category</b><div>${asset.category}</div>

</div>


<!-- LOCATION -->
<div class="asset-card">
<h4><i class="fa-solid fa-location-dot"></i> Location</h4>

<b>Code Location</b><div>${asset.codeLocation}</div>
<b>Area</b><div>${asset.area}</div>
<b>Department</b><div>${asset.department}</div>

</div>


<!-- TECHNICAL -->
<div class="asset-card">
<h4><i class="fa-solid fa-gear"></i> Technical</h4>

<b>Type Code</b><div>${asset.typeCode}</div>
<b>Discipline</b><div>${asset.discipline}</div>
<b>Manufacture</b><div>${asset.manufacture}</div>
<b>Model</b><div>${asset.model}</div>
<b>Serial Number</b><div>${asset.serialNumber}</div>

</div>


<!-- SUPPLIER -->
<div class="asset-card">
<h4><i class="fa-solid fa-truck"></i> Supplier</h4>

<b>Bumi</b><div>${asset.bumi}</div>
<b>Bumi Contact</b><div>${asset.bumiContact}</div>
<b>Supplier</b><div>${asset.supplier}</div>
<b>Supplier Contact</b><div>${asset.supplierContact}</div>

</div>


<!-- FINANCIAL -->
<div class="asset-card">
<h4><i class="fa-solid fa-money-bill"></i> Financial</h4>

<b>Price</b><div>${asset.price}</div>
<b>LPO No</b><div>${asset.lpoNo}</div>

</div>


<!-- MAINTENANCE -->
<div class="asset-card">
<h4><i class="fa-solid fa-screwdriver-wrench"></i> Maintenance</h4>

<b>Start Date</b><div>${formatDate(asset.startDate)}</div>
<b>End Date</b><div>${formatDate(asset.endDate)}</div>
<b>PPM Frequency / year</b><div>${asset.ppmFrequency}</div>
<b>Status dalam kontrak Edgenta</b><div>${asset.status}</div>

</div>

</div>
`;

}
function closeDetail(){
document.getElementById("detailModal").style.display = "none";
}

/*Save*/
async function saveAsset(){

const data = {

action:"saveAsset",

id:document.getElementById("assetId").value,
codeLocation:document.getElementById("codeLocation").value,
area:document.getElementById("area").value,
department:document.getElementById("department").value,
assetNo:document.getElementById("assetNo").value,
assetNoHosza:document.getElementById("assetNoHosza").value,
equipmentName:document.getElementById("equipmentName").value,
typeCode:document.getElementById("typeCode").value,
equipmentDescriptions:document.getElementById("equipmentDescriptions").value,
discipline:document.getElementById("discipline").value,
bumi:document.getElementById("bumi").value,
bumiContact:document.getElementById("bumiContact").value,
supplier:document.getElementById("supplier").value,
supplierContact:document.getElementById("supplierContact").value,
manufacture:document.getElementById("manufacture").value,
model:document.getElementById("model").value,
serialNumber:document.getElementById("serialNumber").value,
price:document.getElementById("price").value,
lpoNo:document.getElementById("lpoNo").value,
category:document.getElementById("category").value,
startDate:document.getElementById("startDate").value,
endDate:document.getElementById("endDate").value,
ppmFrequency:document.getElementById("ppmFrequency").value,
status:document.getElementById("status").value

};

const res = await fetch(API_URL,{

method:"POST",

body:JSON.stringify(data)

});

const result = await res.json();

if(result.status==="success"){

alert("Asset saved");

closeModal();

loadAssets();

}

}

/*GENERATE ID*/
async function generateAssetId(){

const res = await fetch(API_URL + "?action=generateId");

const data = await res.json();

document.getElementById("assetId").value = data.id;

}