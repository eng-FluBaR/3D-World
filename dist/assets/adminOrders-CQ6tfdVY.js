import{o as N,r as F,g as V,c as z,b as H}from"./main-CFGABBIZ.js";const O=["pending","quoted","accepted","rejected","completed"],T={pending:"Pending",quoted:"Quoted",accepted:"Accepted",rejected:"Rejected",completed:"Completed"},B="gallery",W="uploads";function K(e){return e.replace(/[^a-zA-Z0-9._-]/g,"_")}function R(e){const a=(e||"").toLowerCase();return a.endsWith(".stl")?"stl":a.endsWith(".obj")?"obj":a.endsWith(".svg")?"svg":"other"}async function Q(e,a){if(!(a!=null&&a.file_path))return{fileUrl:(a==null?void 0:a.file_url)||null,storageBucket:null,storagePath:null};const c=a.file_path,f=a.file_name||c.split("/").pop()||"project",m=K(f),u=`projects/${a.id}-${Date.now()}-${m}`,{data:d,error:y}=await e.storage.from("uploads").download(c);if(y)throw y;const{error:q}=await e.storage.from(B).upload(u,d,{upsert:!0});if(q)throw q;const{data:L}=e.storage.from(B).getPublicUrl(u);return{fileUrl:(L==null?void 0:L.publicUrl)||null,storageBucket:B,storagePath:u}}function A(e){return e!=null&&e.gallery_projects?Array.isArray(e.gallery_projects)?e.gallery_projects[0]||null:e.gallery_projects:null}function Y(e){const a=O.includes(e)?e:"pending",c={pending:"text-bg-warning",quoted:"text-bg-primary",accepted:"text-bg-success",rejected:"text-bg-danger",completed:"text-bg-info"};return{status:a,label:T[a]||a,badgeClass:c[a]||"text-bg-secondary"}}async function Z(e,a){if(!a)return;if(!a.file_path){if(a.file_url){window.open(a.file_url,"_blank","noopener,noreferrer");return}alert("Няма прикачен файл за сваляне.");return}const{data:c,error:f}=await e.storage.from(W).download(a.file_path);if(f||!c){alert((f==null?void 0:f.message)||"Неуспешно сваляне на файла.");return}const m=URL.createObjectURL(c),u=document.createElement("a");u.href=m,u.download=a.file_name||a.file_path.split("/").pop()||"order-file",document.body.appendChild(u),u.click(),u.remove(),URL.revokeObjectURL(m)}function J(e){const a=Y(e.status),c=e.file_name||e.file_path||"-";return`
    <article class="order-card status-${a.status}" data-id="${e.id}">
      <div class="order-card-top mb-0">
        <button class="order-toggle-btn" data-id="${e.id}" type="button" aria-label="Open order details">
          <div>
            <div class="order-user">${e.user_email||"-"}</div>
            <div class="order-file"><small class="text-muted text-truncate d-block">${c}</small></div>
            <small class="text-muted d-block mt-1">Материал: ${e.material||"-"} · Количество: ${e.quantity||1}</small>
          </div>
          <div class="d-flex align-items-center gap-2">
            <span class="badge ${a.badgeClass}">${a.label}</span>
            <span class="order-toggle-icon" aria-hidden="true">›</span>
          </div>
        </button>
      </div>
    </article>
  `}function P(e){const a=A(e),c=e.status==="completed",f=!!(e.file_url||e.file_path),m=(a==null?void 0:a.category)||"",u=(a==null?void 0:a.short_description)||"",d=O.map(y=>`<option value="${y}" ${e.status===y?"selected":""}>${T[y]||y}</option>`).join("");return`
    <div class="order-fields mt-2">
      <div class="order-field">
        <label>Material</label>
        <input type="text" class="form-control form-control-sm" value="${e.material||"-"}" disabled />
      </div>

      <div class="order-field">
        <label>Quantity</label>
        <input type="number" class="form-control form-control-sm" value="${e.quantity||1}" disabled />
      </div>

      <div class="order-field">
        <label>Status</label>
        <select class="form-select form-select-sm status-select status-${e.status}" data-id="${e.id}">
          ${d}
        </select>
      </div>

      <div class="order-field">
        <label>Price</label>
        <input type="number" class="form-control form-control-sm price-input" value="${e.price||""}" placeholder="0.00" data-id="${e.id}" />
      </div>

      <div class="order-field order-field-full">
        <label>Deadline</label>
        <input type="date" class="form-control form-control-sm deadline-input" value="${e.deadline||""}" data-id="${e.id}" />
      </div>

      <div class="order-field order-field-full">
        <label>Описание / Бележки</label>
        <textarea class="form-control form-control-sm" rows="3" disabled>${e.notes||"-"}</textarea>
      </div>
    </div>

    <div class="order-actions mt-3">
      <button class="btn btn-sm btn-outline-primary download-order" data-id="${e.id}" ${f?"":"disabled"}>
        Свали файл
      </button>
      <button class="btn btn-sm btn-primary save-order" data-id="${e.id}">Save</button>
      <button class="btn btn-sm btn-outline-danger delete-order" data-id="${e.id}">Delete</button>
      <button class="btn btn-sm btn-outline-secondary gallery-order" data-id="${e.id}" ${c?"":"disabled"}>
        ${a?"Update Gallery":"Add Gallery"}
      </button>
      <button class="btn btn-sm btn-outline-dark remove-gallery-order" data-id="${e.id}" ${a?"":"disabled"}>
        Remove Gallery
      </button>
    </div>

    <div class="border rounded-3 p-3 mt-3">
      <h6 class="mb-3">Настройки за галерия</h6>
      <div class="order-fields mb-2">
        <div class="order-field">
          <label>Тагове / Категория</label>
          <input type="text" class="form-control form-control-sm gallery-category-input" value="${m}" placeholder="напр. Прототип, Части, Декорация" />
        </div>
        <div class="order-field order-field-full">
          <label>Описание за галерия</label>
          <textarea class="form-control form-control-sm gallery-description-input" rows="3" placeholder="Кратко описание...">${u}</textarea>
        </div>
      </div>
      <button class="btn btn-sm btn-outline-success save-gallery-meta" data-id="${e.id}" ${c?"":"disabled"}>
        Запази тагове и описание
      </button>
    </div>
  `}function I(e){e.innerHTML=`
    <div class="orders-empty text-muted">No orders found.</div>
  `}N(async()=>{var M;const e=document.getElementById("orders-body"),a=document.getElementById("status-filter"),c=document.getElementById("orders-error"),f=document.getElementById("admin-logout"),m=document.getElementById("orderDetailsModal"),u=document.getElementById("order-modal-title"),d=document.getElementById("order-modal-body");if(!await F())return;const q=await V(),L=((M=q==null?void 0:q.user)==null?void 0:M.id)||null,g=z();let n=[];const U=new URLSearchParams(window.location.search).get("orderId");let C=!1;const k=m&&window.bootstrap?new window.bootstrap.Modal(m):null,j=()=>{d&&(d.querySelectorAll(".status-select").forEach(t=>{t.addEventListener("change",()=>{O.forEach(s=>t.classList.remove(`status-${s}`)),t.classList.add(`status-${t.value}`)})}),d.querySelectorAll(".download-order").forEach(t=>{t.addEventListener("click",async()=>{const s=t.getAttribute("data-id"),l=n.find(r=>r.id===s);l&&(t.disabled=!0,await Z(g,l),t.disabled=!1)})}),d.querySelectorAll(".save-order").forEach(t=>{t.addEventListener("click",async()=>{var E,v,h;const s=t.getAttribute("data-id"),l=((E=d.querySelector(".status-select"))==null?void 0:E.value)||"",r=((v=d.querySelector(".price-input"))==null?void 0:v.value)||null,p=((h=d.querySelector(".deadline-input"))==null?void 0:h.value)||null;if(!l){alert("Status is required.");return}t.disabled=!0;const o={status:l};r!==""&&r!==null&&(o.price=Number(r)),p!==""&&p!==null&&(o.deadline=p);const{error:i}=await g.from("requests").update(o).eq("id",s);if(i){alert(i.message),t.disabled=!1;return}n=n.map(b=>b.id===s?{...b,...o}:b),$(),S(s,!1),t.disabled=!1})}),d.querySelectorAll(".delete-order").forEach(t=>{t.addEventListener("click",async()=>{const s=t.getAttribute("data-id");if(!s||!window.confirm("Сигурни ли сте, че искате да изтриете тази заявка?"))return;t.disabled=!0;const{error:r}=await g.from("requests").delete().eq("id",s);if(r){t.disabled=!1,alert(r.message);return}n=n.filter(p=>p.id!==s),$(),k==null||k.hide()})}),d.querySelectorAll(".gallery-order").forEach(t=>{t.addEventListener("click",async()=>{var b,w;const s=t.getAttribute("data-id");if(!s)return;const l=n.find(_=>_.id===s);if(!l)return;if(l.status!=="completed"){alert("Само завършени проекти могат да се показват в галерията.");return}const r=A(l),p=((b=d.querySelector(".gallery-category-input"))==null?void 0:b.value)||"",o=((w=d.querySelector(".gallery-description-input"))==null?void 0:w.value)||"";t.disabled=!0;let i;if(r!=null&&r.storage_bucket&&(r!=null&&r.storage_path))i={fileUrl:r.file_url||l.file_url||null,storageBucket:r.storage_bucket,storagePath:r.storage_path};else try{i=await Q(g,l)}catch(_){t.disabled=!1,alert((_==null?void 0:_.message)||"Неуспешно публикуване на файла в галерията.");return}const E={request_id:l.id,file_name:l.file_name||l.file_path||"Проект",file_url:(i==null?void 0:i.fileUrl)||l.file_url||null,category:p.trim()||"Общи",short_description:o.trim()||"",is_visible:!0,created_by:L,storage_bucket:(i==null?void 0:i.storageBucket)||null,storage_path:(i==null?void 0:i.storagePath)||null,model_type:R(l.file_name||l.file_path||"")},{data:v,error:h}=await g.from("gallery_projects").upsert(E,{onConflict:"request_id"}).select("id, category, short_description, is_visible, storage_bucket, storage_path, file_url, model_type").single();if(h){t.disabled=!1,alert(h.message);return}n=n.map(_=>_.id===l.id?{..._,gallery_projects:v?[v]:[]}:_),$(),S(s,!1),t.disabled=!1})}),d.querySelectorAll(".save-gallery-meta").forEach(t=>{t.addEventListener("click",async()=>{var h,b;const s=t.getAttribute("data-id");if(!s)return;const l=n.find(w=>w.id===s);if(!l)return;if(l.status!=="completed"){alert("Редакцията за галерия е позволена само за завършени поръчки.");return}const r=((h=d.querySelector(".gallery-category-input"))==null?void 0:h.value)||"",p=((b=d.querySelector(".gallery-description-input"))==null?void 0:b.value)||"";t.disabled=!0;const o=A(l),i={request_id:l.id,file_name:l.file_name||l.file_path||"Проект",file_url:(o==null?void 0:o.file_url)||l.file_url||null,category:r.trim()||"Общи",short_description:p.trim()||"",is_visible:!0,created_by:L,storage_bucket:(o==null?void 0:o.storage_bucket)||null,storage_path:(o==null?void 0:o.storage_path)||null,model_type:(o==null?void 0:o.model_type)||R(l.file_name||l.file_path||"")},{data:E,error:v}=await g.from("gallery_projects").upsert(i,{onConflict:"request_id"}).select("id, category, short_description, is_visible, storage_bucket, storage_path, file_url, model_type").single();if(v){t.disabled=!1,alert(v.message);return}n=n.map(w=>w.id===l.id?{...w,gallery_projects:E?[E]:[]}:w),$(),S(s,!1),t.disabled=!1})}),d.querySelectorAll(".remove-gallery-order").forEach(t=>{t.addEventListener("click",async()=>{const s=t.getAttribute("data-id");if(!s)return;const l=n.find(i=>i.id===s),r=A(l);if(!(r!=null&&r.id)||!window.confirm("Да премахна ли проекта от галерията?"))return;t.disabled=!0,r.storage_bucket&&r.storage_path&&await g.storage.from(r.storage_bucket).remove([r.storage_path]);const{error:o}=await g.from("gallery_projects").delete().eq("id",r.id);if(o){t.disabled=!1,alert(o.message);return}n=n.map(i=>i.id===l.id?{...i,gallery_projects:[]}:i),$(),S(s,!1)})}))},S=(t,s=!0)=>{if(!d)return;const l=n.find(r=>r.id===t);l&&(u&&(u.textContent=`Поръчка · ${l.user_email||"-"}`),d.innerHTML=P(l),j(),s&&(k==null||k.show()))},x=async()=>{const{data:t,error:s}=await g.from("requests").select(`
        id,
        user_id,
        file_name,
        file_path,
        file_url,
        material,
        quantity,
        notes,
        status,
        price,
        deadline,
        profiles:user_id(*),
        gallery_projects(id, category, short_description, is_visible, storage_bucket, storage_path, file_url, model_type)
      `).order("created_at",{ascending:!1});if(s){c.textContent=s.message,c.classList.remove("d-none"),I(e);return}if(!t){I(e);return}n=t.map(l=>{var r;return{...l,user_email:((r=l.profiles)==null?void 0:r.email)||"-"}}),$()},$=()=>{const t=(a==null?void 0:a.value)||"",s=t?n.filter(l=>l.status===t):n;if(s.length===0){I(e);return}e.innerHTML=s.map(J).join(""),D(),U&&!C&&n.some(r=>r.id===U)&&(C=!0,S(U,!0))},D=()=>{e.querySelectorAll(".order-toggle-btn").forEach(t=>{t.addEventListener("click",()=>{const s=t.getAttribute("data-id");s&&S(s,!0)})})};a&&a.addEventListener("change",$),f&&f.addEventListener("click",async()=>{f.disabled=!0;try{await H(),window.location.replace("/app/login.html")}finally{f.disabled=!1}}),await x()});
