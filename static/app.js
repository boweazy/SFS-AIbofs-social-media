const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const el = (tag, cls) => { const n=document.createElement(tag); if(cls) n.className=cls; return n; };

const postsBody = $("#postsBody");
const draftsDiv = $("#drafts");
const costNote = $("#costNote");
const yearSpan = $("#year"); if (yearSpan) yearSpan.textContent = new Date().getFullYear();

const fmtDateUK = (iso) => iso ? new Date(iso).toLocaleString("en-GB", { timeZone:"Europe/London", year:"numeric", month:"short", day:"2-digit", hour:"2-digit", minute:"2-digit", hour12:false }) : "";

// Tab switching
function switchTab(name){
  $$(".tabs button").forEach(b=>b.classList.toggle("active", b.dataset.tab===name));
  $$(".tab").forEach(d=>d.style.display = d.id === `tab-${name}` ? "block" : "none");
}
$$(".tabs button").forEach(b=>b.addEventListener("click", ()=>switchTab(b.dataset.tab)));

// Onboarding management
let onboardingData = { connect_account: false, generate_draft: false, schedule_post: false };

async function updateOnboarding(){
  try {
    const res = await fetch("/onboarding/status");
    const data = await res.json();
    onboardingData = data.onboarding;
    $("#check-connect").classList.toggle("done", data.onboarding.connect_account);
    $("#check-draft").classList.toggle("done", data.onboarding.generate_draft);
    $("#check-schedule").classList.toggle("done", data.onboarding.schedule_post);
    
    if(data.onboarding.connect_account && data.onboarding.generate_draft && data.onboarding.schedule_post) {
      $("#onboarding").style.display = "none";
    }
  } catch(e) {
    console.log("Onboarding status not available");
  }
}

$("#dismissOnboarding").addEventListener("click", () => {
  $("#onboarding").style.display = "none";
});

// Auth
$("#saveToken").addEventListener("click", async () => {
  const platform = $("#platform").value;
  const token = $("#token").value.trim();
  if (!token) return alert("Enter a token (stub)");
  const res = await fetch("/auth/manual", { method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify({ platform, access_token: token }) });
  alert(res.ok ? "Token saved" : "Failed to save token");
  if(res.ok) updateOnboarding();
});

// Generate drafts
$("#genForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  draftsDiv.textContent = "Generating…";
  costNote.textContent = "";
  const topic = $("#topic").value.trim();
  const tone = $("#tone").value;
  const count = +($("#count").value || 3);
  const body = { topic, tone, count };
  if ($("#useOpenAI").checked) { body.provider = "openai"; }
  
  try {
    const res = await fetch("/generate", { method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify(body) });
    if(!res.ok) {
      const err = await res.json();
      if(res.status === 402) {
        alert("Upgrade required for OpenAI features. Check the Pricing tab!");
        $("#useOpenAI").checked = false;
        return;
      }
      throw new Error(err.detail || "Generation failed");
    }
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
        $("#content").value = d.content + (d.hashtags?.length ? "\\n\\n" + d.hashtags.join(" ") : "");
        $("#schedPlatform").value = $("#platform").value;
        switchTab("compose");
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      });
      card.append(body, meta, useBtn); draftsDiv.appendChild(card);
      if (d.cost_gbp) total += Number(d.cost_gbp);
    });
    if (total > 0) costNote.textContent = `Estimated cost: £${total.toFixed(4)} (configurable).`;
    updateOnboarding();
  } catch(e) {
    draftsDiv.textContent = "Error: " + e.message;
  }
});

// Schedule posts
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
  
  try {
    const res = await fetch("/posts", { method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify({ platform, content, scheduled_time }) });
    if (!res.ok) { 
      const err = await res.json(); 
      if(res.status === 402) {
        alert("Quota exceeded! Upgrade to schedule more posts.");
        switchTab("pricing");
        return;
      }
      throw new Error(err.detail || "Failed to schedule");
    }
    $("#content").value=""; $("#when").value=""; 
    refreshPosts();
    updateOnboarding();
  } catch(e) {
    alert("Error: " + e.message);
  }
});

async function refreshPosts(){
  try {
    const res = await fetch("/posts");
    const rows = await res.json();
    postsBody.innerHTML = "";
    rows.forEach(r=>{
      const tr = el("tr");
      const td = (t)=>{ const d=el("td"); d.textContent=t; return d; };
      tr.append(td(r.id), td(r.platform), td(r.status), td(r.scheduled_time ? fmtDateUK(r.scheduled_time) : ""), td(r.external_id || ""), td(r.error || ""));
      postsBody.appendChild(tr);
    });
  } catch(e) {
    console.error("Failed to refresh posts:", e);
  }
}
setInterval(refreshPosts, 4000); refreshPosts();

// Templates
$("#loadTemplates").addEventListener("click", async ()=>{
  try {
    const purpose = $("#tplPurpose").value;
    const res = await fetch(`/templates${purpose?`?purpose=${encodeURIComponent(purpose)}`:""}`);
    const data = await res.json();
    const list = $("#tplList"); list.innerHTML = "";
    data.templates.forEach(t=>{
      const card = el("div","draft");
      const title = el("div"); title.textContent = `${t.id} — ${t.title} (${t.purpose})`;
      const meta = el("div","meta"); meta.textContent = t.template;
      const useBtn = el("button"); useBtn.textContent = "Use ID";
      useBtn.addEventListener("click", ()=>{ $("#tplId").value = t.id; $("#bulkTplId").value = t.id; });
      card.append(title, meta, useBtn); list.appendChild(card);
    });
  } catch(e) {
    alert("Failed to load templates: " + e.message);
  }
});

$("#renderForm").addEventListener("submit", async (e)=>{
  e.preventDefault();
  const id = $("#tplId").value.trim();
  let vars;
  try { vars = JSON.parse($("#tplVars").value || "{}"); } catch { return alert("Variables must be valid JSON"); }
  
  try {
    const res = await fetch("/templates/render", { method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify({ template_id:id, variables:vars }) });
    if (!res.ok) { const err=await res.json(); throw new Error(err.detail || "Render failed"); }
    const out = await res.json();
    $("#renderOut").innerHTML = "";
    const card = el("div","draft");
    const body = el("div"); body.textContent = out.content;
    const meta = el("div","meta"); meta.textContent = `Score ${out.score} • ${out.hashtags.join(" ")}`;
    const useBtn = el("button"); useBtn.textContent = "Send to Compose";
    useBtn.addEventListener("click", ()=>{ $("#content").value = out.content + (out.hashtags?.length ? "\\n\\n"+out.hashtags.join(" ") : ""); switchTab("compose"); });
    card.append(body, meta, useBtn); $("#renderOut").appendChild(card);
  } catch(e) {
    alert("Error: " + e.message);
  }
});

// Bulk scheduling
$("#bulkForm").addEventListener("submit", async (e)=>{
  e.preventDefault();
  const template_id = $("#bulkTplId").value.trim();
  const count = +$("#bulkCount").value;
  const platform = $("#bulkPlatform").value;
  const start_from_next_slot = $("#bulkNextSlot").checked;
  let variables;
  try { variables = JSON.parse($("#bulkVars").value || "{}"); } catch { return alert("Variables must be valid JSON"); }
  
  try {
    const res = await fetch("/bulk/schedule_from_template", { method:"POST", headers:{ "content-type":"application/json" }, 
      body: JSON.stringify({ template_id, variables, count, platform, start_from_next_slot }) });
    const data = await res.json();
    $("#bulkOut").innerHTML = "";
    if(data.error) {
      const err = el("div","draft"); err.textContent = `Error after ${data.created.length} posts: ${data.error.detail}`;
      $("#bulkOut").appendChild(err);
    } else {
      const success = el("div","draft"); success.textContent = `✅ Successfully scheduled ${data.created.length} posts!`;
      $("#bulkOut").appendChild(success);
    }
    refreshPosts();
  } catch(e) {
    alert("Bulk schedule error: " + e.message);
  }
});

// Best time
$("#loadBestTime").addEventListener("click", async ()=>{
  try {
    const res = await fetch("/best-time");
    const data = await res.json();
    const ul = $("#bestSlots"); ul.innerHTML = "";
    data.slots.forEach(s=>{ const li=document.createElement("li"); li.textContent = s.local_label; ul.appendChild(li); });
  } catch(e) {
    alert("Failed to load best times: " + e.message);
  }
});

// Smart replies
$("#repliesForm").addEventListener("submit", async (e)=>{
  e.preventDefault();
  const context = $("#repliesContext").value.trim();
  const mood = $("#repliesMood").value;
  const count = +$("#repliesCount").value;
  
  try {
    const res = await fetch("/engagement/replies", { method:"POST", headers:{ "content-type":"application/json" }, 
      body: JSON.stringify({ context, mood, count }) });
    const data = await res.json();
    $("#repliesOut").innerHTML = "";
    data.replies.forEach(reply => {
      const card = el("div","draft");
      card.textContent = reply;
      $("#repliesOut").appendChild(card);
    });
  } catch(e) {
    alert("Failed to generate replies: " + e.message);
  }
});

// Feedback & NPS
$("#fbForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = $("#fbUser").value.trim() || null;
  const message = $("#fbMsg").value.trim();
  if (!message) return;
  
  try {
    const res = await fetch("/feedback", { method:"POST", headers:{ "content-type":"application/json" }, 
      body: JSON.stringify({ user, message }) });
    if (res.ok) { $("#fbMsg").value=""; loadFeedback(); } else { alert("Failed to send"); }
  } catch(e) {
    alert("Error sending feedback: " + e.message);
  }
});

async function loadFeedback(){
  try {
    const res = await fetch("/feedback"); const data = await res.json();
    const ul = $("#fbList"); ul.innerHTML = "";
    data.items.slice(0, 10).forEach(i=>{ 
      const li=document.createElement("div"); 
      li.innerHTML = `<strong>${i.user || "anon"}</strong> (${fmtDateUK(i.created_at)})<br>${i.message}`;
      li.style.cssText = "margin:8px 0; padding:8px; border:1px solid var(--border); border-radius:4px; background:var(--bg2)";
      ul.appendChild(li); 
    });
  } catch(e) {
    console.error("Failed to load feedback:", e);
  }
}
loadFeedback();

// NPS form
$("#npsScore").addEventListener("input", (e) => {
  $("#npsValue").textContent = e.target.value;
});

$("#npsForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const score = +$("#npsScore").value;
  const comment = $("#npsComment").value.trim() || null;
  
  try {
    const res = await fetch("/nps/submit", { method:"POST", headers:{ "content-type":"application/json" }, 
      body: JSON.stringify({ score, comment }) });
    if (res.ok) { 
      $("#npsComment").value=""; 
      alert("Thanks for your rating!"); 
    } else { 
      alert("Failed to submit rating"); 
    }
  } catch(e) {
    alert("Error submitting rating: " + e.message);
  }
});

// Lead capture
$("#leadForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = $("#leadName").value.trim() || null;
  const email = $("#leadEmail").value.trim();
  const message = $("#leadMsg").value.trim() || null;
  
  try {
    const res = await fetch("/leads/capture", { method:"POST", headers:{ "content-type":"application/json" }, 
      body: JSON.stringify({ name, email, message }) });
    if (res.ok) { 
      $("#leadName").value=""; $("#leadEmail").value=""; $("#leadMsg").value=""; 
      alert("Thanks for joining our newsletter!"); 
    } else { 
      alert("Failed to capture lead"); 
    }
  } catch(e) {
    alert("Error capturing lead: " + e.message);
  }
});

// Pricing & plan status
async function loadPlanStatus() {
  try {
    const res = await fetch("/me");
    const data = await res.json();
    const status = $("#planStatus");
    status.innerHTML = `
      <div>
        <div class="plan-name">${data.plan.toUpperCase()} Plan</div>
        <div class="usage-info">${data.usage_this_month}/${data.limit} posts this month</div>
      </div>
      <div class="usage-info">
        ${data.limit - data.usage_this_month} remaining
      </div>
    `;
  } catch(e) {
    console.error("Failed to load plan status:", e);
  }
}

async function loadPricing(){
  try {
    const res = await fetch("/plans"); const data = await res.json();
    const box = $("#pricing"); box.innerHTML = "";
    const wrap = el("div"); wrap.style.display="grid"; wrap.style.gap="12px"; wrap.style.gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))";
    Object.entries(data.plans).forEach(([id, plan]) => {
      const card = el("div","draft");
      card.style.textAlign = "center";
      const title = el("h3"); title.textContent = `${plan.name}`;
      const price = el("div"); price.textContent = `£${plan.gbp_per_month}/month`;
      price.style.cssText = "font-size:24px; color:var(--gold); margin:8px 0";
      const limit = el("div"); limit.textContent = `${plan.max_scheduled_per_month} posts/month`;
      limit.style.cssText = "color:var(--muted); margin:4px 0";
      const features = el("ul"); features.style.cssText = "text-align:left; margin:12px 0";
      if(plan.allow_openai) {
        const li = el("li"); li.textContent = "✓ OpenAI Integration"; features.appendChild(li);
      } else {
        const li = el("li"); li.textContent = "○ Stub Generator Only"; features.appendChild(li);
      }
      if(id !== "free") {
        const upgradeBtn = el("button"); upgradeBtn.textContent = "Upgrade";
        upgradeBtn.addEventListener("click", async () => {
          try {
            await fetch("/billing/checkout", { method:"POST", headers:{ "content-type":"application/json" }, 
              body: JSON.stringify({ target_plan: id }) });
            alert(`Upgraded to ${plan.name}! (Demo - no real billing)`);
            loadPlanStatus();
          } catch(e) {
            alert("Upgrade failed: " + e.message);
          }
        });
        card.appendChild(upgradeBtn);
      }
      card.append(title, price, limit, features);
      wrap.appendChild(card);
    });
    box.appendChild(wrap);
    loadPlanStatus();
  } catch(e) {
    console.error("Failed to load pricing:", e);
  }
}
loadPricing();

// Referrals
$("#createReferral").addEventListener("click", async () => {
  try {
    const res = await fetch("/referrals/create", { method:"POST" });
    const data = await res.json();
    $("#refCode").textContent = data.code;
    $("#referralCode").style.display = "block";
    $("#createReferral").textContent = "Refresh Code";
  } catch(e) {
    alert("Failed to create referral: " + e.message);
  }
});

// A/B Flags
$("#flagForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const key = $("#flagKey").value.trim();
  const enabled = $("#flagEnabled").checked;
  
  try {
    const res = await fetch(`/flags/set?key=${key}&enabled=${enabled}`, { method:"POST" });
    const data = await res.json();
    $("#flagsOut").innerHTML = "";
    Object.entries(data.flags).forEach(([k, v]) => {
      const flag = el("div"); flag.textContent = `${k}: ${v ? 'ON' : 'OFF'}`;
      flag.style.cssText = `color: ${v ? 'var(--success)' : 'var(--muted)'}; margin:4px 0`;
      $("#flagsOut").appendChild(flag);
    });
  } catch(e) {
    alert("Failed to set flag: " + e.message);
  }
});

// Analytics
$("#loadAnalytics").addEventListener("click", async () => {
  try {
    const res = await fetch("/analytics/kpi");
    const data = await res.json();
    const out = $("#analyticsOut"); out.innerHTML = "";
    
    const cards = [
      { label: "Total Posts", value: data.total_posts },
      { label: "Published", value: data.by_status.published || 0 },
      { label: "Scheduled", value: data.by_status.scheduled || 0 },
      { label: "This Month", value: data.current_month.usage },
      { label: "Remaining", value: data.current_month.remaining }
    ];
    
    cards.forEach(card => {
      const kpi = el("div","kpi-card");
      kpi.innerHTML = `<div class="kpi-value">${card.value}</div><div class="kpi-label">${card.label}</div>`;
      out.appendChild(kpi);
    });
    
    // Monthly analytics
    const monthRes = await fetch("/analytics/posts_by_month");
    const monthData = await monthRes.json();
    const monthOut = $("#monthlyOut"); monthOut.innerHTML = "";
    Object.entries(monthData.by_month).slice(-6).forEach(([month, stats]) => {
      const card = el("div","kpi-card");
      card.innerHTML = `<div class="kpi-value">${stats.total}</div><div class="kpi-label">${month}</div>`;
      monthOut.appendChild(card);
    });
  } catch(e) {
    alert("Failed to load analytics: " + e.message);
  }
});

// Initialize
updateOnboarding();
$("#loadAnalytics").click();