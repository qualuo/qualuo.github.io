(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,31073,e=>{"use strict";var t=e.i(18050),r=e.i(71645),a=e.i(75056),i=e.i(71753),s=e.i(30297),n=e.i(90072),o=e.i(46932);function l(e,t=42){var r;let a=(r=t,()=>{let e=r+=0x6d2b79f5;return e=Math.imul(e^e>>>15,1|e),(((e^=e+Math.imul(e^e>>>7,61|e))^e>>>14)>>>0)/0x100000000}),i=new Float32Array(4*e);for(let t=0;t<e;t++){let e=360*a(),r=180*Math.asin(2*a()-1)/Math.PI,s=-1+14*Math.pow(a(),.3),n=.7>a()?.3+.8*a()+(a()-.5)*.3:1+ +a(),o=4*t;i[o]=e,i[o+1]=r,i[o+2]=s,i[o+3]=n}return i}async function c(){if("u"<typeof navigator)return{error:"SSR environment (no navigator)"};if(!("gpu"in navigator))return{error:"navigator.gpu not found — browser or extension may be blocking WebGPU"};try{let e=await navigator.gpu.requestAdapter();if(!e)return{error:"requestAdapter() returned null — GPU may be unsupported or blocklisted"};return{device:await e.requestDevice()}}catch(e){return{error:`requestDevice() threw: ${e instanceof Error?e.message:String(e)}`}}}let u=`
struct Params {
  count: u32,
  minMag: f32,
  maxMag: f32,
  time: f32,
  rotY: f32,
  pointScale: f32,
};

@group(0) @binding(0) var<storage, read> points: array<vec4<f32>>;
@group(0) @binding(1) var<storage, read_write> positions: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read_write> colors: array<vec4<f32>>;
@group(0) @binding(3) var<uniform> params: Params;

fn bvToColor(bv: f32) -> vec3<f32> {
  let t = 4600.0 * (1.0 / (0.92 * bv + 1.7) + 1.0 / (0.92 * bv + 0.62));
  var r: f32; var g: f32; var b: f32;
  if (t >= 6600.0) {
    r = 1.0;
    g = clamp(0.39 * log(t / 100.0 - 55.0) - 0.63, 0.0, 1.0);
    b = 1.0;
  } else {
    r = clamp(0.33 * log(t / 100.0) - 0.18, 0.0, 1.0);
    g = clamp(0.39 * log(t / 100.0) - 0.63, 0.0, 1.0);
    if (t >= 1900.0) {
      b = clamp(0.54 * log(t / 100.0 - 10.0) - 1.19, 0.0, 1.0);
    } else {
      b = 0.0;
    }
  }
  return vec3<f32>(r, g, b);
}

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let idx = gid.x;
  if (idx >= params.count) { return; }

  let pt = points[idx];
  let ra = pt.x;
  let dec = pt.y;
  let mag = pt.z;
  let bv = pt.w;

  // Magnitude filter
  if (mag < params.minMag || mag > params.maxMag) {
    positions[idx] = vec4<f32>(0.0, 0.0, 0.0, 0.0);
    colors[idx] = vec4<f32>(0.0, 0.0, 0.0, 0.0);
    return;
  }

  // Spherical to Cartesian
  let raRad = ra * 3.14159265 / 180.0;
  let decRad = dec * 3.14159265 / 180.0;
  let radius = 50.0;
  var x = radius * cos(decRad) * cos(raRad);
  let y = radius * sin(decRad);
  var z = radius * cos(decRad) * sin(raRad);

  // Apply Y rotation
  let cosR = cos(params.rotY);
  let sinR = sin(params.rotY);
  let rx = x * cosR - z * sinR;
  let rz = x * sinR + z * cosR;
  x = rx;
  z = rz;

  // Brightness from magnitude (brighter = lower mag)
  let brightness = clamp((12.0 - mag) / 12.0, 0.1, 1.0);
  let size = params.pointScale * brightness;

  positions[idx] = vec4<f32>(x, y, z, size);
  colors[idx] = vec4<f32>(bvToColor(bv) * brightness, brightness);
}
`,d=`
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
  @location(1) pointCoord: vec2<f32>,
};

struct Camera {
  viewProj: mat4x4<f32>,
};

@group(0) @binding(0) var<storage, read> positions: array<vec4<f32>>;
@group(0) @binding(1) var<storage, read> colors: array<vec4<f32>>;
@group(0) @binding(2) var<uniform> camera: Camera;

@vertex
fn main(@builtin(vertex_index) vid: u32, @builtin(instance_index) iid: u32) -> VertexOutput {
  let pos = positions[iid];
  let col = colors[iid];

  // Billboard quad (2 triangles, 6 vertices)
  let size = pos.w * 0.02;
  let offsets = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, -1.0), vec2<f32>(-1.0, 1.0),
    vec2<f32>(-1.0, 1.0), vec2<f32>(1.0, -1.0), vec2<f32>(1.0, 1.0),
  );
  let offset = offsets[vid];

  var worldPos = vec4<f32>(pos.xyz, 1.0);
  var clipPos = camera.viewProj * worldPos;

  // Offset in clip space for billboard
  clipPos.x += offset.x * size;
  clipPos.y += offset.y * size;

  var out: VertexOutput;
  out.position = clipPos;
  out.color = col;
  out.pointCoord = offset * 0.5 + 0.5;
  return out;
}
`,f=`
@fragment
fn main(@location(0) color: vec4<f32>, @location(1) pointCoord: vec2<f32>) -> @location(0) vec4<f32> {
  let dist = length(pointCoord - vec2<f32>(0.5, 0.5)) * 2.0;
  if (dist > 1.0) { discard; }
  let alpha = color.a * (1.0 - dist * dist);
  return vec4<f32>(color.rgb * alpha, alpha);
}
`;class p{device;canvas;context;computePipeline;renderPipeline;dataBuffer;posBuffer;colBuffer;paramsBuffer;cameraBuffer;computeBindGroup;renderBindGroup;count;format;rotY=0;cameraPos=new Float32Array([0,0,140]);params={minMag:-1,maxMag:13,pointScale:3};constructor(e,t,r){this.device=e,this.canvas=t,this.count=r,this.context=t.getContext("webgpu"),this.format=navigator.gpu.getPreferredCanvasFormat(),this.context.configure({device:e,format:this.format,alphaMode:"premultiplied"})}async init(e){let t=this.device,r=this.count;this.dataBuffer=t.createBuffer({size:16*r,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.posBuffer=t.createBuffer({size:16*r,usage:GPUBufferUsage.STORAGE}),this.colBuffer=t.createBuffer({size:16*r,usage:GPUBufferUsage.STORAGE}),this.paramsBuffer=t.createBuffer({size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.cameraBuffer=t.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),t.queue.writeBuffer(this.dataBuffer,0,e.buffer);let a=t.createShaderModule({code:u});this.computePipeline=t.createComputePipeline({layout:"auto",compute:{module:a,entryPoint:"main"}}),this.computeBindGroup=t.createBindGroup({layout:this.computePipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.dataBuffer}},{binding:1,resource:{buffer:this.posBuffer}},{binding:2,resource:{buffer:this.colBuffer}},{binding:3,resource:{buffer:this.paramsBuffer}}]});let i=t.createShaderModule({code:d}),s=t.createShaderModule({code:f});this.renderPipeline=t.createRenderPipeline({layout:"auto",vertex:{module:i,entryPoint:"main"},fragment:{module:s,entryPoint:"main",targets:[{format:this.format,blend:{color:{srcFactor:"src-alpha",dstFactor:"one",operation:"add"},alpha:{srcFactor:"one",dstFactor:"one",operation:"add"}}}]},primitive:{topology:"triangle-list"}}),this.renderBindGroup=t.createBindGroup({layout:this.renderPipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.posBuffer}},{binding:1,resource:{buffer:this.colBuffer}},{binding:2,resource:{buffer:this.cameraBuffer}}]})}frame(e){let t=this.device;this.rotY+=.001;let r=new ArrayBuffer(32),a=new DataView(r);a.setUint32(0,this.count,!0),a.setFloat32(4,this.params.minMag,!0),a.setFloat32(8,this.params.maxMag,!0),a.setFloat32(12,e,!0),a.setFloat32(16,this.rotY,!0),a.setFloat32(20,this.params.pointScale,!0),t.queue.writeBuffer(this.paramsBuffer,0,r);let i=this.canvas.width||800,s=this.canvas.height||600,n=this.computeViewProjMatrix(i/s);t.queue.writeBuffer(this.cameraBuffer,0,n.buffer);let o=t.createCommandEncoder(),l=o.beginComputePass();l.setPipeline(this.computePipeline),l.setBindGroup(0,this.computeBindGroup),l.dispatchWorkgroups(Math.ceil(this.count/256)),l.end();let c=this.context.getCurrentTexture().createView(),u=o.beginRenderPass({colorAttachments:[{view:c,clearValue:{r:.01,g:.01,b:.02,a:1},loadOp:"clear",storeOp:"store"}]});u.setPipeline(this.renderPipeline),u.setBindGroup(0,this.renderBindGroup),u.draw(6,this.count),u.end(),t.queue.submit([o.finish()])}computeViewProjMatrix(e){let t=1/Math.tan(50*Math.PI/180/2),r=this.cameraPos[2],a=new Float32Array(16);a[0]=t/e,a[5]=t,a[10]=-500/499.9,a[11]=-1,a[14]=-.10002000400080016;let i=new Float32Array(16);i[0]=1,i[5]=1,i[10]=1,i[15]=1,i[14]=-r;let s=new Float32Array(16);for(let e=0;e<4;e++)for(let t=0;t<4;t++){let r=0;for(let s=0;s<4;s++)r+=a[e+4*s]*i[s+4*t];s[e+4*t]=r}return s}destroy(){this.dataBuffer?.destroy(),this.posBuffer?.destroy(),this.colBuffer?.destroy(),this.paramsBuffer?.destroy(),this.cameraBuffer?.destroy()}}function m({pointData:e,minMag:a,maxMag:s,pointScale:o}){let l=(0,r.useRef)(null),c=e.length/4,{positions:u,colors:d,sizes:f}=(0,r.useMemo)(()=>{let t=new Float32Array(3*c),r=new Float32Array(3*c),i=new Float32Array(c);for(let n=0;n<c;n++){let o=e[4*n+2];if(o<a||o>s){t[3*n]=0,t[3*n+1]=0,t[3*n+2]=0,r[3*n]=0,r[3*n+1]=0,r[3*n+2]=0,i[n]=0;continue}let l=e[4*n],c=e[4*n+1],u=e[4*n+3],[d,f,p]=function(e,t,r){let a=e*Math.PI/180,i=t*Math.PI/180;return[50*Math.cos(i)*Math.cos(a),50*Math.sin(i),50*Math.cos(i)*Math.sin(a)]}(l,c,0);t[3*n]=d,t[3*n+1]=f,t[3*n+2]=p;let m=Math.max(.1,(12-o)/12),[h,x,g]=function(e){let t,r,a,i=4600*(1/(.92*e+1.7)+1/(.92*e+.62));return i>=6600?(t=1,r=Math.max(0,Math.min(1,.39*Math.log(i/100-55)-.63)),a=1):(t=Math.max(0,Math.min(1,.33*Math.log(i/100)-.18)),r=Math.max(0,Math.min(1,.39*Math.log(i/100)-.63)),a=i>=1900?Math.max(0,Math.min(1,.54*Math.log(i/100-10)-1.19)):0),[t,r,a]}(u);r[3*n]=h*m,r[3*n+1]=x*m,r[3*n+2]=g*m,i[n]=2*m}return{positions:t,colors:r,sizes:i}},[e,c,a,s]);(0,i.useFrame)(({clock:e})=>{l.current&&(l.current.rotation.y=.03*e.getElapsedTime())});let p=`${a}-${s}`;return(0,t.jsxs)("points",{ref:l,children:[(0,t.jsxs)("bufferGeometry",{children:[(0,t.jsx)("bufferAttribute",{attach:"attributes-position",args:[u,3]}),(0,t.jsx)("bufferAttribute",{attach:"attributes-color",args:[d,3]}),(0,t.jsx)("bufferAttribute",{attach:"attributes-size",args:[f,1]})]},p),(0,t.jsx)("pointsMaterial",{size:.15*o,vertexColors:!0,transparent:!0,opacity:.8,sizeAttenuation:!0,blending:n.AdditiveBlending,depthWrite:!1})]})}function h({pointData:e,minMag:r,maxMag:a,pointScale:i,fpsTickRef:n}){return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)("color",{attach:"background",args:["#010108"]}),(0,t.jsx)(x,{tickRef:n}),(0,t.jsx)(m,{pointData:e,minMag:r,maxMag:a,pointScale:i}),(0,t.jsx)(s.OrbitControls,{makeDefault:!0,enablePan:!1,minDistance:10,maxDistance:200})]})}function x({tickRef:e}){return(0,i.useFrame)(()=>{e.current?.()}),null}function g(){let e=(0,r.useRef)(null),i=(0,r.useRef)(null),s=(0,r.useRef)(0),[n,u]=(0,r.useState)(null),[d,f]=(0,r.useState)(!1),[m,x]=(0,r.useState)(null),[g,b]=(0,r.useState)(-1),[v,y]=(0,r.useState)(13),[w,M]=(0,r.useState)(3),[j,P]=(0,r.useState)(1e5),{fps:B,tick:N}=function(){let e=(0,r.useRef)(0),[t,a]=(0,r.useState)(0),i=(0,r.useCallback)(()=>{e.current++},[]);return(0,r.useEffect)(()=>{let t=setInterval(()=>{a(e.current),e.current=0},1e3);return()=>clearInterval(t)},[]),{fps:t,tick:i}}(),R=(0,r.useRef)(N);R.current=N;let F=(0,r.useMemo)(()=>l(j,42),[j]),S=(0,r.useRef)(null);return(0,r.useEffect)(()=>{let e=!1;return(async()=>{let t=await c();e||("device"in t?(S.current=t.device,P(1e6),u(!0)):(console.warn("[WebGPU]",t.error),x(t.error),u(!1),f(!0)))})(),()=>{e=!0}},[]),(0,r.useEffect)(()=>{if(!0!==n)return;let t=S.current,r=e.current;if(!t||!r)return;let a=!1;return(async()=>{try{let e=l(j,42),n=new p(t,r,j);if(await n.init(e),a)return void n.destroy();i.current=n,f(!0);let o=e=>{a||(R.current?.(),n.params.minMag=g,n.params.maxMag=v,n.params.pointScale=w,n.frame(e/1e3),s.current=requestAnimationFrame(o))};s.current=requestAnimationFrame(o)}catch(e){console.error("[WebGPU] renderer init failed:",e),x(`Renderer init failed: ${e instanceof Error?e.message:String(e)}`),u(!1),f(!0)}})(),()=>{a=!0,cancelAnimationFrame(s.current),i.current?.destroy()}},[n,j]),(0,r.useEffect)(()=>{i.current&&(i.current.params.minMag=g,i.current.params.maxMag=v,i.current.params.pointScale=w)},[g,v,w]),(0,r.useEffect)(()=>{let t=e.current;if(!t||!n)return;let r=new ResizeObserver(()=>{let e=t.getBoundingClientRect();t.width=e.width*devicePixelRatio,t.height=e.height*devicePixelRatio});r.observe(t);let a=t.getBoundingClientRect();return t.width=a.width*devicePixelRatio,t.height=a.height*devicePixelRatio,()=>r.disconnect()},[n]),(0,t.jsxs)("div",{className:"relative w-full flex flex-col",children:[(0,t.jsxs)("div",{className:"relative bg-[#010108] rounded-2xl overflow-hidden border border-white/8",style:{height:"55vh",minHeight:"400px"},children:[null===n&&(0,t.jsx)("div",{className:"absolute inset-0 flex items-center justify-center",children:(0,t.jsxs)("div",{className:"text-center",children:[(0,t.jsx)("div",{className:"w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-3"}),(0,t.jsx)("p",{className:"text-sm text-slate-400",children:"Detecting WebGPU..."})]})}),!0===n&&(0,t.jsx)("canvas",{ref:e,className:"absolute inset-0 w-full h-full"}),!1===n&&d&&(0,t.jsx)(a.Canvas,{camera:{position:[0,0,140],fov:50},children:(0,t.jsx)(h,{pointData:F,minMag:g,maxMag:v,pointScale:w,fpsTickRef:R})}),d&&(0,t.jsxs)("div",{className:"absolute top-4 left-4 flex gap-4",children:[(0,t.jsx)("div",{className:"px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10",children:(0,t.jsxs)("span",{className:`text-sm font-mono font-bold ${B>=50?"text-green-400":B>=30?"text-yellow-400":"text-red-400"}`,children:[B," FPS"]})}),(0,t.jsx)("div",{className:"px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10",children:(0,t.jsxs)("span",{className:"text-sm font-mono text-white",children:[j.toLocaleString()," points"]})}),(0,t.jsx)("div",{className:"px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10",children:(0,t.jsx)("span",{className:`text-xs font-medium ${n?"text-cyan-400":"text-amber-400"}`,children:n?"WebGPU":"WebGL Fallback"})})]})]}),(0,t.jsxs)(o.motion.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},transition:{delay:.3},className:"mt-6 grid grid-cols-1 md:grid-cols-3 gap-4",children:[(0,t.jsxs)("div",{className:"rounded-xl bg-white/3 border border-white/8 px-5 py-4",children:[(0,t.jsx)("p",{className:"text-[11px] text-slate-500 uppercase tracking-wider font-medium mb-3",children:"Magnitude Filter"}),(0,t.jsxs)("div",{className:"space-y-2.5",children:[(0,t.jsxs)("div",{className:"flex items-center gap-3",children:[(0,t.jsx)("span",{className:"text-[11px] text-slate-500 w-7",children:"Min"}),(0,t.jsx)("input",{type:"range",min:-1,max:13,step:.5,value:g,onChange:e=>b(parseFloat(e.target.value)),className:"flex-1 accent-cyan-400 h-1 cursor-pointer"}),(0,t.jsx)("span",{className:"text-xs font-mono text-slate-300 w-8 text-right",children:g})]}),(0,t.jsxs)("div",{className:"flex items-center gap-3",children:[(0,t.jsx)("span",{className:"text-[11px] text-slate-500 w-7",children:"Max"}),(0,t.jsx)("input",{type:"range",min:-1,max:13,step:.5,value:v,onChange:e=>y(parseFloat(e.target.value)),className:"flex-1 accent-cyan-400 h-1 cursor-pointer"}),(0,t.jsx)("span",{className:"text-xs font-mono text-slate-300 w-8 text-right",children:v})]})]})]}),(0,t.jsxs)("div",{className:"rounded-xl bg-white/3 border border-white/8 px-5 py-4",children:[(0,t.jsxs)("div",{className:"flex items-baseline justify-between mb-3",children:[(0,t.jsx)("p",{className:"text-[11px] text-slate-500 uppercase tracking-wider font-medium",children:"Point Count"}),(0,t.jsx)("span",{className:"text-sm font-mono font-semibold text-white",children:j>=1e6?`${(j/1e6).toFixed(1)}M`:`${(j/1e3).toFixed(0)}K`})]}),(0,t.jsx)("input",{type:"range",min:4,max:Math.log10(n?1e7:2e6),step:.05,value:Math.log10(j),onChange:e=>P(Math.round(Math.pow(10,parseFloat(e.target.value)))),className:"w-full accent-cyan-400 h-1 cursor-pointer"}),(0,t.jsxs)("div",{className:"flex justify-between mt-2 text-[10px] text-slate-600",children:[(0,t.jsx)("span",{children:"10K"}),(0,t.jsx)("span",{children:"100K"}),(0,t.jsx)("span",{children:"1M"}),(0,t.jsx)("span",{children:n?"10M":"2M"})]})]}),(0,t.jsxs)("div",{className:"rounded-xl bg-white/3 border border-white/8 px-5 py-4",children:[(0,t.jsxs)("div",{className:"flex items-baseline justify-between mb-3",children:[(0,t.jsx)("p",{className:"text-[11px] text-slate-500 uppercase tracking-wider font-medium",children:"Point Size"}),(0,t.jsx)("span",{className:"text-sm font-mono font-semibold text-white",children:w})]}),(0,t.jsx)("input",{type:"range",min:.5,max:8,step:.5,value:w,onChange:e=>M(parseFloat(e.target.value)),className:"w-full accent-cyan-400 h-1 cursor-pointer"}),!n&&d&&(0,t.jsxs)("div",{className:"mt-3 pt-3 border-t border-white/5",children:[(0,t.jsx)("p",{className:"text-[10px] text-amber-400/80",children:"WebGPU unavailable — using WebGL"}),m&&(0,t.jsx)("p",{className:"text-[10px] text-amber-400/40 mt-0.5",children:m})]})]})]})]})}e.s(["MillionPointScatter",()=>g])}]);