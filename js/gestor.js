// ===== helpers =====
const $  = (s, r=document)=>r.querySelector(s);
const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));

function toast(msg, type="ok"){
  const host = $("#toasts"); if(!host) return;
  const el = document.createElement("div");
  el.className = "toast " + type;
  el.innerHTML = `<span class="title">${msg}</span><button class="close" aria-label="Fechar">×</button>`;
  host.appendChild(el);
  const close = ()=> el.remove();
  el.querySelector(".close").onclick = close;
  setTimeout(close, 5000);
}

function parseIntSafe(v){ const n=parseInt(String(v).replace(/[^\d-]/g,""),10); return Number.isFinite(n)?n:null; }
function parseDateBR(v){
  if(!v || v==="—" || v==="-" ) return null;
  const m = String(v).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if(!m) return null; const [_, dd, mm, yyyy] = m;
  return new Date(+yyyy, +mm-1, +dd);
}

// ===== regras visuais do estoque =====
function recalcStockStatus(){
  const table = $("#stockTable"); if(!table) return;
  $$("tbody tr", table).forEach(tr=>{
    tr.classList.remove("row-danger","row-warning");
    const tds = tr.children;
    const saldo = parseIntSafe(tds[3]?.textContent);
    const min   = parseIntSafe(tds[4]?.textContent);
    const validade = parseDateBR(tds[6]?.textContent.trim());
    const statusTd = tds[7];

    if(saldo!=null && min!=null && saldo < min){
      tr.classList.add("row-danger");
      if(statusTd) statusTd.textContent = "Crítico";
    }else if(validade){
      const diff = Math.ceil((validade - new Date())/(1000*60*60*24));
      if(diff <= 60){
        tr.classList.add("row-warning");
        if(statusTd && statusTd.textContent!=="Crítico") statusTd.textContent = "Venc. 60d";
      }else if(statusTd && (statusTd.textContent==="Crítico" || statusTd.textContent==="Venc. 60d")){
        statusTd.textContent = "OK";
      }
    }
  });
}

// ===== filtros =====
function applyFilters(){
  const cat = $("#fCat")?.value.toLowerCase();
  const status = $("#fStatus")?.value.toLowerCase();
  const rota = $("#fRota")?.value?.toLowerCase(); // (simulado na UI)
  const dval = $("#fDate")?.value ? new Date($("#fDate").value) : null;

  const table = $("#stockTable"); if(!table) return;

  $$("tbody tr", table).forEach(tr=>{
    const tds = tr.children;
    const rowCat = (tds[2]?.textContent||"").toLowerCase();
    const rowStatus = (tds[7]?.textContent||"").toLowerCase();
    const rowVal = parseDateBR(tds[6]?.textContent.trim());

    let show = true;
    if(cat && cat!=="todas" && !rowCat.includes(cat)) show=false;
    if(status && status!=="todos" && !rowStatus.includes(status)) show=false;
    if(dval && rowVal && rowVal > dval) show=false;

    tr.style.display = show ? "table-row" : "none";
  });

  recalcStockStatus();
}

// ===== exportar / imprimir =====
function exportCSV(tableEl, filename="export.csv"){
  const rows = $$("tr", tableEl).map(tr => Array.from(tr.children).map(td=>{
    const s = td.textContent.trim();
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
  }).join(";")).join("\n");
  const blob = new Blob([rows], {type:"text/csv;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}

function bindExportPrint(){
  $("#btnExport")?.addEventListener("click", ()=> exportCSV($("#movTable"), "movimentacoes.csv"));
  $("#btnExport2")?.addEventListener("click",()=> exportCSV($("#stockTable"), "estoque_atual.csv"));

  $("#btnPrint")?.addEventListener("click", ()=>{
    const src = $("#stockTable"); if(!src) return;
    const clone = src.cloneNode(true);
    $$("tbody tr", src).forEach((tr,i)=>{
      if(tr.style.display==="none") clone.tBodies[0].rows[i].remove();
    });
    const w = window.open("", "_blank");
    w.document.write(`<html><head><title>Imprimir</title>
      <style>
      body{font:14px system-ui;margin:24px;color:#0B1B3A}
      table{width:100%;border-collapse:collapse}
      th{background:#f1f6ff;text-align:left;border-bottom:1px solid #E6EEF8;padding:8px}
      td{border-bottom:1px solid #E6EEF8;padding:8px}
      .row-danger td{background:rgba(229,72,77,.06)}
      .row-warning td{background:rgba(255,193,7,.10)}
      @page{margin:12mm}
      </style></head><body>
      <h1>Estoque atual</h1>${clone.outerHTML}
      <script>window.onload=()=>{print();setTimeout(()=>close(),200)}<\/script>
      </body></html>`);
    w.document.close();
  });
}

// ===== feed tempo real (simulado) =====
function pushEvent(tipo, item, codigo, qtd, user){
  const host = $("#feed"); if(!host) return;
  const time = new Date().toLocaleTimeString().slice(0,5);
  const row = document.createElement("div");
  row.className = "event";
  row.innerHTML = `
    <span class="time">${time}</span>
    <div>
      <span class="tag ${tipo==='Saída'?'saida':'entrada'}">${tipo}</span>
      <b> ${item}</b> • ${codigo} • <b>${qtd>0?'+':''}${qtd}</b> • ${user}
    </div>`;
  host.prepend(row);
}

function simulateRealtime(){
  const items = [
    ["Luva látex M","EPI-001"],
    ["Álcool 70%","HIG-010"],
    ["Gaze estéril","DESC-007"],
    ["Máscara cirúrgica","EPI-002"]
  ];
  const users = ["Evellyn","Bruno","Larissa","João","Ana"];
  const tipo = Math.random()>.5? "Entrada":"Saída";
  const [item,cod] = items[Math.floor(Math.random()*items.length)];
  const qtd = (tipo==="Entrada"? +1:-1) * (10+(Math.random()*40|0));
  const user = users[Math.floor(Math.random()*users.length)];
  pushEvent(tipo, item, cod, qtd, user);

  const rows = $$("#stockTable tbody tr");
  const r = rows[Math.floor(Math.random()*rows.length)];
  if(r){
    const saldoCell = r.children[3];
    let saldo = parseIntSafe(saldoCell.textContent) || 0;
    saldo = Math.max(0, saldo + qtd);
    saldoCell.textContent = saldo;
    recalcStockStatus();
  }
  const kSaldo = $("#kpiSaldo");
  if(kSaldo){
    const n = parseInt((kSaldo.textContent||"").replace(/\D/g,'')) || 0;
    kSaldo.textContent = (n + qtd).toLocaleString("pt-BR");
  }
}


// ===== modal inventário =====
function bindInventoryModal(){
  const modal = $("#modal"); if(!modal) return;
  $("#btnNovoInv")?.addEventListener("click", ()=> modal.style.display="flex");
  $("#btnReprog")?.addEventListener("click", ()=> modal.style.display="flex");
  $("#mCancel")?.addEventListener("click", ()=> modal.style.display="none");
  $("#mSave")?.addEventListener("click", ()=>{
    const d=$("#invDate").value, t=$("#invTime").value, s=$("#invScope").value;
    modal.style.display="none";
    toast(`Inventário agendado: ${d} ${t} • ${s}`, "ok");
  });
}

// ===== notificações =====
function bindNotifications(){
  $("#btnNotify")?.addEventListener("click", ()=>{
    toast("Estoque crítico: Máscara cirúrgica (EPI-002)", "crit");
    toast("Excesso: Seringa 5ml (DESC-005)", "warn");
    toast("Itens próximos ao vencimento: 27", "ok");
  });
}

// ===== Colaboradores (mock + render) =====
const COLABS = [
  { id: "00210104", name: "Bruno Andrade",   unit: "Unidade Paulista", role: "Colaborador", email: "bruno@dasa.com",   status: "Ativo"   },
  { id: "00210105", name: "Larissa Santos",  unit: "Unidade Paulista", role: "Colaborador", email: "larissa@dasa.com", status: "Ativo"   },
  { id: "00210106", name: "Evellyn Silva",   unit: "Unidade Paulista", role: "Colaborador", email: "evellyn@dasa.com", status: "Ativo"   },
  { id: "00210107", name: "João Lima",       unit: "Unidade Centro",   role: "Colaborador", email: "joao@dasa.com",    status: "Inativo" },
  { id: "90000001", name: "Gestor(a) Paula", unit: "Unidade Paulista", role: "Gestor",      email: "paula@dasa.com",   status: "Ativo"   },
];

// --- lista para o select de responsáveis (somente ativos) ---
function populateRespSelect() {
  const sel = document.querySelector("#invResp");
  if (!sel) return;

  sel.innerHTML = `<option value="">Selecione…</option>`;
  COLABS
    .filter(c => c.status === "Ativo")                
    .sort((a,b)=> a.name.localeCompare(b.name))       
    .forEach(c => {
      const op = document.createElement("option");
      op.value = c.name;                              
      op.textContent = `${c.name} • ${c.unit}`;
      sel.appendChild(op);
    });

  const last = localStorage.getItem("dasaLastResp");
  if (last) sel.value = last;
}


function renderColabs() {
  const tb   = document.querySelector("#colabTable tbody");
  if (!tb) return;

  const q     = (document.querySelector("#colabSearch")?.value || "").toLowerCase().trim();
  const role  = (document.querySelector("#colabRole")?.value || "").toLowerCase();
  const stat  = (document.querySelector("#colabStatus")?.value || "").toLowerCase();

  const list = COLABS.filter(c => {
    const hay = `${c.name} ${c.unit} ${c.role} ${c.id}`.toLowerCase();
    if (q && !hay.includes(q)) return false;
    if (role && c.role.toLowerCase() !== role) return false;
    if (stat && c.status.toLowerCase() !== stat) return false;
    return true;
  });

  tb.innerHTML = list.length
    ? list.map(c => `
        <tr>
          <td>${c.name}</td>
          <td>${c.id}</td>
          <td>${c.unit}</td>
          <td>${c.role}</td>
          <td>${c.status}</td>
          <td>${c.email}</td>
        </tr>`).join("")
    : `<tr><td colspan="6">Nenhum colaborador encontrado.</td></tr>`;
}

function bindColabs() {
  const el1 = document.querySelector("#colabSearch");
  const el2 = document.querySelector("#colabRole");
  const el3 = document.querySelector("#colabStatus");
  if (!el1 || !el2 || !el3) return;

  el1.addEventListener("input",  renderColabs);
  el2.addEventListener("change", renderColabs);
  el3.addEventListener("change", renderColabs);

  renderColabs(); 
}


// ===== init =====
document.addEventListener("DOMContentLoaded", ()=>{
  recalcStockStatus();
  applyFilters();
  $("#filtros")?.addEventListener("submit", e=>{e.preventDefault(); recalcStockStatus(); applyFilters();});
  $("#filtros")?.addEventListener("change", ()=>{recalcStockStatus(); applyFilters();});
  $("#filtros")?.addEventListener("reset", ()=> setTimeout(()=>{recalcStockStatus(); applyFilters();},0));

  bindExportPrint();
  bindInventoryModal();
  bindNotifications();

  bindColabs();
  bindSearch();

  setInterval(simulateRealtime, 5000);
});

// ===== util: baixa um CSV em memória =====
function downloadCSV(filename, rows) {
  const csv = rows.map(r => r.map(c => {
    const s = String(c ?? "");
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
  }).join(";")).join("\n");
  const blob = new Blob([csv], {type:"text/csv;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function exportPlanilhaContagem(meta){
  const header = [
    ["Inventário - DASA"],
    [`Data;${meta?.data || "-"}`],
    [`Hora;${meta?.hora || "-"}`],
    [`Escopo;${meta?.escopo || "-"}`],
    [`Responsável;${meta?.responsavel || "-"}`],
    [""],
    ["Item","Código","Etiqueta","Qtd. Sistema","Qtd. Contada","Diferença","Obs."]
  ];

  const rowsEstoque = Array.from(document.querySelectorAll("#stockTable tbody tr"))
    .filter(tr => tr.style.display !== "none")
    .map(tr => {
      const t = tr.children;
      return [
        t[0]?.textContent.trim(), 
        t[1]?.textContent.trim(), 
        "",                        
        t[3]?.textContent.trim(), 
        "",                        
        "",                        
        ""                         
      ];
    });

  downloadCSV(`inventario_${(meta?.data||"").replaceAll("/","-") || "planilha"}.csv`, [
    ...header,
    ...rowsEstoque
  ]);
}

// ===== util: imprime o bloco de inventário =====
function printInventario(htmlContent){
  const w = window.open("", "_blank");
  w.document.write(`
    <html><head><title>Inventário</title>
      <style>
        body{font:14px system-ui;margin:24px;color:#0B1B3A}
        .title{font-weight:800;font-size:20px;margin-bottom:10px}
        .box{border:1px solid #E6EEF8;border-radius:12px;padding:12px}
      </style>
    </head><body>
      <div class="title">Inventários</div>
      <div class="box">${htmlContent}</div>
      <script>window.onload=()=>{print();setTimeout(()=>close(),200)}<\/script>
    </body></html>`);
  w.document.close();
}


// ============ INVENTÁRIOS (agenda + painel + export) ============
(function initInventarios(){
  const $  = (s, r=document)=>r.querySelector(s);
  const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));
  const inResp   = $("#invResp");
  populateRespSelect();

  const KEY = "dasaInventarios";
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
  const save = (arr) => localStorage.setItem(KEY, JSON.stringify(arr));

  const infoBox   = document.querySelector(".inventory .inventory-info");
  const btnNovo   = $("#btnNovoInv");
  const btnReprog = $("#btnReprog");

  const modal     = $("#modal");
  const inDate    = $("#invDate");
  const inTime    = $("#invTime");
  const inScope   = $("#invScope");
  const mCancel   = $("#mCancel");
  const mSave     = $("#mSave");

  if (!infoBox) return;

  let data = load();
  if (data.length === 0) {
    const dt = new Date(); dt.setDate(dt.getDate()+7); 
    data = [{
      id: crypto.randomUUID(),
      when: new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 18, 0, 0).toISOString(),
      scope: "EPI + Descartáveis",
      resp: "Bruno",
      status: "agendado" 
    }];
    save(data);
  }

  function formatDateTime(iso){
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2,"0");
    const mm = String(d.getMonth()+1).padStart(2,"0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2,"0");
    const mi = String(d.getMinutes()).padStart(2,"0");
    return { date:`${dd}/${mm}/${yyyy}`, time:`${hh}:${mi}` };
  }

  function nextInventory(){
    const now = Date.now();
    return data
      .filter(i => i.status !== "concluido")
      .sort((a,b)=> new Date(a.when)-new Date(b.when))
      .find(i => new Date(i.when).getTime() >= now) || null;
  }

  function renderCard(){
    const nxt = nextInventory();
    if (!nxt){
      infoBox.innerHTML = `
        <p><b>Sem inventários agendados.</b></p>
        <p><small>Use “Novo inventário” para agendar.</small></p>`;
      return;
    }
    const {date,time} = formatDateTime(nxt.when);

    const leftMs = new Date(nxt.when) - new Date();
    const days   = Math.max(0, Math.floor(leftMs / 86400000));
    const hours  = Math.max(0, Math.floor((leftMs % 86400000)/3600000));
    const mins   = Math.max(0, Math.floor((leftMs % 3600000)/60000));
    const badge  = leftMs > 0 ? ` • <small><b>${days}d ${hours}h ${mins}m</b></small>` : "";

    infoBox.innerHTML = `
      <p><b>Próximo inventário:</b> ${date} às ${time} • Responsável: <b>${nxt.resp || "-"}</b>${badge}</p>
      <p><small>Escopo: ${nxt.scope} • ${nxt.status === "agendado" ? "Contagem cega" : nxt.status}</small></p>
      <div style="display:flex; gap:8px; margin-top:8px;">
      <button class="btn-ghost" id="invExportBtn"><img class="icon" src="../assets/img/icon-export.svg.svg" alt=""> Exportar planilha de contagem</button>
      </div>
    `;

    const exportMeta = { data: date, hora: time, escopo: nxt.scope, responsavel: nxt.resp };
    $("#invExportBtn")?.addEventListener("click", ()=> exportPlanilhaContagem(exportMeta));
    $("#btnExport2")?.addEventListener("click", ()=> exportPlanilhaContagem(exportMeta));
    $("#btnPrint")?.addEventListener("click", ()=> printInventario(infoBox.outerHTML));

    if (leftMs > 0 && leftMs < 30*60*1000) {
      toast(`Inventário em ${Math.ceil(leftMs/60000)} minutos`, "warn");
    }
  }

  function openModal(prefill){
    modal.style.display = "flex";
    if (prefill){
      const d = new Date(prefill.when);
      inDate.value = d.toISOString().slice(0,10);
      inTime.value = `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
      inScope.value = prefill.scope;
      if (inResp) inResp.value = prefill.resp || localStorage.getItem("dasaLastResp") || "";
    } else {
      inDate.value = ""; inTime.value = ""; inScope.value = "EPI + Descartáveis";
      if (inResp) inResp.value = localStorage.getItem("dasaLastResp") || "";
    }
}

  function closeModal(){ modal.style.display = "none"; }

  btnNovo?.addEventListener("click", ()=> openModal(null));
  btnReprog?.addEventListener("click", ()=>{
    const nxt = nextInventory(); openModal(nxt || null);
  });
  mCancel?.addEventListener("click", closeModal);

  mSave?.addEventListener("click", ()=>{
  if (!inDate.value || !inTime.value){ toast("Informe data e hora.", "crit"); return; }

  const respSel = inResp ? inResp.value : "";
  if (!respSel){ toast("Selecione o responsável.", "crit"); return; }

  const [hh,mm] = inTime.value.split(":").map(Number);
  const d = new Date(inDate.value); d.setHours(hh||0, mm||0, 0, 0);

  localStorage.setItem("dasaLastResp", respSel);

  const nxt = nextInventory();
  if (nxt){
    nxt.when  = d.toISOString();
    nxt.scope = inScope.value;
    nxt.resp  = respSel;
    nxt.status = "agendado";
  } else {
    data.push({
      id: crypto.randomUUID(),
      when: d.toISOString(),
      scope: inScope.value,
      resp: respSel,
      status: "agendado"
    });
  }
  save(data);
  closeModal();
  renderCard();
  toast(`Inventário agendado: ${inDate.value} ${inTime.value} • ${inScope.value} • Resp.: ${respSel}`, "ok");
  });

  renderCard();
})();

// ===== notificações =====
function bindNotifications(){
  $("#btnNotify")?.addEventListener("click", ()=>{
    toast("⚠️ Máscara cirúrgica abaixo do mínimo (Qtd: 70 / Min: 120)", "crit");
    toast("⏳ Gaze estéril vence em 30 dias (30/11/2025)", "warn");
    toast("✅ Entrada de 120 unidades de Álcool 70% registrada por Bruno", "ok");
  });
}

// ===== busca rápida =====
function bindSearch(){
  const searchInput = $(".search input");
  if(!searchInput) return;

  searchInput.addEventListener("input", ()=>{
    const term = searchInput.value.toLowerCase();

    $$("#stockTable tbody tr").forEach(tr=>{
      const text = tr.textContent.toLowerCase();
      tr.style.display = text.includes(term) ? "" : "none";
    });

    $$("#movTable tbody tr").forEach(tr=>{
      const text = tr.textContent.toLowerCase();
      tr.style.display = text.includes(term) ? "" : "none";
    });

    $$("#collabList li").forEach(li=>{
      const text = li.textContent.toLowerCase();
      li.style.display = text.includes(term) ? "" : "none";
    });
  });
}

// ===== logout =====
function bindLogout(){
  $("#logoutBtn")?.addEventListener("click", ()=>{

    window.location.href = "../index.html"; 
  });
}

// dentro do DOMContentLoaded
document.addEventListener("DOMContentLoaded", ()=>{
  recalcStockStatus();
  applyFilters();
  bindExportPrint();
  bindInventoryModal();
  bindNotifications();
  bindSearch();
  bindLogout(); 

  populateRespSelect();

  bindColabs();
  bindSearch();
  bindLogout();
  setInterval(simulateRealtime, 5000);

});
