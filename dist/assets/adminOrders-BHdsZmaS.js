import{o as L,r as A,g as B,c as U,b as N}from"./main-BlN2Ztd7.js";const R=["pending","quoted","accepted","rejected","completed"],E="gallery";function T(e){return e.replace(/[^a-zA-Z0-9._-]/g,"_")}function x(e){const l=(e||"").toLowerCase();return l.endsWith(".stl")?"stl":l.endsWith(".obj")?"obj":l.endsWith(".svg")?"svg":"other"}async function C(e,l){if(!(l!=null&&l.file_path))return{fileUrl:(l==null?void 0:l.file_url)||null,storageBucket:null,storagePath:null};const p=l.file_path,m=l.file_name||p.split("/").pop()||"project",h=T(m),d=`projects/${l.id}-${Date.now()}-${h}`,{data:v,error:c}=await e.storage.from("uploads").download(p);if(c)throw c;const{error:i}=await e.storage.from(E).upload(d,v,{upsert:!0});if(i)throw i;const{data:_}=e.storage.from(E).getPublicUrl(d);return{fileUrl:(_==null?void 0:_.publicUrl)||null,storageBucket:E,storagePath:d}}function k(e){return e!=null&&e.gallery_projects?Array.isArray(e.gallery_projects)?e.gallery_projects[0]||null:e.gallery_projects:null}function O(e){const l=k(e),p=e.status==="completed",m=R.map(d=>`<option value="${d}" ${e.status===d?"selected":""}>${d}</option>`).join(""),h=e.file_url?`<a href="${e.file_url}" target="_blank" class="text-truncate d-block">${e.file_name||e.file_path}</a>`:`<small class="text-muted">${e.file_name||e.file_path||"-"}</small>`;return`
    <tr data-id="${e.id}">
      <td>${e.user_email||"-"}</td>
      <td>${h}</td>
      <td>
        <select class="form-select form-select-sm status-select" data-id="${e.id}">
          ${m}
        </select>
      </td>
      <td>
        <input type="number" class="form-control form-control-sm price-input" value="${e.price||""}" placeholder="0.00" data-id="${e.id}" />
      </td>
      <td>
        <input type="date" class="form-control form-control-sm deadline-input" value="${e.deadline||""}" data-id="${e.id}" />
      </td>
      <td class="text-end">
        <div class="d-inline-flex gap-2">
          <button class="btn btn-sm btn-primary save-order" data-id="${e.id}">Save</button>
          <button class="btn btn-sm btn-outline-danger delete-order" data-id="${e.id}">Delete</button>
          <button class="btn btn-sm btn-outline-secondary gallery-order" data-id="${e.id}" ${p?"":"disabled"}>
            ${l?"Update Gallery":"Add Gallery"}
          </button>
          <button class="btn btn-sm btn-outline-dark remove-gallery-order" data-id="${e.id}" ${l?"":"disabled"}>
            Remove Gallery
          </button>
        </div>
      </td>
    </tr>
  `}function q(e){e.innerHTML=`
    <tr>
      <td colspan="6" class="text-muted">No orders found.</td>
    </tr>
  `}L(async()=>{var S;const e=document.getElementById("orders-body"),l=document.getElementById("status-filter"),p=document.getElementById("orders-error"),m=document.getElementById("admin-logout");if(!await A())return;const d=await B(),v=((S=d==null?void 0:d.user)==null?void 0:S.id)||null,c=U();let i=[];const _=async()=>{const{data:t,error:n}=await c.from("requests").select(`
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
      `).order("created_at",{ascending:!1});if(n){p.textContent=n.message,p.classList.remove("d-none"),q(e);return}if(!t){q(e);return}i=t.map(a=>{var r;return{...a,user_email:((r=a.profiles)==null?void 0:r.email)||"-"}}),g()},g=()=>{const t=(l==null?void 0:l.value)||"",n=t?i.filter(a=>a.status===t):i;if(n.length===0){q(e);return}e.innerHTML=n.map(O).join(""),j()},j=()=>{e.querySelectorAll(".save-order").forEach(t=>{t.addEventListener("click",async()=>{var y,b,o;const n=t.getAttribute("data-id"),a=e.querySelector(`tr[data-id="${n}"]`),r=((y=a.querySelector(".status-select"))==null?void 0:y.value)||"",u=((b=a.querySelector(".price-input"))==null?void 0:b.value)||null,f=((o=a.querySelector(".deadline-input"))==null?void 0:o.value)||null;if(!r){alert("Status is required.");return}t.disabled=!0;const s={status:r};u!==""&&u!==null&&(s.price=Number(u)),f!==""&&f!==null&&(s.deadline=f);const{error:w}=await c.from("requests").update(s).eq("id",n);if(w)alert(w.message);else{const $=i.findIndex(I=>I.id===n);$!==-1&&(i[$]={...i[$],...s}),g()}t.disabled=!1})}),e.querySelectorAll(".delete-order").forEach(t=>{t.addEventListener("click",async()=>{const n=t.getAttribute("data-id");if(!n||!window.confirm("Сигурни ли сте, че искате да изтриете тази заявка?"))return;t.disabled=!0;const{error:r}=await c.from("requests").delete().eq("id",n);if(r){t.disabled=!1,alert(r.message);return}i=i.filter(u=>u.id!==n),g()})}),e.querySelectorAll(".gallery-order").forEach(t=>{t.addEventListener("click",async()=>{const n=t.getAttribute("data-id");if(!n)return;const a=i.find(o=>o.id===n);if(!a)return;if(a.status!=="completed"){alert("Само завършени проекти могат да се показват в галерията.");return}const r=k(a),u=window.prompt("Категория на проекта:",(r==null?void 0:r.category)||"");if(u===null)return;const f=window.prompt("Кратко описание на проекта:",(r==null?void 0:r.short_description)||"");if(f===null)return;t.disabled=!0;let s;try{s=await C(c,a)}catch(o){t.disabled=!1,alert((o==null?void 0:o.message)||"Неуспешно публикуване на файла в галерията.");return}const w={request_id:a.id,file_name:a.file_name||a.file_path||"Проект",file_url:(s==null?void 0:s.fileUrl)||a.file_url||null,category:u.trim()||"Общи",short_description:f.trim()||"",is_visible:!0,created_by:v,storage_bucket:(s==null?void 0:s.storageBucket)||null,storage_path:(s==null?void 0:s.storagePath)||null,model_type:x(a.file_name||a.file_path||"")},{data:y,error:b}=await c.from("gallery_projects").upsert(w,{onConflict:"request_id"}).select("id, category, short_description, is_visible, storage_bucket, storage_path, file_url, model_type").single();if(b){t.disabled=!1,alert(b.message);return}i=i.map(o=>o.id===a.id?{...o,gallery_projects:y?[y]:[]}:o),g()})}),e.querySelectorAll(".remove-gallery-order").forEach(t=>{t.addEventListener("click",async()=>{const n=t.getAttribute("data-id");if(!n)return;const a=i.find(s=>s.id===n),r=k(a);if(!(r!=null&&r.id)||!window.confirm("Да премахна ли проекта от галерията?"))return;t.disabled=!0,r.storage_bucket&&r.storage_path&&await c.storage.from(r.storage_bucket).remove([r.storage_path]);const{error:f}=await c.from("gallery_projects").delete().eq("id",r.id);if(f){t.disabled=!1,alert(f.message);return}i=i.map(s=>s.id===a.id?{...s,gallery_projects:[]}:s),g()})})};l&&l.addEventListener("change",g),m&&m.addEventListener("click",async()=>{m.disabled=!0;try{await N(),window.location.replace("/login.html")}finally{m.disabled=!1}}),await _()});
