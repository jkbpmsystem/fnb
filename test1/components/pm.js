let dwData = [];
let assetMap = {};
let currentDate = new Date();
let events = {};
let upcomingData = [];
let upcomingPage = 1;
const upcomingPerPage = 5;
const currentPage = window.location.pathname.split("/").pop();
const items = document.querySelectorAll(".side-item");

items.forEach(item=>{
  if(item.getAttribute("onclick")?.includes(currentPage)){
    item.classList.add("active");
  }
});

/*Calendar*/
async function loadEvents(){

/* GET ASSETS */
const assets = await fetchData("https://script.google.com/macros/s/AKfycbyLxPzgzonubQGqgRoLqsuz6EQLj2JAEcTVC2TCFdkPG9CMI6cZ1iHuyTm1ui4QBIlRxg/exec?action=getAssets");

  
/* Map Asset */
assetMap = {};

assets.forEach(a=>{
assetMap[a.id] = a;
});

/* GET DW */
dwData = await fetchData("https://script.google.com/macros/s/AKfycbyLxPzgzonubQGqgRoLqsuz6EQLj2JAEcTVC2TCFdkPG9CMI6cZ1iHuyTm1ui4QBIlRxg/exec?action=getDWList");
const data = dwData;

/* Reset events */
events = {};

data.forEach(row => {

  let color = "blue";

  const status = row.status || "";

  if(status === "Completed") color = "green";
  else if(status === "Inspection") color = "orange";
  else if(status === "Breakdown") color = "red";

  const date = row.date;

  if(!date) return;

  if(!events[date]) events[date] = [];

  const asset = assetMap[row.id] || {};

  events[date].push({
    title: row.id || "-",
    equipment: asset.equipmentName || "-",
    type: asset.typeCode || "-",
    start: asset.startDate || "-",
    freq: asset.ppmFrequency || "-",
    color: color
  });

});

renderCalendar();

loadUpcomingPM(data.map(r => {

  const asset = assetMap[r.id] || {};

  return {
    ...r,
    equipmentName: asset.equipmentName || "-"
  };

}));
}
  
/*Render Calendar*/
function renderCalendar(){

const grid = document.getElementById("calendarGrid");
grid.innerHTML="";

const year = currentDate.getFullYear();
const month = currentDate.getMonth();

document.getElementById("monthYear").innerText =
currentDate.toLocaleString("default",{month:"long"})+" "+year;

const firstDay = new Date(year,month,1).getDay();
const daysInMonth = new Date(year,month+1,0).getDate();

for(let i=0;i<firstDay;i++){
grid.innerHTML += `<div></div>`;
}

for(let d=1; d<=daysInMonth; d++){

const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

let eventHTML="";

if(events[dateStr]){

let dayEvents = events[dateStr];

dayEvents.slice(0,2).forEach(ev=>{

eventHTML += `
<div class="event ${ev.color}"
data-equipment="${ev.equipment}"
data-type="${ev.type}"
data-start="${ev.start}"
data-freq="${ev.freq}"
onmouseover="showTooltip(event,this)"
onmouseout="hideTooltip()"
onclick="event.stopPropagation()">
${ev.title}
</div>`;

});

if(dayEvents.length > 2){

eventHTML += `
<div class="event more"
onclick="showMore('${dateStr}'); return false;">
+${dayEvents.length - 2} more
</div>`;

}

}

grid.innerHTML += `
<div class="day" onclick="openDay('${dateStr}')">
<div class="date">${d}</div>
${eventHTML}
</div>
`;

}

}

function prevMonth(){
currentDate.setMonth(currentDate.getMonth()-1);
renderCalendar();
}

function nextMonth(){
currentDate.setMonth(currentDate.getMonth()+1);
renderCalendar();
}

document.addEventListener("DOMContentLoaded", function(){

loadEvents();

});

/*renderupcoming*/
function loadUpcomingPM(data){

const year = currentDate.getFullYear();
const month = currentDate.getMonth();

upcomingData = data.filter(r=>{

const d = new Date(r.date);

return d.getFullYear() === year && d.getMonth() === month;

});

upcomingData.sort((a,b)=> new Date(a.date) - new Date(b.date));

upcomingPage = 1;

renderUpcoming();

  console.log("Upcoming Data:", upcomingData.length, upcomingData);
}

/*render table upcoming*/
function renderUpcoming(){

const container = document.getElementById("upcomingPM");
container.innerHTML = "";

const start = (upcomingPage - 1) * upcomingPerPage;
const end = start + upcomingPerPage;

const pageData = upcomingData.slice(start,end);

pageData.forEach(pm => {

container.innerHTML += `
<div class="pm-item">
<div>
<div class="pm-date">${formatDate(pm.date)}</div>
<div class="pm-title">${pm.id}</div>
<div class="pm-equip">${pm.equipmentName || "-"}</div>
</div>
</div>
`;

});

renderUpcomingPagination();

}

/*pagination button*/
function renderUpcomingPagination(){

const container = document.getElementById("upcomingPM");

const totalPages = Math.ceil(upcomingData.length / upcomingPerPage);

let html = `<div class="pagination">`;

if(upcomingPage > 1){
html += `<button onclick="changeUpcomingPage(${upcomingPage-1})">Prev</button>`;
}

html += `<span> Page ${upcomingPage} / ${totalPages} </span>`;

if(upcomingPage < totalPages){
html += `<button onclick="changeUpcomingPage(${upcomingPage+1})">Next</button>`;
}

html += `</div>`;

container.innerHTML += html;

}

function changeUpcomingPage(page){

upcomingPage = page;
renderUpcoming();

}
  
/*Modal*/
function openModal(name,type,start,freq){

document.getElementById("modalEquipment").innerText = name;
document.getElementById("modalType").innerText = type;
document.getElementById("modalStart").innerText = start;
document.getElementById("modalFreq").innerText = freq;

document.getElementById("eventModal").style.display="flex";

}

function closeModal(){
document.getElementById("eventModal").style.display="none";
}

/*See More*/
function showMore(date){

const list = events[date] || [];

let html = `<div class="grid-events">`;

list.forEach(ev=>{
html += `
<div class="grid-item"
data-equipment="${ev.equipment}"
data-type="${ev.type}"
data-start="${ev.start}"
data-freq="${ev.freq}"
onmouseover="showTooltip(event,this)"
onmouseout="hideTooltip()">

<div class="grid-id">${ev.title}</div>

</div>`;
});

html += `</div>`;

document.getElementById("modalTitle").innerText = "PPM " + date;
document.getElementById("modalContent").innerHTML = html;

document.getElementById("eventModal").style.display="flex";

}

/*tootlip*/
function showTooltip(e,el){

const tooltip = document.getElementById("tooltip");

const equipment = el.dataset.equipment;
const type = el.dataset.type;
const start = el.dataset.start;
const freq = el.dataset.freq;

tooltip.innerHTML = `
<b>${equipment}</b><br>
Type : ${type}<br>
Start : ${formatDate(start)}<br>
Freq : ${freq} / year
`;

tooltip.style.display = "block";
tooltip.style.left = e.pageX + 10 + "px";
tooltip.style.top = e.pageY + 10 + "px";

}

function hideTooltip(){
document.getElementById("tooltip").style.display="none";
}

/*klik day*/
function openDay(date){

const list = events[date] || [];

let html = `<div class="grid-events">`;

list.forEach(ev=>{
html += `
<div class="grid-item"
data-equipment="${ev.equipment}"
data-type="${ev.type}"
data-start="${ev.start}"
data-freq="${ev.freq}"
onmouseover="showTooltip(event,this)"
onmouseout="hideTooltip()">
<div class="grid-id">${ev.title}</div>
</div>
`;
});

html += `</div>`;

document.getElementById("modalTitle").innerText = "PPM " + date;
document.getElementById("modalContent").innerHTML = html;

document.getElementById("eventModal").style.display="flex";

}

/*tukar format*/
function formatDate(dateStr){

if(!dateStr) return "-";

const d = new Date(dateStr);

const day = String(d.getDate()).padStart(2,"0");
const month = String(d.getMonth()+1).padStart(2,"0");
const year = d.getFullYear();

return `${day}/${month}/${year}`;

}

/*Export*/
function exportMonth(){

const year = currentDate.getFullYear();
const month = currentDate.getMonth();

let exportData = [];

dwData.forEach(row=>{

const d = new Date(row.date);

if(d.getFullYear() === year && d.getMonth() === month){

const asset = assetMap[row.id] || {};

exportData.push({

id: row.id,
codeLocation: asset.codeLocation || "",
area: asset.area || "",
department: asset.department || "",
assetNo: asset.assetNo || "",
assetNoHosza: asset.assetNoHosza || "",
equipmentName: asset.equipmentName || "",
typeCode: asset.typeCode || "",
equipmentDescriptions: asset.equipmentDescriptions || "",
discipline: asset.discipline || "",
bumi: asset.bumi || "",
bumiContact: asset["bumi contact"] || "",
supplier: asset.supplier || "",
supplierContact: asset.supplierContact || "",
manufacture: asset.manufacture || "",
model: asset.model || "",
serialNumber: asset.serialNumber || "",
price: asset.price || "",
lpoNo: asset.lpoNo || "",
category: asset.category || "",
startDate: asset.startDate || "",
endDate: asset.endDate || "",
ppmFrequency: asset.ppmFrequency || "",
assetStatus: asset.status || "",

ppmDate: row.date,
ppmStatus: row.status

});

}

});

/* convert to CSV */

let headers = Object.keys(exportData[0]).join(",") + "\n";

let rows = exportData.map(obj =>
Object.values(obj).map(v => `"${v}"`).join(",")
).join("\n");

let csv = headers + rows;

/* download */

const blob = new Blob([csv],{type:"text/csv"});
const url = URL.createObjectURL(blob);

const a = document.createElement("a");
a.href = url;
a.download = "PPM_"+year+"_"+(month+1)+".csv";
a.click();

}
