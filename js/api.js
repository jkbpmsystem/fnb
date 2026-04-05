const API = {
  ASSET: "https://script.google.com/macros/s/AKfycbwHDAybRqO3zs6SXSaP3wQcdkNH9bU6v2QAGNy2yKT2GqfRRfcOczkCCI94oWxZEVcbPw/exec",
  DASHBOARD: "https://script.google.com/macros/s/AKfycbyLxPzgzonubQGqgRoLqsuz6EQLj2JAEcTVC2TCFdkPG9CMI6cZ1iHuyTm1ui4QBIlRxg/exec"
};

// =====================
// GET ASSETS (FIX CORS)
// =====================
async function getAssets(){

  const module = (sessionStorage.getItem("cmmsModule") || "fems").toLowerCase();

  const url = API.ASSET + "?action=getAssets&module=" + module + "&t=" + Date.now();

  try{
    const res = await fetch(url);
    const text = await res.text();
    return JSON.parse(text);
  }catch(err){
    console.error("❌ getAssets error:", err);
    return [];
  }

}

// =====================
// SAVE ASSET
// =====================
async function saveAssetAPI(data){

  try{
    const res = await fetch(API.ASSET,{
      method:"POST",
      body: JSON.stringify(data)
    });

    const text = await res.text();
    return JSON.parse(text);

  }catch(err){
    console.error("❌ saveAsset error:", err);
    return {status:"error"};
  }

}

// =====================
// GENERATE ID (FIX MODULE)
// =====================
async function generateId(){

  const module = (sessionStorage.getItem("cmmsModule") || "fems").toLowerCase();

  try{
    const res = await fetch(API.ASSET + "?action=generateId&module=" + module);
    const text = await res.text();
    return JSON.parse(text);
  }catch(err){
    console.error("❌ generateId error:", err);
    return {id:"ERROR"};
  }

}

// =====================
// DASHBOARD
// =====================
async function getDashboard(){

  try{
    const res = await fetch(API.DASHBOARD + "?action=getDashboard");
    const text = await res.text();
    return JSON.parse(text);
  }catch(err){
    console.error("❌ dashboard error:", err);
    return {};
  }

}

// =====================
// DW LIST
// =====================
async function getDWList(){

  try{
    const res = await fetch(API.DASHBOARD + "?action=getDWList");
    const text = await res.text();
    return JSON.parse(text);
  }catch(err){
    console.error("❌ DW error:", err);
    return [];
  }

}
