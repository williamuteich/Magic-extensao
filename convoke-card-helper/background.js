// Service worker: busca dados no Scryfall e traduz. Resultados ficam em cache.
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

  // Versão impressa em português (se existir alguma edição em PT)
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

  // Rulings (esclarecimentos oficiais)
  let rulings = [];
  try {
    const r = await sf(`/cards/${id}/rulings`);
    rulings = r.data.map((x) => x.comment).slice(-6);
  } catch (_) {}

  // Tradução automática (usada quando não há texto impresso em PT)
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

// ---------------- OpenRouter ----------------
const OR = "https://openrouter.ai/api/v1";
const DEFAULTS = { orKey: "", orModel: "", orFreeOnly: true, orAutoExplain: true };

async function settings() {
  return { ...DEFAULTS, ...(await chrome.storage.local.get(Object.keys(DEFAULTS))) };
}

function isFree(m) {
  const p = m.pricing || {};
  return m.id.endsWith(":free") ||
    (Number(p.prompt) === 0 && Number(p.completion) === 0 && Number(p.request || 0) === 0);
}

async function models(force) {
  const c = (await chrome.storage.local.get("orModels")).orModels;
  if (!force && c && Date.now() - c.at < 3600e3) return c.list;
  const r = await fetch(OR + "/models");
  if (!r.ok) throw new Error("OpenRouter " + r.status);
  const j = await r.json();
  const list = j.data
    .map((m) => ({
      id: m.id,
      name: m.name || m.id,
      ctx: m.context_length || 0,
      free: isFree(m),
      inPrice: Number(m.pricing?.prompt || 0) * 1e6, // US$ por 1M tokens
      outPrice: Number(m.pricing?.completion || 0) * 1e6,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  await chrome.storage.local.set({ orModels: { at: Date.now(), list } });
  return list;
}

function orError(j, status) {
  const msg = j?.error?.message || ("HTTP " + status);
  if (status === 401) return "Chave do OpenRouter inválida. Confira nas configurações.";
  if (status === 402) return "Sem créditos no OpenRouter para este modelo. Use um modelo gratuito.";
  if (status === 429) return "Limite de uso atingido (comum em modelos gratuitos). Espere um pouco ou troque de modelo.";
  return msg;
}

// Chat com streaming via Port
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "chat") return;
  const ctrl = new AbortController();
  port.onDisconnect.addListener(() => ctrl.abort());
  port.onMessage.addListener(async ({ messages, model }) => {
    const post = (m) => { try { port.postMessage(m); } catch (_) {} };
    try {
      const s = await settings();
      if (!s.orKey) return post({ error: "Configure sua chave do OpenRouter nas configurações da extensão." });
      const useModel = model || s.orModel;
      if (!useModel) return post({ error: "Escolha um modelo nas configurações." });
      const r = await fetch(OR + "/chat/completions", {
        method: "POST",
        signal: ctrl.signal,
        headers: {
          Authorization: "Bearer " + s.orKey,
          "Content-Type": "application/json",
          "X-Title": "Convoke Card Helper",
        },
        // reasoning.effort "low": modelos que "pensam" respondem mais rápido e não gastam tudo raciocinando.
        // Modelos sem suporte simplesmente ignoram.
        body: JSON.stringify({ model: useModel, messages, stream: true, reasoning: { effort: "low", exclude: true } }),
      });
      if (!r.ok) {
        let j = null; try { j = await r.json(); } catch (_) {}
        return post({ error: orError(j, r.status) });
      }
      const reader = r.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let thinking = false;
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let i;
        while ((i = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, i).trim();
          buf = buf.slice(i + 1);
          if (!line.startsWith("data:")) continue; // ignora comentários ": OPENROUTER PROCESSING"
          const data = line.slice(5).trim();
          if (data === "[DONE]") return post({ done: true });
          try {
            const j = JSON.parse(data);
            if (j.error) return post({ error: j.error.message || "Erro do modelo" });
            const delta = j.choices?.[0]?.delta || {};
            if (delta.content) post({ delta: delta.content });
            else if ((delta.reasoning || delta.reasoning_details) && !thinking) { thinking = true; post({ thinking: true }); }
          } catch (_) {}
        }
      }
      post({ done: true });
    } catch (e) {
      if (e.name !== "AbortError") post({ error: String(e.message || e) });
    }
  });
});

// Clique no ícone: abre o modal de configurações dentro da página do Convoke.
// Em outros sites, cai na página de opções.
chrome.action.onClicked.addListener(async (tab) => {
  try {
    if (!tab.url || !tab.url.startsWith("https://convoke.games/")) throw 0;
    await chrome.tabs.sendMessage(tab.id, { type: "openSettings" });
  } catch (_) {
    chrome.runtime.openOptionsPage();
  }
});

async function testKey(key) {
  const r = await fetch(OR + "/key", { headers: { Authorization: "Bearer " + key } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error?.message || "HTTP " + r.status);
  return j.data || {};
}

chrome.runtime.onMessage.addListener((msg, _s, send) => {
  if (!msg) return;
  if (msg.type === "card") {
    load(msg.id).then((d) => send({ ok: true, data: d })).catch((e) => send({ ok: false, error: String(e) }));
    return true; // resposta assíncrona
  }
  if (msg.type === "models") {
    Promise.all([models(msg.force), settings()])
      .then(([list, s]) => send({ ok: true, list, settings: { ...s, orKey: s.orKey ? "set" : "" } }))
      .catch((e) => send({ ok: false, error: String(e) }));
    return true;
  }
  if (msg.type === "setModel") {
    chrome.storage.local.set({ orModel: msg.model }).then(() => send({ ok: true }));
    return true;
  }
  if (msg.type === "testKey") {
    testKey(msg.key).then((d) => send({ ok: true, data: d })).catch((e) => send({ ok: false, error: e.message }));
    return true;
  }
});
