function output(text) {
    const el = document.getElementById('output');
    el.textContent += text + '\n';
    el.scrollTop = el.scrollHeight;
}

function clearOutput() {
    document.getElementById('output').textContent = '';
}

function crc16Ccitt(str) {
    let crc = 0xFFFF;
    for (let i = 0; i < str.length; i++) {
        crc ^= str.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if (crc & 0x8000) {
                crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
            } else {
                crc = (crc << 1) & 0xFFFF;
            }
        }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

function removerDiacriticos(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function tag(id, value) {
    const v = String(value || '');
    const len = String(v.length).padStart(2, '0');
    return id + len + v;
}

function construirPayloadPixLocal(valor) {
    const pixKey = 'uperesmarcon@gmail.com';
    const merchantName = removerDiacriticos('UENER LINGUÇO').substring(0, 25);
    const merchantCity = removerDiacriticos('CAMPO MOURAO').substring(0, 15);
    const txId = 'UEN' + Date.now().toString().slice(-8);

    let payload = '';
    payload += tag('00', '01');
    const mai = tag('00', 'BR.GOV.BCB.PIX') + tag('01', pixKey);
    payload += tag('26', mai);
    payload += tag('52', '0000');
    payload += tag('53', '986');
    payload += tag('54', valor.toFixed(2));
    payload += tag('58', 'BR');
    payload += tag('59', merchantName);
    payload += tag('60', merchantCity);
    const additionalData = tag('05', txId);
    payload += tag('62', additionalData);
    const payloadComCrc = payload + '6304';
    const crcValue = crc16Ccitt(payloadComCrc);
    payload += tag('63', crcValue);
    return payload;
}

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

async function testFrontendPix() {
    clearOutput();
    output('═══════════════════════════════════════════════════');
    output('TESTE FRONTEND PIX LOCAL');
    output('═══════════════════════════════════════════════════\n');

    try {
        const valor = 520.00;
        const payload = construirPayloadPixLocal(valor);
        output(`✓ Payload gerado (valor: R$ ${valor.toFixed(2)})`);
        output(`Tamanho: ${payload.length} caracteres\n`);
        output(`Payload completo:\n${payload}\n`);
        const tags = parsePayload(payload);
        output('Tags encontradas:');
        tags.forEach(t => { output(`  Tag ${t.tag} (len=${t.len}): '${t.value}'`); });
        const guiTag = tags.find(t => t.tag === '26');
        if (guiTag && guiTag.value.includes('BR.GOV.BCB.PIX')) { output('\n✓ GUI está em MAIÚSCULO (correto)'); }
        const valorTag = tags.find(t => t.tag === '54');
        if (valorTag && valorTag.value === '520.00') { output('✓ Valor está correto: 520.00'); } else { output(`✗ Valor está errado: ${valorTag?.value || 'NÃO ENCONTRADO'}`); }
    } catch (err) { output(`✗ ERRO: ${err.message}`); }
}

async function testBackendPix() {
    clearOutput();
    output('═══════════════════════════════════════════════════');
    output('TESTE BACKEND PIX');
    output('═══════════════════════════════════════════════════\n');
    try {
        const resp = await fetch('/api/pix/generate?amount=520.00');
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        output(`✓ Backend respondeu com sucesso`);
        output(`Payload: ${data.payload.substring(0, 50)}...`);
        output(`CRC: ${data.crc}`);
        output(`Validado: ${data.validado ? 'SIM ✓' : 'NÃO ✗'}`);
        output(`Tamanho: ${data.tamanho} caracteres\n`);
        const tags = parsePayload(data.payload);
        output('Tags encontradas:');
        tags.forEach(t => { output(`  Tag ${t.tag} (len=${t.len}): '${t.value}'`); });
    } catch (err) { output(`✗ ERRO: ${err.message}\n`); output('Certifique-se que o servidor está rodando em http://localhost:3000'); }
}

async function comparePix() {
    clearOutput();
    output('═══════════════════════════════════════════════════');
    output('COMPARAÇÃO FRONTEND vs BACKEND');
    output('═══════════════════════════════════════════════════\n');
    try {
        const payloadFrontend = construirPayloadPixLocal(520.00);
        const resp = await fetch('/api/pix/generate?amount=520.00');
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        const payloadBackend = data.payload;
        output(`Frontend tamanho: ${payloadFrontend.length}`);
        output(`Backend tamanho:  ${payloadBackend.length}\n`);
        const tagsFrontend = parsePayload(payloadFrontend);
        const tagsBackend = parsePayload(payloadBackend);
        output('FRONTEND tags:'); tagsFrontend.forEach(t => { output(`  ${t.tag}: '${t.value}'`); });
        output('\nBACKEND tags:'); tagsBackend.forEach(t => { output(`  ${t.tag}: '${t.value}'`); });
        output('\n═══════════════════════════════════════════════════'); output('ANÁLISE'); output('═══════════════════════════════════════════════════\n');
        if (payloadFrontend === payloadBackend) { output('✓ Payloads são IDÊNTICOS!'); } else {
            output('⚠ Payloads diferem:');
            for (let i = 0; i < Math.min(tagsFrontend.length, tagsBackend.length); i++) {
                const tf = tagsFrontend[i]; const tb = tagsBackend[i];
                if (tf.tag !== tb.tag || tf.value !== tb.value) {
                    output(`  Tag ${tf.tag}: Frontend='${tf.value}' vs Backend='${tb.value}'`);
                }
            }
        }
    } catch (err) { output(`✗ ERRO: ${err.message}`); }
}

window.addEventListener('load', () => { output('Página carregada! Clique em um botão para testar.'); });
