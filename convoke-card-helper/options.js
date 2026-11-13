const $ = (id) => document.getElementById(id);
let all = [];
let chosen = "";

const price = (m) =>
  m.free ? "grátis" : `$${m.inPrice.toFixed(2)} / $${m.outPrice.toFixed(2)} por 1M tokens`;
const ctx = (n) => (n >= 1000 ? Math.round(n / 1000) + "k" : n) + " ctx";

function renderList() {
  const q = $("search").value.trim().toLowerCase();
  const freeOnly = $("free").checked;
  const list = all.filter(
    (m) => (!freeOnly || m.free) && (!q || m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q))
  );
  const sel = $("model");
  sel.innerHTML = "";
  for (const m of list) {
    const o = document.createElement("option");
    o.value = m.id;
    o.textContent = `${m.name}  —  ${price(m)}  ·  ${ctx(m.ctx)}`;
    if (m.id === chosen) o.selected = true;
    sel.appendChild(o);
  }
  $("modelMsg").textContent =
    `${list.length} modelo(s) exibidos de ${all.length}.` + (chosen ? ` Selecionado: ${chosen}` : " Nenhum selecionado.");
}

async function loadModels(force) {
  $("modelMsg").textContent = "Carregando modelos…";
  const res = await chrome.runtime.sendMessage({ type: "models", force });
  if (!res.ok) { $("modelMsg").textContent = "Erro ao carregar: " + res.error; return; }
  all = res.list;
  renderList();
}

async function init() {
  const s = await chrome.storage.local.get({ orKey: "", orModel: "", orFreeOnly: true });
  $("key").value = s.orKey;
  $("free").checked = s.orFreeOnly;
  chosen = s.orModel;
  await loadModels(false);
}

$("search").addEventListener("input", renderList);
$("free").addEventListener("change", renderList);
$("refresh").addEventListener("click", () => loadModels(true));
$("model").addEventListener("change", (e) => { chosen = e.target.value; renderList(); });

$("toggle").addEventListener("click", () => {
  const k = $("key");
  k.type = k.type === "password" ? "text" : "password";
  $("toggle").textContent = k.type === "password" ? "Mostrar" : "Ocultar";
});

$("test").addEventListener("click", async () => {
  const m = $("keyMsg");
  m.className = "msg"; m.textContent = "Testando…";
  try {
    const r = await fetch("https://openrouter.ai/api/v1/key", {
      headers: { Authorization: "Bearer " + $("key").value.trim() },
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j?.error?.message || "HTTP " + r.status);
    const d = j.data || {};
    m.className = "msg ok";
    m.textContent = `Chave válida. Uso: $${(d.usage || 0).toFixed(4)}` +
      (d.limit != null ? ` de $${d.limit}` : " (sem limite)") + (d.is_free_tier ? " · plano gratuito" : "");
  } catch (e) {
    m.className = "msg err"; m.textContent = "Falhou: " + e.message;
  }
});

$("save").addEventListener("click", async () => {
  await chrome.storage.local.set({
    orKey: $("key").value.trim(),
    orModel: chosen,
    orFreeOnly: $("free").checked,
  });
  $("saveMsg").className = "msg ok";
  $("saveMsg").textContent = "Salvo!";
  setTimeout(() => ($("saveMsg").textContent = ""), 2000);
});

init();
