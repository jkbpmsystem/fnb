/**
 * gantt-ppm.js
 * Gantt Chart untuk Jadual Preventive Maintenance
 *
 * Bergantung kepada:
 *   - api.js  → getAssets()
 *   - ppm.js  → getOrdinal(), isDuringWarranty()
 *   - SheetJS CDN → export Excel
 *
 * Letak <script> ini SELEPAS ppm.js dalam HTML.
 * Tambah CDN sebelum script ini:
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
 */

(function () {

  // ============================================================
  // CONSTANTS
  // ============================================================

  const TODAY = new Date();

  const MONTHS_SHORT = ['Jan','Feb','Mac','Apr','Mei','Jun','Jul','Ogo','Sep','Okt','Nov','Dis'];
  const MONTHS_FULL  = ['Januari','Februari','Mac','April','Mei','Jun','Julai','Ogos','September','Oktober','November','Disember'];

  const STATUS_CLASS = {
    done:     'gb-done',
    progress: 'gb-progress',
    overdue:  'gb-overdue',
    plan:     'gb-plan',
    future:   'gb-future'
  };

  const STATUS_LABEL = {
    done:     'Selesai',
    progress: 'Dalam proses',
    overdue:  'Overdue',
    plan:     'Dijadual',
    future:   'Akan datang'
  };

  const TYPE_COLORS = {
    'Bulanan':      'background:#E6F1FB;color:#0C447C',
    'Suku Tahunan': 'background:#FAEEDA;color:#633806',
    'Tahunan':      'background:#EEEDFE;color:#3C3489'
  };

  // ============================================================
  // STATE
  // ============================================================

  let allRawAssets    = [];       // cache semua asset dari API
  let ganttAssets     = [];       // asset diproses untuk tab aktif
  let ganttViewMode   = 'month';
  let ganttViewOff    = 0;
  let ganttCurrentTab = 'during'; // 'during' atau 'post'

  // ============================================================
  // INIT
  // ============================================================

  document.addEventListener('DOMContentLoaded', async function () {
    await ganttLoadAssets();
    ganttBindControls();
    ganttRender();
  });

  // ============================================================
  // LOAD ASSET DARI API (sekali sahaja, cache dalam allRawAssets)
  // ============================================================

  async function ganttLoadAssets () {
    try {
      allRawAssets = await getAssets(); // dari api.js
      ganttFilterByTab(ganttCurrentTab);
      ganttPopulateCategoryFilter();
    } catch (e) {
      console.error('gantt-ppm: gagal load asset', e);
      allRawAssets = [];
      ganttAssets  = [];
    }
  }

  // ============================================================
  // TAPIS ASSET MENGIKUT TAB (during / post)
  // Guna isDuringWarranty() yang sama dengan ppm.js
  // ============================================================

  function ganttFilterByTab (tab) {
    ganttCurrentTab = tab;

    const filtered = allRawAssets.filter(a =>
      tab === 'during' ? isDuringWarranty(a) : !isDuringWarranty(a)
    );

    ganttAssets = ganttProcessAssets(filtered);
    ganttPopulateCategoryFilter();
  }

  // ============================================================
  // PROSES ASSET → FORMAT GANTT
  // Ubah bahagian ini mengikut struktur data API anda
  // ============================================================

  function ganttProcessAssets (rawAssets) {
    if (!Array.isArray(rawAssets)) return [];

    return rawAssets.map(a => {
      const pms = [];

      // ── Kaedah 1: field ppmSchedules (array) ──
      if (Array.isArray(a.ppmSchedules)) {
        a.ppmSchedules.forEach(sch => {
          const s = sch.startDate ? new Date(sch.startDate) : null;
          const e = sch.endDate   ? new Date(sch.endDate)   : null;
          if (s && e && !isNaN(s) && !isNaN(e)) {
            pms.push({
              s,
              e,
              st:  ganttResolveStatus(s, e, sch.status),
              pic: sch.assignee || sch.technician || a.vendor || a.supplier || '-'
            });
          }
        });
      }

      // ── Kaedah 2: baca tarikh dari field ordinal (1st ... 21st)
      //    sama dengan ppm.js ──
      if (pms.length === 0) {
        for (let i = 1; i <= 21; i++) {
          const key     = getOrdinal(i);  // dari ppm.js
          const dateVal = a[key];
          if (!dateVal) continue;
          const s = new Date(dateVal);
          if (isNaN(s)) continue;
          const e = new Date(s);
          e.setDate(e.getDate() + (a.pmDuration || 0));
          pms.push({
            s,
            e,
            st:  ganttResolveStatus(s, e, null),
            pic: a.assignee || a.vendor || a.supplier || '-'
          });
        }
      }

      return {
        id:   a.id   || a.assetId             || '-',
        name: a.equipmentName || a.assetDescription || a.name || '-',
        cat:  a.category || a.assetCategory   || a.codeLocation || 'Umum',
        type: a.pmType   || a.maintenanceType || 'Bulanan',
        pic:  a.assignee || a.technician      || a.vendor        || '-',
        pms
      };
    }).filter(a => a.pms.length > 0);
  }

  function ganttResolveStatus (s, e, apiStatus) {
    if (apiStatus) {
      const st = apiStatus.toLowerCase();
      if (st.includes('done')     || st.includes('selesai') || st.includes('complete')) return 'done';
      if (st.includes('progress') || st.includes('proses'))                              return 'progress';
      if (st.includes('overdue')  || st.includes('lewat'))                               return 'overdue';
    }
    if (e < TODAY)                return 'overdue';
    if (s <= TODAY && e >= TODAY)  return 'progress';
    if (s > TODAY)                return 'future';
    return 'plan';
  }

  // ============================================================
  // HELPERS
  // ============================================================

  function getDIM (y, m) { return new Date(y, m + 1, 0).getDate(); }

  function sameDay (a, b) {
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth()    === b.getMonth()    &&
           a.getDate()     === b.getDate();
  }

  function fmtDate (d) {
    return d.getDate() + ' ' + MONTHS_SHORT[d.getMonth()] + ' ' + d.getFullYear();
  }

  function getViewRange () {
    const base = new Date(TODAY.getFullYear(), TODAY.getMonth() + ganttViewOff, 1);
    if (ganttViewMode === 'month') {
      const y = base.getFullYear(), m = base.getMonth();
      const cols = [];
      for (let d = 1; d <= getDIM(y, m); d++) cols.push(new Date(y, m, d));
      return { cols, label: MONTHS_FULL[m] + ' ' + y };
    } else {
      const m0 = Math.floor(base.getMonth() / 3) * 3;
      const y  = base.getFullYear();
      const cols = [];
      for (let mi = m0; mi < m0 + 3; mi++) {
        for (let d = 1; d <= getDIM(y, mi); d++) cols.push(new Date(y, mi, d));
      }
      return { cols, label: 'Q' + (Math.floor(m0 / 3) + 1) + ' ' + y };
    }
  }

  function highlight (text, q) {
    if (!q) return text;
    const re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    return text.replace(re, '<mark>$1</mark>');
  }

  function ganttPopulateCategoryFilter () {
    const sel = document.getElementById('ganttCatFilter');
    if (!sel) return;
    const cats  = [...new Set(ganttAssets.map(a => a.cat))].sort();
    const first = sel.options[0];
    sel.innerHTML = '';
    sel.appendChild(first);
    cats.forEach(c => {
      const o = document.createElement('option');
      o.value = o.textContent = c;
      sel.appendChild(o);
    });
  }

  function getFiltered () {
    const q   = (document.getElementById('ganttSearch')?.value    || '').trim().toLowerCase();
    const cat = document.getElementById('ganttCatFilter')?.value   || '';
    const st  = document.getElementById('ganttStatusFilter')?.value || '';
    const tp  = document.getElementById('ganttTypeFilter')?.value   || '';

    return ganttAssets.filter(a => {
      const matchQ  = !q   || [a.name, a.id, a.cat, a.pic].some(f => f.toLowerCase().includes(q));
      const matchC  = !cat || a.cat  === cat;
      const matchT  = !tp  || a.type === tp;
      const matchSt = !st  || a.pms.some(p => p.st === st);
      return matchQ && matchC && matchT && matchSt;
    });
  }

  // ============================================================
  // RENDER
  // ============================================================

  function ganttRender () {
    const { cols, label } = getViewRange();

    const lbl = document.getElementById('ganttMonthLbl');
    if (lbl) lbl.textContent = label;

    // update label tab di header gantt
    const tabLbl = document.getElementById('ganttTabLabel');
    if (tabLbl) {
      tabLbl.textContent = ganttCurrentTab === 'during' ? 'Post Warranty' : 'During Warranty';
    }

    const q        = (document.getElementById('ganttSearch')?.value || '').trim().toLowerCase();
    const filtered = getFiltered();
    const pxDay    = ganttViewMode === 'month' ? 27 : 9;
    const info     = document.getElementById('ganttResultInfo');

    if (info) {
      info.textContent = filtered.length === ganttAssets.length
        ? ganttAssets.length + ' asset dipaparkan'
        : filtered.length + ' daripada ' + ganttAssets.length + ' asset ditemui';
    }

    const tbl = document.getElementById('ganttTable');
    if (!tbl) return;

    // ── HEADER ──
    let thead = '<thead><tr>';
    thead += '<th class="g-ac">Asset</th>';
    thead += '<th class="g-tc">Jenis PM</th>';
    cols.forEach((d, i) => {
      const isToday = sameDay(d, TODAY);
      const isMon   = d.getDay() === 1 && i > 0;
      const cls     = 'g-dc' + (isToday ? ' g-today' : '') + (isMon ? ' g-wsep' : '');
      const lbl2    = ganttViewMode === 'month'
        ? d.getDate()
        : (d.getDate() === 1 ? MONTHS_SHORT[d.getMonth()] : (d.getDate() % 5 === 0 ? d.getDate() : ''));
      thead += `<th class="${cls}" style="min-width:${pxDay}px"><span class="g-dn">${lbl2}</span></th>`;
    });
    thead += '</tr></thead>';

    // ── BODY ──
    let tbody = '<tbody>';
    if (filtered.length === 0) {
      tbody += `<tr><td colspan="${cols.length + 2}" class="gantt-no-result">Tiada asset untuk tab ini.</td></tr>`;
    } else {
      filtered.forEach(a => {
        const hn = highlight(a.name, q);
        const hi = highlight(a.id + ' · ' + a.cat, q);
        const hp = highlight(a.pic, q);

        tbody += '<tr>';
        tbody += `<td class="g-ac-cell"><div class="g-an">${hn}</div><div class="g-ai">${hi} &nbsp;|&nbsp; ${hp}</div></td>`;
        tbody += `<td class="g-tc-cell"><span class="g-tbadge" style="${TYPE_COLORS[a.type] || 'background:#f0f0f0;color:#444'}">${a.type}</span></td>`;

        cols.forEach((d, i) => {
          const isToday = sameDay(d, TODAY);
          const isMon   = d.getDay() === 1 && i > 0;
          const cc      = 'g-bc' + (isToday ? ' g-today' : '') + (isMon ? ' g-wsep' : '');
          let barHtml   = '';

          a.pms.forEach(pm => {
            if (sameDay(d, pm.s)) {
              const dur = Math.max(1, Math.round((pm.e - pm.s) / 86400000) + 1);
              const w   = dur * pxDay - 4;
              const cls = STATUS_CLASS[pm.st] || 'gb-plan';
              const sl  = STATUS_LABEL[pm.st] || '';
              barHtml += `<div class="gantt-bar ${cls}" style="width:${w}px"
                data-n="${a.name.replace(/"/g,"'")}"
                data-s="${sl}"
                data-d="${fmtDate(pm.s)} – ${fmtDate(pm.e)}"
                data-dur="${dur} hari"
                data-p="${a.pic}">
                ${dur >= 4 ? sl : ''}
              </div>`;
            }
          });

          tbody += `<td class="${cc}" style="position:relative">${barHtml}</td>`;
        });

        tbody += '</tr>';
      });
    }
    tbody += '</tbody>';

    tbl.innerHTML = thead + tbody;
    ganttBindTooltips(tbl);
  }

  // ============================================================
  // TOOLTIP
  // ============================================================

  function ganttBindTooltips (tbl) {
    const tip = document.getElementById('ganttTooltip');
    if (!tip) return;

    tbl.querySelectorAll('.gantt-bar').forEach(bar => {
      bar.addEventListener('mouseenter', function () {
        tip.innerHTML = `
          <b>${this.dataset.n}</b>
          <div class="gt-row"><span>Status</span><span>${this.dataset.s}</span></div>
          <div class="gt-row"><span>Tarikh</span><span>${this.dataset.d}</span></div>
          <div class="gt-row"><span>Tempoh</span><span>${this.dataset.dur}</span></div>
          <div class="gt-row"><span>Pegawai</span><span>${this.dataset.p}</span></div>`;

        const r  = this.getBoundingClientRect();
        const wr = (document.querySelector('.gantt-section') || document.body).getBoundingClientRect();
        tip.style.display = 'block';
        tip.style.left    = Math.max(0, r.left - wr.left) + 'px';
        tip.style.top     = (r.top - wr.top - 90) + 'px';
      });
      bar.addEventListener('mouseleave', () => { tip.style.display = 'none'; });
    });
  }

  // ============================================================
  // EXPORT EXCEL
  // ============================================================

  function ganttExport () {
    if (typeof XLSX === 'undefined') {
      alert('XLSX library tidak dimuatkan. Tambah CDN SheetJS dalam HTML.');
      return;
    }

    const filtered = getFiltered();
    const tabName  = ganttCurrentTab === 'during' ? 'Post Warranty' : 'During Warranty';
    const rows     = [['No. Asset','Nama Asset','Kategori','Jenis PM','Pegawai',
                       'Tarikh Mula','Tarikh Tamat','Tempoh (Hari)','Status']];

    filtered.forEach(a => {
      a.pms.forEach(pm => {
        const dur = Math.max(1, Math.round((pm.e - pm.s) / 86400000) + 1);
        rows.push([a.id, a.name, a.cat, a.type, a.pic,
                   fmtDate(pm.s), fmtDate(pm.e), dur, STATUS_LABEL[pm.st] || pm.st]);
      });
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [12,22,14,14,12,16,16,14,16].map(w => ({ wch: w }));

    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r: 0, c })];
      if (cell) cell.s = { font: { bold: true }, fill: { fgColor: { rgb: 'B5D4F4' } } };
    }

    const summary = [
      ['Laporan Eksport PPM — ' + tabName],
      ['Tarikh Eksport',  fmtDate(TODAY)],
      ['Tab',             tabName],
      ['Jumlah Asset',    filtered.length],
      ['Jumlah Rekod PM', rows.length - 1]
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(summary);
    ws2['!cols'] = [{ wch: 28 }, { wch: 20 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, 'Jadual PPM', ws);
    XLSX.utils.book_append_sheet(wb, 'Ringkasan', ws2);

    XLSX.writeFile(wb, `Jadual_PPM_${tabName.replace(/ /g,'_')}_Export.xlsx`);
  }

  // ============================================================
  // BIND CONTROLS
  // ============================================================

  function ganttBindControls () {
    document.getElementById('ganttPrev')?.addEventListener('click', () => { ganttViewOff--; ganttRender(); });
    document.getElementById('ganttNext')?.addEventListener('click', () => { ganttViewOff++; ganttRender(); });

    document.getElementById('ganttViewSel')?.addEventListener('change', function () {
      ganttViewMode = this.value;
      ganttViewOff  = 0;
      ganttRender();
    });

    document.getElementById('ganttExportBtn')?.addEventListener('click', ganttExport);
    document.getElementById('ganttSearch')?.addEventListener('input', ganttRender);
    document.getElementById('ganttCatFilter')?.addEventListener('change', ganttRender);
    document.getElementById('ganttStatusFilter')?.addEventListener('change', ganttRender);
    document.getElementById('ganttTypeFilter')?.addEventListener('change', ganttRender);
  }

  // ============================================================
  // PUBLIC API
  // Dipanggil dari ppm.js apabila tab bertukar
  // ============================================================

  /**
   * ganttSwitchTab('during') atau ganttSwitchTab('post')
   * Dipanggil dari showDuring() dan showPost() dalam ppm.js
   */
  window.ganttSwitchTab = function (tab) {
    ganttFilterByTab(tab);
    ganttViewOff = 0;

    // reset semua filter
    ['ganttSearch','ganttCatFilter','ganttStatusFilter','ganttTypeFilter'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });

    ganttRender();
  };

  // Paksa reload data dari API (jika ada update)
  window.ganttRefresh = async function () {
    await ganttLoadAssets();
    ganttRender();
  };

})();
