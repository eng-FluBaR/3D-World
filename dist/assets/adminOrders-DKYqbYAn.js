import{o as I,r as B,g as U,c as T,b as P}from"./main-BzxWLnDD.js";const k=["pending","quoted","accepted","rejected","completed"],R={pending:"Pending",quoted:"Quoted",accepted:"Accepted",rejected:"Rejected",completed:"Completed"},E="gallery";function C(e){return e.replace(/[^a-zA-Z0-9._-]/g,"_")}function N(e){const r=(e||"").toLowerCase();return r.endsWith(".stl")?"stl":r.endsWith(".obj")?"obj":r.endsWith(".svg")?"svg":"other"}async function x(e,r){if(!(r!=null&&r.file_path))return{fileUrl:(r==null?void 0:r.file_url)||null,storageBucket:null,storagePath:null};const m=r.file_path,p=r.file_name||m.split("/").pop()||"project",h=C(p),o=`projects/${r.id}-${Date.now()}-${h}`,{data:w,error:c}=await e.storage.from("uploads").download(m);if(c)throw c;const{error:i}=await e.storage.from(E).upload(o,w,{upsert:!0});if(i)throw i;const{data:_}=e.storage.from(E).getPublicUrl(o);return{fileUrl:(_==null?void 0:_.publicUrl)||null,storageBucket:E,storagePath:o}}function S(e){return e!=null&&e.gallery_projects?Array.isArray(e.gallery_projects)?e.gallery_projects[0]||null:e.gallery_projects:null}function O(e){const r=S(e),m=e.status==="completed",p=k.map(o=>`<option value="${o}" ${e.status===o?"selected":""}>${R[o]||o}</option>`).join(""),h=e.file_url?`<a href="${e.file_url}" target="_blank" class="text-truncate d-block">${e.file_name||e.file_path}</a>`:`<small class="text-muted">${e.file_name||e.file_path||"-"}</small>`;return`
    <tr data-id="${e.id}">
      <td data-label="User">${e.user_email||"-"}</td>
      <td data-label="File">${h}</td>
      <td data-label="Status">
        <select class="form-select form-select-sm status-select status-${e.status}" data-id="${e.id}">
          ${p}
        </select>
      </td>
      <td data-label="Price">
        <input type="number" class="form-control form-control-sm price-input" value="${e.price||""}" placeholder="0.00" data-id="${e.id}" />
      </td>
      <td data-label="Deadline">
        <input type="date" class="form-control form-control-sm deadline-input" value="${e.deadline||""}" data-id="${e.id}" />
      </td>
      <td class="text-end actions-cell" data-label="Action">
        <div class="d-inline-flex gap-2">
          <button class="btn btn-sm btn-primary save-order" data-id="${e.id}">Save</button>
          <button class="btn btn-sm btn-outline-danger delete-order" data-id="${e.id}">Delete</button>
          <button class="btn btn-sm btn-outline-secondary gallery-order" data-id="${e.id}" ${m?"":"disabled"}>
            ${r?"Update Gallery":"Add Gallery"}
          </button>
          <button class="btn btn-sm btn-outline-dark remove-gallery-order" data-id="${e.id}" ${r?"":"disabled"}>
            Remove Gallery
          </button>
        </div>
      </td>
    </tr>
  `}function q(e){e.innerHTML=`
    <tr>
      <td colspan="6" class="text-muted">No orders found.</td>
    </tr>
  `}I(async()=>{var L;const e=document.getElementById("orders-body"),r=document.getElementById("status-filter"),m=document.getElementById("orders-error"),p=document.getElementById("admin-logout");if(!await B())return;const o=await U(),w=((L=o==null?void 0:o.user)==null?void 0:L.id)||null,c=T();let i=[];const _=async()=>{const{data:t,error:s}=await c.from("requests").select(`
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
      `).order("created_at",{ascending:!1});if(s){m.textContent=s.message,m.classList.remove("d-none"),q(e);return}if(!t){q(e);return}i=t.map(a=>{var l;return{...a,user_email:((l=a.profiles)==null?void 0:l.email)||"-"}}),g()},g=()=>{const t=(r==null?void 0:r.value)||"",s=t?i.filter(a=>a.status===t):i;if(s.length===0){q(e);return}e.innerHTML=s.map(O).join(""),j()},j=()=>{e.querySelectorAll(".status-select").forEach(t=>{t.addEventListener("change",()=>{k.forEach(s=>t.classList.remove(`status-${s}`)),t.classList.add(`status-${t.value}`)})}),e.querySelectorAll(".save-order").forEach(t=>{t.addEventListener("click",async()=>{var y,b,d;const s=t.getAttribute("data-id"),a=e.querySelector(`tr[data-id="${s}"]`),l=((y=a.querySelector(".status-select"))==null?void 0:y.value)||"",u=((b=a.querySelector(".price-input"))==null?void 0:b.value)||null,f=((d=a.querySelector(".deadline-input"))==null?void 0:d.value)||null;if(!l){alert("Status is required.");return}t.disabled=!0;const n={status:l};u!==""&&u!==null&&(n.price=Number(u)),f!==""&&f!==null&&(n.deadline=f);const{error:v}=await c.from("requests").update(n).eq("id",s);if(v)alert(v.message);else{const $=i.findIndex(A=>A.id===s);$!==-1&&(i[$]={...i[$],...n}),g()}t.disabled=!1})}),e.querySelectorAll(".delete-order").forEach(t=>{t.addEventListener("click",async()=>{const s=t.getAttribute("data-id");if(!s||!window.confirm("Сигурни ли сте, че искате да изтриете тази заявка?"))return;t.disabled=!0;const{error:l}=await c.from("requests").delete().eq("id",s);if(l){t.disabled=!1,alert(l.message);return}i=i.filter(u=>u.id!==s),g()})}),e.querySelectorAll(".gallery-order").forEach(t=>{t.addEventListener("click",async()=>{const s=t.getAttribute("data-id");if(!s)return;const a=i.find(d=>d.id===s);if(!a)return;if(a.status!=="completed"){alert("Само завършени проекти могат да се показват в галерията.");return}const l=S(a),u=window.prompt("Категория на проекта:",(l==null?void 0:l.category)||"");if(u===null)return;const f=window.prompt("Кратко описание на проекта:",(l==null?void 0:l.short_description)||"");if(f===null)return;t.disabled=!0;let n;try{n=await x(c,a)}catch(d){t.disabled=!1,alert((d==null?void 0:d.message)||"Неуспешно публикуване на файла в галерията.");return}const v={request_id:a.id,file_name:a.file_name||a.file_path||"Проект",file_url:(n==null?void 0:n.fileUrl)||a.file_url||null,category:u.trim()||"Общи",short_description:f.trim()||"",is_visible:!0,created_by:w,storage_bucket:(n==null?void 0:n.storageBucket)||null,storage_path:(n==null?void 0:n.storagePath)||null,model_type:N(a.file_name||a.file_path||"")},{data:y,error:b}=await c.from("gallery_projects").upsert(v,{onConflict:"request_id"}).select("id, category, short_description, is_visible, storage_bucket, storage_path, file_url, model_type").single();if(b){t.disabled=!1,alert(b.message);return}i=i.map(d=>d.id===a.id?{...d,gallery_projects:y?[y]:[]}:d),g()})}),e.querySelectorAll(".remove-gallery-order").forEach(t=>{t.addEventListener("click",async()=>{const s=t.getAttribute("data-id");if(!s)return;const a=i.find(n=>n.id===s),l=S(a);if(!(l!=null&&l.id)||!window.confirm("Да премахна ли проекта от галерията?"))return;t.disabled=!0,l.storage_bucket&&l.storage_path&&await c.storage.from(l.storage_bucket).remove([l.storage_path]);const{error:f}=await c.from("gallery_projects").delete().eq("id",l.id);if(f){t.disabled=!1,alert(f.message);return}i=i.map(n=>n.id===a.id?{...n,gallery_projects:[]}:n),g()})})};r&&r.addEventListener("change",g),p&&p.addEventListener("click",async()=>{p.disabled=!0;try{await P(),window.location.replace("/login.html")}finally{p.disabled=!1}}),await _()});
