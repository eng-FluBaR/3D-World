import{o as L,c as j,g as T}from"./main-CfBuKUcG.js";const A={pending:"bg-secondary",quoted:"bg-warning text-dark",accepted:"bg-primary",rejected:"bg-danger",completed:"bg-success"},y={scan:"Сканиране",model:"Моделиране",print:"Принтиране"},$=Object.keys(y);function _(t){return t==null?"-":Number.isNaN(Number(t))?String(t):`€${Number(t).toFixed(2)}`}function E(t){if(!t)return"-";const e=new Date(t);return Number.isNaN(e.getTime())?String(t):e.toLocaleDateString()}function C(t){return t.status!=="completed"}function D(t=[]){return!Array.isArray(t)||t.length===0?'<span class="text-muted">Няма избрани услуги</span>':t.filter(e=>$.includes(e)).map(e=>`<span class="badge text-bg-secondary me-1">${y[e]}</span>`).join("")}function M(t=[],e=!1){const l=new Set(Array.isArray(t)?t:[]);return $.map(a=>`<button type="button" class="btn btn-outline-secondary btn-sm task-toggle-btn ${l.has(a)?"is-active":""}" data-service="${a}" ${e?"disabled":""}>${y[a]}</button>`).join("")}function k(t){const e=A[t.status]||"bg-secondary",l=`<button class="btn btn-sm btn-outline-primary" data-action="open" data-id="${t.id}">Open</button>`,a=t.file_name||t.file_path||"-";return`
    <article class="request-card" data-id="${t.id}">
      <div class="request-card-top">
        <div>
          <div class="request-file text-truncate">${a}</div>
          <small class="text-muted d-block mt-1">Price: ${_(t.price)} · Deadline: ${E(t.deadline)}</small>
        </div>
        <span class="badge ${e}">${t.status}</span>
      </div>
      <div class="d-flex justify-content-end mt-3">
        ${l}
      </div>
    </article>
  `}function I(t){const e=C(t),l=t.status==="quoted",a=A[t.status]||"bg-secondary";return`
    <div class="row g-3">
      <div class="col-12">
        <label class="form-label">File</label>
        <input type="text" class="form-control" value="${t.file_name||t.file_path||"-"}" disabled />
      </div>

      <div class="col-md-6">
        <label class="form-label">Material</label>
        <input type="text" class="form-control request-material" value="${t.material||""}" ${e?"":"disabled"} />
      </div>

      <div class="col-md-6">
        <label class="form-label">Quantity</label>
        <input type="number" min="1" class="form-control request-quantity" value="${t.quantity||1}" ${e?"":"disabled"} />
      </div>

      <div class="col-12">
        <label class="form-label">Notes</label>
        <textarea class="form-control request-notes" rows="4" ${e?"":"disabled"}>${t.notes||""}</textarea>
      </div>

      <div class="col-12">
        <label class="form-label">Услуги по заявката</label>
        <div class="mb-2">${D(t.service_options)}</div>
        <div class="d-flex flex-wrap gap-2 request-service-options">
          ${M(t.service_options,!e)}
        </div>
      </div>

      <div class="col-md-4">
        <label class="form-label">Status</label>
        <div><span class="badge ${a}">${t.status}</span></div>
      </div>

      <div class="col-md-4">
        <label class="form-label">Price</label>
        <input type="text" class="form-control" value="${_(t.price)}" disabled />
      </div>

      <div class="col-md-4">
        <label class="form-label">Deadline</label>
        <input type="text" class="form-control" value="${E(t.deadline)}" disabled />
      </div>
    </div>

    <div class="d-flex flex-wrap gap-2 mt-4">
      ${e?`<button class="btn btn-primary" data-action="save" data-id="${t.id}">Save Changes</button>`:""}
      ${e?`<button class="btn btn-outline-danger" data-action="delete" data-id="${t.id}">Delete Request</button>`:""}
      ${l?`<button class="btn btn-success" data-action="accept" data-id="${t.id}">Accept Quote</button>`:""}
      ${l?`<button class="btn btn-outline-danger" data-action="reject" data-id="${t.id}">Reject Quote</button>`:""}
    </div>
  `}function B(t){t.innerHTML=`
    <div class="requests-empty text-muted">No requests yet.</div>
  `}L(()=>{const t=document.getElementById("requests-body"),e=document.getElementById("requestDetailsModal"),l=document.getElementById("request-modal-title"),a=document.getElementById("request-modal-body");if(!t)return;const u=j();let b=[];const d=e&&window.bootstrap?new window.bootstrap.Modal(e):null,p=r=>{if(!a)return;const n=b.find(s=>s.id===r);n&&(l&&(l.textContent=`Request · ${n.file_name||n.file_path||n.id}`),a.innerHTML=I(n),d==null||d.show())},f=async()=>{const r=await T();if(!r){window.location.replace("/app/login.html");return}const{data:n,error:s}=await u.from("requests").select("id, file_name, file_path, material, quantity, notes, service_options, status, price, deadline").eq("user_id",r.user.id).order("created_at",{ascending:!1});if(s){t.innerHTML=`
        <div class="requests-empty text-danger">${s.message}</div>
      `;return}if(!n||n.length===0){b=[],B(t);return}b=n,t.innerHTML=b.map(k).join("")};t.addEventListener("click",async r=>{const n=r.target.closest("button[data-action]");if(!n)return;const s=n.getAttribute("data-id"),i=n.getAttribute("data-action");if(!(!s||!i)&&i==="open"){p(s);return}}),a==null||a.addEventListener("click",async r=>{var w,x,S;const n=r.target.closest(".task-toggle-btn");if(n){n.classList.toggle("is-active");return}const s=r.target.closest("button[data-action]");if(!s)return;const i=s.getAttribute("data-id"),c=s.getAttribute("data-action");if(!(!i||!c)){if(c==="accept"||c==="reject"){const g=c==="accept"?"accepted":"rejected";s.disabled=!0;const{error:o}=await u.from("requests").update({status:g}).eq("id",i);if(o){s.disabled=!1,alert(o.message);return}await f(),p(i);return}if(c==="delete"){if(!window.confirm("Сигурни ли сте, че искате да изтриете тази заявка?"))return;s.disabled=!0;const{error:o}=await u.from("requests").delete().eq("id",i);if(o){s.disabled=!1,alert(o.message);return}await f(),d==null||d.hide();return}if(c==="save"){if(!b.find(m=>m.id===i))return;const o=((w=a.querySelector(".request-material"))==null?void 0:w.value)||"",h=((x=a.querySelector(".request-quantity"))==null?void 0:x.value)||"1",N=((S=a.querySelector(".request-notes"))==null?void 0:S.value)||"",R=Array.from(a.querySelectorAll(".request-service-options .task-toggle-btn.is-active")).map(m=>m.getAttribute("data-service")||"").filter(m=>$.includes(m)),v=Number.parseInt(h,10);if(!Number.isInteger(v)||v<1){alert("Моля въведете валидно количество.");return}s.disabled=!0;const{error:q}=await u.from("requests").update({material:o.trim()||null,quantity:v,notes:N.trim()||null,service_options:R}).eq("id",i);if(q){s.disabled=!1,alert(q.message);return}await f(),p(i)}}}),f()});
