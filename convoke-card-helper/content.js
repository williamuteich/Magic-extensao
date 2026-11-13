(() => {
  const ID_RE = /card-images\/cards\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/;
  const SITE_PANE = ".card-text-pane.overlay"; // caixinha de texto (em inglês) que o site mostra no zoom
  const OURS = "#cch-panel, #cch-side, #cch-settings";

  let panel, side, sideBody, msgsEl, modelSel, inputEl, sendBtn, fab, settingsEl;
  let dismissed = null;     // { dialog, id } da carta cujos painéis o usuário fechou
  let mode = null;          // null | "card" | "free"
  let freeOpen = false;     // chat geral aberto pelo botão flutuante
  let currentId = null;     // carta exibida (id da impressão no Scryfall)
  let currentData = null;   // dados da carta exibida
  let zoom = null;          // { dialog, img } do zoom atual
  let chatKey = "free";
  let busy = false;
  const histories = new Map(); // chatKey -> [{role, content, error?}]
  let cfg = { list: [], settings: {} };
  let cfgReady;

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Markdown simples: **negrito**, *itálico*, `código`, títulos, listas e quebras de linha
  function md(text) {
    return esc(text)
      .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
      .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<i>$2</i>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/^#{1,6}\s*(.+)$/gm, "<b>$1</b>")
      .replace(/^\s*[-*]\s+/gm, "• ")
      .replace(/\n/g, "<br>");
  }

  // ---------------- Mana ----------------
  const COLOR_PT = { W: "branca", U: "azul", B: "preta", R: "vermelha", G: "verde", C: "incolor" };
  function symbolsHtml(text) {
    return esc(text || "").replace(/\{([^}]+)\}/g, (_, s) => {
      const k = /^[WUBRGC]$/.test(s) ? s : /^\d+$|^X$/.test(s) ? "N" : s === "T" ? "T" : "H";
      return `<span class="cch-mana cch-m-${k}">${s === "T" ? "↷" : s}</span>`;
    });
  }
  function manaExplain(cost) {
    if (!cost) return null;
    let generic = 0, x = false;
    const colors = {};
    for (const [, s] of cost.matchAll(/\{([^}]+)\}/g)) {
      if (/^\d+$/.test(s)) generic += +s;
      else if (s === "X") x = true;
      else colors[s] = (colors[s] || 0) + 1;
    }
    const parts = [];
    if (generic) parts.push(`${generic} de qualquer cor`);
    for (const [c, n] of Object.entries(colors)) {
      parts.push(COLOR_PT[c] ? `${n} ${COLOR_PT[c]}${n > 1 ? "s" : ""}` : `${n}× {${c}} (híbrida/especial)`);
    }
    if (x) parts.push("X (você escolhe ao conjurar)");
    const total = generic + Object.values(colors).reduce((a, b) => a + b, 0);
    return `Você paga ${parts.join(" + ")}. Valor de mana: ${total}${x ? " + X" : ""}.`;
  }

  // ---------------- Glossário (sem IA) ----------------
  function keywordsFor(face) {
    const seen = new Set();
    const out = [];
    const me = manaExplain(face.mana_cost);
    if (me) out.push(["Custo de mana", me]);
    for (const [re, name, desc, scope] of window.MTG_GLOSSARY) {
      if (seen.has(name)) continue;
      const src = scope === "type" ? face.type_line : face.oracle_text;
      if (src && new RegExp(re, "i").test(src)) { seen.add(name); out.push([name, desc]); }
    }
    return out;
  }

  // ---------------- Detecção do zoom ----------------
  // Zoom = diálogo mostrando UMA carta. Diálogos com várias cartas diferentes
  // (mulligan, escolher cartas, grimório etc.) não contam.
  function findZoom() {
    for (const d of document.querySelectorAll('[role="dialog"]')) {
      if (d.closest(OURS)) continue;
      let first = null;
      const ids = new Set();
      for (const img of d.querySelectorAll("img")) {
        if (img.closest(OURS)) continue;
        const m = img.src.match(ID_RE);
        if (!m) continue;
        ids.add(m[1]);
        if (!first) first = { dialog: d, img, id: m[1] };
      }
      if (first && ids.size <= 2) return first; // 2 = carta de duas faces
    }
    return null;
  }

  // Retângulo do "cartão" do zoom (maior ancestral da imagem que não ocupa a tela toda)
  function cardRect(img, dialog) {
    let best = img.getBoundingClientRect();
    for (let e = img.parentElement; e && e !== dialog; e = e.parentElement) {
      const r = e.getBoundingClientRect();
      if (r.width > window.innerWidth * 0.7 || r.height > window.innerHeight * 0.98) break;
      best = r;
    }
    return best;
  }

  // ---------------- Isolamento de eventos ----------------
  function isolate(el) {
    // Impede que cliques/teclas cheguem ao jogo (atalhos, fechar o zoom, arrastar etc.)
    for (const t of ["keydown", "keyup", "keypress", "mousedown", "mouseup", "pointerdown", "pointerup",
                     "click", "dblclick", "wheel", "contextmenu", "touchstart", "touchend"]) {
      el.addEventListener(t, (e) => e.stopPropagation());
    }
  }
  for (const t of ["focusin", "focusout"]) {
    window.addEventListener(t, (e) => {
      const ours = (n) => n && n.closest && n.closest(OURS);
      if (ours(e.target) || ours(e.relatedTarget)) e.stopImmediatePropagation();
    }, true);
  }

  // ---------------- Construção ----------------
  function build() {
    // Painel esquerdo: informações da carta (substitui a caixinha em inglês do site)
    side = document.createElement("div");
    side.id = "cch-side";
    side.className = "cch-root";
    side.innerHTML = `<button type="button" class="cch-icon cch-side-close" data-act="dismiss" title="Fechar (Esc)">✕</button>
      <div class="cch-side-body"></div>`;
    sideBody = side.querySelector(".cch-side-body");
    side.addEventListener("click", (e) => { if (e.target.closest('[data-act="dismiss"]')) dismiss(); });
    document.body.appendChild(side);
    isolate(side);

    // Esc fecha os painéis da carta (sem fechar o zoom do site)
    window.addEventListener("keydown", (e) => {
      if (e.key !== "Escape" || mode !== "card") return;
      if (settingsEl && settingsEl.style.display !== "none") return;
      e.stopImmediatePropagation(); e.preventDefault();
      dismiss();
    }, true);

    // Painel direito: chat com IA
    panel = document.createElement("div");
    panel.id = "cch-panel";
    panel.className = "cch-root";
    panel.innerHTML = `
      <div class="cch-chat-head">
        <span class="cch-chat-title">Pergunte à IA</span>
        <div class="cch-head-btns">
          <button class="cch-icon" data-act="settings" title="Configurações">⚙</button>
          <button class="cch-icon" data-act="clear" title="Limpar conversa">🗑</button>
          <button class="cch-icon" data-act="close" title="Fechar chat">✕</button>
        </div>
      </div>
      <label class="cch-model-label">Modelo
        <select class="cch-model" title="Modelo do OpenRouter"></select>
      </label>
      <div class="cch-msgs"></div>
      <div class="cch-quick"></div>
      <form class="cch-form">
        <textarea rows="2" placeholder="Pergunte sobre a carta ou as regras…"></textarea>
        <button type="submit">Enviar</button>
      </form>`;
    document.body.appendChild(panel);
    isolate(panel);

    msgsEl = panel.querySelector(".cch-msgs");
    modelSel = panel.querySelector(".cch-model");
    inputEl = panel.querySelector("textarea");
    sendBtn = panel.querySelector(".cch-form button");

    panel.querySelector(".cch-form").addEventListener("submit", (e) => { e.preventDefault(); send(inputEl.value); });
    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(inputEl.value); }
    });
    panel.addEventListener("click", onAction);
    modelSel.addEventListener("change", () => chrome.runtime.sendMessage({ type: "setModel", model: modelSel.value }));

    // Botão flutuante: chat geral (sem carta) / reabrir chat no zoom
    fab = document.createElement("button");
    fab.id = "cch-fab";
    fab.title = "Chat de regras (IA)";
    fab.textContent = "🧙";
    isolate(fab);
    fab.addEventListener("click", () => {
      freeOpen = !freeOpen;
      if (mode === "card") return;
      freeOpen ? showFree() : hide();
    });
    document.body.appendChild(fab);

    cfgReady = loadModels();
    chrome.storage.onChanged.addListener((c) => {
      if (c.provider || c.orModel || c.orKey || c.orFreeOnly || c.orModels || c.gqKey || c.gqModel || c.gqModels) loadModels();
    });
  }

  function onAction(e) {
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act === "settings") openSettings();
    if (act === "clear" && !busy) { histories.set(chatKey, []); renderMsgs(); }
    if (act === "close") {
      if (mode === "free") { freeOpen = false; hide(); }
      else { panel.style.display = "none"; panel.dataset.closed = "1"; }
    }
    const q = e.target.closest("[data-q]")?.dataset.q;
    if (q) send(q);
  }

  async function loadModels() {
    const res = await chrome.runtime.sendMessage({ type: "models" });
    if (!res || !res.ok) {
      modelSel.innerHTML = `<option value="">(erro ao carregar modelos)</option>`;
      return;
    }
    cfg = { list: res.list, settings: res.settings };
    const s = res.settings;
    const shown = res.list.filter((m) => !s.freeOnly || m.free || m.id === s.model);
    const tag = (m) => (s.provider === "openrouter" && m.free ? " (grátis)" : "");
    modelSel.innerHTML =
      (s.model ? "" : `<option value="">— escolha um modelo —</option>`) +
      shown.map((m) => `<option value="${esc(m.id)}">${esc(m.name)}${tag(m)}</option>`).join("");
    modelSel.value = s.model || "";
    modelSel.title = "Modelo do " + s.providerName;
    panel.dataset.nokey = s.hasKey ? "" : "1";
    renderMsgs();
  }

  // ---------------- Posicionamento ----------------
  const attach = (el, host) => { if (el.parentElement !== host) host.appendChild(el); };
  const margin = 12, gap = 16;

  // Chat à direita da carta
  function placeChat(rect) {
    const room = window.innerWidth - rect.right - gap - margin;
    const w = room >= 320 ? Math.min(440, room) : Math.min(400, window.innerWidth - 2 * margin);
    const x = room >= 320 ? rect.right + gap : window.innerWidth - w - margin;
    const top = Math.max(margin, Math.min(rect.top, window.innerHeight - 480));
    const h = Math.min(window.innerHeight - top - margin, Math.max(rect.height, 480));
    Object.assign(panel.style, { left: x + "px", top: top + "px", width: w + "px", height: h + "px" });
  }

  // Informações à esquerda da carta, no lugar da caixinha do site
  function placeSide(rect) {
    const sp = document.querySelector(SITE_PANE);
    const spr = sp && sp.getBoundingClientRect();
    const right = rect.left - gap;
    let left = spr && spr.width ? spr.left : margin;
    let w = Math.min(460, right - left);
    if (w < 300) { left = Math.max(margin, right - 340); w = right - left; }
    if (w < 240) { left = margin; w = Math.min(380, window.innerWidth - 2 * margin); } // tela estreita: sobrepõe
    const top = spr && spr.height ? spr.top : Math.max(margin, rect.top);
    Object.assign(side.style, {
      left: left + "px", top: top + "px", width: w + "px", maxHeight: window.innerHeight - top - margin + "px",
    });
  }

  function placeFree() {
    const w = Math.min(420, window.innerWidth - 24);
    Object.assign(panel.style, {
      left: window.innerWidth - w - 16 + "px", top: "16px", width: w + "px",
      height: Math.min(640, window.innerHeight - 100) + "px",
    });
  }

  // ---------------- Modos ----------------
  function setZoomClass(on) { document.documentElement.classList.toggle("cch-zoom", on); }

  function hide() {
    panel.style.display = "none";
    side.style.display = "none";
    attach(panel, document.body);
    attach(side, document.body);
    setZoomClass(false);
    mode = null; currentId = null; currentData = null; zoom = null;
  }

  function showFree() {
    side.style.display = "none";
    attach(side, document.body);
    attach(panel, document.body);
    setZoomClass(false);
    mode = "free"; currentId = null; currentData = null; zoom = null;
    delete panel.dataset.closed;
    panel.style.display = "flex";
    switchChat("free");
    placeFree();
    inputEl.focus();
  }

  function showCard(z) {
    zoom = z;
    // Dentro do modal: fica acima do fundo escuro e clicar não fecha o zoom
    attach(side, z.dialog);
    attach(panel, z.dialog);
    const rect = cardRect(z.img, z.dialog);
    placeSide(rect);           // mede a caixinha do site antes de escondê-la
    setZoomClass(true);
    side.style.display = "block";
    panel.style.display = panel.dataset.closed ? "none" : "flex";
    placeChat(rect);
    if (mode === "card" && z.id === currentId) return;
    mode = "card"; currentId = z.id; currentData = null;
    sideBody.innerHTML = '<div class="cch-sub">Carregando…</div>';
    switchChat("card:" + z.id);
    const id = z.id;
    chrome.runtime.sendMessage({ type: "card", id }, (res) => {
      if (currentId !== id) return;
      if (!res || !res.ok) {
        sideBody.innerHTML = '<div class="cch-sub">Não foi possível carregar esta carta.</div>';
        return;
      }
      currentData = res.data;
      renderInfo(res.data);
      switchChat("card:" + res.data.oracleId); // histórico por carta, mesmo trocando de edição
    });
  }

  function renderInfo(data) {
    const faces = data.faces
      .map((f) => {
        const kws = keywordsFor(f);
        return `<div class="cch-face">
          <div class="cch-title">
            <h3>${esc(f.name_pt)}</h3>
            <span class="cch-cost">${symbolsHtml(f.mana_cost)}</span>
          </div>
          <div class="cch-typeline">
            <span>${esc(f.type_pt)}</span>
            ${f.pt ? `<span class="cch-pt">${esc(f.pt)}</span>` : ""}
          </div>
          ${f.name_pt !== f.name ? `<div class="cch-sub">${esc(f.name)}</div>` : ""}
          <div class="cch-box">
            <div class="cch-text">${symbolsHtml(f.text_pt || "—")}</div>
            <div class="cch-tag">${f.text_pt_official ? "✓ Texto oficial em português" : "Tradução automática"}</div>
          </div>
          <details><summary>Texto original (inglês)</summary><div class="cch-text cch-orig">${symbolsHtml(f.oracle_text)}</div></details>
          ${kws.length ? `<h4>Termos e regras desta carta</h4><div class="cch-kws">` +
            kws.map(([n, d]) => `<div class="cch-kw"><b>${esc(n)}</b><span>${symbolsHtml(d)}</span></div>`).join("") + `</div>` : ""}
        </div>`;
      })
      .join("");
    const rul = data.rulingsPt.length
      ? `<h4>Esclarecimentos oficiais</h4><div class="cch-kws">` +
        data.rulingsPt.map((r) => `<div class="cch-kw cch-ruling">${symbolsHtml(r)}</div>`).join("") + `</div>`
      : "";
    sideBody.innerHTML = faces + rul;
    side.scrollTop = 0;
  }

  // Fecha os painéis desta carta. Voltam ao abrir outra carta ou ao reabrir o zoom.
  function dismiss() {
    if (zoom) dismissed = { dialog: zoom.dialog, id: zoom.id };
    hide();
  }

  // ---------------- Chat ----------------
  const EMPTY = "O modelo não retornou texto (alguns modelos gratuitos gastam tudo \"pensando\"). Tente de novo ou troque de modelo.";
  function stream(messages, model, onDelta, onEnd, onThinking) {
    const port = chrome.runtime.connect({ name: "chat" });
    let ended = false, got = false;
    const end = (err) => {
      if (ended) return; ended = true;
      try { port.disconnect(); } catch (_) {}
      onEnd(err || (got ? null : EMPTY));
    };
    port.onMessage.addListener((m) => {
      if (m.delta) { got = true; onDelta(m.delta); }
      else if (m.thinking) onThinking && onThinking();
      else if (m.error) end(m.error);
      else if (m.done) end(null);
    });
    port.onDisconnect.addListener(() => end(null));
    port.postMessage({ messages, model });
  }

  function switchChat(key) {
    chatKey = key;
    if (!histories.has(key)) histories.set(key, []);
    panel.querySelector(".cch-chat-title").textContent = key === "free" ? "Chat de regras (IA)" : "Pergunte sobre esta carta";
    renderMsgs();
  }

  function quickButtons() {
    const qs = chatKey === "free"
      ? ["Como funciona a pilha (stack)?", "Quais são as fases de um turno?", "Como funciona o dano de comandante?"]
      : ["Explique essa carta de forma simples", "Quando e como devo usar?", "Quais combos/interações ela tem?", "Como os oponentes podem responder?"];
    return qs.map((q) => `<button type="button" data-q="${esc(q)}">${esc(q)}</button>`).join("");
  }

  function renderMsgs() {
    if (!panel) return;
    const h = histories.get(chatKey) || [];
    if (panel.dataset.nokey) {
      msgsEl.innerHTML = `<div class="cch-note">Para usar o chat, configure sua chave do ${esc(cfg.settings.providerName || "provedor de IA")}.
        <button type="button" data-act="settings" class="cch-link">Abrir configurações</button></div>`;
    } else if (!h.length) {
      msgsEl.innerHTML = `<div class="cch-empty"><div class="cch-empty-ico">💬</div>
        ${chatKey === "free" ? "Tire dúvidas sobre regras do Magic." : "Tire dúvidas sobre esta carta: como funciona, quando usar, interações…"}</div>`;
    } else {
      msgsEl.innerHTML = h
        .map((m) => `<div class="cch-msg cch-${m.error ? "error" : m.role}">${
          m.role === "user" ? esc(m.content).replace(/\n/g, "<br>") : md(m.content) || '<span class="cch-dots">…</span>'
        }</div>`)
        .join("");
    }
    panel.querySelector(".cch-quick").innerHTML = h.length || panel.dataset.nokey ? "" : quickButtons();
    msgsEl.scrollTop = msgsEl.scrollHeight;
    sendBtn.disabled = busy;
  }

  function systemPrompt(data) {
    let p =
      "Você é um juiz e especialista em Magic: The Gathering ajudando um jogador durante uma partida online de Commander (EDH). " +
      "Responda SEMPRE em português do Brasil, de forma clara, didática e objetiva (prefira respostas curtas, com exemplos práticos). " +
      "Ao citar cartas ou termos, use o nome em português e o original em inglês entre parênteses. " +
      "Baseie-se nas regras oficiais (Comprehensive Rules) e, se não tiver certeza, diga isso em vez de inventar.";
    if (data) {
      const faces = data.faces.map((f) =>
        `Nome: ${f.name} (PT: ${f.name_pt})\nCusto: ${f.mana_cost || "-"}\nTipo: ${f.type_line}\n` +
        (f.pt ? `P/R ou lealdade: ${f.pt}\n` : "") + `Texto oficial (Oracle):\n${f.oracle_text}`
      ).join("\n---\n");
      p += `\n\nCarta em questão:\n${faces}`;
      if (data.rulings.length) p += `\n\nRulings oficiais:\n- ${data.rulings.join("\n- ")}`;
    }
    return p;
  }

  function send(text) {
    text = (text || "").trim();
    if (!text || busy) return;
    if (panel.dataset.nokey) { openSettings(); return; }
    const key = chatKey;
    const data = key === "free" ? null : currentData;
    const h = histories.get(key);
    h.push({ role: "user", content: text });
    const reply = { role: "assistant", content: "" };
    h.push(reply);
    inputEl.value = "";
    busy = true;
    renderMsgs();
    const messages = [
      { role: "system", content: systemPrompt(data) },
      ...h.filter((m) => m !== reply && !m.error).map(({ role, content }) => ({ role, content })),
    ];
    stream(messages, modelSel.value,
      (d) => {
        reply.content += d;
        if (chatKey === key) {
          const last = msgsEl.lastElementChild;
          if (last) last.innerHTML = md(reply.content);
          msgsEl.scrollTop = msgsEl.scrollHeight;
        }
      },
      (err) => {
        if (err) { reply.content = "⚠ " + err; reply.error = true; }
        busy = false;
        if (chatKey === key) renderMsgs();
      },
      () => {
        if (chatKey === key && !reply.content) {
          const last = msgsEl.lastElementChild;
          if (last) last.innerHTML = '<span class="cch-dots">pensando…</span>';
        }
      });
  }

  // ---------------- Modal de configurações (dentro da página) ----------------
  function openSettings() {
    if (!settingsEl) buildSettings();
    const host = (zoom && zoom.dialog.isConnected && zoom.dialog) || document.body;
    host.appendChild(settingsEl); // sempre por último = por cima
    settingsEl.style.display = "flex";
    fillSettings();
  }
  function closeSettings() { if (settingsEl) settingsEl.style.display = "none"; }

  function buildSettings() {
    settingsEl = document.createElement("div");
    settingsEl.id = "cch-settings";
    settingsEl.innerHTML = `
      <div class="cch-modal cch-root" role="document">
        <div class="cch-modal-head">
          <h3>Configurações da IA</h3>
          <button class="cch-icon" data-s="close" title="Fechar">✕</button>
        </div>
        <div class="cch-modal-body">
          <h4>Provedor</h4>
          <div class="cch-row">
            <select class="cch-in" data-f="provider">
              <option value="openrouter">OpenRouter (muitos modelos, alguns gratuitos)</option>
              <option value="groq">Groq (gratuito com limites, muito rápido)</option>
            </select>
          </div>

          <h4 data-f="keyTitle">Chave</h4>
          <div class="cch-sub" data-f="keyHelp"></div>
          <div class="cch-row">
            <input class="cch-in" data-f="key" type="password" autocomplete="off" spellcheck="false">
            <button class="cch-icon" data-s="toggle">Mostrar</button>
            <button class="cch-icon" data-s="test">Testar</button>
          </div>
          <div class="cch-sub" data-f="keyMsg"></div>

          <h4>Modelo</h4>
          <div class="cch-row">
            <input class="cch-in" data-f="search" type="text" placeholder="Buscar (llama, gemini, deepseek…)">
            <button class="cch-icon" data-s="refresh" title="Atualizar lista">↻</button>
          </div>
          <label class="cch-check" data-f="freeRow"><input type="checkbox" data-f="free"> Mostrar somente modelos gratuitos</label>
          <div class="cch-model-list" data-f="list"></div>
          <div class="cch-sub" data-f="listMsg"></div>
        </div>
        <div class="cch-modal-foot">
          <span class="cch-sub" data-f="saveMsg"></span>
          <button class="cch-btn" data-s="save">Salvar</button>
        </div>
      </div>`;
    isolate(settingsEl);
    const f = (n) => settingsEl.querySelector(`[data-f="${n}"]`);
    settingsEl.addEventListener("click", async (e) => {
      if (e.target === settingsEl) return closeSettings();
      const row = e.target.closest("[data-id]");
      if (row) { st.models[st.provider] = row.dataset.id; renderModelList(); return; }
      const a = e.target.closest("[data-s]")?.dataset.s;
      if (a === "close") closeSettings();
      if (a === "toggle") {
        const k = f("key"); k.type = k.type === "password" ? "text" : "password";
        e.target.textContent = k.type === "password" ? "Mostrar" : "Ocultar";
      }
      if (a === "test") {
        const m = f("keyMsg"); m.className = "cch-sub"; m.textContent = "Testando…";
        const r = await chrome.runtime.sendMessage({ type: "testKey", provider: st.provider, key: f("key").value.trim() });
        if (r.ok) {
          m.className = "cch-sub cch-ok"; m.textContent = r.text;
          if (st.provider === "groq") fetchList(true); // agora dá para listar os modelos
        } else { m.className = "cch-sub cch-err"; m.textContent = "Falhou: " + r.error; }
      }
      if (a === "refresh") fetchList(true);
      if (a === "save") {
        st.keys[st.provider] = f("key").value.trim();
        await chrome.storage.local.set({
          provider: st.provider,
          orKey: st.keys.openrouter,
          orModel: st.models.openrouter || "",
          gqKey: st.keys.groq,
          gqModel: st.models.groq || "",
          orFreeOnly: f("free").checked,
        });
        f("saveMsg").className = "cch-sub cch-ok"; f("saveMsg").textContent = "Salvo!";
        setTimeout(closeSettings, 600);
      }
    });
    f("provider").addEventListener("change", (e) => {
      st.keys[st.provider] = f("key").value.trim(); // guarda o que foi digitado antes de trocar
      st.provider = e.target.value;
      showProvider();
    });
    f("search").addEventListener("input", renderModelList);
    f("free").addEventListener("change", renderModelList);
  }

  // Estado do modal (não salvo até clicar em "Salvar").
  const st = { provider: "openrouter", keys: {}, models: {}, lists: {} };
  const PROV_UI = {
    openrouter: {
      title: "Chave do OpenRouter",
      help: `Crie em <a href="https://openrouter.ai/keys" target="_blank" rel="noopener">openrouter.ai/keys</a>. Fica salva só neste navegador.`,
      placeholder: "sk-or-v1-...",
      search: "Buscar (llama, gemini, deepseek…)",
    },
    groq: {
      title: "Chave do Groq",
      help: `Crie grátis em <a href="https://console.groq.com/keys" target="_blank" rel="noopener">console.groq.com/keys</a>. Fica salva só neste navegador. Plano gratuito tem limite por minuto/dia.`,
      placeholder: "gsk_...",
      search: "Buscar (llama, qwen, gpt-oss…)",
    },
  };

  async function fillSettings() {
    const s = await chrome.storage.local.get({ provider: "openrouter", orKey: "", orModel: "", gqKey: "", gqModel: "", orFreeOnly: true });
    const f = (n) => settingsEl.querySelector(`[data-f="${n}"]`);
    st.provider = PROV_UI[s.provider] ? s.provider : "openrouter";
    st.keys = { openrouter: s.orKey, groq: s.gqKey };
    st.models = { openrouter: s.orModel, groq: s.gqModel };
    st.lists = {};
    f("free").checked = s.orFreeOnly;
    f("saveMsg").textContent = "";
    await cfgReady;
    if (cfg.settings.provider === st.provider) st.lists[st.provider] = cfg.list;
    showProvider();
  }

  function showProvider() {
    const f = (n) => settingsEl.querySelector(`[data-f="${n}"]`);
    const ui = PROV_UI[st.provider];
    f("provider").value = st.provider;
    f("keyTitle").textContent = ui.title;
    f("keyHelp").innerHTML = ui.help;
    f("key").placeholder = ui.placeholder;
    f("key").value = st.keys[st.provider] || "";
    f("search").placeholder = ui.search;
    f("freeRow").style.display = st.provider === "groq" ? "none" : "";
    f("keyMsg").textContent = "";
    if (st.lists[st.provider]) renderModelList(); else fetchList(false);
    (f("key").value ? f("search") : f("key")).focus();
  }

  async function fetchList(force) {
    const f = (n) => settingsEl.querySelector(`[data-f="${n}"]`);
    const pid = st.provider;
    const key = f("key").value.trim();
    if (pid === "groq" && !key) {
      st.lists.groq = [];
      f("listMsg").textContent = "";
      f("list").innerHTML = `<div class="cch-note">Cole sua chave do Groq e clique em "Testar" para ver os modelos.</div>`;
      return;
    }
    f("listMsg").textContent = "Carregando modelos…";
    const r = await chrome.runtime.sendMessage({ type: "models", provider: pid, force, key: pid === "groq" ? key : undefined });
    if (pid !== st.provider) return; // usuário trocou de provedor enquanto carregava
    if (!r || !r.ok) {
      f("list").innerHTML = "";
      f("listMsg").textContent = "Erro ao carregar: " + (r?.error || "sem resposta");
      return;
    }
    st.lists[pid] = r.list;
    renderModelList();
  }

  function renderModelList() {
    const f = (n) => settingsEl.querySelector(`[data-f="${n}"]`);
    const all = st.lists[st.provider] || [];
    const q = f("search").value.trim().toLowerCase();
    const freeOnly = st.provider === "openrouter" && f("free").checked;
    const chosen = st.models[st.provider];
    const list = all.filter((m) =>
      (!freeOnly || m.free) && (!q || m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q)));
    const price = (m) => m.free ? `<span class="cch-badge cch-free">grátis</span>`
      : `<span class="cch-badge">$${m.inPrice.toFixed(2)} / $${m.outPrice.toFixed(2)} por 1M</span>`;
    const ctx = (n) => (n >= 1000 ? Math.round(n / 1000) + "k" : n) + " contexto";
    f("list").innerHTML = list.map((m) =>
      `<div class="cch-model-item${m.id === chosen ? " cch-sel" : ""}" data-id="${esc(m.id)}">
        <div><div class="cch-model-name">${esc(m.name)}</div><div class="cch-model-id">${esc(m.id)} · ${ctx(m.ctx)}</div></div>
        ${price(m)}
      </div>`).join("") || `<div class="cch-note">Nenhum modelo encontrado.</div>`;
    f("listMsg").textContent = `${list.length} de ${all.length} modelos.` +
      (chosen ? ` Selecionado: ${chosen}` : " Clique em um modelo para selecionar.");
    f("list").querySelector(".cch-sel")?.scrollIntoView({ block: "nearest" });
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === "openSettings") { if (!panel) build(); openSettings(); }
  });

  // ---------------- Loop de observação ----------------
  let raf = 0;
  const check = () => {
    raf = 0;
    if (!panel) build();
    let z = findZoom();
    if (z && dismissed && z.dialog === dismissed.dialog && z.id === dismissed.id) z = null; // usuário fechou
    else dismissed = null; // zoom fechado ou outra carta: painéis voltam a aparecer
    if (z) showCard(z);
    else if (mode === "card") {
      delete panel.dataset.closed;
      freeOpen ? showFree() : hide();
    }
    else if (mode === "free") placeFree();
    if (settingsEl && settingsEl.style.display !== "none" && !settingsEl.isConnected) document.body.appendChild(settingsEl);
  };
  new MutationObserver((muts) => {
    // ignora mutações feitas pela própria extensão (streaming de texto etc.)
    if (muts.every((m) => m.target.closest && m.target.closest(OURS))) return;
    if (!raf) raf = requestAnimationFrame(check);
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["src"] });
  window.addEventListener("resize", check);
  check();
})();
