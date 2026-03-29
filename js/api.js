
const API = {
  ASSET: "https://script.google.com/macros/s/AKfycbwHDAybRqO3zs6SXSaP3wQcdkNH9bU6v2QAGNy2yKT2GqfRRfcOczkCCI94oWxZEVcbPw/exec",
  DASHBOARD: "https://script.google.com/macros/s/AKfycbyLxPzgzonubQGqgRoLqsuz6EQLj2JAEcTVC2TCFdkPG9CMI6cZ1iHuyTm1ui4QBIlRxg/exec"
};

async function getAssets(){
  const module = sessionStorage.getItem("cmmsModule") || "FEMS";

  return fetch(API.ASSET + "?action=getAssets&module=" + module + "&t=" + Date.now()).then(r=>r.json());
}
async function saveAssetAPI(data){
  return fetch(API.ASSET,{method:"POST",body:JSON.stringify(data)}).then(r=>r.json());
}
async function generateId(){
  return fetch(API.ASSET + "?action=generateId").then(r=>r.json());
}
async function getDashboard(){
  return fetch(API.DASHBOARD + "?action=getDashboard").then(r=>r.json());
}
async function getDWList(){
  return fetch(API.DASHBOARD + "?action=getDWList").then(r=>r.json());
}
