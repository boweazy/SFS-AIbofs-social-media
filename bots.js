const $ = s=>document.querySelector(s);
const YEAR = $('#year'); if (YEAR) YEAR.textContent = new Date().getFullYear();

$('#genReplies')?.addEventListener('click', async ()=>{
  const context = ($('#thread').value||'').trim();
  if (!context) return;
  
  const list = $('#replies');
  list.innerHTML = '<li>Generating smart replies...</li>';
  
  // Simulate smart reply generation
  const replies = [
    `Thanks for sharing this! ${context.slice(0,50)}... What's your take on the implementation side?`,
    `Great point about ${context.split(' ')[0]}. Have you tried combining it with automation tools?`,
    `This reminds me of similar challenges in scaling. What metrics are you tracking?`
  ];
  
  setTimeout(() => {
    list.innerHTML = replies.map(r => `<li class="reply">${r}</li>`).join('');
  }, 1000);
});

$('#fetchTimes')?.addEventListener('click', async ()=>{
  const list = $('#times');
  list.innerHTML = '<li>Fetching optimal posting times...</li>';
  
  // Mock best-time data
  const times = [
    'Tuesday 9:00 AM - High engagement (B2B)',
    'Wednesday 2:00 PM - Peak activity', 
    'Thursday 11:00 AM - Professional audience',
    'Friday 4:00 PM - End-of-week shares'
  ];
  
  setTimeout(() => {
    list.innerHTML = times.map(t => `<li class="time-slot">${t}</li>`).join('');
  }, 800);
});