const Y = document.querySelector('#year'); if (Y) Y.textContent = new Date().getFullYear();
const form = document.getElementById('book-form');
const statusEl = document.getElementById('book-status');

function mkICS({name,email,date,time}){
  const start = new Date(`${date}T${time}:00`);
  const end = new Date(start.getTime()+30*60e3);
  const fmt = d=>d.toISOString().replace(/[-:]/g,'').split('.')[0]+'Z';
  return [
    'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//SmartFlow//EN',
    'BEGIN:VEVENT',
    `UID:${(crypto && crypto.randomUUID)? crypto.randomUUID(): Date.now()+'@smartflow'}`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,`DTEND:${fmt(end)}`,
    'SUMMARY:SmartFlow Discovery Call',
    `DESCRIPTION:Booked by ${name} (${email})`,
    'END:VEVENT','END:VCALENDAR'
  ].join('\r\n');
}

document.getElementById('icsBtn')?.addEventListener('click', ()=>{
  const fd = new FormData(form);
  const ics = mkICS(Object.fromEntries(fd.entries()));
  const blob = new Blob([ics],{type:'text/calendar'});
  const a = Object.assign(document.createElement('a'),{href:URL.createObjectURL(blob),download:'smartflow_booking.ics'});
  a.click(); URL.revokeObjectURL(a.href);
});

form?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const fd = new FormData(form);
  try{
    const res = await fetch(form.action,{method:'POST',body:fd,headers:{'Accept':'application/json'}});
    if (res.ok){ form.reset(); statusEl.textContent = '✅ Request sent — check your email.'; }
    else throw new Error('send-failed');
  }catch{ 
    statusEl.textContent='⚠️ Offline: we saved your request to Inbox.';
    const saved=JSON.parse(localStorage.getItem('inbox')||'[]');
    saved.push({ ...Object.fromEntries(fd.entries()), status:'pending', date:new Date().toISOString() });
    localStorage.setItem('inbox', JSON.stringify(saved));
  }
});