// --- INÍCIO DO SCRIPT ---
// Envolve todo o código em um event listener para garantir que o HTML esteja pronto.
document.addEventListener("DOMContentLoaded", () => {
  // --- VARIÁVEIS GLOBAIS DE ESTADO ---
  let transacoes = [];
  let lancamentosRecorrentes = [];
  let editandoTransacaoId = null;
  let resumoMensalChart = null;
  let previsaoSaldoChart = null;
  let currentPage = 1;
  const itemsPerPage = 10;

  // --- SELETORES GLOBAIS DO DOM ---
  const form = document.getElementById("transacaoForm");
  const formSection = document.getElementById("form-transacao-section");
  const tipoTransacaoInput = document.getElementById("tipoTransacao");
  const dataTransacaoInput = document.getElementById("dataTransacao");
  const valorObsContainer = document.getElementById("valor-obs-container");
  const formBtn = document.getElementById("formBtn");
  const filtroAno = document.getElementById("filtroAno");
  const filtroMes = document.getElementById("filtroMes");
  const filtroAnoGrafico = document.getElementById("filtroAnoGrafico");
  const navBtnGerenciamento = document.getElementById("navBtnGerenciamento");
  const navBtnGraficos = document.getElementById("navBtnGraficos");
  const pageGerenciamento = document.getElementById("page-gerenciamento");
  const pageGraficos = document.getElementById("page-graficos");
  const listaTransacoes = document.getElementById("listaTransacoes");
  const paginacaoContainer = document.getElementById("paginacao");
  const toastContainer = document.getElementById("toast-container");
  const modalContainer = document.getElementById("modal-container");
  const modalTexto = document.getElementById("modal-texto");
  const modalConfirmar = document.getElementById("modal-confirmar");
  const modalCancelar = document.getElementById("modal-cancelar");
  const toggleDarkModeBtn = document.getElementById("toggleDarkModeBtn");
  const addValorBtn = document.getElementById("addValorBtn");
  const limparHistoricoBtn = document.getElementById("limparHistoricoBtn");
  const exportarDadosBtn = document.getElementById("exportarDadosBtn");
  const importarDadosInput = document.getElementById("importarDadosInput");
  const modalRecorrenteContainer = document.getElementById(
    "modal-recorrente-container"
  );
  const formRecorrente = document.getElementById("formRecorrente");
  const btnGerenciarRecorrentes = document.getElementById(
    "btnGerenciarRecorrentes"
  );
  const modalRecorrenteFechar = document.getElementById(
    "modal-recorrente-fechar"
  );
  const listaRecorrentesContainer =
    document.getElementById("lista-recorrentes");

  // --- FUNÇÕES DE UTILIDADE ---
  const formatarMoeda = (valor) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(isNaN(valor) ? 0 : valor);

  const formatarData = (dateInput) => {
    if (!dateInput) return "-";
    try {
      const [year, month, day] = dateInput.split("-");
      const date = new Date(Date.UTC(year, month - 1, day));
      if (isNaN(date.getTime())) return "-";
      return date.toLocaleDateString("pt-BR", {
        timeZone: "UTC"
      });
    } catch (e) {
      console.error("Erro ao formatar a data:", e);
      return "-";
    }
  };

  const dateToYYYYMMDD = (dateInput) => {
    if (!dateInput) return null;
    if (dateInput instanceof Date && !isNaN(dateInput)) {
      const date = new Date(
        dateInput.getTime() - dateInput.getTimezoneOffset() * 60000
      );
      return date.toISOString().split("T")[0];
    }
    if (
      typeof dateInput === "string" &&
      dateInput.match(/^\d{2}\/\d{2}\/\d{4}$/)
    ) {
      const [d, m, y] = dateInput.split("/");
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
    if (
      typeof dateInput === "string" &&
      dateInput.match(/^\d{4}-\d{2}-\d{2}$/)
    ) {
      return dateInput;
    }
    return null;
  };

  // --- MÓDULO DE UX (MODAIS E TOASTS) ---
  const mostrarToast = (mensagem, tipo = "success") => {
    const toast = document.createElement("div");
    toast.className = `toast ${tipo}`;
    toast.textContent = mensagem;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const mostrarModal = (texto) => {
    return new Promise((resolve) => {
      modalTexto.textContent = texto;
      modalContainer.classList.remove("modal-hidden");
      const resolver = (value) => {
        modalContainer.classList.add("modal-hidden");
        modalConfirmar.onclick = null;
        modalCancelar.onclick = null;
        resolve(value);
      };
      modalConfirmar.onclick = () => resolver(true);
      modalCancelar.onclick = () => resolver(false);
    });
  };

  const abrirModalRecorrentes = () => {
    renderizarListaRecorrentes();
    modalRecorrenteContainer.classList.remove("modal-hidden");
  };
  const fecharModalRecorrentes = () =>
    modalRecorrenteContainer.classList.add("modal-hidden");

  // --- NAVEGAÇÃO DE PÁGINA ---
  const mostrarPagina = (pagina) => {
    pageGerenciamento.classList.toggle(
      "page-hidden",
      pagina !== "gerenciamento"
    );
    pageGraficos.classList.toggle("page-hidden", pagina !== "graficos");
    navBtnGerenciamento.classList.toggle("active", pagina === "gerenciamento");
    navBtnGraficos.classList.toggle("active", pagina !== "gerenciamento");

    if (pagina === "graficos") {
      atualizarGrafico();
      atualizarPrevisaoSaldo();
    }
  };

  // --- LÓGICA DE DADOS ---
  const salvarTransacoes = () =>
    localStorage.setItem("transacoes", JSON.stringify(transacoes));
  const salvarRecorrentes = () =>
    localStorage.setItem(
      "lancamentosRecorrentes",
      JSON.stringify(lancamentosRecorrentes)
    );
  const salvarModoEscuro = (isDarkMode) =>
    localStorage.setItem("darkMode", isDarkMode);

  const carregarDadosIniciais = () => {
    try {
      const transacoesSalvas = localStorage.getItem("transacoes");
      transacoes = transacoesSalvas ?
        JSON.parse(transacoesSalvas).map((t) => ({ ...t,
          id: Number(t.id)
        })) :
        [];
      const recorrentesSalvos = localStorage.getItem("lancamentosRecorrentes");
      lancamentosRecorrentes = recorrentesSalvos ?
        JSON.parse(recorrentesSalvos) :
        [];
    } catch (e) {
      console.error("Erro ao carregar dados:", e);
      transacoes = [];
      lancamentosRecorrentes = [];
    }
    gerarTransacoesRecorrentes();
  };

  // --- LÓGICA DE LANÇAMENTOS RECORRENTES ---
  const gerarTransacoesRecorrentes = () => {
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();
    let novasTransacoesGeradas = false;

    lancamentosRecorrentes.forEach((recorrente) => {
      const dataLancamento = new Date(anoAtual, mesAtual, recorrente.dia);
      const jaExiste = transacoes.some(
        (t) =>
        t.recorrenteId === recorrente.id &&
        new Date(t.data + "T00:00:00").getUTCMonth() === mesAtual &&
        new Date(t.data + "T00:00:00").getUTCFullYear() === anoAtual
      );

      if (!jaExiste && dataLancamento <= hoje) {
        transacoes.push({
          id: Date.now() + Math.random(),
          tipo: `${recorrente.tipo} recorrente`,
          data: dataLancamento.toISOString().split("T")[0],
          valor: recorrente.valor,
          detalhes: [{
            valor: recorrente.valor,
            obs: `Recorrente: ${recorrente.obs}`
          }, ],
          recorrenteId: recorrente.id,
        });
        novasTransacoesGeradas = true;
      }
    });

    if (novasTransacoesGeradas) {
      mostrarToast("Lançamentos recorrentes automáticos foram adicionados!");
      salvarTransacoes();
    }
  };

  const adicionarRecorrente = (e) => {
    e.preventDefault();
    const tipo = document.getElementById("tipoRecorrente").value;
    const obs = document.getElementById("obsRecorrente").value;
    const valor = parseFloat(document.getElementById("valorRecorrente").value);
    const dia = parseInt(document.getElementById("diaRecorrente").value);

    if (!obs || isNaN(valor) || isNaN(dia))
      return mostrarToast("Por favor, preencha todos os campos.", "error");

    lancamentosRecorrentes.push({
      id: Date.now(),
      tipo,
      obs,
      valor,
      dia
    });
    salvarRecorrentes();
    renderizarListaRecorrentes();
    document.getElementById("formRecorrente").reset();
    mostrarToast("Lançamento recorrente adicionado!");
  };

  const removerRecorrente = (id) => {
    lancamentosRecorrentes = lancamentosRecorrentes.filter((r) => r.id !== id);
    salvarRecorrentes();
    renderizarListaRecorrentes();
    mostrarToast("Lançamento recorrente removido.");
  };

  const renderizarListaRecorrentes = () => {
    listaRecorrentesContainer.innerHTML = "";
    if (lancamentosRecorrentes.length === 0) {
      listaRecorrentesContainer.innerHTML =
        '<p style="text-align:center; opacity: 0.7;">Nenhum lançamento recorrente.</p>';
      return;
    }
    lancamentosRecorrentes.forEach((r) => {
      const item = document.createElement("div");
      item.className = "item-recorrente";
      item.innerHTML = `
                <div class="item-recorrente-info">
                    <span>${r.obs} (Todo dia ${r.dia})</span>
                    <div class="item-recorrente-valor ${
                      r.tipo
                    }">${formatarMoeda(r.valor)}</div>
                </div>
                <button class="btn-remover-recorrente" data-id="${
                  r.id
                }" title="Remover">&times;</button>`;
      listaRecorrentesContainer.appendChild(item);
      item
        .querySelector(".btn-remover-recorrente")
        .addEventListener("click", (e) =>
          removerRecorrente(Number(e.currentTarget.dataset.id))
        );
    });
  };

  // --- ATUALIZAÇÃO DA INTERFACE ---
  const atualizarTudo = () => {
    configurarFiltros();
    const transacoesFiltradas = aplicarFiltros();
    atualizarResumo(transacoes);
    atualizarTabela(transacoesFiltradas);
    renderPaginacao(transacoesFiltradas);
    if (!pageGraficos.classList.contains("page-hidden")) {
      atualizarGrafico();
      atualizarPrevisaoSaldo();
    }
    salvarTransacoes();
  };

  const atualizarResumo = (transacoesParaResumo) => {
    const totalEntradas = transacoesParaResumo
      .filter((t) => t.tipo.startsWith("entrada"))
      .reduce((sum, t) => sum + t.valor, 0);
    const totalSaidas = transacoesParaResumo
      .filter((t) => t.tipo.startsWith("saida"))
      .reduce((sum, t) => sum + t.valor, 0);
    document.getElementById("totalEntradas").textContent =
      formatarMoeda(totalEntradas);
    document.getElementById("totalSaidas").textContent =
      formatarMoeda(totalSaidas);
    document.getElementById("saldoTotal").textContent = formatarMoeda(
      totalEntradas - totalSaidas
    );
  };

  const atualizarTabela = (transacoesParaExibir) => {
    listaTransacoes.innerHTML = "";
    const tipoOrdem = {
      "entrada almoço": 1,
      "saida almoço": 2,
      "entrada jantar": 3,
      "saida jantar": 4,
    };
    const inicio = (currentPage - 1) * itemsPerPage;
    const fim = inicio + itemsPerPage;
    const itensPaginados = [...transacoesParaExibir]
      .sort(
        (a, b) =>
        // MELHORIA: Alterado de b-a para a-b para ordem cronológica (crescente)
        new Date(a.data) - new Date(b.data) ||
        (tipoOrdem[a.tipo] || 99) - (tipoOrdem[b.tipo] || 99)
      )
      .slice(inicio, fim);

    itensPaginados.forEach((transacao) => {
      // MELHORIA: Lógica de detalhes simplificada e mais limpa.
      const detalhesList = transacao.detalhes || [];
      const detalhesTexto = detalhesList
        .map((d) => {
          const valorFormatado = d.valor.toFixed(2).replace(".", ",");
          return d.obs ? `${valorFormatado} (${d.obs})` : valorFormatado;
        })
        .join("\n");

      const tr = document.createElement("tr");
      tr.innerHTML = `
                <td>${formatarData(transacao.data)}</td>
                <td>${transacao.tipo
                  .split(" ")
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(" ")}</td>
                <td>${formatarMoeda(transacao.valor)}</td>
                <td title="${detalhesTexto}">${detalhesTexto || "-"}</td>
                <td>
                    <button class="btn-tabela editar" data-id="${
                      transacao.id
                    }" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="btn-tabela excluir" data-id="${
                      transacao.id
                    }" title="Remover"><i class="fas fa-trash-alt"></i></button>
                </td>`;
      listaTransacoes.appendChild(tr);
    });
  };

  const renderPaginacao = (transacoesFiltradas) => {
    const totalPaginas = Math.ceil(transacoesFiltradas.length / itemsPerPage);
    paginacaoContainer.innerHTML = "";
    if (totalPaginas <= 1) return;
    paginacaoContainer.innerHTML = `
            <button id="btnAnterior" class="btn btn-secondary">&laquo; Anterior</button>
            <span id="paginaInfo">Página ${currentPage} de ${totalPaginas}</span>
            <button id="btnProximo" class="btn btn-secondary">Próximo &raquo;</button>`;
    const btnAnterior = document.getElementById("btnAnterior");
    const btnProximo = document.getElementById("btnProximo");
    btnAnterior.disabled = currentPage === 1;
    btnProximo.disabled = currentPage === totalPaginas;
    btnAnterior.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        atualizarTudo();
      }
    });
    btnProximo.addEventListener("click", () => {
      if (currentPage < totalPaginas) {
        currentPage++;
        atualizarTudo();
      }
    });
  };

  // --- GRÁFICOS ---
  const atualizarGrafico = () => {
    const anoSelecionado = filtroAnoGrafico.value;
    if (!anoSelecionado) return;
    const dados = {
      entradas: Array(12).fill(0),
      saidas: Array(12).fill(0)
    };
    transacoes
      .filter((t) => t.data.startsWith(anoSelecionado))
      .forEach((t) => {
        const mes = parseInt(t.data.substring(5, 7), 10) - 1;
        if (t.tipo.startsWith("entrada")) dados.entradas[mes] += t.valor;
        else dados.saidas[mes] += t.valor;
      });
    const ctx = document.getElementById("resumoMensalChart").getContext("2d");
    if (resumoMensalChart) resumoMensalChart.destroy();
    resumoMensalChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: [
          "Jan",
          "Fev",
          "Mar",
          "Abr",
          "Mai",
          "Jun",
          "Jul",
          "Ago",
          "Set",
          "Out",
          "Nov",
          "Dez",
        ],
        datasets: [{
          label: "Entradas",
          data: dados.entradas,
          backgroundColor: "rgba(76, 175, 80, 0.5)",
          borderColor: "rgba(76, 175, 80, 1)",
          borderWidth: 1,
        }, {
          label: "Saídas",
          data: dados.saidas,
          backgroundColor: "rgba(244, 67, 54, 0.5)",
          borderColor: "rgba(244, 67, 54, 1)",
          borderWidth: 1,
        }, ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => formatarMoeda(value)
            },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) =>
                `${context.dataset.label}: ${formatarMoeda(context.raw)}`,
            },
          },
        },
      },
    });
  };

  const atualizarPrevisaoSaldo = () => {
    const saldoAtual = transacoes.reduce(
      (acc, t) => acc + (t.tipo.startsWith("entrada") ? t.valor : -t.valor),
      0
    );
    const previsoes = [];
    let saldoProjetado = saldoAtual;
    const hoje = new Date();
    for (let i = 0; i < 6; i++) {
      const mesFuturo = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
      let entradasMes = 0;
      let saidasMes = 0;
      lancamentosRecorrentes.forEach((r) => {
        if (r.tipo === "entrada") entradasMes += r.valor;
        else saidasMes += r.valor;
      });
      if (i > 0) saldoProjetado += entradasMes - saidasMes;
      previsoes.push({
        mes: mesFuturo.toLocaleString("pt-BR", {
          month: "short",
          year: "2-digit",
        }),
        saldo: i === 0 ? saldoAtual : saldoProjetado,
      });
    }
    const ctx = document.getElementById("previsaoSaldoChart").getContext("2d");
    if (previsaoSaldoChart) previsaoSaldoChart.destroy();
    previsaoSaldoChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: previsoes.map((p) => p.mes),
        datasets: [{
          label: "Saldo Projetado",
          data: previsoes.map((p) => p.saldo),
          borderColor: "rgba(44, 93, 138, 0.8)",
          backgroundColor: "rgba(44, 93, 138, 0.2)",
          fill: true,
          tension: 0.1,
        }, ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: false,
            ticks: {
              callback: (value) => formatarMoeda(value)
            },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => `Saldo: ${formatarMoeda(context.raw)}`,
            },
          },
        },
      },
    });
  };

  // --- FILTROS ---
  const configurarFiltros = () => {
    const anos = [
      ...new Set(transacoes.map((t) => t.data.substring(0, 4))),
    ].sort((a, b) => b - a);
    const anoAtual = new Date().getFullYear().toString();
    if (!anos.includes(anoAtual)) anos.unshift(anoAtual);
    [filtroAno, filtroAnoGrafico].forEach((filtro) => {
      const valorSelecionado = filtro.value;
      filtro.innerHTML = "";
      anos.forEach((ano) => filtro.add(new Option(ano, ano)));
      if (anos.includes(valorSelecionado)) filtro.value = valorSelecionado;
    });
    const mesSelecionado = filtroMes.value;
    filtroMes.innerHTML = '<option value="todos">Todos os Meses</option>';
    for (let i = 0; i < 12; i++) {
      const nomeMes = new Date(2000, i).toLocaleString("pt-BR", {
        month: "long",
      });
      filtroMes.add(
        new Option(nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1), i)
      );
    }
    filtroMes.value = mesSelecionado || "todos";
  };
  const aplicarFiltros = () => {
    const ano = filtroAno.value;
    const mes = filtroMes.value;
    if (!ano) return [];
    return transacoes.filter((t) => {
      const anoMatch = t.data.startsWith(ano);
      const mesMatch =
        mes === "todos" || parseInt(t.data.substring(5, 7), 10) - 1 == mes;
      return anoMatch && mesMatch;
    });
  };

  // --- AÇÕES DO USUÁRIO ---
  const adicionarCampoValor = (valor = "", obs = "") => {
    const newGroup = document.createElement("div");
    newGroup.className = "valor-obs-group";
    newGroup.innerHTML = `
            <input type="number" class="valor-transacao" value="${valor}" placeholder="0,00" step="0.01" required>
            <input type="text" class="obs-valor" value="${obs}" placeholder="Observação para este valor">
            <button type="button" class="btn-remove-valor" title="Remover Valor">&times;</button>`;
    valorObsContainer.appendChild(newGroup);
    newGroup
      .querySelector(".btn-remove-valor")
      .addEventListener("click", (e) => {
        if (valorObsContainer.childElementCount > 1)
          e.target.closest(".valor-obs-group").remove();
        else
          mostrarToast(
            "É necessário ter pelo menos um campo de valor.",
            "error"
          );
      });
    // MELHORIA: Foca no novo campo de valor se não houver um elemento ativo
    if (document.activeElement.tagName !== "INPUT") {
      newGroup.querySelector(".valor-transacao").focus();
    }
  };

  // MELHORIA: Mantém a data ao limpar o formulário.
  const limparFormulario = () => {
    const dataAtual = dataTransacaoInput.value;
    editandoTransacaoId = null;
    form.reset();
    valorObsContainer.innerHTML = "";
    adicionarCampoValor();
    dataTransacaoInput.value = dataAtual;
    formBtn.innerHTML = `<i class="fas fa-plus-circle"></i> Adicionar Transação`;
    formSection.classList.remove("editing");
  };

  const adicionarOuAtualizarTransacao = () => {
    const tipo = tipoTransacaoInput.value;
    const data = dataTransacaoInput.value;
    let valorTotal = 0;
    const detalhes = [];
    let erroValidacao = null;
    document.querySelectorAll(".valor-obs-group").forEach((group) => {
      if (erroValidacao) return;
      const valorInput = group.querySelector(".valor-transacao");
      if (valorInput.value === "") return;
      const valor = parseFloat(valorInput.value.replace(",", "."));
      const obs = group.querySelector(".obs-valor").value.trim();
      if (isNaN(valor) || valor < 0) erroValidacao = "Valor inválido.";
      else if (tipo.startsWith("saida") && valor > 0 && !obs)
        erroValidacao = "Saídas com valor > 0 exigem observação.";
      else {
        valorTotal += valor;
        detalhes.push({
          valor,
          obs
        });
      }
    });
    if (erroValidacao) return mostrarToast(erroValidacao, "error");
    if (!tipo || !data || detalhes.length === 0)
      return mostrarToast(
        "Preencha tipo, data e pelo menos um valor.",
        "error"
      );
    if (editandoTransacaoId !== null) {
      const index = transacoes.findIndex((t) => t.id === editandoTransacaoId);
      if (index > -1) {
        transacoes[index] = {
          ...transacoes[index],
          tipo,
          data,
          valor: valorTotal,
          detalhes,
        };
        mostrarToast("Transação atualizada!");
      }
    } else {
      transacoes.push({
        id: Date.now(),
        tipo,
        data,
        valor: valorTotal,
        detalhes,
      });
      mostrarToast("Transação adicionada!");
    }
    limparFormulario();
    configurarFiltros();
    atualizarTudo();
  };
  const editarTransacao = (id) => {
    mostrarPagina("gerenciamento");
    const transacao = transacoes.find((t) => t.id === id);
    if (!transacao) return;
    editandoTransacaoId = id;
    tipoTransacaoInput.value = transacao.tipo;
    dataTransacaoInput.value = transacao.data;
    valorObsContainer.innerHTML = "";
    (transacao.detalhes.length ?
      transacao.detalhes :
      [{
        valor: transacao.valor,
        obs: ""
      }]
    ).forEach((d) => adicionarCampoValor(d.valor, d.obs || ""));
    formBtn.innerHTML = `<i class="fas fa-save"></i> Atualizar Transação`;
    formSection.classList.add("editing");
    formSection.scrollIntoView({
      behavior: "smooth"
    });
  };
  const removerTransacao = async (id) => {
    const confirmado = await mostrarModal(
      "Tem certeza que deseja remover esta transação?"
    );
    if (confirmado) {
      transacoes = transacoes.filter((t) => t.id !== id);
      const transacoesFiltradas = aplicarFiltros();
      const totalPaginas =
        Math.ceil(transacoesFiltradas.length / itemsPerPage) || 1;
      if (currentPage > totalPaginas) currentPage = totalPaginas;
      atualizarTudo();
      mostrarToast("Transação removida.");
    }
  };
  const limparHistorico = async () => {
    const confirmado = await mostrarModal(
      "Limpar todo o histórico? Esta ação é irreversível."
    );
    if (confirmado) {
      transacoes = [];
      currentPage = 1;
      atualizarTudo();
      mostrarToast("Histórico limpo com sucesso.");
    }
  };

  // --- IMPORTAÇÃO / EXPORTAÇÃO ---
  const exportarDados = () => {
    if (typeof XLSX === "undefined")
      return mostrarToast("Biblioteca de exportação não carregada.", "error");
    const transacoesParaExportar = aplicarFiltros();
    if (transacoesParaExportar.length === 0)
      return mostrarToast(
        "Não há dados nos filtros atuais para exportar.",
        "error"
      );

    const dados = transacoesParaExportar.map((t) => ({
      data: formatarData(t.data),
      tipo: t.tipo,
      // CORREÇÃO: Exportar o valor como número puro.
      valor: t.valor,
      detalhes: (t.detalhes || [])
      .map((d) =>
        d.valor === 0 && !d.obs ?
        "0,00" :
        `${d.valor.toFixed(2).replace(".", ",")} (${d.obs || ""})`
      )
      .join("; "),
    }));

    const worksheet = XLSX.utils.json_to_sheet(dados);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transacoes");

    // MELHORIA: Nome de arquivo dinâmico.
    const dataAtual = new Date();
    const dia = String(dataAtual.getDate()).padStart(2, "0");
    const mes = String(dataAtual.getMonth() + 1).padStart(2, "0");
    const ano = String(dataAtual.getFullYear()).slice(-2);
    const hora = String(dataAtual.getHours()).padStart(2, "0");
    const minuto = String(dataAtual.getMinutes()).padStart(2, "0");
    const nomeArquivo = `Caixa ${dia}${mes}${ano}-${hora}h${minuto}.xlsx`;

    XLSX.writeFile(workbook, nomeArquivo);
  };
  const importarDados = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const workbook = XLSX.read(new Uint8Array(e.target.result), {
          type: "array",
          cellDates: true,
        });
        const jsonData = XLSX.utils.sheet_to_json(
          workbook.Sheets[workbook.SheetNames[0]]
        );
        if (jsonData.length === 0)
          return mostrarToast("Arquivo vazio ou inválido.", "error");

        const novasTransacoes = jsonData
          .map((row) => {
            const dataFormatada = dateToYYYYMMDD(row.data);
            // CORREÇÃO: Trata tanto números quanto texto com vírgula.
            const valorNumerico = parseFloat(
              String(row.valor).replace(",", ".")
            );

            if (!row.tipo || !dataFormatada || isNaN(valorNumerico))
              return null;

            const detalhes = [];
            if (row.detalhes && typeof row.detalhes === "string") {
              row.detalhes.split(";").forEach((d) => {
                const match = d.trim().match(/([\d,.-]+)\s*\((.*)\)/);
                if (match) {
                  detalhes.push({
                    valor: parseFloat(match[1].replace(",", ".")),
                    obs: match[2],
                  });
                } else if (!isNaN(parseFloat(d.replace(",", ".")))) {
                  detalhes.push({
                    valor: parseFloat(d.replace(",", ".")),
                    obs: "",
                  });
                }
              });
            }

            return {
              id: Date.now() + Math.random(), // Evita colisão de IDs
              tipo: row.tipo,
              data: dataFormatada,
              valor: valorNumerico,
              detalhes: detalhes.length ?
                detalhes :
                [{
                  valor: valorNumerico,
                  obs: ""
                }],
            };
          })
          .filter(Boolean);

        if (novasTransacoes.length === 0)
          return mostrarToast("Nenhuma transação válida encontrada.", "error");

        // MELHORIA: Texto do modal mais claro.
        const confirmado = await mostrarModal(
          "Deseja ADICIONAR os dados importados ao histórico existente? Clicar em 'Cancelar' irá SUBSTITUIR o histórico atual pelos dados do arquivo."
        );

        if (confirmado) transacoes.push(...novasTransacoes);
        else transacoes = novasTransacoes;

        configurarFiltros();
        atualizarTudo();
        mostrarToast(
          `Dados importados! ${novasTransacoes.length} transações processadas.`
        );
      } catch (error) {
        console.error("Erro ao importar:", error);
        mostrarToast(
          "Ocorreu um erro ao importar o arquivo. Verifique se é uma planilha válida.",
          "error"
        );
      } finally {
        event.target.value = "";
      }
    };
    reader.readAsArrayBuffer(file);
  };
  // --- MODO ESCURO ---
  const gerenciarModoEscuro = () => {
    const prefereEscuro =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    const modoSalvo = localStorage.getItem("darkMode");
    const setModo = (isDark) => {
      document.body.classList.toggle("dark-mode", isDark);
      toggleDarkModeBtn.innerHTML = isDark ?
        `<i class="fas fa-sun"></i>` :
        `<i class="fas fa-moon"></i>`;
      salvarModoEscuro(isDark);
      if (resumoMensalChart) atualizarGrafico();
      if (previsaoSaldoChart) atualizarPrevisaoSaldo();
    };
    setModo(modoSalvo === "true" || (modoSalvo === null && prefereEscuro));
  };

  // --- INICIALIZAÇÃO E EVENT LISTENERS ---
  const adicionarEventListeners = () => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      adicionarOuAtualizarTransacao();
    });

    addValorBtn.addEventListener("click", () => adicionarCampoValor());

    listaTransacoes.addEventListener("click", (e) => {
      const target = e.target.closest("button");
      if (!target) return;
      const id = parseInt(target.dataset.id, 10);
      if (target.classList.contains("excluir")) removerTransacao(id);
      else if (target.classList.contains("editar")) editarTransacao(id);
    });

    limparHistoricoBtn.addEventListener("click", limparHistorico);
    exportarDadosBtn.addEventListener("click", exportarDados);
    importarDadosInput.addEventListener("change", importarDados);

    filtroAno.addEventListener("change", () => {
      currentPage = 1;
      atualizarTudo();
    });
    filtroMes.addEventListener("change", () => {
      currentPage = 1;
      atualizarTudo();
    });
    filtroAnoGrafico.addEventListener("change", atualizarGrafico);

    navBtnGerenciamento.addEventListener("click", () =>
      mostrarPagina("gerenciamento")
    );
    navBtnGraficos.addEventListener("click", () => mostrarPagina("graficos"));

    toggleDarkModeBtn.addEventListener("click", () => {
      const isDark = document.body.classList.toggle("dark-mode");
      salvarModoEscuro(isDark);
      toggleDarkModeBtn.innerHTML = isDark ?
        `<i class="fas fa-sun"></i>` :
        `<i class="fas fa-moon"></i>`;
      if (!pageGraficos.classList.contains("page-hidden")) {
        atualizarGrafico();
        atualizarPrevisaoSaldo();
      }
    });

    btnGerenciarRecorrentes.addEventListener("click", abrirModalRecorrentes);
    modalRecorrenteFechar.addEventListener("click", fecharModalRecorrentes);
    formRecorrente.addEventListener("submit", adicionarRecorrente);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (!modalContainer.classList.contains("modal-hidden")) {
          modalContainer.classList.add("modal-hidden");
        }
        if (!modalRecorrenteContainer.classList.contains("modal-hidden")) {
          fecharModalRecorrentes();
        }
      }
    });

    modalRecorrenteContainer.addEventListener("click", (e) => {
      if (e.target === modalRecorrenteContainer) {
        fecharModalRecorrentes();
      }
    });
  };

  // --- FUNÇÃO DE INICIALIZAÇÃO DA APLICAÇÃO ---
  const iniciarApp = () => {
    carregarDadosIniciais();
    adicionarEventListeners();
    configurarFiltros();
    gerenciarModoEscuro();
    atualizarTudo();
    mostrarPagina("gerenciamento");
  };

  // --- PONTO DE PARTIDA ---
  iniciarApp();
});
// --- FIM DO SCRIPT ---
