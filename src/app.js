import { MarketDataClient } from "./data/deriv-client.js";
import { OperationBook } from "./core/operation-book.js";
import { mergeCandle, formatPrice } from "./core/candle-utils.js";
import { CandleChart } from "./ui/candle-chart.js";

const $ = id => document.getElementById(id);
const book = new OperationBook();
let symbols = [], selected = null, candles = [];
const chart = new CandleChart($("price-chart"), $("chart-empty"), $("chart-status"));
function setStatus(connected,label) {
  $("connection-dot").style.background = connected ? "var(--accent)" : "#77849a";
  $("connection-label").textContent = label;
}
function renderMarkets() {
  const term=$("market-search").value.trim().toLocaleLowerCase();
  const list=symbols.filter(s=>(s.display_name+" "+s.symbol).toLocaleLowerCase().includes(term));
  $("market-count").textContent=list.length+" / "+symbols.length;
  const root=$("market-list"); root.replaceChildren();
  if(!list.length){const p=document.createElement("div");p.className="empty";p.textContent=symbols.length?"No coincide ningún instrumento.":"Esperando lista de mercados de Deriv…";root.append(p);return;}
  list.forEach(s=>{
    const b=document.createElement("button");b.type="button";b.className="market-item"+(selected?.symbol===s.symbol?" active":"");
    const name=document.createElement("span");name.textContent=s.display_name;
    const code=document.createElement("small");code.textContent=s.symbol;
    b.append(name,code);b.addEventListener("click",()=>selectMarket(s));root.append(b);
  });
}
function selectMarket(s) {
  selected=s;candles=[];chart.setData([]);
  $("selected-symbol").textContent=s.display_name;$("chart-title").textContent=s.display_name+" · M1";
  $("last-price").textContent="—";$("chart-status").textContent="Descargando las últimas 24 horas…";
  $("form-message").textContent="";renderMarkets();client.subscribe(s.symbol);
}
function renderOperations() {
  const rows=book.all();
  $("active-count").textContent=rows.filter(x=>x.status==="ACTIVA").length;
  $("won-count").textContent=rows.filter(x=>x.status==="GANADA").length;
  $("lost-count").textContent=rows.filter(x=>x.status==="PERDIDA").length;
  const root=$("operations-list");root.replaceChildren();
  if(!rows.length){root.className="empty";root.textContent="Todavía no has registrado operaciones.";return;}
  root.className="operation-list";
  rows.forEach(x=>{
    const row=document.createElement("article");row.className="operation-row";
    const info=document.createElement("div");info.className="operation-info";
    const title=document.createElement("strong");title.textContent=x.symbol+" · "+x.side;
    const detail=document.createElement("small");detail.textContent="Entrada "+formatPrice(x.entry)+" · SL "+formatPrice(x.stopLoss)+" · TP1 "+formatPrice(x.takeProfit1)+" · TP2 "+formatPrice(x.takeProfit2);
    const state=document.createElement("span");state.className="status "+x.status.toLowerCase();state.textContent=x.status+(x.exitReason?" · "+x.exitReason:"");
    info.append(title,detail);row.append(info,state);
    if(x.status==="ACTIVA"){
      const actions=document.createElement("div");actions.className="operation-actions";
      [["GANADA","Marcar ganada"],["PERDIDA","Marcar perdida"],["CERRADA","Cerrar"]].forEach(([result,label])=>{
        const b=document.createElement("button");b.type="button";b.className="mini-btn";b.textContent=label;
        b.addEventListener("click",()=>{book.close(x.id,result,"Cierre manual");renderOperations();});actions.append(b);
      });row.append(actions);
    }
    root.append(row);
  });
}
const client = new MarketDataClient({
  onStatus:s=>setStatus(s.connected,s.label),
  onSymbols:list=>{symbols=list.slice(0,10);renderMarkets();if(!selected&&symbols.length)selectMarket(symbols[0]);},
  onHistoryLoading:()=>{$("chart-status").textContent="Descargando velas M1…";},
  onCandles:({symbol,list,candles:history})=>{
    if(selected?.symbol!==symbol)return;
    candles=history;chart.setData(candles);
    if(candles.length){$("last-price").textContent=formatPrice(candles[candles.length-1].close);}
    $("chart-status").textContent=candles.length+" velas cargadas · M1";
  },
  onCandle:({symbol,candle})=>{
    if(selected?.symbol!==symbol)return;
    candles=mergeCandle(candles,candle);chart.append(candle);
    $("last-price").textContent=formatPrice(candle.close);
    if(book.evaluatePrice(symbol,candle.close))renderOperations();
  },
  onTick:t=>{
    if(selected?.symbol!==t.symbol)return;
    $("last-price").textContent=formatPrice(t.quote);
    if(book.evaluatePrice(t.symbol,t.quote))renderOperations();
  },
  onError:error=>{$("chart-status").textContent=error;}
});
$("market-search").addEventListener("input",renderMarkets);
$("refresh-btn").addEventListener("click",()=>{client.disconnect();client.connect();});
$("fullscreen-btn").addEventListener("click",()=>{
  const panel=$("chart-panel"),active=panel.classList.toggle("fullscreen");
  $("fullscreen-btn").textContent=active?"Salir de pantalla completa":"Pantalla completa";
  setTimeout(()=>chart.draw(),60);
});
$("trade-form").addEventListener("submit",e=>{
  e.preventDefault();
  if(!selected){$("form-message").textContent="Primero selecciona un instrumento.";return;}
  try{
    book.enter({symbol:selected.symbol,side:$("trade-side").value,entry:$("trade-entry").value,stopLoss:$("trade-sl").value,takeProfit1:$("trade-tp1").value,takeProfit2:$("trade-tp2").value});
    $("form-message").textContent="Operación registrada en este dispositivo.";
    $("trade-form").reset();renderOperations();
  }catch(err){$("form-message").textContent=err.message;}
});
$("dialog-close").addEventListener("click",()=>$("engine-dialog").close());
document.querySelectorAll("[data-engine]").forEach(b=>b.addEventListener("click",()=>{
  const structure=b.dataset.engine==="structure";
  $("dialog-title").textContent=structure?"Motor de estructura":"Canal de tres toques";
  $("dialog-copy").textContent=structure
    ?"Este motor analizará su propia temporalidad, pivotes, liquidez, OB, TP1, TP2 y SL. Las condiciones finales todavía no están codificadas."
    :"Este motor tendrá su propio canal, temporalidad de estructura, regla de tres contactos y confirmación de tres velas. No se mezclará con el motor de estructura.";
  $("engine-dialog").showModal();
}));
renderOperations();client.connect();
window.addEventListener("beforeunload",()=>client.disconnect());
