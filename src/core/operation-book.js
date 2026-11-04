// Registro local de seguimiento manual. No ejecuta operaciones reales.
export class OperationBook {
  constructor() { this.items = []; }
  enter({ symbol, side, entry, stopLoss, takeProfit1, takeProfit2 }) {
    const item = {
      id: globalThis.crypto?.randomUUID?.() || String(Date.now()) + Math.random(),
      symbol, side, entry, stopLoss, takeProfit1, takeProfit2,
      status: "ACTIVA", openedAt: Date.now(), closedAt: null
    };
    this.items.unshift(item);
    return item;
  }
  close(id, result) {
    const item = this.items.find(x => x.id === id && x.status === "ACTIVA");
    if (!item || !["GANADA", "PERDIDA"].includes(result)) return false;
    item.status = result;
    item.closedAt = Date.now();
    return true;
  }
  all() { return this.items.map(x => ({ ...x })); }
}