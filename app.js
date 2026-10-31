// ==========================================
// OBSERVATÓRIO DE POLÍTICAS PÚBLICAS DE NOVA LIMA
// MOTOR LÓGICO E INTERFACE (APP.JS) - VERSÃO SLIDE EXECUTIVO DEFINITIVA
// ==========================================

const DEFAULT_SETTINGS = {
    populacaoOficial: 120000,
    cicloVigente: "PPA 2025-2028",
    corteAtencao: 70,
    corteSuperado: 100,
    secretarias: [
        "Desenvolvimento Social", "Educação", "Saúde", "Transporte e Trânsito",
        "Habitação", "Desenvolvimento Econômico", "Meio Ambiente", "Governo",
        "Obras e Serviços Urbanos", "Segurança Pública", "Esporte e Lazer",
        "Cultura e Turismo", "SEPLAG - Gestão Estratégica", "Gabinete do Prefeito"
    ],
    eixos: [
        "Desenvolvimento Social e Renda", "Transporte e Mobilidade Urbana",
        "Saúde e Qualidade de Vida", "Educação, Infância e Cidadania",
        "Desenvolvimento Econômico e Inovação", "Meio Ambiente e Proteção Animal"
    ],
    territorios: [
        "Todo o Município", "Região Sede / Centro",
        "Noroeste (Jardim Canadá / Vila da Serra / Alphaville)",
        "Honório Bicalho", "Macacos (São Sebastião)"
    ]
};

let settings = JSON.parse(localStorage.getItem('opp_novalima_settings')) || DEFAULT_SETTINGS;
let users = JSON.parse(localStorage.getItem('opp_novalima_users')) || INITIAL_USERS;
let policies = JSON.parse(localStorage.getItem('opp_novalima_policies')) || INITIAL_POLICIES;
let currentUser = JSON.parse(localStorage.getItem('opp_novalima_session')) || null;

let barChart = null;
let doughnutChart = null;

// Estados de Filtros e Visualização
let currentPublicFilter = 'TODOS';
let currentStatusFilter = 'TODOS';
let currentSort = { column: 'nome', asc: true };
let currentViewMode = 'table';
let isDenseMode = false;
let onlyFavorites = false;

// Estado da Apresentação Executiva (Slideshow)
let presentationIndex = 0;
let presentationList = [];
let presentationViewMode = 'slide';
let autoPlayInterval = null;
let autoPlaySpeed = 6000;

// Oculta a tela de login IMEDIATAMENTE se já houver sessão ativa
(function checkImmediateSession() {
    if (currentUser) {
        const overlay = document.getElementById('loginOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
            overlay.style.display = 'none';
        }
    }
})();

// ================== PERSISTÊNCIA E TOAST ==================
function saveStorage() {
    localStorage.setItem('opp_novalima_policies', JSON.stringify(policies));
    localStorage.setItem('opp_novalima_users', JSON.stringify(users));
    localStorage.setItem('opp_novalima_settings', JSON.stringify(settings));
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    document.getElementById('toastMsg').innerText = msg;
    toast.classList.remove('translate-y-[-150%]', 'opacity-0');
    setTimeout(() => toast.classList.add('translate-y-[-150%]', 'opacity-0'), 3500);
}

// ================== MODAL DE CONFIRMAÇÃO CUSTOMIZADO ==================
let pendingConfirmCallback = null;

function showConfirmModal(title, msg, onConfirm) {
    document.getElementById('confirmModalTitle').innerText = title;
    document.getElementById('confirmModalMsg').innerText = msg;
    pendingConfirmCallback = onConfirm;
    const modal = document.getElementById('modalConfirmCustom');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closeConfirmModal() {
    pendingConfirmCallback = null;
    const modal = document.getElementById('modalConfirmCustom');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function executeConfirm() {
    if (typeof pendingConfirmCallback === 'function') {
        pendingConfirmCallback();
    }
    closeConfirmModal();
}

// ================== MODO ESCURO ==================
function toggleDarkMode() {
    const html = document.documentElement;
    const isDark = html.classList.toggle('dark');
    localStorage.setItem('opp_theme', isDark ? 'dark' : 'light');
    updateThemeIcon(isDark);
    if (barChart || doughnutChart) {
        renderCharts(getFilteredPolicies());
    }
}

function updateThemeIcon(isDark) {
    const icon = document.getElementById('themeIcon');
    if (!icon) return;
    icon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
    lucide.createIcons();
}

// ================== AUTENTICAÇÃO BLINDADA ==================
function handleLogin(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }

    const emailInput = document.getElementById('loginEmail');
    const passInput = document.getElementById('loginPass');
    const loginErr = document.getElementById('loginError');

    const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
    const pass = passInput ? passInput.value.trim() : '';

    // Procura na lista local de usuários
    let foundUser = users.find(u => u.email.toLowerCase() === email && u.password === pass);

    // Validação com fallback seguro para o login oficial do João
    if (!foundUser && (email === "joao.duarte@pnl.mg.gov.br" || email === "admin") && pass === "novalima2026") {
        foundUser = INITIAL_USERS[0];
    }

    if (foundUser) {
        currentUser = foundUser;
        localStorage.setItem('opp_novalima_session', JSON.stringify(currentUser));

        const overlay = document.getElementById('loginOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
            overlay.style.display = 'none';
        }

        if (loginErr) loginErr.classList.add('hidden');

        updateUserInterface();
        populateDynamicSelects();
        applyFilters();
        showToast(`Bem-vindo, ${currentUser.name}!`);
        return false;
    } else {
        // Exibe erro na tela sem recarregar a página
        if (loginErr) {
            loginErr.classList.remove('hidden');
        }
        return false;
    }
}

function logout() {
    showConfirmModal(
        'Encerrar Sessão',
        'Deseja realmente sair do Observatório?',
        () => {
            localStorage.removeItem('opp_novalima_session');
            location.reload();
        }
    );
}

function updateUserInterface() {
    if (!currentUser) return;
    const nameEl = document.getElementById('userNameLabel');
    if (nameEl) nameEl.innerText = currentUser.name;

    const initials = currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const avatarEl = document.getElementById('userAvatar');
    if (avatarEl) avatarEl.innerText = initials;

    const roleBadge = document.getElementById('userRoleBadge');
    if (roleBadge) {
        roleBadge.innerText = currentUser.role === 'SEPLAG_ADMIN' ? 'SEPLAG Admin' : (currentUser.secretaria || currentUser.role);
    }

    const btnNew = document.getElementById('btnNewPolicy');
    if (btnNew) {
        btnNew.classList.toggle('hidden', currentUser.role === 'CONSULTA');
    }

    const navAdmin = document.getElementById('nav-seguranca');
    if (navAdmin) {
        navAdmin.classList.toggle('hidden', currentUser.role !== 'SEPLAG_ADMIN');
    }
}

function canUserEditPolicy(policy) {
    if (!currentUser) return false;
    if (currentUser.role === 'SEPLAG_ADMIN') return true;
    if (currentUser.role === 'CONSULTA') return false;
    if (currentUser.role === 'SECRETARIA') {
        return currentUser.secretaria.toLowerCase().includes(policy.secretaria.toLowerCase()) ||
               policy.secretaria.toLowerCase().includes(currentUser.secretaria.toLowerCase());
    }
    return false;
}

// ================== NAVEGAÇÃO ==================
function switchTab(tabId) {
    const navIds = ['dashboard', 'matriz', 'situacao', 'seguranca'];
    navIds.forEach(id => {
        const navBtn = document.getElementById(`nav-${id}`);
        if (navBtn) {
            const icon = navBtn.querySelector('i');
            if (id === tabId) {
                navBtn.className = "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white/15 text-white font-semibold text-xs transition text-left shadow-sm";
                if (icon) icon.className = "w-4 h-4 text-amber-400";
            } else {
                navBtn.className = "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white font-medium text-xs transition text-left";
                if (icon) icon.className = "w-4 h-4";
            }
        }
    });

    document.querySelectorAll('.tab-content').forEach(view => view.classList.remove('active'));
    const target = document.getElementById(`view-${tabId}`);
    if (target) target.classList.add('active');

    const titleMap = {
        'dashboard': 'Visão Geral das Políticas Públicas',
        'matriz': 'Políticas Públicas em Monitoramento',
        'situacao': 'Apresentação Executiva (Pauta de Despacho)',
        'seguranca': 'Configurações do Sistema & Acessos'
    };
    const headerTitle = document.getElementById('headerTitle');
    if (headerTitle) headerTitle.innerText = titleMap[tabId];

    if (tabId === 'dashboard') {
        setTimeout(() => renderCharts(getFilteredPolicies()), 50);
    }
    if (tabId === 'situacao') {
        setupPresentationMode();
    }
    if (tabId === 'seguranca') {
        renderAdminSettings();
    }

    closeMobileSidebar();
    lucide.createIcons();
}

function toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar?.classList.toggle('-translate-x-full');
}

function closeMobileSidebar() {
    if (window.innerWidth < 768) {
        document.getElementById('sidebar')?.classList.add('-translate-x-full');
    }
}

// ================== CARREGAMENTO DE OPÇÕES DINÂMICAS ==================
function populateDynamicSelects() {
    const filterSec = document.getElementById('filterSecretaria');
    const modalSec = document.getElementById('policySecretaria');
    const presSec = document.getElementById('presFilterSec');
    const userSec = document.getElementById('newUserSec');

    if (filterSec) {
        const val = filterSec.value;
        filterSec.innerHTML = '<option value="TODAS">Todas as Secretarias</option>';
        settings.secretarias.forEach(s => filterSec.innerHTML += `<option value="${s}">${s}</option>`);
        filterSec.value = val || 'TODAS';
    }

    if (presSec) {
        const val = presSec.value;
        presSec.innerHTML = '<option value="TODAS">Todas as Pastas</option>';
        settings.secretarias.forEach(s => presSec.innerHTML += `<option value="${s}">${s}</option>`);
        presSec.value = val || 'TODAS';
    }

    if (modalSec) {
        modalSec.innerHTML = '<option value="">Selecione a Secretaria...</option>';
        settings.secretarias.forEach(s => modalSec.innerHTML += `<option value="${s}">${s}</option>`);
    }

    if (userSec) {
        userSec.innerHTML = '<option value="">Selecione...</option>';
        settings.secretarias.forEach(s => userSec.innerHTML += `<option value="${s}">${s}</option>`);
    }

    const filterTerr = document.getElementById('filterTerritorio');
    const modalTerr = document.getElementById('policyTerritorio');
    if (filterTerr) {
        const val = filterTerr.value;
        filterTerr.innerHTML = '<option value="TODOS">Todos os Territórios</option>';
        settings.territorios.forEach(t => filterTerr.innerHTML += `<option value="${t}">${t}</option>`);
        filterTerr.value = val || 'TODOS';
    }
    if (modalTerr) {
        modalTerr.innerHTML = '';
        settings.territorios.forEach(t => modalTerr.innerHTML += `<option value="${t}">${t}</option>`);
    }

    const filterEixo = document.getElementById('filterEixo');
    const modalEixo = document.getElementById('policyEixo');
    if (filterEixo) {
        const val = filterEixo.value;
        filterEixo.innerHTML = '<option value="TODOS">Todos os Eixos</option>';
        settings.eixos.forEach(e => filterEixo.innerHTML += `<option value="${e}">${e}</option>`);
        filterEixo.value = val || 'TODOS';
    }
    if (modalEixo) {
        modalEixo.innerHTML = '';
        settings.eixos.forEach(e => modalEixo.innerHTML += `<option value="${e}">${e}</option>`);
    }
}

// ================== FILTROS E PESQUISA ==================
function filterByStatusPill(status) {
    currentStatusFilter = currentStatusFilter === status ? 'TODOS' : status;
    applyFilters();
}

function filterByPublico(tag) {
    currentPublicFilter = tag;
    updatePublicFilterButtons();
    applyFilters();
}

function updatePublicFilterButtons() {
    const tags = ['TODOS', 'Pobreza', 'Educacao', 'Idoso'];
    tags.forEach(t => {
        const btn = document.getElementById(`btnFilter-${t}`);
        if (!btn) return;
        if (currentPublicFilter === t) {
            btn.className = "px-2.5 py-1 rounded-lg border border-blue-900 bg-[#071524] text-amber-400 font-bold text-xs shadow-sm transition";
        } else {
            btn.className = "px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-medium hover:bg-slate-100 text-slate-600 dark:text-slate-300 text-xs transition";
        }
    });
}

function filterCriticalPolicies() {
    const sec = document.getElementById('filterSecretaria');
    const terr = document.getElementById('filterTerritorio');
    const eixo = document.getElementById('filterEixo');
    const search = document.getElementById('searchInput');

    if (sec) sec.value = 'TODAS';
    if (terr) terr.value = 'TODOS';
    if (eixo) eixo.value = 'TODOS';
    if (search) search.value = '';

    currentPublicFilter = 'CRITICAS';
    currentStatusFilter = 'TODOS';
    onlyFavorites = false;
    updatePublicFilterButtons();
    applyFilters();
    showToast('Filtrando apenas ações que demandam atenção.');
}

function toggleFavoritesFilter() {
    onlyFavorites = !onlyFavorites;
    const btn = document.getElementById('btnFilterFavorites');
    if (btn) {
        btn.classList.toggle('bg-amber-400', onlyFavorites);
        btn.classList.toggle('text-slate-950', onlyFavorites);
        btn.classList.toggle('border-amber-500', onlyFavorites);
        btn.classList.toggle('bg-white', !onlyFavorites);
        btn.classList.toggle('text-slate-700', !onlyFavorites);
    }
    applyFilters();
}

function toggleFavoritePolicy(id, e) {
    if (e) e.stopPropagation();
    const p = policies.find(item => item.id === id);
    if (!p) return;
    p.favorito = !p.favorito;
    saveStorage();
    applyFilters();
    if (document.getElementById('view-situacao')?.classList.contains('active')) {
        setupPresentationMode();
    }
    showToast(p.favorito ? `"${p.nome}" destacada para despacho!` : `Destaque removido.`);
}

function clearAllFilters() {
    const sec = document.getElementById('filterSecretaria');
    const terr = document.getElementById('filterTerritorio');
    const eixo = document.getElementById('filterEixo');
    const search = document.getElementById('searchInput');

    if (sec) sec.value = 'TODAS';
    if (terr) terr.value = 'TODOS';
    if (eixo) eixo.value = 'TODOS';
    if (search) search.value = '';

    currentPublicFilter = 'TODOS';
    currentStatusFilter = 'TODOS';
    onlyFavorites = false;

    const btnFav = document.getElementById('btnFilterFavorites');
    if (btnFav) {
        btnFav.classList.remove('bg-amber-400', 'text-slate-950', 'border-amber-500');
        btnFav.classList.add('bg-white', 'text-slate-700');
    }

    updatePublicFilterButtons();
    applyFilters();
    showToast('Filtros redefinidos.');
}

function removeFilterChip(type) {
    if (type === 'secretaria') document.getElementById('filterSecretaria').value = 'TODAS';
    if (type === 'territorio') document.getElementById('filterTerritorio').value = 'TODOS';
    if (type === 'eixo') document.getElementById('filterEixo').value = 'TODOS';
    if (type === 'search') document.getElementById('searchInput').value = '';
    if (type === 'publico') currentPublicFilter = 'TODOS';
    if (type === 'status') currentStatusFilter = 'TODOS';
    if (type === 'favoritos') onlyFavorites = false;

    updatePublicFilterButtons();
    applyFilters();
}

function renderActiveFilterChips(activeCount) {
    const container = document.getElementById('activeFilterChipsContainer');
    const btnClear = document.getElementById('btnClearGlobal');
    const badgeCount = document.getElementById('clearFiltersCount');

    if (badgeCount) badgeCount.innerText = activeCount;
    if (btnClear) {
        btnClear.classList.toggle('hidden', activeCount === 0);
        btnClear.classList.toggle('flex', activeCount > 0);
    }

    if (!container) return;
    container.innerHTML = '';

    const sec = document.getElementById('filterSecretaria')?.value || 'TODAS';
    const terr = document.getElementById('filterTerritorio')?.value || 'TODOS';
    const eixo = document.getElementById('filterEixo')?.value || 'TODOS';
    const search = document.getElementById('searchInput')?.value.trim() || '';

    if (sec !== 'TODAS') {
        container.innerHTML += `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-900">Sec: ${sec} <button onclick="removeFilterChip('secretaria')" class="hover:text-red-600">✕</button></span>`;
    }
    if (terr !== 'TODOS') {
        container.innerHTML += `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold bg-blue-100 text-blue-900">${terr} <button onclick="removeFilterChip('territorio')" class="hover:text-red-600">✕</button></span>`;
    }
    if (eixo !== 'TODOS') {
        container.innerHTML += `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold bg-indigo-100 text-indigo-900">${eixo} <button onclick="removeFilterChip('eixo')" class="hover:text-red-600">✕</button></span>`;
    }
    if (search !== '') {
        container.innerHTML += `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold bg-slate-200 text-slate-800">"${search}" <button onclick="removeFilterChip('search')" class="hover:text-red-600">✕</button></span>`;
    }
    if (currentStatusFilter !== 'TODOS') {
        container.innerHTML += `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-900">${currentStatusFilter} <button onclick="removeFilterChip('status')" class="hover:text-red-600">✕</button></span>`;
    }
    if (currentPublicFilter !== 'TODOS') {
        const labels = { 'Pobreza': 'Vulnerabilidade', 'Educacao': 'Educação', 'Idoso': 'Idosos', 'CRITICAS': 'Atenção' };
        container.innerHTML += `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold bg-rose-100 text-rose-900">${labels[currentPublicFilter] || currentPublicFilter} <button onclick="removeFilterChip('publico')" class="hover:text-red-600">✕</button></span>`;
    }
    if (onlyFavorites) {
        container.innerHTML += `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold bg-amber-300 text-slate-900">★ Pauta do Prefeito <button onclick="removeFilterChip('favoritos')" class="hover:text-red-600">✕</button></span>`;
    }
}

function highlightText(text, query) {
    if (!query || !text) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return text.replace(regex, `<mark class="bg-amber-200 dark:bg-amber-400 dark:text-slate-900 px-0.5 rounded">$1</mark>`);
}

function getFilteredPolicies() {
    const sec = document.getElementById('filterSecretaria')?.value || 'TODAS';
    const terr = document.getElementById('filterTerritorio')?.value || 'TODOS';
    const eixo = document.getElementById('filterEixo')?.value || 'TODOS';
    const search = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';

    let activeFilterCount = 0;
    if (sec !== 'TODAS') activeFilterCount++;
    if (terr !== 'TODOS') activeFilterCount++;
    if (eixo !== 'TODOS') activeFilterCount++;
    if (search !== '') activeFilterCount++;
    if (currentStatusFilter !== 'TODOS') activeFilterCount++;
    if (currentPublicFilter !== 'TODOS') activeFilterCount++;
    if (onlyFavorites) activeFilterCount++;

    renderActiveFilterChips(activeFilterCount);

    let list = policies.filter(p => {
        const matchSec = (sec === 'TODAS' || p.secretaria === sec);
        const matchTerr = (terr === 'TODOS' || p.territorio === terr);
        const matchEixo = (eixo === 'TODOS' || p.eixo === eixo);
        const matchSearch = p.nome.toLowerCase().includes(search) || 
                            p.secretaria.toLowerCase().includes(search) ||
                            p.produto.toLowerCase().includes(search) ||
                            p.resultado.toLowerCase().includes(search);

        let matchStatus = true;
        if (currentStatusFilter !== 'TODOS') matchStatus = p.status === currentStatusFilter;

        let matchPublic = true;
        if (currentPublicFilter === 'Pobreza') {
            matchPublic = p.ods.includes('ODS 1') || p.ods.includes('ODS 10') || p.eixo.includes('Renda');
        } else if (currentPublicFilter === 'Educacao') {
            matchPublic = p.ods.includes('ODS 4') || p.nome.toLowerCase().includes('educa') || p.nome.toLowerCase().includes('escola');
        } else if (currentPublicFilter === 'Idoso') {
            matchPublic = p.nome.toLowerCase().includes('cuidar') || p.produto.toLowerCase().includes('idoso');
        } else if (currentPublicFilter === 'CRITICAS') {
            matchPublic = p.status === 'Atenção' || Number(p.progresso) < Number(settings.corteAtencao);
        }

        const matchFav = onlyFavorites ? !!p.favorito : true;
        return matchSec && matchTerr && matchEixo && matchSearch && matchStatus && matchPublic && matchFav;
    });

    list.sort((a, b) => {
        let valA = a[currentSort.column], valB = b[currentSort.column];
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA < valB) return currentSort.asc ? -1 : 1;
        if (valA > valB) return currentSort.asc ? 1 : -1;
        return 0;
    });

    return list;
}

function sortTable(column) {
    currentSort.asc = currentSort.column === column ? !currentSort.asc : true;
    currentSort.column = column;
    applyFilters();
}

function applyFilters() {
    const list = getFilteredPolicies();
    updateStatusPills();
    renderDashboard(list);
    renderTable(list);
    renderCardsWrapper(list);
    renderTop5(policies);
    checkAlertBanner();
    lucide.createIcons();
}

function updateStatusPills() {
    const countPrazo = policies.filter(p => p.status === 'No Prazo').length;
    const countAtencao = policies.filter(p => p.status === 'Atenção').length;
    const countSuperado = policies.filter(p => p.status === 'Superado').length;

    const elPrazo = document.getElementById('pillCountPrazo');
    const elAtencao = document.getElementById('pillCountAtencao');
    const elSuperado = document.getElementById('pillCountSuperado');

    if (elPrazo) elPrazo.innerText = countPrazo;
    if (elAtencao) elAtencao.innerText = countAtencao;
    if (elSuperado) elSuperado.innerText = countSuperado;
}

function checkAlertBanner() {
    const critical = policies.filter(p => p.status === 'Atenção' || Number(p.progresso) < Number(settings.corteAtencao));
    const banner = document.getElementById('alertBanner');
    if (!banner) return;

    if (critical.length > 0) {
        banner.classList.remove('hidden');
        const desc = document.getElementById('alertBannerDesc');
        if (desc) desc.innerText = `Atenção: ${critical.length} ação(ões) necessitam de acompanhamento prioritário.`;
    } else {
        banner.classList.add('hidden');
    }
}

// ================== VISÃO GERAL ==================
function renderDashboard(list) {
    const totalEl = document.getElementById('dashTotal');
    if (totalEl) totalEl.innerText = list.length;

    const popTotal = list.reduce((acc, p) => acc + Number(p.beneficiarios || 0), 0);
    const popEl = document.getElementById('dashPopulacao');
    if (popEl) popEl.innerText = popTotal.toLocaleString('pt-BR');

    const baseMunEl = document.getElementById('dashBaseMunicipal');
    if (baseMunEl) baseMunEl.innerText = Number(settings.populacaoOficial).toLocaleString('pt-BR');

    const orcTotal = list.reduce((acc, p) => acc + Number(p.orcamento || 0), 0);
    const custoMedio = popTotal > 0 ? Math.round(orcTotal / popTotal) : 0;
    const custoEl = document.getElementById('dashCustoMedio');
    if (custoEl) custoEl.innerText = `R$ ${custoMedio.toLocaleString('pt-BR')}`;

    const media = list.length ? Math.round(list.reduce((acc, p) => acc + Number(p.progresso), 0) / list.length) : 0;
    const mediaEl = document.getElementById('dashMedia');
    if (mediaEl) mediaEl.innerText = media + '%';

    renderCharts(list);
}

function renderTop5(allList) {
    const container = document.getElementById('top5Container');
    if (!container) return;
    container.innerHTML = '';

    const sorted = [...allList].sort((a, b) => Number(b.beneficiarios) - Number(a.beneficiarios)).slice(0, 5);

    sorted.forEach((p, idx) => {
        container.innerHTML += `
            <div onclick="openFicha(${p.id})" class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 hover:border-amber-400 cursor-pointer transition">
                <div class="flex items-center justify-between text-[11px] font-bold text-slate-400">
                    <span>#0${idx + 1}</span>
                    <span class="text-amber-500 font-extrabold">${p.progresso}%</span>
                </div>
                <h4 class="font-black text-xs text-slate-800 dark:text-white mt-1 line-clamp-1">${p.nome}</h4>
                <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">${p.secretaria}</p>
                <div class="mt-2 text-xs font-black text-blue-900 dark:text-blue-400">
                    ${Number(p.beneficiarios).toLocaleString('pt-BR')} <span class="text-[10px] font-normal text-slate-400">atendimentos</span>
                </div>
            </div>
        `;
    });
}

function renderCharts(list) {
    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? '#334155' : '#e2e8f0';

    const chartCanvas = document.getElementById('chartExecucao');
    if (chartCanvas) {
        const labels = list.map(p => p.nome.length > 20 ? p.nome.substring(0, 20) + '...' : p.nome);
        const dataProgresso = list.map(p => p.progresso);

        if (barChart) barChart.destroy();
        const ctxBar = chartCanvas.getContext('2d');
        barChart = new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: '% Meta Atingida',
                    data: dataProgresso,
                    backgroundColor: isDark ? '#38bdf8' : '#071524',
                    borderRadius: 6,
                    barThickness: 22
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, max: 100, grid: { color: gridColor }, ticks: { color: textColor } },
                    x: { grid: { display: false }, ticks: { font: { size: 10 }, color: textColor } }
                }
            }
        });
    }

    const statusCanvas = document.getElementById('chartStatus');
    if (statusCanvas) {
        const countPrazo = list.filter(i => i.status === 'No Prazo').length;
        const countAtencao = list.filter(i => i.status === 'Atenção').length;
        const countSuperado = list.filter(i => i.status === 'Superado').length;

        if (doughnutChart) doughnutChart.destroy();
        const ctxDoughnut = statusCanvas.getContext('2d');
        doughnutChart = new Chart(ctxDoughnut, {
            type: 'doughnut',
            data: {
                labels: ['No Prazo', 'Em Atenção', 'Superada'],
                datasets: [{
                    data: [countPrazo, countAtencao, countSuperado],
                    backgroundColor: ['#10b981', '#f59e0b', '#2563eb'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '72%',
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 }, color: textColor } }
                }
            }
        });
    }
}

// ================== TABELA COMPACTA E CARDS ==================
function toggleDensity() {
    isDenseMode = !isDenseMode;
    const table = document.getElementById('mainTable');
    table?.classList.toggle('dense-mode', isDenseMode);
    document.getElementById('btnDensity')?.classList.toggle('bg-slate-200', isDenseMode);
}

function toggleViewMode(mode) {
    currentViewMode = mode;
    document.getElementById('tableWrapper')?.classList.toggle('hidden', mode !== 'table');
    document.getElementById('cardsWrapper')?.classList.toggle('hidden', mode === 'table');

    const btnTable = document.getElementById('btnViewTable');
    const btnCards = document.getElementById('btnViewCards');

    if (mode === 'table') {
        btnTable?.classList.replace('border', 'bg-blue-900');
        btnTable?.classList.replace('text-slate-700', 'text-white');
        btnCards?.classList.replace('bg-blue-900', 'border');
        btnCards?.classList.replace('text-white', 'text-slate-700');
    } else {
        btnCards?.classList.replace('border', 'bg-blue-900');
        btnCards?.classList.replace('text-slate-700', 'text-white');
        btnTable?.classList.replace('bg-blue-900', 'border');
        btnTable?.classList.replace('text-white', 'text-slate-700');
    }
}

function renderTable(list) {
    const tbody = document.getElementById('policies-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const searchQuery = document.getElementById('searchInput')?.value.trim() || '';

    if (list.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-10 px-4">
                    <p class="text-xs font-bold text-slate-500">Nenhuma política localizada com estes filtros.</p>
                    <button onclick="clearAllFilters()" class="mt-2 text-xs text-blue-900 dark:text-blue-400 font-bold underline">Redefinir Filtros</button>
                </td>
            </tr>
        `;
        updateFooterTotals(0, 0, 0);
        return;
    }

    let totalPessoas = 0, totalOrcamento = 0;

    list.forEach(p => {
        totalPessoas += Number(p.beneficiarios || 0);
        totalOrcamento += Number(p.orcamento || 0);

        let badge = "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300";
        let bar = "bg-emerald-600";
        if (p.status === 'Atenção') {
            badge = "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
            bar = "bg-amber-500";
        } else if (p.status === 'Superado') {
            badge = "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300";
            bar = "bg-blue-600";
        }

        const custoBenef = p.beneficiarios > 0 ? Math.round(p.orcamento / p.beneficiarios) : 0;
        const canEdit = canUserEditPolicy(p);

        tbody.innerHTML += `
            <tr onclick="openEditModal(${p.id})" title="${canEdit ? 'Clique para editar' : 'Visualização de leitura'}" class="hover:bg-amber-50/50 dark:hover:bg-slate-700/50 cursor-pointer transition group border-b border-slate-100 dark:border-slate-700">
                <td class="py-3 px-4">
                    <div class="flex items-start gap-2">
                        <button onclick="toggleFavoritePolicy(${p.id}, event)" title="${p.favorito ? 'Remover da pauta' : 'Destacar na pauta do Prefeito'}" class="text-slate-300 hover:text-amber-400 transition mt-0.5">
                            <i data-lucide="star" class="w-4 h-4 ${p.favorito ? 'fill-amber-400 text-amber-400' : ''}"></i>
                        </button>
                        <div>
                            <div class="font-bold text-slate-900 dark:text-white group-hover:text-blue-900 dark:group-hover:text-amber-400 transition leading-snug">
                                ${highlightText(p.nome, searchQuery)}
                            </div>
                            <div class="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                                <span class="font-bold text-slate-700 dark:text-slate-300">${highlightText(p.secretaria, searchQuery)}</span>
                                <span>•</span>
                                <span>${p.territorio}</span>
                            </div>
                            <span class="inline-block text-[9px] font-bold text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 px-1.5 py-0.2 rounded mt-1">
                                ${p.ods}
                            </span>
                        </div>
                    </div>
                </td>
                <td class="py-3 px-4 text-xs text-slate-600 dark:text-slate-300 max-w-sm">
                    <div class="line-clamp-2"><strong>Entrega:</strong> ${highlightText(p.produto, searchQuery)}</div>
                    <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 italic"><strong>Impacto:</strong> ${highlightText(p.resultado, searchQuery)}</div>
                </td>
                <td class="py-3 px-4 text-xs whitespace-nowrap">
                    <span class="font-bold text-slate-800 dark:text-slate-200">R$ ${custoBenef.toLocaleString('pt-BR')}</span>
                    <span class="text-[10px] text-slate-400 block">${Number(p.beneficiarios).toLocaleString('pt-BR')} atendimentos</span>
                </td>
                <td class="py-3 px-4 w-32">
                    <div class="flex justify-between text-xs mb-1 font-bold">
                        <span>${p.progresso}%</span>
                        <span class="text-[10px] text-slate-400 font-normal">Meta</span>
                    </div>
                    <div class="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div class="${bar} h-2 rounded-full" style="width: ${p.progresso}%"></div>
                    </div>
                </td>
                <td class="py-3 px-4 text-center whitespace-nowrap">
                    <span class="text-[11px] font-bold px-2 py-0.5 rounded-full ${badge}">${p.status}</span>
                </td>
                <td class="py-3 px-4 text-center whitespace-nowrap">
                    <button onclick="event.stopPropagation(); openFicha(${p.id})" title="Ficha A4" class="text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-1.5 rounded-lg mr-1 transition shadow-sm">
                        <i data-lucide="file-text" class="w-4 h-4"></i>
                    </button>
                    ${canEdit ? `
                    <button onclick="event.stopPropagation(); openEditModal(${p.id})" title="Editar" class="text-blue-700 hover:text-blue-900 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 p-1.5 rounded-lg mr-1 transition shadow-sm">
                        <i data-lucide="edit-3" class="w-4 h-4"></i>
                    </button>
                    ` : `
                    <span title="Acesso somente leitura" class="text-slate-300 dark:text-slate-600 p-1.5 inline-block"><i data-lucide="lock" class="w-4 h-4"></i></span>
                    `}
                    ${currentUser?.role === 'SEPLAG_ADMIN' ? `
                    <button onclick="event.stopPropagation(); deletePolicy(${p.id})" title="Excluir" class="text-red-600 hover:text-red-800 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-1.5 rounded-lg transition shadow-sm">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                    ` : ''}
                </td>
            </tr>
        `;
    });

    updateFooterTotals(list.length, totalPessoas, totalOrcamento);
}

function updateFooterTotals(count, totalPessoas, totalOrcamento) {
    const elCount = document.getElementById('footerCount');
    const elPessoas = document.getElementById('footerTotalPessoas');
    const elOrcamento = document.getElementById('footerTotalOrcamento');
    if (elCount) elCount.innerText = `${count} política(s) listada(s)`;
    if (elPessoas) elPessoas.innerText = `${totalPessoas.toLocaleString('pt-BR')} atendimentos somados`;
    if (elOrcamento) elOrcamento.innerText = `R$ ${totalOrcamento.toLocaleString('pt-BR')}`;
}

function renderCardsWrapper(list) {
    const container = document.getElementById('cardsWrapper');
    if (!container) return;
    container.innerHTML = '';

    list.forEach(p => {
        const custoBenef = p.beneficiarios > 0 ? Math.round(p.orcamento / p.beneficiarios) : 0;
        const canEdit = canUserEditPolicy(p);
        container.innerHTML += `
            <div onclick="${canEdit ? `openEditModal(${p.id})` : `openFicha(${p.id})`}" class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:border-amber-400 cursor-pointer transition flex flex-col justify-between">
                <div>
                    <div class="flex justify-between items-start gap-2">
                        <span class="text-[10px] font-bold text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-lg">${p.ods}</span>
                        <div class="flex items-center gap-1.5">
                            <button onclick="toggleFavoritePolicy(${p.id}, event)" class="text-slate-300 hover:text-amber-400">
                                <i data-lucide="star" class="w-4 h-4 ${p.favorito ? 'fill-amber-400 text-amber-400' : ''}"></i>
                            </button>
                            <span class="text-xs font-bold ${p.status === 'Atenção' ? 'text-amber-600' : 'text-emerald-600'}">${p.status}</span>
                        </div>
                    </div>
                    <h4 class="font-black text-slate-900 dark:text-white text-base mt-2.5">${p.nome}</h4>
                    <p class="text-xs text-slate-400 font-semibold">${p.secretaria} • ${p.territorio}</p>
                    <p class="text-xs text-slate-600 dark:text-slate-300 mt-2.5 line-clamp-2">${p.produto}</p>
                </div>
                <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <div>
                        <span class="text-[10px] text-slate-400 block font-bold uppercase">Custo / Atendimento</span>
                        <span class="text-xs font-black text-slate-800 dark:text-slate-200">R$ ${custoBenef.toLocaleString('pt-BR')}</span>
                    </div>
                    <span class="text-xs font-bold text-amber-600">${p.progresso}% da Meta</span>
                </div>
            </div>
        `;
    });
}

// ================== APRESENTAÇÃO EXECUTIVA ==================
function setupPresentationMode() {
    const secSelect = document.getElementById('presFilterSec');
    const selectedSec = secSelect ? secSelect.value : 'TODAS';

    presentationList = policies.filter(p => {
        const matchSec = (selectedSec === 'TODAS' || p.secretaria === selectedSec);
        const matchFav = onlyFavorites ? !!p.favorito : true;
        return matchSec && matchFav;
    });

    if (presentationList.length === 0) {
        presentationList = policies.slice(0);
    }

    if (presentationIndex >= presentationList.length) {
        presentationIndex = 0;
    }

    updatePresentationView();
}

function updatePresentationView() {
    const containerSlide = document.getElementById('presSlideContainer');
    const containerGrid = document.getElementById('presGridContainer');

    if (presentationViewMode === 'slide') {
        containerSlide?.classList.remove('hidden');
        containerGrid?.classList.add('hidden');
        renderCurrentSlide();
    } else {
        containerSlide?.classList.add('hidden');
        containerGrid?.classList.remove('hidden');
        renderPresentationGrid();
    }

    const badgeCounter = document.getElementById('presSlideCounter');
    if (badgeCounter) {
        badgeCounter.innerText = `${presentationIndex + 1} de ${presentationList.length}`;
    }
}

function renderCurrentSlide() {
    const container = document.getElementById('presSlideCard');
    if (!container) return;

    const p = presentationList[presentationIndex];
    if (!p) return;

    const custoBenef = p.beneficiarios > 0 ? Math.round(p.orcamento / p.beneficiarios) : 0;
    let badge = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
    let bar = "bg-emerald-600";
    if (p.status === 'Atenção') {
        badge = "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
        bar = "bg-amber-500";
    } else if (p.status === 'Superado') {
        badge = "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300";
        bar = "bg-blue-600";
    }

    container.innerHTML = `
        <div class="flex flex-col lg:flex-row justify-between gap-8 h-full">
            <div class="flex-1 flex flex-col justify-between">
                <div>
                    <div class="flex items-center gap-2 flex-wrap">
                        <span class="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            ${p.ods}
                        </span>
                        <span class="text-xs font-extrabold px-3 py-1 rounded-full ${badge}">
                            ${p.status}
                        </span>
                        <button onclick="toggleFavoritePolicy(${p.id}, event)" class="text-slate-300 hover:text-amber-400 p-1">
                            <i data-lucide="star" class="w-5 h-5 ${p.favorito ? 'fill-amber-400 text-amber-400' : ''}"></i>
                        </button>
                    </div>

                    <h2 class="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white mt-4 leading-tight">
                        ${p.nome}
                    </h2>
                    <p class="text-sm font-semibold text-amber-600 dark:text-amber-400 mt-1">
                        ${p.secretaria} • <span class="text-slate-500 dark:text-slate-400">${p.territorio}</span>
                    </p>

                    <div class="mt-6 space-y-4">
                        <div class="bg-slate-50 dark:bg-slate-700/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Produto Entregue ao Munícipe</span>
                            <p class="text-sm text-slate-700 dark:text-slate-200 font-medium mt-1">${p.produto}</p>
                        </div>
                        <div class="bg-slate-50 dark:bg-slate-700/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Impacto Social Direto</span>
                            <p class="text-sm text-slate-700 dark:text-slate-200 font-medium mt-1">${p.resultado}</p>
                        </div>
                    </div>
                </div>

                <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-400">
                    <span>Evidência Técnica: <strong class="text-slate-600 dark:text-slate-300">${p.nota || 'Medição regular prestada pela secretaria.'}</strong></span>
                    <button onclick="openFicha(${p.id})" class="text-blue-900 dark:text-blue-400 font-bold hover:underline">Abrir Ficha A4</button>
                </div>
            </div>

            <div class="w-full lg:w-80 flex flex-col justify-between bg-slate-50 dark:bg-slate-900/60 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shrink-0">
                <div>
                    <span class="text-xs uppercase font-extrabold text-slate-400 tracking-widest block text-center">Execução da Meta</span>
                    <div class="text-center my-4">
                        <div class="text-5xl lg:text-6xl font-black text-slate-900 dark:text-white">${p.progresso}%</div>
                        <span class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block mt-1">Marco Vigente do PPA</span>
                    </div>
                    <div class="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
                        <div class="${bar} h-3 rounded-full transition-all duration-500" style="width: ${p.progresso}%"></div>
                    </div>
                </div>

                <div class="space-y-3 my-6 pt-4 border-t border-slate-200 dark:border-slate-700 text-xs">
                    <div class="flex justify-between items-center">
                        <span class="text-slate-500 dark:text-slate-400 font-medium">Atendimentos:</span>
                        <strong class="text-amber-600 dark:text-amber-400 font-extrabold text-sm">${Number(p.beneficiarios).toLocaleString('pt-BR')}</strong>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-slate-500 dark:text-slate-400 font-medium">Orçamento Anual:</span>
                        <strong class="text-slate-800 dark:text-slate-200 font-bold">R$ ${Number(p.orcamento).toLocaleString('pt-BR')}</strong>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-slate-500 dark:text-slate-400 font-medium">Custo / Cidadão:</span>
                        <strong class="text-blue-900 dark:text-blue-400 font-bold">R$ ${custoBenef.toLocaleString('pt-BR')}/ano</strong>
                    </div>
                </div>

                <div class="text-center text-[11px] text-slate-400">
                    Use as teclas <strong>←</strong> e <strong>→</strong> do teclado
                </div>
            </div>
        </div>
    `;
    lucide.createIcons();
}

function renderPresentationGrid() {
    const container = document.getElementById('presGridContainer');
    if (!container) return;
    container.innerHTML = '';

    presentationList.forEach((p, idx) => {
        const isCurrent = idx === presentationIndex;
        container.innerHTML += `
            <div onclick="presentationIndex = ${idx}; setPresentationView('slide');" class="bg-white dark:bg-slate-800 p-5 rounded-2xl border ${isCurrent ? 'ring-2 ring-amber-400 border-amber-400' : 'border-slate-200 dark:border-slate-700'} hover:shadow-md cursor-pointer transition">
                <div class="flex justify-between text-xs font-bold text-slate-400">
                    <span>#${idx + 1} • ${p.secretaria}</span>
                    <span class="text-amber-500">${p.progresso}%</span>
                </div>
                <h4 class="font-black text-slate-900 dark:text-white text-sm mt-2 line-clamp-1">${p.nome}</h4>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">${p.produto}</p>
            </div>
        `;
    });
}

function nextSlide() {
    if (presentationList.length === 0) return;
    presentationIndex = (presentationIndex + 1) % presentationList.length;
    updatePresentationView();
}

function prevSlide() {
    if (presentationList.length === 0) return;
    presentationIndex = (presentationIndex - 1 + presentationList.length) % presentationList.length;
    updatePresentationView();
}

function setPresentationView(mode) {
    presentationViewMode = mode;
    document.getElementById('btnPresViewSlide')?.classList.toggle('bg-blue-900', mode === 'slide');
    document.getElementById('btnPresViewSlide')?.classList.toggle('text-white', mode === 'slide');
    document.getElementById('btnPresViewGrid')?.classList.toggle('bg-blue-900', mode === 'grid');
    document.getElementById('btnPresViewGrid')?.classList.toggle('text-white', mode === 'grid');
    updatePresentationView();
}

function togglePresentationAutoPlay() {
    const btn = document.getElementById('btnPresAutoPlay');
    if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        autoPlayInterval = null;
        if (btn) btn.innerHTML = `<i data-lucide="play" class="w-4 h-4 text-amber-400"></i> Auto Telão`;
        showToast('Apresentação automática pausada.');
    } else {
        autoPlayInterval = setInterval(nextSlide, autoPlaySpeed);
        if (btn) btn.innerHTML = `<i data-lucide="pause" class="w-4 h-4 text-amber-400"></i> Pausar Telão`;
        showToast(`Apresentação automática iniciada (${autoPlaySpeed / 1000}s)`);
    }
    lucide.createIcons();
}

function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
        showToast('Modo Telão ativado!');
    } else if (document.exitFullscreen) {
        document.exitFullscreen();
    }
}

function exportCadernoGeral() {
    const list = getFilteredPolicies();
    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert('Por favor, autorize pop-ups para gerar o caderno.');

    const cardsHtml = list.map(p => {
        const custo = p.beneficiarios > 0 ? Math.round(p.orcamento / p.beneficiarios) : 0;
        return `
            <div style="page-break-after: always; padding: 40px; font-family: system-ui, sans-serif; border: 2px solid #071524; border-radius: 16px; margin-bottom: 30px;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #071524; padding-bottom: 12px; margin-bottom: 20px;">
                    <div>
                        <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #f59e0b;">Prefeitura de Nova Lima • Gabinete</span>
                        <h2 style="margin: 4px 0 0 0; font-size: 20px; color: #071524;">${p.nome}</h2>
                        <span style="font-size: 12px; color: #64748b;">${p.secretaria} | ${p.territorio}</span>
                    </div>
                    <span style="padding: 6px 14px; border-radius: 9999px; background: #e0f2fe; color: #0369a1; font-weight: bold; font-size: 12px;">${p.status} - ${p.progresso}%</span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px;">
                    <div style="padding: 12px; background: #f8fafc; border-radius: 8px; text-align: center;">
                        <span style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: bold; display: block;">Atendimentos</span>
                        <strong style="font-size: 16px; color: #d97706;">${Number(p.beneficiarios).toLocaleString('pt-BR')}</strong>
                    </div>
                    <div style="padding: 12px; background: #f8fafc; border-radius: 8px; text-align: center;">
                        <span style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: bold; display: block;">Orçamento</span>
                        <strong style="font-size: 16px; color: #0f172a;">R$ ${Number(p.orcamento).toLocaleString('pt-BR')}</strong>
                    </div>
                    <div style="padding: 12px; background: #f8fafc; border-radius: 8px; text-align: center;">
                        <span style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: bold; display: block;">Custo / Benefício</span>
                        <strong style="font-size: 16px; color: #1e3a8a;">R$ ${custo.toLocaleString('pt-BR')}</strong>
                    </div>
                </div>
                <p><strong>Produto Entregue:</strong><br>${p.produto}</p>
                <p><strong>Impacto Social Alcançado:</strong><br>${p.resultado}</p>
                <p><strong>Evidência Técnica da Medição:</strong><br><em>${p.nota || 'Medição regular prestada pela secretaria.'}</em></p>
                <div style="margin-top: 30px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px;">
                    Observatório de Políticas Públicas de Nova Lima • Ciclo ${settings.cicloVigente}
                </div>
            </div>
        `;
    }).join('');

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
            <head><meta charset="UTF-8"><title>Relatório Consolidado de Políticas - Nova Lima</title></head>
            <body onload="window.print()" style="margin: 20px; background: #fff;">
                <div style="text-align: center; margin-bottom: 40px; page-break-after: always; padding-top: 120px;">
                    <h1 style="color: #071524; margin: 0;">Prefeitura Municipal de Nova Lima</h1>
                    <h2 style="color: #f59e0b; margin-top: 8px;">Observatório de Políticas Públicas</h2>
                    <h3 style="color: #64748b; font-weight: normal;">Caderno de Políticas & Evidências • ${settings.cicloVigente}</h3>
                </div>
                ${cardsHtml}
            </body>
        </html>
    `);
    printWindow.document.close();
}

// ================== FICHA EXECUTIVA ==================
function openFicha(id) {
    const p = policies.find(item => item.id === id);
    if (!p) return;

    const dataEl = document.getElementById('fichaDataEmissao');
    if (dataEl) dataEl.innerText = `Emissão: ${new Date().toLocaleDateString('pt-BR')}`;
    const custoBenef = p.beneficiarios > 0 ? Math.round(p.orcamento / p.beneficiarios) : 0;

    const contentEl = document.getElementById('fichaContent');
    if (contentEl) {
        contentEl.innerHTML = `
            <div class="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex justify-between items-start">
                <div>
                    <span class="text-[10px] uppercase font-bold text-blue-900 dark:text-blue-300 block">${p.eixo} • ${p.territorio}</span>
                    <h3 class="text-lg font-black text-slate-900 dark:text-white mt-0.5">${p.nome}</h3>
                    <p class="text-xs text-slate-600 dark:text-slate-300 font-semibold">Secretaria: ${p.secretaria}</p>
                </div>
                <div class="text-center shrink-0 ml-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=https://novalima.mg.gov.br/observatorio/evidencia?id=${p.id}" alt="QR Evidência" class="w-14 h-14 object-contain">
                    <span class="text-[8px] uppercase tracking-wider text-slate-400 font-bold block mt-1">Auditável</span>
                </div>
            </div>

            <div class="grid grid-cols-3 gap-3 text-center">
                <div class="border border-slate-200 dark:border-slate-700 p-3 rounded-xl bg-white dark:bg-slate-800">
                    <span class="text-[10px] uppercase font-bold text-slate-400 block">Atendimentos</span>
                    <span class="text-base font-black text-amber-600">${Number(p.beneficiarios).toLocaleString('pt-BR')}</span>
                </div>
                <div class="border border-slate-200 dark:border-slate-700 p-3 rounded-xl bg-white dark:bg-slate-800">
                    <span class="text-[10px] uppercase font-bold text-slate-400 block">Orçamento Anual</span>
                    <span class="text-base font-black text-slate-800 dark:text-slate-200">R$ ${Number(p.orcamento).toLocaleString('pt-BR')}</span>
                </div>
                <div class="border border-slate-200 dark:border-slate-700 p-3 rounded-xl bg-white dark:bg-slate-800">
                    <span class="text-[10px] uppercase font-bold text-slate-400 block">Custo por Atendimento</span>
                    <span class="text-base font-black text-blue-900 dark:text-blue-400">R$ ${custoBenef.toLocaleString('pt-BR')}/ano</span>
                </div>
            </div>

            <div class="space-y-3 pt-2">
                <div>
                    <strong class="text-slate-800 dark:text-slate-200 block uppercase tracking-wider text-[10px]">Indicador de Entrega:</strong>
                    <p class="text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">${p.produto}</p>
                </div>
                <div>
                    <strong class="text-slate-800 dark:text-slate-200 block uppercase tracking-wider text-[10px]">Impacto Social:</strong>
                    <p class="text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">${p.resultado}</p>
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <strong class="text-slate-800 dark:text-slate-200 block uppercase tracking-wider text-[10px]">Status:</strong>
                        <div class="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between">
                            <span class="font-bold text-slate-800 dark:text-white">${p.status}</span>
                            <span class="font-black text-emerald-600 dark:text-emerald-400">${p.progresso}% da Meta</span>
                        </div>
                    </div>
                    <div>
                        <strong class="text-slate-800 dark:text-slate-200 block uppercase tracking-wider text-[10px]">Agenda 2030:</strong>
                        <div class="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-blue-800 dark:text-blue-400 truncate">
                            ${p.ods}
                        </div>
                    </div>
                </div>
                <div>
                    <strong class="text-slate-800 dark:text-slate-200 block uppercase tracking-wider text-[10px]">Evidência Técnica:</strong>
                    <p class="text-slate-500 dark:text-slate-400 italic bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">${p.nota || 'Medição regular prestada pela secretaria.'}</p>
                </div>
            </div>

            <div class="pt-4 border-t border-slate-200 dark:border-slate-700 text-center text-[10px] text-slate-400">
                Documento emitido pelo Observatório de Políticas Públicas de Nova Lima • Ciclo ${settings.cicloVigente}
            </div>
        `;
    }

    const modalFicha = document.getElementById('modalFicha');
    if (modalFicha) {
        modalFicha.classList.remove('hidden');
        modalFicha.classList.add('flex');
    }
}

function closeFichaModal() {
    const modalFicha = document.getElementById('modalFicha');
    if (modalFicha) {
        modalFicha.classList.add('hidden');
        modalFicha.classList.remove('flex');
    }
}

// ================== CRUD DE POLÍTICAS ==================
function onProgressoInputChange() {
    const prog = Number(document.getElementById('policyProgresso').value);
    const selStatus = document.getElementById('policyStatus');
    if (!selStatus) return;

    if (prog >= Number(settings.corteSuperado)) {
        selStatus.value = 'Superado';
    } else if (prog < Number(settings.corteAtencao)) {
        selStatus.value = 'Atenção';
    } else {
        selStatus.value = 'No Prazo';
    }
}

function formatCurrencyInput(input) {
    let val = input.value.replace(/\D/g, '');
    input.value = val ? Number(val).toLocaleString('pt-BR') : '';
}

function parseCurrency(str) {
    return str ? (Number(String(str).replace(/\D/g, '')) || 0) : 0;
}

function openCreateModal() {
    if (currentUser && currentUser.role === 'CONSULTA') {
        alert('Seu perfil possui permissão apenas de consulta.');
        return;
    }

    populateDynamicSelects();
    document.getElementById('modalPolicyTitle').innerText = 'Cadastrar Política Pública';
    document.getElementById('formPolicy').reset();
    document.getElementById('policyId').value = '';

    const selSec = document.getElementById('policySecretaria');
    if (currentUser && currentUser.role === 'SECRETARIA') {
        selSec.value = currentUser.secretaria;
        selSec.disabled = true;
    } else {
        selSec.disabled = false;
    }

    const modal = document.getElementById('modalPolicy');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
    document.getElementById('policyNome')?.focus();
}

function openEditModal(id) {
    const p = policies.find(item => item.id === id);
    if (!p) return;

    if (!canUserEditPolicy(p)) {
        openFicha(id);
        return;
    }

    populateDynamicSelects();
    document.getElementById('modalPolicyTitle').innerText = 'Atualizar Política Pública / Medição';
    document.getElementById('policyId').value = p.id;
    document.getElementById('policyNome').value = p.nome;

    const selSec = document.getElementById('policySecretaria');
    selSec.value = p.secretaria;
    selSec.disabled = (currentUser?.role === 'SECRETARIA');

    document.getElementById('policyEixo').value = p.eixo;
    document.getElementById('policyTerritorio').value = p.territorio;
    document.getElementById('policyODS').value = p.ods;
    document.getElementById('policyPublico').value = Number(p.beneficiarios).toLocaleString('pt-BR');
    document.getElementById('policyOrcamento').value = Number(p.orcamento).toLocaleString('pt-BR');
    document.getElementById('policyProduto').value = p.produto;
    document.getElementById('policyResultado').value = p.resultado;
    document.getElementById('policyProgresso').value = p.progresso;
    document.getElementById('policyStatus').value = p.status;
    document.getElementById('policyNota').value = p.nota || '';

    const modal = document.getElementById('modalPolicy');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closeModal() {
    const modal = document.getElementById('modalPolicy');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function savePolicy(e) {
    if (e) e.preventDefault();

    const id = document.getElementById('policyId').value;
    const nome = document.getElementById('policyNome').value.trim();
    const secretaria = document.getElementById('policySecretaria').value;
    const progresso = Number(document.getElementById('policyProgresso').value);

    if (!secretaria) {
        alert('Por favor, selecione a Secretaria.');
        document.getElementById('policySecretaria').focus();
        return;
    }

    const agora = new Date().toLocaleString('pt-BR');
    const autor = currentUser ? currentUser.name : 'Administrador';

    const dados = {
        nome: nome,
        secretaria: secretaria,
        eixo: document.getElementById('policyEixo').value,
        territorio: document.getElementById('policyTerritorio').value,
        ods: document.getElementById('policyODS').value,
        beneficiarios: parseCurrency(document.getElementById('policyPublico').value),
        orcamento: parseCurrency(document.getElementById('policyOrcamento').value),
        produto: document.getElementById('policyProduto').value.trim(),
        resultado: document.getElementById('policyResultado').value.trim(),
        progresso: progresso,
        status: document.getElementById('policyStatus').value,
        nota: document.getElementById('policyNota').value.trim(),
        ultimaAtualizacao: { autor, data: agora }
    };

    if (id) {
        const index = policies.findIndex(p => p.id === Number(id));
        if (index !== -1) {
            policies[index] = { ...policies[index], ...dados };
            showToast(`Política "${dados.nome}" atualizada!`);
        }
    } else {
        const nova = { id: Date.now(), ...dados, favorito: false };
        policies.unshift(nova);
        showToast(`Nova política cadastrada!`);
    }

    saveStorage();
    applyFilters();
    closeModal();
}

function deletePolicy(id) {
    if (currentUser && currentUser.role !== 'SEPLAG_ADMIN') {
        alert('Apenas Administradores podem excluir políticas.');
        return;
    }
    const p = policies.find(item => item.id === id);
    if (!p) return;

    showConfirmModal(
        'Excluir Política',
        `Deseja realmente excluir "${p.nome}" do Observatório?`,
        () => {
            policies = policies.filter(item => item.id !== id);
            saveStorage();
            applyFilters();
            showToast('Política removida com sucesso.');
        }
    );
}

// ================== CONFIGURAÇÕES DO ADMINISTRADOR ==================
function renderAdminSettings() {
    renderUsersTable();
    renderConfigLists();

    const inputPop = document.getElementById('confPopulacao');
    const inputCiclo = document.getElementById('confCiclo');
    const inputAtencao = document.getElementById('confCorteAtencao');
    const inputSuperado = document.getElementById('confCorteSuperado');

    if (inputPop) inputPop.value = Number(settings.populacaoOficial).toLocaleString('pt-BR');
    if (inputCiclo) inputCiclo.value = settings.cicloVigente;
    if (inputAtencao) inputAtencao.value = settings.corteAtencao;
    if (inputSuperado) inputSuperado.value = settings.corteSuperado;
}

function saveMunicipalParams(e) {
    if (e) e.preventDefault();
    settings.populacaoOficial = parseCurrency(document.getElementById('confPopulacao').value) || 120000;
    settings.cicloVigente = document.getElementById('confCiclo').value.trim() || 'PPA 2025-2028';
    settings.corteAtencao = Number(document.getElementById('confCorteAtencao').value) || 70;
    settings.corteSuperado = Number(document.getElementById('confCorteSuperado').value) || 100;

    saveStorage();
    populateDynamicSelects();
    applyFilters();
    showToast('Parâmetros salvos com sucesso!');
}

function renderConfigLists() {
    const secContainer = document.getElementById('listConfigSecretarias');
    if (secContainer) {
        secContainer.innerHTML = '';
        settings.secretarias.forEach((sec, idx) => {
            secContainer.innerHTML += `
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
                    ${sec}
                    <button onclick="removeConfigItem('secretarias', ${idx})" class="text-slate-400 hover:text-red-500 font-bold ml-1">✕</button>
                </span>
            `;
        });
    }

    const terrContainer = document.getElementById('listConfigTerritorios');
    if (terrContainer) {
        terrContainer.innerHTML = '';
        settings.territorios.forEach((terr, idx) => {
            terrContainer.innerHTML += `
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
                    ${terr}
                    <button onclick="removeConfigItem('territorios', ${idx})" class="text-slate-400 hover:text-red-500 font-bold ml-1">✕</button>
                </span>
            `;
        });
    }

    const eixosContainer = document.getElementById('listConfigEixos');
    if (eixosContainer) {
        eixosContainer.innerHTML = '';
        settings.eixos.forEach((eixo, idx) => {
            eixosContainer.innerHTML += `
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
                    ${eixo}
                    <button onclick="removeConfigItem('eixos', ${idx})" class="text-slate-400 hover:text-red-500 font-bold ml-1">✕</button>
                </span>
            `;
        });
    }
}

function addConfigItem(type) {
    let inputId = type === 'secretarias' ? 'inputAddSecretaria' : (type === 'territorios' ? 'inputAddTerritorio' : 'inputAddEixo');
    const input = document.getElementById(inputId);
    if (!input || !input.value.trim()) return;

    const val = input.value.trim();
    if (!settings[type].includes(val)) {
        settings[type].push(val);
        saveStorage();
        populateDynamicSelects();
        renderConfigLists();
        input.value = '';
        showToast(`"${val}" adicionado!`);
    } else {
        alert('Este item já está cadastrado.');
    }
}

function removeConfigItem(type, index) {
    if (settings[type].length <= 1) {
        alert('A lista precisa conter pelo menos 1 item.');
        return;
    }
    const item = settings[type][index];
    showConfirmModal(
        'Excluir Item',
        `Deseja remover "${item}"?`,
        () => {
            settings[type].splice(index, 1);
            saveStorage();
            populateDynamicSelects();
            renderConfigLists();
            showToast('Item removido.');
        }
    );
}

// ================== USUÁRIOS E BACKUP ==================
function renderUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    users.forEach(u => {
        let badge = "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300";
        if (u.role === 'SECRETARIA') badge = "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
        if (u.role === 'CONSULTA') badge = "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300";

        tbody.innerHTML += `
            <tr class="hover:bg-slate-50/70 dark:hover:bg-slate-700/50">
                <td class="p-3 font-bold text-slate-800 dark:text-white">${u.name}</td>
                <td class="p-3 text-slate-500 dark:text-slate-400">${u.email}</td>
                <td class="p-3 font-medium text-slate-700 dark:text-slate-300">${u.secretaria}</td>
                <td class="p-3"><span class="px-2 py-0.5 rounded-md font-bold text-[11px] ${badge}">${u.role}</span></td>
                <td class="p-3 text-center">
                    ${u.email === 'joao.duarte@pnl.mg.gov.br' ? '<span class="text-[10px] text-slate-400 font-bold">Admin Geral</span>' : `
                    <button onclick="deleteUser(${u.id})" class="text-red-500 hover:text-red-700 font-bold text-xs">Excluir</button>`}
                </td>
            </tr>
        `;
    });
}

function createUser(e) {
    if (e) e.preventDefault();
    if (currentUser && currentUser.role !== 'SEPLAG_ADMIN') {
        alert('Apenas o Administrador pode cadastrar usuários.');
        return;
    }

    const newUser = {
        id: Date.now(),
        name: document.getElementById('newUserName').value.trim(),
        email: document.getElementById('newUserEmail').value.trim().toLowerCase(),
        secretaria: document.getElementById('newUserSec').value,
        role: document.getElementById('newUserRole').value,
        password: document.getElementById('newUserPass').value.trim()
    };

    users.push(newUser);
    saveStorage();
    renderUsersTable();
    document.getElementById('formNewUser')?.reset();
    showToast(`Acesso registrado para ${newUser.name}`);
    lucide.createIcons();
}

function deleteUser(id) {
    showConfirmModal(
        'Revogar Acesso',
        'Deseja revogar o acesso deste usuário?',
        () => {
            users = users.filter(u => u.id !== id);
            saveStorage();
            renderUsersTable();
            showToast('Acesso revogado.');
        }
    );
}

function resetToOfficialData() {
    showConfirmModal(
        'Restaurar Base Oficial',
        'Deseja restaurar as 19 políticas originais do PPA? As medições personalizadas serão redefinidas.',
        () => {
            localStorage.setItem('opp_novalima_policies', JSON.stringify(INITIAL_POLICIES));
            localStorage.setItem('opp_novalima_users', JSON.stringify(INITIAL_USERS));
            localStorage.setItem('opp_novalima_settings', JSON.stringify(DEFAULT_SETTINGS));
            policies = INITIAL_POLICIES;
            users = INITIAL_USERS;
            settings = DEFAULT_SETTINGS;
            populateDynamicSelects();
            applyFilters();
            renderAdminSettings();
            showToast('Dados oficiais de Nova Lima restaurados com sucesso!');
        }
    );
}

function exportBackupJSON() {
    const data = { policies, users, settings, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Backup_Observatorio_NovaLima_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Backup completo baixado com sucesso!');
}

function importBackupJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const parsed = JSON.parse(event.target.result);
            if (parsed.policies && parsed.users) {
                policies = parsed.policies;
                users = parsed.users;
                if (parsed.settings) settings = parsed.settings;
                saveStorage();
                populateDynamicSelects();
                applyFilters();
                renderAdminSettings();
                showToast('Base restaurada com sucesso!');
            } else {
                alert('Arquivo de backup inválido.');
            }
        } catch (err) {
            alert('Erro ao processar arquivo JSON.');
        }
    };
    reader.readAsText(file);
}

function exportCSV() {
    let csv = "ID;Politica;Secretaria;Eixo;Territorio;ODS;Beneficiarios;Orcamento;Custo_Beneficiario;Produto;Resultado;Progresso;Status;Nota\n";
    policies.forEach(p => {
        const custo = p.beneficiarios > 0 ? Math.round(p.orcamento / p.beneficiarios) : 0;
        csv += `"${p.id}";"${p.nome}";"${p.secretaria}";"${p.eixo}";"${p.territorio}";"${p.ods}";"${p.beneficiarios}";"R$ ${p.orcamento}";"R$ ${custo}";"${p.produto}";"${p.resultado}";"${p.progresso}%";"${p.status}";"${p.nota || ''}"\n`;
    });

    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Observatorio_NovaLima_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Planilha CSV gerada com sucesso!');
}

// ================== CONTROLE POR TECLADO ==================
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        closeFichaModal();
        closeConfirmModal();
    }
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            switchTab('matriz');
            searchInput.focus();
        }
    }
    if (document.getElementById('view-situacao')?.classList.contains('active')) {
        if (e.key === 'ArrowRight' || e.key === ' ') {
            e.preventDefault();
            nextSlide();
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            prevSlide();
        }
    }
});

// ================== INICIALIZAÇÃO ==================
window.onload = () => {
    if (localStorage.getItem('opp_theme') === 'dark') {
        document.documentElement.classList.add('dark');
        updateThemeIcon(true);
    }

    if (!localStorage.getItem('opp_novalima_policies')) {
        localStorage.setItem('opp_novalima_policies', JSON.stringify(INITIAL_POLICIES));
        localStorage.setItem('opp_novalima_users', JSON.stringify(INITIAL_USERS));
        localStorage.setItem('opp_novalima_settings', JSON.stringify(DEFAULT_SETTINGS));
    }

    if (currentUser) {
        const overlay = document.getElementById('loginOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
            overlay.style.display = 'none';
        }
        updateUserInterface();
    }

    populateDynamicSelects();
    applyFilters();
    lucide.createIcons();
};