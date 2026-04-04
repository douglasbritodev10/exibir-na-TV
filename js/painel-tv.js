import { db } from "./firebase-config.js";
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let cS, cV;
const container = document.getElementById('scrollContainer');

const CORES = { 
    'CARRETA': '#1b5e20', 
    'TRUCK': '#03a9f4', 
    'CARRO 3/4': '#7b1fa2', 
    'TOCO': '#fbc02d',
    'FINALIZADO': '#1b5e20', 
    'EM SEPARAÇÃO': '#e65100', 
    'CRIADO': '#0d47a1',
    'EM CARREGAMENTO': '#95e9ae', 
    'CARREGADO/EM VIAGEM': '#d123a3', 
    'CONFERÊNCIA FINALIZADA': '#4a148c'
};

setInterval(() => {
    const relogio = document.getElementById('relogio');
    if (relogio) relogio.innerText = new Date().toLocaleTimeString('pt-BR');
}, 1000);

onSnapshot(collection(db, "expedicoes"), (snap) => {
    const hoje = new Date().toISOString().split('T')[0];
    const amanhaDate = new Date();
    amanhaDate.setDate(amanhaDate.getDate() + 1);
    const amanha = amanhaDate.toISOString().split('T')[0];

    let dados = snap.docs
        .map(d => d.data())
        .filter(d => d.data === hoje || d.data === amanha)
        .sort((a, b) => Number(a.codigo) - Number(b.codigo)); 

    renderizarTabela(dados);
    atualizarGraficos(dados);
});

function renderizarTabela(lista) {
    const corpo = document.getElementById('corpoTabela');
    if (!corpo) return;
    corpo.innerHTML = "";

    lista.forEach(d => {
        const statusLimpo = d.status ? d.status.toUpperCase().replace(/ /g, "_").replace(/\//g, "_") : "";
        const dataShow = d.data ? d.data.split('-').reverse().slice(0, 2).join('/') : "";
        const corVeiculo = (d.tipo && CORES[d.tipo.toUpperCase()]) ? CORES[d.tipo.toUpperCase()] : '#444';

        corpo.innerHTML += `
            <div class="row">
                <div style="color:#999">${dataShow}</div>
                <div style="color:#b71c1c">${d.codigo}</div>
                <div style="color:#333">${d.placa}</div>
                <div style="color:${corVeiculo}">${d.tipo}</div>
                <div style="font-size: 11px; padding: 0 5px;">${d.destino}</div>
                <div style="background: #eee; border-radius: 4px; width: 40px; margin: 0 auto;">${d.box}</div>
                <div><span class="badge st-${statusLimpo}">${d.status}</span></div>
            </div>
        `;
    });

    const veiculosUnicos = new Set(lista.map(i => i.placa + "_" + i.data)).size;
    document.getElementById('kpiExpedicoes').innerText = lista.length;
    document.getElementById('txtKpiResumo').innerText = `VEÍCULOS: ${veiculosUnicos}`;
}

function atualizarGraficos(lista) {
    const sM = {}, vM = {};
    lista.forEach(d => {
        if (d.status) sM[d.status] = (sM[d.status] || 0) + 1;
        if (d.tipo) vM[d.tipo] = (vM[d.tipo] || 0) + 1;
    });

    // --- GRÁFICO DE STATUS (Pizza com porcentagem externa) ---
    if(cS) cS.destroy();
    const ctxStatus = document.getElementById('chartStatus');
    if (ctxStatus) {
        cS = new Chart(ctxStatus, {
            type: 'pie',
            data: {
                labels: Object.keys(sM),
                datasets: [{ 
                    data: Object.values(sM), 
                    backgroundColor: Object.keys(sM).map(k => CORES[k.toUpperCase()] || '#ccc'),
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                layout: { padding: 30 }, // Espaço para as labels externas
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11, weight: 'bold' } } },
                    datalabels: {
                        anchor: 'end',
                        align: 'end',
                        offset: 10,
                        color: '#444',
                        font: { weight: 'bold', size: 12 },
                        formatter: (val, ctx) => {
                            let sum = ctx.dataset.data.reduce((a, b) => a + b, 0);
                            let p = (val * 100 / sum).toFixed(1) + "%";
                            return `${val} (${p})`; // Ex: 5 (25.0%)
                        }
                    }
                }
            },
            plugins: [ChartDataLabels]
        });
    }

    // --- GRÁFICO DE VEÍCULOS (Barras com números internos) ---
    if(cV) cV.destroy();
    const ctxVeic = document.getElementById('chartVeiculos');
    if (ctxVeic) {
        cV = new Chart(ctxVeic, {
            type: 'bar',
            data: {
                labels: Object.keys(vM),
                datasets: [{ 
                    data: Object.values(vM), 
                    backgroundColor: Object.keys(vM).map(k => CORES[k.toUpperCase()] || '#b71c1c') 
                }]
            },
            options: { 
                responsive: true, maintainAspectRatio: false,
                scales: { 
                    y: { beginAtZero: true, display: false }, // Esconde o eixo Y para ganhar espaço
                    x: { ticks: { font: { weight: 'bold', size: 11 } } }
                },
                plugins: { 
                    legend: { display: false },
                    datalabels: { 
                        anchor: 'center', // Coloca no meio da barra
                        align: 'center', 
                        color: '#fff',   // Branco para contraste nas cores fortes
                        font: { weight: 'bold', size: 16 },
                        formatter: (val) => val
                    }
                }
            },
            plugins: [ChartDataLabels]
        });
    }
}

// Auto-Scroll
let scrollPos = 0;
let direcao = 1;
function scrollLoop() {
    if (container && container.scrollHeight > container.clientHeight) {
        scrollPos += (0.4 * direcao);
        container.scrollTop = scrollPos;
        if (scrollPos >= (container.scrollHeight - container.clientHeight)) {
            direcao = 0; setTimeout(() => { direcao = -1; }, 3000);
        } else if (scrollPos <= 0 && direcao === -1) {
            direcao = 0; setTimeout(() => { direcao = 1; }, 3000);
        }
    }
    requestAnimationFrame(scrollLoop);
}
scrollLoop();
