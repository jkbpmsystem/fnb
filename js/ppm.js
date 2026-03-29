
let dwData = [];
let assetMap = {};
let currentDate = new Date();
let events = {};

document.addEventListener("DOMContentLoaded", initPPM);

async function initPPM(){
  await loadEvents();
}

async function loadEvents(){
  const assets = await getAssets();
  assetMap = {};
  assets.forEach(a=> assetMap[a.id] = a);

  dwData = await getDWList();
  events = {};

  dwData.forEach(row=>{
    if(!row.date) return;
    const asset = assetMap[row.id] || {};
    if(!events[row.date]) events[row.date] = [];
    let color = "blue";
    if(row.status === "Completed") color = "green";
    else if(row.status === "Inspection") color = "orange";
    else if(row.status === "Breakdown") color = "red";

    events[row.date].push({
      title: row.id,
      equipment: asset.equipmentName || "-",
      type: asset.typeCode || "-",
      start: asset.startDate || "-",
      freq: asset.ppmFrequency || "-",
      color
    });
  });

  renderCalendar();
}

function renderCalendar(){
  const grid = document.getElementById("calendarGrid");
  if(!grid) return;
  grid.innerHTML = "";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  document.getElementById("monthYear").innerText =
    currentDate.toLocaleString("default",{month:"long"})+" "+year;

  const firstDay = new Date(year,month,1).getDay();
  const daysInMonth = new Date(year,month+1,0).getDate();

  for(let i=0;i<firstDay;i++) grid.innerHTML += `<div></div>`;

  for(let d=1; d<=daysInMonth; d++){
    const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    let eventHTML = "";

    if(events[dateStr]){
      let dayEvents = events[dateStr];
      dayEvents.slice(0,3).forEach(ev=>{
        eventHTML += `
          <div class="event ${ev.color}" data-asset-id="${ev.title}">
            ${ev.title}
          </div>
        `;
      });
      if(dayEvents.length>3){
        eventHTML += `<div class="event orange">+${dayEvents.length-3} more</div>`;
      }
    }

    grid.innerHTML += `
      <div class="day">
        <div class="date">${d}</div>
        ${eventHTML}
      </div>
    `;
  }
}

function prevMonth(){ currentDate.setMonth(currentDate.getMonth()-1); renderCalendar(); }
function nextMonth(){ currentDate.setMonth(currentDate.getMonth()+1); renderCalendar(); }
