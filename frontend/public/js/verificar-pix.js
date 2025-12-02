function log(msg) {
    const resultado = document.getElementById('resultado');
    resultado.textContent += msg + '\n';
    resultado.scrollTop = resultado.scrollHeight;
}

function showTesting(show) {
    document.getElementById('testing').style.display = show ? 'block' : 'none';
    document.getElementById('resultado').style.display = !show ? 'block' : 'none';
}

function showSuccess(msg) {
    const success = document.getElementById('success');
    success.textContent = msg;
    success.classList.add('show');
    setTimeout(() => { success.classList.remove('show'); }, 3000);
}

async function iniciaTeste() {
    document.getElementById('resultado').textContent = '';
    showTesting(true);

    try {
        log('═══════════════════════════════════════════════════════');
        log('TESTE DE PIX - Verificação em Tempo Real');
        log('═══════════════════════════════════════════════════════\n');

        // Teste 1: Backend
        log('📡 Testando backend...');
        const respBackend = await fetch('/api/pix/generate?amount=42.00');
        if (!respBackend.ok) throw new Error(`HTTP ${respBackend.status}`);

        const dataBackend = await respBackend.json();
        log(`✓ Backend respondeu: CRC=${dataBackend.crc}`);
        log(`  Tamanho: ${dataBackend.tamanho} bytes`);
        log(`  Validado: ${dataBackend.validado ? 'SIM' : 'NÃO'}\n`);

        // Teste 2: Parse do payload
        log('📊 Analisando payload...');
        function parsePayload(payload) {
            const result = [];
            let i = 0;
            while (i < payload.length) {
                const tag = payload.substring(i, i + 2);
                const len = parseInt(payload.substring(i + 2, i + 4), 10);
                const value = payload.substring(i + 4, i + 4 + len);
                result.push({ tag, len, value });
                i += 4 + len;
            }
            return result;
        }

        const tags = parsePayload(dataBackend.payload);
        tags.forEach(t => {
            log(`  Tag ${t.tag}: '${t.value}' (len=${t.len})`);
        });

        log('\n✅ Teste completado com sucesso!');
        log('\nProximas instruções:');
        log('1. Limpe o cache do navegador (Ctrl+Shift+Delete)');
        log('2. Acesse /pagamento.html');
        log('3. Copie o payload gerado');
        log('4. Compare com o backend acima\n');

        showTesting(false);
        showSuccess('✅ Teste completo! Agora limpe o cache e teste no navegador.');

    } catch (err) {
        log(`❌ ERRO: ${err.message}`);
        showTesting(false);
        showSuccess('❌ Erro no teste. Verifique se o servidor está rodando.');
    }
}

function limpaCacheERecarrega() {
    showSuccess('🧹 Abrindo instruções de limpeza de cache...');
    alert(`Para limpar o cache manualmente:

1. Pressione: Ctrl + Shift + Delete (Windows/Linux) ou Cmd + Shift + Delete (Mac)
2. Selecione "Tudo" no período
3. Marque: ✓ Cookies e dados de sites
4. Marque: ✓ Arquivos em cache
5. Clique: "Limpar dados"
6. Recarregue a página: F5

Você será redirecionado para a página principal em 3 segundos...`);

    setTimeout(() => {
        window.location.href = '/index.html';
    }, 5000);
}

// Limpar cache ao carregar
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(reg => reg.unregister());
    });
}
