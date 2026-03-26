/* ===== PROTECT DASHBOARD ===== */
const user = sessionStorage.getItem("cmmsUser");

if(!user){
window.location.href = "index.html";
}

/* ===== DISPLAY USER ===== */
document.getElementById("userDisplay").innerText = user;

/* ===== SIDEBAR TOGGLE ===== */
document.querySelector(".logo").onclick = function(){
document.getElementById("sidebar").classList.toggle("collapsed");
}

const currentPage = window.location.pathname.split("/").pop();
const items = document.querySelectorAll(".side-item");

items.forEach(item=>{
if(item.getAttribute("onclick")?.includes(currentPage)){
item.classList.add("active");
}
});

/* ===== LOGOUT ===== */
function logout(){
sessionStorage.removeItem("cmmsUser");
window.location.href="index.html";
}

/*==========Side Bar =======*/
function Dashboard(){
window.location.href ="dashboard.html";
}

function Asset(){
window.location.href ="asset-master.html";
}

function Warranty(){
window.location.href ="warranty.html";
}

function PPM(){
window.location.href ="preventive-maintenance.html";
}

/*LOAD sheet*/
const API_URL = "https://script.google.com/macros/s/AKfycbyLxPzgzonubQGqgRoLqsuz6EQLj2JAEcTVC2TCFdkPG9CMI6cZ1iHuyTm1ui4QBIlRxg/exec";

async function loadDashboard(){

/* KPI dari dashboard API */
const data = await fetchData(API_URL + "?action=getDashboard");

document.getElementById("overdueCount").textContent = data.overdue;
document.getElementById("completedCount").textContent = data.completed;
document.getElementById("totalAssets").textContent = data.totalAssets;

/* ambil DW list sama seperti PPM page */
const resDW = await fetch(API_URL + "?action=getDWList");
const dw = await resDW.json();

const today = new Date();
today.setHours(0,0,0,0);

const limit = new Date();
limit.setDate(today.getDate()+30);

const upcoming = [];
const overdue = [];

dw.forEach(r=>{

const d = new Date(r.date);
d.setHours(0,0,0,0);

if(r.status) return;

if(d < today){ overdue.push(r); } else if(d>= today && d <= limit){ upcoming.push(r); } }); /* KPI upcoming ikut DWList */ document.getElementById("upcomingCount").textContent=upcoming.length; renderUpcoming(upcoming); renderOverdue(overdue); } function renderUpcoming(list){ const tbody=document.getElementById("upcomingTable"); tbody.innerHTML="" ; list.slice(0,10).forEach(r=>{

        const tr=document.createElement("tr");

        tr.innerHTML=`
        <td>${r.id}</td>
        <td>${r.equipmentName || "-"}</td>
        <td>${r.date}</td>
        <td><span class="status progress">Upcoming</span></td>
        `;

        tbody.appendChild(tr);

        });

        }


        function renderOverdue(list){

        const tbody = document.getElementById("overdueTable");
        tbody.innerHTML="";

        list.slice(0,10).forEach(r=>{

        const tr=document.createElement("tr");

        tr.innerHTML=`
        <td>${r.id}</td>
        <td>${r.equipmentName || "-"}</td>
        <td>${r.date}</td>
        <td><span class="status overdue">Overdue</span></td>
        `;

        tbody.appendChild(tr);

        });

        }


        document.addEventListener("DOMContentLoaded", loadDashboard);