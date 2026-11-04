/* =============================================================================
 *  CYBERQUIZ · MONTAGEM DE PC 3D — CONFIGURAÇÃO
 *  ---------------------------------------------------------------------------
 *  Aqui ficam a ordem REAL de montagem, os requisitos de cada peça, as dicas
 *  didáticas e as posições dos slots na cena 3D. Os outros arquivos só leem.
 * ============================================================================= */

const BUILDER_CONFIG = {

    /* ---------------------------------------------------------------- paths */
    paths: {
        images: '../../img/',
        quiz:   '../../',
        hub:    '../',
        memory: '../JogoDaMemoria/',
    },

    /* --------------------------------------------------------------- jogo */
    storageKey: 'cyberquiz.minigame.builder.best',
    camera: { fov: 38, distance: 12.2, targetY: 2.45, dir: [0.52, 0.50, 0.88] },
    case:   { w: 4.4, h: 5.0, d: 3.2 },

    /*
     *  ORDEM RECOMENDADA DE MONTAGEM (é assim que se monta na prática):
     *   1. Placa-mãe   → sobre os espaçadores (standoffs)
     *   2. CPU         → no soquete, respeitando o chanfro
     *   3. Cooler      → sobre o processador (pasta térmica + trava)
     *   4. RAM         → slots DIMM (dual channel: A2/B2)
     *   5. SSD M.2     → slot M.2, com parafuso (fica SOB a placa de vídeo)
     *   6. Fonte       → compartimento inferior, ventilador para fora
     *   7. GPU         → slot PCIe x16 + cabo de alimentação (exige o M.2)
     *   8. Cabeamento  → 24 pinos, EPS, PCIe e organização
     *
     *  `requires`: a peça só pode ser instalada quando TODAS já estiverem.
     *  É isso que impede sequências impossíveis (SSD antes da placa-mãe,
     *  GPU antes do M.2 — que ficaria preso embaixo do dissipador, etc.).
     */
    pieces: [
        {
            id: 'mobo', name: 'Placa-mãe', order: 1, icon: 'fa-server', image: 'placa-mae.jpg',
            where: 'espaçadores do gabinete', requires: [],
            slot: { x: 0.00, y: 2.85, z: -1.30 },
            tip: 'Fixe a placa-mãe sobre os espaçadores (standoffs) e aperte os parafusos em cruz, sem forçar.',
            because: 'A placa-mãe é a base: CPU, RAM, SSD e GPU se conectam diretamente nela.',
        },
        {
            id: 'cpu', name: 'Processador', order: 2, icon: 'fa-microchip', image: 'processador.jpg',
            where: 'soquete LGA', requires: ['mobo'],
            slot: { x: -0.62, y: 3.35, z: -1.185 },
            tip: 'Abra a alavanca do soquete, encaixe a CPU respeitando o chanfro/seta e trave sem forçar.',
            because: 'A CPU precisa estar no soquete antes de qualquer coisa ser montada por cima dela.',
        },
        {
            id: 'cooler', name: 'Cooler', order: 3, icon: 'fa-fan', image: 'cooler.jpg',
            where: 'sobre o processador', requires: ['cpu'],
            slot: { x: -0.62, y: 3.35, z: -1.185 },
            tip: 'Espalhe pasta térmica em camada fina, posicione o cooler sobre o IHS e trave na placa-mãe.',
            because: 'O cooler prende no soquete da CPU e ocupa o espaço do dissipador: monte antes da RAM e da GPU.',
        },
        {
            id: 'ram', name: 'Memória RAM', order: 4, icon: 'fa-memory', image: 'memoria-ram.jpg',
            where: 'slots DIMM', requires: ['mobo'],
            slot: { x: 0.495, y: 2.95, z: -1.225 },
            tip: 'Abra as travas, alinhe o chanfro e pressione as duas pontas até ouvir o clique. Dual channel: use A2 e B2.',
            because: 'Os módulos vão direto na placa-mãe e é mais fácil encaixá-los antes da GPU ocupar o espaço.',
        },
        {
            id: 'ssd', name: 'SSD M.2', order: 5, icon: 'fa-hard-drive', image: 'armazenamento-ssd.jpg',
            where: 'slot M.2', requires: ['mobo'],
            slot: { x: 0.15, y: 2.27, z: -1.23 },
            tip: 'Insira em ~30°, empurre até o fim e fixe o parafuso do M.2. Não esqueça o dissipador.',
            because: 'O SSD NVMe fica embaixo da GPU — instale antes para não precisar desmontar nada.',
        },
        {
            id: 'psu', name: 'Fonte', order: 6, icon: 'fa-plug', image: 'fonte.jpg',
            where: 'compartimento inferior', requires: [],
            slot: { x: 0.20, y: 0.50, z: -0.83 },
            tip: 'Instale com o ventilador virado para fora/baixo (entrada de ar fresco) e passe os cabos pelos recortes.',
            because: 'A fonte pode ir a qualquer momento; cedo ajuda a organizar o cabeamento. A GPU depende dela.',
        },
        {
            id: 'gpu', name: 'Placa de Vídeo', order: 7, icon: 'fa-display', image: 'placa-video.jpg',
            where: 'slot PCIe x16', requires: ['mobo', 'psu', 'ssd'],
            slot: { x: -0.605, y: 2.99, z: -0.245 },
            tip: 'Abra a trava do PCIe, encaixe até o clique, parafuse o bracket e conecte o cabo PCIe de 8 pinos.',
            because: 'A GPU é a última peça grande: entra depois da fonte e do SSD M.2 (que fica embaixo dela) e exige o cabo de alimentação PCIe.',
        },
        {
            id: 'cables', name: 'Cabeamento', order: 8, icon: 'fa-bolt', image: null,
            where: '24 pinos + PCIe', requires: ['mobo', 'psu', 'gpu'],
            slot: { x: 0.62, y: 2.30, z: -0.45 },
            tip: 'Ligue o cabo 24 pinos na placa-mãe, o 8 pinos da CPU, o PCIe na GPU e organize com abraçadeiras.',
            because: 'Fechar o cabeamento é o último passo: só depois de todas as peças estarem posicionadas.',
        },
    ],

    // Mensagens exibidas quando a ordem é furada.
    blocked: {
        'cpu':    'Instale a placa-mãe primeiro: a CPU vai no soquete dela.',
        'cooler': 'O cooler se fixa em cima da CPU: instale o processador antes.',
        'ram':    'A memória RAM encaixa nos slots DIMM da placa-mãe, então ela precisa estar instalada.',
        'ssd':    'O slot M.2 fica na placa-mãe. Instale a placa-mãe primeiro.',
        'gpu':    'A placa de vídeo precisa da placa-mãe, da fonte e do SSD M.2 instaladas.',
        'cables': 'Conecte os cabos só no fim: primeiro placa-mãe, fonte e placa de vídeo.',
    },

    /*
     *  Mensagem mais precisa por REQUISITO que falta: quando a peça tem mais de
     *  uma dependência, o jogador precisa saber exatamente qual falta agora.
     *  O código usa o primeiro requisito pendente (na ordem de `requires`).
     */
    blockedBy: {
        'gpu': {
            'mobo': 'A placa de vídeo precisa da placa-mãe: é nela que fica o slot PCIe x16.',
            'psu':  'A placa de vídeo precisa da fonte: é dela que vem o cabo PCIe de 8 pinos.',
            'ssd':  'Instale o SSD M.2 antes da placa de vídeo: ele fica embaixo do dissipador e não entraria depois.',
        },
    },

    // Boas práticas mostradas no painel lateral.
    bestPractices: [
        'Use pulseira antiestática ou toque em metal antes de pegar as peças.',
        'Aperte os parafusos em cruz, aos poucos, para não empenar a placa-mãe.',
        'Nunca force a CPU ou a RAM: elas têm chanfro e só entram de um jeito.',
        'Pasta térmica em pequena quantidade — o excesso espalha e suja o soquete.',
        'CPU antes do cooler, SSD antes da GPU e cabos por último: é a ordem que evita desmontar.',
        'Confira se a fonte suporta a potência da GPU (e use cabos PCIe dedicados, sem adaptadores).',
    ],
};

Object.freeze(BUILDER_CONFIG);
