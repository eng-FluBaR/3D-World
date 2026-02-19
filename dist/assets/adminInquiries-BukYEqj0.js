import{o as p,r as b,c as _}from"./main-DJOU-QkC.js";function v(e){if(!e)return"-";const t=new Date(e);return Number.isNaN(t.getTime())?e:t.toLocaleString()}function l(e){return(e||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function f(e){const t=e.is_read?'<span class="badge text-bg-secondary">Прочетено</span>':'<span class="badge text-bg-warning">Непрочетено</span>',s=l(e.message),d=l(e.name),i=l(e.email);return`
    <article class="inquiry-card" data-id="${e.id}">
      <div class="inquiry-card-head">
        <div>
          <h6 class="mb-1">${d||"-"}</h6>
          <a href="mailto:${i}" class="small">${i||"-"}</a>
        </div>
        <div>${t}</div>
      </div>
      <p class="inquiry-message">${s}</p>
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-2">
        <small class="text-muted">${v(e.created_at)}</small>
        <button class="btn btn-sm btn-outline-primary mark-read-btn" data-id="${e.id}" ${e.is_read?"disabled":""}>
          Маркирай като прочетено
        </button>
      </div>
    </article>
  `}function m(e){e.innerHTML='<div class="text-muted">Няма контактни запитвания.</div>'}p(async()=>{if(!await b())return;const t=document.getElementById("inquiries-body"),s=document.getElementById("inquiries-error"),d=document.getElementById("inquiries-unread-count");if(!t)return;const i=_();let a=[];const c=()=>{const n=a.filter(r=>!r.is_read).length;d&&(d.textContent=`Непрочетени: ${n}`)},u=()=>{t.querySelectorAll(".mark-read-btn").forEach(n=>{n.addEventListener("click",async()=>{const r=n.getAttribute("data-id");if(!r)return;n.disabled=!0;const{error:g}=await i.from("contact_inquiries").update({is_read:!0,read_at:new Date().toISOString()}).eq("id",r);if(g){alert(g.message||"Неуспешно обновяване."),n.disabled=!1;return}a=a.map(o=>o.id===r?{...o,is_read:!0,read_at:new Date().toISOString()}:o),a.length===0?m(t):(t.innerHTML=a.map(f).join(""),u()),c()})})};await(async()=>{const{data:n,error:r}=await i.from("contact_inquiries").select("id, name, email, message, is_read, read_at, created_at").order("created_at",{ascending:!1});if(r){s&&(s.textContent=r.message,s.classList.remove("d-none")),m(t);return}if(a=n||[],a.length===0){m(t),c();return}t.innerHTML=a.map(f).join(""),c(),u()})()});
