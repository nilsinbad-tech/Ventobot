export class CandleChart {
  constructor(canvas, emptyEl, statusEl) {
    this.canvas = canvas; this.ctx = canvas.getContext("2d");
    this.emptyEl = emptyEl; this.statusEl = statusEl;
    this.data = []; this.start = 0; this.visible = 120; this.drag = null;
    this.resizeObserver = new ResizeObserver(() => this.draw());
    this.resizeObserver.observe(canvas.parentElement);
    canvas.addEventListener("pointerdown", e => this.pointerDown(e));
    canvas.addEventListener("pointermove", e => this.pointerMove(e));
    canvas.addEventListener("pointerup", () => this.pointerUp());
    canvas.addEventListener("pointercancel", () => this.pointerUp());
    canvas.addEventListener("wheel", e => this.wheel(e), { passive:false });
    this.draw();
  }
  setData(data) {
    const wasEmpty = !this.data.length;
    this.data = data;
    if (wasEmpty) { this.visible = Math.min(120, Math.max(30, data.length)); this.start = Math.max(0, data.length-this.visible); }
    else this.start = Math.min(this.start, Math.max(0,data.length-this.visible));
    this.emptyEl.hidden = !!data.length;
    this.draw();
  }
  append(candle) {
    const i = this.data.findIndex(x => x.epoch === candle.epoch);
    if (i >= 0) this.data[i] = candle; else this.data.push(candle);
    this.data.sort((a,b)=>a.epoch-b.epoch);
    if (this.data.length > 2000) this.data.shift();
    if (!this.drag && this.start + this.visible >= this.data.length - 2) this.start = Math.max(0,this.data.length-this.visible);
    this.emptyEl.hidden = !this.data.length; this.draw();
  }
  pointerDown(e) {
    if (!this.data.length) return;
    this.canvas.setPointerCapture(e.pointerId);
    this.drag = { x:e.clientX, start:this.start };
  }
  pointerMove(e) {
    if (!this.drag) return;
    const rect=this.canvas.getBoundingClientRect(), step=rect.width/this.visible;
    const delta=Math.round((this.drag.x-e.clientX)/step);
    this.start=Math.max(0,Math.min(Math.max(0,this.data.length-this.visible),this.drag.start+delta));
    this.draw();
  }
  pointerUp(){this.drag=null;}
  wheel(e) {
    if (!this.data.length) return;
    e.preventDefault();
    const rect=this.canvas.getBoundingClientRect(), ratio=(e.clientX-rect.left)/rect.width;
    const old=this.visible, next=Math.max(25,Math.min(600,Math.round(old*(e.deltaY>0?1.18:.84))));
    const anchor=this.start+ratio*old;
    this.visible=next;
    this.start=Math.max(0,Math.min(Math.max(0,this.data.length-next),Math.round(anchor-ratio*next)));
    this.draw();
  }
  draw() {
    const c=this.canvas, ctx=this.ctx, rect=c.getBoundingClientRect(), dpr=Math.max(1,window.devicePixelRatio||1);
    if (!rect.width || !rect.height) return;
    c.width=Math.round(rect.width*dpr); c.height=Math.round(rect.height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const w=rect.width,h=rect.height;
    ctx.clearRect(0,0,w,h); ctx.fillStyle="#0b1424"; ctx.fillRect(0,0,w,h);
    if (!this.data.length) { this.statusEl.textContent="Esperando velas M1"; return; }
    const end=Math.min(this.data.length,this.start+this.visible), view=this.data.slice(this.start,end);
    if (!view.length) return;
    const min=Math.min(...view.map(x=>x.low)), max=Math.max(...view.map(x=>x.high));
    const pad=(max-min)*.09 || Math.max(Math.abs(max)*.0005,.000001), lo=min-pad, hi=max+pad;
    const left=8,right=76,top=14,bottom=25,plotW=w-left-right,plotH=h-top-bottom;
    const y=v=>top+(hi-v)/(hi-lo)*plotH, step=plotW/this.visible, body=Math.max(2,Math.min(10,step*.62));
    ctx.font="10px system-ui"; ctx.textAlign="right"; ctx.textBaseline="middle";
    for(let i=0;i<=5;i++){
      const val=hi-(hi-lo)*i/5, yy=top+plotH*i/5;
      ctx.strokeStyle="#20304a";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(left,yy);ctx.lineTo(w-right,yy);ctx.stroke();
      ctx.fillStyle="#8fa1bc";ctx.fillText(Number(val).toPrecision(7).replace(/\.?0+$/,""),w-7,yy);
    }
    view.forEach((c,i)=>{
      const x=left+(i+.5)*step, up=c.close>=c.open, color=up?"#4bd6ae":"#ff7185";
      ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(x,y(c.high));ctx.lineTo(x,y(c.low));ctx.stroke();
      const topY=y(Math.max(c.open,c.close)), height=Math.max(1,Math.abs(y(c.open)-y(c.close)));
      ctx.fillRect(x-body/2,topY,body,height);
    });
    const last=view[view.length-1], py=y(last.close);
    ctx.strokeStyle="#f3c969";ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(left,py);ctx.lineTo(w-right,py);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle="#f3c969";ctx.fillRect(w-right,py-8,right-5,16);
    ctx.fillStyle="#172238";ctx.textAlign="center";ctx.fillText(String(last.close),w-right/2,py);
    ctx.fillStyle="#8fa1bc";ctx.textAlign="left";
    [view[0],view[Math.floor(view.length/2)],view[view.length-1]].forEach((c,i)=>{
      const x=left+[0,.5,1][i]*plotW;
      ctx.fillText(new Date(c.epoch*1000).toLocaleTimeString("es-PA",{hour:"2-digit",minute:"2-digit"}),x,h-10);
    });
    this.statusEl.textContent=`${view.length} velas visibles · ${this.data.length} cargadas · M1`;
  }
}
