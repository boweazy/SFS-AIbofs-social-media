async function generate(e){
  e.preventDefault();
  const form = e.target;
  const data = {
    topic: form.topic.value.trim(),
    tone: form.tone.value,
    platform: form.platform.value,
    count: Math.max(1, Math.min(10, parseInt(form.count.value || "3", 10))),
    niche: form.niche.value.trim() || "SMB owners"
  };

  const res = await fetch("/api/generate_posts", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify(data)
  });

  const out = document.getElementById("results");
  out.innerHTML = "";

  if(!res.ok){
    const err = await res.text();
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<h3>Error</h3><pre>${err}</pre>`;
    out.appendChild(card);
    return;
  }

  const json = await res.json();
  (json.posts || []).forEach((p, idx) => {
    const card = document.createElement("div");
    card.className = "card";
    const tags = (p.hashtags || []).join(" ");
    card.innerHTML = `
      <h3>Post ${idx+1}</h3>
      <p style="white-space:pre-wrap">${p.text}</p>
      <p><strong>Suggested image:</strong> ${p.suggested_image}</p>
      <p><strong>Alt text:</strong> ${p.alt_text}</p>
      <p><strong>Hashtags:</strong> ${tags}</p>
      <button class="btn btn-outline" data-copy="${p.text.replace(/"/g,'&quot;')}">Copy Text</button>
    `;
    out.appendChild(card);
  });

  // copy buttons
  out.querySelectorAll("button[data-copy]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const text = btn.getAttribute("data-copy");
      navigator.clipboard.writeText(text);
      btn.textContent = "Copied!";
      setTimeout(()=>btn.textContent="Copy Text", 1000);
    });
  });
}

window.addEventListener("DOMContentLoaded", ()=>{
  const form = document.getElementById("genForm");
  form.addEventListener("submit", generate);
});