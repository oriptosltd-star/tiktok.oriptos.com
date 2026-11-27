(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,86679,e=>{"use strict";var t=e.i(43476),a=e.i(71645),i=e.i(22016),r=e.i(85337),n=e.i(5767),s=e.i(29860),o=e.i(73375),l=e.i(63059),d=e.i(31343);let p=[{name:"Little Rocket",src:"/testimonials/little-rocket.mp4",poster:"/testimonials/little-rocket-poster.webp"},{name:"Moodi",src:"/testimonials/moodi.mp4",poster:"/testimonials/moodi-poster.webp"},{name:"Retrospekt",src:"/testimonials/retrospekt.mp4",poster:"/testimonials/retrospekt-poster.webp"},{name:"Tenacious Toys",src:"/testimonials/tenacious-toys.mp4",poster:"/testimonials/tenacious-toys-poster.webp"},{name:"Oeight Cosmetics",src:"/testimonials/oeight-cosmetics.mp4",poster:"/testimonials/oeight-cosmetics-poster.webp"},{name:"Tabs Chocolate",src:"/testimonials/tabs-chocolate.mp4",poster:"/testimonials/tabs-chocolate-poster.webp"},{name:"Groove Calligraphy",src:"/testimonials/groove-calligraphy.mp4",poster:"/testimonials/groove-calligraphy-poster.webp"},{name:"Geek Tropical",src:"/testimonials/geek-tropical.mp4",poster:"/testimonials/geek-tropical-poster.webp"},{name:"Naturyl Extensions",src:"/testimonials/naturyl-extensions.mp4",poster:"/testimonials/naturyl-extensions-poster.webp"},{name:"Luftikus Airplants",src:"/testimonials/luftikus-airplants.mp4",poster:"/testimonials/luftikus-airplants-poster.webp"}],h=p.length,c=e=>Math.max(.42,1-.106*Math.abs(e));function m(e,t){let a=e-t;return a-h*Math.round(a/h)}function u(){let[e,i]=(0,a.useState)(0),[n,s]=(0,a.useState)(1280),[h,u]=(0,a.useState)(null),g=(0,a.useRef)(null),f=(0,a.useRef)(null),x=(0,a.useRef)(0),w=(0,a.useRef)(0),y=(0,a.useRef)(!1),v=(0,a.useRef)(!0),k=(0,a.useRef)(null),j=(0,a.useRef)(null),F=(0,a.useRef)(0),C=(0,a.useRef)(null),S=(0,a.useRef)(0),z=(0,a.useRef)(0);k.current=h;let A=(0,a.useCallback)(()=>{j.current=null,window.clearTimeout(F.current),null!==k.current&&(z.current=Date.now(),u(null))},[]);(0,a.useEffect)(()=>{let e=f.current;if(!e)return;let t=()=>s(e.clientWidth);t();let a=new ResizeObserver(t);return a.observe(e),()=>a.disconnect()},[]);let P=n<=640?.715*n:.217*n,W=P/.5625,N=(0,a.useCallback)((e,t=650)=>{if(z.current=Date.now(),cancelAnimationFrame(w.current),window.matchMedia("(prefers-reduced-motion: reduce)").matches||0===t){x.current=e,i(e);return}let a=x.current,r=performance.now(),n=s=>{let o=Math.min(1,(s-r)/t),l=a+(e-a)*(1-Math.pow(1-o,3));x.current=l,i(l),o<1&&(w.current=requestAnimationFrame(n))};w.current=requestAnimationFrame(n)},[]),I=(0,a.useCallback)(e=>{A(),N(Math.round(x.current)+e)},[N,A]);(0,a.useEffect)(()=>()=>cancelAnimationFrame(w.current),[]),(0,a.useEffect)(()=>()=>window.clearTimeout(F.current),[]),(0,a.useEffect)(()=>{z.current=Date.now();let e=window.setInterval(()=>{y.current||!v.current||null!==k.current||null!==j.current||document.hidden||window.matchMedia("(prefers-reduced-motion: reduce)").matches||Date.now()-z.current<5e3||N(Math.round(x.current)+1,800)},1e3);return()=>window.clearInterval(e)},[N]),(0,a.useEffect)(()=>{let e=g.current;if(!e)return;let t=new IntersectionObserver(e=>{let t=e[0]?.isIntersecting??!0;v.current=t,t||A()},{threshold:.2});return t.observe(e),()=>t.disconnect()},[A]);let H=(1+c(1))/2*P+10,R=()=>{let e=C.current;C.current=null,e?.moved&&(S.current=Date.now(),A(),N(Math.round(x.current),320))};return(0,t.jsxs)("div",{ref:g,className:"website-videos",role:"region","aria-label":"Watch PandaPing in action",style:{background:"#FFFFFF"},onPointerEnter:()=>{y.current=!0},onPointerLeave:()=>{y.current=!1},onFocus:()=>{y.current=!0},onBlur:()=>{y.current=!1},children:[(0,t.jsxs)("div",{className:"videos-band",style:{background:"#FFFFFF"},children:[(0,t.jsx)("h2",{className:"videos-title",style:{margin:0,textAlign:"center",color:"#101613"},children:"Watch PandaPing in action"}),(0,t.jsxs)("div",{className:"videos-fan-wrap",children:[(0,t.jsx)("div",{ref:f,className:"videos-fan",role:"group","aria-label":"Testimonial carousel",tabIndex:0,onKeyDown:e=>{"ArrowLeft"===e.key&&I(-1),"ArrowRight"===e.key&&I(1)},onPointerDown:e=>{z.current=Date.now(),cancelAnimationFrame(w.current),C.current={x:e.clientX,pos:x.current,moved:!1},e.currentTarget.setPointerCapture(e.pointerId)},onPointerMove:e=>{let t=C.current;if(!t)return;let a=e.clientX-t.x;if(Math.abs(a)>6&&(t.moved=!0),t.moved){let e=t.pos-a/H;x.current=e,i(e)}},onPointerUp:R,onPointerCancel:R,style:{position:"relative",height:W+54,overflow:"hidden",touchAction:"pan-y"},children:p.map((a,i)=>{let r=m(i,e);if(Math.abs(r)>4.2)return null;let n=c(r),s=function(e,t){let a=Math.abs(e),i=Math.floor(a),r=0,n=1;for(let e=1;e<=i;e++){let a=c(e);r+=(n+a)/2*t+10,n=a}let s=a-i;return s>0&&(r+=s*((n+c(i+1))/2*t+10)),Math.sign(e)*r}(r,P),o=h===i;return(0,t.jsxs)("div",{"data-fan-card":!0,className:"website-video-card-btn",style:{position:"absolute",left:"50%",top:"50%",width:P,height:W,transform:`translate(-50%, -50%) translateX(${s}px) scale(${n})`,zIndex:100-Math.round(10*Math.abs(r)),borderRadius:36,overflow:"hidden",background:"#101A2E"},children:[(0,t.jsx)("img",{src:a.poster,alt:"","aria-hidden":"true",draggable:!1,loading:1>=Math.abs(r)?"eager":"lazy",style:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",userSelect:"none"}}),o?(0,t.jsx)("video",{src:a.src,poster:a.poster,controls:!0,autoPlay:!0,playsInline:!0,"aria-label":`Testimonial: ${a.name}`,onEnded:()=>{z.current=Date.now(),u(null)},style:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",background:"#000000"}}):(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)("span",{"aria-hidden":"true",style:{position:"absolute",left:0,right:0,top:0,height:"12.2%",background:"linear-gradient(180deg, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.3) 52%, rgba(0,0,0,0) 100%)"}}),(0,t.jsx)("span",{"aria-hidden":"true",style:{position:"absolute",left:"50%",top:"50%",transform:"translate(-50%, -50%)",width:56,height:56,borderRadius:"50%",background:"rgba(0, 0, 0, 0.5)",border:"1px solid rgba(255,255,255,0.55)",display:"inline-flex",alignItems:"center",justifyContent:"center",color:"#ffffff"},children:(0,t.jsx)(d.f,{size:21,fill:"#ffffff",style:{marginLeft:2},"aria-hidden":"true"})}),(0,t.jsx)("span",{"aria-hidden":"true",style:{position:"absolute",left:0,right:0,bottom:0,height:"26.6%",background:"linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.5) 48%, rgba(0,0,0,0.7) 100%)"}}),(0,t.jsx)("span",{style:{position:"absolute",left:0,right:0,top:"88%",transform:"translateY(-50%)",padding:"0 12px",boxSizing:"border-box",color:"#FCFCFF",fontSize:18,fontWeight:600,lineHeight:1.25,textAlign:"center"},children:a.name}),(0,t.jsx)("button",{type:"button",className:"video-play-overlay",onClick:()=>(e=>{if(Date.now()-S.current<350)return;let t=m(e,x.current);if(A(),.5>Math.abs(t)){z.current=Date.now(),u(e);return}N(x.current+t),j.current=e,F.current=window.setTimeout(()=>{j.current===e&&(j.current=null,z.current=Date.now(),u(e))},680)})(i),"aria-label":`Play testimonial: ${a.name}`,style:{position:"absolute",inset:0,width:"100%",height:"100%",borderRadius:36,border:"0",padding:0,background:"transparent",cursor:"pointer"}})]})]},a.name)})}),(0,t.jsx)("button",{type:"button",onClick:()=>I(-1),"aria-label":"Previous testimonials",className:"website-videos-arrow",style:{...b,left:"calc(var(--pad-x) - 10px)"},children:(0,t.jsx)(o.f,{size:22,"aria-hidden":"true"})}),(0,t.jsx)("button",{type:"button",onClick:()=>I(1),"aria-label":"Next testimonials",className:"website-videos-arrow",style:{...b,right:"calc(var(--pad-x) - 10px)"},children:(0,t.jsx)(l.f,{size:22,"aria-hidden":"true"})})]}),(0,t.jsx)("div",{style:{textAlign:"center",marginTop:24},className:"videos-cta",children:(0,t.jsxs)("a",{href:"https://wa.me/923415213268",target:"_blank",rel:"noopener noreferrer",className:"website-btn pp-pill-primary",style:{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:9,minHeight:54,padding:"16px 32px",borderRadius:999,border:"1px solid transparent",background:"var(--grad-btn)",color:"#ffffff",fontSize:17,fontWeight:700,letterSpacing:0,textDecoration:"none",lineHeight:1},children:[(0,t.jsx)(r.f,{size:19}),"Chat on WhatsApp"]})})]}),(0,t.jsx)("style",{children:`
        /* Band geometry: SQUARE and full-bleed (owner order
           2026-11-14 removed the Loox band rounding — radius 0 at
           every width), padding 112 desktop / 64 mobile. The fan
           wrap adds a second --pad-x of side breathing room inside
           the band, so the carousel no longer reads edge-to-edge;
           the arrows are offset by the same --pad-x so their centres
           stay 13px inside the fan's edges. The band's content
           column is 80% wide, centred (owner order 2026-11-14):
           the section's white background stays full-width, only
           this inner container narrows — the fan measures its own
           box, so it re-centres and scales inside the column. */
        .website-videos .videos-band {
          border-radius: 0;
          padding: 112px var(--pad-x);
          box-sizing: border-box;
          width: 80%;
          margin-inline: auto;
        }
        .website-videos .videos-fan-wrap { position: relative; margin-top: 24px; padding: 0 var(--pad-x); box-sizing: border-box; }
        @media (max-width: 620px) {
          .website-videos .videos-band { border-radius: 0; padding: 64px var(--pad-x); }
          .website-videos .videos-fan-wrap { margin-top: 20px; }
          .website-videos .videos-cta { margin-top: 20px !important; }
          .website-videos .website-videos-arrow { display: none !important; }
        }
        /* Headline: the family is inherited from the site font stack
           (owner order 2026-11-14: one family project-wide; no
           section-specific font rules). This rule only re-asserts
           the reference scale/weight over the shell's heading
           remappers, upright — the reference's italic is not copied. */
        .app-theme-shell:not([data-color-mode="dark"]) .website-videos .videos-title {
          font-size: 48px !important;
          line-height: 57.6px !important;
          font-weight: 800 !important;
          letter-spacing: -1px !important;
          font-style: normal !important;
        }
        @media (max-width: 620px) {
          .app-theme-shell:not([data-color-mode="dark"]) .website-videos .videos-title {
            font-size: 36px !important;
            line-height: 43.2px !important;
          }
        }
        .app-theme-shell:not([data-color-mode="dark"]) .website-videos .website-btn {
          font-size: 17px !important;
          font-weight: 700 !important;
          letter-spacing: 0 !important;
          text-transform: none !important;
        }
        .website-videos .videos-fan { outline: none; }
        .website-videos .videos-fan:focus-visible { outline: 2px solid #3473DB; outline-offset: 4px; }
        /* True circles by design (fan arrows): the shell's
           uniform-radius law squares <button>s to 10px, so these
           re-claim 50% with higher specificity. */
        .app-theme-shell .website-videos .website-videos-arrow {
          border-radius: 50% !important;
        }
        /* Fan cards take the site-standard 36px radius (owner
           order 2026-11-14): the globals 6px public-button rule
           (!important, (0,4,1)) outranks the inline style, so the
           card radius is re-claimed here at (0,5,0). The card is a
           <div> now (it hosts the inline player); the click overlay
           inside it is a real <button>, so its radius is re-claimed
           too, one level deeper. */
        .app-theme-shell.app-theme-shell .website-videos .website-video-card-btn[data-fan-card] {
          border-radius: 36px !important;
        }
        .app-theme-shell.app-theme-shell .website-videos .website-video-card-btn[data-fan-card] .video-play-overlay {
          border-radius: 36px !important;
        }
        .website-videos .video-play-overlay:focus-visible { outline: 2px solid #3473DB; outline-offset: -2px; }
      `})]})}let b={position:"absolute",top:"50%",transform:"translateY(-50%)",zIndex:120,width:46,height:46,borderRadius:"50%",border:"1px solid rgba(16, 26, 46, 0.08)",background:"#FCFCFF",color:"#101A2E",display:"inline-flex",alignItems:"center",justifyContent:"center",cursor:"pointer"},g=["#E9F7F1","#EBF1FE","#F0ECFE"],f=[{headline:"Your customer data can never be lost",body:"A ban, a lost number, a blocked account — none of it touches your data. Every customer and conversation stays safe in PandaPing, and your customers stay connected to your business.",img:"/features/feat-data-protection.png",alt:"Customer history protected in PandaPing — conversations, contacts and orders stay safe even if a number is banned"},{headline:"Your team sees tickets. Never your customers",body:"Staff work through ticket numbers only — no names, no phone numbers, no photos. Scale your service business on WhatsApp with zero risk of customer theft or leaks.",img:"/features/feat-privacy-masking.png",alt:"Staff serving customers through ticket numbers only, without seeing names, phone numbers or photos"},{headline:"AI and humans, one seamless team",body:"Run fully AI, or collaborative — the AI understands every customer and pulls a human in the moment they're needed. One agent can handle up to 1,000 customers a day, and no one ever feels they're talking to a machine.",img:"/features/feat-ai-collab.png",alt:"PandaPing AI agent and a human agent handling a customer conversation together"},{headline:"Your whole team, always in the loop",body:"A built-in team group for announcements, updates, and wins — right inside PandaPing, where your team already works.",img:"/features/feat-team-group.png",alt:"The built-in PandaPing team group keeping the whole team updated"},{headline:"Repetitive questions, answered automatically — from your own knowledge",body:"PandaPing's RAG-based AI learns from your catalogues, policies, and FAQs, and answers repeat questions instantly and accurately. No guessing, no made-up replies.",img:"/features/feat-rag-automation.png",alt:"RAG-based AI answering a repetitive customer question from the business's own knowledge"},{headline:"Manage your staff — and their salaries — in one place",body:"Team roles, staff management, and salary payouts, all built into PandaPing. No spreadsheets, no payday scramble.",img:"/features/feat-staff-payouts.png",alt:"Staff management and salary payouts handled inside PandaPing"},{headline:"Scale from 1 to 100, without the tension",body:"No AI-token worries, no number hunting, no fear of bans or lost data. Grow from a solo seller to a hundred-person team — smoothly, on one platform.",img:"/features/feat-scaling.png",alt:"A business growing from one agent to a hundred on the same PandaPing platform"}];function x(){return(0,t.jsxs)("section",{id:"features",className:"features-showcase","aria-labelledby":"features-showcase-title",style:{background:"#FFFFFF"},children:[(0,t.jsxs)("div",{style:{maxWidth:1320,margin:"0 auto",padding:"clamp(72px, 9vw, 110px) var(--pad-x)",boxSizing:"border-box"},children:[(0,t.jsx)("p",{className:"website-eyebrow",style:{margin:"0 0 12px",color:"#078E88"},children:"WHY PANDAPING"}),(0,t.jsx)("h2",{id:"features-showcase-title",style:{margin:0,maxWidth:860,fontSize:"clamp(30px, 3.4vw, 40px)",fontWeight:700,lineHeight:1.12,color:"#101A2E"},children:"Everything your WhatsApp business needs. Nothing it has to fear."}),(0,t.jsx)("p",{style:{margin:"18px 0 0",maxWidth:720,fontSize:17.5,lineHeight:1.6,color:"#45526B"},children:"PandaPing protects your customer data, your team, and your growth — with AI and humans working as one, from your first chat to your hundred-thousandth."}),(0,t.jsx)("div",{style:{display:"flex",flexDirection:"column",gap:20,marginTop:52},children:f.map((e,a)=>(0,t.jsxs)("div",{className:a%2==1?"fs-row fs-row-flip":"fs-row",children:[(0,t.jsxs)("div",{className:"fs-panel fs-text",style:{background:"#F4F1FE",borderRadius:36,padding:"clamp(30px, 3.6vw, 52px)",display:"flex",flexDirection:"column",justifyContent:"center",boxSizing:"border-box"},children:[(0,t.jsx)("h3",{style:{margin:0,fontSize:"clamp(24px, 2.4vw, 33px)",fontWeight:800,lineHeight:1.16,letterSpacing:"-0.01em",color:"#101A2E"},children:e.headline}),(0,t.jsx)("p",{style:{margin:"16px 0 0",fontSize:16.5,lineHeight:1.6,color:"#45526B"},children:e.body})]}),(0,t.jsx)("div",{className:"fs-panel fs-visual",style:{background:g[a%g.length],borderRadius:36,padding:"clamp(16px, 2vw, 28px)",boxSizing:"border-box"},children:(0,t.jsx)("img",{className:"fs-img",src:e.img,alt:e.alt,width:1440,height:1080,loading:"lazy",style:{display:"block",width:"100%",height:"auto",borderRadius:24}})})]},e.headline))})]}),(0,t.jsx)("style",{children:`
        /* Row layout: text panel narrower, visual wider (Kommo
           proportions); odd rows flip on desktop. On mobile the rows
           stack with the visual after the text. */
        .app-theme-shell .website-page .features-showcase .fs-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1.35fr);
          gap: 20px;
          align-items: stretch;
        }
        @media (min-width: 901px) {
          .app-theme-shell .website-page .features-showcase .fs-row-flip .fs-visual { order: -1; }
        }
        @media (max-width: 900px) {
          .app-theme-shell .website-page .features-showcase .fs-row { grid-template-columns: minmax(0, 1fr); }
        }
        /* Radius standard: globals.css's crisp-corners pass forces
           8px !important at (0,3,0) onto every section inside
           .website-page; the rules below win the cascade outright
           ((0,3,1) for the square section band, (0,4,0) for the
           panels), so the owner's 36px standard is what computes. */
        .app-theme-shell .website-page section.features-showcase { border-radius: 0 !important; }
        .app-theme-shell .website-page .features-showcase .fs-panel { border-radius: 36px !important; }
        .app-theme-shell .website-page .features-showcase .fs-img { border-radius: 24px !important; }
        /* Card hover lift (animation layer, owner order 2026-11-14):
           a subtle 4px rise on the panels, transform only — the flat
           law forbids the shadow that usually rides with a lift. The
           scroll-reveal (PublicPageEffects) animates the section via
           the separate CSS "translate" property, so the two motions
           compose instead of fighting over "transform". */
        .app-theme-shell .website-page .features-showcase .fs-panel { transition: transform 0.25s cubic-bezier(0.7, 0, 0.3, 1); }
        .app-theme-shell .website-page .features-showcase .fs-panel:hover { transform: translateY(-4px); }
        @media (prefers-reduced-motion: reduce) {
          .app-theme-shell .website-page .features-showcase .fs-panel { transition: none; }
          .app-theme-shell .website-page .features-showcase .fs-panel:hover { transform: none; }
        }
      `})]})}let w=["BUILT FOR WHATSAPP COMMERCE","CUSTOMER DATA IN ONE WORKSPACE","OFFICIAL WHATSAPP BUSINESS PLATFORM","AI AGENTS + HUMAN SUPPORT"],y={display:"inline-flex",alignItems:"center",justifyContent:"center",gap:9,minHeight:52,padding:"15px 26px",borderRadius:999,border:"1px solid transparent",color:"#ffffff",fontSize:17,fontWeight:700,letterSpacing:0,textDecoration:"none",lineHeight:1},v={display:"inline-flex",alignItems:"center",justifyContent:"center",minHeight:52,padding:"15px 26px",borderRadius:999,border:"1.5px solid rgba(255,255,255,0.65)",background:"transparent",color:"#ffffff",fontSize:17,fontWeight:700,letterSpacing:0,textDecoration:"none",lineHeight:1};e.s(["default",0,function(){let e=(0,a.useRef)(null);return(0,a.useEffect)(()=>{let t=e.current;!t||window.matchMedia("(prefers-reduced-motion: reduce)").matches||(t.muted=!0,t.play().catch(()=>{}))},[]),(0,t.jsxs)("div",{className:"website-page",style:{minHeight:"100dvh",display:"flex",flexDirection:"column",background:"#ffffff",color:"#101613",fontFamily:'"Plus Jakarta Sans", system-ui, sans-serif'},children:[(0,t.jsx)(n.f,{}),(0,t.jsxs)("main",{style:{flex:1},children:[(0,t.jsx)("div",{className:"website-hero-frame",style:{padding:16,boxSizing:"border-box"},children:(0,t.jsxs)("section",{className:"website-hero",style:{position:"relative",borderRadius:36,overflow:"hidden",background:"linear-gradient(90deg, #06AAA2 0%, #0B303A 100%)",height:"calc(100svh - 151px)",minHeight:560,display:"flex",alignItems:"center",boxSizing:"border-box"},children:[(0,t.jsx)("div",{className:"website-hero-photo","aria-hidden":"true",style:{position:"absolute",top:0,right:0,height:"100%",width:"auto",aspectRatio:"3 / 2",maxWidth:"100%",overflow:"hidden"},children:(0,t.jsxs)("picture",{style:{display:"block",width:"100%",height:"100%"},children:[(0,t.jsx)("source",{media:"(max-width: 900px)",srcSet:"/assets/hero-photo-mobile.webp"}),(0,t.jsx)("img",{src:"/assets/hero-photo-full.webp",alt:"",className:"website-hero-image",style:{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center"}})]})}),(0,t.jsx)("div",{"aria-hidden":"true",className:"website-hero-overlay",style:{position:"absolute",inset:0,background:"linear-gradient(90deg, rgba(12,20,32,0.54) 0%, rgba(12,20,32,0.34) 36%, rgba(12,20,32,0) 68%)"}}),(0,t.jsxs)("div",{className:"website-hero-content",style:{position:"relative",maxWidth:660,padding:"56px 48px",boxSizing:"border-box"},children:[(0,t.jsx)("p",{className:"website-eyebrow",style:{margin:0,fontSize:14,fontWeight:800,letterSpacing:"0.12em",color:"#FFFFFF"},children:"THE PLATFORM FOR WHATSAPP COMMERCE"}),(0,t.jsx)("h1",{className:"website-hero-title",style:{margin:"18px 0 0",color:"#FFFFFF",fontSize:"clamp(36px, 5.2vw, 62px)",fontWeight:700,lineHeight:1.08,letterSpacing:"-0.01em"},children:"Scale your WhatsApp business."}),(0,t.jsx)("p",{style:{margin:"20px 0 0",fontSize:17,lineHeight:1.6,color:"rgba(255,255,255,0.84)",maxWidth:520},children:"Keep customer conversations and data organized in one shared workspace. Use official WhatsApp tools and AI agents to grow with your team in control."}),(0,t.jsxs)("div",{style:{display:"flex",gap:12,flexWrap:"wrap",marginTop:30},children:[(0,t.jsxs)("a",{href:"https://wa.me/923415213268",target:"_blank",rel:"noopener noreferrer",className:"website-btn pp-pill-primary",style:{...y,background:"var(--grad-btn)"},children:[(0,t.jsx)(r.f,{size:19}),"Chat on WhatsApp"]}),(0,t.jsx)(i.default,{href:"/contact",className:"website-btn pp-pill-outline pp-on-dark",style:v,children:"Live Support"})]}),(0,t.jsxs)("p",{style:{margin:"22px 0 0",display:"flex",alignItems:"center",gap:9,fontSize:14,fontWeight:600,color:"rgba(255,255,255,0.78)"},children:[(0,t.jsx)("span",{"aria-hidden":"true",style:{width:8,height:8,borderRadius:"50%",background:"#00B8A9",flex:"0 0 auto"}}),"Customer context · Official platform · AI + human support"]})]}),(0,t.jsx)("div",{className:"website-hero-chat-card",style:{position:"absolute",right:40,bottom:40,width:340,aspectRatio:"720 / 760",borderRadius:20,overflow:"hidden",background:"transparent",boxShadow:"none",zIndex:3,boxSizing:"border-box"},children:(0,t.jsxs)("video",{ref:e,muted:!0,loop:!0,playsInline:!0,preload:"auto",poster:"/hero/hero-chat-poster.webp","aria-label":"PandaPing AI agent answering a customer in a chat",style:{display:"block",width:"100%",height:"100%",objectFit:"cover"},children:[(0,t.jsx)("source",{src:"/hero/hero-chat-alpha.webm",type:"video/webm"}),(0,t.jsx)("source",{src:"/hero/hero-chat.mp4",type:"video/mp4"})]})})]})}),(0,t.jsx)("div",{className:"website-eyebrow",style:{padding:"10px var(--pad-x) 4px",display:"flex",justifyContent:"center",alignItems:"center",gap:14,flexWrap:"wrap",textAlign:"center",fontSize:14,fontWeight:800,letterSpacing:"0.12em",color:"#5B6B7C",boxSizing:"border-box"},children:w.map((e,i)=>(0,t.jsxs)(a.default.Fragment,{children:[i>0&&(0,t.jsx)("span",{"aria-hidden":"true",style:{color:"#00B8A9"},children:"•"}),(0,t.jsx)("span",{children:e})]},e))}),(0,t.jsx)(x,{}),(0,t.jsx)("section",{"aria-labelledby":"product-numbers-title",className:"website-numbers-section",style:{background:"#111111",color:"#FFFFFF"},children:(0,t.jsxs)("div",{className:"website-numbers-layout",style:{maxWidth:1320,margin:"0 auto",padding:"clamp(72px, 9vw, 128px) var(--pad-x)",boxSizing:"border-box",display:"grid",gridTemplateColumns:"minmax(260px, 0.9fr) minmax(0, 1.1fr)",gap:"clamp(48px, 9vw, 140px)",alignItems:"start"},children:[(0,t.jsxs)("div",{className:"website-numbers-intro",style:{position:"sticky",top:100},children:[(0,t.jsx)("span",{style:{color:"#D5D5D5",fontSize:13,fontWeight:800,letterSpacing:"0.06em"},children:"PANDAPING, BUILT FOR WHATSAPP"}),(0,t.jsx)("h2",{id:"product-numbers-title",style:{margin:"28px 0 0",color:"#FFFFFF",fontSize:"clamp(42px, 5.5vw, 70px)",lineHeight:1.02,letterSpacing:"-0.045em",fontWeight:800},children:"Keep every customer close."}),(0,t.jsx)("p",{style:{margin:"24px 0 0",maxWidth:390,color:"#C7C7C7",fontSize:18,lineHeight:1.6},children:"The tools to grow your WhatsApp business, with your customer relationships and data in your hands."})]}),(0,t.jsx)("div",{className:"website-numbers-stack",children:[{metric:"One",title:"shared team inbox",text:"Keep customer chats together so your team can pick up every conversation.",tone:"teal",tilt:"2deg"},{metric:"Your",title:"customer data stays yours",text:"Keep customer details and conversation history organized in one place.",tone:"cream",tilt:"-1deg"},{metric:"AI + team",title:"support that scales with you",text:"Use AI assistance for everyday questions, with people in control when they are needed.",tone:"violet",tilt:"2deg"},{metric:"Official",title:"WhatsApp Business Platform",text:"Build on the official platform with a setup designed for growing businesses.",tone:"blue",tilt:"-1deg"}].map((e,a)=>(0,t.jsxs)("article",{className:`website-number-card website-number-card-${e.tone}`,style:{transform:`rotate(${e.tilt})`,zIndex:a+1},children:[(0,t.jsx)("span",{className:"website-number-metric",children:e.metric}),(0,t.jsxs)("div",{children:[(0,t.jsx)("h3",{style:{margin:0,fontSize:22,fontWeight:800,lineHeight:1.2},children:e.title}),(0,t.jsx)("p",{style:{margin:"12px 0 0",fontSize:16,lineHeight:1.5},children:e.text})]})]},e.title))})]})}),(0,t.jsx)(u,{})]}),(0,t.jsx)(s.f,{}),(0,t.jsx)("style",{children:`
        /* Website type enforcement (apply round): globals.css's shell
           rules (master font rule, Sentri heading/button pass, weight +
           letter-spacing remappers) override this page's inline type.
           The font vars are re-pointed at the project family for the page subtree —
           every shell rule resolves through them — and the scale is
           re-asserted with scoped !important rules. */
        .website-page { --font-ui: "Plus Jakarta Sans", system-ui, sans-serif; --font-display: "Plus Jakarta Sans", system-ui, sans-serif; }
        .app-theme-shell:not([data-color-mode="dark"]) .website-page h1 { font-size: clamp(36px, 5.2vw, 62px) !important; line-height: 1.08 !important; font-weight: 700 !important; letter-spacing: -0.01em !important; }
        .app-theme-shell:not([data-color-mode="dark"]) .website-page h2 { font-size: clamp(30px, 3.4vw, 40px) !important; line-height: 1.12 !important; font-weight: 700 !important; }
        .app-theme-shell:not([data-color-mode="dark"]) .website-page h3 { font-weight: 800 !important; }
        .app-theme-shell:not([data-color-mode="dark"]) .website-page .website-btn { font-size: 17px !important; font-weight: 700 !important; letter-spacing: 0 !important; text-transform: none !important; }
        .app-theme-shell:not([data-color-mode="dark"]) .website-page .website-eyebrow { font-size: 14px !important; font-weight: 800 !important; letter-spacing: 0.12em !important; }

        .website-hero-photo {
          -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 17%, #000 100%);
          mask-image: linear-gradient(90deg, transparent 0%, #000 17%, #000 100%);
        }
        /* Radius standard: globals.css's crisp-corners pass forces
           8px !important at (0,3,0) onto the hero and the card
           classes; the (0,4,0) rules here and below win the cascade
           outright, so the owner's 36px standard (48px sticky cards)
           is what actually computes. */
        .app-theme-shell .website-page .website-hero-frame .website-hero { border-radius: 36px !important; }
        /* Hero chat card: same crisp-corners trap — the (0,4,0) rule
           keeps the card's 20px radius as what actually computes. */
        .app-theme-shell .website-page .website-hero .website-hero-chat-card { border-radius: 20px !important; box-shadow: none !important; }
        .app-theme-shell:not([data-color-mode="dark"]) .website-page .website-hero .website-hero-title { font-size: clamp(36px, 4.4vw, 54px) !important; line-height: 1.06 !important; }
        /* Growth card: named in the same globals card group as the
           feature/solution cards above, so the owner's 36px standard
           is claimed for it here too — doubled shell, (0,4,0), which
           beats the shell rule's (0,3,0) outright. */
        .app-theme-shell.app-theme-shell .website-page .website-growth-card { border-radius: 36px !important; }
        /* Sticky stack (UX fix round): the tail padding that left a
           ~500px dead black gap after the last card is gone — the stack
           now ends with the last card. */
        .website-numbers-stack { display: flex; flex-direction: column; align-items: flex-end; gap: 150px; padding: 12px 18px 8px; }
        .app-theme-shell .website-page .website-numbers-stack .website-number-card { position: sticky !important; top: 112px; width: min(100%, 500px); min-height: 280px; padding: 30px 36px; box-sizing: border-box; border-radius: 48px !important; display: flex; flex-direction: column; justify-content: space-between; transform-origin: center; color: #101010 !important; border: 0 !important; box-shadow: none !important; }
        /* Card tones recoloured to the website scheme (teal → blue →
           violet + the neutral cream) — the lime/bright-green pair is
           retired from the website (UX fix round, item 4). */
        .app-theme-shell .website-page .website-number-card-teal { background: linear-gradient(125deg, #9BE7DD, #63D6C8) !important; }
        .app-theme-shell .website-page .website-number-card-cream { background: #F4F2EE !important; }
        .app-theme-shell .website-page .website-number-card-violet { background: linear-gradient(125deg, #D9CCFF, #B7A6FB) !important; }
        .app-theme-shell .website-page .website-number-card-blue { background: linear-gradient(125deg, #BCD6FC, #93BDF9) !important; }
        .website-number-metric { font-size: clamp(46px, 6vw, 76px); line-height: 0.98; letter-spacing: -0.06em; font-weight: 900; }
        .app-theme-shell:not([data-color-mode="dark"]) .website-numbers-section h2 { color: #FFFFFF !important; font-size: clamp(42px, 5.5vw, 70px) !important; line-height: 1.02 !important; letter-spacing: -0.045em !important; }

        /* Mid widths (hero photo restore): between 901 and 1250px the
           right-anchored 3/2 photo box left her face behind the copy
           block and the dark overlay. The photo goes full-panel here
           (the proven full-bleed composition) with the crop anchored
           on her face; above 1250px the wide blend is unchanged, and
           the <=900px band below still wins on mobile. */
        @media (max-width: 1250px) {
          .website-hero-photo { top: 0 !important; right: 0 !important; bottom: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; aspect-ratio: auto !important; -webkit-mask-image: none; mask-image: none; }
          .website-hero .website-hero-image { object-fit: cover !important; object-position: 40% 18% !important; }
          .website-hero .website-hero-overlay { background: linear-gradient(90deg, rgba(12,20,32,0.82) 0%, rgba(12,20,32,0.55) 55%, rgba(12,20,32,0.18) 100%) !important; }
        }
        @media (max-width: 900px) {
          .website-hero-frame { padding: 12px !important; }
          .website-hero { height: auto !important; min-height: max(620px, calc(100svh - 130px)) !important; }
          .website-hero-photo { top: auto !important; bottom: 0 !important; height: 340px !important; width: 100% !important; aspect-ratio: auto !important; }
          /* Mobile crop (UX fix round, item 11): cover with the frame
             centred on her face (~62% x, upper third) so the subject
             stays whole inside the photo band instead of being sliced
             at the hero's bottom edge. Chosen from the 390px render. */
          .website-hero .website-hero-image { object-fit: cover !important; object-position: 62% 22% !important; }
          .website-hero .website-hero-content { padding: 40px 24px 356px; }
          .website-hero .website-hero-overlay { background: linear-gradient(90deg, rgba(12,20,32,0.78) 0%, rgba(12,20,32,0.5) 58%, rgba(12,20,32,0.24) 100%) !important; }
        }
        /* Hero chat card sizing/placement (owner order 2026-11-14):
           a touch narrower in the full-bleed-photo band; on phones it
           leaves the corner and sits centred in the 340px photo band
           at the panel's bottom — the content's 356px bottom reserve
           keeps the headline, copy and both CTA buttons clear of it. */
        @media (max-width: 1250px) {
          .website-hero-chat-card { width: 300px !important; }
        }
        @media (max-width: 900px) {
          .website-hero-chat-card { right: auto !important; left: 50% !important; transform: translateX(-50%); bottom: 12px !important; width: min(300px, 82%) !important; }
        }
        /* Features: the fluid 3-column row (PALETTE \xa72.6) collapses
           3 -> 2 -> 1 as the viewport narrows. */
        @media (max-width: 1024px) {
          .website-numbers-layout { grid-template-columns: 1fr !important; gap: 48px !important; }
          .website-numbers-intro { position: static !important; }
          .website-numbers-stack { max-width: 560px; margin: 0 auto; width: 100%; gap: 28px; padding-bottom: 0; }
          .website-number-card { position: relative !important; top: auto; transform: none !important; }
        }
        @media (max-width: 620px) {
          .website-numbers-layout { padding-top: 64px !important; padding-bottom: 72px !important; }
          .website-number-card { min-height: 220px !important; padding: 26px !important; }
          .website-hero { min-height: max(640px, calc(100svh - 100px)) !important; border-radius: 36px !important; }
          .website-hero .website-hero-content { padding: 36px 22px 356px !important; }
        }
      `})]})}],86679)},29860,e=>{"use strict";var t=e.i(43476),a=e.i(22016);let i=(0,e.i(75254).f)("arrow-right",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"m12 5 7 7-7 7",key:"xquz4c"}]]);var r=e.i(1583),n=e.i(85337);let s={facebook:"",instagram:"",threads:"",whatsapp:"https://wa.me/923415213268",x:"",youtube:"",linkedin:"",googleBusiness:""},o=[{key:"facebook",label:"Facebook"},{key:"instagram",label:"Instagram"},{key:"threads",label:"Threads"},{key:"whatsapp",label:"WhatsApp"},{key:"x",label:"X"},{key:"youtube",label:"YouTube"},{key:"linkedin",label:"LinkedIn"},{key:"googleBusiness",label:"Google Business"}],l={facebook:{viewBox:"0 0 24 24",d:"M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"},instagram:{viewBox:"0 0 448 512",d:"M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"},threads:{viewBox:"0 0 24 24",d:"M18.263 11.097c-.03-3.486-1.92-5.586-5.111-5.586-2.13 0-3.922.963-4.863 2.499l2.062 1.438c.535-.843 1.272-1.543 2.628-1.543 1.528 0 2.318.85 2.544 2.431a15 15 0 0 0-2.236-.173c-4.125 0-6.068 1.867-6.068 4.336s1.943 3.99 4.804 3.99c3.139 0 5.013-2.115 5.781-4.735.798.361 1.348 1.204 1.348 2.47 0 3.387-3.907 5.232-7.22 5.232-4.885 0-8.077-3.207-8.077-8.424 0-6.392 4.223-10.487 9.9-10.487 3.808 0 5.69 1.671 6.97 3.914l2.108-1.475C21.44 2.078 18.331 0 13.663 0 6.227 0 1.168 5.277 1.168 12.934c0 7 4.953 11.066 10.856 11.066 4.878 0 9.809-2.846 9.809-7.716 0-2.545-1.46-4.231-3.569-5.187m-6.33 4.855c-1.077 0-2.026-.512-2.026-1.453 0-1.483 1.822-1.934 3.606-1.934.678 0 1.34.045 1.927.173-.422 1.927-1.671 3.215-3.508 3.214Z"},youtube:{viewBox:"0 0 576 512",d:"M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z"},linkedin:{viewBox:"0 0 448 512",d:"M100.3 480H7.4V180.9h92.9V480zM53.8 140.1C24.1 140.1 0 115.5 0 85.8 0 56.1 24.1 32 53.8 32c29.7 0 53.8 24.1 53.8 53.8 0 29.7-24.1 54.3-53.8 54.3zM448 480h-92.7V334.4c0-34.7-.7-79.2-48.3-79.2-48.3 0-55.7 37.7-55.7 76.7V480h-92.8V180.9h89.1v40.8h1.3c12.4-23.5 42.7-48.3 87.9-48.3 94 0 111.3 61.9 111.3 142.3V480z"},x:{viewBox:"0 0 24 24",d:"M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z"},googleBusiness:{viewBox:"0 0 24 24",d:"M3.273 1.636c-.736 0-1.363.492-1.568 1.16L0 9.272c0 1.664 1.336 3 3 3a3 3 0 003-3c0 1.664 1.336 3 3 3a3 3 0 003-3c0 1.65 1.35 3 3 3 1.664 0 3-1.336 3-3 0 1.664 1.336 3 3 3s3-1.336 3-3l-1.705-6.476a1.646 1.646 0 00-1.568-1.16zm8.729 9.326c-.604 1.063-1.703 1.81-3.002 1.81-1.304 0-2.398-.747-3-1.806-.604 1.06-1.702 1.806-3 1.806-.484 0-.944-.1-1.363-.277v8.232c0 .9.736 1.637 1.636 1.637h17.454c.9 0 1.636-.737 1.636-1.637v-8.232a3.48 3.48 0 01-1.363.277c-1.304 0-2.398-.746-3-1.804-.602 1.058-1.696 1.804-3 1.804-1.299 0-2.394-.75-2.998-1.81zm5.725 3.765c.808 0 1.488.298 2.007.782l-.859.859a1.623 1.623 0 00-1.148-.447c-.98 0-1.772.827-1.772 1.806 0 .98.792 1.807 1.772 1.807.882 0 1.485-.501 1.615-1.191h-1.615v-1.16h2.826c.035.196.054.4.054.613 0 1.714-1.147 2.931-2.88 2.931a3 3 0 010-6z"}};function d(){return(0,t.jsxs)("svg",{viewBox:"0 0 24 24",width:22,height:22,"aria-hidden":"true",focusable:"false",style:{flex:"0 0 auto"},children:[(0,t.jsx)("polygon",{points:"4,3 4,21 12,12",fill:"#00A0FF"}),(0,t.jsx)("polygon",{points:"4,3 16.8,10.2 12,12",fill:"#00D563"}),(0,t.jsx)("polygon",{points:"4,21 12,12 16.8,13.8",fill:"#FFCE00"}),(0,t.jsx)("polygon",{points:"16.8,10.2 20,12 16.8,13.8 12,12",fill:"#FF3A44"})]})}function p(){return(0,t.jsxs)("span",{style:{display:"flex",flexDirection:"column",alignItems:"flex-start",lineHeight:1.1},children:[(0,t.jsx)("span",{style:{fontSize:8.5,fontWeight:600,letterSpacing:.8,color:"#FFFFFF"},children:"GET IT ON"}),(0,t.jsx)("span",{style:{fontSize:16,fontWeight:600,color:"#FFFFFF",lineHeight:1.15},children:"Google Play"})]})}let h={display:"inline-flex",alignItems:"center",gap:10,background:"#000000",borderRadius:10,padding:"7px 16px 7px 12px",textDecoration:"none",flex:"0 0 auto"},c=[{heading:"Product",links:[{label:"WhatsApp Inbox",href:"/#feature-whatsapp-inbox"},{label:"AI Agents",href:"/#feature-ai-agents"},{label:"Lead Bank",href:"/#feature-lead-bank"},{label:"Campaigns",href:"/#feature-campaigns"},{label:"Multi-Brand",href:"/#feature-multi-brand"}]},{heading:"Company",links:[{label:"About Us",href:"/about"},{label:"Contact",href:"/contact"},{label:"Live Support",href:"/contact"},{label:"Login",href:"/login"}]},{heading:"Legal",links:[{label:"Privacy Policy",href:"/privacy"},{label:"Terms of Service",href:"/terms"},{label:"Refund Policy",href:"/refund-policy"},{label:"Data Deletion",href:"/data-deletion"}]},{heading:"Contact",links:[{label:"Chat on WhatsApp",href:"https://wa.me/923415213268",external:!0},{label:"Support",href:"/contact"}]}],m={margin:"0 0 10px",fontSize:14,fontWeight:800,letterSpacing:.2,color:"#FFFFFF",lineHeight:1.3},u={display:"block",width:"fit-content",maxWidth:"100%",padding:"5px 0",color:"#B9C4CE",fontSize:14,fontWeight:500,textDecoration:"none",lineHeight:1.45};e.s(["f",0,function(){let e=(0,r.o)(),b=(0,r.X)();return(0,t.jsxs)("footer",{className:"website-footer",style:{color:"#E8EEF2",fontFamily:'"Plus Jakarta Sans", system-ui, sans-serif'},children:[(0,t.jsx)("style",{children:`
                /* Type enforcement (see HomePage note): font vars re-pointed
           at the project family for the footer subtree; the CTA headline's inline
           800/-0.01em and the column headings' 800 are re-asserted
           against the shell's weight + letter-spacing remappers. */
        .website-footer { --font-ui: "Plus Jakarta Sans", system-ui, sans-serif; --font-display: "Plus Jakarta Sans", system-ui, sans-serif; }
        .app-theme-shell:not([data-color-mode="dark"]) .website-footer .start-cta span { font-weight: 800 !important; letter-spacing: -0.01em !important; }
        .app-theme-shell:not([data-color-mode="dark"]) .website-footer nav p { font-weight: 800 !important; }
        .website-footer a.start-cta .start-circle { transition: transform 0.25s ease; }
        .website-footer a.start-cta:hover .start-circle,
        .website-footer a.start-cta:focus-visible .start-circle { transform: translateX(10px) scale(1.05); }
        .website-footer a.start-cta:hover .start-circle svg,
        .website-footer a.start-cta:focus-visible .start-circle svg { transform: translateX(3px); }
        .website-footer .start-circle svg { transition: transform 0.25s ease; }
        .website-footer a.start-cta .start-headline { transition: color 0.25s ease; }
        .website-footer a.start-cta:hover .start-headline,
        .website-footer a.start-cta:focus-visible .start-headline { color: #2897C7 !important; }
        .website-footer .footer-col-link { transition: color 0.15s ease, background-size 0.3s ease; background-image: linear-gradient(currentColor, currentColor); background-size: 0% 2px; background-position: 0 100%; background-repeat: no-repeat; }
        .website-footer .footer-col-link { color: #3E3B52 !important; }
        .website-footer .footer-col-link:hover,
        .website-footer .footer-col-link:focus-visible { color: #5D43D6 !important; background-size: 100% 2px; }
        .website-footer .footer-link-panel nav p { color: #10083D !important; }
        /* Radius enforcement (owner's 36px standard, 2026-11-14):
           globals.css flattens every <section> inside the public page
           wrappers to 8px !important at specificity (0,2,1), which
           would eat the inline 36px tops below. These scoped rules —
           (0,3,1) for the band, (0,3,0) for the panel, both
           !important — keep the footer at 36px on every route. */
        .app-theme-shell .website-footer section.start-band { border-radius: 36px 36px 0 0 !important; }
        .app-theme-shell .website-footer .footer-link-panel { border-radius: 36px 36px 0 0 !important; }
        .website-footer .social-disc { transition: background-color 0.2s ease; }
        .website-footer a.social-disc:hover,
        .website-footer a.social-disc:focus-visible { background-color: #5D43D6; }
        @media (max-width: 620px) {
          .website-footer .footer-link-panel { margin: 0 12px !important; border-radius: 36px 36px 0 0 !important; }
          .website-footer .start-cta { gap: 14px !important; }
          .website-footer .start-cta > span:first-child { white-space: normal !important; }
        }
      `}),(0,t.jsx)("section",{className:"start-band",style:{background:"#12063D",borderRadius:"36px 36px 0 0"},children:(0,t.jsxs)("div",{style:{padding:"72px var(--pad-x) 68px",display:"flex",alignItems:"flex-end",gap:40,flexWrap:"wrap",boxSizing:"border-box"},children:[(0,t.jsxs)("a",{href:"https://wa.me/923415213268",target:"_blank",rel:"noopener noreferrer",className:"start-cta","aria-label":"Start today — chat with us on WhatsApp",style:{display:"inline-flex",alignItems:"flex-end",gap:28,flexWrap:"wrap",textDecoration:"none",flex:"1 1 auto",minWidth:0},children:[(0,t.jsx)("span",{className:"start-headline",style:{color:"#FFFFFF",fontSize:"clamp(56px, 9vw, 108px)",fontWeight:800,lineHeight:1.04,letterSpacing:"-0.01em",whiteSpace:"nowrap"},children:"Start today"}),(0,t.jsx)("span",{className:"start-circle","aria-hidden":"true",style:{display:"inline-flex",alignItems:"center",justifyContent:"center",width:"clamp(64px, 8vw, 92px)",height:"clamp(64px, 8vw, 92px)",borderRadius:"50%",background:"linear-gradient(135deg, #00B8A9, #715BFF)",color:"#ffffff",flex:"0 0 auto",marginBottom:6},children:(0,t.jsx)(i,{style:{width:"42%",height:"42%"},"aria-hidden":"true"})})]}),(0,t.jsx)("p",{style:{margin:0,maxWidth:340,fontSize:17,lineHeight:1.6,color:"rgba(255,255,255,0.82)",paddingBottom:10},children:"Your WhatsApp number, connected the official way. Talk to our team and get set up."})]})}),(0,t.jsx)("section",{className:"footer-link-panel",style:{background:"#FFFFFF",color:"#10083D",margin:"0 2.5%",borderRadius:"36px 36px 0 0"},children:(0,t.jsxs)("div",{style:{padding:"48px clamp(24px, 5vw, 88px) 28px",boxSizing:"border-box"},children:[(0,t.jsxs)("div",{style:{display:"flex",alignItems:"flex-start",gap:40,flexWrap:"wrap"},children:[(0,t.jsxs)("div",{style:{flex:"1 1 250px",minWidth:230},children:[(0,t.jsxs)(a.default,{href:"/",style:{display:"inline-flex",alignItems:"center",gap:10,color:"#10083D",textDecoration:"none",minHeight:44},children:[(0,t.jsx)("img",{src:e.logoUrl??"/assets/pandaping-icon-blink.avif",alt:"","aria-hidden":"true",width:42,height:42,style:{width:42,height:42,objectFit:e.logoUrl?"contain":"cover",borderRadius:11*!e.logoUrl,display:"block",flex:"0 0 auto"}}),(0,t.jsx)("span",{style:{fontSize:25,fontWeight:800,lineHeight:1.15,textTransform:b?"uppercase":"none"},children:e.name})]}),(0,t.jsx)("p",{style:{margin:"12px 0 0",fontSize:14,lineHeight:1.55,color:"#596174",maxWidth:280},children:"WhatsApp CRM for Growing Businesses"})]}),(0,t.jsx)("div",{style:{display:"flex",gap:36,flexWrap:"wrap",flex:"2 1 480px"},children:c.map(e=>(0,t.jsxs)("nav",{"aria-label":e.heading,style:{flex:"1 1 130px",minWidth:120},children:[(0,t.jsx)("p",{style:m,children:e.heading}),e.links.map(e=>e.external?(0,t.jsx)("a",{href:e.href,target:"_blank",rel:"noopener noreferrer",className:"footer-col-link",style:u,children:e.label},e.label):(0,t.jsx)(a.default,{href:e.href,className:"footer-col-link",style:u,children:e.label},e.label))]},e.heading))})]}),(0,t.jsxs)("div",{style:{marginTop:44,background:"#F1EDFF",borderRadius:36,padding:"12px 22px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:14,flexWrap:"wrap",boxSizing:"border-box"},children:[(0,t.jsxs)("span",{"aria-label":"Language: English",style:{display:"inline-flex",alignItems:"center",gap:8,fontSize:14,fontWeight:700,color:"#10083D",lineHeight:1},children:[(0,t.jsx)("svg",{viewBox:"0 0 20 20",width:18,height:18,"aria-hidden":"true",focusable:"false",style:{flex:"0 0 auto"},children:(0,t.jsx)("path",{fillRule:"evenodd",clipRule:"evenodd",d:"M2.10506 7.27845C1.81105 8.13152 1.65139 9.04716 1.65139 10.0001C1.65139 11.3095 1.95286 12.5486 2.49017 13.6516C2.54512 13.6401 2.60209 13.634 2.66046 13.634H5.79207C5.60559 12.505 5.50464 11.2776 5.50464 10.0001C5.50464 9.05929 5.55939 8.14564 5.66273 7.27845H2.10506ZM2.88694 5.62706H5.92921C6.1131 4.73744 6.35239 3.92153 6.63854 3.20616C6.78733 2.83419 6.95163 2.48222 7.13167 2.1572C5.3569 2.80648 3.8641 4.04099 2.88694 5.62706ZM10.0001 0C4.47719 0 0 4.47719 0 10.0001C0 15.523 4.47719 20.0002 10.0001 20.0002C15.523 20.0002 20.0002 15.523 20.0002 10.0001C20.0002 4.47719 15.523 0 10.0001 0ZM10.0001 1.65139C9.7936 1.65139 9.51334 1.75261 9.17157 2.11401C8.82815 2.47714 8.48084 3.04692 8.17182 3.81947C7.95939 4.35053 7.77271 4.95817 7.61927 5.62706H12.3809C12.2275 4.95817 12.0408 4.35053 11.8284 3.81947C11.5193 3.04692 11.172 2.47714 10.8286 2.11401C10.4868 1.75261 10.2066 1.65139 10.0001 1.65139ZM14.071 5.62706C13.8871 4.73744 13.6478 3.92153 13.3616 3.20616C13.2129 2.83419 13.0485 2.48222 12.8685 2.1572C14.6433 2.80648 16.1361 4.04099 17.1132 5.62706H14.071ZM12.6734 7.27845H7.3268C7.21655 8.13001 7.15603 9.04457 7.15603 10.0001C7.15603 11.3068 7.2692 12.5369 7.46798 13.634H12.5322C12.731 12.5369 12.8442 11.3068 12.8442 10.0001C12.8442 9.04457 12.7836 8.13001 12.6734 7.27845ZM14.2081 13.634C14.3946 12.505 14.4955 11.2776 14.4955 10.0001C14.4955 9.05929 14.4408 8.14564 14.3374 7.27845H17.8951C18.1891 8.13152 18.3488 9.04716 18.3488 10.0001C18.3488 11.3026 18.0505 12.5354 17.5185 13.634H14.2081ZM12.1399 15.2854H7.86029C7.95635 15.6034 8.06055 15.9026 8.17182 16.1807C8.48084 16.9533 8.82815 17.523 9.17157 17.8862C9.51334 18.2476 9.7936 18.3488 10.0001 18.3488C10.2066 18.3488 10.4868 18.2476 10.8286 17.8862C11.172 17.523 11.5193 16.9533 11.8284 16.1807C11.9396 15.9026 12.0438 15.6034 12.1399 15.2854ZM12.8685 17.843C13.0485 17.518 13.2129 17.166 13.3616 16.794C13.5469 16.3309 13.7125 15.8256 13.8562 15.2854H16.4631C15.5243 16.432 14.2864 17.3243 12.8685 17.843ZM7.13167 17.843C6.95164 17.518 6.78733 17.166 6.63854 16.794C6.45328 16.3309 6.28766 15.8256 6.144 15.2854H3.53709C4.47589 16.432 5.7138 17.3243 7.13167 17.843Z",fill:"#0E0142"})}),"English"]}),(0,t.jsx)("div",{role:"group","aria-label":"Social media",style:{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"},children:o.map(({key:a,label:i})=>{let r=s[a],o=l[a];if("whatsapp"!==a&&!o)return null;let d={display:"inline-flex",alignItems:"center",justifyContent:"center",width:34,height:34,borderRadius:"50%",background:"#10083D",color:"#FFFFFF",flex:"0 0 auto",textDecoration:"none"},p="whatsapp"===a?(0,t.jsx)(n.f,{size:16,style:{color:"#FFFFFF"}}):(0,t.jsx)("svg",{viewBox:o.viewBox,width:16,height:16,"aria-hidden":"true",focusable:"false",style:{flex:"0 0 auto"},fill:"currentColor",children:(0,t.jsx)("path",{d:o.d})});return r?(0,t.jsx)("a",{href:r,target:"_blank",rel:"noopener noreferrer",className:"social-disc",style:d,"aria-label":`${i} — ${e.name}`,children:p},a):(0,t.jsx)("span",{className:"social-disc",style:d,role:"img","aria-label":i,children:p},a)})})]}),(0,t.jsxs)("div",{style:{marginTop:18,display:"flex",alignItems:"center",justifyContent:"space-between",gap:14,flexWrap:"wrap",boxSizing:"border-box"},children:[(0,t.jsx)("span",{style:{color:"#596174",fontSize:14,lineHeight:1.6},children:"© 2026 Oriptos. All rights reserved."}),(0,t.jsxs)("span",{style:h,role:"img","aria-label":"Get it on Google Play",children:[(0,t.jsx)(d,{}),(0,t.jsx)(p,{})]})]})]})})]})}],29860)},5767,85337,e=>{"use strict";var t=e.i(43476),a=e.i(71645),i=e.i(22016),r=e.i(18566),n=e.i(1583);let s="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z";function o({size:e=24,className:a,style:i,badge:r=!1}){return r?(0,t.jsxs)("svg",{viewBox:"0 0 24 24",width:e,height:e,className:a,style:{flex:"0 0 auto",...i},"aria-hidden":"true",focusable:"false",children:[(0,t.jsx)("circle",{cx:"12",cy:"12",r:"12",fill:"#25D366"}),(0,t.jsx)("g",{transform:"translate(5.04 5.04) scale(0.58)",children:(0,t.jsx)("path",{d:s,fill:"#FFFFFF"})})]}):(0,t.jsx)("svg",{viewBox:"0 0 24 24",width:e,height:e,className:a,style:{flex:"0 0 auto",...i},fill:"currentColor","aria-hidden":"true",focusable:"false",children:(0,t.jsx)("path",{d:s})})}e.s(["f",0,o],85337);let l={color:"#444444",fontSize:16,fontWeight:700,textDecoration:"none",display:"inline-flex",alignItems:"center",minHeight:44,lineHeight:1};e.s(["f",0,function(){let e=(0,n.o)(),s=(0,n.X)(),d=(0,r.usePathname)(),[p,h]=(0,a.useState)(!0),[c,m]=(0,a.useState)(!1);return(0,a.useEffect)(()=>{try{window.sessionStorage.getItem("pp-header-entered")||window.matchMedia("(prefers-reduced-motion: reduce)").matches||(window.sessionStorage.setItem("pp-header-entered","1"),m(!0))}catch{}},[]),(0,t.jsxs)(t.Fragment,{children:[p&&(0,t.jsxs)("aside",{className:"website-announcement","aria-label":"PandaPing announcement",style:{minHeight:40,padding:"8px 52px",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",boxSizing:"border-box",background:"#01A095",color:"#0A0A0A",textAlign:"center",fontSize:14,lineHeight:1.4},children:[(0,t.jsxs)("span",{children:[(0,t.jsx)("strong",{style:{marginRight:8,fontSize:11,letterSpacing:"0.04em"},children:"WHATSAPP COMMERCE"}),"Keep customer relationships, data, and support together as you grow.",(0,t.jsx)(i.default,{href:"/#features",style:{color:"inherit",marginLeft:5,textUnderlineOffset:3,fontWeight:600},children:"Explore PandaPing"})]}),(0,t.jsx)("button",{type:"button","aria-label":"Dismiss announcement",onClick:()=>h(!1),style:{position:"absolute",right:18,top:"50%",transform:"translateY(-50%)",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",border:0,background:"transparent",color:"#0A0A0A",padding:0,cursor:"pointer"},children:(0,t.jsx)("svg",{width:"15",height:"15",viewBox:"0 0 24 24",fill:"none","aria-hidden":"true",focusable:"false",children:(0,t.jsx)("path",{d:"M5 5l14 14M19 5L5 19",stroke:"currentColor",strokeWidth:"1.6",strokeLinecap:"round"})})})]}),(0,t.jsxs)("header",{className:c?"website-header pp-enter":"website-header",style:{position:"sticky",top:0,zIndex:50,background:"#F5F5F2",borderBottom:"1px solid #E5E7EB",fontFamily:'"Plus Jakarta Sans", system-ui, sans-serif'},children:[(0,t.jsxs)("div",{className:"website-header-inner",style:{position:"relative",padding:"10px var(--pad-x)",minHeight:68,display:"flex",alignItems:"center",gap:20,flexWrap:"wrap",boxSizing:"border-box"},children:[(0,t.jsxs)(i.default,{href:"/",className:"website-logo",style:{display:"inline-flex",alignItems:"center",gap:10,color:"#101613",textDecoration:"none",fontSize:25,fontWeight:800,lineHeight:1,minHeight:44},children:[(0,t.jsx)("img",{src:e.logoUrl??"/assets/pandaping-icon-blink.avif",alt:"","aria-hidden":"true",width:42,height:42,style:{width:42,height:42,objectFit:e.logoUrl?"contain":"cover",borderRadius:11*!e.logoUrl,display:"block",flex:"0 0 auto"}}),(0,t.jsx)("span",{style:{textTransform:s?"uppercase":"none"},children:e.name})]}),"/login"!==d&&(0,t.jsxs)("nav",{"aria-label":"Primary",className:"website-nav",style:{display:"flex",alignItems:"center",gap:22,flexWrap:"wrap",position:"absolute",left:"50%",transform:"translateX(-50%)",justifyContent:"center"},children:[(0,t.jsx)(i.default,{href:"/",style:l,children:"Home"}),(0,t.jsx)(i.default,{href:"/about",style:l,children:"About"}),(0,t.jsx)(i.default,{href:"/contact",style:l,children:"Contact"}),(0,t.jsx)(i.default,{href:"/#features",style:l,children:"Features"})]}),(0,t.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",marginLeft:"auto"},children:[(0,t.jsxs)("a",{href:"https://wa.me/923415213268",target:"_blank",rel:"noopener noreferrer","aria-label":"Chat on WhatsApp",className:"website-btn website-wa pp-pill-primary",style:{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:9,minHeight:50,padding:"15px 24px",borderRadius:999,border:"1px solid transparent",background:"var(--grad-btn)",color:"#ffffff",fontSize:17,fontWeight:700,letterSpacing:0,textDecoration:"none",lineHeight:1,whiteSpace:"nowrap"},children:[(0,t.jsx)(o,{size:19}),(0,t.jsx)("span",{className:"wa-label",children:"Chat on WhatsApp"})]}),(0,t.jsxs)(i.default,{href:"/login",className:"website-btn pp-pill-outline website-login",style:{display:"inline-flex",alignItems:"center",justifyContent:"center",minHeight:50,padding:"8px 8px 8px 24px",borderRadius:999,border:"1.5px solid #101613",background:"transparent",color:"#101613",fontSize:17,fontWeight:700,letterSpacing:0,textDecoration:"none",lineHeight:1},children:[(0,t.jsx)("span",{children:"Login"}),(0,t.jsx)("span",{className:"login-disc","aria-hidden":"true",children:(0,t.jsx)("svg",{className:"login-arrow",width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",focusable:"false",children:(0,t.jsx)("path",{d:"M4 12h15M13 5l7 7-7 7",stroke:"currentColor",strokeWidth:"2.4",strokeLinecap:"round",strokeLinejoin:"round"})})})]})]})]}),(0,t.jsx)("style",{children:`
          /* Website type enforcement (apply round): the shell's Sentri
             pass forces var(--font-ui) + uppercase/700/0.2px onto shell
             buttons; these scoped rules re-assert the website type
             system and re-point the font vars at the project family for the header
             subtree. (Top level — an earlier draft landed inside the
             @media block below and only applied at <=620px.) */
          .website-header { --font-ui: "Plus Jakarta Sans", system-ui, sans-serif; --font-display: "Plus Jakarta Sans", system-ui, sans-serif; }
          .app-theme-shell:not([data-color-mode="dark"]) .website-header .website-btn { font-size: 17px !important; font-weight: 700 !important; letter-spacing: 0 !important; text-transform: none !important; }
          /* Announcement strip colours, pinned (UX fix round): the
             shell's generic light-mode <aside> rule would otherwise
             flatten the strip to its canvas colour. Doubled shell class
             keeps this above that rule in both colour modes. */
          .app-theme-shell.app-theme-shell aside.website-announcement { background: #01A095 !important; color: #0A0A0A !important; }
          /* Announcement text link: underline sweep (animation layer,
             owner order 2026-11-14) — the footer's background-size
             sweep pattern at the reference's 600ms, sweeping in on
             hover/focus and back out on leave. The default underline
             steps aside so the sweep is the only line. */
          .website-announcement a { text-decoration: none; background-image: linear-gradient(currentColor, currentColor); background-size: 0% 2px; background-position: 0 100%; background-repeat: no-repeat; transition: background-size 0.6s cubic-bezier(0.7, 0, 0.3, 1); padding-bottom: 2px; }
          .website-announcement a:hover, .website-announcement a:focus-visible { background-size: 100% 2px; }
          /* Header entrance (animation layer, owner order 2026-11-14;
             reference: logo fade 0.4s + nav link group 5px rise/fade,
             easing cubic-bezier(0.7, 0, 0.3, 1)). Gated by .pp-enter,
             which the component adds only on the session's first
             mount, so soft navigations never replay it. The nav
             itself keeps its inline translateX(-50%) centring — the
             keyframes animate the LINKS, never the nav box. */
          @keyframes pp-header-logo-in { from { opacity: 0; } to { opacity: 1; } }
          @keyframes pp-header-nav-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
          .website-header.pp-enter .website-logo { animation: pp-header-logo-in 0.4s cubic-bezier(0.7, 0, 0.3, 1) both; }
          .website-header.pp-enter .website-nav a { animation: pp-header-nav-in 0.4s cubic-bezier(0.7, 0, 0.3, 1) both; }
          .website-header.pp-enter .website-nav a:nth-child(2) { animation-delay: 0.05s; }
          .website-header.pp-enter .website-nav a:nth-child(3) { animation-delay: 0.1s; }
          .website-header.pp-enter .website-nav a:nth-child(4) { animation-delay: 0.15s; }
          /* Login disc + arrow (owner order 2026-11-14): the disc sits
             on the pill's right end; hover/focus-visible rotates the
             arrow to ↗ and presses the disc 3px toward the rim while
             it inverts (the pp-pill-outline sweep fills the pill ink
             behind it). One spring curve with a slight overshoot for
             both motions; reduced motion keeps the colour change only. */
          .website-header .website-login { gap: 10px; }
          .website-header .website-login .login-disc { width: 30px; height: 30px; border-radius: 50%; background: #101613; color: #ffffff; display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; transition: transform 0.35s cubic-bezier(0.34, 1.45, 0.64, 1), background-color 0.3s ease, color 0.3s ease; }
          .website-header .website-login .login-arrow { display: block; transition: transform 0.35s cubic-bezier(0.34, 1.45, 0.64, 1); }
          .website-header .website-login:hover .login-disc, .website-header .website-login:focus-visible .login-disc { transform: translateX(3px); background: #ffffff; color: #101613; }
          .website-header .website-login:hover .login-arrow, .website-header .website-login:focus-visible .login-arrow { transform: rotate(-45deg); }
          .website-header .website-login:focus-visible { outline: 2px solid #3B82F6; outline-offset: 2px; }
          @media (prefers-reduced-motion: reduce) {
            .website-header .website-logo, .website-header .website-nav a { animation: none; }
            .website-announcement a { transition: none; }
            .website-header .website-login .login-disc, .website-header .website-login .login-arrow { transition: none; }
            .website-header .website-login:hover .login-disc, .website-header .website-login:focus-visible .login-disc, .website-header .website-login:hover .login-arrow, .website-header .website-login:focus-visible .login-arrow { transform: none; }
          }
          @media (max-width: 900px) {
            .website-header .website-nav { position: static !important; transform: none !important; width: 100%; order: 3; justify-content: center; }
            .website-header .website-header-inner > div { order: 2; }
          }
          @media (max-width: 620px) {
            /* One compact row (~64px, UX fix round): mark + name, the
               WhatsApp pill and the Login pill. The nav row leaves the
               sticky header at phone widths — its four destinations
               stay one tap away in the footer. */
            .website-header .website-header-inner { flex-wrap: nowrap !important; gap: 8px !important; min-height: 64px !important; padding: 8px var(--pad-x) !important; }
            .website-header .website-nav { display: none !important; }
            .website-header .website-header-inner > div { flex-wrap: nowrap !important; gap: 8px !important; }
            .website-header .website-logo { font-size: 19px !important; gap: 8px; min-height: 40px; }
            .website-header .website-logo img { width: 36px !important; height: 36px !important; }
            .app-theme-shell.app-theme-shell .website-header a.website-btn { min-height: 44px !important; padding: 10px 13px !important; font-size: 14px !important; }
            /* Login unit at phone widths: disc shrinks to 24px and the
               pill's padding tightens (8px vertical keeps 24 + 16 + 3
               inside the 44px height) so the single 64px row survives.
               The extra class wins the !important tie over the generic
               a.website-btn rule above. */
            .app-theme-shell.app-theme-shell .website-header a.website-btn.website-login { padding: 8px 6px 8px 13px !important; }
            .website-header .website-login { gap: 6px; }
            .website-header .website-login .login-disc { width: 24px; height: 24px; }
            .website-header .website-login .login-arrow { width: 12px; height: 12px; }
          }
          @media (max-width: 480px) {
            /* Phone fit (responsive fix wave 1, D1): even condensed,
               logo + full WhatsApp pill + Login pill measure ~437px —
               at 320–390 the Login pill fell off the right edge,
               clipped by the shell and untappable (audit D1: actions
               x=174→457 at 390). In this band the WhatsApp pill steps
               down to a 44px icon disc (aria-label keeps its name;
               the pill itself returns at 481px) and the wordmark
               tightens one step, so the whole row fits inside the
               viewport with every target >= 40px. Desktop and tablet
               rules above are untouched. */
            .website-header .website-header-inner { padding: 8px 12px !important; }
            .website-header .website-logo { font-size: 17px !important; gap: 6px; min-height: 44px; flex-shrink: 0; }
            .website-header .website-logo img { width: 32px !important; height: 32px !important; }
            .website-header .website-header-inner > div { flex-shrink: 0; }
            .app-theme-shell.app-theme-shell .website-header a.website-btn.website-wa { width: 44px !important; min-width: 44px !important; padding: 0 !important; gap: 0 !important; }
            .website-header .website-wa .wa-label { display: none; }
            .website-header .website-wa svg { width: 20px; height: 20px; }
          }
        `})]})]})}],5767)},73375,e=>{"use strict";let t=(0,e.i(75254).f)("chevron-left",[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]]);e.s(["f",0,t],73375)},63059,e=>{"use strict";let t=(0,e.i(75254).f)("chevron-right",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]]);e.s(["f",0,t],63059)},31343,e=>{"use strict";let t=(0,e.i(75254).f)("play",[["path",{d:"M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z",key:"10ikf1"}]]);e.s(["f",0,t],31343)}]);