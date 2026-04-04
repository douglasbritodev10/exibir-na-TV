import { db } from "./firebase-config.js";
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let cS, cV;
const container = document.getElementById('scrollContainer');

// 1. RELÓGIO EM TEMPO REAL
setInterval(() => {
    document.getElementById('relogio').innerText = new Date().toLocaleTimeString('pt-BR');
}, 1000);

// 2. BUSCA DE DADOS (REAL-TIME COM ONSNAPSHOT)
function iniciarMonitoramento() {
    onSnapshot(collection(db, "expedicoes"), (snap) => {
        const agora = new Date();
        const amanha = new Date();
        amanha.setDate(agora.getDate() + 1);

        const strHoje = agora.toISOString().split('T')[0];
        const strAmanha = amanha.toISOString().split('T')[0];

        // Filtra Hoje e Amanhã + Ordenação por Código (Expedição)
        let dados = snap.docs
            .map(d => d.data())
            .filter(d => d.data === strHoje || d.data === strAmanha)
            .sort((a, b) => Number(a.codigo) - Number(b.codigo));

        renderizarTabela(dados);
        atualizarGraficos(dados);
    });
}

function renderizarTabela(lista) {
    const corpo = document.getElementById('corpoTabela');
    corpo.innerHTML = "";

    lista.forEach(d => {
        const stClass = d.status.toUpperCase().replace(/ /g, "_").replace(/\//g, "_");
        const dataFormatada = d.data.split('-').slice(1).reverse().join('/'); // Ex: 04/04

        corpo.innerHTML += `
            <div class="row">
                <div style="font-weight:bold; color:#888">${dataFormatada}</div>
                <div style="color: #fff; font-weight: bold;">${d.codigo}</div>
                <div style="color: #ffd700;">${d.placa}</div>
                <div style="font-size: 13px;">${d.destino.substring(0, 20)}</div>
                <div style="font-weight:bold; text-align:center">${d.box}</div>
                <div><span class="badge st-${stClass}">${d.status}</span></div>
            </div>
        `;
    });

    const veiculosUnicos = new Set(lista.map(i => i.placa + i.data)).size;
    document.getElementById('kpiVeiculos').innerText = veiculosUnicos;
    document.getElementById('kpiExp').innerText = lista.length;
}

// 3. EFEITO DE ROLAGEM AUTOMÁTICA (AUTO SCROLL)
let scrollPos = 0;
let direcao = 1; // 1 desce, -1 sobe

function autoScroll() {
    if (container.scrollHeight > container.clientHeight) {
        scrollPos += direcao * 0.5; // Velocidade lenta para TV
        container.scrollTop = scrollPos;

        if (scrollPos >= (container.scrollHeight - container.clientHeight)) {
            setTimeout(() => { direcao = -1; }, 2000); // Espera 2s no fim
        } else if (scrollPos <= 0) {
            setTimeout(() => { direcao = 1; }, 2000); // Espera 2s no topo
        }
    }
    requestAnimationFrame(autoScroll);
}

// 4. GRÁFICOS (REUTILIZANDO SUA LÓGICA CORES)
function atualizarGraficos(lista) {
    const sM = {}, vM = {};
    lista.forEach(d => {
        sM[d.status] = (sM[d.status] || 0) + 1;
        vM[d.tipo] = (vM[d.tipo] || 0) + 1;
    });

    if(cS) cS.destroy();
    cS = new Chart(document.getElementById('chartStatus'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(sM),
            datasets: [{ 
                data: Object.values(sM), 
                backgroundColor: ['#2e7d32', '#ef6c00', '#1565c0', '#6a1b9a', '#9c27b0'] 
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });

    if(cV) cV.destroy();
    cV = new Chart(document.getElementById('chartVeiculos'), {
        type: 'bar',
        data: {
            labels: Object.keys(vM),
            datasets: [{ 
                label: 'Qtd', 
                data: Object.values(vM), 
                backgroundColor: '#b71c1c' 
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            scales: { y: { beginAtZero: true, ticks: { color: '#fff' } }, x: { ticks: { color: '#fff' } } },
            plugins: { legend: { display: false } }
        }
    });
}

// Inicialização
iniciarMonitoramento();
autoScroll();
