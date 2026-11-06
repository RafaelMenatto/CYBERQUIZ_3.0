/* =============================================================================
 *  CYBERQUIZ · JOGO DA MEMÓRIA — CONFIGURAÇÃO
 *  ---------------------------------------------------------------------------
 *  Tudo o que você pode querer mudar (níveis, componentes, pontos, caminhos)
 *  fica aqui. Os outros arquivos apenas leem estes valores.
 * ============================================================================= */

const MEMORY_CONFIG = {

    /* ---------------------------------------------------------------- paths */
    paths: {
        images: '../../img/',              // fotos reaproveitadas do quiz
        quiz:   '../../',       // link de volta ao quiz
        hub:    '../',
    },

    /* -------------------------------------------------------------- jogo */
    defaultLevel: 'easy',
    pointsPerPair: 100,             // pontos por par encontrado
    maxBonus: 300,                  // bônus máximo por eficiência
    penaltyPerExtraMove: 15,        // desconto por movimento além do ideal
    flipBackDelay: 900,             // ms antes de desvirar um par errado
    storageKey: 'cyberquiz.minigame.memory.best',
    // níveis liberados em sequência: concluir um abre o próximo
    unlockStorageKey: 'cyberquiz.minigame.memory.unlocked',

    // pares: quantos pares o tabuleiro tem. columns: colunas do grid.
    // columnsWide: colunas em telas grandes (>= 641px) — opcional; quando
    //   não existe, vale o `columns`. Serve para o nível de 20 cartas ficar
    //   mais "quadrado" (5x4) no desktop sem encolher as cartas no celular.
    // A sequência é liberada em ordem:
    // fácil -> médio -> difícil -> insano -> especialista -> mestre ->
    // lendário -> cyber.
    levels: {
        easy:   { label: 'Fácil',   pairs: 4,  columns: 4, icon: 'fa-seedling' },
        medium: { label: 'Médio',   pairs: 6,  columns: 4, icon: 'fa-bolt' },
        hard:   { label: 'Difícil', pairs: 8,  columns: 4, icon: 'fa-fire' },
        insano: { label: 'Insano',  pairs: 10, columns: 4, columnsWide: 5, icon: 'fa-skull' },
        expert: { label: 'Especialista', pairs: 12, columns: 4, columnsWide: 6, icon: 'fa-star', maxMoves: 100 },
        master: { label: 'Mestre',       pairs: 14, columns: 4, columnsWide: 6, icon: 'fa-crown', maxMoves: 110 },
        legend: { label: 'Lendário',     pairs: 16, columns: 4, columnsWide: 6, icon: 'fa-gem', maxMoves: 120 },
        cyber:  { label: 'Cyber',        pairs: 18, columns: 4, columnsWide: 6, icon: 'fa-robot', maxMoves: 130 },
    },

    /*
     * Componentes usados nas cartas.
     *
     * Cada componente gera DOIS tipos de carta no tabuleiro:
     *   - 'photo': a foto do componente + o nome curto (quem é a peça);
     *   - 'func' : a função que a peça exerce (o que ela faz no PC).
     *
     * O par do jogo é a combinação "foto + função" do mesmo componente.
     * Os níveis usam os primeiros N desta lista.
     */
    components: [
        { id: 'cpu',         name: 'Processador',    short: 'CPU',         role: 'Processa tudo: é o cérebro do PC', roleShort: 'É o cérebro do PC',                                              roleIcon: 'fa-microchip',      image: 'processador.jpg',       credit: 'Eric Gaba (Sting)',  license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Intel_CPU_Core_i7_12700K_Alder_Lake_perspective.jpg' },
        { id: 'mobo',        name: 'Placa-mãe',      short: 'PLACA-MÃE',   role: 'Conecta e coordena todos os componentes do PC', roleShort: 'Conecta o PC todo',                                   roleIcon: 'fa-network-wired',  image: 'placa-mae.jpg',         credit: 'Jacek Halicki',      license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:2023_P%C5%82yta_g%C5%82%C3%B3wna_Asus_ROG_STRIX_Z690-A_GAMING_WIFI.jpg' },
        { id: 'ram',         name: 'Memória RAM',    short: 'RAM',         role: 'Guarda os dados que o processador usa agora', roleShort: 'Guarda dados do PC',                                    roleIcon: 'fa-memory',         image: 'memoria-ram.jpg',       credit: 'Bretwa',             license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:2%2A8Go_DDR4_Corsair_-_2018-05-08.jpg' },
        { id: 'storage',     name: 'SSD NVMe',       short: 'SSD',         role: 'Guarda seus arquivos de forma permanente', roleShort: 'Guarda seus arquivos',                                        roleIcon: 'fa-hard-drive',     image: 'armazenamento-ssd.jpg', credit: 'D-Kuru',             license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Samsung_980_PRO_PCIe_4.0_NVMe_SSD_1TB-top_PNr%C2%B00915.jpg' },
        { id: 'gpu',         name: 'Placa de Vídeo', short: 'GPU',         role: 'Fornece a imagem que você vê na tela', roleShort: 'Manda a imagem à tela',                                             roleIcon: 'fa-display',        image: 'placa-video.jpg',       credit: 'TheStriker',         license: 'CC BY 4.0',    page: 'https://commons.wikimedia.org/wiki/File:MSI_GeForce_RTX_3070_VENTUS_3X_OC.jpg' },
        { id: 'psu',         name: 'Fonte',          short: 'FONTE',       role: 'Distribui a energia para todos os componentes', roleShort: 'Manda a energia',                                    roleIcon: 'fa-bolt',           image: 'fonte.jpg',             credit: 'Dmitry Makeev',      license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:ATX_Computer_power_supply_unit.jpg' },
        { id: 'cooling',     name: 'Cooler',         short: 'COOLER',      role: 'Tira o calor do processador para ele não queimar', roleShort: 'Tira o calor da CPU',                                roleIcon: 'fa-fan',            image: 'cooler.jpg',            credit: 'Eric Gaba (Sting)',  license: 'CC BY-SA 3.0', page: 'https://commons.wikimedia.org/wiki/File:Noctua_NH-U12P_SE2_CPU_cooler.jpg' },
        { id: 'case',        name: 'Gabinete',       short: 'GABINETE',    role: 'Monta e protege todos os componentes do PC', roleShort: 'Monta o gabinete',                                       roleIcon: 'fa-box',            image: 'gabinete.jpg',          credit: 'Tim Sheerman-Chase', license: 'CC BY 4.0',    page: 'https://commons.wikimedia.org/wiki/File:Be_Quiet_PC_Case_Interior_with_GTX_3060_and_P40.jpg' },
        { id: 'network',     name: 'Rede',           short: 'REDE',        role: 'Conecta o PC à internet e aos outros aparelhos', roleShort: 'Conecta à internet',                                   roleIcon: 'fa-wifi',           image: 'rede.jpg',              credit: 'Deavmi',             license: 'CC BY-SA 3.0', page: 'https://commons.wikimedia.org/wiki/File:Ethernet_switch_2.jpg' },
        { id: 'peripherals', name: 'Periféricos',    short: 'PERIFÉRICOS', role: 'São os aparelhos que você usa para digitar, ver e jogar', roleShort: 'Teclado e mouse',                        roleIcon: 'fa-keyboard',       image: 'perifericos.jpg',       credit: 'Morn',               license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Lingbao_JIGUANSHI_Mechanical_Gaming_Keyboard.jpg' },
        { id: 'monitor',     name: 'Monitor',        short: 'MONITOR',     role: 'Exibe a imagem que a placa de vídeo gera', roleShort: 'Mostra a imagem na tela',                                     roleIcon: 'fa-display',        image: 'monitor.jpg',           credit: 'Lucasbosch',         license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:EIZO_Foris_FG2421_VGA_computer_monitor_displaying_test_pattern.png' },
        { id: 'webcam',      name: 'Webcam',         short: 'WEBCAM',      role: 'Captura vídeo para chamadas e transmissões', roleShort: 'Captura vídeo e imagem',                                    roleIcon: 'fa-video',          image: 'webcam.jpg',            credit: 'WrS.tm.pl',          license: 'CC0',          page: 'https://commons.wikimedia.org/wiki/File:USB_webcam_for_PC.jpg' },
        { id: 'router',      name: 'Roteador',       short: 'ROTEADOR',    role: 'Distribui a internet para os aparelhos da casa', roleShort: 'Distribui a internet',                                  roleIcon: 'fa-wifi',           image: 'roteador.jpg',          credit: 'Solijon Solayev',    license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Wi-fi_router.jpg' },
        { id: 'hdd',         name: 'HD',             short: 'HD',          role: 'Guarda arquivos em discos magnéticos giratórios', roleShort: 'Guarda arquivos no disco',                               roleIcon: 'fa-hard-drive',     image: 'hd.jpg',                credit: 'Evan-Amos',          license: 'CC BY-SA 3.0', page: 'https://commons.wikimedia.org/wiki/File:35-Desktop-Hard-Drive.jpg' },
        { id: 'sound',       name: 'Placa de som',   short: 'SOM',         role: 'Converte dados digitais em áudio para as caixas', roleShort: 'Gera o áudio do PC',                                     roleIcon: 'fa-volume-high',    image: 'placa-som.jpg',         credit: 'Evan-Amos',          license: 'Public domain', page: 'https://commons.wikimedia.org/wiki/File:Turtle-Beach-Sound-Card.jpg' },
        { id: 'fan',         name: 'Ventoinha',      short: 'VENTOINHA',   role: 'Movimenta o ar para renovar o interior do gabinete', roleShort: 'Renova o ar do gabinete',                             roleIcon: 'fa-fan',            image: 'ventoinha.jpg',         credit: 'Felhariri3680',      license: 'CC BY-SA 3.0', page: 'https://commons.wikimedia.org/wiki/File:Sanyo_80x80x25mm_computer_cooling_fan.jpg' },
        { id: 'ups',         name: 'Nobreak',        short: 'NOBREAK',     role: 'Mantém o PC ligado durante quedas de energia', roleShort: 'Segura a energia na queda',                                  roleIcon: 'fa-battery-full',   image: 'nobreak.jpg',           credit: 'Tahir mq',           license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Uninterruptible_power_supply.jpg' },
        { id: 'capture',     name: 'Placa de captura', short: 'CAPTURA',   role: 'Grava a imagem do PC para transmissões e aulas', roleShort: 'Grava a imagem do PC',                                  roleIcon: 'fa-tower-broadcast', image: 'placa-captura.jpg',    credit: 'TruthfulBeing',      license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Datapath_VisionHD4_Quad_Port_Capture_Card.jpg' },
    ],
};

Object.freeze(MEMORY_CONFIG);
