// ===================== DICAS RÁPIDAS =====================
(function initTips(){
  const tips = [
    "Use sempre EPI ao manipular materiais.",
    "Cheque a validade antes de usar medicamentos.",
    "Confirme o código/etiqueta do item antes de registrar.",
    "Higienize as mãos antes e após a retirada.",
    "Guarde corretamente após o uso para evitar perdas."
  ];

  const viewport = document.querySelector('.tips-panel .tips-viewport');
  const prevBtn  = document.querySelector('.tips-panel .tip-prev');
  const nextBtn  = document.querySelector('.tips-panel .tip-next');
  const dotsBox  = document.querySelector('.tips-panel .tips-dots');
  if(!viewport || !prevBtn || !nextBtn || !dotsBox) return;

  dotsBox.innerHTML = tips.map(() => '<i></i>').join('');
  const dots = Array.from(dotsBox.querySelectorAll('i'));

  let idx = 0, timer = null, paused = false;

  function render(){
    viewport.innerHTML = `<p class="tip-line">${tips[idx]}</p>`;
    dots.forEach((d,i)=> d.classList.toggle('active', i===idx));
  }
  function next(){ idx = (idx + 1) % tips.length; render(); }
  function prev(){ idx = (idx - 1 + tips.length) % tips.length; render(); }
  function startAuto(){ clearInterval(timer); timer = setInterval(()=>{ if(!paused) next(); }, 5000); }

  nextBtn.addEventListener('click', () => { next(); startAuto(); });
  prevBtn.addEventListener('click', () => { prev(); startAuto(); });
  dots.forEach((dot, i) => dot.addEventListener('click', () => { idx = i; render(); startAuto(); }));

  viewport.addEventListener('mouseenter', () => paused = true);
  viewport.addEventListener('mouseleave', () => paused = false);
  viewport.addEventListener('focusin',   () => paused = true);
  viewport.addEventListener('focusout',  () => paused = false);

  render(); startAuto();
})();


// ===================== CATÁLOGO + FILTRO =====================
// Disponibiliza globalmente para o carrinho:
(function initItemsAndFilter(){
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const IMG = (name) => `../assets/img/${name}`;

  // 4 itens por categoria
  const ITEMS = [
    // EPI
    { id:"EPI-001", name:"Luva látex M",         tag:"7845-LLM", cat:"EPI",          img: IMG("luva-latex.jpg.jpg") },
    { id:"EPI-002", name:"Máscara cirúrgica",    tag:"3322-MSC", cat:"EPI",          img: IMG("mascara-cirurgica.jpg.jpg") },
    { id:"EPI-003", name:"Avental descartável",  tag:"9012-AVT", cat:"EPI",          img: IMG("avental-descartavel.jpg") },
    { id:"EPI-004", name:"Óculos de proteção",   tag:"2201-OCP", cat:"EPI",          img: IMG("oculos-protecao.jpg") },
    // Descartáveis
    { id:"DESC-005", name:"Gaze estéril",        tag:"1140-GZE", cat:"Descartáveis", img: IMG("gaze-esteril.jpg.jpg") },
    { id:"DESC-006", name:"Seringa 5ml",         tag:"9381-SRG", cat:"Descartáveis", img: IMG("seringa-desc.jpg") },
    { id:"DESC-007", name:"Agulha 25x7",         tag:"5521-AGL", cat:"Descartáveis", img: IMG("agulha-25x7.jpg") },
    { id:"DESC-008", name:"Algodão hidrof.",     tag:"4402-ALH", cat:"Descartáveis", img: IMG("algodao-hidrof2.jpg") },
    // Higiene
    { id:"HIG-010", name:"Álcool 70%",           tag:"5590-ALC", cat:"Higiene",      img: IMG("alcool-70.jpg.jpg") },
    { id:"HIG-011", name:"Sabonete líquido",     tag:"3309-SBL", cat:"Higiene",      img: IMG("sabonete-liquido.jpg") },
    { id:"HIG-012", name:"Papel toalha",         tag:"6611-PPT", cat:"Higiene",      img: IMG("papel-toalha.jpg") },
    { id:"HIG-013", name:"Toalha descartável",   tag:"7712-TLD", cat:"Higiene",      img: IMG("toalha-descartavel.jpg") },
    // Farmácia
    { id:"FAR-020", name:"Dipirona 500mg",       tag:"1120-DIP", cat:"Farmácia",     img: IMG("dipirona.jpg") },
    { id:"FAR-021", name:"Paracetamol 750mg",    tag:"1180-PAR", cat:"Farmácia",     img: IMG("paracetamol.jpg") },
    { id:"FAR-022", name:"Soro fisiológico",     tag:"2001-SOR", cat:"Farmácia",     img: IMG("soro-fisiologico.jpg") },
    { id:"FAR-023", name:"Adrenalina",           tag:"3009-ADR", cat:"Farmácia",     img: IMG("adrenalina.jpg") },
    // Limpeza
    { id:"LIM-030", name:"Detergente enzim.",    tag:"7711-DTZ", cat:"Limpeza",      img: IMG("detergente-enzimatico.jpg") },
    { id:"LIM-031", name:"Hipoclorito",          tag:"6610-HPC", cat:"Limpeza",      img: IMG("hipoclorito.jpg") },
    { id:"LIM-032", name:"Álcool em gel",        tag:"5591-ALG", cat:"Limpeza",      img: IMG("alcool-70-2.jpg") },
    { id:"LIM-033", name:"Desinfetante",         tag:"8801-DSF", cat:"Limpeza",      img: IMG("desinfetante.jpg") },
    // Diversos
    { id:"DIV-040", name:"Termômetro",           tag:"5101-TRM", cat:"Diversos",     img: IMG("termometro.jpg") },
    { id:"DIV-041", name:"Estetoscópio",         tag:"5102-EST", cat:"Diversos",     img: IMG("estetoscopio.jpg") },
    { id:"DIV-042", name:"Esfigmomanômetro",     tag:"5103-ESF", cat:"Diversos",     img: IMG("esfigmomanometro.jpg") },
    { id:"DIV-043", name:"Tesoura cirúrgica",    tag:"5104-TCR", cat:"Diversos",     img: IMG("tesoura-cirurgica.jpg") },
  ];
  // expõe para outros módulos
  window.ITEMS = ITEMS;

  const grid  = document.querySelector("#itemsGrid") || document.querySelector(".items-grid");
  const catBar = document.querySelector("#categoryBar") || document.querySelector(".categories");
  if(!grid || !catBar) return;

  function card(it){
    return `
      <article class="item-card" data-code="${it.id}" data-cat="${it.cat}">
        <img src="${it.img}" alt="${it.name}" class="item-card-img" onerror="this.style.opacity=.15">
        <div class="item-card-body">
          <h4>${it.name}</h4>
          <small>Cód. ${it.id} • Etiqueta: ${it.tag}</small>
          <div class="item-card-actions">
            <button class="btn-primary" data-act="retirar" data-id="${it.id}">Retirar</button>
            <button class="btn-ghost" data-act="detalhes" data-id="${it.id}">Detalhes</button>
          </div>
        </div>
      </article>`;
  }
  function render(cat="all"){
    const list = (cat==="all") ? ITEMS : ITEMS.filter(i => i.cat === cat);
    grid.innerHTML = list.map(card).join("");
  }

  // troca de categoria (usa data-cat nos botões)
  catBar.addEventListener("click", (ev)=>{
    const btn = ev.target.closest(".category");
    if(!btn) return;
    $$(".category", catBar).forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    render(btn.dataset.cat || "all");
  });

  // ações nos cards (sem alert agora)
  grid.addEventListener("click", (ev)=>{
    const btn = ev.target.closest("button[data-act]");
    if(!btn) return;
    const id  = btn.dataset.id;
    const act = btn.dataset.act;
    if(act==="detalhes"){
      console.log("Detalhes do item:", id);
    }
  });

  render("all");
})();


// ===================== NOTIFICAÇÕES (SINO) =====================
(function initNotifications(){
  const $  = (s, r=document) => r.querySelector(s);

  const btn     = $("#bellBtn");
  const badge   = $("#bellBadge");
  const pop     = $("#notifPopover");
  const listEl  = $("#notifList");
  const clearBt = $("#notifClear");
  if (!btn || !pop) return;

  const KEY = "dasaNotifs";
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
  const save = (arr) => localStorage.setItem(KEY, JSON.stringify(arr));
  let items = load();

  function formatDateTime(iso){
    const d = iso ? new Date(iso) : new Date();
    const dd = String(d.getDate()).padStart(2,"0");
    const mm = String(d.getMonth()+1).padStart(2,"0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2,"0");
    const min = String(d.getMinutes()).padStart(2,"0");
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  }

  function render(){
    const n = items.length;
    if (n>0){ badge.textContent = n; badge.hidden = false; }
    else { badge.hidden = true; }

    if (n === 0){
      listEl.innerHTML = `<li class="notif-item"><b>Sem notificações</b><time>—</time></li>`;
      return;
    }
    listEl.innerHTML = items.slice().reverse().map(nf => `
      <li class="notif-item">
        <b>${nf.title}</b>
        <div>${nf.text}</div>
        <time datetime="${nf.at}">${formatDateTime(nf.at)}</time>
      </li>
    `).join("");
  }

  function addNotification(title, text){
    items.push({ title, text, at: new Date().toISOString() });
    if (items.length > 50) items = items.slice(items.length - 50);
    save(items); render();
    badge.animate([{transform:'scale(1)'},{transform:'scale(1.2)'},{transform:'scale(1)'}], {duration:250, easing:'ease-out'});
  }

  // expõe globalmente para o carrinho usar
  window.DASA_NOTIFY = { add: addNotification };

  function toggle(){
    pop.classList.toggle("open");
    pop.setAttribute("aria-hidden", pop.classList.contains("open") ? "false" : "true");
  }
  btn.addEventListener("click", (e)=>{ e.stopPropagation(); toggle(); });
  document.addEventListener("click", (e)=>{
    if (!pop.contains(e.target) && !btn.contains(e.target)) {
      pop.classList.remove("open");
      pop.setAttribute("aria-hidden","true");
    }
  });

  clearBt.addEventListener("click", ()=>{ items = []; save(items); render(); });

  render();
})();


// ===================== HISTÓRICO – API =====================
window.DASA_HISTORY = (function(){
  const KEY = 'dasaHistory';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
  const save = (arr) => localStorage.setItem(KEY, JSON.stringify(arr));
  const add  = (record) => { const arr = load(); arr.push(record); save(arr); return arr; };
  const all  = () => load();
  const clear= () => save([]);
  return { add, all, clear };
})();


// ===================== CARRINHO (CADERNINHO) =====================
(function initCart(){
  const $  = (s, r=document) => r.querySelector(s);

  const btnOpen   = $("#cartBtn");
  const badge     = $("#cartBadge");
  const drawer    = $("#cartDrawer");
  const closeBtn  = $("#cartClose");
  const backdrop  = $("#cartBackdrop");
  const listEl    = $("#cartList");
  const countEl   = $("#cartCount");
  const clearBtn  = $("#cartClear");
  const submitBtn = $("#cartSubmit");
  if(!btnOpen || !drawer) return;

  const CATALOG = window.ITEMS || [];

  const KEY = "dasaCart";
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
  const save = (obj) => localStorage.setItem(KEY, JSON.stringify(obj));

  let cart = load();
  const totalCount = () => Object.values(cart).reduce((a,b)=>a+b, 0);

  function updateBadge(){
    const n = totalCount();
    if (n > 0){ badge.textContent = n; badge.hidden = false; }
    else { badge.hidden = true; }
  }
  function findItem(id){ return CATALOG.find(i => i.id === id); }

  function renderCart(){
    const ids = Object.keys(cart);
    if (ids.length === 0){
      listEl.innerHTML = `<p class="tip-line">Nenhum item ainda. Use “Retirar” nos cards.</p>`;
      countEl.textContent = "0"; updateBadge(); return;
    }
    listEl.innerHTML = ids.map(id => {
      const it = findItem(id) || {name:id, tag:"", id};
      const qty = cart[id];
      return `
        <div class="cart-item" data-id="${id}">
          <div class="ci-info">
            <b>${it.name}</b>
            <small>${it.id}${it.tag ? " • Etiqueta: "+it.tag : ""}</small>
          </div>
          <div class="ci-qty">
            <button class="ci-dec" title="Diminuir">−</button>
            <input class="ci-input" type="number" min="1" value="${qty}">
            <button class="ci-inc" title="Aumentar">+</button>
          </div>
          <button class="ci-del">Remover</button>
        </div>`;
    }).join("");
    countEl.textContent = String(totalCount());
    updateBadge();
  }

  function openDrawer(){ drawer.classList.add("open"); drawer.setAttribute("aria-hidden","false"); backdrop.hidden = false; }
  function closeDrawer(){ drawer.classList.remove("open"); drawer.setAttribute("aria-hidden","true");  backdrop.hidden = true; }

  btnOpen.addEventListener("click", openDrawer);
  closeBtn.addEventListener("click", closeDrawer);
  backdrop.addEventListener("click", closeDrawer);

  listEl.addEventListener("click", (ev)=>{
    const itemEl = ev.target.closest(".cart-item");
    if(!itemEl) return;
    const id = itemEl.dataset.id;

    if (ev.target.classList.contains("ci-del")){
      delete cart[id]; save(cart); renderCart(); return;
    }
    if (ev.target.classList.contains("ci-inc")){
      cart[id] = (cart[id] || 1) + 1; save(cart); renderCart(); return;
    }
    if (ev.target.classList.contains("ci-dec")){
      cart[id] = Math.max(1, (cart[id] || 1) - 1); save(cart); renderCart(); return;
    }
  });
  listEl.addEventListener("change", (ev)=>{
    const input = ev.target.closest(".ci-input");
    if(!input) return;
    const id = ev.target.closest(".cart-item")?.dataset.id;
    let v = parseInt(input.value, 10);
    if (!Number.isFinite(v) || v < 1) v = 1;
    cart[id] = v; save(cart); renderCart();
  });

  clearBtn.addEventListener("click", ()=>{ cart = {}; save(cart); renderCart(); });

  // >>> REGISTRAR: grava histórico + notifica
  submitBtn.addEventListener("click", ()=>{
    const qtd = totalCount();
    if (!qtd){ alert("Nenhum item para registrar."); return; }

    // monta os itens do registro
    const itemsArray = Object.keys(cart).map(id => {
      const it = findItem(id) || { name: id, tag:"" };
      return { id, name: it.name, tag: it.tag || "", qty: cart[id] };
    });

    // salva no histórico
    const record = { at: new Date().toISOString(), total: qtd, items: itemsArray };
    window.DASA_HISTORY.add(record);

    // notificação
    if (window.DASA_NOTIFY) {
      const preview = itemsArray.slice(0,4).map(i=>`${i.id}×${i.qty}`).join(", ");
      window.DASA_NOTIFY.add("Retirada registrada", preview || `${qtd} item(ns)`);
    }

    // limpa carrinho
    cart = {}; save(cart); renderCart(); closeDrawer();
  });

  // integração com botões "Retirar"
  const grid = document.querySelector("#itemsGrid") || document.querySelector(".items-grid");
  if (grid){
    grid.addEventListener("click", (ev)=>{
      const btn = ev.target.closest('button[data-act="retirar"]');
      if(!btn) return;
      const id = btn.dataset.id;
      cart[id] = (cart[id] || 0) + 1; save(cart); renderCart();
      badge.animate([{transform:'scale(1)'},{transform:'scale(1.2)'},{transform:'scale(1)'}], {duration:250, easing:'ease-out'});
    });
  }

  renderCart();
})();


// ===================== DRAWER: ÚLTIMAS RETIRADAS =====================
(function initHistoryDrawer(){
  const $  = (s, r=document) => r.querySelector(s);

  const openBtn   = $("#historyBtn");
  const drawer    = $("#historyDrawer");
  const closeBtn  = $("#histClose");
  const backdrop  = $("#historyBackdrop");
  const listEl    = $("#histList");
  const exportBtn = $("#histExport");
  const clearBtn  = $("#histClear");
  if(!openBtn || !drawer) return;

  function fmtDate(iso){
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2,"0");
    const mm = String(d.getMonth()+1).padStart(2,"0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2,"0");
    const mi = String(d.getMinutes()).padStart(2,"0");
    return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
  }

  function render(){
    const data = window.DASA_HISTORY.all();
    if (data.length === 0){
      listEl.innerHTML = `<li class="hist-item"><header><b>Sem retiradas ainda</b></header></li>`;
      return;
    }
    listEl.innerHTML = data.slice().reverse().map(rec => {
      const items = rec.items.map(i =>
        `<li>${i.qty} × ${i.name} <span class="hist-meta">(${i.id}${i.tag ? " • "+i.tag : ""})</span></li>`
      ).join("");
      return `
        <li class="hist-item">
          <header>
            <b>${fmtDate(rec.at)}</b>
            <span class="hist-meta">${rec.total} item(ns)</span>
          </header>
          <ul class="hist-items">${items}</ul>
        </li>`;
    }).join("");
  }

  function open(){ drawer.classList.add("open"); drawer.setAttribute("aria-hidden","false"); backdrop.hidden = false; render(); }
  function close(){ drawer.classList.remove("open"); drawer.setAttribute("aria-hidden","true");  backdrop.hidden = true; }

  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  backdrop.addEventListener("click", close);

  clearBtn.addEventListener("click", ()=>{
    if (confirm("Limpar todo o histórico?")) {
      window.DASA_HISTORY.clear();
      render();
    }
  });

  // Exportar CSV
  exportBtn.addEventListener("click", ()=>{
    const data = window.DASA_HISTORY.all();
    if (!data.length){ alert("Sem registros para exportar."); return; }

    const lines = [["Data","Total","ItemID","ItemNome","Etiqueta","Qtd"]];
    data.forEach(rec => {
      rec.items.forEach(i => {
        lines.push([fmtDate(rec.at), rec.total, i.id, i.name, i.tag || "", i.qty]);
      });
    });
    const csv = lines.map(row => row.map(cell => {
      const s = String(cell ?? "");
      return /[",;\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
    }).join(";")).join("\n");

    const blob = new Blob([csv], {type:"text/csv;charset=utf-8"});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "historico_retiradas.csv";
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  });
})();

// ===================== BUSCA GLOBAL (topo) =====================
(function initGlobalSearch(){
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  const input   = $("#globalSearch");
  const grid    = $("#itemsGrid");
  const catBar  = $("#categoryBar");
  const ITEMS   = window.ITEMS || [];

  if (!input || !grid || !catBar || !ITEMS.length) return;

  // helper: qual categoria está ativa?
  const getActiveCat = () => (catBar.querySelector(".category.active")?.dataset.cat) || "all";

  // mesmo card do catálogo
  const card = (it) => `
    <article class="item-card" data-code="${it.id}" data-cat="${it.cat}">
      <img src="${it.img}" alt="${it.name}" class="item-card-img" onerror="this.style.opacity=.15">
      <div class="item-card-body">
        <h4>${it.name}</h4>
        <small>Cód. ${it.id} • Etiqueta: ${it.tag}</small>
        <div class="item-card-actions">
          <button class="btn-primary" data-act="retirar" data-id="${it.id}">Retirar</button>
          <button class="btn-ghost"  data-act="detalhes" data-id="${it.id}">Detalhes</button>
        </div>
      </div>
    </article>`;

  // debounce para não filtrar a cada tecla
  const debounce = (fn, ms=200) => {
    let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  };

  // filtra respeitando a categoria ativa
  function runSearch(){
    const qRaw = (input.value || "").trim().toLowerCase();
    const cat  = getActiveCat();

    // base = todos ou só a categoria ativa
    let base = (cat === "all") ? ITEMS : ITEMS.filter(i => i.cat === cat);

    if (!qRaw){
      // sem termo: render padrão da categoria ativa
      grid.innerHTML = base.map(card).join("");
      return;
    }

    // busca por termos (suporta múltiplas palavras)
    const terms = qRaw.split(/\s+/).filter(Boolean);
    const match = (it) => {
      const hay = `${it.name} ${it.id} ${it.tag}`.toLowerCase();
      // precisa conter TODOS os termos
      return terms.every(t => hay.includes(t));
    };

    const list = base.filter(match);

    grid.innerHTML = list.length
      ? list.map(card).join("")
      : `<p class="tip-line">Nenhum resultado para <b>"${qRaw}"</b> em <b>${cat}</b>.</p>`;
  }

  // ligações
  input.addEventListener("input", debounce(runSearch, 200));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      runSearch();
      // rola até os itens (qualquer coisinha de UX)
      grid.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  // quando trocar de categoria, refaz a busca atual
  catBar.addEventListener("click", (ev) => {
    if (ev.target.closest(".category")) runSearch();
  });

  // primeira avaliação (caso tenha valor salvo pelo navegador)
  runSearch();
})();

// ===== LOGOUT =====
(function initLogout(){
  const logoutBtn = document.querySelector('.profile .icon-btn[aria-label="Sair"]');
  if(!logoutBtn) return;

  logoutBtn.addEventListener("click", ()=>{
    // limpa dados do localStorage (se quiser que o carrinho/histórico sejam resetados)
    localStorage.removeItem("dasaCart");
    localStorage.removeItem("dasaNotifs");
    localStorage.removeItem("dasaHistory"); // se você estiver guardando histórico

    // redireciona para login
    window.location.href = "../index.html"; 
  });
})();
