/* =============================================================================
 *  PROGRESSO SALVO - persistência do quiz no localStorage
 * -----------------------------------------------------------------------------
 *  O State vive em memória e se perde ao trocar de página (por exemplo, ao ir
 *  para MiniGame/) ou ao recarregar. Este arquivo guarda apenas o que é
 *  progresso de verdade: pontos, melhores notas, módulos concluídos, zoom e o
 *  último componente aberto no guia.
 *
 *  A pergunta atual NÃO é salva: ao voltar, o módulo começa do início.
 * ============================================================================= */

const PROGRESS_KEY = 'cyberquiz.progress.v1';

/** Grava o progresso atual. Falhas (file://, modo privado) são ignoradas. */
function saveProgress() {
    try {
        const data = {
            version: 2,
            globalScore: State.globalScore,
            moduleScores: State.moduleScores,
            completedModules: [...State.completedModules],
            zoomIndex: State.zoomIndex,
            guideModuleId: State.guideModuleId,
        };
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
    } catch (_) { /* localStorage indisponível: segue sem salvar */ }
}

/**
 * Restaura o progresso salvo.
 * @returns {boolean} true quando havia dados válidos para restaurar.
 */
function loadProgress() {
    try {
        const raw = localStorage.getItem(PROGRESS_KEY);
        if (!raw) return false;

        const data = JSON.parse(raw);
        if (!data || typeof data !== 'object') return false;

        /* Pontos totais */
        if (Number.isFinite(data.globalScore)) {
            State.globalScore = Math.max(0, Math.floor(data.globalScore));
        }

        /* Melhor nota por módulo (apenas ids existentes) */
        if (data.moduleScores && typeof data.moduleScores === 'object') {
            const validIds = new Set(MODULES.map((m) => m.id));
            const scores = {};
            Object.keys(data.moduleScores).forEach((id) => {
                const value = Number(data.moduleScores[id]);
                if (validIds.has(id) && Number.isFinite(value) && value > 0) {
                    scores[id] = value;
                }
            });
            State.moduleScores = scores;
        }

        /* Módulos concluídos (apenas ids existentes) */
        if (Array.isArray(data.completedModules)) {
            const validIds = new Set(MODULES.map((m) => m.id));
            State.completedModules = new Set(
                data.completedModules.filter((id) => typeof id === 'string' && validIds.has(id))
            );
        }

        /* Nível de zoom
           A v2 trocou os níveis (100/80/70); o índice salvo na v1 apontava para
           outra escala, então é descartado e a interface volta a 100%. */
        const version = Number.isInteger(data.version) ? data.version : 1;
        if (version >= 2 && Number.isInteger(data.zoomIndex) && data.zoomIndex >= 0 && data.zoomIndex < CONFIG.ui.zoomLevels.length) {
            State.zoomIndex = data.zoomIndex;
        }

        /* Último componente do guia */
        if (typeof data.guideModuleId === 'string' && MODULES.some((m) => m.id === data.guideModuleId)) {
            State.guideModuleId = data.guideModuleId;
        }

        return true;
    } catch (_) {
        return false;
    }
}

/** Apaga o progresso salvo. */
function clearProgress() {
    try {
        localStorage.removeItem(PROGRESS_KEY);
    } catch (_) { /* localStorage indisponível */ }
}
