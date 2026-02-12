(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,24745,e=>{"use strict";var r=e.i(71645);class t extends r.default.Component{state={hasError:!1};static getDerivedStateFromError(){return{hasError:!0}}render(){return this.state.hasError?this.props.fallback:this.props.children}}e.s(["WebGLErrorBoundary",()=>t])},71739,e=>{"use strict";var r=e.i(18050),t=e.i(71645),n=e.i(75056),i=e.i(71753),o=e.i(15080),a=e.i(90072),u=e.i(24745);let c=.8,l=.12,s=.15,v=.12,m=.025,f=.08,d=.4,p=.03,h=1.5,y=4,g=1.2,b=.955,x=2.2,M=1.8,w=.001;function R(e,r,t){let n=[151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180],i=[...n,...n],o=e=>e*e*e*(e*(6*e-15)+10),a=(e,r,t)=>r+e*(t-r),u=(e,r,t,n)=>{let i=15&e,o=i<8?r:t,a=i<4?t:12===i||14===i?r:n;return((1&i)==0?o:-o)+((2&i)==0?a:-a)},c=255&Math.floor(e),l=255&Math.floor(r),s=255&Math.floor(t);e-=Math.floor(e),r-=Math.floor(r),t-=Math.floor(t);let v=o(e),m=o(r),f=o(t),d=i[c]+l,p=i[d]+s,h=i[d+1]+s,y=i[c+1]+l,g=i[y]+s,b=i[y+1]+s;return a(f,a(m,a(v,u(i[p],e,r,t),u(i[g],e-1,r,t)),a(v,u(i[h],e,r-1,t),u(i[b],e-1,r-1,t))),a(m,a(v,u(i[p+1],e,r,t-1),u(i[g+1],e-1,r,t-1)),a(v,u(i[h+1],e,r-1,t-1),u(i[b+1],e-1,r-1,t-1))))}function C({mousePosition:e,shouldExplodeRef:n}){let u=(0,t.useRef)(null),C=(0,t.useRef)(null),P=(0,t.useRef)(null),S=(0,t.useRef)({x:0,y:0}),T=(0,t.useRef)(0),j=(0,t.useRef)(0),O=(0,t.useRef)(null),E=(0,t.useRef)("idle"),N=(0,t.useRef)(0),A=(0,t.useRef)(null),{camera:F}=(0,o.useThree)();(0,t.useEffect)(()=>{F.position.set(0,0,4)},[F]);let B=(0,t.useMemo)(()=>new a.ShaderMaterial({uniforms:{uTime:{value:0},uOpacity:{value:1}},vertexShader:`
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vWorldNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vWorldNormal = normalize(mat3(modelMatrix) * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,fragmentShader:`
        uniform float uTime;
        uniform float uOpacity;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vWorldNormal;
        vec3 palette(float t) {
          vec3 a = vec3(0.8, 0.8, 0.9);
          vec3 b = vec3(0.2, 0.2, 0.3);
          vec3 c = vec3(0.6, 0.8, 1.0);
          vec3 d = vec3(0.0, 0.1, 0.2);
          return a + b * cos(6.28318 * (c * t + d));
        }
        void main() {
          vec3 viewDirection = normalize(cameraPosition - vPosition);
          float fresnel = 1.0 - max(dot(viewDirection, vNormal), 0.0);
          fresnel = pow(fresnel, 2.5);
          float iridescence = dot(vWorldNormal, vec3(0.0, 1.0, 0.0)) * 0.5 + 0.5;
          iridescence += fresnel * 0.3;
          iridescence += sin(uTime * 0.3) * 0.1;
          vec3 iriColor = palette(iridescence + uTime * 0.05);
          vec3 baseColor = vec3(0.95, 0.95, 1.0);
          vec3 color = mix(baseColor, iriColor, fresnel * 0.6 + 0.15);
          float innerGlow = 1.0 - fresnel;
          color += vec3(0.1, 0.15, 0.2) * innerGlow * 0.3;
          float breathe = sin(uTime * 0.5) * 0.05 + 0.85;
          float alpha = (breathe - fresnel * 0.25) * uOpacity;
          gl_FragColor = vec4(color, alpha);
        }
      `,transparent:!0,side:a.FrontSide}),[]),W=(0,t.useMemo)(()=>new a.ShaderMaterial({uniforms:{uTime:{value:0},uOpacity:{value:1},uScale:{value:1}},vertexShader:`
        uniform float uScale;
        uniform float uTime;
        attribute float aRandom;
        varying vec3 vColor;

        vec3 palette(float t) {
          vec3 a = vec3(0.8, 0.8, 0.9);
          vec3 b = vec3(0.2, 0.2, 0.3);
          vec3 c = vec3(0.6, 0.8, 1.0);
          vec3 d = vec3(0.0, 0.1, 0.2);
          return a + b * cos(6.28318 * (c * t + d));
        }

        void main() {
          vec3 dir = normalize(position);
          float iridescence = dir.y * 0.5 + 0.5 + sin(uTime * 0.3) * 0.1;
          vec3 iriColor = palette(iridescence + uTime * 0.05);
          vec3 baseColor = vec3(0.95, 0.95, 1.0);
          vColor = mix(baseColor, iriColor, 0.45);

          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = (0.4 + aRandom * 0.6) * uScale * (30.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,fragmentShader:`
        uniform float uOpacity;
        varying vec3 vColor;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = 1.0 - smoothstep(0.35, 0.5, dist);
          gl_FragColor = vec4(vColor, alpha * 0.9 * uOpacity);
        }
      `,transparent:!0,depthWrite:!1}),[]),_=(0,t.useRef)(B),z=(0,t.useRef)(W);return(0,t.useEffect)(()=>{if(C.current&&(O.current=new Float32Array(C.current.geometry.attributes.position.array),P.current)){let e=C.current.geometry.attributes.position.count,r=new Float32Array(3*e),t=new Float32Array(e);for(let r=0;r<e;r++)t[r]=Math.random();let n=new a.BufferGeometry;n.setAttribute("position",new a.BufferAttribute(r,3)),n.setAttribute("aRandom",new a.BufferAttribute(t,1)),P.current.geometry.dispose(),P.current.geometry=n}},[]),(0,i.useFrame)((r,t)=>{if(T.current+=t,j.current+=1,S.current.x+=(e.current.x-S.current.x)*m,S.current.y+=(e.current.y-S.current.y)*m,n.current&&(n.current=!1,"idle"===E.current&&C.current&&P.current)){E.current="exploding",N.current=0;let e=C.current.geometry.attributes.position.array,r=P.current.geometry.attributes.position.array;A.current=new Float32Array(e.length);for(let t=0;t<e.length;t+=3){r[t]=e[t],r[t+1]=e[t+1],r[t+2]=e[t+2];let n=e[t],i=e[t+1],o=e[t+2],a=Math.sqrt(n*n+i*i+o*o)||1,u=h+Math.random()*(y-h);A.current[t]=n/a*u+(Math.random()-.5)*g,A.current[t+1]=i/a*u+(Math.random()-.5)*g,A.current[t+2]=o/a*u+(Math.random()-.5)*g}P.current.geometry.attributes.position.needsUpdate=!0}if(u.current){u.current.rotation.y+=t*f,u.current.rotation.x=S.current.y*v,u.current.rotation.z=S.current.x*v*.5;let e=1+Math.sin(T.current*d)*p;u.current.scale.setScalar(e)}let i=()=>{if(!C.current||!O.current)return;let e=C.current.geometry,r=e.attributes.position.array,t=O.current;for(let e=0;e<r.length;e+=3){let n=t[e],i=t[e+1],o=t[e+2],a=Math.sqrt(n*n+i*i+o*o),u=n/a,v=i/a,m=o/a,f=1.4+R(u*c+T.current*l,v*c+T.current*l*.8,m*c+T.current*l*.6)*s;r[e]=u*f,r[e+1]=v*f,r[e+2]=m*f}e.attributes.position.needsUpdate=!0,e.computeVertexNormals()};if("idle"===E.current)C.current&&(C.current.visible=!0),P.current&&(P.current.visible=!1),_.current.uniforms.uOpacity.value=1,j.current%6==0&&i();else{if(N.current+=t,"exploding"===E.current&&P.current&&A.current){C.current&&(C.current.visible=!1),P.current&&(P.current.visible=!0),z.current.uniforms.uOpacity.value=1;let e=N.current/x;z.current.uniforms.uScale.value=Math.max(e<.15?1+e/.15*.6:1.6-(e-.15)*.7,.9);let r=P.current.geometry.attributes.position.array;for(let e=0;e<r.length;e+=3)r[e]+=A.current[e]*t,r[e+1]+=A.current[e+1]*t,r[e+2]+=A.current[e+2]*t,A.current[e]*=b,A.current[e+1]*=b,A.current[e+2]*=b;P.current.geometry.attributes.position.needsUpdate=!0,N.current>x&&(E.current="reforming",N.current=0)}else if("reforming"===E.current&&P.current&&O.current){let e=P.current.geometry.attributes.position.array,r=Math.min(N.current/M,1),t=.04+r*r*r*.45,n=r<.6?0:(r-.6)/.4,o=1-n;C.current&&(C.current.visible=n>0,_.current.uniforms.uOpacity.value=n*n),z.current.uniforms.uOpacity.value=o,P.current.visible=o>0,z.current.uniforms.uScale.value=1-.4*n,n>0&&i();let a=0;for(let r=0;r<e.length;r+=3){let n=O.current[r],i=O.current[r+1],o=O.current[r+2],u=Math.sqrt(n*n+i*i+o*o)||1,v=n/u,m=i/u,f=o/u,d=1.4+R(v*c+T.current*l,m*c+T.current*l*.8,f*c+T.current*l*.6)*s,p=v*d,h=m*d,y=f*d,g=p-e[r],b=h-e[r+1],x=y-e[r+2];e[r]+=g*t,e[r+1]+=b*t,e[r+2]+=x*t;let M=g*g+b*b+x*x;M>a&&(a=M)}P.current.geometry.attributes.position.needsUpdate=!0,(a<w||r>=1)&&(_.current.uniforms.uOpacity.value=1,E.current="idle")}z.current.uniforms.uTime.value=T.current}C.current&&(_.current.uniforms.uTime.value=T.current)}),(0,r.jsxs)("group",{ref:u,children:[(0,r.jsx)("mesh",{ref:C,material:B,children:(0,r.jsx)("icosahedronGeometry",{args:[1.4,8]})}),(0,r.jsx)("points",{ref:P,material:W,visible:!1,children:(0,r.jsx)("bufferGeometry",{})})]})}function P(){let e=(0,t.useRef)(null),i=(0,t.useRef)({x:0,y:0}),o=(0,t.useRef)(!1);(0,t.useEffect)(()=>{let e=e=>{i.current.x=e.clientX/window.innerWidth*2-1,i.current.y=-(2*(e.clientY/window.innerHeight))+1};return window.addEventListener("mousemove",e,{passive:!0}),()=>window.removeEventListener("mousemove",e)},[]);let a=(0,r.jsx)("div",{className:"absolute inset-0 bg-radial-[ellipse_at_center] from-white/10 via-white/5 to-transparent"});return(0,r.jsx)("div",{ref:e,className:"absolute inset-0 cursor-pointer",onClick:()=>{o.current=!0},children:(0,r.jsx)(u.WebGLErrorBoundary,{fallback:a,children:(0,r.jsx)(n.Canvas,{gl:{antialias:!1,alpha:!0,powerPreference:"high-performance"},dpr:1,children:(0,r.jsx)(C,{mousePosition:i,shouldExplodeRef:o})})})})}e.s(["MorphingBlob",()=>P])},83512,e=>{e.n(e.i(71739))}]);