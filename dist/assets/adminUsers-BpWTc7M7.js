import{o as h,d as q,g as A,c as I,b as x}from"./main-fDHe_LO-.js";const D=["user","moderator","super_admin"];function T(t){if(!t)return"-";const i=new Date(t);return Number.isNaN(i.getTime())?t:i.toLocaleDateString()}function E(t){return t?'<span class="badge bg-danger">Disabled</span>':'<span class="badge bg-success">Active</span>'}function $(t){const i=D.map(a=>`<option value="${a}" ${t.role===a?"selected":""}>${a}</option>`).join(""),l=t.is_disabled?"Enable":"Disable",y=t.is_disabled?"btn-warning":"btn-outline-danger",d=t.user_id;return`
    <tr data-id="${d}">
      <td>${t.email||"-"}</td>
      <td>
        <select class="form-select form-select-sm role-select" data-id="${d}">
          ${i}
        </select>
      </td>
      <td>${E(t.is_disabled)}</td>
      <td>${T(t.created_at)}</td>
      <td class="text-end">
        <button class="btn btn-sm ${y} toggle-user" data-id="${d}">
          ${l}
        </button>
        <button class="btn btn-sm btn-outline-danger delete-user" data-id="${d}">Delete</button>
        <button class="btn btn-sm btn-primary save-user" data-id="${d}">Save</button>
      </td>
    </tr>
  `}function _(t){t.innerHTML=`
    <tr>
      <td colspan="5" class="text-muted">No users found.</td>
    </tr>
  `}h(async()=>{var S;const t=document.getElementById("users-body"),i=document.getElementById("users-error"),l=document.getElementById("admin-logout");if(!await q())return;const d=await A(),a=((S=d==null?void 0:d.user)==null?void 0:S.id)||null,g=I();let r=[];const n={},v=async()=>{const{data:s,error:e}=await g.from("profiles").select("user_id, email, role, is_disabled, created_at").order("created_at",{ascending:!1});if(e){i.textContent=e.message,i.classList.remove("d-none"),_(t);return}if(!s||s.length===0){_(t);return}r=s,t.innerHTML=r.map($).join(""),w()},w=()=>{t.querySelectorAll(".toggle-user").forEach(s=>{s.addEventListener("click",()=>{const e=s.getAttribute("data-id"),p=t.querySelector(`tr[data-id="${e}"]`),o=r.find(m=>m.user_id===e);if(a&&e===a){alert("Не можете да блокирате собствения си профил.");return}n[e]||(n[e]={...o}),n[e].is_disabled=!n[e].is_disabled;const u=n[e].is_disabled?"Enable":"Disable",f=n[e].is_disabled?"btn-warning":"btn-outline-danger";s.textContent=u,s.className=`btn btn-sm ${f} toggle-user`,s.setAttribute("data-id",e);const b=p.querySelector("td:nth-child(3)");b.innerHTML=E(n[e].is_disabled)})}),t.querySelectorAll(".save-user").forEach(s=>{s.addEventListener("click",async()=>{var m;const e=s.getAttribute("data-id"),o=((m=t.querySelector(`tr[data-id="${e}"]`).querySelector(".role-select"))==null?void 0:m.value)||"";if(!o){alert("Role is required.");return}const u=n[e]||r.find(c=>c.user_id===e),f={role:o,is_disabled:u.is_disabled||!1};if(a&&e===a&&f.is_disabled){alert("Не можете да блокирате собствения си профил.");return}s.disabled=!0;const{error:b}=await g.from("profiles").update(f).eq("user_id",e);if(b)alert(b.message);else{const c=r.findIndex(L=>L.user_id===e);c!==-1&&(r[c]={...r[c],...f},n[e]={...r[c]})}s.disabled=!1})}),t.querySelectorAll(".delete-user").forEach(s=>{s.addEventListener("click",async()=>{const e=s.getAttribute("data-id");if(!e)return;if(a&&e===a){alert("Не можете да изтриете собствения си профил.");return}if(!window.confirm("Сигурни ли сте, че искате да изтриете този профил?"))return;s.disabled=!0;const{error:o}=await g.from("profiles").delete().eq("user_id",e);if(o){s.disabled=!1,alert(o.message);return}r=r.filter(u=>u.user_id!==e),delete n[e],r.length===0?_(t):(t.innerHTML=r.map($).join(""),w())})})};l&&l.addEventListener("click",async()=>{l.disabled=!0;try{await x(),window.location.replace("/app/login.html")}finally{l.disabled=!1}}),await v()});
