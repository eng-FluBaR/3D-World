import{o as I,r as B,g as U,c as T,b as P}from"./main-CE7TNLLL.js";const k=["pending","quoted","accepted","rejected","completed"],R={pending:"Pending",quoted:"Quoted",accepted:"Accepted",rejected:"Rejected",completed:"Completed"},E="gallery";function C(e){return e.replace(/[^a-zA-Z0-9._-]/g,"_")}function N(e){const l=(e||"").toLowerCase();return l.endsWith(".stl")?"stl":l.endsWith(".obj")?"obj":l.endsWith(".svg")?"svg":"other"}async function O(e,l){if(!(l!=null&&l.file_path))return{fileUrl:(l==null?void 0:l.file_url)||null,storageBucket:null,storagePath:null};const p=l.file_path,m=l.file_name||p.split("/").pop()||"project",b=C(m),n=`projects/${l.id}-${Date.now()}-${b}`,{data:w,error:c}=await e.storage.from("uploads").download(p);if(c)throw c;const{error:o}=await e.storage.from(E).upload(n,w,{upsert:!0});if(o)throw o;const{data:_}=e.storage.from(E).getPublicUrl(n);return{fileUrl:(_==null?void 0:_.publicUrl)||null,storageBucket:E,storagePath:n}}function S(e){return e!=null&&e.gallery_projects?Array.isArray(e.gallery_projects)?e.gallery_projects[0]||null:e.gallery_projects:null}function x(e){const l=S(e),p=e.status==="completed",m=k.map(n=>`<option value="${n}" ${e.status===n?"selected":""}>${R[n]||n}</option>`).join(""),b=e.file_url?`<a href="${e.file_url}" target="_blank" class="text-truncate d-block">${e.file_name||e.file_path}</a>`:`<small class="text-muted">${e.file_name||e.file_path||"-"}</small>`;return`
    <article class="order-card" data-id="${e.id}">
      <div class="order-card-top">
        <div class="order-user">${e.user_email||"-"}</div>
        <div class="order-file">${b}</div>
      </div>

      <div class="order-fields">
        <div class="order-field">
          <label>Status</label>
          <select class="form-select form-select-sm status-select status-${e.status}" data-id="${e.id}">
            ${m}
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
      </div>

      <div class="order-actions">
        <button class="btn btn-sm btn-primary save-order" data-id="${e.id}">Save</button>
        <button class="btn btn-sm btn-outline-danger delete-order" data-id="${e.id}">Delete</button>
        <button class="btn btn-sm btn-outline-secondary gallery-order" data-id="${e.id}" ${p?"":"disabled"}>
          ${l?"Update Gallery":"Add Gallery"}
        </button>
        <button class="btn btn-sm btn-outline-dark remove-gallery-order" data-id="${e.id}" ${l?"":"disabled"}>
          Remove Gallery
        </button>
      </div>
    </article>
  `}function q(e){e.innerHTML=`
    <div class="orders-empty text-muted">No orders found.</div>
  `}I(async()=>{var L;const e=document.getElementById("orders-body"),l=document.getElementById("status-filter"),p=document.getElementById("orders-error"),m=document.getElementById("admin-logout");if(!await B())return;const n=await U(),w=((L=n==null?void 0:n.user)==null?void 0:L.id)||null,c=T();let o=[];const _=async()=>{const{data:t,error:s}=await c.from("requests").select(`
        id,
        user_id,
        file_name,
        file_path,
        file_url,
        status,
        price,
        deadline,
        profiles:user_id(*),
        gallery_projects(id, category, short_description, is_visible, storage_bucket, storage_path, file_url, model_type)
      `).order("created_at",{ascending:!1});if(s){p.textContent=s.message,p.classList.remove("d-none"),q(e);return}if(!t){q(e);return}o=t.map(a=>{var r;return{...a,user_email:((r=a.profiles)==null?void 0:r.email)||"-"}}),g()},g=()=>{const t=(l==null?void 0:l.value)||"",s=t?o.filter(a=>a.status===t):o;if(s.length===0){q(e);return}e.innerHTML=s.map(x).join(""),j()},j=()=>{e.querySelectorAll(".status-select").forEach(t=>{t.addEventListener("change",()=>{k.forEach(s=>t.classList.remove(`status-${s}`)),t.classList.add(`status-${t.value}`)})}),e.querySelectorAll(".save-order").forEach(t=>{t.addEventListener("click",async()=>{var y,v,d;const s=t.getAttribute("data-id"),a=e.querySelector(`.order-card[data-id="${s}"]`),r=((y=a.querySelector(".status-select"))==null?void 0:y.value)||"",u=((v=a.querySelector(".price-input"))==null?void 0:v.value)||null,f=((d=a.querySelector(".deadline-input"))==null?void 0:d.value)||null;if(!r){alert("Status is required.");return}t.disabled=!0;const i={status:r};u!==""&&u!==null&&(i.price=Number(u)),f!==""&&f!==null&&(i.deadline=f);const{error:h}=await c.from("requests").update(i).eq("id",s);if(h)alert(h.message);else{const $=o.findIndex(A=>A.id===s);$!==-1&&(o[$]={...o[$],...i}),g()}t.disabled=!1})}),e.querySelectorAll(".delete-order").forEach(t=>{t.addEventListener("click",async()=>{const s=t.getAttribute("data-id");if(!s||!window.confirm("Сигурни ли сте, че искате да изтриете тази заявка?"))return;t.disabled=!0;const{error:r}=await c.from("requests").delete().eq("id",s);if(r){t.disabled=!1,alert(r.message);return}o=o.filter(u=>u.id!==s),g()})}),e.querySelectorAll(".gallery-order").forEach(t=>{t.addEventListener("click",async()=>{const s=t.getAttribute("data-id");if(!s)return;const a=o.find(d=>d.id===s);if(!a)return;if(a.status!=="completed"){alert("Само завършени проекти могат да се показват в галерията.");return}const r=S(a),u=window.prompt("Категория на проекта:",(r==null?void 0:r.category)||"");if(u===null)return;const f=window.prompt("Кратко описание на проекта:",(r==null?void 0:r.short_description)||"");if(f===null)return;t.disabled=!0;let i;try{i=await O(c,a)}catch(d){t.disabled=!1,alert((d==null?void 0:d.message)||"Неуспешно публикуване на файла в галерията.");return}const h={request_id:a.id,file_name:a.file_name||a.file_path||"Проект",file_url:(i==null?void 0:i.fileUrl)||a.file_url||null,category:u.trim()||"Общи",short_description:f.trim()||"",is_visible:!0,created_by:w,storage_bucket:(i==null?void 0:i.storageBucket)||null,storage_path:(i==null?void 0:i.storagePath)||null,model_type:N(a.file_name||a.file_path||"")},{data:y,error:v}=await c.from("gallery_projects").upsert(h,{onConflict:"request_id"}).select("id, category, short_description, is_visible, storage_bucket, storage_path, file_url, model_type").single();if(v){t.disabled=!1,alert(v.message);return}o=o.map(d=>d.id===a.id?{...d,gallery_projects:y?[y]:[]}:d),g()})}),e.querySelectorAll(".remove-gallery-order").forEach(t=>{t.addEventListener("click",async()=>{const s=t.getAttribute("data-id");if(!s)return;const a=o.find(i=>i.id===s),r=S(a);if(!(r!=null&&r.id)||!window.confirm("Да премахна ли проекта от галерията?"))return;t.disabled=!0,r.storage_bucket&&r.storage_path&&await c.storage.from(r.storage_bucket).remove([r.storage_path]);const{error:f}=await c.from("gallery_projects").delete().eq("id",r.id);if(f){t.disabled=!1,alert(f.message);return}o=o.map(i=>i.id===a.id?{...i,gallery_projects:[]}:i),g()})})};l&&l.addEventListener("change",g),m&&m.addEventListener("click",async()=>{m.disabled=!0;try{await P(),window.location.replace("/login.html")}finally{m.disabled=!1}}),await _()});
