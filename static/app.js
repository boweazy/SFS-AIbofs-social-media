/* Why: centralize helpers & telemetry to extend later without code churn. */
window.SF = {
  cta: (label, url) => ({ label, url, style: 'gold' }),
  track: (ev, p) => console.log('sf_event', ev, p)
};

(function(){
  const qs = s => document.querySelector(s);
  const backdrop = qs('#chat-backdrop');
  const modal = qs('#chat-modal');
  const openBtn = qs('.chat-launch');
  const closeBtn = qs('#chat-close');
  const form = qs('#chat-form');
  const input = qs('#chat-input');
  const list = qs('#chat-list');
  const sendBtn = qs('#chat-send');
  const typing = qs('#chat-typing');

  let lastFocus = null;

  function openModal(){
    window.SF.track('chat_open');
    lastFocus = document.activeElement;
    backdrop.style.display = 'flex';
    setTimeout(()=> input.focus(), 0);
  }
  function closeModal(){
    backdrop.style.display = 'none';
    if (lastFocus) lastFocus.focus();
  }

  // Focus trap for a11y
  backdrop.addEventListener('keydown', (e)=>{
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Tab'){
      const focusables = modal.querySelectorAll('button, [href], input, textarea, [tabindex]:not([tabindex="-1"])');
      const f = Array.from(focusables);
      if (!f.length) return;
      const first = f[0], last = f[f.length-1];
      if (e.shiftKey && document.activeElement === first){ last.focus(); e.preventDefault(); }
      else if (!e.shiftKey && document.activeElement === last){ first.focus(); e.preventDefault(); }
    }
  });

  openBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', (e)=>{ if (e.target === backdrop) closeModal(); });

  function pushBubble(role, text){
    const div = document.createElement('div');
    div.className = `chat-bubble ${role}`;
    div.textContent = text;
    list.appendChild(div);
    list.scrollTop = list.scrollHeight;
  }

  async function sendMessage(text){
    window.SF.track('chat_send');
    typing.hidden = false;
    sendBtn.disabled = true;

    pushBubble('user', text);
    input.value = '';

    try{
      const res = await fetch('/api/chat', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ messages: [
          { role:'user', content: text }
        ]})
      });

      if (!res.ok) {
        const err = await res.json().catch(()=>({}));
        throw new Error(err?.error || 'Network error');
      }

      const data = await res.json();
      pushBubble('bot', data.answer || '…');
    }catch(err){
      pushBubble('bot', 'Sorry, I ran into an issue. Please try again.');
      console.error(err);
    }finally{
      typing.hidden = true;
      sendBtn.disabled = false;
      input.focus();
    }
  }

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    sendMessage(text);
  });
})();