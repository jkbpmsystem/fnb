// =====================
// FIREBASE API LAYER (legacy-compatible)
// Keeps old function names so existing pages keep working
// =====================

const API = {
  ACTIONS: {
    GET_ASSETS: "getAssets",
    GET_DASHBOARD: "getDashboard",
    SAVE_ASSET: "saveAsset",
    GENERATE_ID: "generateId",
    UPDATE_PPM: "updatePPM",
    GET_POST_WARRANTY: "getPostWarranty",
    UPDATE_POST: "updatePost"
  }
};

let loaderTimeout;

function showLoader(){
  loaderTimeout = setTimeout(() => {
    const el = document.getElementById("globalLoader");
    if(el) el.style.display = "flex";
  }, 200);
}

function hideLoader(){
  clearTimeout(loaderTimeout);
  const el = document.getElementById("globalLoader");
  if(el) el.style.display = "none";
}

function getModule(){
  return (sessionStorage.getItem("cmmsModule") || "FEMS").toUpperCase().trim();
}

function getModuleKey(module){
  return (module || getModule()).toLowerCase();
}

async function getFirebase(){
  return await window.firebaseReady;
}

function getAssetsCollectionPath(module){
  return ["modules", getModuleKey(module), "assets"];
}

function normalizeDoc(docSnap){
  return { id: docSnap.id, ...docSnap.data() };
}

function safeDateValue(val){
  if (!val) return null;
  if (typeof val === "string") return val;
  if (val && typeof val.toDate === "function") {
    const d = val.toDate();
    return d.toISOString().split("T")[0];
  }
  if (val instanceof Date && !isNaN(val)) return val.toISOString().split("T")[0];
  return val;
}

function normalizeAsset(asset){
  const out = { ...asset };
  ["startDate","endDate","warrantyStart","warrantyEnd","purchaseDate","commissioningDate"].forEach(k => {
    if (k in out) out[k] = safeDateValue(out[k]);
  });
  for(let i=1;i<=21;i++){
    const ord = getOrdinalLabel(i);
    if (ord in out) out[ord] = safeDateValue(out[ord]);
    const done = `done_${ord}`;
    if (done in out) out[done] = safeDateValue(out[done]);
  }
  return out;
}

function getOrdinalLabel(i){
  if(i === 1) return "1st";
  if(i === 2) return "2nd";
  if(i === 3) return "3rd";
  return `${i}th`;
}

async function getAssets(){
  const { db, fsMod } = await getFirebase();
  showLoader();
  try {
    const ref = fsMod.collection(db, ...getAssetsCollectionPath());
    const snap = await fsMod.getDocs(ref);
    return snap.docs.map(normalizeDoc).map(normalizeAsset);
  } catch (err) {
    console.error("❌ getAssets failed:", err);
    return [];
  } finally {
    hideLoader();
  }
}

async function saveAssetAPI(data){
  const { db, fsMod } = await getFirebase();
  showLoader();
  try {
    const module = data.module || getModule();
    const assetId = String(data.id || "").trim();
    if(!assetId) throw new Error("Missing asset id");

    const payload = { ...data };
    delete payload.action;
    payload.module = String(module).toUpperCase();
    payload.updatedAt = fsMod.serverTimestamp();
    payload.createdAt = payload.createdAt || fsMod.serverTimestamp();

    const docRef = fsMod.doc(db, ...getAssetsCollectionPath(module), assetId);
    await fsMod.setDoc(docRef, payload, { merge: true });
    return { status: "success", id: assetId };
  } catch (err) {
    console.error("❌ saveAssetAPI failed:", err);
    return { status: "error", message: err.message || "Save failed" };
  } finally {
    hideLoader();
  }
}

async function generateId(){
  const { db, fsMod } = await getFirebase();
  showLoader();
  try {
    const module = getModule();
    const counterRef = fsMod.doc(db, "counters", `${getModuleKey(module)}_asset`);
    const nextId = await fsMod.runTransaction(db, async (tx) => {
      const snap = await tx.get(counterRef);
      const current = snap.exists() ? Number(snap.data().value || 0) : 0;
      const next = current + 1;
      tx.set(counterRef, { value: next, module, updatedAt: fsMod.serverTimestamp() }, { merge: true });
      return next;
    });
    return { id: `${module}-${String(nextId).padStart(4, '0')}` };
  } catch (err) {
    console.error("❌ generateId failed:", err);
    return { id: `${getModule()}-ERROR` };
  } finally {
    hideLoader();
  }
}

async function getDashboard(){
  const assets = await getAssets();
  const today = new Date();
  let overdue = 0;
  let upcoming = 0;
  assets.forEach(a => {
    const endVal = a.endDate || a.warrantyEnd;
    if(!endVal) return;
    const end = new Date(endVal);
    if(isNaN(end)) return;
    const diff = Math.ceil((end - today) / (1000*60*60*24));
    if(diff < 0) overdue++;
    else if(diff < 30) upcoming++;
  });
  return { totalAssets: assets.length, overdueCount: overdue, upcomingCount: upcoming };
}

async function updatePPMAPI(assetId, cycle, date){
  const { db, fsMod } = await getFirebase();
  showLoader();
  try {
    const ref = fsMod.doc(db, ...getAssetsCollectionPath(), String(assetId));
    await fsMod.setDoc(ref, {
      [`done_${cycle}`]: date,
      updatedAt: fsMod.serverTimestamp()
    }, { merge: true });
    return { status: "success" };
  } catch (err) {
    console.error("❌ updatePPMAPI failed:", err);
    return { status: "error", message: err.message || "Update failed" };
  } finally {
    hideLoader();
  }
}

async function getPostWarrantyAPI(){
  const assets = await getAssets();
  const now = new Date();
  return assets.filter(asset => {
    const endVal = asset.endDate || asset.warrantyEnd;
    if(!endVal) return true;
    const end = new Date(endVal);
    return isNaN(end) ? true : end < now;
  });
}

async function updatePostAPI(assetId, cycle, date){
  return await updatePPMAPI(assetId, cycle, date);
}
