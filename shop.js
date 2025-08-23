const YEAR = document.querySelector('#year'); if (YEAR) YEAR.textContent=new Date().getFullYear();
const products = [
  { id:'tpl-basic',  name:'Post Templates — Basic',  price:1900,  desc:'30 ready-to-use hooks, hashtags, CTAs.'},
  { id:'tpl-pro',    name:'Post Templates — Pro',    price:4900,  desc:'90 templates + best-time presets.'},
  { id:'addon-crew', name:'Team Seats (x2)',         price:9900,  desc:'Add two collaborators.'}
];
const gbp = p=>`£${(p/100).toFixed(2)}`;
const cart = JSON.parse(localStorage.getItem('cart')||'[]');
const $ = s=>document.querySelector(s);

function renderProducts(){
  $('#products').innerHTML = products.map(p=>`
    <div class="card"><h3>${p.name}</h3><p>${p.desc}</p><strong class="price">${gbp(p.price)}</strong>
    <button class="btn small glow" data-add="${p.id}">Add</button></div>`).join('');
}

function renderCart(){
  const list=$('#cartList'); if(!list) return;
  list.innerHTML = cart.length? cart.map(i=>`<li>${i.name} <em>${gbp(i.price)}</em></li>`).join('') : '<li>Empty</li>';
  localStorage.setItem('cart', JSON.stringify(cart));
}

document.addEventListener('click', e=>{
  const add = e.target.closest('[data-add]'); if (!add) return;
  const item = products.find(p=>p.id===add.dataset.add); if (!item) return;
  cart.push(item); renderCart();
});

$('#clearCart')?.addEventListener('click', ()=>{ cart.length=0; renderCart(); });
$('#checkout')?.addEventListener('click', async ()=>{
  alert('Stripe checkout stub — replace with real Checkout link per item.');
});

renderProducts(); renderCart();