export function mergeCandle(list, incoming) {
  const map = new Map(list.map(c => [c.epoch, c]));
  const old = map.get(incoming.epoch);
  map.set(incoming.epoch, old ? {
    ...old, ...incoming, high:Math.max(old.high,incoming.high), low:Math.min(old.low,incoming.low)
  } : incoming);
  return [...map.values()].sort((a,b) => a.epoch-b.epoch).slice(-2000);
}
export function formatPrice(value) {
  if (!Number.isFinite(value)) return "—";
  return value.toLocaleString("en-US", { maximumFractionDigits: 8 });
}
