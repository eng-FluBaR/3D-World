import{o,c as u,g as l}from"./main-yOuTAhgd.js";const b={pending:"bg-secondary",quoted:"bg-warning text-dark",accepted:"bg-primary",rejected:"bg-danger",completed:"bg-success"};function g(t){return t==null?"-":Number.isNaN(Number(t))?String(t):`€${Number(t).toFixed(2)}`}function f(t){if(!t)return"-";const n=new Date(t);return Number.isNaN(n.getTime())?String(t):n.toLocaleDateString()}function p(t){const n=b[t.status]||"bg-secondary",r=t.status==="quoted"?`<div class="btn-group btn-group-sm" role="group">
           <button class="btn btn-success" data-action="accept" data-id="${t.id}">Accept</button>
           <button class="btn btn-outline-danger" data-action="reject" data-id="${t.id}">Reject</button>
         </div>`:"-";return`
    <tr>
      <td>${t.file_name||t.file_path||"-"}</td>
      <td><span class="badge ${n}">${t.status}</span></td>
      <td>${g(t.price)}</td>
      <td>${f(t.deadline)}</td>
      <td class="text-end">${r}</td>
    </tr>
  `}function m(t){t.innerHTML=`
    <tr>
      <td colspan="5" class="text-muted">No requests yet.</td>
    </tr>
  `}o(()=>{const t=document.getElementById("requests-body");if(!t)return;const n=u(),r=async()=>{const s=await l();if(!s){window.location.replace("/login.html");return}const{data:e,error:a}=await n.from("requests").select("id, file_name, file_path, status, price, deadline").eq("user_id",s.user.id).order("created_at",{ascending:!1});if(a){t.innerHTML=`
        <tr>
          <td colspan="5" class="text-danger">${a.message}</td>
        </tr>
      `;return}if(!e||e.length===0){m(t);return}t.innerHTML=e.map(p).join("")};t.addEventListener("click",async s=>{const e=s.target.closest("button[data-action]");if(!e)return;const a=e.getAttribute("data-id"),d=e.getAttribute("data-action");if(!a||!d)return;const c=d==="accept"?"accepted":"rejected";e.disabled=!0;const{error:i}=await n.from("requests").update({status:c}).eq("id",a);if(i){e.disabled=!1,alert(i.message);return}await r()}),r()});
