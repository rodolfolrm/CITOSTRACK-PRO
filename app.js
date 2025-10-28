(function(){
  const tbody = document.getElementById("tbody");
  const tPrep = document.getElementById("tPrep");
  const tAdm  = document.getElementById("tAdm");
  const tMin  = document.getElementById("tMin");
  const tIcc  = document.getElementById("tIcc");

  document.getElementById("btnAdd").addEventListener("click", addRow);
  document.getElementById("btnRem").addEventListener("click", removeRows);
  document.getElementById("btnLimpiar").addEventListener("click", () => { tbody.innerHTML=""; calcAll(); });
  document.getElementById("btnPDF").addEventListener("click", buildReportAndPrint);

  const logoInput = document.getElementById("i_logo");
  const logoImg   = document.getElementById("logoPreview");
  const rLogo     = document.getElementById("rLogo");
  if (logoInput){
    logoInput.addEventListener("change", e=>{
      const f = e.target.files && e.target.files[0];
      if(!f) return;
      const r = new FileReader();
      r.onload = () => { logoImg.src = r.result; rLogo.src = r.result; };
      r.readAsDataURL(f);
    });
  }
  rLogo.src = logoImg.src;

  function toNum(v){
    const n = parseFloat(String(v).replace(/[^\d.-]/g,"").trim());
    return isNaN(n) ? 0 : n;
  }

  /* Semana ISO más estable para reportes */
  function isoWeekNumber(date){
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  function weekFromDateStr(fechaStr){
    if(!fechaStr) return "";
    const d = new Date(fechaStr);
    if (isNaN(d)) return "";
    return isoWeekNumber(d);
  }

  function addRow(){
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input type="checkbox" aria-label="seleccionar fila"></td>
      <td contenteditable="true" spellcheck="false"></td>
      <td contenteditable="true" spellcheck="false"></td>
      <td><input type="date" class="fecha"></td>
      <td class="semana"></td>
      <td contenteditable="true" class="prep" inputmode="decimal"></td>
      <td contenteditable="true" class="adm"  inputmode="decimal"></td>
      <td contenteditable="true" class="min"  inputmode="decimal"></td>
      <td class="icc"></td>
      <td contenteditable="true" class="obs"></td>
    `;
    tbody.appendChild(tr);

    tr.querySelectorAll(".prep,.adm,.min").forEach(el=>{
      el.addEventListener("input", enforceNumeric);
      el.addEventListener("input", calcAll);
      el.addEventListener("blur",  calcAll);
    });
    tr.querySelector(".fecha").addEventListener("input", calcAll);
    calcAll();
  }

  function enforceNumeric(e){
    const el = e.target;
    el.textContent = el.textContent.replace(/[^\d.,-]/g,"");
  }

  function removeRows(){
    [...tbody.querySelectorAll("tr")].forEach(r=>{
      const cb = r.querySelector('input[type="checkbox"]');
      if (cb && cb.checked) r.remove();
    });
    calcAll();
  }

  function calcAll(){
    let totalPrep=0, totalAdm=0, totalMin=0;
    let sumIcc=0, iccRows=0;

    [...tbody.rows].forEach(r=>{
      const prep = toNum(r.querySelector(".prep")?.textContent ?? 0);
      const adm  = toNum(r.querySelector(".adm")?.textContent ?? 0);
      const min  = toNum(r.querySelector(".min")?.textContent ?? 0);
      const fStr = r.querySelector(".fecha")?.value ?? "";
      const semanaCell = r.querySelector(".semana");
      const iccCell = r.querySelector(".icc");

      const w = weekFromDateStr(fStr);
      if (semanaCell) semanaCell.textContent = w || "";

      const icc = (min > 0) ? ((prep + adm) / min) : null;
      iccCell.textContent = (icc !== null) ? icc.toFixed(2) : "";

      if (prep || adm || min){
        totalPrep += prep;
        totalAdm  += adm;
        totalMin  += min;
        if (icc !== null){ sumIcc += icc; iccRows++; }
      }
    });

    tPrep.textContent = totalPrep;
    tAdm.textContent  = totalAdm;
    tMin.textContent  = totalMin;
    tIcc.textContent  = iccRows ? (sumIcc/iccRows).toFixed(2) : "0.00";
  }

  function formatNow(){
    const d = new Date();
    const dd = String(d.getDate()).padStart(2,"0");
    const mm = String(d.getMonth()+1).padStart(2,"0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2,"0");
    const mi = String(d.getMinutes()).padStart(2,"0");
    return `${dd}-${mm}-${yyyy} ${hh}:${mi}`;
  }

  function getDataRows(){
    const rows = [];
    [...tbody.rows].forEach(r=>{
      const nombre = (r.cells[1]?.textContent || "").trim();
      const rut    = (r.cells[2]?.textContent || "").trim();
      const fechaI = r.querySelector(".fecha")?.value || "";
      const fecha  = fechaI ? new Date(fechaI) : null;
      const semana = r.querySelector(".semana")?.textContent || "";
      const prep   = toNum(r.querySelector(".prep")?.textContent ?? 0);
      const adm    = toNum(r.querySelector(".adm")?.textContent ?? 0);
      const min    = toNum(r.querySelector(".min")?.textContent ?? 0);
      const icc    = (min>0) ? ((prep+adm)/min) : null;
      const obs    = (r.querySelector(".obs")?.textContent || "").trim();

      rows.push({
        nombre, rut,
        fechaStr: fecha ? `${String(fecha.getDate()).padStart(2,"0")}-${String(fecha.getMonth()+1).padStart(2,"0")}-${fecha.getFullYear()}` : "",
        semana, prep, adm, min, icc, obs
      });
    });
    return rows;
  }

  function buildReportAndPrint(){
    calcAll();
    const rows = getDataRows();

    // KPIs
    document.getElementById("kPrep").textContent = document.getElementById("tPrep").textContent;
    document.getElementById("kAdm").textContent  = document.getElementById("tAdm").textContent;
    document.getElementById("kMin").textContent  = document.getElementById("tMin").textContent;
    document.getElementById("kIcc").textContent  = document.getElementById("tIcc").textContent;

    // Meta (fecha/hora)
    document.getElementById("rMeta").textContent = "Informe generado: " + formatNow();

    // Logo en reporte
    document.getElementById("rLogo").src = document.getElementById("logoPreview").src;

    // Tabla reporte
    const rBody = document.getElementById("rBody");
    rBody.innerHTML = "";
    let Tprep=0, Tadm=0, Tmin=0, Sicc=0, Ricc=0;

    rows.forEach(row=>{
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="t-left wrap">${escapeHTML(row.nombre)}</td>
        <td class="t-center nowrap">${escapeHTML(row.rut)}</td>
        <td class="t-center nowrap">${row.fechaStr}</td>
        <td class="t-center nowrap">${row.semana || ""}</td>
        <td class="t-right  nowrap">${fmtInt(row.prep)}</td>
        <td class="t-right  nowrap">${fmtInt(row.adm)}</td>
        <td class="t-right  nowrap">${fmtInt(row.min)}</td>
        <td class="t-right  nowrap">${row.icc !== null ? row.icc.toFixed(2) : ""}</td>
        <td class="t-left wrap">${escapeHTML(row.obs)}</td>
      `;
      rBody.appendChild(tr);

      if (row.prep || row.adm || row.min){
        Tprep += row.prep|0; Tadm += row.adm|0; Tmin += row.min|0;
        if (row.icc !== null){ Sicc += row.icc; Ricc++; }
      }
    });

    document.getElementById("rtPrep").textContent = fmtInt(Tprep);
    document.getElementById("rtAdm").textContent  = fmtInt(Tadm);
    document.getElementById("rtMin").textContent  = fmtInt(Tmin);
    document.getElementById("rtIcc").textContent  = Ricc ? (Sicc/Ricc).toFixed(2) : "0.00";

    window.print();
  }

  function fmtInt(n){
    const x = parseInt(n,10);
    return isNaN(x) ? "0" : String(x);
  }

  function escapeHTML(s){
    return String(s).replace(/[&<>"']/g, m=>(
      m==="&"?"&amp;":m==="<"?"&lt;":m===">"?"&gt;":m==='"'?"&quot;":"&#39;"
    ));
  }

  // Fila inicial
  addRow();
})();