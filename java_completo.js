// ===========================================
// CONFIGURAÇÃO E VARIÁVEIS GLOBAIS
// ===========================================

// Variáveis de Armazenamento Local (Inicialização)
// O operador '|| []' garante que, se não houver dados no localStorage, ele inicialize com um array vazio.
let estoque = JSON.parse(localStorage.getItem('estoque')) || [];
let historicoVendas = JSON.parse(localStorage.getItem('historicoVendas')) || [];
let clientes = JSON.parse(localStorage.getItem('clientes')) || [];
let compromissos = JSON.parse(localStorage.getItem('compromissos')) || [];
let lancamentosCaixa = JSON.parse(localStorage.getItem('lancamentosCaixa')) || [];
let plataformas = JSON.parse(localStorage.getItem('plataformas')) || [
    { id: 1, nome: 'Mercado Livre', taxa: 16.5 },
    { id: 2, nome: 'Shopee', taxa: 18.0 },
    { id: 3, nome: 'Venda Direta', taxa: 0.0 }
];
let configCalculadora = JSON.parse(localStorage.getItem('configCalculadora')) || {
    margemLucroPadrao: 30
};

// ===========================================
// FUNÇÕES UTILITÁRIAS
// ===========================================

function formatoValor(valor) {
    // Garante que o valor seja um número antes de formatar
    return parseFloat(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarDataBrasileira(dataISO) {
    if (!dataISO) return '';
    // Converte de YYYY-MM-DD para DD/MM/YYYY
    const [year, month, day] = dataISO.split('-');
    return `${day}/${month}/${year}`;
}

function mostrarToast(mensagem, tipo = 'info') {
    const toast = document.getElementById('toast');
    toast.className = `show ${tipo}`;
    toast.innerText = mensagem;
    setTimeout(() => {
        toast.className = toast.className.replace('show', '');
    }, 3000);
}

// ===========================================
// FUNÇÕES DE PERSISTÊNCIA (SALVAR/CARREGAR)
// ESSENCIAL PARA O FUNCIONAMENTO DO SISTEMA
// ===========================================

function salvarEstoque() { localStorage.setItem('estoque', JSON.stringify(estoque)); }
function salvarHistoricoVendas() { localStorage.setItem('historicoVendas', JSON.stringify(historicoVendas)); }
function salvarClientes() { localStorage.setItem('clientes', JSON.stringify(clientes)); }
function salvarCompromissos() { localStorage.setItem('compromissos', JSON.stringify(compromissos)); }
function salvarPlataformas() { localStorage.setItem('plataformas', JSON.stringify(plataformas)); }
function salvarLancamentosCaixa() { localStorage.setItem('lancamentosCaixa', JSON.stringify(lancamentosCaixa)); }
function salvarConfigCalculadora() { localStorage.setItem('configCalculadora', JSON.stringify(configCalculadora)); }


// ===========================================
// FUNÇÕES DE NAVEGAÇÃO E UI
// ===========================================

function mudarPagina(pageId) {
    document.querySelectorAll('.page-content').forEach(page => {
        page.style.display = 'none';
    });

    const paginaAtiva = document.getElementById(pageId);
    if (paginaAtiva) {
        paginaAtiva.style.display = 'block';
        let titleElement = paginaAtiva.querySelector('h2') || paginaAtiva.querySelector('h1');
        if (titleElement) {
            document.getElementById('pageTitle').innerText = titleElement.innerText.split('/')[0].trim();
        }
    }

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`.nav-link[onclick="mudarPagina('${pageId}')"]`)?.classList.add('active');


    // **CHAMADAS DE ATUALIZAÇÃO AO TROCAR DE PÁGINA**
    if (pageId === 'paginaDashboard') {
        atualizarDashboard();
    } else if (pageId === 'paginaEstoque') {
        carregarEstoque();
        carregarClientesParaMovimentacao();
    } else if (pageId === 'paginaHistoricoVendas') {
        carregarHistoricoVendas();
    } else if (pageId === 'paginaCalculadora') {
        carregarPlataformasSelect('selectPlataforma');
        calcularVendaReversa();
    } else if (pageId === 'paginaClientes') {
        carregarClientes();
        fecharDetalhesCliente();
    } else if (pageId === 'paginaAgenda') {
        carregarCompromissos();
    } else if (pageId === 'paginaConfiguracoes') {
        carregarPlataformas();
    } else if (pageId === 'paginaFluxoCaixa') {
        // Define a data atual como filtro padrão ao abrir o Fluxo de Caixa
        const today = new Date().toISOString().substring(0, 7);
        document.getElementById('filtroMesFluxo').value = today;
        carregarFluxoCaixa();
    }
}

function toggleSidebar() {
    document.body.classList.toggle('sidebar-recolhida');
    const isRecolhida = document.body.classList.contains('sidebar-recolhida');
    localStorage.setItem('sidebarRecolhida', isRecolhida);
}

function toggleDarkMode(salvar = false) {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');

    const themeIcon = document.getElementById('themeToggle').querySelector('.material-icons');
    themeIcon.innerText = isDark ? 'light_mode' : 'dark_mode';

    const checkbox = document.getElementById('darkModeToggle');
    if (checkbox) {
        checkbox.checked = isDark;
    }

    if (salvar) {
        localStorage.setItem('darkModeEnabled', isDark);
    }
}

// ===========================================
// AUTENTICAÇÃO
// ===========================================
function checarLogin() {
    const senhaSalva = localStorage.getItem('senhaMestra');
    const loginOverlay = document.getElementById('loginOverlay');
    const configSenhaInicial = document.getElementById('configSenhaInicial');

    if (!senhaSalva) {
        loginOverlay.style.display = 'flex';
        configSenhaInicial.style.display = 'block';
    } else if (localStorage.getItem('loginLembrado') === 'true') {
        loginOverlay.style.display = 'none';
        mudarPagina('paginaDashboard');
    } else {
        loginOverlay.style.display = 'flex';
        configSenhaInicial.style.display = 'none';
    }
}

function acessarSistema() {
    const inputSenha = document.getElementById('inputSenhaMestra').value.trim();
    const senhaSalva = localStorage.getItem('senhaMestra');
    const lembrar = document.getElementById('salvarSenhaCheckbox').checked;

    if (!senhaSalva) {
        if (inputSenha.length < 4) {
            mostrarToast('A senha mestra deve ter no mínimo 4 caracteres.', 'error');
            return;
        }
        localStorage.setItem('senhaMestra', inputSenha);
        localStorage.setItem('loginLembrado', lembrar);
        mostrarToast('Senha Mestra configurada com sucesso!', 'success');

    } else if (inputSenha !== senhaSalva) {
        mostrarToast('Senha incorreta, tente novamente.', 'error');
        document.getElementById('inputSenhaMestra').value = '';
        return;
    }

    localStorage.setItem('loginLembrado', lembrar);
    document.getElementById('loginOverlay').style.display = 'none';
    document.getElementById('inputSenhaMestra').value = '';
    mudarPagina('paginaDashboard');
}

// ===========================================
// FUNÇÕES DASHBOARD
// ===========================================

function atualizarDashboard() {
    // 1. Calcular Lucro Total (Histórico de Vendas)
    let totalLucroBruto = historicoVendas.reduce((total, venda) => {
        return total + (venda.lucroBruto || 0);
    }, 0);
    document.getElementById('dashboardLucroTotal').innerText = formatoValor(totalLucroBruto);

    // 2. Calcular Saldo Atual de Caixa (Fluxo de Caixa)
    let totalReceitas = lancamentosCaixa.filter(l => l.tipo === 'receita').reduce((sum, l) => sum + l.valor, 0);
    let totalDespesas = lancamentosCaixa.filter(l => l.tipo === 'despesa').reduce((sum, l) => sum + l.valor, 0);
    let saldoCaixa = totalReceitas - totalDespesas;

    const saldoElement = document.getElementById('dashboardSaldoCaixa');
    saldoElement.innerText = formatoValor(saldoCaixa);
    saldoElement.classList.remove('valor-positivo', 'valor-negativo');
    if (saldoCaixa >= 0) {
        saldoElement.classList.add('valor-positivo');
    } else {
        saldoElement.classList.add('valor-negativo');
    }

    // 3. Contar Alerta de Estoque
    let alertas = estoque.filter(p => p.quantidade <= p.estoqueMinimo).length;
    const alertaEstoqueElement = document.getElementById('dashboardAlertaEstoque');
    alertaEstoqueElement.innerText = alertas;
    alertaEstoqueElement.style.color = alertas > 0 ? 'var(--danger-color)' : 'var(--success-color)';
    alertaEstoqueElement.parentElement.style.borderLeftColor = alertas > 0 ? 'var(--danger-color)' : 'var(--success-color)';

    // 4. Contar Clientes
    document.getElementById('dashboardTotalClientes').innerText = clientes.length;
    // Atualiza o contador na página de clientes também
    document.querySelector('#paginaClientes #dashboardTotalClientes').innerText = clientes.length;


    // 5. Carregar Agenda Rápida (Somente HOJE)
    carregarCompromissosDashboard();
}

function carregarCompromissosDashboard() {
    const hoje = new Date().toISOString().substring(0, 10);
    const lista = document.getElementById('listaCompromissosDashboard');
    lista.innerHTML = '';

    const compromissosDeHoje = compromissos.filter(c => c.data === hoje && !c.concluido)
                                          .sort((a, b) => (a.hora || '24:00').localeCompare(b.hora || '24:00'));

    if (compromissosDeHoje.length === 0) {
        lista.innerHTML = '<li style="justify-content: center; color: var(--secondary-color); border: none;">Nenhum compromisso pendente para hoje.</li>';
        return;
    }

    compromissosDeHoje.slice(0, 5).forEach(c => { // Limita a 5 itens
        const linha = `
            <li class="list-group-item ${c.concluido ? 'concluido' : ''}" style="border-bottom: 1px solid var(--border-color); padding: 8px 0;">
                <span style="font-weight: 500;">${c.titulo}</span>
                <small style="color: var(--primary-color);">${c.hora || 'Dia Todo'}</small>
            </li>
        `;
        lista.innerHTML += linha;
    });

    if (compromissosDeHoje.length > 5) {
        lista.innerHTML += `<li style="justify-content: center; color: var(--info-color); border: none; padding-top: 8px;">...e mais ${compromissosDeHoje.length - 5} pendentes.</li>`;
    }
}


// ===========================================
// FUNÇÕES FLUXO DE CAIXA
// ===========================================

function adicionarLancamento() {
    const tipo = document.getElementById('tipoLancamento').value;
    const descricao = document.getElementById('descricaoLancamento').value.trim();
    const dataInput = document.getElementById('dataLancamento').value;
    const valorInput = document.getElementById('valorLancamento').value;
    const categoria = document.getElementById('categoriaLancamento').value;

    if (!descricao || !dataInput || parseFloat(valorInput) <= 0) {
        mostrarToast('Preencha todos os campos corretamente e o valor deve ser maior que zero.', 'error');
        return;
    }

    const novoLancamento = {
        id: Date.now(),
        tipo: tipo,
        descricao: descricao,
        data: dataInput,
        valor: parseFloat(valorInput),
        categoria: categoria
    };

    lancamentosCaixa.push(novoLancamento);
    salvarLancamentosCaixa();
    mostrarToast(`Lançamento de ${formatoValor(novoLancamento.valor)} (${tipo.toUpperCase()}) adicionado!`, 'success');

    // Recarrega a tabela e limpa o formulário
    carregarFluxoCaixa();
    document.getElementById('descricaoLancamento').value = '';
    document.getElementById('valorLancamento').value = '0.00';
    document.getElementById('dataLancamento').value = '';

    // Atualiza o dashboard, se necessário
    atualizarDashboard();
}

function carregarFluxoCaixa() {
    const tbody = document.querySelector('#tabelaFluxoCaixa tbody');
    tbody.innerHTML = '';

    const filtroMesInput = document.getElementById('filtroMesFluxo').value;

    let totalReceitas = 0;
    let totalDespesas = 0;

    // 1. Filtrar e Ordenar (mais recente primeiro)
    let lancamentosFiltrados = lancamentosCaixa.sort((a, b) => new Date(b.data) - new Date(a.data));

    if (filtroMesInput) {
        lancamentosFiltrados = lancamentosFiltrados.filter(lanc => {
            return lanc.data.substring(0, 7) === filtroMesInput;
        });
    }

    // 2. Renderizar e Calcular Totais
    if (lancamentosFiltrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--secondary-color);">Nenhum lançamento encontrado para o período.</td></tr>';
    } else {
        lancamentosFiltrados.forEach(lanc => {
            const isReceita = lanc.tipo === 'receita';
            const valorFormatado = formatoValor(lanc.valor);

            if (isReceita) {
                totalReceitas += lanc.valor;
            } else {
                totalDespesas += lanc.valor;
            }

            const linha = `
                <tr>
                    <td>${formatarDataBrasileira(lanc.data)}</td>
                    <td>${lanc.descricao} <small style="color: var(--secondary-color);">(${lanc.categoria})</small></td>
                    <td><span style="font-weight: bold; color: ${isReceita ? 'var(--success-color)' : 'var(--danger-color)'};">${isReceita ? 'ENTRADA' : 'SAÍDA'}</span></td>
                    <td style="text-align: right; font-weight: bold; color: ${isReceita ? 'var(--success-color)' : 'var(--danger-color)'};">${valorFormatado}</td>
                    <td style="text-align: center;">
                        <button class="btn btn-excluir btn-note-action" onclick="removerLancamento(${lanc.id})">
                            <i class="material-icons">delete</i>
                        </button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += linha;
        });
    }

    // 3. Atualizar Métricas
    const saldoFinal = totalReceitas - totalDespesas;

    document.getElementById('totalReceitas').innerText = formatoValor(totalReceitas);
    document.getElementById('totalDespesas').innerText = formatoValor(totalDespesas);

    const saldoElement = document.getElementById('saldoCaixa');
    saldoElement.innerText = formatoValor(saldoFinal);
    saldoElement.classList.remove('valor-positivo', 'valor-negativo');
    if (saldoFinal >= 0) {
        saldoElement.classList.add('valor-positivo');
    } else {
        saldoElement.classList.add('valor-negativo');
    }

    // Atualiza o dashboard globalmente
    atualizarDashboard();
}

function removerLancamento(id) {
    if (confirm('Tem certeza que deseja remover este lançamento do Fluxo de Caixa?')) {
        lancamentosCaixa = lancamentosCaixa.filter(lanc => lanc.id !== id);
        salvarLancamentosCaixa();
        mostrarToast('Lançamento removido.', 'warning');
        carregarFluxoCaixa();
    }
}

// Função de integração com vendas (para registro automático no Fluxo de Caixa)
function registrarReceitaDeVenda(data, valor, clienteNome, produtoNome, id) {
    const novaReceita = {
        id: id,
        tipo: 'receita',
        descricao: `Venda: ${produtoNome} para ${clienteNome || 'Cliente Não Identificado'}`,
        data: data,
        valor: valor,
        categoria: 'vendas'
    };

    // Previne duplicação se a venda já foi registrada
    if (!lancamentosCaixa.some(l => l.id === novaReceita.id)) {
        lancamentosCaixa.push(novaReceita);
        salvarLancamentosCaixa();
    }
}


// ===========================================
// FUNÇÕES POST-IT DIGITAL
// ===========================================

function toggleStickyNote() {
    const note = document.getElementById('stickyNote');
    const isVisible = note.style.display === 'flex';

    if (isVisible) {
        note.style.display = 'none';
    } else {
        note.style.display = 'flex';
        document.getElementById('noteContent').focus();
    }
}

function saveNoteContent() {
    const content = document.getElementById('noteContent').value;
    localStorage.setItem('stickyNoteContent', content);
}


// ===========================================
// FUNÇÕES ESTOQUE (PLACEHOLDERS/INCOMPLETAS)
// É NECESSÁRIO IMPLEMENTAR A LÓGICA COMPLETA DE CMP
// ===========================================

function adicionarProduto() {
    const nome = document.getElementById('nomeProduto').value.trim();
    const sku = document.getElementById('skuProduto').value.trim().toUpperCase();
    const min = parseInt(document.getElementById('estoqueMinimo').value) || 0;

    if (!nome || !sku) {
        mostrarToast('Nome e SKU/Código são obrigatórios.', 'error');
        return;
    }
    if (estoque.some(p => p.sku === sku)) {
        mostrarToast('SKU já cadastrado.', 'error');
        return;
    }

    const novoProduto = {
        sku: sku,
        nome: nome,
        estoqueMinimo: min,
        quantidade: 0,
        custoUnitario: 0.00 // Custo Médio Ponderado (CMP) inicial
    };

    estoque.push(novoProduto);
    salvarEstoque();
    mostrarToast(`Produto "${nome}" cadastrado com sucesso!`, 'success');
    
    // Limpar formulário e recarregar
    document.getElementById('nomeProduto').value = '';
    document.getElementById('skuProduto').value = '';
    carregarEstoque();
}

function carregarEstoque() {
    const tbody = document.querySelector('#tabelaEstoque tbody');
    tbody.innerHTML = '';
    const selectProduto = document.getElementById('movProduto');
    selectProduto.innerHTML = '<option value="">-- Selecione um produto --</option>';

    if (estoque.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--secondary-color);">Nenhum produto cadastrado.</td></tr>';
        return;
    }

    estoque.forEach(p => {
        // Alerta
        const alertaClasse = p.quantidade <= p.estoqueMinimo ? 'alerta-estoque' : '';
        const custoFormatado = formatoValor(p.custoUnitario);

        const linha = `
            <tr class="${alertaClasse}">
                <td>${p.sku}</td>
                <td>${p.nome}</td>
                <td style="text-align: center; font-weight: bold;">${p.quantidade}</td>
                <td style="text-align: center;">${p.estoqueMinimo}</td>
                <td>${custoFormatado}</td>
                <td style="text-align: center;">
                    <button class="btn btn-warning btn-note-action" onclick="abrirModalEditarProduto('${p.sku}')">
                        <i class="material-icons">edit</i>
                    </button>
                    <button class="btn btn-excluir btn-note-action" onclick="removerProduto('${p.sku}')">
                        <i class="material-icons">delete</i>
                    </button>
                </td>
            </tr>
        `;
        tbody.innerHTML += linha;
        
        // Preenche o Select de Movimentação
        selectProduto.innerHTML += `<option value="${p.sku}">${p.nome} (${p.sku})</option>`;
    });

    // Atualiza o dashboard ao carregar o estoque
    atualizarDashboard();
}

function carregarClientesParaMovimentacao() {
    const selectCliente = document.getElementById('movCliente');
    selectCliente.innerHTML = '<option value="">-- Cliente não informado --</option>';
    clientes.forEach(c => {
        selectCliente.innerHTML += `<option value="${c.id}">${c.nome} (${c.telefone})</option>`;
    });
}

function toggleMovimentacaoFields() {
    const tipo = document.getElementById('tipoMovimento').value;
    const containerCusto = document.getElementById('containerMovCusto');
    const containerCliente = document.getElementById('containerMovCliente');

    // Entrada: Mostrar Custo, Ocultar Cliente
    if (tipo === 'entrada') {
        containerCusto.style.display = 'block';
        containerCliente.style.display = 'none';
        document.getElementById('movCustoUnitario').required = true;
    }
    // Saída: Ocultar Custo, Mostrar Cliente (e Valor de Venda, se fosse um formulário mais complexo)
    else if (tipo === 'saida') {
        containerCusto.style.display = 'none';
        containerCliente.style.display = 'block';
        document.getElementById('movCustoUnitario').required = false;

        // **NOTA:** Em um sistema real, aqui você teria mais campos para o valor de VENDA.
        // Neste exemplo simplificado, estamos forçando o custo para 0 na saída,
        // mas o registro de venda real deve ser feito no HistoricoVendas
    }
}


function registrarMovimentacao() {
    const sku = document.getElementById('movProduto').value;
    const tipo = document.getElementById('tipoMovimento').value;
    const quantidade = parseInt(document.getElementById('movQuantidade').value);
    const custoTotalMov = parseFloat(document.getElementById('movCustoUnitario').value);
    const clienteId = document.getElementById('movCliente').value;

    if (!sku || quantidade <= 0) {
        mostrarToast('Selecione o produto e informe uma quantidade válida.', 'error');
        return;
    }

    let produtoIndex = estoque.findIndex(p => p.sku === sku);
    if (produtoIndex === -1) {
        mostrarToast('Produto não encontrado.', 'error');
        return;
    }
    let produto = estoque[produtoIndex];

    if (tipo === 'entrada') {
        // Cálculo do CMP (Custo Médio Ponderado)
        const custoAntigoTotal = produto.custoUnitario * produto.quantidade;
        const novoCustoTotal = custoAntigoTotal + custoTotalMov;
        const novaQuantidadeTotal = produto.quantidade + quantidade;

        if (novaQuantidadeTotal > 0) {
            produto.custoUnitario = novoCustoTotal / novaQuantidadeTotal;
        } else {
            produto.custoUnitario = 0.00;
        }
        produto.quantidade = novaQuantidadeTotal;
        mostrarToast(`Entrada de ${quantidade} unidades de ${produto.nome}. CMP atualizado.`, 'success');

        // Registro de CUSTO no Fluxo de Caixa (SAÍDA)
        if (custoTotalMov > 0) {
             const data = new Date().toISOString().substring(0, 10);
             lancamentosCaixa.push({
                id: Date.now() + 1, // Um ID único
                tipo: 'despesa',
                descricao: `Custo de Compra (Entrada Estoque): ${produto.nome} (${quantidade} un.)`,
                data: data,
                valor: custoTotalMov,
                categoria: 'compras'
            });
            salvarLancamentosCaixa();
        }

    } else if (tipo === 'saida') {
        if (produto.quantidade < quantidade) {
            mostrarToast('Estoque insuficiente para a saída.', 'error');
            return;
        }
        
        // Custo total baseado no CMP atual para fins de histórico e lucro
        const custoTotalVenda = produto.custoUnitario * quantidade;

        // Diminui o estoque
        produto.quantidade -= quantidade;

        // Solicita o valor da venda para registrar no histórico
        let valorVenda = prompt(`Informe o valor TOTAL da VENDA (R$) de ${quantidade} unidades de ${produto.nome}:`);
        valorVenda = parseFloat(valorVenda);

        if (isNaN(valorVenda) || valorVenda <= 0) {
            mostrarToast('Valor de venda inválido. Movimentação cancelada.', 'error');
            // Reverte a mudança de estoque
            produto.quantidade += quantidade; 
            salvarEstoque();
            return;
        }

        // ----------------------------------------------------
        // REGISTRO DE VENDA (Para Histórico de Vendas)
        // ----------------------------------------------------
        const vendaId = Date.now();
        const dataVenda = new Date().toISOString().substring(0, 10);
        const lucroBruto = valorVenda - custoTotalVenda;
        
        const novaVenda = {
            id: vendaId,
            data: dataVenda,
            produtoSku: produto.sku,
            produtoNome: produto.nome,
            clienteId: clienteId || null,
            quantidade: quantidade,
            valorVenda: valorVenda,
            custoTotal: custoTotalVenda,
            lucroBruto: lucroBruto
        };
        historicoVendas.push(novaVenda);
        salvarHistoricoVendas();

        // ----------------------------------------------------
        // REGISTRO NO FLUXO DE CAIXA (RECEITA)
        // ----------------------------------------------------
        registrarReceitaDeVenda(dataVenda, valorVenda, clientes.find(c => c.id == clienteId)?.nome, produto.nome, vendaId);
        
        mostrarToast(`Saída de ${quantidade} unidades de ${produto.nome} e Venda registrada! Lucro Bruto: ${formatoValor(lucroBruto)}`, 'success');
    }

    salvarEstoque();
    document.getElementById('movQuantidade').value = '1';
    document.getElementById('movCustoUnitario').value = '0.00';
    document.getElementById('movProduto').value = '';
    
    carregarEstoque();
    carregarHistoricoVendas(); // Para atualizar os totais
}

function removerProduto(sku) {
    if (confirm(`Tem certeza que deseja remover o produto de SKU ${sku}? Isso apagará todas as referências no estoque e histórico!`)) {
        estoque = estoque.filter(p => p.sku !== sku);
        // Limpar o histórico de vendas para produtos removidos é complexo,
        // mas o sistema continua a funcionar com o SKU removido no histórico.
        salvarEstoque();
        mostrarToast(`Produto ${sku} removido.`, 'warning');
        carregarEstoque();
    }
}

function abrirModalEditarProduto(sku) {
    const produto = estoque.find(p => p.sku === sku);
    if (!produto) return;

    document.getElementById('editProdutoSkuAtual').value = produto.sku;
    document.getElementById('editNomeProduto').value = produto.nome;
    document.getElementById('editSkuProduto').value = produto.sku;
    document.getElementById('editEstoqueMinimo').value = produto.estoqueMinimo;
    document.getElementById('editCustoUnitario').innerText = formatoValor(produto.custoUnitario);

    document.getElementById('modalEditarProduto').style.display = 'block';
}

function fecharModalEditarProduto() {
    document.getElementById('modalEditarProduto').style.display = 'none';
}

function salvarEdicaoProduto() {
    const skuAtual = document.getElementById('editProdutoSkuAtual').value;
    const novoNome = document.getElementById('editNomeProduto').value.trim();
    const novoSku = document.getElementById('editSkuProduto').value.trim().toUpperCase();
    const novoMinimo = parseInt(document.getElementById('editEstoqueMinimo').value) || 0;

    let produtoIndex = estoque.findIndex(p => p.sku === skuAtual);
    if (produtoIndex === -1) {
        mostrarToast('Erro ao encontrar produto para edição.', 'error');
        return;
    }
    
    // Checar se o novo SKU já existe e não é o SKU atual
    if (estoque.some(p => p.sku === novoSku && p.sku !== skuAtual)) {
        mostrarToast('Novo SKU já está sendo usado por outro produto.', 'error');
        return;
    }

    estoque[produtoIndex].nome = novoNome;
    estoque[produtoIndex].sku = novoSku;
    estoque[produtoIndex].estoqueMinimo = novoMinimo;

    // Atualiza o SKU no histórico de vendas se ele mudou
    if (skuAtual !== novoSku) {
        historicoVendas.forEach(venda => {
            if (venda.produtoSku === skuAtual) {
                venda.produtoSku = novoSku;
            }
        });
        salvarHistoricoVendas();
    }

    salvarEstoque();
    mostrarToast('Produto atualizado com sucesso!', 'success');
    fecharModalEditarProduto();
    carregarEstoque();
}


// ===========================================
// FUNÇÕES HISTÓRICO DE VENDAS (INCOMPLETAS)
// ===========================================

function carregarHistoricoVendas() {
    const tbody = document.querySelector('#tabelaHistoricoVendas tbody');
    tbody.innerHTML = '';

    let totalVenda = 0;
    let totalCusto = 0;
    let totalLucro = 0;

    // Ordena as vendas pela data (mais recente primeiro)
    const vendasOrdenadas = historicoVendas.sort((a, b) => new Date(b.data) - new Date(a.data));

    if (vendasOrdenadas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--secondary-color);">Nenhuma venda registrada.</td></tr>';
    } else {
        vendasOrdenadas.forEach(venda => {
            const clienteNome = clientes.find(c => c.id === venda.clienteId)?.nome || 'Não Identificado';

            totalVenda += venda.valorVenda;
            totalCusto += venda.custoTotal;
            totalLucro += venda.lucroBruto;
            
            // Determina a classe do lucro para cor
            const lucroClasse = venda.lucroBruto >= 0 ? 'valor-positivo' : 'valor-negativo';

            const linha = `
                <tr>
                    <td>${formatarDataBrasileira(venda.data)}</td>
                    <td>${venda.produtoNome} <small>(${venda.produtoSku})</small></td>
                    <td>${clienteNome}</td>
                    <td style="text-align: center;">${venda.quantidade}</td>
                    <td>${formatoValor(venda.valorVenda)}</td>
                    <td>${formatoValor(venda.custoTotal)}</td>
                    <td class="${lucroClasse}">${formatoValor(venda.lucroBruto)}</td>
                    <td style="text-align: center;">
                        <button class="btn btn-excluir btn-note-action" onclick="removerVenda(${venda.id})">
                            <i class="material-icons">delete</i>
                        </button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += linha;
        });
    }

    // Atualiza o rodapé
    document.getElementById('totalVenda').innerText = formatoValor(totalVenda);
    document.getElementById('totalCusto').innerText = formatoValor(totalCusto);
    document.getElementById('totalLucro').innerText = formatoValor(totalLucro);

    // Atualiza o dashboard
    atualizarDashboard();
}

function removerVenda(id) {
    if (confirm('Tem certeza que deseja remover esta venda? Isso afetará os totais financeiros!')) {
        
        // Remove do histórico de vendas
        historicoVendas = historicoVendas.filter(v => v.id !== id);
        salvarHistoricoVendas();

        // Remove a receita correspondente do Fluxo de Caixa (usando o mesmo ID da venda)
        lancamentosCaixa = lancamentosCaixa.filter(l => l.id !== id);
        salvarLancamentosCaixa();
        
        // NOTA: Em um sistema real, a exclusão da venda deveria reverter o estoque.
        // Aqui, para simplificar, apenas removemos os registros financeiros.

        mostrarToast('Venda e Receita removidas.', 'warning');
        carregarHistoricoVendas();
        carregarFluxoCaixa(); // Força a atualização do Fluxo de Caixa
    }
}


// ===========================================
// FUNÇÕES CRM CLIENTES
// ===========================================

function adicionarCliente() {
    const nome = document.getElementById('nomeCliente').value.trim();
    const telefone = document.getElementById('telefoneCliente').value.trim();
    const email = document.getElementById('emailCliente').value.trim();
    const cpfCnpj = document.getElementById('cpfCnpjCliente').value.trim();
    const nascimento = document.getElementById('nascimentoCliente').value;
    const origem = document.getElementById('origemCliente').value;
    const cep = document.getElementById('cepCliente').value.trim();
    const endereco = document.getElementById('enderecoCliente').value.trim();
    const numero = document.getElementById('numeroCliente').value.trim();
    const bairro = document.getElementById('bairroCliente').value.trim();
    const cidade = document.getElementById('cidadeCliente').value.trim();
    const estado = document.getElementById('estadoCliente').value.trim();
    const observacoes = document.getElementById('observacoesCliente').value.trim();

    if (!nome || !telefone) {
        mostrarToast('Nome e Telefone/WhatsApp são obrigatórios.', 'error');
        return;
    }

    const novoCliente = {
        id: Date.now(),
        nome,
        telefone,
        email,
        cpfCnpj,
        nascimento,
        origem,
        enderecoCompleto: { cep, logradouro: endereco, numero, bairro, cidade, estado },
        observacoes
    };

    clientes.push(novoCliente);
    salvarClientes();
    mostrarToast(`Cliente ${nome} cadastrado!`, 'success');

    // Limpar e recarregar
    document.getElementById('nomeCliente').value = '';
    document.getElementById('telefoneCliente').value = '';
    document.getElementById('emailCliente').value = '';
    document.getElementById('cpfCnpjCliente').value = '';
    document.getElementById('nascimentoCliente').value = '';
    document.getElementById('cepCliente').value = '';
    document.getElementById('enderecoCliente').value = '';
    document.getElementById('numeroCliente').value = '';
    document.getElementById('bairroCliente').value = '';
    document.getElementById('cidadeCliente').value = '';
    document.getElementById('estadoCliente').value = '';
    document.getElementById('observacoesCliente').value = '';
    document.getElementById('origemCliente').value = 'direto';

    carregarClientes();
    carregarClientesParaMovimentacao();
}

function carregarClientes() {
    const tbody = document.querySelector('#tabelaClientes tbody');
    tbody.innerHTML = '';

    if (clientes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--secondary-color);">Nenhum cliente cadastrado.</td></tr>';
        return;
    }

    clientes.sort((a, b) => a.nome.localeCompare(b.nome)).forEach(c => {
        const linha = `
            <tr>
                <td>${c.nome}</td>
                <td>${c.telefone}</td>
                <td>${c.email || '-'}</td>
                <td>${c.origem}</td>
                <td style="text-align: center;">
                    <button class="btn btn-primary btn-note-action" onclick="mostrarDetalhesCliente(${c.id})">
                        <i class="material-icons">search</i>
                    </button>
                    <button class="btn btn-warning btn-note-action" onclick="abrirModalEditarCliente(${c.id})">
                        <i class="material-icons">edit</i>
                    </button>
                    <button class="btn btn-excluir btn-note-action" onclick="removerCliente(${c.id})">
                        <i class="material-icons">delete</i>
                    </button>
                </td>
            </tr>
        `;
        tbody.innerHTML += linha;
    });

    // Atualiza o dashboard
    atualizarDashboard();
}

function removerCliente(id) {
    if (confirm('Tem certeza que deseja remover este cliente? O histórico de compras permanecerá, mas sem referência ao nome.')) {
        clientes = clientes.filter(c => c.id !== id);
        salvarClientes();
        mostrarToast('Cliente removido.', 'warning');
        carregarClientes();
        carregarClientesParaMovimentacao();
    }
}

function mostrarDetalhesCliente(id) {
    const cliente = clientes.find(c => c.id === id);
    if (!cliente) return;

    document.getElementById('detalhesClienteNome').innerText = `Detalhes do Cliente: ${cliente.nome}`;
    document.getElementById('listaClientesView').style.display = 'none';
    document.getElementById('detalhesCliente').style.display = 'block';
    
    // 1. Informações Gerais
    let infoHtml = `
        <p><strong>Telefone:</strong> ${cliente.telefone}</p>
        <p><strong>Email:</strong> ${cliente.email || '-'}</p>
        <p><strong>CPF/CNPJ:</strong> ${cliente.cpfCnpj || '-'}</p>
        <p><strong>Nascimento:</strong> ${cliente.nascimento ? formatarDataBrasileira(cliente.nascimento) : '-'}</p>
        <p><strong>Origem:</strong> ${cliente.origem}</p>
        <hr style="border-style: dashed;">
        <p><strong>Endereço:</strong> ${cliente.enderecoCompleto.logradouro || ''}, ${cliente.enderecoCompleto.numero || 'S/N'}</p>
        <p><strong>Bairro:</strong> ${cliente.enderecoCompleto.bairro || '-'}</p>
        <p><strong>Cidade/UF:</strong> ${cliente.enderecoCompleto.cidade || '-'} / ${cliente.enderecoCompleto.estado || '-'}</p>
        <p><strong>Observações:</strong> ${cliente.observacoes || '-'}</p>
    `;
    document.getElementById('infoGeralCliente').innerHTML = infoHtml;

    // 2. Histórico de Compras e Total Gasto
    const historico = historicoVendas.filter(v => v.clienteId === cliente.id);
    const tbodyHistorico = document.querySelector('#tabelaHistoricoCliente tbody');
    tbodyHistorico.innerHTML = '';
    let totalGasto = 0;

    if (historico.length === 0) {
        tbodyHistorico.innerHTML = '<tr><td colspan="4" style="text-align: center;">Nenhuma compra registrada para este cliente.</td></tr>';
    } else {
        historico.forEach(v => {
            totalGasto += v.valorVenda;
            const linha = `
                <tr>
                    <td>${formatarDataBrasileira(v.data)}</td>
                    <td>${v.produtoNome}</td>
                    <td style="text-align: center;">${v.quantidade}</td>
                    <td>${formatoValor(v.valorVenda)}</td>
                </tr>
            `;
            tbodyHistorico.innerHTML += linha;
        });
    }

    document.getElementById('totalGastoCliente').innerText = formatoValor(totalGasto);
}

function fecharDetalhesCliente() {
    document.getElementById('detalhesCliente').style.display = 'none';
    document.getElementById('listaClientesView').style.display = 'block';
}

function abrirModalEditarCliente(id) {
    const cliente = clientes.find(c => c.id === id);
    if (!cliente) return;

    document.getElementById('editClienteId').value = cliente.id;
    document.getElementById('editNomeCliente').value = cliente.nome;
    document.getElementById('editTelefoneCliente').value = cliente.telefone;
    document.getElementById('editEmailCliente').value = cliente.email;
    document.getElementById('editCpfCnpjCliente').value = cliente.cpfCnpj;
    document.getElementById('editNascimentoCliente').value = cliente.nascimento;
    document.getElementById('editOrigemCliente').value = cliente.origem;
    document.getElementById('editCepCliente').value = cliente.enderecoCompleto.cep;
    document.getElementById('editEnderecoCliente').value = cliente.enderecoCompleto.logradouro;
    document.getElementById('editNumeroCliente').value = cliente.enderecoCompleto.numero;
    document.getElementById('editBairroCliente').value = cliente.enderecoCompleto.bairro;
    document.getElementById('editCidadeCliente').value = cliente.enderecoCompleto.cidade;
    document.getElementById('editEstadoCliente').value = cliente.enderecoCompleto.estado;
    document.getElementById('editObservacoesCliente').value = cliente.observacoes;

    document.getElementById('modalEditarCliente').style.display = 'block';
}

function fecharModalEditarCliente() {
    document.getElementById('modalEditarCliente').style.display = 'none';
}

function salvarEdicaoCliente() {
    const id = parseInt(document.getElementById('editClienteId').value);
    const clienteIndex = clientes.findIndex(c => c.id === id);

    if (clienteIndex === -1) {
        mostrarToast('Cliente não encontrado para edição.', 'error');
        return;
    }

    clientes[clienteIndex].nome = document.getElementById('editNomeCliente').value.trim();
    clientes[clienteIndex].telefone = document.getElementById('editTelefoneCliente').value.trim();
    clientes[clienteIndex].email = document.getElementById('editEmailCliente').value.trim();
    clientes[clienteIndex].cpfCnpj = document.getElementById('editCpfCnpjCliente').value.trim();
    clientes[clienteIndex].nascimento = document.getElementById('editNascimentoCliente').value;
    clientes[clienteIndex].origem = document.getElementById('editOrigemCliente').value;
    clientes[clienteIndex].enderecoCompleto = {
        cep: document.getElementById('editCepCliente').value.trim(),
        logradouro: document.getElementById('editEnderecoCliente').value.trim(),
        numero: document.getElementById('editNumeroCliente').value.trim(),
        bairro: document.getElementById('editBairroCliente').value.trim(),
        cidade: document.getElementById('editCidadeCliente').value.trim(),
        estado: document.getElementById('editEstadoCliente').value.trim()
    };
    clientes[clienteIndex].observacoes = document.getElementById('editObservacoesCliente').value.trim();

    salvarClientes();
    mostrarToast('Cliente atualizado com sucesso!', 'success');
    fecharModalEditarCliente();
    carregarClientes();
    carregarClientesParaMovimentacao();
}

// ===========================================
// FUNÇÕES AGENDA / LEMBRETES
// ===========================================

function adicionarCompromisso() {
    const titulo = document.getElementById('tituloCompromisso').value.trim();
    const data = document.getElementById('dataCompromisso').value;
    const hora = document.getElementById('horaCompromisso').value;

    if (!titulo || !data) {
        mostrarToast('Título e Data são obrigatórios.', 'error');
        return;
    }

    const novoCompromisso = {
        id: Date.now(),
        titulo: titulo,
        data: data,
        hora: hora,
        concluido: false
    };

    compromissos.push(novoCompromisso);
    salvarCompromissos();
    mostrarToast('Compromisso salvo!', 'success');

    // Limpar e recarregar
    document.getElementById('tituloCompromisso').value = '';
    document.getElementById('dataCompromisso').value = '';
    document.getElementById('horaCompromisso').value = '';

    carregarCompromissos();
    carregarCompromissosDashboard();
}

function carregarCompromissos() {
    const lista = document.getElementById('listaCompromissos');
    lista.innerHTML = '';
    const filtro = document.getElementById('filtroAgenda').value;
    const hoje = new Date().toISOString().substring(0, 10);
    const dataFiltro = new Date();

    let compromissosFiltrados = compromissos.filter(c => !c.concluido);

    if (filtro === 'hoje') {
        compromissosFiltrados = compromissosFiltrados.filter(c => c.data === hoje);
    } else if (filtro === 'semana') {
        const proximaSemana = new Date(dataFiltro);
        proximaSemana.setDate(dataFiltro.getDate() + 7);
        compromissosFiltrados = compromissosFiltrados.filter(c => c.data >= hoje && c.data <= proximaSemana.toISOString().substring(0, 10));
    } else if (filtro === 'mes') {
        const proximoMes = new Date(dataFiltro);
        proximoMes.setMonth(dataFiltro.getMonth() + 1);
        compromissosFiltrados = compromissosFiltrados.filter(c => c.data >= hoje && c.data <= proximoMes.toISOString().substring(0, 10));
    }

    // Ordena por data e hora
    compromissosFiltrados.sort((a, b) => {
        if (a.data !== b.data) {
            return a.data.localeCompare(b.data);
        }
        return (a.hora || '24:00').localeCompare(b.hora || '24:00');
    });


    if (compromissosFiltrados.length === 0) {
        lista.innerHTML = '<li style="text-align: center; color: var(--secondary-color); border: none;">Nenhum compromisso pendente no filtro selecionado.</li>';
        return;
    }

    compromissosFiltrados.forEach(c => {
        const dataHora = `${formatarDataBrasileira(c.data)} ${c.hora ? 'às ' + c.hora : ''}`;
        const linha = `
            <li class="${c.concluido ? 'concluido' : ''}">
                <div>
                    <strong style="display: block;">${c.titulo}</strong>
                    <small style="color: var(--secondary-color);">${dataHora}</small>
                </div>
                <div>
                    <button class="btn btn-success btn-note-action" onclick="marcarConcluido(${c.id})">
                        <i class="material-icons">check</i>
                    </button>
                    <button class="btn btn-excluir btn-note-action" onclick="removerCompromisso(${c.id})">
                        <i class="material-icons">delete</i>
                    </button>
                </div>
            </li>
        `;
        lista.innerHTML += linha;
    });
}

function marcarConcluido(id) {
    const compromisso = compromissos.find(c => c.id === id);
    if (compromisso) {
        compromisso.concluido = true;
        salvarCompromissos();
        mostrarToast('Compromisso concluído!', 'info');
        carregarCompromissos();
    }
}

function removerCompromisso(id) {
    if (confirm('Tem certeza que deseja remover este compromisso?')) {
        compromissos = compromissos.filter(c => c.id !== id);
        salvarCompromissos();
        mostrarToast('Compromisso removido.', 'warning');
        carregarCompromissos();
    }
}


// ===========================================
// FUNÇÕES CALCULADORA REVERSA
// ===========================================

function calcularVendaReversa() {
    const precoVenda = parseFloat(document.getElementById('precoVendaDesejado').value) || 0;
    const impostoPercentual = parseFloat(document.getElementById('impostoPercentual').value) || 0;
    const taxaFixaRS = parseFloat(document.getElementById('taxaFixaRS').value) || 0;
    const despesaDiversa = parseFloat(document.getElementById('despesaDiversa').value) || 0;
    const quantidadeItens = parseInt(document.getElementById('quantidadeItens').value) || 1;
    const custoUnitarioItem = parseFloat(document.getElementById('custoUnitarioItem').value) || 0;
    const selectPlataforma = document.getElementById('selectPlataforma').value;

    if (precoVenda <= 0) {
        document.getElementById('resLucroFinal').innerText = formatoValor(0);
        document.getElementById('resLucroFinal').classList.remove('valor-negativo');
        document.getElementById('resLucroFinal').classList.add('valor-positivo');
        return;
    }

    // 1. Encontra a taxa da plataforma
    const plataformaSelecionada = plataformas.find(p => p.nome === selectPlataforma);
    const taxaPlataforma = plataformaSelecionada ? plataformaSelecionada.taxa : 0;

    // 2. Custos/Despesas (em R$)
    const custoBrutoProduto = custoUnitarioItem * quantidadeItens;
    const impostoRS = precoVenda * (impostoPercentual / 100);
    const taxaPlatRS = precoVenda * (taxaPlataforma / 100);

    const custoTotal = custoBrutoProduto + taxaFixaRS + impostoRS + taxaPlatRS + despesaDiversa;

    // 3. Resultado Final
    const rendaLiquida = precoVenda - custoTotal;
    const lucroFinal = rendaLiquida;

    // 4. Atualiza a UI
    document.getElementById('resPrecoVenda').innerText = formatoValor(precoVenda);
    document.getElementById('resCustoBrutoProduto').innerText = formatoValor(custoBrutoProduto);
    document.getElementById('resTaxaFixaRS').innerText = formatoValor(taxaFixaRS);
    document.getElementById('resImpostoRS').innerText = formatoValor(impostoRS);
    document.getElementById('resTaxaPlat').innerText = `${formatoValor(taxaPlatRS)} (${taxaPlataforma}%)`;
    document.getElementById('resDespesaDiversa').innerText = formatoValor(despesaDiversa);
    
    document.getElementById('resRendaLiquida').innerText = formatoValor(rendaLiquida);

    const lucroElement = document.getElementById('resLucroFinal');
    lucroElement.innerText = formatoValor(lucroFinal);
    lucroElement.classList.remove('valor-positivo', 'valor-negativo');
    lucroElement.classList.add(lucroFinal >= 0 ? 'valor-positivo' : 'valor-negativo');
}

function carregarPlataformasSelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = '';
    plataformas.forEach(p => {
        select.innerHTML += `<option value="${p.nome}">${p.nome} (${p.taxa}%)</option>`;
    });

    calcularVendaReversa(); // Recalcula sempre que as opções mudam
}

function saveConfigCalculadora() {
    configCalculadora.margemLucroPadrao = parseFloat(document.getElementById('margemLucroPadraoConfig').value) || 0;
    salvarConfigCalculadora();
    mostrarToast('Configurações de cálculo salvas!', 'success');
}

// ===========================================
// FUNÇÕES CONFIGURAÇÕES (PLATAFORMAS)
// ===========================================

function adicionarPlataforma() {
    const nome = document.getElementById('nomePlataforma').value.trim();
    const taxa = parseFloat(document.getElementById('taxaPlataforma').value) || 0;

    if (!nome) {
        mostrarToast('Nome da plataforma é obrigatório.', 'error');
        return;
    }
    if (plataformas.some(p => p.nome.toLowerCase() === nome.toLowerCase())) {
        mostrarToast('Esta plataforma já está cadastrada.', 'error');
        return;
    }

    const novaPlataforma = {
        id: Date.now(),
        nome: nome,
        taxa: taxa
    };

    plataformas.push(novaPlataforma);
    salvarPlataformas();
    mostrarToast(`Plataforma ${nome} (${taxa}%) adicionada!`, 'success');

    document.getElementById('nomePlataforma').value = '';
    document.getElementById('taxaPlataforma').value = '0.00';
    carregarPlataformas();
    carregarPlataformasSelect('selectPlataforma');
}

function carregarPlataformas() {
    const tbody = document.querySelector('#tabelaPlataformas tbody');
    tbody.innerHTML = '';

    document.getElementById('margemLucroPadraoConfig').value = configCalculadora.margemLucroPadrao;

    plataformas.forEach(p => {
        const linha = `
            <tr>
                <td>${p.nome}</td>
                <td>${p.taxa}%</td>
                <td>
                    <button class="btn btn-warning btn-note-action" onclick="abrirModalEditarPlataforma(${p.id})">
                        <i class="material-icons">edit</i>
                    </button>
                    <button class="btn btn-excluir btn-note-action" onclick="removerPlataforma(${p.id})" ${p.id <= 3 ? 'disabled title="Plataformas padrão não podem ser removidas"' : ''}>
                        <i class="material-icons">delete</i>
                    </button>
                </td>
            </tr>
        `;
        tbody.innerHTML += linha;
    });
}

function removerPlataforma(id) {
    if (id <= 3) {
        mostrarToast('Plataformas padrão não podem ser removidas.', 'error');
        return;
    }
    if (confirm('Tem certeza que deseja remover esta plataforma?')) {
        plataformas = plataformas.filter(p => p.id !== id);
        salvarPlataformas();
        mostrarToast('Plataforma removida.', 'warning');
        carregarPlataformas();
        carregarPlataformasSelect('selectPlataforma');
    }
}

function abrirModalEditarPlataforma(id) {
    const plataforma = plataformas.find(p => p.id === id);
    if (!plataforma) return;

    document.getElementById('editPlataformaId').value = plataforma.id;
    document.getElementById('editNomePlataforma').value = plataforma.nome;
    document.getElementById('editTaxaPlataforma').value = plataforma.taxa;
    
    // Desabilita a edição de nome para plataformas padrão
    const isPadrao = id <= 3;
    document.getElementById('editNomePlataforma').disabled = isPadrao;

    document.getElementById('modalEditarPlataforma').style.display = 'block';
}

function fecharModalEditarPlataforma() {
    document.getElementById('modalEditarPlataforma').style.display = 'none';
}

function salvarEdicaoPlataforma() {
    const id = parseInt(document.getElementById('editPlataformaId').value);
    const nome = document.getElementById('editNomePlataforma').value.trim();
    const taxa = parseFloat(document.getElementById('editTaxaPlataforma').value) || 0;
    
    const index = plataformas.findIndex(p => p.id === id);
    if (index === -1) return;

    if (id > 3) { // Permite edição de nome apenas para não-padrão
        plataformas[index].nome = nome;
    }
    plataformas[index].taxa = taxa;

    salvarPlataformas();
    mostrarToast('Plataforma atualizada!', 'success');
    fecharModalEditarPlataforma();
    carregarPlataformas();
    carregarPlataformasSelect('selectPlataforma');
}


// ===========================================
// FUNÇÕES GERAIS DE UI
// ===========================================

function filtrarTabela(tabelaId, inputId) {
    const input = document.getElementById(inputId);
    const filter = input.value.toUpperCase();
    const table = document.getElementById(tabelaId);
    const tr = table.getElementsByTagName('tr');

    for (let i = 1; i < tr.length; i++) {
        let display = false;
        const td = tr[i].getElementsByTagName('td');
        for (let j = 0; j < td.length; j++) {
            if (td[j]) {
                if (td[j].innerHTML.toUpperCase().indexOf(filter) > -1) {
                    display = true;
                    break;
                }
            }
        }
        tr[i].style.display = display ? '' : 'none';
    }
}

function imprimirTabela(tabelaId, titulo) {
    const table = document.getElementById(tabelaId).outerHTML;
    const newWindow = window.open('', '', 'height=600,width=800');
    newWindow.document.write('<html><head><title>' + titulo + '</title>');
    // Copia os estilos essenciais para a impressão
    newWindow.document.write('<style>');
    newWindow.document.write(`
        body { font-family: sans-serif; }
        .data-table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
        .data-table th, .data-table td { border: 1px solid #333; padding: 5px; text-align: left; }
        .data-table thead th { background-color: #f2f2f2; }
        .valor-positivo { color: green; font-weight: bold; }
        .valor-negativo { color: red; font-weight: bold; }
    `);
    newWindow.document.write('</style></head><body>');
    newWindow.document.write(`<h1>${titulo}</h1>`);
    newWindow.document.write(table);
    newWindow.document.write('</body></html>');
    newWindow.document.close();
    newWindow.print();
}

function imprimirResultadosCalculadora() {
    const card = document.getElementById('resultadosCalculadora').outerHTML;
    const newWindow = window.open('', '', 'height=600,width=800');
    newWindow.document.write('<html><head><title>Relatório de Cálculo Reverso</title>');
    newWindow.document.write('<style>');
    newWindow.document.write(`
        body { font-family: sans-serif; padding: 20px; }
        .card { border: 1px solid #ccc; padding: 15px; border-radius: 5px; }
        .total-info { display: flex; justify-content: space-between; font-weight: bold; padding: 5px 0; border-top: 1px solid #eee; }
        .valor-positivo { color: green; font-weight: bold; font-size: 1.2em; }
        .valor-negativo { color: red; font-weight: bold; font-size: 1.2em; }
        h2, h3 { color: #007bff; border-bottom: 1px solid #007bff; padding-bottom: 5px; }
    `);
    newWindow.document.write('</style></head><body>');
    newWindow.document.write(card.replace(/<button.*?>.*?<\/button>/g, '')); // Remove o botão de impressão
    newWindow.document.write('</body></html>');
    newWindow.document.close();
    newWindow.print();
}

// ===========================================
// FUNÇÕES DE SERVIÇO (CEP)
// (Simulação de integração com API ViaCEP)
// ===========================================

function preencherEnderecoPeloCep(cepInputId, ruaInputId, bairroInputId, cidadeInputId, estadoInputId) {
    const cep = document.getElementById(cepInputId).value.replace(/\D/g, '');
    if (cep.length !== 8) return;

    // Simulação da chamada
    // Em um ambiente de produção (online), o fetch funcionaria.
    // Aqui, apenas ilustramos a função.
    
    // Exemplo de como seria a chamada real:
    // fetch(`https://viacep.com.br/ws/${cep}/json/`)
    //     .then(response => response.json())
    //     .then(data => {
    //         if (!data.erro) {
    //             document.getElementById(ruaInputId).value = data.logradouro;
    //             document.getElementById(bairroInputId).value = data.bairro;
    //             document.getElementById(cidadeInputId).value = data.localidade;
    //             document.getElementById(estadoInputId).value = data.uf;
    //             mostrarToast('Endereço preenchido!', 'info');
    //         } else {
    //             mostrarToast('CEP não encontrado.', 'warning');
    //         }
    //     })
    //     .catch(error => {
    //         mostrarToast('Erro ao buscar CEP.', 'error');
    //     });
}

// ===========================================
// FUNÇÕES DE INICIALIZAÇÃO
// ===========================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Checagem de Login e Segurança
    checarLogin();

    // 2. Carrega Tema e Sidebar
    const isDark = localStorage.getItem('darkModeEnabled') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
        // Checa se o elemento existe antes de tentar acessar
        const darkModeToggle = document.getElementById('darkModeToggle');
        if(darkModeToggle) darkModeToggle.checked = true;
        
        const themeIcon = document.getElementById('themeToggle').querySelector('.material-icons');
        if(themeIcon) themeIcon.innerText = 'light_mode';
    }

    const isRecolhida = localStorage.getItem('sidebarRecolhida') === 'true';
    if (isRecolhida) {
        document.body.classList.add('sidebar-recolhida');
    } else {
        document.body.classList.remove('sidebar-recolhida');
    }
    
    // 3. Carrega o conteúdo do Post-it
    const savedContent = localStorage.getItem('stickyNoteContent');
    const noteContent = document.getElementById('noteContent');
    if (noteContent && savedContent) {
        noteContent.value = savedContent;
    }
    
    // 4. Se o login foi ignorado (lembrar senha), carrega o dashboard e dados iniciais
    if (document.getElementById('loginOverlay').style.display === 'none') {
        mudarPagina('paginaDashboard');
    }
    
    // 5. Garante que o input de data de lançamento comece com a data atual
    document.getElementById('dataLancamento').value = new Date().toISOString().substring(0, 10);
});
