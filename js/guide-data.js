/* =============================================================================
 *  CONTEÚDO DO GUIA DE ESTUDO
 * -----------------------------------------------------------------------------
 *  Leitura de apoio exibida ANTES das questões de cada módulo.
 *  A chave de cada bloco é o `id` do módulo em js/data.js (MODULES).
 *
 *  Cada guia cobre TODOS os tópicos cobrados nas 10 questões do módulo:
 *    summary   frase de resumo (destaque do topo)
 *    facts     fichas rápidas: { k: rótulo, v: valor }
 *    sections  parágrafos explicativos: { t: título, p: texto }
 *    tips      dicas práticas (lista)
 * ============================================================================= */
const GUIDE = {

    /* ------------------------------------------------------------------ CPU */
    cpu: {
        summary: 'O processador é o cérebro do computador: executa instruções, faz cálculos e coordena o trabalho dos demais componentes.',
        facts: [
            { k: 'Núcleos', v: '4 a 24+' },
            { k: 'Clock', v: '3 a 6 GHz' },
            { k: 'Cache', v: 'L1 / L2 / L3' },
            { k: 'Soquete', v: 'LGA ou PGA' },
        ],
        sections: [
            { t: 'O que é a CPU e qual o papel da ULA', p: 'A CPU (Central Processing Unit) busca, decodifica e executa as instruções dos programas. Dentro dela convivem a unidade de controle, os registradores e a ULA (Unidade Lógica e Aritmética, do inglês Arithmetic Logic Unit ou ALU), que faz somas, subtrações, comparações e operações lógicas. Nenhum cálculo do sistema acontece sem passar por essas unidades.' },
            { t: 'Núcleos, threads e Hyper-Threading/SMT', p: 'Cada núcleo físico é uma unidade completa de execução, e mais núcleos permitem mais tarefas em paralelo. Hyper-Threading (Intel) e SMT (AMD) dividem um núcleo físico em dois threads lógicos, aproveitando os momentos em que ele ficaria ocioso. O ganho depende da carga: não significa dobrar o desempenho.' },
            { t: 'Clock em GHz e o papel do IPC', p: 'A frequência em GHz indica bilhões de ciclos de clock por segundo. Como o desempenho depende de quantas instruções cada ciclo resolve (IPC), comparar apenas GHz entre arquiteturas diferentes engana. O turbo boost eleva o clock temporariamente quando há temperatura e energia disponíveis.' },
            { t: 'Cache L1, L2 e L3', p: 'A cache é uma memória pequena e rapidíssima integrada à CPU. A L1 é a menor e mais rápida, a L2 é intermediária e a L3 é maior e compartilhada entre os núcleos. Ela existe para reduzir o tempo de acesso aos dados que, de outra forma, teriam de vir da RAM — muito mais lenta.' },
            { t: 'Soquetes LGA e PGA', p: 'O soquete é o encaixe da CPU na placa-mãe e precisa ser compatível com o chip. No LGA (Land Grid Array) os pinos ficam no soquete da placa-mãe e a CPU tem contatos planos; no PGA (Pin Grid Array) os pinos ficam no próprio processador. Cada soquete aceita apenas determinadas gerações de CPU.' },
            { t: 'Chiplets e o I/O Die', p: 'Em arquiteturas modernas a CPU é dividida em blocos. Os CCDs concentram os núcleos, enquanto o I/O Die centraliza o controlador de memória, as linhas PCIe e a comunicação entre os chips (Infinity Fabric). Isso reduz custos de fabricação e permite variar a quantidade de núcleos com o mesmo projeto básico.' },
            { t: 'x86-64 (CISC) e ARM (RISC)', p: 'x86-64 é a arquitetura dos PCs e usa CISC, com instruções complexas e foco em alto desempenho por instrução. ARM usa RISC, com instruções mais simples e foco em eficiência energética, dominando celulares e notebooks leves. Programas compilados para uma arquitetura não rodam nativamente na outra.' },
            { t: 'TDP, thermal throttling e pasta térmica', p: 'O TDP (Thermal Design Power) indica, em watts, quanto calor o sistema de refrigeração precisa dissipar para manter a CPU em temperatura segura. Se o limite térmico é atingido, ocorre thermal throttling: a própria CPU reduz o clock para esquentar menos. A pasta térmica entra aí para preencher as microimperfeições de ar entre o chip e o dissipador.' },
        ],
        tips: [
            'Compare IPC, cache e consumo, não apenas a frequência em GHz.',
            'Confira o soquete antes de comprar CPU e placa-mãe.',
            'Pasta térmica em excesso também atrapalha: use uma porção pequena.',
            'Monitore as temperaturas para perceber se há throttling.',
        ],
    },

    /* -------------------------------------------------------------- PLACA-MÃE */
    mobo: {
        summary: 'A placa-mãe conecta e alimenta todos os componentes e define o que você pode instalar, atualizar e expandir no futuro.',
        facts: [
            { k: 'Soquete', v: 'Define a família de CPU' },
            { k: 'Chipset', v: 'Recursos e portas' },
            { k: 'Memória', v: 'DDR4 ou DDR5' },
            { k: 'Formato', v: 'E-ATX, ATX, mATX, ITX' },
        ],
        sections: [
            { t: 'O que é a placa-mãe', p: 'É a base do sistema: interliga CPU, memória, armazenamento, placa de vídeo e periféricos por meio de trilhas e barramentos. Também distribui energia e concentra os conectores externos (USB, rede, áudio). Todos os componentes dependem dela para conversar entre si.' },
            { t: 'Soquete, chipset e formato', p: 'O soquete define a família de processadores aceita (por exemplo AM5 ou LGA1700). O chipset (B650, Z790, B760) determina recursos como overclock, quantidade de portas USB e linhas PCIe disponíveis. O formato muda o tamanho da placa: o E-ATX (Extended ATX) é o maior usado em desktops, seguido por ATX, mATX e Mini-ITX.' },
            { t: 'VRM, conector de 24 pinos e EPS', p: 'O VRM (Módulo Regulador de Tensão) converte os 12 V da fonte em tensões baixas e precisas para a CPU, na casa de 1,2 V. O conector ATX de 24 pinos é a entrada principal de energia da placa e distribui 3,3 V, 5 V e 12 V; o conector EPS (4 ou 8 pinos) alimenta especificamente o processador.' },
            { t: 'Slots PCIe, M.2 e memória', p: 'O slot PCIe (PCI Express) x16 oferece a maior largura de banda e é usado por placas de vídeo dedicadas. Os slots M.2 recebem SSDs no formato pente, e os de memória RAM seguem o padrão DDR da placa. Para ativar dual channel em placas de quatro slots, instale dois pentes idênticos em canais alternados (2 e 4, ou A2 e B2; 1 e 3 em algumas placas).' },
            { t: 'BIOS/UEFI, CMOS, CR2032 e Clear CMOS', p: 'A BIOS/UEFI é o primeiro programa executado: inicializa o hardware e entrega o controle ao sistema operacional. A UEFI substituiu a BIOS Legacy e traz interface gráfica, suporte a discos GPT maiores que 2 TB e Secure Boot. As configurações ficam no chip CMOS, mantido pela bateria CR2032 quando o PC está desligado. O Clear CMOS zera essas configurações de fábrica, útil após um overclock que impeça a inicialização.' },
            { t: 'Painel traseiro, I/O shield e EMI', p: 'O I/O shield (espelho) alinha e protege as portas traseiras, aterrando a placa ao gabinete e reduzindo interferência eletromagnética (EMI). Em placas modernas ele já vem integrado. É por ele que saem as portas USB, rede, áudio e saídas de vídeo do processador.' },
        ],
        tips: [
            'Leia as especificações do chipset antes de comparar preços.',
            'Slot M.2 aceita SSD SATA e NVMe? Confira no manual.',
            'Placas novas podem exigir atualização de BIOS para CPUs recentes.',
            'Use a bateria CR2032 apenas do tipo correto ao substituir.',
        ],
    },

    /* ---------------------------------------------------------------- MEMÓRIA */
    ram: {
        summary: 'A memória RAM guarda temporariamente os dados em uso: mais RAM permite manter mais programas abertos ao mesmo tempo.',
        facts: [
            { k: 'Tipo', v: 'DDR4 ou DDR5' },
            { k: 'Frequência', v: '2666 a 7200+ MT/s' },
            { k: 'Latência', v: 'CL14 a CL40' },
            { k: 'Canais', v: 'Single / Dual' },
        ],
        sections: [
            { t: 'O que significa RAM e por que é volátil', p: 'RAM é a sigla de Random Access Memory (memória de acesso aleatório): qualquer posição pode ser lida ou escrita em tempo semelhante. Ela é volátil porque cada bit fica retido em minúsculos capacitores que precisam de energia constante — ao desligar o PC, todo o conteúdo se perde. É por isso que, ao contrário de SSDs e HDDs, a RAM não guarda arquivos de forma permanente.' },
            { t: 'DDR4, DDR5 e o PMIC', p: 'DDR5 traz frequências muito maiores, dois subcanais de 32 bits por pente, maior densidade de chips e o PMIC (gerenciador de energia) integrado ao próprio módulo. DDR4 e DDR5 têm encaixes diferentes e não são intercambiáveis: a placa-mãe e a CPU precisam suportar o padrão.' },
            { t: 'Dual channel e os slots corretos', p: 'Cada canal entrega 64 bits. Com dois pentes em canais separados, a CPU passa a acessar 128 bits ao mesmo tempo, dobrando a largura de banda. Em placas com quatro slots, o par costuma ser 2 e 4 (A2 e B2). O ganho é grande em vídeo integrado e em jogos.' },
            { t: 'Frequência, latência CAS e mistura de pentes', p: 'A frequência em MT/s (equivalente a MHz na prática) indica a taxa de transferência; a latência CAS (CL) é o atraso, em ciclos, entre o pedido da CPU e a entrega dos dados — quanto menor, melhor. Ao misturar pentes de velocidades diferentes, o controlador nivela todos pela frequência mais baixa (2.666 e 3.200 rodam a 2.666), em nome da estabilidade.' },
            { t: 'XMP e EXPO', p: 'XMP (Intel) e EXPO (AMD) são perfis prontos gravados no módulo, testados pelo fabricante. Ao ativá-los na BIOS/UEFI, a placa aplica frequência e timings otimizados com um clique. Sem isso, a memória costuma operar na velocidade base, bem abaixo da anunciada.' },
            { t: 'ECC, memória virtual e paginação', p: 'A memória ECC (Error-Correcting Code) tem chips extras que detectam e corrigem erros de bit único, por isso é padrão em servidores e estações críticas. Quando a RAM se esgota, o sistema operacional usa o arquivo de paginação (swap) no SSD ou HD como extensão — muito mais lento, o que causa travamentos e engasgos.' },
            { t: 'Formatos: DIMM e SO-DIMM', p: 'Desktops usam módulos DIMM, mais longos. Notebooks e mini-PCs usam SO-DIMM (Small Outline DIMM), com cerca de metade do comprimento. Existem também módulos soldados, comuns em notebooks finos, que não podem ser trocados.' },
        ],
        tips: [
            'Prefira dois pentes iguais em vez de um único pente grande.',
            'Ative XMP/EXPO na BIOS para atingir a frequência nominal.',
            'Deixe folga de RAM para o sistema operacional e o navegador.',
            'Confira se a placa usa DDR4 ou DDR5 antes de comprar.',
        ],
    },

    /* ---------------------------------------------------------- ARMAZENAMENTO */
    storage: {
        summary: 'O armazenamento guarda dados de forma permanente: SSD para velocidade, HD para capacidade a baixo custo.',
        facts: [
            { k: 'Interface', v: 'NVMe ou SATA' },
            { k: 'SSD SATA', v: 'até ~550 MB/s' },
            { k: 'SSD NVMe', v: '2 a 14 GB/s' },
            { k: 'Formato', v: 'M.2, 2,5" ou 3,5"' },
        ],
        sections: [
            { t: 'HDD, SSD e memória flash', p: 'O SSD usa chips de memória flash e não tem partes móveis: é silencioso, resistente a impactos e responde em microssegundos. O HD usa pratos magnéticos giratórios e cabeças de leitura, sendo mais lento e sensível a vibração, porém muito mais barato por terabyte.' },
            { t: 'SATA, NVMe e PCIe', p: 'O SSD SATA usa o mesmo cabo dos HDs e fica limitado a cerca de 550 a 600 MB/s (SATA III). O NVMe (Non-Volatile Memory Express) é um protocolo criado para memória flash e usa as pistas do barramento PCIe, chegando a 7.000 MB/s no PCIe 4.0 e ainda mais no 5.0. M.2 é apenas o formato físico: existem SSDs M.2 SATA e M.2 NVMe.' },
            { t: 'IOPS, leitura sequencial e aleatória', p: 'MB/s mede transferências grandes e contínuas (um arquivo de vídeo, por exemplo). IOPS (operações de entrada e saída por segundo) mede acessos pequenos e aleatórios, que é o padrão do sistema operacional. Um SSD com IOPS alto abre programas e inicializa o Windows muito mais rápido.' },
            { t: 'TRIM, coleta de lixo e desfragmentação', p: 'O TRIM é um comando do sistema operacional que avisa ao SSD quais blocos já não contêm dados válidos, ajudando na coleta de lixo interna e evitando queda de desempenho. Desfragmentar SSD não traz ganho — o acesso é elétrico e instantâneo — e ainda consome ciclos de escrita, desgastando as células.' },
            { t: 'Células SLC, MLC, TLC e QLC, e o TBW', p: 'Cada célula flash guarda 1 bit (SLC), 2 bits (MLC), 3 bits (TLC, Triple-Level Cell) ou 4 bits (QLC). Quanto mais bits por célula, menor o custo por GB e menor a durabilidade e a velocidade. O TBW (Terabytes Written) estima quantos terabytes podem ser gravados até o fim da garantia, servindo de medida de resistência.' },
            { t: 'Formatos: M.2 2280, 2,5 e 3,5 polegadas', p: 'No padrão M.2, o número indica dimensões em milímetros: 2280 significa 22 mm de largura por 80 mm de comprimento. SSDs de 2,5 polegadas são usados em notebooks e gabinetes; HDs de 3,5 polegadas dominam desktops. Confira o espaço e o tipo de slot antes de comprar.' },
            { t: 'RAID e a regra 3-2-1', p: 'RAID 0 soma a capacidade e ganha velocidade, mas perde tudo se um disco falhar. RAID 1 (espelhamento) duplica os dados: dois discos de 1 TB rendem 1 TB útil, com redundância total. RAID 5 e 10 combinam desempenho e redundância. Ainda assim, RAID não é backup: a regra 3-2-1 pede três cópias, em dois tipos de mídia, com uma fora do local.' },
        ],
        tips: [
            'Use SSD NVMe para o sistema e os programas.',
            'Nunca desfragmente um SSD.',
            'Acompanhe a saúde do disco pelos dados SMART.',
            'Confira se o slot M.2 é PCIe ou SATA antes de comprar.',
        ],
    },

    /* ------------------------------------------------------------- PLACA DE VÍDEO */
    gpu: {
        summary: 'A placa de vídeo processa gráficos e cálculos paralelos: essencial para jogos, edição de vídeo, modelagem e inteligência artificial.',
        facts: [
            { k: 'VRAM', v: '4 a 24+ GB' },
            { k: 'Barramento', v: 'PCIe x16' },
            { k: 'Consumo', v: '75 a 450+ W' },
            { k: 'Saídas', v: 'HDMI / DisplayPort' },
        ],
        sections: [
            { t: 'O que faz a GPU e seus núcleos', p: 'A GPU (Graphics Processing Unit) reúne milhares de núcleos simples que trabalham em paralelo para calcular e renderizar cada quadro. A NVIDIA chama essas unidades de CUDA Cores; a AMD, de Stream Processors. A mesma capacidade paralela acelera vídeo, modelagem 3D e modelos de inteligência artificial.' },
            { t: 'VRAM e o que acontece quando falta', p: 'A VRAM é a memória rápida e dedicada da placa, onde ficam texturas, modelos 3D e framebuffers. Se o jogo pede 10 GB e a placa tem 8 GB, ela passa a buscar dados na RAM do sistema pelo PCIe — muito mais lenta. O resultado são engasgos (stuttering) e quedas bruscas de FPS.' },
            { t: 'Ray Tracing e Tensor Cores', p: 'O Ray Tracing simula em tempo real o caminho físico da luz, gerando reflexos, sombras e refrações realistas, com aceleração por hardware. As Tensor Cores das GPUs NVIDIA RTX são unidades especializadas em multiplicação de matrizes, usadas tanto em IA quanto na reconstrução de imagem do DLSS.' },
            { t: 'Upscaling: DLSS, FSR e XeSS', p: 'Essas tecnologias renderizam o jogo em resolução menor e reconstroem a imagem em alta resolução com algoritmos ou IA. O ganho de desempenho é grande, com perda visual pequena. DLSS usa as Tensor Cores da NVIDIA, o FSR é mais aberto (roda em várias placas) e o XeSS é a proposta da Intel.' },
            { t: 'Resizable BAR e Smart Access Memory', p: 'Por padrão, a CPU acessava a VRAM em blocos pequenos, de 256 MB por vez. Com Resizable BAR (NVIDIA) ou Smart Access Memory (AMD), a CPU enxerga toda a memória da GPU de uma só vez, reduzindo gargalos de comunicação. Exige placa-mãe, BIOS e driver compatíveis.' },
            { t: 'Barramento, energia e saídas de vídeo', p: 'A GPU se conecta pelo slot PCIe x16 e recebe energia extra por conectores de 6 ou 8 pinos (ou o 12VHPWR nas placas mais novas). Nas saídas, o HDMI 2.1 é comum em TVs e monitores, mas o DisplayPort 2.1 oferece a maior largura de banda, chegando a 80 Gbps e viabilizando 4K a 240 Hz sem compressão agressiva.' },
            { t: 'Integrada, dedicada e gargalo', p: 'A GPU integrada fica no processador, divide a memória do sistema e atende uso básico, vídeo e escritório. A dedicada tem VRAM própria e é necessária para jogos em alta qualidade e renderização. Gargalo (bottleneck) acontece quando um componente é muito mais fraco que o outro e limita o conjunto — uma CPU fraca, por exemplo, deixa a GPU ociosa.' },
        ],
        tips: [
            'Equilibre GPU e CPU para evitar gargalo.',
            'Confira a potência e os conectores da fonte antes do upgrade.',
            'Mantenha os drivers atualizados.',
            'Prefira 16 GB de VRAM para jogos em 1440p ou maior.',
        ],
    },

    /* ------------------------------------------------------------------- FONTE */
    psu: {
        summary: 'A fonte converte a energia da tomada em tensões estáveis e seguras para todos os componentes do computador.',
        facts: [
            { k: 'Potência', v: '400 a 1200+ W' },
            { k: 'Eficiência', v: '80 Plus Bronze a Titanium' },
            { k: 'Linha principal', v: '+12 V' },
            { k: 'Cabeamento', v: 'Fixos ou modulares' },
        ],
        sections: [
            { t: 'AC para DC: o que a fonte faz', p: 'A fonte de alimentação (PSU, Power Supply Unit) recebe corrente alternada (AC) da tomada, em 110 V ou 220 V, e a converte em corrente contínua (DC) estável nas linhas de 3,3 V, 5 V e 12 V. Ela também filtra ruídos da rede elétrica. Sem essa conversão, nenhum componente do PC funcionaria.' },
            { t: 'Potência, linha +12 V e dimensionamento', p: 'A potência real depende principalmente da linha de +12 V, que alimenta a CPU (processador) e a placa de vídeo. Dimensione com folga de 20% a 30% sobre o consumo máximo. Uma fonte de 400 W num PC que pede 600 W vai disparar a proteção de sobrepotência (OPP) e desligar ou reiniciar sob carga.' },
            { t: '80 Plus: eficiência, não potência', p: 'O selo 80 Plus garante eficiência mínima de 80% na conversão, ou seja, menos de 20% da energia se perde em calor. A escala vai de White (básico) a Bronze, Silver, Gold, Platinum e Titanium, o topo. Eficiência alta reduz consumo e aquecimento, mas não indica a potência máxima entregue.' },
            { t: 'PFC ativo e estabilizadores', p: 'O PFC ativo (Power Factor Correction) corrige a fase da corrente, melhora o aproveitamento da rede e torna a fonte bivolt automática (cerca de 90 V a 264 V). Por isso, ligá-la a um estabilizador antigo é ruim: o estabilizador corta a onda e estressa o circuito, podendo danificar a fonte. Em quedas frequentes, use nobreak senoidal.' },
            { t: 'Modularidade e organização', p: 'Fontes totalmente modulares têm todos os cabos destacáveis, permitindo ligar apenas os necessários. Isso melhora o fluxo de ar e o visual do gabinete. As semimodulares mantêm fixos apenas os cabos essenciais, e as não modulares trazem toda a fiação soldada.' },
            { t: 'Conectores modernos: ATX 3.0 e 12VHPWR', p: 'O padrão ATX 3.0 criou o conector 12VHPWR (12+4 pinos), capaz de entregar até 600 W em um único cabo, com pinos de sinal que conversam com a placa de vídeo. Ele também define tolerância a picos de potência muito maiores que o padrão anterior.' },
            { t: 'Proteções: OCP, OVP, OPP e SCP', p: 'OCP (Over Current Protection, proteção contra sobrecorrente) desliga a fonte se a amperagem de uma linha passar do limite seguro. OVP protege contra sobretensão, OPP contra sobrepotência total e SCP contra curto-circuito. Fontes boas trazem todas elas — e é isso que evita levar o resto do PC junto em um acidente elétrico.' },
        ],
        tips: [
            'Dimensione a fonte com folga de 20% a 30%.',
            'Não use estabilizador em fontes com PFC ativo.',
            'Prefira modelos com testes e análises independentes.',
            'Confira se há conectores suficientes para a sua GPU.',
        ],
    },

    /* ---------------------------------------------------------------- COOLER */
    cooling: {
        summary: 'O sistema de refrigeração mantém as temperaturas sob controle, evita throttling e prolonga a vida dos componentes.',
        facts: [
            { k: 'Tipo', v: 'Ar ou water cooler' },
            { k: 'TDP suportado', v: '65 a 250+ W' },
            { k: 'Altura', v: 'Limite do gabinete' },
            { k: 'Ventoinhas', v: '120 / 140 mm' },
        ],
        sections: [
            { t: 'Como o calor sai do processador', p: 'O calor gerado no chip passa para a base do cooler por condução, sobe pelos heatpipes e se espalha pelas aletas. As ventoinhas empurram o ar quente para fora, trocando calor com o ambiente por convecção. Toda a cadeia precisa estar eficiente: uma etapa ruim limita as demais.' },
            { t: 'Air cooler × water cooler (AIO)', p: 'O air cooler de torre usa ar para resfriar um dissipador de metal: é simples, confiável e não tem risco de vazamento. O watercooler selado (AIO, All-In-One) usa fluido em circuito fechado, uma bomba, mangueiras, um waterblock de cobre sobre a CPU e um radiador com ventoinhas. Ocupa menos espaço sobre a placa, mas tem mais pontos de falha.' },
            { t: 'Heatpipes e mudança de fase', p: 'Heatpipes são tubos de cobre ocos com um fluido interno. O calor faz o líquido evaporar na base, o vapor sobe e condensa nas aletas, devolvendo o líquido por capilaridade. Esse ciclo líquido-vapor move calor muito mais rápido que o metal sólido sozinho.' },
            { t: 'Ventoinhas: CFM, pressão estática e PWM', p: 'CFM (Cubic Feet per Minute) mede o volume de ar movido — bom para gabinetes. Pressão estática (mmH2O) mede a força para atravessar obstáculos — essencial em radiadores de water cooler e filtros densos. O PWM (Pulse Width Modulation), no quarto pino do conector de 4 pinos, ajusta a rotação de 0 a 100% conforme a temperatura.' },
            { t: 'Fluxo de ar: pressão positiva e exaustão', p: 'Gabinete com pressão positiva tem mais ar entrando do que saindo; o excedente escapa pelas frestas e reduz a poeira. Pressão negativa puxa poeira por qualquer abertura. O ar quente deve sair para fora do gabinete pelas ventoinhas traseira e superior, pois o calor sobe.' },
            { t: 'Pasta térmica e instalação segura', p: 'A pasta preenche as microimperfeições de ar entre o IHS da CPU e a base do cooler. A quantidade ideal é pequena, do tamanho de um grão de ervilha no centro: ao pressionar, ela se espalha. Apertar os parafusos em excesso pode empenar o PCB do soquete e danificar trilhas da placa-mãe; aperte em cruz, aos poucos.' },
        ],
        tips: [
            'Meça a altura do cooler e o comprimento da GPU antes de comprar.',
            'Limpe a poeira e os filtros periodicamente.',
            'Não deixe o gabinete em local fechado ou encostado na parede.',
            'Para radiadores, prefira ventoinhas de alta pressão estática.',
        ],
    },

    /* ------------------------------------------------------------------- REDE */
    network: {
        summary: 'A rede conecta o computador à internet e a outros dispositivos, por cabo ou sem fio.',
        facts: [
            { k: 'Cabo', v: '100 Mbps a 10 Gbps' },
            { k: 'Wi-Fi', v: 'Wi-Fi 5 / 6 / 6E / 7' },
            { k: 'Conector', v: 'RJ-45' },
            { k: 'Latência', v: 'ms (ping)' },
        ],
        sections: [
            { t: 'Como a rede funciona', p: 'O adaptador de rede (placa Ethernet ou Wi-Fi) envia e recebe pacotes. Em casa, o roteador liga a rede local à internet, distribui endereços IP e aplica firewall; o switch apenas amplia as portas de uma rede já existente, encaminhando quadros ao destino correto na LAN.' },
            { t: 'Cabos, conectores e categorias', p: 'O conector padrão do cabo de rede é o RJ-45, de 8 pinos. Cat5e atende 1 Gbps; Cat6 e Cat6a vão a 10 Gbps (a 6a é blindada contra diafonia em até 100 metros); Cat7 e Cat8 são para ambientes exigentes. Cabos blindados ajudam em locais com muita interferência eletromagnética.' },
            { t: 'Velocidades: 100 Mbps, 1 GbE, 2,5 GbE e 10 GbE', p: 'A placa Gigabit (1 GbE) entrega 1.000 Mbps, cerca de 125 MB/s. A 2,5 GbE chega a 2.500 Mbps (cerca de 312 MB/s), duas vezes e meia a Gigabit, e é comum em placas-mãe atuais. Redes de 10 GbE pedem cabo Cat6a ou superior e switches compatíveis. O limite real também depende do roteador e do link da operadora.' },
            { t: 'Wi-Fi: faixas, Wi-Fi 6E/7 e MU-MIMO', p: 'A faixa de 2,4 GHz alcança mais longe, mas sofre interferência; 5 GHz e 6 GHz oferecem canais mais largos, muito mais velocidade e menos disputa, com menor penetração em paredes. O MU-MIMO (Multi-User, Multiple-Input Multiple-Output) permite ao roteador atender vários dispositivos ao mesmo tempo, sem filas.' },
            { t: 'Endereços e serviços: MAC, IP, DHCP e DNS', p: 'O endereço MAC (Media Access Control) é um identificador físico de 48 bits gravado de fábrica na placa de rede. O IP é o endereço lógico usado para rotear pacotes. O DHCP entrega IPs, máscara e gateway automaticamente; o DNS traduz nomes e URLs como www.exemplo.com em endereços IP numéricos.' },
            { t: 'Latência, banda e jitter', p: 'Banda é o volume de dados por segundo; latência (ping, em ms) é o tempo de ida e volta até o servidor. Baixar arquivos depende de banda; jogos e chamadas dependem de latência baixa e estável. Jitter é a variação da latência e provoca travadas mesmo com banda sobrando.' },
        ],
        tips: [
            'Prefira cabo para jogos e chamadas de vídeo.',
            'Use 5 GHz ou 6 GHz quando estiver perto do roteador.',
            'Evite paredes e objetos metálicos entre o PC e o roteador.',
            'Para 10 Gbps, use Cat6a em distâncias de até 100 metros.',
        ],
    },

    /* --------------------------------------------------------------- GABINETE */
    case: {
        summary: 'O gabinete abriga, protege e organiza os componentes, além de direcionar o fluxo de ar para a refrigeração.',
        facts: [
            { k: 'Formato', v: 'ATX / mATX / ITX' },
            { k: 'GPU máxima', v: '200 a 420 mm' },
            { k: 'Cooler máximo', v: '150 a 180 mm' },
            { k: 'Ventoinhas', v: '2 a 7+ posições' },
        ],
        sections: [
            { t: 'O que é o gabinete e por que o tamanho importa', p: 'O gabinete sustenta e protege as peças, organiza os cabos e define a passagem de ar. Mid-Tower atende a maioria das montagens; Full-Tower oferece espaço para placas E-ATX, radiadores grandes e várias GPUs. O tamanho precisa acomodar placa-mãe, GPU, cooler e fonte.' },
            { t: 'Formatos e compatibilidade', p: 'O gabinete precisa suportar o formato da placa-mãe (ATX, mATX ou Mini-ITX). Os limites mais esquecidos são o comprimento máximo da placa de vídeo e a altura máxima do cooler de CPU — se o cooler for mais alto que o espaço até a tampa lateral, o gabinete não fecha. Gabinetes SFF (Small Form Factor) são compactos e usam Mini-ITX.' },
            { t: 'Ventilação: mesh, filtros e fluxo de ar', p: 'Painéis frontais em mesh (malha perfurada) permitem entrada massiva de ar; vidro fechado estrangula a sucção das ventoinhas e eleva a temperatura. Filtros de poeira, muitas vezes magnéticos e laváveis, retêm partículas antes que entrem e mantêm a eficiência térmica. Limpe-os com regularidade.' },
            { t: 'Organização: cable management, PSU shroud e tampas PCIe', p: 'A câmara atrás da placa-mãe serve para esconder os cabos, melhorando o visual e evitando que fios bloqueiem o fluxo de ar. O PSU Shroud é um compartimento inferior que esconde a fonte e o excesso de cabos. As tampas PCIe traseiras (PCI Slot Covers) são removíveis e liberam espaço para as placas de expansão, como a GPU.' },
            { t: 'Painel frontal I/O', p: 'O painel frontal reúne portas USB, conectores de áudio P2 e os botões Power e Reset. Ele é ligado à placa-mãe por cabos internos em pinos específicos. É a forma mais prática de conectar pendrives e fones sem alcançar a parte de trás do gabinete.' },
            { t: 'Montagem segura: standoffs e curto-circuito', p: 'Os standoffs (espaçadores de latão ou metal) mantêm a placa-mãe afastada da chapa condutora do gabinete, evitando que soldas da parte de trás provoquem curto-circuito. Eles precisam estar nos furos corretos para o formato da placa — um espaçador sobrando em local errado pode inutilizar a placa.' },
        ],
        tips: [
            'Confira as medidas máximas de GPU, cooler e fonte antes de comprar.',
            'Passe os cabos atrás da bandeja da placa-mãe.',
            'Limpe os filtros de poeira com regularidade.',
            'Prefira frontal em mesh se a refrigeração for prioridade.',
        ],
    },

    /* ------------------------------------------------------------- PERIFÉRICOS */
    peripherals: {
        summary: 'Periféricos são a interface entre você e o computador: teclado, mouse, monitor, headset e outros dispositivos.',
        facts: [
            { k: 'Conexão', v: 'USB / 2,4 GHz / Bluetooth' },
            { k: 'Teclado', v: 'Mecânico ou membrana' },
            { k: 'Mouse', v: 'DPI, IPS e polling (Hz)' },
            { k: 'Monitor', v: '60 a 360+ Hz' },
        ],
        sections: [
            { t: 'O que são periféricos', p: 'São dispositivos de entrada e saída que traduzem comandos e resultados. Entrada: teclado, mouse, microfone, webcam. Saída: monitor, caixas de som, headset. Cada um se conecta por USB, receptor 2,4 GHz ou Bluetooth, com diferenças de latência e autonomia.' },
            { t: 'Teclados: switches, NKRO e anti-ghosting', p: 'Teclados mecânicos usam um switch por tecla: lineares descem suaves do topo ao fim, táteis têm uma pequena resistência (bump) no ponto de atuação, como o switch marrom (Brown), e clicky fazem som e clique. O NKRO (N-Key Rollover) e o anti-ghosting garantem que várias teclas pressionadas ao mesmo tempo sejam registradas. Teclados de membrana são mais baratos e silenciosos.' },
            { t: 'Mouse: DPI, IPS e polling rate', p: 'O DPI (Dots Per Inch) indica quantos pixels o cursor percorre na tela para cada polegada de movimento físico — valores altos deixam o cursor muito sensível. IPS (Inches Per Second) é a velocidade máxima de rastreamento antes de o sensor perder leitura em movimentos bruscos. O polling rate (1.000 Hz, 4.000 Hz) é quantas vezes por segundo o mouse envia a posição à CPU.' },
            { t: 'Monitores: Hz, GtG e tipos de painel', p: 'A taxa de atualização (Hz) indica quantos quadros a tela mostra por segundo; 144 Hz ou 240 Hz deixam o movimento mais fluido que os 60 Hz tradicionais e reduzem o input lag. O tempo de resposta GtG (Gray-to-Gray) é quanto um pixel leva para trocar de tom (1 ms é o ideal) — se for alto, aparecem rastros (ghosting). OLED desliga pixels individualmente, com preto perfeito e contraste infinito; IPS tem boas cores, VA tem bom contraste e TN é o mais rápido e barato.' },
            { t: 'Sincronização: G-Sync e FreeSync', p: 'G-Sync (NVIDIA) e FreeSync (AMD) sincronizam a taxa de atualização do monitor com os FPS gerados pela GPU. Com taxa variável, o monitor se ajusta em tempo real e elimina o tearing (corte de tela), mantendo a imagem estável mesmo quando os FPS oscilam.' },
            { t: 'Áudio: padrões polares e headsets', p: 'O padrão polar cardióide capta o som principalmente pela frente da cápsula e rejeita o que vem de trás, isolando a voz e reduzindo ruídos do ambiente — por isso domina headsets e microfones de mesa. Headsets e DACs externos melhoram a qualidade, mas o arquivo de origem também importa.' },
        ],
        tips: [
            'Teste o switch e o formato do mouse antes de comprar.',
            'Taxas de atualização altas ajudam em jogos competitivos.',
            'DPI muito alto reduz a precisão; ajuste à sua sensibilidade.',
            'Prefira monitor com tempo de resposta baixo (1 ms GtG) para jogos.',
        ],
    },
};
