# CyberQuiz 3.0

Um projeto educativo sobre hardware com quiz, guia de estudo e dois minijogos.
Feito com HTML, CSS e JavaScript, sem instalação ou etapa de build.

## 🚀 Começar

Abra no navegador o arquivo que deseja usar:

- 🧠 **Quiz e guia:** [`index.html`](index.html)
- 🎮 **Escolher um minijogo:** [`MiniGame/index.html`](MiniGame/index.html)
- 🃏 **Jogo da memória:** [`MiniGame/JogoDaMemoria/index.html`](MiniGame/JogoDaMemoria/index.html)
- 🖥️ **Montagem de PC em 3D:** [`MiniGame/MontagemDePC/index.html`](MiniGame/MontagemDePC/index.html)

O projeto funciona abrindo os arquivos diretamente. É necessária conexão com a
internet para carregar fontes, ícones e a biblioteca 3D usada no montador.

## 📚 O que você encontra

| Área | Conteúdo |
| --- | --- |
| 🧠 Quiz | 10 módulos, 10 perguntas por módulo, feedback e progresso salvo |
| 📖 Guia | Resumos e conteúdo de estudo sobre os componentes |
| 🃏 Jogo da memória | Oito níveis, do Fácil ao Cyber (até 18 pares), com limite de movimentos a partir do Especialista. O botão Reiniciar apaga recordes e níveis liberados, com confirmação |
| 🖥️ Montagem de PC | Montagem em 3D com peças e requisitos de instalação |

## 🛠️ Onde editar

| Para alterar... | Arquivo principal |
| --- | --- |
| Perguntas, módulos e créditos das imagens | `js/data.js` |
| Textos do guia | `js/guide-data.js` |
| Nota mínima, cores, caminhos e opções do quiz | `js/config.js` |
| Progresso salvo, restauração e reinício | `js/storage.js` e `js/ui.js` |
| Aparência do quiz e do modal de reinício | `css/style.css` |
| Níveis e componentes da memória | `MiniGame/JogoDaMemoria/js/config.js` |
| Peças, ordem e dicas da montagem 3D | `MiniGame/MontagemDePC/js/config.js` |
| Aparência dos minijogos | CSS dentro de cada pasta em `MiniGame/` |

As imagens ficam em `img/`. Ao adicionar ou trocar uma foto, atualize também
os créditos em `img/CREDITOS.txt` e na página dos minijogos, quando aplicável.

## 💾 Progresso e reinício

O quiz salva o progresso no `localStorage` usando a chave
`cyberquiz.progress.v1`:

- pontos totais;
- módulos concluídos;
- melhor nota por módulo;
- nível de zoom escolhido (100%, 80% ou 70%);
- último componente aberto no guia.

Assim, o progresso continua ao trocar de página (inclusive ao ir para os
minigames) ou recarregar o navegador. A pergunta em andamento não é salva: ao
voltar, o módulo começa do início.

O botão **REINICIAR PROGRESSO** fica abaixo da grade de módulos e só aparece
quando há pontos, módulos concluídos ou melhores notas salvas. Ele abre um modal
temático de confirmação. Ao confirmar, todo o progresso do quiz é apagado e a
tela volta para a seleção de módulos. O zoom é mantido, porque é um ajuste de
leitura, e os recordes dos minigames não são afetados.

O botão de zoom do cabeçalho reduz a interface em três passos — 100%, 80% e
70% — e volta a 100% depois do último. No Monte seu PC 3D o mesmo botão reduz a
página inteira, inclusive a cena 3D, e fica oculto no celular.

## 📱 Celular

As fotos dos módulos e do banner do guia carregam imediatamente (sem lazy
loading), para não ficarem em branco ao rolar a página em conexões lentas. Os
dois minigames usam fontes menores em telas de até 640px, com um ajuste extra
até 380px. No jogo da memória, o botão de 70% aparece apenas no layout de
desktop (a partir de 1024px) e fica oculto em telas menores.

## 🗂️ Estrutura

```text
index.html                  página principal do quiz
css/
  style.css                 estilos do quiz
img/                        imagens e créditos
js/                         dados, configurações e lógica do quiz
  storage.js                progresso salvo no localStorage
MiniGame/
  index.html                página de escolha dos jogos
  css/
    style.css               estilos da página de minijogos
  JogoDaMemoria/
    index.html
    css/                    estilos do jogo
    js/                     configuração, lógica e som
  MontagemDePC/
    index.html
    css/                    estilos do montador
    js/                     configuração, lógica e cena 3D
```

## 🖼️ Créditos e dependências

As fotos são do Wikimedia Commons e estão sob licenças CC BY ou CC BY-SA.
Consulte `img/CREDITOS.txt` e mantenha as atribuições ao reutilizá-las.

O projeto carrega fontes e ícones de serviços externos. O montador 3D também
usa Three.js via CDN; se a biblioteca não carregar, esse minijogo não poderá
iniciar, mas as outras páginas continuam independentes.
