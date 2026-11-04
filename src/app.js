import { MarketDataClient } from "./data/deriv-client.js";
import { OperationBook } from "./core/operation-book.js";

const $ = (id) => document.getElementById(id);
const marketList = $("market-list");
const searchInput = $("market-search");
const operations = new OperationBook();
let symbols = [];
let selected = null;

function setConnection(connected, label) {
  $("connection-dot").style.background = connected ? "var(--accent)" : "#77849a";
  $("connection-label").textContent = label;
}
function renderMarkets(filter = "") {
  const visible = symbols.filter(s => (s.display_name || s.symbol).toLowerCase().includes(filter.toLowerCase()));
  $("market-count").textContent = String(visible.length);
  marketList.innerHTML = "";
  if (!visible.length) {
    marketList.innerHTML = '<div class="empty">No hay instrumentos disponibles.</div>';
    return;
  }
  visible.forEach(symbol => {
    const button = document.createElement("button");
    button.className = "market-item" + (selected?.symbol === symbol.symbol ? " active" : "");
    button.type = "button";
    button.innerHTML = '<span></span><small>DERIV</small>';
    button.querySelector("span").textContent = symbol.display_name || symbol.symbol;
    button.addEventListener("click", () => selectMarket(symbol));
    marketList.append(button);
  });
}
function selectMarket(symbol) {
  selected = symbol;
  $("selected-symbol").textContent = symbol.display_name || symbol.symbol;
  $("chart-title").textContent = symbol.display_name || symbol.symbol;
  $("last-price").textContent = "—";
  $("chart-status").textContent = "Esperando cotización";
  renderMarkets(searchInput.value);
  client.subscribe(symbol.symbol);
}
function renderOperations() {
  const rows = operations.all();
  $("active-count").textContent = rows.filter(x => x.status === "ACTIVA").length;
  $("won-count").textContent = rows.filter(x => x.status === "GANADA").length;
  $("lost-count").textContent = rows.filter(x => x.status === "PERDIDA").length;
  $("operations-list").innerHTML = rows.length ? rows.map(x => '<div class="operation-row"><span>' + x.symbol + ' · ' + x.side + '</span><b>' + x.status + '</b></div>').join("") : "Cuando pulses ENTRÉ en una señal, aparecerá aquí.";
}
const client = new MarketDataClient({
  onStatus: status => setConnection(status.connected, status.label),
  onSymbols: list => { symbols = list; renderMarkets(searchInput.value); },
  onTick: tick => {
    if (selected?.symbol !== tick.symbol) return;
    $("last-price").textContent = String(tick.quote);
    $("chart-status").textContent = "Último tick recibido · " + new Date().toLocaleTimeString("es-PA");
  },
  onError: error => { $("chart-status").textContent = error; }
});
searchInput.addEventListener("input", () => renderMarkets(searchInput.value));
$("refresh-btn").addEventListener("click", () => client.connect());
$("fullscreen-btn").addEventListener("click", () => {
  const panel = document.querySelector(".chart-panel");
  panel.classList.toggle("fullscreen");
  $("fullscreen-btn").textContent = panel.classList.contains("fullscreen") ? "Salir de pantalla completa" : "Pantalla completa";
});
$("dialog-close").addEventListener("click", () => $("engine-dialog").close());
document.querySelectorAll("[data-engine]").forEach(button => button.addEventListener("click", () => {
  const structure = button.dataset.engine === "structure";
  $("dialog-title").textContent = structure ? "Motor de estructura" : "Canal de tres toques";
  $("dialog-copy").textContent = structure
    ? "Este motor tendrá su propio análisis de pivotes, liquidez, OB, TP1, TP2 y SL. Sus reglas de entrada se mantendrán separadas."
    : "Este motor tendrá su propio cálculo de canal, temporalidad de estructura, tolerancia de contacto y confirmación de tres velas.";
  $("engine-dialog").showModal();
}));
renderOperations();
client.connect();
window.addEventListener("beforeunload", () => client.disconnect());