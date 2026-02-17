import{o as S,d as E,c as v,b as L}from"./main-L09sn7b-.js";const q=["user","moderator","super_admin"];function x(e){if(!e)return"-";const d=new Date(e);return Number.isNaN(d.getTime())?e:d.toLocaleDateString()}function y(e){return e?'<span class="badge bg-danger">Disabled</span>':'<span class="badge bg-success">Active</span>'}function A(e){const d=q.map(r=>`<option value="${r}" ${e.role===r?"selected":""}>${r}</option>`).join(""),i=e.is_disabled?"Enable":"Disable",f=e.is_disabled?"btn-warning":"btn-outline-danger";return`
    <tr data-id="${e.id}">
      <td>${e.email||"-"}</td>
      <td>
        <select class="form-select form-select-sm role-select" data-id="${e.id}">
          ${d}
        </select>
      </td>
      <td>${y(e.is_disabled)}</td>
      <td>${x(e.created_at)}</td>
      <td class="text-end">
        <button class="btn btn-sm ${f} toggle-user" data-id="${e.id}">
          ${i}
        </button>
        <button class="btn btn-sm btn-primary save-user" data-id="${e.id}">Save</button>
      </td>
    </tr>
  `}function p(e){e.innerHTML=`
    <tr>
      <td colspan="5" class="text-muted">No users found.</td>
    </tr>
  `}S(async()=>{const e=document.getElementById("users-body"),d=document.getElementById("users-error"),i=document.getElementById("admin-logout");if(!await E())return;const r=v();let n=[];const a={},w=async()=>{const{data:s,error:t}=await r.from("profiles").select("id, email, role, is_disabled, created_at").order("created_at",{ascending:!1});if(t){d.textContent=t.message,d.classList.remove("d-none"),p(e);return}if(!s||s.length===0){p(e);return}n=s,e.innerHTML=n.map(A).join(""),_()},_=()=>{e.querySelectorAll(".toggle-user").forEach(s=>{s.addEventListener("click",()=>{const t=s.getAttribute("data-id"),g=e.querySelector(`tr[data-id="${t}"]`),l=n.find(b=>b.id===t);a[t]||(a[t]={...l}),a[t].is_disabled=!a[t].is_disabled;const m=a[t].is_disabled?"Enable":"Disable",c=a[t].is_disabled?"btn-warning":"btn-outline-danger";s.textContent=m,s.className=`btn btn-sm ${c} toggle-user`,s.setAttribute("data-id",t);const u=g.querySelector("td:nth-child(3)");u.innerHTML=y(a[t].is_disabled)})}),e.querySelectorAll(".save-user").forEach(s=>{s.addEventListener("click",async()=>{var b;const t=s.getAttribute("data-id"),l=((b=e.querySelector(`tr[data-id="${t}"]`).querySelector(".role-select"))==null?void 0:b.value)||"";if(!l){alert("Role is required.");return}const m=a[t]||n.find(o=>o.id===t),c={role:l,is_disabled:m.is_disabled||!1};s.disabled=!0;const{error:u}=await r.from("profiles").update(c).eq("id",t);if(u)alert(u.message);else{const o=n.findIndex($=>$.id===t);o!==-1&&(n[o]={...n[o],...c},a[t]={...n[o]})}s.disabled=!1})})};i&&i.addEventListener("click",async()=>{i.disabled=!0;try{await L(),window.location.replace("/login.html")}finally{i.disabled=!1}}),await w()});
