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
// LOAD DATA (FAST + CACHE)
// =====================
async function loadAssets(){

  const tbody = document.querySelector("#assetTable tbody");

  if(tbody){
    tbody.innerHTML = "<tr><td colspan='10'>Loading...</td></tr>";
  }

  try{

    const cached = localStorage.getItem("assets");
    const cacheTime = localStorage.getItem("assets_time");

    const isValidCache = cacheTime && (Date.now() - cacheTime < 300000); // 5 min

    if(cached && isValidCache){

      assetCache = JSON.parse(cached);
      console.log("⚡ Loaded from cache");

    }else{

      assetCache = await getAssets();

      localStorage.setItem("assets", JSON.stringify(assetCache));
      localStorage.setItem("assets_time", Date.now());

      console.log("🌐 Loaded from API");

    }

    assetData = assetCache;
    filteredData = assetData;

    requestAnimationFrame(()=>{
      renderTable();
      renderPagination();
    });

  }catch(err){

    if(tbody){
      tbody.innerHTML = "<tr><td colspan='10'>Error loading data</td></tr>";
    }

    console.error(err);

  }

}

// =====================
// RENDER TABLE (ULTRA FAST)
// =====================
function renderTable(){

  const tbody = document.querySelector("#assetTable tbody");
  if(!tbody) return;

  const start = (currentPage - 1) * rowsPerPage;
  const page = filteredData.slice(start, start + rowsPerPage);

  let html = "";

  page.forEach(a => {

    html += `
      <tr>
        <td>
          <span class="clickable-id" data-id="${a.id}">
            ${a.id || ""}
          </span>
        </td>
        <td>${a.assetNo || ""}</td>
        <td>${a.equipmentName || ""}</td>
        <td>${a.typeCode || ""}</td>
        <td>${a.discipline || ""}</td>
        <td>${a.codeLocation || ""}</td>
        <td>${formatDate(a.startDate) || ""}</td>
        <td>${formatDate(a.endDate) || ""}</td>
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
  box.innerHTML = "";

  const total = Math.ceil(filteredData.length / rowsPerPage);

  // ===== PREV =====
  const prev = document.createElement("button");
  prev.innerText = "Prev";
  prev.className = "btn";

  prev.disabled = currentPage === 1;
  if(prev.disabled) prev.style.opacity = "0.4";

  prev.onclick = () => {
    currentPage--;
    updatePage();
  };

  box.appendChild(prev);

  // ===== PAGE NUMBERS =====
  for(let i = 1; i <= total; i++){

    const b = document.createElement("button");
    b.innerText = i;
    b.className = "btn";

    if(i === currentPage){
      b.style.background = "#00e5ff";
      b.style.color = "#000";
    }

    b.onclick = () => {
      currentPage = i;
      updatePage();
    };

    box.appendChild(b);
  }

  // ===== NEXT =====
  const next = document.createElement("button");
  next.innerText = "Next";
  next.className = "btn";

  next.disabled = currentPage === total;
  if(next.disabled) next.style.opacity = "0.4";

  next.onclick = () => {
    currentPage++;
    updatePage();
  };

  box.appendChild(next);

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
