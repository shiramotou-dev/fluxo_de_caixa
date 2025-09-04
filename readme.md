======================================================================
PROJETO: GERENCIADOR FINANCEIRO MIRÁ SUSHI
======================================================================

AUTOR: Ulisses Shiramoto 
CURSO: Análise e Desenvolvimento de Sistemas
DATA: 22 de agosto de 2025

---

1. VISÃO GERAL DO PROJETO

---

Este projeto consiste em um sistema de Gerenciamento Financeiro (Fluxo de Caixa) desenvolvido como uma aplicação web front-end completa e funcional. O objetivo é fornecer uma ferramenta intuitiva e poderosa para o controle de transações financeiras (entradas e saídas) do restaurante "Mirá Sushi".

A aplicação foi construída utilizando apenas tecnologias web puras (HTML, CSS e JavaScript), sem o uso de frameworks, para demonstrar um profundo conhecimento dos fundamentos do desenvolvimento web. O sistema permite ao usuário não apenas registrar transações, mas também visualizar resumos financeiros, analisar dados através de gráficos, gerenciar lançamentos recorrentes e exportar/importar dados para planilhas Excel.

---

2. TECNOLOGIAS UTILIZADAS

---

- **Front-End (Core):**

  - **HTML5:** Utilizado para a estruturação semântica do conteúdo, garantindo acessibilidade e uma base sólida para a aplicação.
  - **CSS3:** Responsável pela estilização completa, incluindo a implementação de um design responsivo (mobile-first) e um sistema de tema claro/escuro (light/dark mode) utilizando variáveis CSS.
  - **JavaScript (ES6+):** O cérebro da aplicação. Toda a lógica de negócio, manipulação do DOM, gerenciamento de estado e interatividade foi implementada em JavaScript puro.

- **Bibliotecas Externas:**
  - **Chart.js:** Para a criação de gráficos interativos e visualmente agradáveis, permitindo uma análise de dados mais eficaz.
  - **SheetJS (XLSX):** Utilizada para implementar as funcionalidades de importação e exportação de dados no formato Excel (.xlsx), oferecendo interoperabilidade com outras ferramentas de gestão.
  - **Font Awesome:** Para a utilização de ícones vetoriais que melhoram a experiência do usuário (UX) e a identificação visual das funcionalidades.

---

3. PRINCIPAIS FUNCIONALIDADES (FEATURES)

---

- **Dashboard de Resumo Financeiro:** Apresenta em tempo real o total de entradas, saídas e o saldo atual.
- **CRUD Completo de Transações:** O usuário pode Adicionar, Visualizar, Editar e Remover transações de forma simples.
- **Lançamentos Múltiplos:** O formulário permite adicionar múltiplos valores com observações individuais dentro de uma única transação, otimizando o registro de dados complexos.
- **Histórico de Transações com Filtros e Paginação:** A tabela de histórico permite filtrar as transações por ano e mês, e o sistema de paginação garante a performance mesmo com um grande volume de dados.
- **Análise Visual com Gráficos:**
  - Gráfico de barras que compara as entradas e saídas mensais para um determinado ano.
  - Gráfico de linha que projeta o saldo para os próximos 6 meses com base nos lançamentos recorrentes.
- **Gestão de Lançamentos Recorrentes:** Uma interface modal permite cadastrar despesas e receitas fixas (ex: aluguel, salários), que são lançadas automaticamente no sistema no dia correto de cada mês.
- **Persistência de Dados Locais:** Todas as informações são salvas no `localStorage` do navegador, permitindo que o usuário feche a página e continue de onde parou.
- **Importação e Exportação de Dados:** Funcionalidade para exportar a visão atual do histórico para um arquivo `.xlsx` e importar dados de uma planilha, permitindo backup e migração.
- **Tema Escuro (Dark Mode):** Botão para alternar entre os modos claro e escuro, com a preferência salva localmente. O sistema também detecta a preferência do sistema operacional do usuário na primeira visita.
- **Design Responsivo:** A interface se adapta perfeitamente a diferentes tamanhos de tela, de desktops a dispositivos móveis.
- **Notificações e Confirmações (UX):** Uso de "toasts" para feedback de ações (ex: "Transação adicionada!") e modais para confirmação de ações destrutivas (ex: "Deseja realmente apagar o histórico?"), prevenindo erros do usuário.

---

4. ESTRUTURA E ARQUITETURA DO CÓDIGO

---

O código foi arquitetado com foco em **Clean Code**, **modularidade** e **manutenibilidade**.

- **HTML (Estrutura Semântica):** A estrutura do `index.html` utiliza tags semânticas como `<main>`, `<section>`, `<nav>` e `<footer>`. Isso não só melhora a acessibilidade para leitores de tela, mas também organiza o conteúdo de forma lógica e clara para os mecanismos de busca e para outros desenvolvedores.

- **CSS (Estilização Moderna):** O `styles.css` foi projetado para ser escalável. O uso extensivo de **variáveis CSS (`:root`)** é um pilar do design, permitindo que a paleta de cores e outras propriedades globais sejam alteradas em um único lugar. A implementação do _Dark Mode_ simplesmente troca os valores dessas variáveis, demonstrando uma abordagem moderna e eficiente para o _theming_. A layout foi construído com **Flexbox** e **Grid**, garantindo alinhamentos e responsividade de forma robusta.

- **JavaScript (Lógica e Interatividade):** O `script.js` é o coração do projeto e foi organizado da seguinte forma:
  1.  **Inicialização Segura:** O código é encapsulado em um listener `DOMContentLoaded` para garantir que o script só execute após o carregamento completo do DOM, prevenindo erros de referência a elementos inexistentes.
  2.  **Separação de Responsabilidades:** O script é dividido em seções lógicas:
      - **Variáveis de Estado e Seletores DOM:** Centraliza as variáveis que controlam o estado da aplicação e as referências aos elementos HTML.
      - **Funções de Utilidade:** Funções puras e reutilizáveis (`formatarMoeda`, `formatarData`) que não dependem do estado global.
      - **Módulo de UX:** Funções dedicadas a interações com o usuário (`mostrarToast`, `mostrarModal`), isolando a lógica da interface.
      - **Lógica de Dados:** Funções que gerenciam a persistência dos dados (`salvarTransacoes`, `carregarDadosIniciais`).
      - **Renderização:** Funções que atualizam a interface com base nos dados atuais (`atualizarTabela`, `atualizarResumo`). A função `atualizarTudo()` atua como um orquestrador central que garante a consistência da UI.
  3.  **Gerenciamento de Estado:** O estado da aplicação (a lista de transações) é mantido em um array de objetos (`transacoes`). Todas as alterações na interface são um reflexo direto das manipulações neste array, seguindo um princípio de "fonte única da verdade" (Single Source of Truth), o que simplifica o raciocínio sobre o fluxo de dados.
  4.  **Programação Assíncrona:** A função `mostrarModal` utiliza `Promise` e `async/await` para lidar com a confirmação do usuário de forma assíncrona, resultando em um código mais limpo e legível do que seria com callbacks.

---

5. DESAFIOS E APRENDIZADOS

---

- **Desafio: Importação de Dados (Excel):** Lidar com a leitura de arquivos no front-end usando `FileReader` e a interpretação de diferentes formatos de data que podem vir de uma planilha foi um desafio significativo. Foi necessário criar uma função de normalização de datas (`dateToYYYYMMDD`) para garantir a consistência dos dados importados.
- **Aprendizado: Gerenciamento de Estado em "Vanilla JS":** Construir uma aplicação reativa sem um framework exigiu a criação de um sistema manual de renderização. O aprendizado chave foi a importância de ter uma função central (`atualizarTudo`) que é chamada após qualquer alteração nos dados, garantindo que a UI esteja sempre sincronizada com o estado. Isso fornece uma base sólida para entender como frameworks como React e Vue funcionam sob o capô.
- **Aprendizado: UX/UI:** A implementação de features como o Dark Mode, toasts e modais reforçou a importância de fornecer feedback constante ao usuário. Uma boa experiência de usuário vai além da funcionalidade e envolve criar uma interface que seja clara, responsiva e que ajude a prevenir erros.

---

6. COMO EXECUTAR O PROJETO

---

1.  Faça o download ou clone o repositório.
2.  Certifique-se de que os arquivos `index.html`, `script.js`, `styles.css` e a biblioteca `xlsx.full.min.js` estão na mesma pasta.
3.  Abra o arquivo `index.html` em qualquer navegador web moderno (Google Chrome, Firefox, etc.).

A aplicação é totalmente client-side e não requer um servidor para ser executada.

---

7. POSSÍVEIS MELHORIAS FUTURAS

---

- **Backend e Banco de Dados:** Substituir o `localStorage` por uma API RESTful conectada a um banco de dados (ex: Node.js + Express + MongoDB/PostgreSQL) para permitir o armazenamento persistente e o acesso dos dados em múltiplos dispositivos.
- **Autenticação de Usuários:** Implementar um sistema de login para que múltiplos usuários possam utilizar a aplicação de forma segura e privada.
- **Categorização de Transações:** Permitir que o usuário crie e atribua categorias às transações para uma análise financeira mais detalhada.
- **Testes Automatizados:** Desenvolver testes unitários (com Jest, por exemplo) para as funções de lógica de negócio e testes de ponta-a-ponta (com Cypress) para garantir a robustez da aplicação.
- **Acessibilidade Avançada (a11y):** Implementar atributos ARIA (Accessible Rich Internet Applications) para melhorar a navegação e a experiência para usuários de tecnologias assistivas.

