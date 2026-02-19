import{o as q,d as A,g as x,c as I,b as h}from"./main-DJOU-QkC.js";const D=["user","moderator","super_admin"];function T(t){if(!t)return"-";const l=new Date(t);return Number.isNaN(l.getTime())?t:l.toLocaleDateString()}function $(t){return t?'<span class="badge bg-danger">Disabled</span>':'<span class="badge bg-success">Active</span>'}function S(t){const l=D.map(r=>`<option value="${r}" ${t.role===r?"selected":""}>${r}</option>`).join(""),o=t.is_disabled?"Enable":"Disable",y=t.is_disabled?"btn-warning":"btn-outline-danger",n=t.user_id;return`
    <article class="user-card" data-id="${n}">
      <div class="d-flex justify-content-between align-items-start gap-3 mb-2">
        <div>
          <div class="user-email">${t.email||"-"}</div>
          <small class="text-muted">Created: ${T(t.created_at)}</small>
        </div>
        <div class="user-status-slot">${$(t.is_disabled)}</div>
      </div>

      <div class="mb-3">
        <label class="form-label mb-1">Role</label>
        <select class="form-select form-select-sm role-select" data-id="${n}">
          ${l}
        </select>
      </div>

      <div class="user-actions">
        <button class="btn btn-sm ${y} toggle-user" data-id="${n}">
          ${o}
        </button>
        <button class="btn btn-sm btn-outline-danger delete-user" data-id="${n}">Delete</button>
        <button class="btn btn-sm btn-primary save-user" data-id="${n}">Save</button>
      </div>
    </article>
  `}function v(t){t.innerHTML=`
    <div class="users-empty text-muted">No users found.</div>
  `}q(async()=>{var w;const t=document.getElementById("users-body"),l=document.getElementById("users-error"),o=document.getElementById("admin-logout");if(!await A())return;const n=await x(),r=((w=n==null?void 0:n.user)==null?void 0:w.id)||null,g=I();let a=[];const i={},E=async()=>{const{data:s,error:e}=await g.from("profiles").select("user_id, email, role, is_disabled, created_at").order("created_at",{ascending:!1});if(e){l.textContent=e.message,l.classList.remove("d-none"),v(t);return}if(!s||s.length===0){v(t);return}a=s,t.innerHTML=a.map(S).join(""),_()},_=()=>{t.querySelectorAll(".toggle-user").forEach(s=>{s.addEventListener("click",()=>{const e=s.getAttribute("data-id"),p=t.querySelector(`[data-id="${e}"]`),d=a.find(f=>f.user_id===e);if(r&&e===r){alert("Не можете да блокирате собствения си профил.");return}i[e]||(i[e]={...d}),i[e].is_disabled=!i[e].is_disabled;const u=i[e].is_disabled?"Enable":"Disable",b=i[e].is_disabled?"btn-warning":"btn-outline-danger";s.textContent=u,s.className=`btn btn-sm ${b} toggle-user`,s.setAttribute("data-id",e);const m=p.querySelector(".user-status-slot");m.innerHTML=$(i[e].is_disabled)})}),t.querySelectorAll(".save-user").forEach(s=>{s.addEventListener("click",async()=>{var f;const e=s.getAttribute("data-id"),d=((f=t.querySelector(`[data-id="${e}"]`).querySelector(".role-select"))==null?void 0:f.value)||"";if(!d){alert("Role is required.");return}const u=i[e]||a.find(c=>c.user_id===e),b={role:d,is_disabled:u.is_disabled||!1};if(r&&e===r&&b.is_disabled){alert("Не можете да блокирате собствения си профил.");return}s.disabled=!0;const{error:m}=await g.from("profiles").update(b).eq("user_id",e);if(m)alert(m.message);else{const c=a.findIndex(L=>L.user_id===e);c!==-1&&(a[c]={...a[c],...b},i[e]={...a[c]})}s.disabled=!1})}),t.querySelectorAll(".delete-user").forEach(s=>{s.addEventListener("click",async()=>{const e=s.getAttribute("data-id");if(!e)return;if(r&&e===r){alert("Не можете да изтриете собствения си профил.");return}if(!window.confirm("Сигурни ли сте, че искате да изтриете този профил?"))return;s.disabled=!0;const{error:d}=await g.from("profiles").delete().eq("user_id",e);if(d){s.disabled=!1,alert(d.message);return}a=a.filter(u=>u.user_id!==e),delete i[e],a.length===0?v(t):(t.innerHTML=a.map(S).join(""),_())})})};o&&o.addEventListener("click",async()=>{o.disabled=!0;try{await h(),window.location.replace("/app/login.html")}finally{o.disabled=!1}}),await E()});
