(function () {
  "use strict";

  let assetData = [];
  let filteredData = [];
  let currentPage = 1;
  const rowsPerPage = 12;

  document.addEventListener("DOMContentLoaded", initAsset);

  async function initAsset() {
    const input = document.getElementById("searchBox");
    if (input) {
      input.addEventListener("keyup", searchTable);
    }
    await loadAssets();
  }

  async function loadAssets() {
    assetData = await getAssets();
    // Sort ID baru ke lama (descending)
    assetData.sort((a, b) => {
      const idA = a.id || "";
      const idB = b.id || "";
      return idB.localeCompare(idA, undefined, { numeric: true });
    });
    filteredData = assetData;
    renderTable();
    renderPagination();
  }

  function renderTable() {
    const tbody = document.querySelector("#assetTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const start = (currentPage - 1) * rowsPerPage;
    const page = filteredData.slice(start, start + rowsPerPage);

    page.forEach((a, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>
    <span class="open-asset clickable-id" data-id="${a.id}">
      ${a.id}
    </span>
  </td>
      <td>${a.assetNo || a.assetNumberKonsesi || ""}</td>
      <td>${a.codeLocation || a.locationCode || ""}</td>
      <td>${a.equipmentName || a.assetDescription || ""}</td>
      <td>${a.typeCode || ""}</td>
      <td>${a.discipline || a.service || ""}</td>
      <td>
           ${a.startDate
          ? formatDate(a.startDate)
          : (a.warrantyStart ? formatDate(a.warrantyStart) : "")
        }
      </td>

      <td>
            ${a.endDate
          ? formatDate(a.endDate)
          : (a.warrantyEnd ? formatDate(a.warrantyEnd) : "")
        }
      </td>
    `;
      tbody.appendChild(tr);
    });
  }

  function renderPagination() {

    const pageBox = document.getElementById("pagination");
    if (!pageBox) return;
    pageBox.innerHTML = "";

    const totalPages = Math.ceil(filteredData.length / rowsPerPage);

    const maxVisible = 5; // berapa page nak tunjuk
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    // ===== PREV BUTTON =====
    const prev = document.createElement("button");
    prev.innerText = "Prev";
    prev.className = "btn";

    if (currentPage === 1) {
      prev.disabled = true;
      prev.style.opacity = "0.4";
    }

    prev.onclick = () => {
      currentPage--;
      renderTable();
      renderPagination();
    };

    pageBox.appendChild(prev);

    // ===== PAGE NUMBERS =====
    for (let i = startPage; i <= endPage; i++) {

      const btn = document.createElement("button");
      btn.innerText = i;
      btn.className = "btn";

      if (i === currentPage) {
        btn.style.background = "#00e5ff";
        btn.style.color = "#000";
      }

      btn.onclick = () => {
        currentPage = i;
        renderTable();
        renderPagination();
      };

      pageBox.appendChild(btn);
    }

    // ===== NEXT BUTTON =====
    const next = document.createElement("button");
    next.innerText = "Next";
    next.className = "btn";

    if (currentPage === totalPages) {
      next.disabled = true;
      next.style.opacity = "0.4";
    }

    next.onclick = () => {
      currentPage++;
      renderTable();
      renderPagination();
    };

    pageBox.appendChild(next);

  }

  function searchTable() {
    const k = document.getElementById("searchBox").value.toLowerCase();
    filteredData = assetData.filter(a => JSON.stringify(a).toLowerCase().includes(k));
    currentPage = 1;
    renderTable();
    renderPagination();
  }

  // location autofill
  function autoFillLocation(code) {
    const area = document.getElementById("area");
    const dept = document.getElementById("department");

    if (!area || !dept) return;
    if (typeof locationMaster === "undefined") return; // 🔥 tambah ni

    if (locationMaster[code]) {
      area.value = locationMaster[code];
      dept.value = code.split("-")[1] || "";
    } else {
      area.value = "";
      dept.value = "";
    }
  }

  // typecode autofill
  function autoFillEquipmentDesc() {
    const typeCodeInput = document.getElementById("typeCode");
    const desc = document.getElementById("typeDescription");
    const task = document.getElementById("taskCode");
    const freq = document.getElementById("freqPPM");

    const code = typeCodeInput.value.toUpperCase();
    typeCodeInput.value = code;

    if (equipmentMap[code]) {
      desc.value = equipmentMap[code].desc;
      task.value = equipmentMap[code].task;
      if (freq) freq.value = equipmentMap[code].freq || "";
    } else {
      desc.value = "";
      task.value = "";
      if (freq) freq.value = "";
    }
  }

  // ===== PPM DATE GENERATION =====
  // ppmFrequency = cycles per year (e.g. 2 = semi-annual, 4 = quarterly)
  // 1st PPM is NOT at startDate — it's at startDate + interval
  function generatePPMDates(startDateStr, endDateStr, ppmFreq) {
    const freq = parseInt(ppmFreq);
    if (!freq || freq <= 0 || !startDateStr || !endDateStr) return {};

    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    if (isNaN(start) || isNaN(end) || end <= start) return {};

    const intervalMonths = Math.round(12 / freq);
    const ordinals = [
      "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th",
      "11th", "12th", "13th", "14th", "15th", "16th", "17th", "18th", "19th", "20th", "21st"
    ];

    const dates = {};
    let cycleIdx = 0;

    for (let i = 1; i <= 100; i++) {
      const d = new Date(start);
      d.setMonth(d.getMonth() + intervalMonths * i);

      // stop if past endDate
      if (d > end) break;

      if (cycleIdx < ordinals.length) {
        dates[ordinals[cycleIdx]] = d.toISOString().split("T")[0];
        cycleIdx++;
      }
    }

    return dates;
  }

  // simple add modal (reuse global modal body)
  async function openAddAsset() {
    const body = document.getElementById("detailBody");
    document.getElementById("detailTitle").innerText = "Add Asset";
    document.getElementById("globalDetailModal").style.display = "flex";
    const idRes = await peekNextId();
    const mod = (sessionStorage.getItem("cmmsModule") || "FEMS");
    console.log(idRes);

    const modNow = (sessionStorage.getItem("cmmsModule") || "FEMS");
    if (modNow === "BEMS") {
      body.innerHTML = renderBEMSForm(idRes, true);
    } else {
      body.innerHTML = renderFEMSForm(idRes.id, "Save", true);
    }

    // set module values
    const modVal = (sessionStorage.getItem("cmmsModule") || "FEMS");
    const modInput = document.getElementById("module");
    if (modInput) modInput.value = modVal;
    const md = document.getElementById("moduleDisplay");
    if (md) md.value = modVal;

    document.getElementById("saveAssetBtn").onclick = saveAsset;

    // 🔥 autofill listeners
    setTimeout(() => {
      const typeInput = document.getElementById("typeCode");
      if (typeInput) typeInput.addEventListener("input", autoFillEquipmentDesc);

      const locInput = document.getElementById("codeLocation");
      if (locInput) {
        locInput.addEventListener("input", function () {
          this.value = this.value.toUpperCase();
          autoFillLocation(this.value);
        });
      }
    }, 0);
  }

  // ======================
  // FEMS FORM TEMPLATE (with labels)
  // ======================
  function renderFEMSForm(assetIdValue, btnLabel = "Save", isNew = false) {
    return `
    <input type="hidden" id="module">
    <input type="hidden" id="isNewAsset" value="${isNew ? 'yes' : 'no'}">
    <div class="form-grid">
      <div>
        <label>Module</label>
        <input id="moduleDisplay" readonly>
      </div>

      <div>
        <label>Asset ID</label>
        <input id="assetId" value="${isNew ? '(Auto)' : (assetIdValue || '')}" readonly style="${isNew ? 'color: var(--subtext); font-style: italic;' : ''}">      </div>

      <div>
        <label>Asset No</label>
        <input id="assetNo" placeholder="Asset No">
      </div>

      <div>
        <label>Asset No HoSZA</label>
        <input id="assetNoHosza" placeholder="Asset No HoSZA">
      </div>

      <div>
        <label>Equipment Name</label>
        <input id="equipmentName" placeholder="Equipment Name">
      </div>

      <div>
        <label>Type Code</label>
        <input id="typeCode" placeholder="Type Code">
      </div>

      <div>
        <label>Type Description</label>
        <input id="typeDescription" placeholder="Type Description" readonly>
      </div>

      <div>
        <label>Task Code</label>
        <input id="taskCode" placeholder="Task Code" readonly>
      </div>

            <div>
        <label>Freq PPM</label>
        <input id="freqPPM" placeholder="Frequency PPM" readonly>
      </div>

      <div>
        <label>Discipline</label>
        <select id="discipline">
          <option>Select Discipline</option>
          <option>Mechanical</option>
          <option>Electrical</option>
        </select>
      </div>

      <div>
        <label>Code Location</label>
        <input id="codeLocation" placeholder="Code Location">
      </div>

      <div>
        <label>Area</label>
        <input id="area" placeholder="Area" readonly>
      </div>

      <div>
        <label>Department</label>
        <input id="department" placeholder="Department" readonly>
      </div>

      <div>
        <label>Bumi</label>
        <input id="bumi" placeholder="Bumi">
      </div>

      <div>
        <label>Bumi Contact</label>
        <input id="bumiContact" placeholder="Bumi Contact">
      </div>

      <div>
        <label>Supplier</label>
        <input id="supplier" placeholder="Supplier">
      </div>

      <div>
        <label>Supplier Contact</label>
        <input id="supplierContact" placeholder="Supplier Contact">
      </div>

      <div>
        <label>Manufacturer</label>
        <input id="manufacture" placeholder="Manufacturer">
      </div>

      <div>
        <label>Model</label>
        <input id="model" placeholder="Model">
      </div>

      <div>
        <label>Serial Number</label>
        <input id="serialNumber" placeholder="Serial Number">
      </div>

      <div>
        <label>Price</label>
        <input id="price" placeholder="Price">
      </div>

      <div>
        <label>LPO No</label>
        <input id="lpoNo" placeholder="LPO No">
      </div>

      <div>
        <label>Category</label>
        <select id="category">
          <option>Category</option>
          <option>ASSET</option>
          <option>INVENTORY</option>
        </select>
      </div>

      <div>
        <label>Start Date</label>
        <input id="startDate" type="date">
      </div>

      <div>
        <label>End Date</label>
        <input id="endDate" type="date">
      </div>

      <div>
        <label>PPM Frequency</label>
        <select id="ppmFrequency">
        <option>PPM Frequency</option>
        <option>1</option>
        <option>2</option>
        <option>3</option>
        <option>4</option>
        <option>5</option>
        <option>6</option>
        <option>7</option>
        <option>8</option>
        <option>9</option>
        <option>10</option>
        <option>11</option>
        <option>12</option>
        </select>
      </div>

      <div>
        <label>Status dalam Kontrak Konsesi</label>
        <select id="status">
          <option>Status dalam Kontrak Konsesi</option>
          <option>YES</option>
          <option>NO</option>
        </select>
      </div>
    </div>

    <button class="btn btn-primary" id="saveAssetBtn">${btnLabel}</button>
  `;
  }

  async function saveAsset() {
    // If new asset, generate real ID now (only on save)
    const isNew = document.getElementById("isNewAsset");
    let finalId = assetId.value;

    if (isNew && isNew.value === "yes") {
      const idRes = await generateId();
      if (!idRes || !idRes.id || idRes.id.includes("ERROR")) {
        alert("Failed to generate ID");
        return;
      }
      finalId = idRes.id;
    }

    const data = {
      action: "saveAsset",
      id: finalId,
      assetNo: assetNo.value,
      assetNoHosza: document.getElementById("assetNoHosza")?.value || "",
      equipmentName: equipmentName.value,
      typeCode: typeCode.value,
      taskCode: taskCode.value,
      freqPPM: freqPPM.value,
      typeDescription: typeDescription.value,
      discipline: discipline.value,
      codeLocation: codeLocation.value,
      area: area.value,
      department: department.value,
      bumi: bumi.value,
      bumiContact: document.getElementById("bumiContact")?.value || "",
      supplier: supplier.value,
      supplierContact: supplierContact.value,
      manufacture: document.getElementById("manufacture")?.value || "",
      model: model.value,
      serialNumber: serialNumber.value,
      price: price.value,
      lpoNo: lpoNo.value,
      category: category.value,
      startDate: startDate.value,
      endDate: endDate.value,
      ppmFrequency: ppmFrequency.value,
      status: status.value,
      module: (document.getElementById("module")
        ? document.getElementById("module").value
        : (sessionStorage.getItem("cmmsModule") || "FEMS"))
    };

    // generate PPM dates for new assets
    if (isNew && isNew.value === "yes") {
      const ppmDates = generatePPMDates(data.startDate, data.endDate, data.ppmFrequency);
      Object.assign(data, ppmDates);
    }

    const res = await saveAssetAPI(data);
    if (res.status === "success") {
      alert("Saved — ID: " + finalId);
      document.getElementById("globalDetailModal").style.display = "none";
      assetCache = []; // reset cache
      loadAssets();
    } else {
      alert("Save failed: " + (res.message || "Unknown error"));
    }
  }

  // ======================
  // BEMS FORM TEMPLATE (with labels)
  // ======================
  function renderBEMSForm(idRes, isNew = false) {
    return `
    <input type="hidden" id="module">
    <input type="hidden" id="isNewAsset" value="${isNew ? 'yes' : 'no'}">
    <div class="form-grid">
      <div>
        <label>Module</label>
        <input id="moduleDisplay" readonly>
      </div>

      <div>
        <label>Asset ID</label>
        <input id="assetId" value="${isNew ? '(Auto)' : (idRes?.id || '')}" readonly style="${isNew ? 'color: var(--subtext); font-style: italic;' : ''}">
      </div>

      <div>
        <label>Asset Number</label>
        <input id="assetNumber" placeholder="Asset Number">
      </div>

      <div>
        <label>Asset Number Konsesi</label>
        <input id="assetNumberKonsesi" placeholder="Asset Number Konsesi">
      </div>

      <div>
        <label>Type Code</label>
        <input id="typeCode" placeholder="Type Code">
      </div>

      <div>
        <label>Type Description</label>
        <input id="typeDescription" placeholder="Type Description" readonly>
      </div>

      <div>
        <label>Task Code</label>
        <input id="taskCode" placeholder="Task Code" readonly>
      </div>

      <div>
        <label>Freq PPM</label>
        <input id="freqPPM" placeholder="Frequency PPM" readonly>
      </div>

      <div>
        <label>Asset Description</label>
        <input id="assetDescription" placeholder="Asset Description">
      </div>

      <div>
        <label>Service</label>
        <input id="service" placeholder="Service">
      </div>

      <div>
        <label>Department</label>
        <input id="department" placeholder="Department" readonly>
      </div>

      <div>
        <label>Area</label>
        <input id="area" placeholder="Area" readonly>
      </div>

      <div>
        <label>Code Location</label>
        <input id="codeLocation" placeholder="Code Location">
      </div>

      <div>
        <label>Location</label>
        <input id="location" placeholder="Location">
      </div>

      <div>
        <label>PPM Frequency</label>
        <input id="ppmFrequency" placeholder="PPM Frequency">
      </div>

      <div>
        <label>Purchase Date</label>
        <input type="date" id="purchaseDate">
      </div>

      <div>
        <label>Commissioning Date</label>
        <input type="date" id="commissioningDate">
      </div>

      <div>
        <label>Warranty Start</label>
        <input type="date" id="warrantyStart">
      </div>

      <div>
        <label>Warranty End</label>
        <input type="date" id="warrantyEnd">
      </div>

      <div>
        <label>Warranty Duration</label>
        <input id="warrantyDuration" placeholder="Warranty Duration">
      </div>

      <div>
        <label>Manufacturer</label>
        <input id="manufacturer" placeholder="Manufacturer">
      </div>

      <div>
        <label>Brand</label>
        <input id="brand" placeholder="Brand">
      </div>

      <div>
        <label>Model</label>
        <input id="model" placeholder="Model">
      </div>

      <div>
        <label>Serial No</label>
        <input id="serialNo" placeholder="Serial No">
      </div>

      <div>
        <label>LO No</label>
        <input id="loNo" placeholder="LO No">
      </div>

      <div>
        <label>LO Price</label>
        <input id="loPrice" placeholder="LO Price">
      </div>

      <div>
        <label>Price Per Unit</label>
        <input id="pricePerUnit" placeholder="Price Per Unit">
      </div>

      <div>
        <label>Bumi Agent</label>
        <input id="bumiAgent" placeholder="Bumi Agent">
      </div>

      <div>
        <label>Vendor</label>
        <input id="vendor" placeholder="Vendor">
      </div>

      <div>
        <label>Remarks</label>
        <input id="remarks" placeholder="Remarks">
      </div>

      <div>
        <label>Contract Edgenta</label>
        <select id="contract">
          <option value="">Contract Edgenta</option>
          <option>YES</option>
          <option>NO</option>
        </select>
      </div>

      <div>
        <label>Maintenance Type</label>
        <select id="maintenanceType">
          <option value="">Maintenance Type</option>
          <option>PPM</option>
          <option>RI</option>
          <option>CALIBRATION</option>
        </select>
      </div>

      <div>
        <label>Month</label>
        <input id="month" placeholder="Month">
      </div>

      <div>
        <label>Warranty Status</label>
        <input id="statusWarranty" placeholder="Warranty Status">
      </div>

      <div>
        <label>PPM</label>
        <input id="ppm" placeholder="PPM">
      </div>

      <div>
        <label>Remark</label>
        <input id="remark" placeholder="Remark">
      </div>
    </div>

    <button class="btn btn-primary" onclick="saveBEMS()">Save</button>
  `;
  }

  async function saveBEMS() {
    // If new asset, generate real ID now (only on save)
    const isNew = document.getElementById("isNewAsset");
    let finalId = assetId.value;

    if (isNew && isNew.value === "yes") {
      const idRes = await generateId();
      if (!idRes || !idRes.id || idRes.id.includes("ERROR")) {
        alert("Failed to generate ID");
        return;
      }
      finalId = idRes.id;
    }

    const data = {
      action: "saveAsset",

      id: finalId,
      assetNumber: assetNumber.value,
      assetNumberKonsesi: assetNumberKonsesi.value,
      typeCode: typeCode.value,
      typeDescription: typeDescription.value,
      taskCode: taskCode.value,
      assetDescription: assetDescription.value,
      freqPPM: freqPPM.value,

      service: service.value,
      department: department.value,
      area: area.value,

      locationCode: codeLocation.value,
      location: location.value,

      ppmFrequency: ppmFrequency.value,

      purchaseDate: purchaseDate.value,
      commissioningDate: commissioningDate.value,

      warrantyStart: warrantyStart.value,
      warrantyEnd: warrantyEnd.value,
      warrantyDuration: warrantyDuration.value,

      manufacturer: manufacturer.value,
      brand: brand.value,
      model: model.value,
      serialNo: serialNo.value,

      loNo: loNo.value,
      loPrice: loPrice.value,
      pricePerUnit: pricePerUnit.value,

      bumiAgent: bumiAgent.value,
      vendor: vendor.value,

      remarks: remarks.value,
      contract: contract.value,

      maintenanceType: maintenanceType.value,
      month: month.value,
      statusWarranty: statusWarranty.value,
      ppm: ppm.value,
      remark: remark.value,

      module: "BEMS"
    };

    // generate PPM dates for new assets
    if (isNew && isNew.value === "yes") {
      const ppmDates = generatePPMDates(data.warrantyStart, data.warrantyEnd, data.ppmFrequency);
      Object.assign(data, ppmDates);
    }

    const res = await saveAssetAPI(data);

    if (res.status === "success") {
      alert("BEMS Asset Saved — ID: " + finalId);
      document.getElementById("globalDetailModal").style.display = "none";
      assetCache = [];
      loadAssets();
    } else {
      alert("Error saving BEMS: " + (res.message || "Unknown error"));
    }
  }

  // ======================
  // EDIT ASSET
  // ======================
  window.openEditAsset = async function openEditAsset(assetId) {
    const assets = await getAssetCached();
    const a = assets.find(x => x.id == assetId);
    if (!a) { alert("Asset not found"); return; }

    const body = document.getElementById("detailBody");
    document.getElementById("detailTitle").innerText = "Edit Asset";

    const modNow = getModule();

    if (modNow === "BEMS") {
      body.innerHTML = renderBEMSForm({ id: a.id });

      // pre-fill BEMS fields
      setTimeout(() => {
        const fields = {
          assetId: a.id,
          assetNumber: a.assetNumber || "",
          assetNumberKonsesi: a.assetNumberKonsesi || "",
          typeCode: a.typeCode || "",
          typeDescription: a.typeDescription || "",
          taskCode: a.taskCode || "",
          freqPPM: a.freqPPM || "",
          assetDescription: a.assetDescription || "",
          service: a.service || "",
          department: a.department || "",
          area: a.area || "",
          codeLocation: a.locationCode || "",
          location: a.location || "",
          ppmFrequency: a.ppmFrequency || "",
          purchaseDate: a.purchaseDate || "",
          commissioningDate: a.commissioningDate || "",
          warrantyStart: a.warrantyStart || "",
          warrantyEnd: a.warrantyEnd || "",
          warrantyDuration: a.warrantyDuration || "",
          manufacturer: a.manufacturer || "",
          brand: a.brand || "",
          model: a.model || "",
          serialNo: a.serialNo || "",
          loNo: a.loNo || "",
          loPrice: a.loPrice || "",
          pricePerUnit: a.pricePerUnit || "",
          bumiAgent: a.bumiAgent || "",
          vendor: a.vendor || "",
          remarks: a.remarks || "",
          contract: a.contract || "",
          maintenanceType: a.maintenanceType || "",
          month: a.month || "",
          statusWarranty: a.statusWarranty || "",
          ppm: a.ppm || "",
          remark: a.remark || ""
        };

        for (const [key, val] of Object.entries(fields)) {
          const el = document.getElementById(key);
          if (el) el.value = val;
        }

        // set module
        const modInput = document.getElementById("module");
        if (modInput) modInput.value = "BEMS";
        const md = document.getElementById("moduleDisplay");
        if (md) md.value = "BEMS";

        // attach autofill listeners
        const typeInput = document.getElementById("typeCode");
        if (typeInput) typeInput.addEventListener("input", autoFillEquipmentDesc);

        const locInput = document.getElementById("codeLocation");
        if (locInput) {
          locInput.addEventListener("input", function () {
            this.value = this.value.toUpperCase();
            autoFillLocation(this.value);
          });
        }
      }, 0);

    } else {
      // FEMS — guna template yang sama dengan label
      body.innerHTML = renderFEMSForm(a.id, "Update");

      // pre-fill FEMS fields
      setTimeout(() => {
        const fields = {
          assetNo: a.assetNo || "",
          assetNoHosza: a.assetNoHosza || "",
          equipmentName: a.equipmentName || "",
          typeCode: a.typeCode || "",
          typeDescription: a.typeDescription || "",
          taskCode: a.taskCode || "",
          freqPPM: a.freqPPM || "",
          codeLocation: a.codeLocation || "",
          area: a.area || "",
          department: a.department || "",
          bumi: a.bumi || "",
          bumiContact: a.bumiContact || "",
          supplier: a.supplier || "",
          supplierContact: a.supplierContact || "",
          manufacture: a.manufacture || "",
          model: a.model || "",
          serialNumber: a.serialNumber || "",
          price: a.price || "",
          lpoNo: a.lpoNo || "",
          startDate: a.startDate || "",
          endDate: a.endDate || "",
          ppmFrequency: a.ppmFrequency || ""
        };

        for (const [key, val] of Object.entries(fields)) {
          const el = document.getElementById(key);
          if (el) el.value = val;
        }

        // set select values
        const discEl = document.getElementById("discipline");
        if (discEl && a.discipline) {
          for (let i = 0; i < discEl.options.length; i++) {
            if (discEl.options[i].text === a.discipline) discEl.selectedIndex = i;
          }
        }
        const catEl = document.getElementById("category");
        if (catEl && a.category) {
          for (let i = 0; i < catEl.options.length; i++) {
            if (catEl.options[i].text === a.category) catEl.selectedIndex = i;
          }
        }
        const statusEl = document.getElementById("status");
        if (statusEl && a.status) {
          for (let i = 0; i < statusEl.options.length; i++) {
            if (statusEl.options[i].text === a.status) statusEl.selectedIndex = i;
          }
        }

        // set module
        const modInput = document.getElementById("module");
        if (modInput) modInput.value = modNow;
        const md = document.getElementById("moduleDisplay");
        if (md) md.value = modNow;

        // attach autofill listeners
        const typeInput = document.getElementById("typeCode");
        if (typeInput) typeInput.addEventListener("input", autoFillEquipmentDesc);

        const locInput = document.getElementById("codeLocation");
        if (locInput) {
          locInput.addEventListener("input", function () {
            this.value = this.value.toUpperCase();
            autoFillLocation(this.value);
          });
        }
      }, 0);

      document.getElementById("saveAssetBtn").onclick = saveAsset;
    }

    document.getElementById("globalDetailModal").style.display = "flex";
  }

  window.openAddAsset = openAddAsset;
  window.saveBEMS = saveBEMS;
  window.saveAsset = saveAsset;

})(); // end IIFE
