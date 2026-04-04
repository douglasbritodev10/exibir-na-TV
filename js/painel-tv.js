import { db } from "./firebase-config.js";
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let cS, cV;
const container = document.getElementById('scrollContainer');

// Relógio
setInterval(() => {
    document.getElementById('relogio').innerText = new Date().toLocaleTimeString('pt-BR');
}, 1000);

// Monitoramento Real-time
onSnapshot(collection(db, "expedicoes"), (snap) => {
    const hoje = new Date().toISOString().split('T')[0];
    const amanhaDate = new Date();
    amanhaDate.setDate(amanhaDate.getDate() + 1);
    const amanha = amanhaDate.toISOString().split('T')[0];

    let dados = snap.docs
        .map(d => d.data())
        .filter(d => d.data === hoje || d.data === amanha)
        .sort((a, b) => Number(a.codigo) - Number(b.codigo)); // Ordenação por Nº Expedição

    renderizarTabela(dados);
    atualizarGraficos(dados);
});

function renderizarTabela(lista) {
    const corpo = document.getElementById('corpoTabela');
    corpo.innerHTML = "";

    lista.forEach(d => {
        const statusLimpo = d.status.toUpperCase().replace(/ /g, "_").replace(/\//g, "_");
        const dataShow = d.data.split('-').reverse().slice(0, 2).join('/'); // DD/MM

        corpo.innerHTML += `
            <div class="row">
                <div style="color:#999">${dataShow}</div>
                <div style="color:var(--primary)">${d.codigo}</div>
                <div style="color:#333">${d.placa}</div>
                <div style="font-size: 12px; padding: 0 5px;">${d.destino}</div>
                <div class="v-${d.tipo.replace(/ /g, "_")}">${d.tipo}</div>
                <div style="background: #eee; border-radius: 4px;">${d.box}</div>
                <div><span class="badge st-${statusLimpo}">${d.status}</span></div>
            </div>
        `;
    });

    const totalV = new Set(lista.map(i => i.placa)).size;
    document.getElementById('kpiVeiculos').innerText = totalV;
    document.getElementById('txtKpiResumo').innerText = `VEÍCULOS: ${totalV}`;
}

// Lógica de Auto-Scroll suave
let scrollPos = 0;
let direcao = 1;
function scrollLoop() {
    if (container.scrollHeight > container.clientHeight) {
        scrollPos += (0.4 * direcao); // Velocidade
        container.scrollTop = scrollPos;

        if (scrollPos >= (container.scrollHeight - container.clientHeight)) {
            direcao = 0; 
            setTimeout(() => { direcao = -1; }, 3000); // Para 3s no fim
        } else if (scrollPos <= 0 && direcao === -1) {
            direcao = 0;
            setTimeout(() => { direcao = 1; }, 3000); // Para 3s no topo
        }
    }
    requestAnimationFrame(scrollLoop);
}
scrollLoop();

function atualizarGraficos(lista) {
    const sM = {}, vM = {};
    const coresStatus = {
        'FINALIZADO': '#1b5e20', 'EM SEPARAÇÃO': '#e65100', 'CRIADO': '#0d47a1',
        'EM CARREGAMENTO': '#95e9ae', 'CARREGADO/EM VIAGEM': '#d123a3', 'CONFERÊNCIA FINALIZADA': '#4a148c'
    };

    lista.forEach(d => {
        sM[d.status] = (sM[d.status] || 0) + 1;
        vM[d.tipo] = (vM[d.tipo] || 0) + 1;
    });

    if(cS) cS.destroy();
    cS = new Chart(document.getElementById('chartStatus'), {
        type: 'pie',
        data: {
            labels: Object.keys(sM),
            datasets: [{ data: Object.values(sM), backgroundColor: Object.keys(sM).map(k => coresStatus[k] || '#ccc') }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } } } }
    });

    if(cV) cV.destroy();
    cV = new Chart(document.getElementById('chartVeiculos'), {
        type: 'bar',
        data: {
            labels: Object.keys(vM),
            datasets: [{ label: 'Qtd', data: Object.values(vM), backgroundColor: '#b71c1c' }]
        },
        options: { 
            responsive: true, maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } },
            plugins: { legend: { display: false } }
        }
    });
}
