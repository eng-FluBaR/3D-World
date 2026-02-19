import{o as E,c as T,g as S}from"./main-B0j_tV-3.js";/* empty css                         */import{S as C,C as P,P as A,W as I,A as H,D as q,a as B,M as x,b as k,O as R,B as _,V as M}from"./OBJLoader-BIMFwR0h.js";function D(e){return String((e==null?void 0:e.category)||"Общи").split(/[;,|]/).map(d=>d.trim()).filter(Boolean)}function $(e){if(e!=null&&e.model_type)return String(e.model_type).toLowerCase();const t=`${(e==null?void 0:e.file_name)||""} ${(e==null?void 0:e.file_url)||""}`.toLowerCase();return t.includes(".stl")?"stl":t.includes(".obj")?"obj":t.includes(".svg")?"svg":"other"}function F(e){e.innerHTML=`
    <div class="col-12">
      <div class="alert alert-secondary mb-0">Все още няма публикувани завършени проекти.</div>
    </div>
  `}function z(e){e.innerHTML=`
    <div class="col-12">
      <div class="alert alert-secondary mb-0">Няма проекти за избрания таг.</div>
    </div>
  `}function N(e,t){e.innerHTML=`
    <div class="col-12">
      <div class="alert alert-danger mb-0">${t}</div>
    </div>
  `}async function O(e){var r;const t=await S(),d=(r=t==null?void 0:t.user)==null?void 0:r.id;if(!d)return null;const{data:c,error:s}=await e.from("profiles").select("role").eq("user_id",d).maybeSingle();return s||!c?null:c.role||null}function U(e,t){const d=e.category||"Общи",c=e.short_description||"Няма добавено описание.",s=e.file_name||"Завършен проект",r=$(e),f=e.request_id||"";let m='<div class="border rounded-3 bg-light d-flex align-items-center justify-content-center text-muted" style="height:220px;">Няма preview</div>';r==="svg"&&e.file_url&&(m=`<div class="border rounded-3 overflow-hidden" style="height:220px;"><img src="${e.file_url}" alt="${s}" style="width:100%;height:100%;object-fit:cover;" /></div>`),(r==="stl"||r==="obj")&&e.file_url&&(m=`<div class="border rounded-3 bg-light model-preview" data-model-url="${e.file_url}" data-model-type="${r}" style="height:220px;"></div>`);const u=e.file_url?`<button type="button" class="btn btn-sm btn-outline-primary mt-3 preview-project" data-project-id="${e.id}">Преглед на файл</button>`:"",v=t&&f?`<a class="btn btn-sm btn-outline-dark mt-3 ms-2 gallery-edit-link" href="/admin-panel/admin-orders.html?orderId=${encodeURIComponent(f)}">Edit</a>`:"";return`
    <div class="col-sm-6 col-lg-4">
      <div class="card h-100 shadow-sm ${t&&f?"gallery-admin-editable":""}" data-order-id="${f}">
        <div class="card-body d-flex flex-column">
          <div class="mb-3">
            ${m}
          </div>
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h6 class="mb-0 text-break">${s}</h6>
            <span class="badge bg-primary ms-2">${d}</span>
          </div>
          <p class="text-muted mb-0">${c}</p>
          <div class="d-flex flex-wrap align-items-center">
            ${u}
            ${v}
          </div>
        </div>
      </div>
    </div>
  `}async function L(e){const t=e.getAttribute("data-model-url"),d=e.getAttribute("data-model-type");if(!(!t||!d))try{const c=e.clientWidth||300,s=e.clientHeight||220,r=new C;r.background=new P(16316922);const f=new A(50,c/s,.1,2e3);f.position.set(0,0,120);const m=new I({antialias:!0});m.setPixelRatio(Math.min(window.devicePixelRatio||1,2)),m.setSize(c,s),e.innerHTML="",e.appendChild(m.domElement);const u=new H(16777215,.9);r.add(u);const v=new q(16777215,.8);v.position.set(30,40,60),r.add(v);let o=null;if(d==="stl"){const n=await new B().loadAsync(t);n.computeVertexNormals(),n.center();const l=new x({color:6717162,metalness:.1,roughness:.6});o=new k(n,l),r.add(o)}if(d==="obj"){o=await new R().loadAsync(t),o.traverse(h=>{h.isMesh&&(h.material=new x({color:7752610,metalness:.1,roughness:.65}))});const l=new _().setFromObject(o).getCenter(new M);o.position.sub(l),r.add(o)}if(!o)return;const y=new _().setFromObject(o).getSize(new M),w=70/(Math.max(y.x,y.y,y.z)||1);o.scale.setScalar(w);const a=()=>{o.rotation.y+=.01,m.render(r,f),requestAnimationFrame(a)};a()}catch{e.innerHTML='<div class="d-flex align-items-center justify-content-center text-muted h-100">Preview unavailable</div>'}}E(async()=>{const e=document.getElementById("gallery-projects"),t=document.getElementById("gallery-tag-filter"),d=document.getElementById("galleryPreviewModal"),c=document.getElementById("gallery-preview-title"),s=document.getElementById("gallery-preview-body");if(!e)return;const r=T(),m=await O(r)==="super_admin",u=d&&window.bootstrap?new window.bootstrap.Modal(d):null,{data:v,error:o}=await r.from("gallery_projects").select("id, request_id, file_name, file_url, category, short_description, model_type, is_visible, created_at").eq("is_visible",!0).order("created_at",{ascending:!1});if(o){N(e,"Неуспешно зареждане на галерията.");return}if(!v||v.length===0){F(e);return}const g=v.map(a=>({...a,tags:D(a)})),y=async a=>{if(!s||!u)return;const i=g.find(l=>l.id===a);if(!i)return;c&&(c.textContent=i.file_name||"Преглед на проект");const n=$(i);if(!i.file_url){s.innerHTML='<div class="alert alert-secondary mb-0">Няма налична визуализация за този проект.</div>',u.show();return}if(n==="svg"){s.innerHTML=`
        <div class="border rounded-3 overflow-hidden" style="height:min(70vh, 760px);">
          <img src="${i.file_url}" alt="${i.file_name||"Gallery file"}" style="width:100%;height:100%;object-fit:contain;background:#f8f9fa;" />
        </div>
      `,u.show();return}if(n==="stl"||n==="obj"){s.innerHTML=`<div class="border rounded-3 bg-light model-preview" data-model-url="${i.file_url}" data-model-type="${n}" style="height:min(70vh, 760px);"></div>`,u.show();const l=s.querySelector(".model-preview");l&&await L(l);return}s.innerHTML='<div class="alert alert-secondary mb-0">Няма налична визуализация за този тип файл.</div>',u.show()},b=async a=>{if(!a||a.length===0){z(e);return}e.innerHTML=a.map(n=>U(n,m)).join(""),m&&e.querySelectorAll(".gallery-admin-editable").forEach(n=>{n.addEventListener("click",l=>{if(l.target.closest("a, button, input, select, textarea"))return;const p=n.getAttribute("data-order-id");p&&(window.location.href=`/admin-panel/admin-orders.html?orderId=${encodeURIComponent(p)}`)})}),e.querySelectorAll(".preview-project").forEach(n=>{n.addEventListener("click",async()=>{const l=n.getAttribute("data-project-id");l&&await y(l)})});const i=Array.from(e.querySelectorAll(".model-preview"));await Promise.all(i.map(n=>L(n)))},w=Array.from(new Set(g.flatMap(a=>a.tags))).sort((a,i)=>a.localeCompare(i,"bg"));if(t){const a=['<option value="">Всички</option>'].concat(w.map(i=>`<option value="${i}">${i}</option>`));t.innerHTML=a.join(""),t.addEventListener("change",async()=>{const i=t.value,n=i?g.filter(l=>l.tags.includes(i)):g;await b(n)})}await b(g)});
