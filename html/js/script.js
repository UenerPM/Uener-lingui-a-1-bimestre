/* script.js
   Utilitários compartilhados por páginas (verificar sessão, criar pedido, criar pagamento wrapper)
*/

async function verificarSessao() {
  try {
    const r = await fetch('/api/me', { credentials: 'include' });
    if (!r.ok) return null;
    const j = await r.json();
    return (j && j.success) ? j.user || j.data || j : null;
  } catch (err) {
    console.error('verificarSessao erro', err);
    return null;
  }
}

async function criarPagamento(payload) {
  try {
    const r = await fetch('/api/pagamentos', {
      method: 'POST', headers: { 'Content-Type':'application/json' }, credentials: 'include', body: JSON.stringify(payload)
    });
    const j = await r.json().catch(()=>({success:false,message:'Resposta inválida do servidor'}));
    return j;
  } catch (err) {
    console.error('criarPagamento erro', err);
    return { success: false, message: err.message };
  }
}
