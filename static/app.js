const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const el = (tag, cls) => { const n=document.createElement(tag); if(cls) n.className=cls; return n; };

const postsBody = $("#postsBody");
const draftsDiv = $("#drafts");
const costNote = $("#costNote");
const yearSpan = $("#year"); if (yearSpan) yearSpan.textContent = new Date().getFullYear();

const fmtDateUK = (iso) => iso ? new Date(iso).toLocaleString("en-GB", { timeZone:"Europe/London", year:"numeric", month:"short", day:"2-digit", hour:"2-digit", minute:"2-digit", hour12:false }) : "";

function switchTab(name){
  $$(".tabs button").forEach(b=>b.classList.toggle("active", b.dataset.tab===name));
  $$(".tab").forEach(d=>d.style.display = d.id === `tab-${name}` ? "block" : "none");
}
$$(".tabs button").forEach(b=>b.addEventListener("click", ()=>switchTab(b.dataset.tab)));

$("#saveToken").addEventListener("click", async () => {
  const platform = $("#platform").value;
  const token = $("#token").value.trim();
  if (!token) return alert("Enter a token (stub)");
  const res = await fetch("/auth/manual", { method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify({ platform, access_token: token }) });
  alert(res.ok ? "Token saved" : "Failed to save token");
});

$("#genForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  draftsDiv.textContent = "Generating…";
  costNote.textContent = "";
  const topic = $("#topic").value.trim();
  const tone = $("#tone").value;
  const count = +($("#count").value || 3);
  const body = { topic, tone, count };
  if ($("#useOpenAI").checked) { body.provider = "openai"; body.model = $("#model").value.trim(); }
  const res = await fetch("/generate", { method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify(body) });
  const drafts = await res.json();
  draftsDiv.innerHTML = "";
  let total = 0;
  drafts.forEach((d) => {
    const card = el("div","draft");
    const body = el("div"); body.textContent = d.content;
    const meta = el("div","meta");
    const score = el("span"); score.textContent = `Score: ${d.score}`; meta.appendChild(score);
    (d.hashtags||[]).forEach(t=>{ const tag=el("span","tag"); tag.textContent=t; meta.appendChild(tag); });
    const useBtn = el("button"); useBtn.textContent = "Use this";
    useBtn.addEventListener("click", () => {
      $("#content").value = d.content + (d.hashtags?.length ? "\n\n" + d.hashtags.join(" ") : "");
      $("#schedPlatform").value = $("#platform").value;
      switchTab("compose");
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    });
    card.append(body, meta, useBtn); draftsDiv.appendChild(card);
    if (d.cost_gbp) total += Number(d.cost_gbp);
  });
  if (total > 0) costNote.textContent = `Estimated cost: £${total.toFixed(4)} (configurable).`;
});

$("#scheduleForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const platform = $("#schedPlatform").value;
  const content = $("#content").value.trim();
  const whenRaw = $("#when").value;
  let scheduled_time = null;
  if (whenRaw) {
    const dtLocal = new Date(whenRaw);
    scheduled_time = new Date(dtLocal.getTime() - dtLocal.getTimezoneOffset()*60000).toISOString();
  }
  const res = await fetch("/posts", { method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify({ platform, content, scheduled_time }) });
  if (!res.ok) { const err = await res.json(); return alert(err.detail || "Failed to schedule"); }
  $("#content").value=""; $("#when").value=""; refreshPosts();
});

async function refreshPosts(){
  const res = await fetch("/posts");
  const rows = await res.json();
  postsBody.innerHTML = "";
  rows.forEach(r=>{
    const tr = el("tr");
    const td = (t)=>{ const d=el("td"); d.textContent=t; return d; };
    tr.append(td(r.id), td(r.platform), td(r.status), td(r.scheduled_time ? fmtDateUK(r.scheduled_time) : ""), td(r.external_id || ""), td(r.error || ""));
    postsBody.appendChild(tr);
  });
}
setInterval(refreshPosts, 4000); refreshPosts();

$("#loadTemplates").addEventListener("click", async ()=>{
  const purpose = $("#tplPurpose").value;
  const res = await fetch(`/templates${purpose?`?purpose=${encodeURIComponent(purpose)}`:""}`);
  const data = await res.json();
  const list = $("#tplList"); list.innerHTML = "";
  data.templates.forEach(t=>{
    const card = el("div","draft");
    const title = el("div"); title.textContent = `${t.id} — ${t.title} (${t.purpose})`;
    const meta = el("div","meta"); meta.textContent = t.template;
    const useBtn = el("button"); useBtn.textContent = "Use ID";
    useBtn.addEventListener("click", ()=>{ $("#tplId").value = t.id; switchTab("templates"); });
    card.append(title, meta, useBtn); list.appendChild(card);
  });
});

$("#renderForm").addEventListener("submit", async (e)=>{
  e.preventDefault();
  const id = $("#tplId").value.trim();
  let vars;
  try { vars = JSON.parse($("#tplVars").value || "{}"); } catch { return alert("Variables must be valid JSON"); }
  const res = await fetch("/templates/render", { method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify({ template_id:id, variables:vars }) });
  if (!res.ok) { const err=await res.json(); return alert(err.detail || "Render failed"); }
  const out = await res.json();
  $("#renderOut").innerHTML = "";
  const card = el("div","draft");
  const body = el("div"); body.textContent = out.content;
  const meta = el("div","meta"); meta.textContent = `Score ${out.score} • ${out.hashtags.join(" ")}`;
  const useBtn = el("button"); useBtn.textContent = "Send to Compose";
  useBtn.addEventListener("click", ()=>{ $("#content").value = out.content + (out.hashtags?.length ? "\n\n"+out.hashtags.join(" ") : ""); switchTab("compose"); });
  card.append(body, meta, useBtn); $("#renderOut").appendChild(card);
});

$("#agentForm").addEventListener("submit", async (e)=>{
  e.preventDefault();
  const goal = $("#agentGoal").value; const platform = $("#agentPlatform").value; const question = $("#agentQ").value.trim();
  const res = await fetch("/agent/ask", { method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify({ goal, platform, question }) });
  const data = await res.json();
  const out = $("#agentOut"); out.innerHTML = "";
  const p = el("p"); p.textContent = data.answer; out.appendChild(p);
  data.suggested_templates.forEach(t=>{
    const li = el("div","draft"); li.textContent = `${t.id} — ${t.title}: ${t.template}`;
    out.appendChild(li);
  });
});

$("#loadBestTime").addEventListener("click", async ()=>{
  const res = await fetch("/best-time");
  const data = await res.json();
  const ul = $("#bestSlots"); ul.innerHTML = "";
  data.slots.forEach(s=>{ const li=document.createElement("li"); li.textContent = s.local_label; ul.appendChild(li); });
});

$("#fbForm").addEventListener("submit", async (e)=>{
  e.preventDefault();
  const user = $("#fbUser").value.trim() || null;
  const message = $("#fbMsg").value.trim();
  if (!message) return;
  const res = await fetch("/feedback", { method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify({ user, message }) });
  if (res.ok) { $("#fbMsg").value=""; loadFeedback(); } else { alert("Failed to send"); }
});

async function loadFeedback(){
  const res = await fetch("/feedback"); const data = await res.json();
  const ul = $("#fbList"); ul.innerHTML = "";
  data.items.forEach(i=>{ const li=document.createElement("li"); li.textContent = `${i.created_at} — ${i.user || "anon"}: ${i.message}`; ul.appendChild(li); });
}
loadFeedback();

async function loadPricing(){
  const res = await fetch("/pricing"); const data = await res.json();
  const box = $("#pricing"); box.innerHTML = "";
  const wrap = el("div"); wrap.style.display="grid"; wrap.style.gap="10px";
  data.tiers.forEach(t=>{
    const card = el("div","draft");
    const title = el("h3"); title.textContent = `${t.name} — £${t.gbp_per_month}/month`;
    const features = el("ul");
    t.features.forEach(f=>{ const li=document.createElement("li"); li.textContent=f; features.appendChild(li); });
    card.append(title, features);
    wrap.appendChild(card);
  });
  box.appendChild(wrap);
}
loadPricing();