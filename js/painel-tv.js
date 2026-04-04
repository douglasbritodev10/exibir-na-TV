import { db } from "./firebase-config.js";
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let cS, cV;
const container = document.getElementById('scrollContainer');

const CORES = { 
    'CARRETA': '#1b5e20', 'TRUCK': '#03a9f4', 'CARRO 3/4': '#7b1fa2', 'TOCO': '#fbc02d',
    'FINALIZADO': '#1b5e20', 'EM SEPARAÇÃO': '#e65100', 'CRIADO': '#0d47a1',
    'EM CARREGAMENTO': '#95e9ae', 'CARREGADO/EM VIAGEM': '#d123a3', 'CONFERÊNCIA FINALIZADA': '#4a148c'
};

// Relógio
setInterval(() => {
    document.getElementById('relogio').innerText = new Date().toLocaleTimeString('pt-BR');
}, 1000);

// Monitoramento em Tempo Real (Otimizado)
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
    corpo.innerHTML = "";

    lista.forEach(d => {
        const statusLimpo = d.status.toUpperCase().replace(/ /g, "_").replace(/\//g, "_");
        const dataShow = d.data.split('-').reverse().slice(0, 2).join('/');
        const corVeiculo = CORES[d.tipo.toUpperCase()] || '#333';

        corpo.innerHTML += `
            <div class="row">
                <div style="color:#999">${dataShow}</div>
                <div style="color:var(--primary)">${d.codigo}</div>
                <div style="color:#333">${d.placa}</div>
                <div style="color:${corVeiculo}">${d.tipo}</div>
                <div style="font-size: 11px; padding: 0 5px; line-height: 1.2;">${d.destino}</div>
                <div style="background: #eee; border-radius: 4px; width: 40px; margin: 0 auto;">${d.box}</div>
                <div><span class="badge st-${statusLimpo}">${d.status}</span></div>
            </div>
        `;
    });

    // Lógica de Veículos Únicos (Placa + Data)
    const veiculosUnicos = new Set(lista.map(i => i.placa + "_" + i.data)).size;
    
    document.getElementById('kpiExpedicoes').innerText = lista.length;
    document.getElementById('txtKpiResumo').innerText = `VEÍCULOS: ${veiculosUnicos}`;
}

function atualizarGraficos(lista) {
    const sM = {}, vM = {};
    
    lista.forEach(d => {
        sM[d.status] = (sM[d.status] || 0) + 1;
        vM[d.tipo] = (vM[d.tipo] || 0) + 1;
    });

    // Gráfico de Status (Pizza) com Porcentagem e Qtd
    if(cS) cS.destroy();
    cS = new Chart(document.getElementById('chartStatus'), {
        type: 'pie',
        data: {
            labels: Object.keys(sM),
            datasets: [{ 
                data: Object.values(sM), 
                backgroundColor: Object.keys(sM).map(k => CORES[k.toUpperCase()] || '#ccc') 
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 9 } } },
                tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.raw} exp.` } }
            }
        }
    });

    // Gráfico de Veículos (Barras) com Cores Correspondentes
    if(cV) cV.destroy();
    cV = new Chart(document.getElementById('chartVeiculos'), {
        type: 'bar',
        data: {
            labels: Object.keys(vM),
            datasets: [{ 
                data: Object.values(vM), 
                backgroundColor: Object.keys(vM).map(k => CORES[k.toUpperCase()] || var(--primary))
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
            plugins: { 
                legend: { display: false }
            }
        }
    });
}

// Auto-Scroll suave
let scrollPos = 0;
let direcao = 1;
function scrollLoop() {
    if (container.scrollHeight > container.clientHeight) {
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
