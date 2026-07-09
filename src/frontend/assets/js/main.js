/**
 * STOCKVISION - CONTROLADOR DE EVENTOS E INTERAÇÃO DA INTERFACE (DOM)
 * Adaptado para Bootstrap 5 e Chart.js
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // Variáveis globais para instâncias dos gráficos Chart.js
    let financialChartInstance = null;
    let stockChartInstance = null;
    let currentTimelineData = null;

    // =========================================================================
    // 1. FLUXO DE AUTENTICAÇÃO (LOGIN E CADASTRO)
    // =========================================================================
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const submitBtn = loginForm.querySelector('.btn') || loginForm.querySelector('button[type="submit"]');

            try {
                if (submitBtn) { submitBtn.innerText = 'Autenticando...'; submitBtn.disabled = true; }
                const response = await AuthAPI.login(email, password);
                alert(response.message || 'Login efetuado com sucesso!');
                window.location.href = 'dashboard.html';
            } catch (error) {
                alert(`Erro ao acessar: ${error.message}`);
                if (submitBtn) { submitBtn.innerText = 'Entrar'; submitBtn.disabled = false; }
            }
        });
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fullname = document.getElementById('fullname').value.trim();
            const email = document.getElementById('email').value.trim();
            const company = document.getElementById('company').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const submitBtn = registerForm.querySelector('.btn') || registerForm.querySelector('button[type="submit"]');

            if (password !== confirmPassword) {
                alert('Atenção: A confirmação de senha não coincide!');
                return;
            }

            try {
                if (submitBtn) { submitBtn.innerText = 'Processando Cadastro...'; submitBtn.disabled = true; }
                const response = await AuthAPI.registerCompany(fullname, email, company, password);
                alert(response.message || 'Empresa cadastrada com sucesso!');
                window.location.href = 'dashboard.html';
            } catch (error) {
                alert(`Erro ao cadastrar: ${error.message}`);
                if (submitBtn) { submitBtn.innerText = 'Criar conta'; submitBtn.disabled = false; }
            }
        });
    }

    // =========================================================================
    // 2. FUNÇÃO CORE DE GRÁFICOS (CHART.JS + BOOTSTRAP THEME)
    // =========================================================================
    const buildCharts = (historyTimeline) => {
        if (typeof Chart === 'undefined') {
            console.error("Chart.js não encontrado. Verifique se o script foi importado no HTML.");
            return;
        }

        // Lê dinamicamente as cores do tema (Light/Dark mode)
        const computedTextColor = getComputedStyle(document.documentElement).getPropertyValue('--bs-body-color').trim() || '#212529';
        const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--bs-border-color').trim() || 'rgba(0,0,0,0.1)';

        // Limpa gráficos anteriores para evitar sobreposição
        if (financialChartInstance) financialChartInstance.destroy();
        if (stockChartInstance) stockChartInstance.destroy();

        Chart.defaults.color = computedTextColor;
        Chart.defaults.font.family = 'system-ui, -apple-system, sans-serif';

        // 📊 GRÁFICO DE LINHAS (RECEITAS E CUSTOS)
        const ctxFinancial = document.getElementById('financialChart');
        if (ctxFinancial && historyTimeline) {
            financialChartInstance = new Chart(ctxFinancial, {
                type: 'line',
                data: {
                    labels: historyTimeline.months,
                    datasets: [
                        { label: 'Receitas (R$)', data: historyTimeline.revenue, borderColor: '#0d6efd', backgroundColor: 'rgba(13, 110, 253, 0.1)', tension: 0.3, borderWidth: 3, fill: true },
                        { label: 'Custos (R$)', data: historyTimeline.costs, borderColor: '#dc3545', backgroundColor: 'rgba(220, 53, 69, 0.05)', tension: 0.3, borderWidth: 2, fill: true }
                    ]
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false, 
                    plugins: { legend: { labels: { color: computedTextColor } } },
                    scales: {
                        x: { grid: { color: gridColor }, ticks: { color: computedTextColor } },
                        y: { grid: { color: gridColor }, ticks: { color: computedTextColor } }
                    }
                }
            });
        }

        // 📊 GRÁFICO DE BARRAS (VOLUME DE ESTOQUE)
        const ctxStock = document.getElementById('stockChart');
        if (ctxStock && historyTimeline) {
            stockChartInstance = new Chart(ctxStock, {
                type: 'bar',
                data: { 
                    labels: historyTimeline.months, 
                    datasets: [{ label: 'Volume Físico', data: historyTimeline.stockLevels, backgroundColor: '#0dcaf0', borderRadius: 4 }] 
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false, 
                    plugins: { legend: { labels: { color: computedTextColor } } },
                    scales: {
                        x: { grid: { display: false }, ticks: { color: computedTextColor } },
                        y: { grid: { color: gridColor }, ticks: { color: computedTextColor } }
                    }
                }
            });
        }
    };

    // Helper para converter o nome das cores em classes Badge do Bootstrap 5
    const getBootstrapBadge = (colorName) => {
        if (colorName === 'red') return 'bg-danger';
        if (colorName === 'orange') return 'bg-warning text-dark';
        if (colorName === 'green') return 'bg-success';
        if (colorName === 'blue') return 'bg-primary';
        return 'bg-secondary';
    };

    // =========================================================================
    // 3. FLUXO DO DASHBOARD (MÉTRICAS, GRÁFICOS E ALERTAS)
    // =========================================================================
    const alertsTableBody = document.getElementById('alerts-table-body');
    const financialChartEl = document.getElementById('financialChart');
    
    if (alertsTableBody || financialChartEl) {
        const renderDashboardData = async () => {
            try {
                const activeUser = TokenManager.getUser();
                if (!activeUser) {
                    window.location.href = 'login.html';
                    return;
                }

                // Preencher Perfil
                const userTitleEl = document.getElementById('user-name-display') || document.querySelector('.user-info h4') || document.querySelector('.user-info h3') || document.querySelector('h3');
                const companySubEl = document.getElementById('user-company-display') || document.querySelector('.user-info p') || document.querySelector('.topbar p');
                if (userTitleEl) userTitleEl.innerText = `Olá, ${activeUser.fullname.toUpperCase()}`;
                if (companySubEl) companySubEl.innerText = activeUser.company;

                let metrics = { financials: { totalRevenue: 0, totalCosts: 0, estimatedProfit: 0 }, indicators: { stockLevel: 0 }, historyTimeline: null };
                let inventoryProducts = [];

                try { metrics = await StockAPI.getDashboardMetrics(); } catch (e) { console.error("Erro nas métricas:", e); }
                try { inventoryProducts = await StockAPI.getInventory(); } catch (e) { console.error("Erro no inventário:", e); }
                
                const { financials, indicators, historyTimeline } = metrics;
                currentTimelineData = historyTimeline;

                // Preencher Cards (Métricas Superiores)
                const cards = document.querySelectorAll('.card');
                if (cards.length >= 4) {
                    const formatCurrency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
                    
                    const revEl = cards[0].querySelector('.card-title') || cards[0].querySelector('.card-value') || cards[0].querySelector('h3');
                    const costEl = cards[1].querySelector('.card-title') || cards[1].querySelector('.card-value') || cards[1].querySelector('h3');
                    const profEl = cards[2].querySelector('.card-title') || cards[2].querySelector('.card-value') || cards[2].querySelector('h3');
                    const stockEl = cards[3].querySelector('.card-title') || cards[3].querySelector('.card-value') || cards[3].querySelector('h3');

                    if (revEl) revEl.textContent = formatCurrency(financials.totalRevenue || 0);
                    if (costEl) costEl.textContent = formatCurrency(financials.totalCosts || 0);
                    if (stockEl) stockEl.textContent = `${(indicators.stockLevel || 0).toLocaleString('pt-BR')} un`;
                    
                    if (profEl) {
                        profEl.textContent = formatCurrency(financials.estimatedProfit || 0);
                        if (financials.estimatedProfit < 0) {
                            profEl.classList.remove('text-success');
                            profEl.classList.add('text-danger');
                            cards[2].classList.replace('border-success', 'border-danger');
                            cards[2].classList.replace('bg-success-subtle', 'bg-danger-subtle');
                        }
                    }
                }

                // Renderiza os Gráficos Chart.js
                if (currentTimelineData) {
                    buildCharts(currentTimelineData);
                }

                // Renderiza Tabela de Alertas com Badges Bootstrap
                if (alertsTableBody) {
                    alertsTableBody.innerHTML = '';
                    let totalAlertRows = 0;

                    if (Array.isArray(inventoryProducts)) {
                        inventoryProducts.forEach(prod => {
                            const statusVis = prod.statusVisual || { alertColor: 'blue', statusTag: 'Normal' };
                            
                            if (statusVis.alertColor === 'red' || statusVis.alertColor === 'orange' || statusVis.statusTag === 'Estoque Baixo' || statusVis.statusTag === 'Ruptura') {
                                totalAlertRows++;
                                const row = document.createElement('tr');
                                row.innerHTML = `
                                    <td class="ps-4 fw-bold">${prod.name}</td>
                                    <td class="text-muted">${prod.sku || 'N/A'}</td>
                                    <td class="fw-semibold">${(prod.quantityInStock || 0).toLocaleString('pt-BR')} un</td>
                                    <td>Atenção Logística</td>
                                    <td class="pe-4"><span class="badge ${getBootstrapBadge(statusVis.alertColor)} px-2 py-1">${statusVis.statusTag}</span></td>
                                `;
                                alertsTableBody.appendChild(row);
                            }
                        });
                    }

                    if (totalAlertRows === 0) {
                        alertsTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-success fw-bold py-4">🌱 Operação saudável. Nenhum alerta crítico.</td></tr>`;
                    }
                }

            } catch (error) {
                console.error('[Dashboard Render Error]:', error.message);
            }
        };

        renderDashboardData();

        // Garante a re-renderização dos gráficos ao alternar Tema Claro/Escuro
        const themeBtn = document.getElementById('theme-toggle');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                setTimeout(() => { if (currentTimelineData) buildCharts(currentTimelineData); }, 150);
            });
        }
    }

    // =========================================================================
    // 4. MÓDULO DE ESTOQUE AVANÇADO (CRUD)
    // =========================================================================
    const inventoryTableBody = document.getElementById('inventory-table-body');
    const productForm = document.getElementById('product-form');

    if (inventoryTableBody) {
        let localProductsCache = [];

        const searchNameInput = document.getElementById('search-name');
        const searchCategoryInput = document.getElementById('search-category');
        const searchStatusInput = document.getElementById('search-status');
        const searchMaxPriceInput = document.getElementById('search-max-price');
        const createModalElement = document.getElementById('create-modal');
        const editModalElement = document.getElementById('edit-modal');
        const createModal = createModalElement ? bootstrap.Modal.getOrCreateInstance(createModalElement) : null;
        const editModal = editModalElement ? bootstrap.Modal.getOrCreateInstance(editModalElement) : null;

        const expirationCheckbox = document.getElementById('isIndeterminateExpiration');
        const expirationContainer = document.getElementById('expiration-container');
        const expirationInput = document.getElementById('expirationDate');

        if (expirationCheckbox && expirationContainer && expirationInput) {
            const toggleExpirationField = () => {
                expirationInput.required = !expirationCheckbox.checked;
                expirationContainer.style.display = expirationCheckbox.checked ? 'none' : 'block';
                if (expirationCheckbox.checked) expirationInput.value = '';
            };
            expirationCheckbox.addEventListener('change', toggleExpirationField);
            toggleExpirationField();
        }

        window.openCreateModal = () => { if (createModal) createModal.show(); };
        window.closeCreateModal = () => { if (createModal) createModal.hide(); if (productForm) productForm.reset(); };

        window.openEditModal = (id) => {
            const prod = localProductsCache.find(p => p._id === id);
            if (!prod) return;
            document.getElementById('edit-id').value = prod._id;
            document.getElementById('edit-name').value = prod.name;
            document.getElementById('edit-quantity').value = prod.quantityInStock;
            document.getElementById('edit-price').value = prod.sellingPrice;
            if (editModal) editModal.show();
        };

        window.deleteProductClick = async (id, name) => {
            if (confirm(`Deseja realmente excluir o produto "${name}"?`)) {
                try {
                    await StockAPI.deleteProduct(id);
                    alert('Produto removido.');
                    loadInventoryTable();
                } catch (error) { alert(`Falha ao remover: ${error.message}`); }
            }
        };

        const renderTableRows = (productsList) => {
            inventoryTableBody.innerHTML = '';
            if (productsList.length === 0) {
                inventoryTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Nenhum insumo localizado.</td></tr>';
                return;
            }

            productsList.forEach(p => {
                const row = document.createElement('tr');
                const formatCurrency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
                const locationText = p.location ? `${p.location.sector || 'N/A'} / ${p.location.row || 'N/A'} / ${p.location.building || 'N/A'}` : 'Sem endereço';
                const expirationText = p.isIndeterminateExpiration ? 'Inperecível' : (p.expirationDate ? new Date(p.expirationDate).toLocaleDateString('pt-BR') : 'Não informada');
                row.innerHTML = `
                    <td><strong class="text-primary">${p.name}</strong><br><small class="text-muted">SKU: ${p.sku || 'N/A'}</small></td>
                    <td class="font-monospace small">${locationText}</td>
                    <td class="fw-bold">${(p.quantityInStock || 0).toLocaleString('pt-BR')} un</td>
                    <td>${formatCurrency(p.sellingPrice || 0)}</td>
                    <td><span class="badge ${getBootstrapBadge(p.statusVisual.alertColor)} px-2 py-1">${p.statusVisual.statusTag}</span></td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-primary border-0" onclick="toggleProductDetails('${p._id}')">📄</button>
                        <button class="btn btn-sm btn-outline-secondary border-0" onclick="openEditModal('${p._id}')">✏️</button>
                        <button class="btn btn-sm btn-outline-danger border-0" onclick="deleteProductClick('${p._id}', '${p.name}')">🗑️</button>
                    </td>
                `;
                row.addEventListener('click', (event) => {
                    if (event.target.tagName === 'BUTTON') return;
                    toggleProductDetails(p._id);
                });
                inventoryTableBody.appendChild(row);
            });
        };

        const populateFilterOptions = (products) => {
            if (!searchCategoryInput) return;
            const categories = [...new Set(products.map(product => product.category).filter(Boolean))].sort();
            searchCategoryInput.innerHTML = '<option value="">Categoria</option>' + categories.map(category => `<option value="${category}">${category}</option>`).join('');
        };

        const applyInventoryFilters = () => {
            const nameFilter = (searchNameInput?.value || '').trim().toLowerCase();
            const categoryFilter = (searchCategoryInput?.value || '').trim().toLowerCase();
            const statusFilter = (searchStatusInput?.value || '').trim();
            const maxPriceFilter = parseFloat(searchMaxPriceInput?.value || '');

            const filtered = localProductsCache.filter((product) => {
                const matchesName = !nameFilter || `${product.name} ${product.sku || ''}`.toLowerCase().includes(nameFilter);
                const matchesCategory = !categoryFilter || (product.category || '').toLowerCase() === categoryFilter;
                const matchesStatus = !statusFilter || (product.statusVisual?.statusTag || '') === statusFilter;
                const matchesPrice = Number.isNaN(maxPriceFilter) || (product.sellingPrice || 0) <= maxPriceFilter;
                return matchesName && matchesCategory && matchesStatus && matchesPrice;
            });

            renderTableRows(filtered);
        };

        [searchNameInput, searchCategoryInput, searchStatusInput, searchMaxPriceInput].forEach((field) => {
            if (!field) return;
            field.addEventListener('input', applyInventoryFilters);
            field.addEventListener('change', applyInventoryFilters);
        });

        window.toggleProductDetails = (id) => {
            const product = localProductsCache.find(p => p._id === id);
            const drawer = document.getElementById('details-drawer');
            if (!product || !drawer) return;
            document.getElementById('drawer-product-name').textContent = `📦 ${product.name}`;
            document.getElementById('drawer-location').textContent = product.location ? `${product.location.sector || 'N/A'} / ${product.location.row || 'N/A'} / ${product.location.building || 'N/A'} / ${product.location.floor || 'N/A'} / ${product.location.apartment || 'N/A'}` : 'Sem endereço';
            document.getElementById('drawer-turnover').textContent = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((product.sellingPrice || 0) * (product.quantityInStock || 0));
            document.getElementById('drawer-status-tag').innerHTML = `<span class="badge ${getBootstrapBadge(product.statusVisual?.alertColor || 'blue')} px-2 py-1">${product.statusVisual?.statusTag || 'Normal'}</span>`;
            document.getElementById('drawer-expiration').textContent = product.isIndeterminateExpiration ? 'Inperecível' : (product.expirationDate ? new Date(product.expirationDate).toLocaleDateString('pt-BR') : 'Não informada');
            document.getElementById('drawer-category').textContent = product.category || 'Geral';
            document.getElementById('drawer-limits').textContent = `${product.minimumStock || 0} / ${product.maximumStock || 0}`;
            document.getElementById('drawer-supplier').textContent = product.supplier || 'Não informado';
            drawer.style.display = 'block';
        };

        const loadInventoryTable = async () => {
            try {
                inventoryTableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4">Buscando posições...</td></tr>';
                const products = await StockAPI.getInventory();
                localProductsCache = Array.isArray(products) ? products : [];
                populateFilterOptions(localProductsCache);
                applyInventoryFilters();
            } catch (error) { inventoryTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger py-4">Erro ao carregar inventário.</td></tr>'; }
        };

        if (productForm) {
            productForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const productPayload = {
                    name: document.getElementById('name').value.trim(),
                    category: document.getElementById('category').value.trim(),
                    acquisitionCost: parseFloat(document.getElementById('acquisitionCost').value),
                    sellingPrice: parseFloat(document.getElementById('sellingPrice').value),
                    quantityInStock: parseInt(document.getElementById('quantityInStock').value, 10),
                    minimumStock: parseInt(document.getElementById('minimumStock').value, 10),
                    maximumStock: parseInt(document.getElementById('maximumStock').value, 10),
                    isIndeterminateExpiration: document.getElementById('isIndeterminateExpiration').checked,
                    expirationDate: document.getElementById('expirationDate').value || null,
                    location: {
                        sector: document.getElementById('sector').value.trim(),
                        row: document.getElementById('row').value.trim(),
                        building: document.getElementById('building').value.trim(),
                        floor: document.getElementById('floor').value.trim(),
                        apartment: document.getElementById('apartment').value.trim()
                    }
                };

                try {
                    await StockAPI.createProduct(productPayload);
                    alert('Produto cadastrado com sucesso!');
                    closeCreateModal();
                    loadInventoryTable();
                } catch (error) { alert(`Erro: ${error.message}`); }
            });
        }

        const editForm = document.getElementById('edit-product-form');
        if (editForm) {
            editForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const id = document.getElementById('edit-id').value;
                const updatedFields = {
                    name: document.getElementById('edit-name').value.trim(),
                    quantityInStock: parseInt(document.getElementById('edit-quantity').value, 10),
                    sellingPrice: parseFloat(document.getElementById('edit-price').value)
                };

                try {
                    await StockAPI.updateProduct(id, updatedFields);
                    alert('Atualizado!');
                    if (editModal) editModal.hide();
                    loadInventoryTable();
                } catch (error) { alert(`Erro: ${error.message}`); }
            });
        }

        loadInventoryTable();
    }
});