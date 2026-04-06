// =====================
// API CONFIG
// ===================== 
const API = {
  BASE: "https://script.google.com/macros/s/AKfycbyLxPzgzonubQGqgRoLqsuz6EQLj2JAEcTVC2TCFdkPG9CMI6cZ1iHuyTm1ui4QBIlRxg/exec",
  LOGIN: "https://script.google.com/macros/s/AKfycbwHDAybRqO3zs6SXSaP3wQcdkNH9bU6v2QAGNy2yKT2GqfRRfcOczkCCI94oWxZEVcbPw/exec"
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
// GET MODULE
// =====================
function getModule(){
  return (sessionStorage.getItem("cmmsModule") || "fems").toLowerCase();
}

// =====================
// GET ASSETS
// =====================
async function getAssets(){

  const module = getModule();

  return await apiFetch(API.BASE, {
    method: "POST",
    body: JSON.stringify({
      action: "getAssets",
      module: module
    })
  }) || [];

}

// =====================
// SAVE ASSET
// =====================
async function saveAssetAPI(data){

  return await apiFetch(API.ASSET, {
    method: "POST",
    body: JSON.stringify(data)
  }) || {status:"error"};

}

// =====================
// GENERATE ID
// =====================
async function generateId(){

  return await apiFetch(API.BASE, {
    method: "POST",
    body: JSON.stringify({
      action: "generateId",
      module: getModule()
    })
  }) || {id:"ERROR"};

}

// =====================
// DASHBOARD
// =====================
async function getDashboard(){

  return await apiFetch(API.BASE, {
    method: "POST",
    body: JSON.stringify({
      action: "getDashboard",
      module: getModule()
    })
  }) || {};

}

// =====================
// DW LIST
// =====================
async function getDWList(){

  const module = getModule();

  const url = API.BASE + "?action=getDWList&module=" + module;

  return await apiFetch(url) || [];

}
