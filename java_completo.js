// ===========================================
// CONFIGURAÇÃO E VARIÁVEIS GLOBAIS
// ===========================================

// Variáveis de Armazenamento Local
let estoque = JSON.parse(localStorage.getItem('estoque')) || [];
let historicoVendas = JSON.parse(localStorage.getItem('historicoVendas')) || [];
let clientes = JSON.parse(localStorage.getItem('clientes')) || [];
let compromissos = JSON.parse(localStorage.getItem('compromissos')) || [];
let plataformas = JSON.parse(localStorage.getItem('plataformas')) || [
    { id: 1, nome: 'Mercado Livre', taxa: 16.5 },
    { id: 2, nome: 'Shopee', taxa: 18.0 },
    { id: 3, nome: 'Venda Direta', taxa: 0.0 }
];
let configCalculadora = JSON.parse(localStorage.getItem('configCalculadora')) || {
    margemLucroPadrao: 30
};

// Variável para Fluxo de Caixa
let lancamentosCaixa = JSON.parse(localStorage.getItem('lancamentosCaixa')) || [];

// ===========================================
// FUNÇÕES UTILITÁRIAS
// ===========================================

function formatoValor(valor) {
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
// FUNÇÕES DE NAVEGAÇÃO E UI
// ===========================================

function mudarPagina(pageId) {
    document.querySelectorAll('.page-content').forEach(page => {
        page.style.display = 'none';
    });

    const paginaAtiva = document.getElementById(pageId);
    if (paginaAtiva) {
        paginaAtiva.style.display = 'block';
        // Tenta pegar o H2 ou H1 para o título, priorizando o H2
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

function salvarLancamentosCaixa() {
    localStorage.setItem('lancamentosCaixa', JSON.stringify(lancamentosCaixa));
}

function adicionarLancamento() {
    const tipo = document.getElementById('tipoLancamento').value;
    const descricao = document.getElementById('descricaoLancamento').value.trim();
    const dataInput = document.getElementById('dataLancamento').value;
    const valorInput = document.getElementById('valorLancamento').value;
    const categoria = document.getElementById('categoriaLancamento').value;

    if (!descricao || !dataInput || parseFloat(valorInput) <= 0) {
        mostrarToast('Preencha todos os campos corretamente.', 'error');
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
    mostrarToast(`Lançamento de ${formatoValor(novoLancamento.valor)} adicionado!`, 'success');

    // Recarrega a tabela e limpa o formulário
    carregarFluxoCaixa();
    document.getElementById('descricaoLancamento').value = '';
    document.getElementById('valorLancamento').value = '0.00';

    // Atualiza o dashboard, se necessário
    if (document.getElementById('paginaDashboard').style.display === 'block') {
        atualizarDashboard();
    }
}

function carregarFluxoCaixa() {
    const tbody = document.querySelector('#tabelaFluxoCaixa tbody');
    tbody.innerHTML = '';

    const filtroMesInput = document.getElementById('filtroMesFluxo').value;

    let totalReceitas = 0;
    let totalDespesas = 0;

    // 1. Filtrar
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
}

function removerLancamento(id) {
    if (confirm('Tem certeza que deseja remover este lançamento do Fluxo de Caixa?')) {
        lancamentosCaixa = lancamentosCaixa.filter(lanc => lanc.id !== id);
        salvarLancamentosCaixa();
        mostrarToast('Lançamento removido.', 'warning');
        carregarFluxoCaixa();

        if (document.getElementById('paginaDashboard').style.display === 'block') {
            atualizarDashboard();
        }
    }
}

// Função de integração com vendas (apenas para registro automático)
function registrarReceitaDeVenda(data, valor, clienteNome, produtoNome, id) {
    const novaReceita = {
        id: id,
        tipo: 'receita',
        descricao: `Venda: ${produtoNome} para ${clienteNome || 'Cliente Não Identificado'}`,
        data: data,
        valor: valor,
        categoria: 'vendas'
    };

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
// FUNÇÕES ESTOQUE, VENDAS, CLIENTES, AGENDA, CALCULADORA
// (Inclua suas funções originais aqui. Deixei um exemplo de integração de vendas)
// ===========================================

function salvarEstoque() { localStorage.setItem('estoque', JSON.stringify(estoque)); }
function salvarHistoricoVendas() { localStorage.setItem('historicoVendas', JSON.stringify(historicoVendas)); }
function salvarClientes() { localStorage.setItem('clientes', JSON.stringify(clientes)); }
function salvarCompromissos() { localStorage.setItem('compromissos', JSON.stringify(compromissos)); }
function salvarPlataformas() { localStorage.setItem('plataformas', JSON.stringify(plataformas)); }

// --- Funções placeholders (Você deve preencher com sua lógica completa) ---

function adicionarProduto() { mostrarToast('Função "adicionarProduto" não implementada.', 'info'); carregarEstoque(); }
function carregarEstoque() { 
    // Garante que a função está atualizada para refletir os dados.
    const tbody = document.querySelector('#tabelaEstoque tbody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Carregando dados de estoque...</td></tr>';
        // Implemente a lógica real de carregamento aqui
    }
} 
function carregarClientesParaMovimentacao() { /* Lógica de carregar clientes no select */ }
function toggleMovimentacaoFields() { /* Lógica de toggle custo/cliente */ }

function registrarMovimentacao() {
    // Exemplo de integração:
    const tipo = document.getElementById('tipoMovimento').value;
    if (tipo === 'saida') {
        // Exemplo: Simula uma venda para teste de integração de fluxo de caixa
        const produto = estoque.length > 0 ? estoque[0] : { sku: 'EX001', nome: 'Produto Exemplo', custoUnitario: 10.00, quantidade: 10 };
        if (produto.quantidade > 0) {
            const novaVenda = {
                id: Date.now(),
                data: new Date().toISOString().substring(0, 10),
                produtoSku: produto.sku,
                produtoNome: produto.nome,
                clienteId: clientes.length > 0 ? clientes[0].id : null,
                quantidade: 1,
                valorVenda: 50.00,
                custoTotal: produto.custoUnitario,
                lucroBruto: 40.00
            };
            historicoVendas.push(novaVenda);
            salvarHistoricoVendas();
            registrarReceitaDeVenda(novaVenda.data, novaVenda.valorVenda, 'Cliente Exemplo', novaVenda.produtoNome, novaVenda.id);
            mostrarToast('Venda simulada registrada (Fluxo de Caixa atualizado)!', 'success');
        } else {
            mostrarToast('Estoque vazio para simulação.', 'error');
        }
    } else {
        mostrarToast('Movimentação de Entrada simulada.', 'info');
    }
    carregarEstoque();
    atualizarDashboard();
}

function carregarHistoricoVendas() { /* Lógica de carregar tabela de vendas */ }

function adicionarCompromisso() { /* Lógica de adicionar compromisso */ }
function carregarCompromissos() { /* Lógica de carregar lista de compromissos */ }

function carregarClientes() { /* Lógica de carregar lista de clientes */ }
function fecharDetalhesCliente() { /* Lógica para fechar detalhes do cliente */ }

function carregarPlataformasSelect(selectId) { /* Lógica de carregar select */ }
function calcularVendaReversa() { /* Lógica de cálculo reverso */ }
function adicionarPlataforma() { /* Lógica de adicionar plataforma */ }
function carregarPlataformas() { /* Lógica de carregar plataformas */ }
function saveConfigCalculadora() { /* Lógica de salvar config */ }

function filtrarTabela(tabelaId, inputId) {
    // Função genérica de filtro de tabela
    const input = document.getElementById(inputId);
    const filter = input.value.toUpperCase();
    const table = document.getElementById(tabelaId);
    const tr = table.getElementsByTagName('tr');

    for (let i = 1; i < tr.length; i++) { // Começa em 1 para pular o thead
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

// ===========================================
// FUNÇÕES DE INICIALIZAÇÃO
// ===========================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Checagem de Login
    checarLogin();

    // 2. Carrega Tema e Sidebar
    const isDark = localStorage.getItem('darkModeEnabled') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
        document.getElementById('darkModeToggle').checked = true;
        document.getElementById('themeToggle').querySelector('.material-icons').innerText = 'light_mode';
    }

    const isRecolhida = localStorage.getItem('sidebarRecolhida') === 'true';
    if (isRecolhida) {
        document.body.classList.add('sidebar-recolhida');
    } else {
        document.body.classList.remove('sidebar-recolhida');
    }
    
    // 3. Carrega o conteúdo do Post-it
    const savedContent = localStorage.getItem('stickyNoteContent');
    if (savedContent) {
        document.getElementById('noteContent').value = savedContent;
    }
});