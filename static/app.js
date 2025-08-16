const $ = (sel) => document.querySelector(sel);
const el = (tag, cls) => { const n = document.createElement(tag); if (cls) n.className = cls; return n; };

const postsBody = $("#postsBody");
const draftsDiv = $("#drafts");
const yearSpan = $("#year");
yearSpan.textContent = new Date().getFullYear();

const fmtDateUK = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "Europe/London",
    year: "numeric", month: "short", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false
  });
};

// Ready for future GBP pricing
const fmtGBP = (n) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);

$("#saveToken").addEventListener("click", async () => {
  const platform = $("#platform").value;
  const token = $("#token").value.trim();
  if (!token) { alert("Please enter a token (stub)"); return; }
  const res = await fetch("/auth/manual", {
    method: "POST",
    headers: {"content-type":"application/json"},
    body: JSON.stringify({ platform, access_token: token })
  });
  alert(res.ok ? "Token saved" : "Failed to save token");
});

$("#genForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  draftsDiv.textContent = "Generating…";
  const topic = $("#topic").value.trim();
  const tone = $("#tone").value;
  const count = Number($("#count").value || 3);
  const res = await fetch("/generate", {
    method: "POST",
    headers: {"content-type":"application/json"},
    body: JSON.stringify({ topic, tone, count })
  });
  const drafts = await res.json();
  draftsDiv.innerHTML = "";
  drafts.forEach((d) => {
    const card = el("div", "draft");
    const body = el("div"); body.textContent = d.content;
    const meta = el("div", "meta");
    const score = el("span"); score.textContent = `Score: ${d.score}`;
    meta.appendChild(score);
    d.hashtags.forEach(t => { const tag = el("span", "tag"); tag.textContent = t; meta.appendChild(tag); });
    const useBtn = el("button"); useBtn.textContent = "Use this";
    useBtn.addEventListener("click", () => {
      $("#content").value = d.content + (d.hashtags.length ? "\n\n" + d.hashtags.join(" ") : "");
      $("#schedPlatform").value = $("#platform").value;
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    });
    card.append(body, meta, useBtn);
    draftsDiv.appendChild(card);
  });
});

$("#scheduleForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const platform = $("#schedPlatform").value;
  const content = $("#content").value.trim();
  const whenRaw = $("#when").value; // local picker value (no timezone)
  let scheduled_time = null;
  if (whenRaw) {
    // Convert local picker value to UTC ISO
    const dtLocal = new Date(whenRaw);
    scheduled_time = new Date(dtLocal.getTime() - dtLocal.getTimezoneOffset() * 60000).toISOString();
  }
  const res = await fetch("/posts", {
    method: "POST",
    headers: {"content-type":"application/json"},
    body: JSON.stringify({ platform, content, scheduled_time })
  });
  if (!res.ok) {
    const err = await res.json();
    alert(err.detail || "Failed to schedule");
    return;
  }
  $("#content").value = "";
  $("#when").value = "";
  refreshPosts();
});

async function refreshPosts(){
  const res = await fetch("/posts");
  const rows = await res.json();
  postsBody.innerHTML = "";
  rows.forEach(r => {
    const tr = el("tr");
    const td = (t)=>{ const d=el("td"); d.textContent=t; return d; };
    tr.append(
      td(r.id),
      td(r.platform),
      td(r.status),
      td(r.scheduled_time ? fmtDateUK(r.scheduled_time) : ""),
      td(r.external_id || ""),
      td(r.error || "")
    );
    postsBody.appendChild(tr);
  });
}

setInterval(refreshPosts, 4000);
refreshPosts();