const SF = "https://api.scryfall.com";
const HEADERS = { Accept: "application/json", "User-Agent": "ConvokeCardHelper/0.1" };

async function sf(path) {
  const r = await fetch(SF + path, { headers: HEADERS });
  if (!r.ok) throw new Error("Scryfall " + r.status);
  return r.json();
}

function faces(card) {
  if (card.card_faces && card.card_faces.length && !card.oracle_text) {
    return card.card_faces.map((f) => ({
      name: f.name,
      type_line: f.type_line,
      mana_cost: f.mana_cost,
      oracle_text: f.oracle_text || "",
      pt: f.power ? `${f.power}/${f.toughness}` : f.loyalty ? `Lealdade ${f.loyalty}` : "",
    }));
  }
  return [
    {
      name: card.name,
      type_line: card.type_line,
      mana_cost: card.mana_cost,
      oracle_text: card.oracle_text || "",
      pt: card.power ? `${card.power}/${card.toughness}` : card.loyalty ? `Lealdade ${card.loyalty}` : "",
    },
  ];
}

async function translate(text) {
  if (!text) return "";
  const url =
    "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=" +
    encodeURIComponent(text);
  const r = await fetch(url);
  if (!r.ok) throw new Error("translate " + r.status);
  const j = await r.json();
  return j[0].map((p) => p[0]).join("");
}

async function load(id) {
  const key = "card:" + id;
  const cached = (await chrome.storage.local.get(key))[key];
  if (cached) return cached;

  const card = await sf("/cards/" + id);
  const fs = faces(card);

  let ptFaces = null;
  try {
    const res = await sf(
      `/cards/search?q=oracleid%3A${card.oracle_id}+lang%3Apt&unique=prints&order=released`
    );
    const p = res.data.find((c) => c.printed_text || (c.card_faces || []).some((f) => f.printed_text));
    if (p) {
      ptFaces = p.card_faces && !p.printed_text
        ? p.card_faces.map((f) => ({ name: f.printed_name, text: f.printed_text, type: f.printed_type_line }))
        : [{ name: p.printed_name, text: p.printed_text, type: p.printed_type_line }];
    }
  } catch (_) {}

  let rulings = [];
  try {
    const r = await sf(`/cards/${id}/rulings`);
    rulings = r.data.map((x) => x.comment).slice(-6);
  } catch (_) {}

  const out = { oracleId: card.oracle_id, faces: [], rulings: [], rulingsPt: [] };
  for (let i = 0; i < fs.length; i++) {
    const f = fs[i];
    const ptf = ptFaces && ptFaces[i];
    let text = ptf && ptf.text;
    let official = !!text;
    if (!text) {
      try { text = await translate(f.oracle_text); } catch (_) { text = ""; }
    }
    let typePt = ptf && ptf.type;
    if (!typePt) { try { typePt = await translate(f.type_line); } catch (_) { typePt = f.type_line; } }
    out.faces.push({
      ...f,
      name_pt: (ptf && ptf.name) || f.name,
      type_pt: typePt,
      text_pt: text,
      text_pt_official: official,
    });
  }
  out.rulings = rulings;
  for (const r of rulings) {
    try { out.rulingsPt.push(await translate(r)); } catch (_) { out.rulingsPt.push(r); }
  }

  await chrome.storage.local.set({ [key]: out });
  return out;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function brief(c) {
  const iu = c.image_uris || c.card_faces?.[0]?.image_uris || {};
  return {
    id: c.id,
    oracleId: c.oracle_id || c.card_faces?.[0]?.oracle_id,
    name: c.printed_name || c.card_faces?.map((f) => f.printed_name || f.name).join(" // ") || c.name,
    en: c.name,
    lang: c.lang,
    set: (c.set || "").toUpperCase(),
    num: c.collector_number || "",
    img: iu.normal || iu.large || "",
    small: iu.small || iu.normal || "",
    type: c.printed_type_line || c.type_line || c.card_faces?.[0]?.type_line || "",
    pt: c.power != null ? `${c.power}/${c.toughness}` : c.card_faces?.[0]?.power != null
      ? `${c.card_faces[0].power}/${c.card_faces[0].toughness}` : "",
  };
}

async function searchCards(q, tokens) {
  q = (q || "").trim();
  if (UUID_RE.test(q)) return [brief(await sf("/cards/" + q))];
  const m = !tokens && q.match(/^([a-z0-9]{2,6})\s*[\s#/-]\s*(\d+[a-z★]?)$/i);
  if (m) {
    try { return [brief(await sf(`/cards/${m[1].toLowerCase()}/${encodeURIComponent(m[2])}`))]; } catch (_) {}
  }
  const extra = tokens ? "&include_extras=true" : "";
  const order = tokens ? "name" : "edhrec";
  const run = (query) =>
    sf(`/cards/search?q=${encodeURIComponent(query)}&unique=cards&order=${order}${extra}`).then((r) => r.data).catch(() => []);
  const base = tokens ? q + " t:token" : q;
  const [en, pt] = await Promise.all([run(base), run(base + " lang:pt")]);
  const seen = new Set();
  const out = [];
  for (const c of [...en, ...pt]) {
    const b = brief(c);
    if (!b.img || seen.has(b.oracleId)) continue;
    seen.add(b.oracleId);
    out.push(b);
    if (out.length >= (tokens ? 30 : 18)) break;
  }
  return out;
}

const PROVIDERS = {
  openrouter: { name: "OpenRouter", base: "https://openrouter.ai/api/v1", keyField: "orKey", modelField: "orModel", cache: "orModels" },
  groq: { name: "Groq", base: "https://api.groq.com/openai/v1", keyField: "gqKey", modelField: "gqModel", cache: "gqModels" },
};
const DEFAULTS = { provider: "openrouter", orKey: "", orModel: "", gqKey: "", gqModel: "", orFreeOnly: true, orAutoExplain: true };

async function settings() {
  return { ...DEFAULTS, ...(await chrome.storage.local.get(Object.keys(DEFAULTS))) };
}

const prov = (id) => PROVIDERS[id] || PROVIDERS.openrouter;

function publicSettings(s) {
  const p = prov(s.provider);
  return {
    provider: s.provider in PROVIDERS ? s.provider : "openrouter",
    providerName: p.name,
    model: s[p.modelField],
    hasKey: !!s[p.keyField],
    freeOnly: s.orFreeOnly,
  };
}

function isFree(m) {
  const p = m.pricing || {};
  return m.id.endsWith(":free") ||
    (Number(p.prompt) === 0 && Number(p.completion) === 0 && Number(p.request || 0) === 0);
}

const GROQ_NON_CHAT = /whisper|tts|guard|orpheus|playai|distil/i;

async function models(providerId, force, keyOverride) {
  const s = await settings();
  const id = providerId || s.provider;
  const p = prov(id);
  const key = keyOverride || s[p.keyField];
  const c = (await chrome.storage.local.get(p.cache))[p.cache];
  if (!force && !keyOverride && c && c.list.length && Date.now() - c.at < 3600e3) return c.list;

  let list;
  if (id === "groq") {
    if (!key) return [];
    const r = await fetch(p.base + "/models", { headers: { Authorization: "Bearer " + key } });
    if (!r.ok) throw new Error("Groq " + r.status + (r.status === 401 ? " (chave inválida)" : ""));
    const j = await r.json();
    list = j.data
      .filter((m) => m.active !== false && !GROQ_NON_CHAT.test(m.id))
      .map((m) => ({ id: m.id, name: m.id, ctx: m.context_window || 0, free: true, inPrice: 0, outPrice: 0 }));
  } else {
    const r = await fetch(p.base + "/models");
    if (!r.ok) throw new Error("OpenRouter " + r.status);
    const j = await r.json();
    list = j.data.map((m) => ({
      id: m.id,
      name: m.name || m.id,
      ctx: m.context_length || 0,
      free: isFree(m),
      inPrice: Number(m.pricing?.prompt || 0) * 1e6,
      outPrice: Number(m.pricing?.completion || 0) * 1e6,
    }));
  }
  list.sort((a, b) => a.name.localeCompare(b.name));
  if (!keyOverride) await chrome.storage.local.set({ [p.cache]: { at: Date.now(), list } });
  return list;
}

function apiError(providerId, j, status) {
  const name = prov(providerId).name;
  const msg = j?.error?.message || ("HTTP " + status);
  if (status === 401) return `Chave do ${name} inválida. Confira nas configurações.`;
  if (status === 402) return `Sem créditos no ${name} para este modelo. Use um modelo gratuito.`;
  if (status === 413) return "Mensagem grande demais para o limite deste modelo. Limpe o chat ou troque de modelo.";
  if (status === 429) return "Limite de uso atingido (comum em planos gratuitos). Espere um pouco ou troque de modelo.";
  return msg;
}

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "chat") return;
  const ctrl = new AbortController();
  port.onDisconnect.addListener(() => ctrl.abort());
  port.onMessage.addListener(async ({ messages, model }) => {
    const post = (m) => { try { port.postMessage(m); } catch (_) {} };
    try {
      const s = await settings();
      const pid = s.provider in PROVIDERS ? s.provider : "openrouter";
      const p = prov(pid);
      const key = s[p.keyField];
      if (!key) return post({ error: `Configure sua chave do ${p.name} nas configurações da extensão.` });
      const useModel = model || s[p.modelField];
      if (!useModel) return post({ error: "Escolha um modelo nas configurações." });
      const body = { model: useModel, messages, stream: true, temperature: 0.3 };
      const headers = { Authorization: "Bearer " + key, "Content-Type": "application/json" };
      if (pid === "openrouter") {
        body.reasoning = { effort: "low", exclude: true };
        headers["X-Title"] = "Convoke Card Helper";
      }
      const r = await fetch(p.base + "/chat/completions", {
        method: "POST",
        signal: ctrl.signal,
        headers,
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        let j = null; try { j = await r.json(); } catch (_) {}
        return post({ error: apiError(pid, j, r.status) });
      }
      const reader = r.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let thinking = false;
      let inThink = false;
      let sent = false;
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let i;
        while ((i = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, i).trim();
          buf = buf.slice(i + 1);
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (data === "[DONE]") return post({ done: true });
          try {
            const j = JSON.parse(data);
            if (j.error) return post({ error: j.error.message || "Erro do modelo" });
            const delta = j.choices?.[0]?.delta || {};
            let content = delta.content || "";
            if (content) {
              let out = "";
              while (content) {
                if (inThink) {
                  const e = content.indexOf("</think>");
                  if (e < 0) { content = ""; break; }
                  inThink = false; content = content.slice(e + 8);
                } else {
                  const b = content.indexOf("<think>");
                  if (b < 0) { out += content; break; }
                  out += content.slice(0, b); inThink = true; content = content.slice(b + 7);
                  if (!thinking) { thinking = true; post({ thinking: true }); }
                }
              }
              if (!sent) out = out.replace(/^\s+/, "");
              if (out) { sent = true; post({ delta: out }); }
            }
            if (!delta.content && (delta.reasoning || delta.reasoning_details) && !thinking) { thinking = true; post({ thinking: true }); }
          } catch (_) {}
        }
      }
      post({ done: true });
    } catch (e) {
      if (e.name !== "AbortError") post({ error: String(e.message || e) });
    }
  });
});

chrome.action.onClicked.addListener(async (tab) => {
  try {
    if (!tab.url || !tab.url.startsWith("https://convoke.games/")) throw 0;
    await chrome.tabs.sendMessage(tab.id, { type: "openSettings" });
  } catch (_) {
    chrome.runtime.openOptionsPage();
  }
});

async function testKey(providerId, key) {
  if (!key) throw new Error("Cole a chave primeiro.");
  if (providerId === "groq") {
    const list = await models("groq", true, key);
    return `Chave válida. ${list.length} modelos de chat disponíveis (plano gratuito com limites por minuto/dia).`;
  }
  const r = await fetch(PROVIDERS.openrouter.base + "/key", { headers: { Authorization: "Bearer " + key } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error?.message || "HTTP " + r.status);
  const d = j.data || {};
  return `Chave válida. Uso: $${(d.usage || 0).toFixed(4)}` +
    (d.limit != null ? ` de $${d.limit}` : " (sem limite)") + (d.is_free_tier ? " · plano gratuito" : "");
}

chrome.runtime.onMessage.addListener((msg, _s, send) => {
  if (!msg) return;
  if (msg.type === "card") {
    load(msg.id).then((d) => send({ ok: true, data: d })).catch((e) => send({ ok: false, error: String(e) }));
    return true;
  }
  if (msg.type === "named") {
    const q = encodeURIComponent(msg.name || "");
    sf("/cards/named?exact=" + q)
      .catch(() => sf("/cards/named?fuzzy=" + q))
      .then((c) => send({ ok: true, card: brief(c) }))
      .catch((e) => send({ ok: false, error: String(e.message || e) }));
    return true;
  }
  if (msg.type === "search") {
    searchCards(msg.q, msg.tokens).then((list) => send({ ok: true, list })).catch((e) => send({ ok: false, error: String(e.message || e) }));
    return true;
  }
  if (msg.type === "models") {
    Promise.all([models(msg.provider, msg.force, msg.key), settings()])
      .then(([list, s]) => send({ ok: true, list, settings: publicSettings(s) }))
      .catch((e) => send({ ok: false, error: String(e.message || e) }));
    return true;
  }
  if (msg.type === "setModel") {
    settings()
      .then((s) => chrome.storage.local.set({ [prov(s.provider).modelField]: msg.model }))
      .then(() => send({ ok: true }));
    return true;
  }
  if (msg.type === "testKey") {
    testKey(msg.provider, msg.key).then((text) => send({ ok: true, text })).catch((e) => send({ ok: false, error: e.message }));
    return true;
  }
});
