/* =============================================================================
 *  CONFIGURAÇÃO CENTRAL DO CYBERQUIZ
 * -----------------------------------------------------------------------------
 *  Este arquivo é o único lugar onde você precisa mexer para customizar o quiz.
 *  Todas as regras, caminhos, cores e escalas do projeto saem daqui.
 *
 *  Exemplo:
 *    - para mudar a nota mínima de conclusão ... quiz.passScore
 *    - para mudar a escala inicial da interface .. ui.defaultZoom
 *    - para trocar a pasta das fotos ............ paths.images
 *    - para mudar as cores do tema .............. theme.colors.cyber
 *
 *  Carregado antes de qualquer outro script do projeto.
 * ============================================================================= */
const CONFIG = {

    /* ---------------------------------------------------------------------
     *  CAMINHOS DOS RECURSOS LOCAIS
     *  (relativos à pasta do index.html)
     * ------------------------------------------------------------------ */
    paths: {
        images: 'img/',   // fotos reais dos componentes
        css: 'css/',      // estilos customizados
        js: 'js/',        // scripts da aplicação
    },

    /* ---------------------------------------------------------------------
     *  REGRAS DO QUIZ
     * ------------------------------------------------------------------ */
    quiz: {
        questionsPerModule: 10,        // questões por módulo
        pointsPerQuestion: 100,        // pontos ganhos por acerto
        passScore: 8,                  // acertos MÍNIMOS para concluir o módulo
        excellentScore: 9,             // acertos para "nível Especialista"
        almostScore: 7,                // acertos para "quase lá"
    },

    /* ---------------------------------------------------------------------
     *  INTERFACE
     * ------------------------------------------------------------------ */
    ui: {
        zoomLevels: [100, 80, 70],  // níveis do botão de zoom (reduz a interface)
        defaultZoom: 100,                 // nível inicial (em %)
    },

    /* ---------------------------------------------------------------------
     *  TEMA  (consumido por js/tailwind.config.js)
     * ------------------------------------------------------------------ */
    theme: {
        colors: {
            cyber: {
                dark: '#0a0d14',      // fundo profundo
                card: '#121824',      // cartões
                accent: '#00f0ff',    // ciano principal
                purple: '#7000ff',
                pink: '#ff007f',
                green: '#00ff66',     // acerto / concluído
                red: '#ff2a5f',       // erro
                yellow: '#ffb700',
            },
        },

        // ATENÇÃO: nomes de fonte com espaço exigem aspas explícitas.
        // Sem aspas o Tailwind gera CSS inválido e descarta a regra.
        fonts: {
            brand: ['Orbitron', 'sans-serif'],   // logotipo
            head: ['"Exo 2"', 'sans-serif'],     // títulos
            text: ['Inter', 'sans-serif'],       // corpo do texto
        },

        // Escala tipográfica ampliada (~+22% sobre a padrão do Tailwind)
        fontSize: {
            'xs': '0.9rem',
            'sm': '1.05rem',
            'base': '1.2rem',
            'lg': '1.35rem',
            'xl': '1.55rem',
            '2xl': '1.9rem',
            '3xl': '2.3rem',
            '4xl': '2.8rem',
            '5xl': '3.4rem',
            '9xl': '7.2rem',   // ícone decorativo do banner
        },
    },
};
