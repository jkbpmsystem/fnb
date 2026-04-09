// =====================
// API CONFIG
// ===================== 
const API = {
  BASE: "https://script.google.com/macros/s/AKfycbyLxPzgzonubQGqgRoLqsuz6EQLj2JAEcTVC2TCFdkPG9CMI6cZ1iHuyTm1ui4QBIlRxg/exec",
  LOGIN: "https://script.google.com/macros/s/AKfycbwHDAybRqO3zs6SXSaP3wQcdkNH9bU6v2QAGNy2yKT2GqfRRfcOczkCCI94oWxZEVcbPw/exec",

  ACTIONS: {
    GET_ASSETS: "getAssets",
    GET_DASHBOARD: "getDashboard",
    SAVE_ASSET: "saveAsset",
    GENERATE_ID: "generateId",
    UPDATE_PPM: "updatePPM"
  }
};

// =====================
// LOADER CONTROL
// =====================
let loaderTimeout;

function showLoader(){
  loaderTimeout = setTimeout(()=>{
    const el = document.getElementById("globalLoader");
    if(el) el.style.display = "flex";
  },200);
}

function hideLoader(){
  clearTimeout(loaderTimeout);
  const el = document.getElementById("globalLoader");
  if(el) el.style.display = "none";
}

// =====================
// CORE API FUNCTION (WITH RETRY)
// =====================
async function apiFetch(url, options = {}, retry = 2){

  try{

    showLoader();

    const res = await fetch(url, options);
    const text = await res.text();

    return JSON.parse(text);

  }catch(err){

    console.warn("⚠️ API retry:", retry);

    if(retry > 0){
      return apiFetch(url, options, retry - 1);
    }

    console.error("❌ API FAILED:", err);

    return null;

  }finally{
    hideLoader();
  }

}

// =====================
// HELPER: BUILD URL
// =====================
function buildApiUrl(action, params = {}){

  const query = new URLSearchParams({
    action,
    ...params
  });

  return `${API.BASE}?${query}`;
}

// =====================
// GET MODULE
// =====================
function getModule(){
  return (sessionStorage.getItem("cmmsModule") || "FEMS").toUpperCase();
}

// =====================
// GET ASSETS (POST)
// =====================
async function getAssets(){
  const url = `${API.BASE}?action=${API.ACTIONS.GET_ASSETS}&module=${getModule()}`;
  return await apiFetch(url) || [];
}

// =====================
// SAVE ASSET (POST)
// =====================
async function saveAssetAPI(data){

  return await apiFetch(API.BASE, {
    method: "POST",
    body: JSON.stringify({
      ...data,
      action: API.ACTIONS.SAVE_ASSET
    })
  }) || {status:"error"};

}

// =====================
// GENERATE ID (POST)
// =====================
async function generateId(){
  const url = `${API.BASE}?action=${API.ACTIONS.GENERATE_ID}&module=${getModule()}`;
  return await apiFetch(url) || {id:"ERROR"};
}

// =====================
// DASHBOARD (POST)
// =====================
async function getDashboard(){
  const url = `${API.BASE}?action=${API.ACTIONS.GET_DASHBOARD}&module=${getModule()}`;
  return await apiFetch(url) || {};
}



async function updatePPMAPI(assetId, cycle, date){

  return await apiFetch(API.BASE, {
    method: "POST",
    body: JSON.stringify({
      action: API.ACTIONS.UPDATE_PPM,
      module: getModule(),
      id: assetId,
      cycle: cycle,
      date: date
    })
  }) || {status:"error"};

}
