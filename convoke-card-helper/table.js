(() => {
  const C = window.CCH;
  if (!C) return;
  const { esc, isolate } = C;

  const SVG = {
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/>',
    rotate: '<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>',
    layers: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
    swords: '<path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="m13 19 6-6"/><path d="m16 16 4 4"/><path d="m19 21 2-2"/><path d="M14.5 6.5 18 3h3v3l-3.5 3.5"/><path d="m5 14 4 4"/><path d="m7 17-3 3"/><path d="m3 19 2 2"/>',
    plusCircle: '<circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><path d="m2 2 20 20"/>',
    expand: '<path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/>',
    scaling: '<path d="M21 3 9 15"/><path d="M12 3H3v18h18v-9"/><path d="M16 3h5v5"/><path d="M14 15H9v-5"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    ban: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
    crown: '<path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7z"/><path d="M5 20h14"/>',
    skull: '<circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><path d="M8 20v2h8v-2"/><path d="m12.5 17-.5-1-.5 1h1z"/><path d="M16 20a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20"/>',
    grid: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
    more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    swap: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
    cards: '<rect width="12" height="16" x="8" y="5" rx="2"/><path d="M4 17V5a2 2 0 0 1 2-2h8"/>',
    minus: '<path d="M5 12h14"/>',
    send: '<path d="M14.54 21.69a.5.5 0 0 0 .93-.03l6.5-19a.5.5 0 0 0-.64-.64l-19 6.5a.5.5 0 0 0-.03.93l7.93 3.18a2 2 0 0 1 1.11 1.11z"/><path d="m21.85 2.15-10.94 10.94"/>',
    user: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
  };
  const icon = (n) => `<svg class="cch-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SVG[n]}</svg>`;

  const ZONES = {
    field: { name: "Campo", short: "Campo", ico: "grid" },
    grave: { name: "Cemitério", short: "Cem", ico: "skull" },
    exile: { name: "Exílio", short: "Exí", ico: "ban" },
    cmd: { name: "Comandante", short: "Cmd", ico: "crown" },
  };
  const BAR_ORDER = ["grave", "exile", "cmd", "field"];
  const CARD_ZONES = ["field", "grave", "exile", "cmd"];
  const KW = [
    ["deathtouch", "Toque mortífero", "☠"],
    ["decayed", "Decomposto", "🧟"],
    ["double", "Duplo ataque", "⚔"],
    ["first", "Primeiro ataque", "🗡"],
    ["exalted", "Exaltado", "✨"],
    ["initiative", "Iniciativa", "🏰"],
    ["flying", "Voar", "🪶"],
    ["haste", "Ímpeto", "⚡"],
    ["hexproof", "Resistência à magia", "🌀"],
    ["indestructible", "Indestrutível", "💎"],
    ["lifelink", "Vínculo com a vida", "❤"],
    ["menace", "Ameaça", "👹"],
    ["reach", "Alcance", "🕸"],
    ["trample", "Atropelar", "🦶"],
    ["vigilance", "Vigilância", "👁"],
    ["shield", "Escudo", "🛡"],
    ["stun", "Atordoamento", "💫"],
    ["charge", "Carga", "🔋"],
    ["time", "Tempo", "⏳"],
    ["lore", "Conhecimento (saga)", "📜"],
    ["oil", "Óleo", "🛢"],
    ["loyalty", "Lealdade", "◆"],
  ];
  const KW_MAP = Object.fromEntries(KW.map(([k, n, i]) => [k, { name: n, ico: i }]));
  const TOKENS = [
    ["Tesouro", "treasure"], ["Pista", "clue"], ["Comida", "food"], ["Sangue", "blood"],
    ["Soldado", "soldier"], ["Zumbi", "zombie"], ["Espírito", "spirit"], ["Saprófita", "saproling"],
    ["Goblin", "goblin"], ["Tóptero", "thopter"], ["Anjo", "angel"], ["Dragão", "dragon"],
    ["Besta", "beast"], ["Elfo", "elf warrior"], ["Inseto", "insect"], ["Humano", "human"],
  ];
  const PT_EN = {
    tesouro: "treasure", pista: "clue", comida: "food", sangue: "blood", mapa: "map", soldado: "soldier",
    zumbi: "zombie", "espírito": "spirit", espirito: "spirit", "saprófita": "saproling", saprofita: "saproling",
    "tóptero": "thopter", toptero: "thopter", anjo: "angel", "dragão": "dragon", dragao: "dragon", besta: "beast",
    elfo: "elf", guerreiro: "warrior", inseto: "insect", humano: "human", "demônio": "demon", demonio: "demon",
    vampiro: "vampire", cavaleiro: "knight", gato: "cat", lobo: "wolf", ave: "bird", "pássaro": "bird",
    passaro: "bird", rato: "rat", cobra: "snake", "cidadão": "citizen", cidadao: "citizen", servo: "servo",
    "ilusão": "illusion", ilusao: "illusion", golem: "golem", elemental: "elemental", urso: "bear", polvo: "octopus",
  };

  const CARD_H = 0.18;
  const MIN_H = 0.05;
  const MAX_H = 0.6;
  const SCAN_WINDOW = 6000;
  const KEEP_DAYS = 7;

  let gameId = null;
  let state = null;
  let onMap = {};
  let saveT = 0;
  let lastScan = null;
  let zr = null;
  let zbar = null;
  let panel = null;
  let menu = null;
  let drag = null;
  let tapT = 0;
  let lastTap = null;
  let hoverUid = null;
  let dead = false;
  const asked = new Set();

  const rect = (e) => e.getBoundingClientRect();
  const clamp = (v) => Math.min(1, Math.max(0, v));
  const uidGen = () => Math.random().toString(36).slice(2, 10);
  const blank = () => ({ hidden: false, cards: [] });
  const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const sign = (n) => (n >= 0 ? "+" : "") + n;
  const alive = () => { try { return !!chrome.runtime?.id; } catch (_) { return false; } };
  const send = (msg, cb) => {
    try { chrome.runtime.sendMessage(msg, (r) => { void chrome.runtime.lastError; cb && cb(r); }); }
    catch (_) { cb && cb(null); }
  };
  const store = {
    get: async (k) => { try { return await chrome.storage.local.get(k); } catch (_) { return {}; } },
    set: (o) => { try { chrome.storage.local.set(o).catch(() => {}); } catch (_) {} },
    remove: (k) => { try { chrome.storage.local.remove(k).catch(() => {}); } catch (_) {} },
  };

  const gameOf = () => (location.pathname.match(/\/play\/([0-9a-f-]{36})/i) || [])[1] || null;

  async function loadGame(id) {
    gameId = id;
    state = null;
    closePanel();
    closeMenu();
    if (!id) return;
    const key = "tbl:" + id;
    const r = await store.get([key, "tblOn"]);
    if (gameId !== id) return;
    state = r[key] || { players: {} };
    onMap = r.tblOn || {};
    schedule();
    cleanup(key);
  }

  async function cleanup(current) {
    const all = await store.get(null);
    const old = Object.keys(all).filter((k) =>
      k.startsWith("tbl:") && k !== current && Date.now() - (all[k].at || 0) > KEEP_DAYS * 864e5);
    if (old.length) store.remove(old);
  }

  function save() {
    if (!state) return;
    state.at = Date.now();
    clearTimeout(saveT);
    const id = gameId, data = state;
    saveT = setTimeout(() => store.set({ ["tbl:" + id]: data }), 300);
    schedule();
  }

  const P = (name) => (state.players[name] ||= blank());
  const isOn = (name) => !!onMap[name];

  function setOn(name, v) {
    if (v) onMap[name] = true; else delete onMap[name];
    store.set({ tblOn: onMap });
    if (!v && panel && panel.player === name) closePanel();
    if (v) autoCommander(name);
    schedule();
  }

  function find(uid) {
    if (!state || !uid) return null;
    for (const [player, p] of Object.entries(state.players)) {
      const c = p.cards.find((c) => c.uid === uid);
      if (c) return { player, p, c };
    }
    return null;
  }

  function addCard(player, card, zone, pos) {
    const rec = {
      uid: uidGen(), id: card.id, img: card.img, name: card.name || "", type: card.type || "", pt: card.pt || "",
      zone, x: 0.5, y: 0.5, rot: 0, flip: false, qty: 1, plus: 0, pw: 0, tg: 0, gen: 0, kw: {}, ghost: false,
      token: !!card.token || /\btoken\b|\bficha\b/i.test(card.type || ""),
    };
    if (pos) Object.assign(rec, { x: pos.x, y: pos.y, flip: pos.flip });
    P(player).cards.push(rec);
    fillInfo(rec.uid);
    save();
    return rec;
  }

  function fillInfo(uid) {
    const f = find(uid);
    if (!f || asked.has(uid)) return;
    asked.add(uid);
    send({ type: "card", id: f.c.id }, (res) => {
      const g = find(uid);
      if (!g || !res || !res.ok) return;
      const fs = res.data.faces;
      Object.assign(g.c, {
        name: fs.map((x) => x.name_pt).join(" // "),
        type: fs[0].type_pt || fs[0].type_line || g.c.type,
        pt: fs[0].pt || g.c.pt,
        info: true,
      });
      save();
    });
  }

  const resetMods = (c) => Object.assign(c, { rot: 0, plus: 0, pw: 0, tg: 0, gen: 0, kw: {}, ghost: false });

  function moveCard(uid, zone, player) {
    const f = find(uid);
    if (!f) return;
    const { c } = f;
    f.p.cards.splice(f.p.cards.indexOf(c), 1);
    c.zone = zone;
    if (zone !== "field") resetMods(c);
    P(player || f.player).cards.push(c);
    save();
  }

  function act(uid, a) {
    const f = find(uid);
    if (!f) return;
    const c = f.c;
    if (a === "view") return openViewer(c);
    if (a === "tap") { c.rot = c.rot ? 0 : 90; return save(); }
    if (a === "ghost") { c.ghost = !c.ghost; return save(); }
    if (a === "del") { f.p.cards.splice(f.p.cards.indexOf(c), 1); return save(); }
    if (a === "dup") {
      f.p.cards.push({ ...c, kw: { ...c.kw }, uid: uidGen(), x: clamp(c.x + 0.04), y: clamp(c.y + 0.04), token: true });
      return save();
    }
    if (a === "swap") {
      return openSearch((s) => {
        const g = find(uid);
        if (!g) return;
        Object.assign(g.c, { id: s.id, img: s.img, name: s.name, type: s.type || "", pt: s.pt || "", info: false });
        asked.delete(uid);
        fillInfo(uid);
        save();
      }, "Ver / alterar edição");
    }
    if (ZONES[a]) moveCard(uid, a);
  }

  function autoCommander(name) {
    if (!state) return;
    const p = P(name);
    if (p.cmdAuto || p.cards.some((c) => c.zone === "cmd")) return;
    const T = tiles().find((x) => x.name === name);
    if (!T) return;
    const names = [...new Set([...T.t.querySelectorAll(".commander-name-part[title]")]
      .map((e) => e.title.trim()).filter(Boolean))];
    if (!names.length) return;
    p.cmdAuto = true;
    save();
    for (const n of names) {
      send({ type: "named", name: n }, (r) => {
        if (r && r.ok && state && state.players[name]) addCard(name, r.card, "cmd");
      });
    }
  }

  function ptInfo(c) {
    const m = /^(-?[\d*+X]+)\/(-?[\d*+X]+)$/.exec(c.pt || "");
    const dp = (c.plus || 0) + (c.pw || 0), dt = (c.plus || 0) + (c.tg || 0);
    const f = (b, d) => (/^-?\d+$/.test(b) ? String(Number(b) + d) : d ? b + sign(d) : b);
    const cls = dp > 0 || dt > 0 ? "cch-buff" : dp < 0 || dt < 0 ? "cch-debuff" : "";
    if (m) return { text: `${f(m[1], dp)}/${f(m[2], dt)}`, cls };
    if (/lealdade|loyalty/i.test(c.pt || "")) return { text: "◆" + c.pt.replace(/\D+/g, ""), cls: "" };
    if (dp || dt) return { text: `${sign(dp)}/${sign(dt)}`, cls };
    return null;
  }

  function tileInfo(t) {
    const nameEl = t.querySelector(".player-name span") || t.querySelector(".player-name");
    const name = nameEl && nameEl.textContent.trim();
    const frame = t.querySelector(".videoAspectFrame");
    const mw = t.querySelector(".mediaWrap");
    if (!name || !frame || !mw) return null;
    const v = t.querySelector("video");
    return { t, name, frame, mw, live: !!(v && v.videoWidth), flip: /flipped/.test(t.className) };
  }
  const tiles = () => [...document.querySelectorAll(".tileRoot")].map(tileInfo).filter(Boolean);

  window.addEventListener("pointerdown", (e) => {
    if (menu || panel) return;
    const mw = e.target.closest && e.target.closest(".mediaWrap");
    if (!mw || e.target.closest(".cch-tbl, .placed-card")) return;
    const T = tileInfo(mw.closest(".tileRoot") || mw);
    if (!T) return;
    const r = rect(T.frame);
    if (e.clientY < r.top || e.clientY > r.bottom || e.clientX < r.left || e.clientX > r.right) return;
    lastScan = {
      player: T.name, flip: T.flip, t: Date.now(),
      x: clamp((e.clientX - r.left) / r.width), y: clamp((e.clientY - r.top) / r.height),
    };
  }, true);

  let raf = 0, lastRun = 0, timer = 0;
  const schedule = () => { if (!raf && !dead) raf = requestAnimationFrame(render); };
  function poke() {
    const wait = 160 - (performance.now() - lastRun);
    if (wait <= 0) { lastRun = performance.now(); schedule(); }
    else if (!timer) timer = setTimeout(() => { timer = 0; lastRun = performance.now(); schedule(); }, wait);
  }

  function render() {
    raf = 0;
    if (dead) return;
    if (!alive()) {
      dead = true;
      document.querySelectorAll(".cch-tbl").forEach((e) => e.remove());
      return;
    }
    const g = gameOf();
    if (g !== gameId) {
      document.querySelectorAll(".cch-bar, .cch-layer").forEach((e) => e.remove());
      loadGame(g);
      return;
    }
    if (!state) return;
    for (const T of tiles()) {
      renderBar(T);
      renderLayer(T);
    }
    if (panel) renderPanel();
    if (menu) updateMenu();
    if (zr) renderZoomBar();
  }

  function renderBar(T) {
    const on = isOn(T.name);
    let bar = T.t.querySelector(":scope > .cch-bar");
    if (!T.live && !on) { if (bar) bar.remove(); return; }
    if (!bar) { bar = mkBar(); T.t.appendChild(bar); }
    if (on && !(state.players[T.name] && state.players[T.name].cmdAuto)) autoCommander(T.name);
    bar.dataset.player = T.name;

    const tr = rect(T.t), mr = rect(T.mw), fr = rect(T.frame);
    const hb = T.t.querySelector('[class*="HPBadge_box"]');
    const hr = hb && rect(hb);
    const left = (hr && hr.width ? hr.right : fr.left) - tr.left + 10;
    const big = tr.width >= 640;
    const w = big ? 50 : 30;
    const vis = Math.round(w * (680 / 488) * 0.4);
    const h = on ? vis + (big ? 15 : 11) : big ? 28 : 18;
    const strip = fr.top - mr.top;
    const top = strip >= h + 4 ? mr.top - tr.top + (strip - h) / 2 : mr.top - tr.top + 3;
    Object.assign(bar.style, {
      left: left + "px",
      top: top + "px",
      maxWidth: Math.max(60, tr.width - left - (big ? 70 : 8)) + "px",
    });
    bar.style.setProperty("--w", w + "px");
    bar.style.setProperty("--vis", vis + "px");

    const p = state.players[T.name];
    const sig = JSON.stringify([on, big, w, p && [p.hidden, p.cards.map((c) => [c.uid, c.zone, c.img, c.name, c.qty])]]);
    if (bar.dataset.sig === sig) return;
    bar.dataset.sig = sig;
    bar.className = "cch-tbl cch-root cch-bar" + (big ? " cch-big" : " cch-small") + (on ? "" : " cch-bar-off");
    bar.innerHTML = barHtml(T.name, on, big);
  }

  function barHtml(name, on, big) {
    if (!on) {
      return `<button type="button" class="cch-enable" data-b="on"
        title="Ativar a mesa virtual deste jogador: zonas e cartas digitais sobre o vídeo">${icon("cards")}${big ? "Mesa virtual" : "Mesa"}</button>`;
    }
    const p = state.players[name] || blank();
    const list = (z) => p.cards.filter((c) => c.zone === z);
    const label = (z, n) => (big
      ? (z === "cmd" ? ZONES[z].name : `${ZONES[z].name}(${n})`)
      : (z === "cmd" ? ZONES[z].short : `${ZONES[z].short} ${n}`));
    const slots = BAR_ORDER.map((z) => {
      const cs = list(z);
      const topCard = cs[cs.length - 1];
      const n = z === "field" ? cs.reduce((a, c) => a + (c.qty || 1), 0) : cs.length;
      const badge = cs.length > 1 ? `<span class="cch-slot-n">${z === "cmd" ? "+" + (cs.length - 1) : cs.length}</span>` : "";
      const box = topCard
        ? `<div class="cch-slot-box"><img src="${esc(topCard.img)}" alt="" draggable="false">${badge}</div>`
        : `<div class="cch-slot-box cch-empty"></div>`;
      return `<div class="cch-slot" data-b="${z}" title="${esc(ZONES[z].name + (topCard ? ": " + topCard.name : ""))}">
        <div class="cch-slot-lbl">${label(z, n)}</div>${box}</div>`;
    }).join("");
    return slots + `<div class="cch-bar-tools">
        <button type="button" data-b="token" title="Criar token no campo">${icon("plus")}</button>
        <button type="button" data-b="eye" title="${p.hidden ? "Mostrar" : "Esconder"} as cartas sobre o vídeo">${icon(p.hidden ? "eyeOff" : "eye")}</button>
        <button type="button" data-b="off" title="Desativar a mesa virtual (as cartas continuam salvas)">${icon("x")}</button>
      </div>`;
  }

  function mkBar() {
    const el = document.createElement("div");
    el.className = "cch-tbl cch-root cch-bar";
    isolate(el);
    el.addEventListener("click", (e) => {
      const b = e.target.closest("[data-b]");
      if (!b || !state) return;
      const name = el.dataset.player, k = b.dataset.b;
      if (k === "on") setOn(name, true);
      else if (k === "off") setOn(name, false);
      else if (k === "eye") { P(name).hidden = !P(name).hidden; save(); }
      else if (k === "token") openTokenSearch(name);
      else if (panel && panel.player === name && panel.zone === k) closePanel();
      else openPanel(name, k);
    });
    return el;
  }

  function openTokenSearch(player) {
    openSearch((s) => {
      const n = P(player).cards.filter((c) => c.zone === "field").length;
      const off = (n % 5) * 0.05;
      addCard(player, { ...s, token: true }, "field", { x: clamp(0.35 + off), y: clamp(0.4 + off), flip: false });
    }, `Criar token · ${player}`, true);
  }

  function renderLayer(T) {
    let layer = T.t.querySelector(":scope > .cch-layer");
    const p = state.players[T.name];
    if (!isOn(T.name) || !p || p.hidden) { if (layer) layer.remove(); return; }
    if (!layer) { layer = mkLayer(); T.t.appendChild(layer); }
    layer.dataset.player = T.name;
    const tr = rect(T.t), fr = rect(T.frame);
    Object.assign(layer.style, {
      left: fr.left - tr.left + "px", top: fr.top - tr.top + "px", width: fr.width + "px", height: fr.height + "px",
    });
    const field = p.cards.filter((c) => c.zone === "field");
    const size = p.size || CARD_H;
    const sig = JSON.stringify([T.flip, size, !!p.sized, fr.width >= 500, field.map((c) =>
      [c.uid, c.x, c.y, c.rot, c.img, c.flip, c.name, c.pt, c.qty, c.plus, c.pw, c.tg, c.gen, c.kw, c.ghost, c.token])]);
    if (layer.dataset.sig === sig || (drag && drag.layer === layer)) return;
    layer.dataset.sig = sig;
    layer.style.setProperty("--card-h", size * 100 + "%");
    layer.innerHTML = field.map((c) => cardHtml(c, T.flip)).join("") +
      (field.length && !p.sized && fr.width >= 500
        ? `<div class="cch-hint">Clique: virar · 2 cliques: ver carta · botão direito: opções · canto ◢: tamanho de todas as cartas de ${esc(T.name)}</div>`
        : "");
  }

  function marksHtml(c) {
    const out = [];
    if (c.gen) out.push(`<span title="Marcador genérico">●${c.gen}</span>`);
    for (const [k, n] of Object.entries(c.kw || {})) {
      if (n > 0 && KW_MAP[k]) out.push(`<span title="${esc(KW_MAP[k].name)}">${KW_MAP[k].ico}${n > 1 ? n : ""}</span>`);
    }
    return out.join("");
  }

  function cardHtml(c, flipNow) {
    const inv = !!c.flip !== flipNow;
    const x = inv ? 1 - c.x : c.x, y = inv ? 1 - c.y : c.y;
    const pt = ptInfo(c);
    const marks = marksHtml(c);
    const qty = c.qty || 1;
    const cls = (c.rot ? " cch-tapped" : "") + (c.ghost ? " cch-ghost" : "") + (c.token ? " cch-token" : "") + (qty > 1 ? " cch-stack" : "");
    return `<div class="cch-card${cls}" data-uid="${c.uid}"
        style="left:${x * 100}%;top:${y * 100}%" title="${esc(c.name)}">
      <div class="cch-cface">
        <img src="${esc(c.img)}" draggable="false" alt="">
        ${c.token ? `<span class="cch-tokbar">Ficha</span>` : ""}
        ${!c.token && qty > 1 ? `<span class="cch-qty">×${qty}</span>` : ""}
        ${pt ? `<span class="cch-ptb ${pt.cls}">${esc(pt.text)}</span>` : ""}
        ${marks ? `<div class="cch-marks">${marks}</div>` : ""}
      </div>
      ${c.token ? `<button type="button" class="cch-tdel" data-a="del" title="Remover ficha">${icon("x")}</button>
        <div class="cch-copies">
          <button type="button" data-a="qty+" title="Mais uma cópia">${icon("plus")}</button>
          <span>Cópias</span><b>${qty}</b>
          <button type="button" data-a="qty-" title="Menos uma cópia"${qty <= 1 ? " disabled" : ""}>${icon("minus")}</button>
        </div>` : ""}
      <button type="button" class="cch-more" data-a="menu" title="Opções (ou botão direito)">${icon("more")}</button>
      <span class="cch-rs" title="Arraste para ajustar o tamanho (todas as cartas deste jogador)"></span>
    </div>`;
  }

  function mkLayer() {
    const el = document.createElement("div");
    el.className = "cch-tbl cch-layer";
    isolate(el);
    el.addEventListener("pointerdown", onCardDown);
    el.addEventListener("click", (e) => {
      const b = e.target.closest("[data-a]");
      const uid = e.target.closest("[data-uid]")?.dataset.uid;
      if (!b || !uid) return;
      const a = b.dataset.a;
      if (a === "menu") { const r = rect(b); return openMenu(uid, r.right + 4, r.top); }
      if (a === "qty+" || a === "qty-") {
        const f = find(uid);
        if (f) { f.c.qty = Math.max(1, (f.c.qty || 1) + (a === "qty+" ? 1 : -1)); save(); }
        return;
      }
      act(uid, a);
    });
    el.addEventListener("contextmenu", (e) => {
      const uid = e.target.closest("[data-uid]")?.dataset.uid;
      if (!uid) return;
      e.preventDefault();
      openMenu(uid, e.clientX, e.clientY);
    });
    el.addEventListener("mouseover", (e) => { hoverUid = e.target.closest("[data-uid]")?.dataset.uid || null; });
    el.addEventListener("mouseleave", () => { hoverUid = null; });
    el.addEventListener("wheel", (e) => {
      const card = e.target.closest(".cch-card");
      if (!card) return;
      e.preventDefault();
      const f = find(card.dataset.uid);
      if (!f) return;
      setSize(el, f.p, (f.p.size || CARD_H) * (e.deltaY < 0 ? 1.06 : 1 / 1.06));
      save();
    }, { passive: false });
    return el;
  }

  function setSize(layer, p, h) {
    p.size = Math.min(MAX_H, Math.max(MIN_H, h));
    p.sized = true;
    if (layer) {
      layer.style.setProperty("--card-h", p.size * 100 + "%");
      layer.querySelector(".cch-hint")?.remove();
    }
  }

  function startResize(e, card) {
    const layer = card.parentElement;
    const f = find(card.dataset.uid);
    if (!f) return;
    const lr = rect(layer), cr = rect(card);
    const cx = cr.left + cr.width / 2, cy = cr.top + cr.height / 2;
    const tapped = card.classList.contains("cch-tapped");
    const k = 488 / 680;
    const move = (ev) => {
      const dx = 2 * Math.abs(ev.clientX - cx), dy = 2 * Math.abs(ev.clientY - cy);
      setSize(layer, f.p, (tapped ? Math.max(dx, dy / k) : Math.max(dy, dx / k)) / lr.height);
    };
    const up = () => {
      card.removeEventListener("pointermove", move);
      layer.classList.remove("cch-resizing");
      save();
    };
    layer.classList.add("cch-resizing");
    card.setPointerCapture(e.pointerId);
    card.addEventListener("pointermove", move);
    card.addEventListener("pointerup", up, { once: true });
    card.addEventListener("pointercancel", up, { once: true });
  }

  function dropTarget(x, y) {
    const el = document.elementsFromPoint(x, y).find((e) => e.closest && e.closest(".cch-bar [data-b]"));
    const b = el && el.closest("[data-b]");
    if (!b || !ZONES[b.dataset.b]) return null;
    return { el: b, zone: b.dataset.b, player: b.closest(".cch-bar").dataset.player };
  }

  function onCardDown(e) {
    const card = e.target.closest(".cch-card");
    if (!card || e.target.closest("button") || e.button !== 0) return;
    e.preventDefault();
    if (e.target.closest(".cch-rs")) return startResize(e, card);
    const layer = card.parentElement;
    drag = {
      layer, card, uid: card.dataset.uid, r: rect(layer),
      sx: e.clientX, sy: e.clientY, moved: false, target: null,
      x0: parseFloat(card.style.left) / 100, y0: parseFloat(card.style.top) / 100,
    };
    card.setPointerCapture(e.pointerId);
    card.addEventListener("pointermove", onMove);
    card.addEventListener("pointerup", onUp, { once: true });
    card.addEventListener("pointercancel", onUp, { once: true });
  }

  function onMove(e) {
    if (!drag) return;
    const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    if (!drag.moved && Math.hypot(dx, dy) < 5) return;
    if (!drag.moved) { drag.moved = true; drag.layer.classList.add("cch-dragging"); }
    drag.x = drag.x0 + dx / drag.r.width;
    drag.y = drag.y0 + dy / drag.r.height;
    drag.card.style.left = drag.x * 100 + "%";
    drag.card.style.top = drag.y * 100 + "%";
    const t = dropTarget(e.clientX, e.clientY);
    if (drag.target && (!t || t.el !== drag.target.el)) drag.target.el.classList.remove("cch-drop");
    if (t) t.el.classList.add("cch-drop");
    drag.target = t;
  }

  function onUp() {
    const d = drag;
    drag = null;
    if (!d) return;
    d.card.removeEventListener("pointermove", onMove);
    d.layer.classList.remove("cch-dragging");
    if (!d.moved) return clickCard(d.uid);
    if (d.target) {
      d.target.el.classList.remove("cch-drop");
      if (d.target.zone !== "field" || d.target.player !== d.layer.dataset.player) moveCard(d.uid, d.target.zone, d.target.player);
      d.layer.dataset.sig = "";
      return schedule();
    }
    const f = find(d.uid);
    if (!f) return;
    Object.assign(f.c, { x: clamp(d.x), y: clamp(d.y), flip: /flipped/.test(d.layer.parentElement.className) });
    d.layer.dataset.sig = "";
    save();
  }

  function clickCard(uid) {
    const now = Date.now();
    if (lastTap && lastTap.uid === uid && now - lastTap.t < 280) {
      clearTimeout(tapT);
      lastTap = null;
      return act(uid, "view");
    }
    lastTap = { uid, t: now };
    clearTimeout(tapT);
    tapT = setTimeout(() => act(uid, "tap"), 240);
  }

  window.addEventListener("keydown", (e) => {
    if (!hoverUid || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest && e.target.closest("input, textarea, select, [contenteditable]")) return;
    const k = e.key.toLowerCase();
    const a = k === "delete" || k === "backspace" ? "del" : k === "x" ? "dup" : null;
    if (!a || !find(hoverUid)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    act(hoverUid, a);
    if (a === "del") hoverUid = null;
  }, true);

  const stepper = (k, val, noValue) =>
    `<div class="cch-step" data-k="${k}"><button type="button" data-d="-1">−</button>${noValue ? "" : `<b>${val}</b>`}<button type="button" data-d="1">+</button></div>`;
  const mrow = (ico, label, right, attrs = "") =>
    `<div class="cch-mi" ${attrs}><span class="cch-mi-l">${ico ? icon(ico) : ""}<span>${label}</span></span>${right}</div>`;
  const mbtn = (a, ico, label, kbd, cls = "") =>
    `<button type="button" class="cch-mi cch-mi-btn ${cls}" data-a="${a}"><span class="cch-mi-l">${icon(ico)}<span>${label}</span></span>${kbd ? `<kbd>${kbd}</kbd>` : ""}</button>`;

  function openMenu(uid, x, y) {
    closeMenu();
    const f = find(uid);
    if (!f) return;
    const el = document.createElement("div");
    el.className = "cch-tbl cch-root cch-menu cch-modal-open";
    isolate(el);
    menu = { uid, el, q: "", kwOpen: false, ptOpen: false, sendOpen: false };
    el.addEventListener("click", onMenuClick);
    el.addEventListener("input", (e) => {
      if (e.target.matches(".cch-kw-q")) { menu.q = e.target.value; renderKwList(); }
    });
    C.host().appendChild(el);
    renderMenu();
    el.style.left = Math.max(8, Math.min(x, innerWidth - el.offsetWidth - 8)) + "px";
    el.style.top = Math.max(8, Math.min(y, innerHeight - el.offsetHeight - 8)) + "px";
  }

  function closeMenu() {
    if (menu) menu.el.remove();
    menu = null;
  }

  function renderMenu() {
    const f = find(menu.uid);
    if (!f) return closeMenu();
    const c = f.c;
    const chev = (open) => `<span class="cch-chev${open ? " cch-open" : ""}">${icon("chevron")}</span>`;
    const others = [...new Set(tiles().map((T) => T.name))].filter((n) => n !== f.player);
    menu.el.innerHTML = `
      ${mrow("scaling", "Tamanho da carta", stepper("size", 0, true))}
      <div class="cch-mbox">
        ${mrow("layers", "Quantidade", stepper("qty", c.qty || 1))}
        ${mrow("swords", `Marcadores +1/+1 ${chev(menu.ptOpen)}`, stepper("plus", c.plus || 0), 'data-m="pt"')}
        ${menu.ptOpen ? `<div class="cch-msub">
          ${mrow("", "Poder", stepper("pw", c.pw || 0))}
          ${mrow("", "Resistência", stepper("tg", c.tg || 0))}
        </div>` : ""}
      </div>
      <button type="button" class="cch-mi cch-mi-btn cch-mi-strong" data-m="kw">
        <span class="cch-mi-l">${icon("plusCircle")}<span>Marcadores</span></span>${chev(menu.kwOpen)}</button>
      ${menu.kwOpen ? `<div class="cch-kw">
        ${mrow("plusCircle", "Marcador genérico", stepper("gen", c.gen || 0))}
        <input class="cch-kw-q" type="text" placeholder="Procurar marcadores…" spellcheck="false" value="${esc(menu.q)}">
        <div class="cch-kw-list"></div>
      </div>` : ""}
      <div class="cch-msep"></div>
      ${mbtn("tap", "rotate", c.rot ? "Desvirar" : "Virar", "Clique")}
      ${mbtn("dup", "copy", "Copiar como ficha", "X")}
      <div class="cch-msep"></div>
      ${mbtn("ghost", c.ghost ? "eyeOff" : "eye", c.ghost ? "Deixar opaca" : "Ver através", "")}
      ${mbtn("swap", "expand", "Ver / alterar edição", "")}
      ${mbtn("view", "search", "Ver carta traduzida", "2× clique")}
      ${others.length ? `<div class="cch-msep"></div>
      <button type="button" class="cch-mi cch-mi-btn" data-m="send">
        <span class="cch-mi-l">${icon("send")}<span>Enviar para…</span></span>${chev(menu.sendOpen)}</button>
      ${menu.sendOpen ? `<div class="cch-msub">${others.map((n) =>
        `<button type="button" class="cch-mi cch-mi-btn" data-send="${esc(n)}"><span class="cch-mi-l">${icon("user")}<span>${esc(n)}</span></span></button>`).join("")}</div>` : ""}` : ""}
      <div class="cch-msep"></div>
      <div class="cch-mmove">${["grave", "exile", "cmd"].map((z) =>
        `<button type="button" data-a="${z}" title="Mover para ${ZONES[z].name}">${icon(ZONES[z].ico)}<span>${ZONES[z].name}</span></button>`).join("")}</div>
      <div class="cch-msep"></div>
      ${mbtn("del", "trash", "Excluir", "DEL", "cch-mi-danger")}`;
    if (menu.kwOpen) renderKwList();
  }

  function renderKwList() {
    const list = menu.el.querySelector(".cch-kw-list");
    if (!list) return;
    const c = find(menu.uid)?.c;
    if (!c) return;
    const q = norm(menu.q);
    list.innerHTML = KW.filter(([, n]) => !q || norm(n).includes(q))
      .map(([k, n, i]) => `<div class="cch-mi"><span class="cch-mi-l"><i>${i}</i><span>${esc(n)}</span></span>${stepper("kw:" + k, (c.kw || {})[k] || 0)}</div>`)
      .join("") || `<div class="cch-note">Nenhum marcador.</div>`;
  }

  function updateMenu() {
    const f = find(menu.uid);
    if (!f) return closeMenu();
    const c = f.c;
    for (const s of menu.el.querySelectorAll(".cch-step[data-k]")) {
      const b = s.querySelector("b");
      if (!b) continue;
      const k = s.dataset.k;
      b.textContent = k.startsWith("kw:") ? (c.kw || {})[k.slice(3)] || 0 : c[k] ?? (k === "qty" ? 1 : 0);
    }
  }

  function onMenuClick(e) {
    if (!menu) return;
    const f = find(menu.uid);
    if (!f) return closeMenu();
    const c = f.c;
    const d = e.target.closest("[data-d]");
    if (d) {
      const k = d.closest("[data-k]").dataset.k, delta = Number(d.dataset.d);
      if (k === "size") {
        const layer = document.querySelector(`.cch-layer[data-player="${CSS.escape(f.player)}"]`);
        setSize(layer, f.p, (f.p.size || CARD_H) * (delta > 0 ? 1.1 : 1 / 1.1));
      } else if (k.startsWith("kw:")) {
        c.kw = c.kw || {};
        const key = k.slice(3);
        c.kw[key] = Math.max(0, (c.kw[key] || 0) + delta);
        if (!c.kw[key]) delete c.kw[key];
      } else if (k === "qty") c.qty = Math.max(1, (c.qty || 1) + delta);
      else if (k === "gen") c.gen = Math.max(0, (c.gen || 0) + delta);
      else c[k] = (c[k] || 0) + delta;
      save();
      return updateMenu();
    }
    const to = e.target.closest("[data-send]")?.dataset.send;
    if (to) {
      const uid = menu.uid;
      closeMenu();
      if (!isOn(to)) setOn(to, true);
      return moveCard(uid, "field", to);
    }
    const m = e.target.closest("[data-m]")?.dataset.m;
    if (m === "pt" || m === "kw" || m === "send") {
      if (m === "pt") menu.ptOpen = !menu.ptOpen;
      else if (m === "kw") menu.kwOpen = !menu.kwOpen;
      else menu.sendOpen = !menu.sendOpen;
      renderMenu();
      const r = rect(menu.el);
      if (r.bottom > innerHeight - 8) menu.el.style.top = Math.max(8, innerHeight - r.height - 8) + "px";
      if (m === "kw" && menu.kwOpen) menu.el.querySelector(".cch-kw-q")?.focus();
      return;
    }
    const a = e.target.closest("[data-a]")?.dataset.a;
    if (!a) return;
    const uid = menu.uid;
    if (a === "tap" || a === "ghost") { act(uid, a); return renderMenu(); }
    closeMenu();
    act(uid, a);
  }

  function openPanel(player, zone) {
    closePanel();
    const el = document.createElement("div");
    el.className = "cch-tbl cch-root cch-zp cch-modal-open";
    isolate(el);
    panel = { player, zone, el, q: "", sig: "" };
    el.innerHTML = `<div class="cch-zp-head"><div><b>${ZONES[zone].name}</b> <span class="cch-zp-player">${esc(player)}</span></div>
        <button type="button" class="cch-icon cch-ibtn" data-p="close" title="Fechar (Esc)">${icon("x")}</button></div>
      <label class="cch-zp-search">${icon("search")}<input class="cch-zp-q" type="text" placeholder="Nome ou tipo da carta" spellcheck="false">
        <span class="cch-zp-count"></span></label>
      <div class="cch-zp-list"></div>
      <div class="cch-zp-foot">
        <span class="cch-sub">Passe o mouse para ver · clique para ler</span>
        <div class="cch-zp-btns">
          ${zone === "field" ? `<button type="button" class="cch-icon cch-ibtn" data-p="wipe" title="Mandar todas para o cemitério">${icon("skull")}Limpar</button>
            <button type="button" class="cch-icon cch-ibtn" data-p="token">${icon("plus")}Token</button>` : ""}
          <button type="button" class="cch-icon cch-ibtn" data-p="add">${icon("plus")}Carta</button>
          <button type="button" class="cch-btn" data-p="close">Concluído</button>
        </div>
      </div>
      <div class="cch-zp-prev"><img alt=""></div>`;
    el.querySelector(".cch-zp-q").addEventListener("input", (e) => { panel.q = e.target.value; renderPanel(); });
    const list = el.querySelector(".cch-zp-list");
    list.addEventListener("mouseover", (e) => showPreview(e.target.closest(".cch-zp-row")));
    list.addEventListener("mouseleave", () => showPreview(null));
    el.addEventListener("click", onPanelClick);
    C.host().appendChild(el);
    renderPanel();
  }

  function closePanel() {
    if (panel) panel.el.remove();
    panel = null;
  }

  function showPreview(row) {
    if (!panel) return;
    const prev = panel.el.querySelector(".cch-zp-prev");
    const c = row && find(row.dataset.uid)?.c;
    if (!c) { prev.classList.remove("cch-show"); return; }
    prev.querySelector("img").src = c.img;
    const pr = rect(panel.el), rr = rect(row);
    prev.style.top = Math.max(0, Math.min(rr.top - pr.top - 120, pr.height - 380)) + "px";
    prev.classList.add("cch-show");
  }

  function renderPanel() {
    const { player, zone, el } = panel;
    if (!el.isConnected) C.host().appendChild(el);
    const p = state.players[player] || blank();
    const all = p.cards.filter((c) => c.zone === zone).reverse();
    for (const c of all) if (!c.info) fillInfo(c.uid);
    const q = norm(panel.q);
    const shown = q ? all.filter((c) => norm(c.name + " " + c.type).includes(q)) : all;
    const sig = JSON.stringify([q, all.length, shown.map((c) => [c.uid, c.img, c.name, c.type, c.qty])]);
    if (panel.sig === sig) return;
    panel.sig = sig;
    el.querySelector(".cch-zp-count").textContent = `${shown.length} de ${all.length}`;
    const tools = `<button type="button" data-a="view" title="Ver carta traduzida">${icon("search")}</button>` +
      CARD_ZONES.filter((z) => z !== zone)
        .map((z) => `<button type="button" data-a="${z}" title="Mover para ${ZONES[z].name}">${icon(ZONES[z].ico)}</button>`).join("") +
      `<button type="button" data-a="swap" title="Ver / alterar edição">${icon("expand")}</button>` +
      `<button type="button" data-a="del" title="Excluir" class="cch-danger">${icon("trash")}</button>`;
    el.querySelector(".cch-zp-list").innerHTML = shown.length
      ? shown.map((c, i) => `<div class="cch-zp-row" data-uid="${c.uid}">
          <img src="${esc(c.img)}" alt="" draggable="false">
          <div class="cch-zp-txt">
            <div class="cch-zp-name">${esc(c.name || "…")}${(c.qty || 1) > 1 ? ` <small>×${c.qty}</small>` : ""}</div>
            <div class="cch-zp-type">${i === 0 && !q ? `<b class="cch-zp-new">Mais recente</b> ` : ""}${esc(c.type || "")}</div>
          </div>
          <div class="cch-zp-acts">${tools}</div>
        </div>`).join("")
      : `<div class="cch-note">${all.length ? "Nenhuma carta encontrada." :
          "Nenhuma carta aqui. Arraste uma carta do vídeo até esta zona, use o painel da carta escaneada ou adicione pela busca."}</div>`;
  }

  function onPanelClick(e) {
    if (!panel) return;
    const p = e.target.closest("[data-p]")?.dataset.p;
    const { player, zone } = panel;
    if (p === "close") return closePanel();
    if (p === "add") return openSearch((s) => addCard(player, s, zone), `Adicionar em ${ZONES[zone].name} · ${player}`);
    if (p === "token") return openTokenSearch(player);
    if (p === "wipe") {
      for (const c of P(player).cards) if (c.zone === "field") { c.zone = "grave"; resetMods(c); }
      return save();
    }
    const uid = e.target.closest("[data-uid]")?.dataset.uid;
    if (uid) act(uid, e.target.closest("[data-a]")?.dataset.a || "view");
  }

  let swallow = 0;
  window.addEventListener("pointerdown", (e) => {
    const inside = (sel) => e.target.closest && e.target.closest(sel);
    let closed = false;
    if (menu && !inside(".cch-menu")) { closeMenu(); closed = true; }
    if (panel && !inside(".cch-zp, .cch-bar, .cch-modal-bg, .cch-menu")) { closePanel(); closed = true; }
    if (closed && !inside(".cch-tbl")) {
      e.preventDefault();
      e.stopImmediatePropagation();
      swallow = Date.now();
    }
  }, true);
  for (const type of ["mousedown", "pointerup", "mouseup", "click", "dblclick", "contextmenu"]) {
    window.addEventListener(type, (e) => {
      if (!swallow) return;
      if (Date.now() - swallow > 700) { swallow = 0; return; }
      e.preventDefault();
      e.stopImmediatePropagation();
      if (type === "click" || type === "contextmenu") swallow = 0;
    }, true);
  }

  let srch = null;

  function openSearch(cb, title, tokens) {
    if (!srch) buildSearch();
    srch.cb = cb;
    srch.tokens = !!tokens;
    srch.el.querySelector(".cch-s-title").textContent = title;
    srch.inp.placeholder = tokens ? "Ex.: Tesouro, Soldado, Zumbi…" : "Ex.: Anel Solar, Sol Ring, CMR 472…";
    srch.chips.innerHTML = tokens
      ? TOKENS.map(([pt, en]) => `<button type="button" data-t="${esc(en)}">${esc(pt)}</button>`).join("")
      : "";
    C.host().appendChild(srch.el);
    srch.el.classList.add("cch-modal-open");
    srch.inp.value = "";
    srch.q = "";
    srch.res.innerHTML = hint();
    setTimeout(() => srch.inp.focus(), 0);
  }

  const hint = () => `<div class="cch-note">${srch.tokens
    ? "Escolha um token comum acima ou digite o nome (português ou inglês)."
    : "Digite o nome da carta (português ou inglês), edição + número (ex.: <b>CMR 472</b>) ou o ID do Scryfall."}</div>`;

  function closeSearch() {
    if (!srch) return;
    srch.el.classList.remove("cch-modal-open");
    srch.el.remove();
  }

  function buildSearch() {
    const el = document.createElement("div");
    el.className = "cch-tbl cch-modal-bg";
    el.innerHTML = `<div class="cch-root cch-s-box">
        <div class="cch-zp-head"><b class="cch-s-title"></b>
          <button type="button" class="cch-icon cch-ibtn" data-s="close" title="Fechar (Esc)">${icon("x")}</button></div>
        <label class="cch-zp-search">${icon("search")}<input class="cch-s-in" type="text" spellcheck="false" autocomplete="off"></label>
        <div class="cch-s-chips"></div>
        <div class="cch-s-res"></div>
      </div>`;
    isolate(el);
    srch = {
      el, inp: el.querySelector("input"), res: el.querySelector(".cch-s-res"), chips: el.querySelector(".cch-s-chips"),
      cb: null, t: 0, q: "", list: [], tokens: false,
    };
    srch.inp.addEventListener("input", () => {
      clearTimeout(srch.t);
      srch.t = setTimeout(() => runSearch(srch.inp.value), 350);
    });
    srch.inp.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { e.preventDefault(); closeSearch(); }
      if (e.key === "Enter") { e.preventDefault(); clearTimeout(srch.t); runSearch(srch.inp.value); }
    });
    el.addEventListener("click", (e) => {
      if (e.target === el || e.target.closest('[data-s="close"]')) return closeSearch();
      const t = e.target.closest("[data-t]");
      if (t) { srch.inp.value = t.textContent; return runSearch(t.dataset.t); }
      const i = e.target.closest("[data-i]");
      if (!i) return;
      const r = srch.list[Number(i.dataset.i)], cb = srch.cb;
      closeSearch();
      if (r && cb) cb(r);
    });
  }

  const toEnglish = (q) => q.split(/\s+/).map((w) => PT_EN[w.toLowerCase()] || w).join(" ");

  function runSearch(q) {
    q = q.trim();
    srch.q = q;
    if (q.length < 2) { srch.res.innerHTML = hint(); return; }
    srch.res.innerHTML = `<div class="cch-note">Buscando…</div>`;
    send({ type: "search", q: srch.tokens ? toEnglish(q) : q, tokens: srch.tokens }, (r) => {
      if (srch.q !== q) return;
      if (!r || !r.ok) {
        srch.res.innerHTML = `<div class="cch-note">Erro na busca: ${esc(r?.error || "sem resposta (recarregue a página)")}</div>`;
        return;
      }
      srch.list = r.list;
      srch.res.innerHTML = r.list.length
        ? `<div class="cch-s-grid">` + r.list.map((c, i) => `<button type="button" class="cch-s-item" data-i="${i}" title="${esc(c.en)}">
            <img src="${esc(c.small || c.img)}" alt="" loading="lazy" draggable="false">
            <span>${esc(c.name)}</span>
            <small>${srch.tokens ? esc([c.pt, (c.type || "").replace(/^Token\s*/i, "")].filter(Boolean).join(" · "))
              : `${esc(c.set)} · ${esc(c.num)}${c.lang && c.lang !== "en" ? " · " + esc(c.lang.toUpperCase()) : ""}`}</small>
          </button>`).join("") + `</div>`
        : `<div class="cch-note">Nenhuma carta encontrada.</div>`;
    });
  }

  let viewer = null;
  function openViewer(c) {
    if (!viewer) {
      viewer = document.createElement("div");
      viewer.className = "cch-tbl cch-modal-bg";
      viewer.innerHTML = `<div class="cch-v-box">
          <div class="cch-root cch-info cch-v-info">
            <button type="button" class="cch-icon cch-side-close" data-v="close" title="Fechar (Esc)">✕</button>
            <div class="cch-v-body"></div>
          </div>
          <img class="cch-v-img" alt="" draggable="false">
        </div>`;
      isolate(viewer);
      viewer.addEventListener("click", (e) => {
        if (e.target === viewer || e.target.closest('[data-v="close"]')) closeViewer();
      });
    }
    viewer.dataset.id = c.id;
    viewer.querySelector(".cch-v-img").src = c.img;
    const body = viewer.querySelector(".cch-v-body");
    body.innerHTML = '<div class="cch-sub">Carregando…</div>';
    C.host().appendChild(viewer);
    viewer.classList.add("cch-modal-open");
    send({ type: "card", id: c.id }, (res) => {
      if (viewer.dataset.id !== c.id) return;
      body.innerHTML = res && res.ok ? C.infoHtml(res.data) : '<div class="cch-sub">Não foi possível carregar esta carta.</div>';
    });
  }

  function closeViewer() {
    if (!viewer) return;
    viewer.classList.remove("cch-modal-open");
    viewer.remove();
  }

  window.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (srch && srch.el.isConnected) return;
    if (viewer && viewer.classList.contains("cch-modal-open")) closeViewer();
    else if (menu) closeMenu();
    else if (panel) closePanel();
    else return;
    e.stopImmediatePropagation();
    e.preventDefault();
  }, true);

  window.addEventListener("cch:zoom", (e) => {
    const { id, img } = e.detail;
    let origin = null;
    if (lastScan && !lastScan.used && Date.now() - lastScan.t < SCAN_WINDOW) {
      origin = lastScan;
      lastScan.used = true;
    }
    zr = {
      id, img, uid: null, msg: null,
      player: origin ? origin.player : zr && zr.player,
      pos: origin ? { x: origin.x, y: origin.y, flip: origin.flip } : null,
      posPlayer: origin && origin.player,
    };
    if (origin && state && isOn(origin.player)) {
      const p = P(origin.player);
      const same = p.cards.find((c) => c.zone === "field" && c.id === id &&
        Math.hypot(c.x - origin.x, c.y - origin.y) < 0.12);
      if (same) { Object.assign(same, zr.pos); zr.uid = same.uid; save(); }
      else zr.uid = addCard(origin.player, { id, img }, "field", zr.pos).uid;
      zr.msg = `Colocada no campo de ${origin.player}`;
    }
    renderZoomBar(true);
  });

  function renderZoomBar(force) {
    const side = document.getElementById("cch-side");
    if (!side || !zr || !state || side.style.display === "none") return;
    const players = [...new Set(tiles().filter((T) => T.live || isOn(T.name)).map((T) => T.name))];
    if (!players.length) { if (zbar) zbar.remove(); return; }
    if (!zbar) {
      zbar = document.createElement("div");
      zbar.className = "cch-tbl cch-zb";
      zbar.addEventListener("click", onZoomBarClick);
      zbar.addEventListener("change", (e) => {
        if (e.target.matches("select")) { zr.player = e.target.value; zr.msg = null; renderZoomBar(true); }
      });
    }
    if (zbar.parentElement !== side) side.insertBefore(zbar, side.querySelector(".cch-side-body"));
    if (!zr.player || !players.includes(zr.player)) zr.player = players[0];
    const cur = find(zr.uid);
    const sig = JSON.stringify([zr.id, zr.player, cur && [cur.player, cur.c.zone], zr.msg, players]);
    if (!force && zbar.dataset.sig === sig) return;
    zbar.dataset.sig = sig;
    const here = cur && cur.player === zr.player ? cur.c.zone : null;
    zbar.innerHTML = `
      <div class="cch-zb-row">${icon("cards")}<span>Mesa de</span>
        <select>${players.map((n) => `<option value="${esc(n)}"${n === zr.player ? " selected" : ""}>${esc(n)}</option>`).join("")}</select>
      </div>
      <div class="cch-zb-btns">${CARD_ZONES.map((z) =>
        `<button type="button" data-z="${z}" class="${here === z ? "cch-cur" : ""}">${icon(ZONES[z].ico)}${ZONES[z].name}</button>`).join("")}</div>
      ${cur ? `<div class="cch-zb-msg">${esc(zr.msg || `Está em: ${ZONES[cur.c.zone].name} de ${cur.player}`)} ·
        <button type="button" data-z="undo" class="cch-link">remover da mesa</button></div>` : ""}`;
  }

  function onZoomBarClick(e) {
    const z = e.target.closest("[data-z]")?.dataset.z;
    if (!z || !zr || !state) return;
    const cur = find(zr.uid);
    if (z === "undo") {
      if (cur) cur.p.cards.splice(cur.p.cards.indexOf(cur.c), 1);
      zr.uid = null;
      zr.msg = null;
      save();
      return renderZoomBar(true);
    }
    if (!isOn(zr.player)) setOn(zr.player, true);
    if (cur) moveCard(cur.c.uid, z, zr.player);
    else {
      const pos = zr.posPlayer === zr.player ? zr.pos : null;
      zr.uid = addCard(zr.player, { id: zr.id, img: zr.img }, z, pos).uid;
    }
    zr.msg = `${ZONES[z].name} de ${zr.player}`;
    renderZoomBar(true);
  }

  const ours = (n) => n.nodeType === 1 && n.classList.contains("cch-tbl");
  new MutationObserver((muts) => {
    if (muts.every((m) => {
      if (m.target.closest && m.target.closest(".cch-tbl, #cch-side, #cch-panel")) return true;
      const nodes = [...m.addedNodes, ...m.removedNodes];
      return nodes.length > 0 && nodes.every(ours);
    })) return;
    poke();
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "src"] });
  window.addEventListener("resize", poke);
  setInterval(poke, 1500);
  schedule();
})();
