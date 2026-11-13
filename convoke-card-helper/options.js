const $ = (id) => document.getElementById(id);

// Estado da página (não salvo até clicar em "Salvar").
const st = { provider: "openrouter", keys: {}, models: {}, lists: {} };

const UI = {
  openrouter: {
    help: `Crie em <a href="https://openrouter.ai/keys" target="_blank" rel="noopener">openrouter.ai/keys</a> e cole aqui. Ela fica salva só neste navegador.`,
    placeholder: "sk-or-v1-...",
  },
  groq: {
    help: `Crie grátis em <a href="https://console.groq.com/keys" target="_blank" rel="noopener">console.groq.com/keys</a> e cole aqui. Ela fica salva só neste navegador. O plano gratuito tem limite por minuto/dia.`,
    placeholder: "gsk_...",
  },
};

const price = (m) =>
  m.free ? "grátis" : `$${m.inPrice.toFixed(2)} / $${m.outPrice.toFixed(2)} por 1M tokens`;
const ctx = (n) => (n >= 1000 ? Math.round(n / 1000) + "k" : n) + " ctx";

function renderList() {
  const all = st.lists[st.provider] || [];
  const chosen = st.models[st.provider];
  const q = $("search").value.trim().toLowerCase();
  const freeOnly = st.provider === "openrouter" && $("free").checked;
  const list = all.filter(
    (m) => (!freeOnly || m.free) && (!q || m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q))
  );
  const sel = $("model");
  sel.innerHTML = "";
  for (const m of list) {
    const o = document.createElement("option");
    o.value = m.id;
    o.textContent = st.provider === "groq" ? `${m.name}  ·  ${ctx(m.ctx)}` : `${m.name}  —  ${price(m)}  ·  ${ctx(m.ctx)}`;
    if (m.id === chosen) o.selected = true;
    sel.appendChild(o);
  }
  $("modelMsg").textContent =
    `${list.length} modelo(s) exibidos de ${all.length}.` + (chosen ? ` Selecionado: ${chosen}` : " Nenhum selecionado.");
}

async function loadModels(force) {
  const pid = st.provider;
  const key = $("key").value.trim();
  if (pid === "groq" && !key) {
    st.lists.groq = [];
    $("model").innerHTML = "";
    $("modelMsg").textContent = 'Cole sua chave do Groq e clique em "Testar" para ver os modelos.';
    return;
  }
  $("modelMsg").textContent = "Carregando modelos…";
  const res = await chrome.runtime.sendMessage({ type: "models", provider: pid, force, key: pid === "groq" ? key : undefined });
  if (pid !== st.provider) return; // trocou de provedor enquanto carregava
  if (!res || !res.ok) { $("modelMsg").textContent = "Erro ao carregar: " + (res?.error || "sem resposta"); return; }
  st.lists[pid] = res.list;
  renderList();
}

function showProvider() {
  const ui = UI[st.provider];
  $("provider").value = st.provider;
  $("keyHelp").innerHTML = ui.help;
  $("key").placeholder = ui.placeholder;
  $("key").value = st.keys[st.provider] || "";
  $("keyMsg").textContent = "";
  $("freeRow").style.display = st.provider === "groq" ? "none" : "";
  if (st.lists[st.provider]) renderList(); else loadModels(false);
}

async function init() {
  const s = await chrome.storage.local.get({
    provider: "openrouter", orKey: "", orModel: "", gqKey: "", gqModel: "", orFreeOnly: true,
  });
  st.provider = UI[s.provider] ? s.provider : "openrouter";
  st.keys = { openrouter: s.orKey, groq: s.gqKey };
  st.models = { openrouter: s.orModel, groq: s.gqModel };
  $("free").checked = s.orFreeOnly;
  showProvider();
}

$("provider").addEventListener("change", (e) => {
  st.keys[st.provider] = $("key").value.trim(); // guarda o que foi digitado antes de trocar
  st.provider = e.target.value;
  showProvider();
});
$("search").addEventListener("input", renderList);
$("free").addEventListener("change", renderList);
$("refresh").addEventListener("click", () => loadModels(true));
$("model").addEventListener("change", (e) => { st.models[st.provider] = e.target.value; renderList(); });

$("toggle").addEventListener("click", () => {
  const k = $("key");
  k.type = k.type === "password" ? "text" : "password";
  $("toggle").textContent = k.type === "password" ? "Mostrar" : "Ocultar";
});

$("test").addEventListener("click", async () => {
  const m = $("keyMsg");
  m.className = "msg"; m.textContent = "Testando…";
  const r = await chrome.runtime.sendMessage({ type: "testKey", provider: st.provider, key: $("key").value.trim() });
  if (r && r.ok) {
    m.className = "msg ok"; m.textContent = r.text;
    if (st.provider === "groq") loadModels(true);
  } else {
    m.className = "msg err"; m.textContent = "Falhou: " + (r?.error || "sem resposta");
  }
});

$("save").addEventListener("click", async () => {
  st.keys[st.provider] = $("key").value.trim();
  await chrome.storage.local.set({
    provider: st.provider,
    orKey: st.keys.openrouter || "",
    orModel: st.models.openrouter || "",
    gqKey: st.keys.groq || "",
    gqModel: st.models.groq || "",
    orFreeOnly: $("free").checked,
  });
  $("saveMsg").className = "msg ok";
  $("saveMsg").textContent = "Salvo!";
  setTimeout(() => ($("saveMsg").textContent = ""), 2000);
});

init();
