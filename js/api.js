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

function showLoader() {
  loaderTimeout = setTimeout(() => {
    const el = document.getElementById("globalLoader");
    if (el) el.style.display = "flex";
  }, 200);
}

function hideLoader() {
  clearTimeout(loaderTimeout);
  const el = document.getElementById("globalLoader");
  if (el) el.style.display = "none";
}

function getModule() {
  return (sessionStorage.getItem("cmmsModule") || "FEMS").toUpperCase().trim();
}

function getModuleKey(module) {
  return (module || getModule()).toLowerCase();
}

async function getFirebase() {
  return await window.firebaseReady;
}

function getAssetsCollectionPath(module) {
  return ["modules", getModuleKey(module), "assets"];
}

function normalizeDoc(docSnap) {
  return { id: docSnap.id, ...docSnap.data() };
}

function safeDateValue(val) {
  if (!val) return null;
  if (typeof val === "string") return val;
  if (val && typeof val.toDate === "function") {
    const d = val.toDate();
    return d.toISOString().split("T")[0];
  }
  if (val instanceof Date && !isNaN(val)) return val.toISOString().split("T")[0];
  return val;
}

function normalizeAsset(asset) {
  const out = { ...asset };
  ["startDate", "endDate", "warrantyStart", "warrantyEnd", "purchaseDate", "commissioningDate", "postDate", "endContract", "postWarrantyEndDate"].forEach(k => {
    if (k in out) out[k] = safeDateValue(out[k]);
  });
  for (let i = 1; i <= 21; i++) {
    const ord = getOrdinalLabel(i);
    if (ord in out) out[ord] = safeDateValue(out[ord]);
    const done = `done_${ord}`;
    if (done in out) out[done] = safeDateValue(out[done]);
  }
  // normalize post_done_{year}_{cycle} fields
  Object.keys(out).forEach(k => {
    if (k.startsWith("post_done_")) out[k] = safeDateValue(out[k]);
  });
  return out;
}

function getOrdinalLabel(i) {
  if (i === 1) return "1st";
  if (i === 2) return "2nd";
  if (i === 3) return "3rd";
  return `${i}th`;
}

async function getAssets() {
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

async function saveAssetAPI(data) {
  const { db, fsMod } = await getFirebase();
  showLoader();
  try {
    const module = data.module || getModule();
    const assetId = String(data.id || "").trim();
    if (!assetId) throw new Error("Missing asset id");

    const payload = { ...data };
    delete payload.action;
    payload.module = String(module).toUpperCase();
    payload.updatedAt = fsMod.serverTimestamp();

    const docRef = fsMod.doc(db, ...getAssetsCollectionPath(module), assetId);

    // Only set createdAt if not already present in payload
    if (!payload.createdAt) {
      // Check if doc already exists — don't overwrite existing createdAt
      const existingDoc = await fsMod.getDoc(docRef);
      if (!existingDoc.exists()) {
        payload.createdAt = fsMod.serverTimestamp();
      } else {
        delete payload.createdAt;
      }
    }

    // 🔥 Strip undefined values — Firestore rejects undefined
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });

    await fsMod.setDoc(docRef, payload, { merge: true });
    console.log("✅ saveAssetAPI success:", assetId);
    return { status: "success", id: assetId };
  } catch (err) {
    console.error("❌ saveAssetAPI failed:", err);
    return { status: "error", message: err.message || "Save failed" };
  } finally {
    hideLoader();
  }
}

async function peekNextId() {
  const { db, fsMod } = await getFirebase();
  showLoader();
  try {
    const module = getModule();
    const counterRef = fsMod.doc(db, "counters", `${getModuleKey(module)}_asset`);
    const snap = await fsMod.getDoc(counterRef);
    const current = snap.exists() ? Number(snap.data().value || 0) : 0;
    const next = current + 1;
    return { id: `${module}-${String(next).padStart(4, '0')}` };
  } catch (err) {
    console.error("❌ peekNextId failed:", err);
    return { id: `${getModule()}-ERROR` };
  } finally {
    hideLoader();
  }
}

async function generateId() {
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

async function getDashboard() {
  const assets = await getAssets();
  const today = new Date();
  let overdue = 0;
  let upcoming = 0;
  assets.forEach(a => {
    const endVal = a.endDate || a.warrantyEnd;
    if (!endVal) return;
    const end = new Date(endVal);
    if (isNaN(end)) return;
    const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    if (diff < 0) overdue++;
    else if (diff < 30) upcoming++;
  });
  return { totalAssets: assets.length, overdueCount: overdue, upcomingCount: upcoming };
}

async function updatePPMAPI(assetId, cycle, date) {
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

async function getPostWarrantyAPI() {
  const assets = await getAssets();
  const now = new Date();
  return assets.filter(asset => {
    const endVal = asset.endDate || asset.warrantyEnd;
    if (!endVal) return false;
    const end = new Date(endVal);
    if (isNaN(end)) return false;
    return end < now;
  }).map(asset => {
    const endVal = asset.endDate || asset.warrantyEnd;
    const endD = new Date(endVal);
    const postStart = new Date(endD);
    postStart.setDate(postStart.getDate() + 1);
    return {
      ...asset,
      postStartDate: asset.postDate || postStart.toISOString().split("T")[0],
      frequency: asset.postFrequency || asset.freqPPM || "",
      endContractDate: asset.endContract || ""
    };
  });
}

function getPostPPMCyclesPerYear(freq) {
  const f = (freq || "").toLowerCase().trim();
  if (f === "weekly") return { count: 52, addFn: (d, n) => { const r = new Date(d); r.setDate(r.getDate() + 7 * n); return r; } };
  if (f === "monthly") return { count: 12, addFn: (d, n) => { const r = new Date(d); r.setMonth(r.getMonth() + n); return r; } };
  if (f === "quarterly") return { count: 4, addFn: (d, n) => { const r = new Date(d); r.setMonth(r.getMonth() + 3 * n); return r; } };
  if (f === "semi-annually") return { count: 2, addFn: (d, n) => { const r = new Date(d); r.setMonth(r.getMonth() + 6 * n); return r; } };
  if (f === "annually") return { count: 1, addFn: (d, n) => { const r = new Date(d); r.setFullYear(r.getFullYear() + n); return r; } };
  return { count: 1, addFn: (d, n) => { const r = new Date(d); r.setFullYear(r.getFullYear() + n); return r; } };
}

function computePostPPMDates(postStartDate, freq, year, endContract) {
  const info = getPostPPMCyclesPerYear(freq);
  const start = new Date(postStartDate);
  const dates = [];
  const endC = endContract ? new Date(endContract) : null;

  // generate all cycles from postStartDate forward, filter by year
  for (let i = 0; i < 500; i++) {
    const d = info.addFn(start, i);
    if (d.getFullYear() > year) break;
    if (endC && d > endC) break;
    if (d.getFullYear() === year) {
      dates.push({ cycle: dates.length + 1, planned: d.toISOString().split("T")[0] });
    }
  }
  return dates;
}

async function generatePostPPM(assetId, year) {
  const { db, fsMod } = await getFirebase();
  showLoader();
  try {
    const ref = fsMod.doc(db, ...getAssetsCollectionPath(), String(assetId));
    const snap = await fsMod.getDoc(ref);
    const existing = snap.exists() ? (snap.data().postPPMYears || []) : [];
    if (!existing.includes(year)) {
      existing.push(year);
      existing.sort();
      await fsMod.setDoc(ref, { postPPMYears: existing, updatedAt: fsMod.serverTimestamp() }, { merge: true });
    }
    return { status: "success", years: existing };
  } catch (err) {
    console.error("❌ generatePostPPM failed:", err);
    return { status: "error", message: err.message };
  } finally {
    hideLoader();
  }
}

async function savePostDone(assetId, year, cycle, date) {
  const { db, fsMod } = await getFirebase();
  showLoader();
  try {
    const ref = fsMod.doc(db, ...getAssetsCollectionPath(), String(assetId));
    const fieldName = `post_done_${year}_${cycle}`;
    await fsMod.setDoc(ref, {
      [fieldName]: date,
      updatedAt: fsMod.serverTimestamp()
    }, { merge: true });
    return { status: "success" };
  } catch (err) {
    console.error("❌ savePostDone failed:", err);
    return { status: "error", message: err.message };
  } finally {
    hideLoader();
  }
}

async function updatePostAPI(assetId, cycle, date) {
  return await updatePPMAPI(assetId, cycle, date);
}