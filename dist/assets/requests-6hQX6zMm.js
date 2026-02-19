import{o as L,c as T,g as j}from"./main-B0j_tV-3.js";const A={pending:"bg-secondary",quoted:"bg-warning text-dark",accepted:"bg-primary",rejected:"bg-danger",completed:"bg-success"},y={scan:"Сканиране",model:"Моделиране",print:"Принтиране"},$=Object.keys(y);function _(t){return t==null?"-":Number.isNaN(Number(t))?String(t):`€${Number(t).toFixed(2)}`}function E(t){if(!t)return"-";const e=new Date(t);return Number.isNaN(e.getTime())?String(t):e.toLocaleDateString()}function C(t){return t.status!=="completed"}function M(t=[]){return!Array.isArray(t)||t.length===0?'<span class="text-muted">Няма избрани услуги</span>':t.filter(e=>$.includes(e)).map(e=>`<span class="badge text-bg-secondary me-1">${y[e]}</span>`).join("")}function D(t=[],e=!1){const r=new Set(Array.isArray(t)?t:[]);return $.map(s=>`<button type="button" class="btn btn-outline-secondary btn-sm task-toggle-btn ${r.has(s)?"is-active":""}" data-service="${s}" ${e?"disabled":""}>${y[s]}</button>`).join("")}function I(t){const e=A[t.status]||"bg-secondary",r=`<button class="btn btn-sm btn-outline-primary" data-action="open" data-id="${t.id}">Open</button>`;return`
    <tr>
      <td>${t.file_name||t.file_path||"-"}</td>
      <td><span class="badge ${e}">${t.status}</span></td>
      <td>${_(t.price)}</td>
      <td>${E(t.deadline)}</td>
      <td class="text-end">${r}</td>
    </tr>
  `}function k(t){const e=C(t),r=t.status==="quoted",s=A[t.status]||"bg-secondary";return`
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
        <div class="mb-2">${M(t.service_options)}</div>
        <div class="d-flex flex-wrap gap-2 request-service-options">
          ${D(t.service_options,!e)}
        </div>
      </div>

      <div class="col-md-4">
        <label class="form-label">Status</label>
        <div><span class="badge ${s}">${t.status}</span></div>
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
      ${r?`<button class="btn btn-success" data-action="accept" data-id="${t.id}">Accept Quote</button>`:""}
      ${r?`<button class="btn btn-outline-danger" data-action="reject" data-id="${t.id}">Reject Quote</button>`:""}
    </div>
  `}function B(t){t.innerHTML=`
    <tr>
      <td colspan="5" class="text-muted">No requests yet.</td>
    </tr>
  `}L(()=>{const t=document.getElementById("requests-body"),e=document.getElementById("requestDetailsModal"),r=document.getElementById("request-modal-title"),s=document.getElementById("request-modal-body");if(!t)return;const u=T();let b=[];const d=e&&window.bootstrap?new window.bootstrap.Modal(e):null,p=l=>{if(!s)return;const n=b.find(a=>a.id===l);n&&(r&&(r.textContent=`Request · ${n.file_name||n.file_path||n.id}`),s.innerHTML=k(n),d==null||d.show())},f=async()=>{const l=await j();if(!l){window.location.replace("/app/login.html");return}const{data:n,error:a}=await u.from("requests").select("id, file_name, file_path, material, quantity, notes, service_options, status, price, deadline").eq("user_id",l.user.id).order("created_at",{ascending:!1});if(a){t.innerHTML=`
        <tr>
          <td colspan="5" class="text-danger">${a.message}</td>
        </tr>
      `;return}if(!n||n.length===0){b=[],B(t);return}b=n,t.innerHTML=b.map(I).join("")};t.addEventListener("click",async l=>{const n=l.target.closest("button[data-action]");if(!n)return;const a=n.getAttribute("data-id"),i=n.getAttribute("data-action");if(!(!a||!i)&&i==="open"){p(a);return}}),s==null||s.addEventListener("click",async l=>{var w,S,x;const n=l.target.closest(".task-toggle-btn");if(n){n.classList.toggle("is-active");return}const a=l.target.closest("button[data-action]");if(!a)return;const i=a.getAttribute("data-id"),c=a.getAttribute("data-action");if(!(!i||!c)){if(c==="accept"||c==="reject"){const g=c==="accept"?"accepted":"rejected";a.disabled=!0;const{error:o}=await u.from("requests").update({status:g}).eq("id",i);if(o){a.disabled=!1,alert(o.message);return}await f(),p(i);return}if(c==="delete"){if(!window.confirm("Сигурни ли сте, че искате да изтриете тази заявка?"))return;a.disabled=!0;const{error:o}=await u.from("requests").delete().eq("id",i);if(o){a.disabled=!1,alert(o.message);return}await f(),d==null||d.hide();return}if(c==="save"){if(!b.find(m=>m.id===i))return;const o=((w=s.querySelector(".request-material"))==null?void 0:w.value)||"",h=((S=s.querySelector(".request-quantity"))==null?void 0:S.value)||"1",N=((x=s.querySelector(".request-notes"))==null?void 0:x.value)||"",R=Array.from(s.querySelectorAll(".request-service-options .task-toggle-btn.is-active")).map(m=>m.getAttribute("data-service")||"").filter(m=>$.includes(m)),v=Number.parseInt(h,10);if(!Number.isInteger(v)||v<1){alert("Моля въведете валидно количество.");return}a.disabled=!0;const{error:q}=await u.from("requests").update({material:o.trim()||null,quantity:v,notes:N.trim()||null,service_options:R}).eq("id",i);if(q){a.disabled=!1,alert(q.message);return}await f(),p(i)}}}),f()});
