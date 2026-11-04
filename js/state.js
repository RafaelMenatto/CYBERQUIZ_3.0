/* =============================================================================
 *  ESTADO DA APLICAÇÃO
 * -----------------------------------------------------------------------------
 *  Dados mutáveis da sessão (percorso do quiz, pontuação e progresso).
 *  Tudo que muda em tempo de execução mora aqui para ficar fácil de rastrear.
 * ============================================================================= */
const State = {
    moduleIndex: 0,             // módulo atual (índice em MODULES)
    questionIndex: 0,           // questão atual (índice na lista sorteada)
    moduleQuestions: [],        // questões do módulo já embaralhadas (com o gabarito remapeado)
    moduleScore: 0,             // pontos do módulo atual
    globalScore: 0,             // pontos acumulados na sessão
    moduleScores: {},           // melhor pontuação por módulo (evita duplicação ao repetir)
    completedModules: new Set(), // ids dos módulos concluídos (>= CONFIG.quiz.passScore)
    answered: false,            // a questão atual já foi respondida?
    zoomIndex: 0,               // posição atual na lista CONFIG.ui.zoomLevels
    guideModuleId: 'cpu',       // componente aberto no guia de estudo
};
