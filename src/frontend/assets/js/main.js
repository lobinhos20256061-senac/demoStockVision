/**
 * STOCKVISION - CONTROLADOR DE EVENTOS E INTERAÇÃO DA INTERFACE (DOM)
 * Centraliza e orquestra todas as manipulações de tela e sincronizações NoSQL.
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // =========================================================================
    // 1. FLUXO DE AUTENTICAÇÃO (LOGIN E CADASTRO)
    // =========================================================================
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const submitBtn = loginForm.querySelector('.btn');

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
            const submitBtn = registerForm.querySelector('.btn');

            if (password !== confirmPassword) {
                alert('Atenção: A confirmação de senha não coincide com a senha digitada!');
                return;
            }

            try {
                if (submitBtn) { submitBtn.innerText = 'Processando Cadastro...'; submitBtn.disabled = true; }
                const response = await AuthAPI.registerCompany(fullname, email, company, password);
                alert(response.message || 'Empresa e Administrador cadastrados com sucesso!');
                window.location.href = 'dashboard.html';
            } catch (error) {
                alert(`Erro ao cadastrar: ${error.message}`);
                if (submitBtn) { submitBtn.innerText = 'Criar conta'; submitBtn.disabled = false; }
            }
        });
    }

    // =========================================================================
    // 2. FLUXO DO PAINEL PRINCIPAL (DASHBOARD - REAL TIME DATA)
    // =========================================================================
    const metricsGrid = document.querySelector('.metrics-grid');
    const alertsTableBody = document.getElementById('alerts-table-body');
    
    if (metricsGrid && alertsTableBody) {
        const renderDashboardData = async () => {
            try {
                const activeUser = TokenManager.getUser();
                const token = TokenManager.getToken();

                if (!activeUser || !token) {
                    window.location.href = 'login.html';
                    return;
                }

                const userTitleEl = document.querySelector('.user-info h3');
                const companySubEl = document.querySelector('.user-info p');
                if (userTitleEl) userTitleEl.innerText = `Olá, ${activeUser.fullname}`;
                if (companySubEl) companySubEl.innerText = activeUser.company;

                // Isolamento preventivo de chamadas para evitar que quebras de Schema travem a UI
                let metrics = { financials: { totalRevenue: 0, totalCosts: 0, estimatedProfit: 0 }, indicators: { stockLevel: 0 } };
                let inventoryProducts = [];
                let expirationAlerts = [];

                try { metrics = await StockAPI.getDashboardMetrics(); } catch (e) { console.error("Erro nas métricas:", e); }
                try { inventoryProducts = await StockAPI.getInventory(); } catch (e) { console.error("Erro no inventário:", e); }
                try { expirationAlerts = await StockAPI.getExpirationAlerts(); } catch (e) { console.error("Erro nos alertas ESG:", e); }
                
                // --- RENDERIZAR CARTÕES DE LOGÍSTICA ---
                const { financials, indicators } = metrics;
                const cards = metricsGrid.querySelectorAll('.card');

                if (cards.length >= 4) {
                    const formatCurrency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
                    cards[0].querySelector('.card-value').textContent = formatCurrency(financials.totalRevenue || 0);
                    cards[1].querySelector('.card-value').textContent = formatCurrency(financials.totalCosts || 0);
                    cards[2].querySelector('.card-value').textContent = formatCurrency(financials.estimatedProfit || 0);
                    cards[3].querySelector('.card-value').textContent = `${(indicators.stockLevel || 0).toLocaleString('pt-BR')} un`;
                }

                // --- RENDERIZAR TABELA DE ALERTAS OPERACIONAIS CRÍTICOS (CORRIGIDO) ---
                alertsTableBody.innerHTML = '';
                let totalAlertRows = 0;

                if (Array.isArray(inventoryProducts)) {
                    inventoryProducts.forEach(prod => {
                        const statusVis = prod.statusVisual || { alertColor: 'blue', statusTag: 'Normal' };
                        const { alertColor, statusTag } = statusVis;
                        
                        // Captura qualquer desvio dos limites operacionais seguros de estoque
                        if (alertColor === 'red' || alertColor === 'orange' || statusTag === 'Estoque Baixo' || statusTag === 'Ruptura') {
                            totalAlertRows++;
                            const row = document.createElement('tr');
                            
                            // Define dinamicamente o texto de descrição com base na tag estrita calculada pelo back-end
                            let alertDescription = 'Ajuste Operacional Solicitado';
                            if (statusTag === 'Ruptura') alertDescription = '🚨 Ruptura Total de Estoque (Saldo Zero)';
                            if (statusTag === 'Estoque Baixo') alertDescription = '⚠️ Abaixo do Estoque Mínimo de Segurança';
                            if (statusTag === 'Excesso') alertDescription = '💸 Capital Imobilizado (Acima do Máximo)';

                            row.innerHTML = `
                                <td><strong>${prod.name}</strong></td>
                                <td>${prod.sku || 'N/A'}</td>
                                <td>${(prod.quantityInStock || 0).toLocaleString('pt-BR')} un</td>
                                <td style="font-weight: 500;">${alertDescription}</td>
                                <td><span class="status-badge ${alertColor}">${statusTag}</span></td>
                            `;
                            alertsTableBody.appendChild(row);
                        }
                    });
                }

                if (Array.isArray(expirationAlerts)) {
                    expirationAlerts.forEach(alertItem => {
                        totalAlertRows++;
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td><strong>${alertItem.productName} (Lote)</strong></td>
                            <td>${alertItem.sku || 'Lote Crítico'}</td>
                            <td>${(alertItem.quantity || 0).toLocaleString('pt-BR')} un</td>
                            <td style="color: var(--color-esg); font-weight: 600;">♻️ Risco Ambiental: Vence em ${alertItem.diasRestantes} dias</td>
                            <td><span class="status-badge green">Log. Reversa</span></td>
                        `;
                        alertsTableBody.appendChild(row);
                    });
                }

                if (totalAlertRows === 0) {
                    alertsTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--color-esg); font-weight: 600;">🌱 Nenhum alerta crítico detectado. Operação rodando em conformidade!</td></tr>`;
                }

            } catch (error) {
                console.error('[Dashboard Render Error Global]:', error.message);
            }
        };

        renderDashboardData();
    }

    // =========================================================================
    // 3. FLUXO DO MÓDULO DE ESTOQUE AVANÇADO (POP-UPS, MATRIZ E EXCLUSÃO)
    // =========================================================================
    const productForm = document.getElementById('product-form');
    const inventoryTableBody = document.getElementById('inventory-table-body');

    if (inventoryTableBody) {
        let localProductsCache = [];

        const activeUser = TokenManager.getUser();
        if (activeUser) {
            const display = document.getElementById('company-name-display');
            if (display) display.innerText = `Almoxarifado Central: ${activeUser.company}`;
        }

        // Seleção de Controles de Filtros Avançados
        const searchName = document.getElementById('search-name');
        const searchCategory = document.getElementById('search-category');
        const searchStatus = document.getElementById('search-status');
        const searchMaxPrice = document.getElementById('search-max-price');

        // Escutadores integrados para os inputs de filtros
        if (searchName) {
            [searchName, searchCategory, searchStatus, searchMaxPrice].forEach(el => {
                el.addEventListener('input', () => applyAdvancedFilters());
            });
        }

        const applyAdvancedFilters = () => {
            const nameQ = searchName.value.toLowerCase().trim();
            const catQ = searchCategory.value;
            const statQ = searchStatus.value;
            const priceQ = parseFloat(searchMaxPrice.value);

            const filtered = localProductsCache.filter(p => {
                const mName = p.name.toLowerCase().includes(nameQ) || p.sku.toLowerCase().includes(nameQ);
                const mCat = catQ === "" || p.category === catQ;
                const mStat = statQ === "" || p.statusVisual.statusTag === statQ;
                const mPrice = isNaN(priceQ) || p.sellingPrice <= priceQ;
                
                return mName && mCat && mStat && mPrice;
            });
            renderTableRows(filtered);
        };

        const populateCategoryDropdown = (products) => {
            const categories = [...new Set(products.map(p => p.category))];
            searchCategory.innerHTML = '<option value="">Categorias</option>';
            categories.forEach(cat => {
                const opt = document.createElement('option'); opt.value = cat; opt.innerText = cat;
                searchCategory.appendChild(opt);
            });
        };

        // GESTÃO DOS MODAIS (POP-UPS)
        window.openCreateModal = () => { 
            document.getElementById('create-modal').style.display = 'flex'; 
        };
        
        window.closeCreateModal = () => {
            document.getElementById('create-modal').style.display = 'none';
            if (productForm) productForm.reset();
        };

        window.openEditModal = (id) => {
            const prod = localProductsCache.find(p => p._id === id);
            if (!prod) return;

            document.getElementById('edit-id').value = prod._id;
            document.getElementById('edit-name').value = prod.name;
            document.getElementById('edit-quantity').value = prod.quantityInStock;
            document.getElementById('edit-price').value = prod.sellingPrice;

            const loc = prod.location || {};
            document.getElementById('edit-sector').value = loc.sector || '';
            document.getElementById('edit-row').value = loc.row || '';
            document.getElementById('edit-building').value = loc.building || '';
            document.getElementById('edit-floor').value = loc.floor || '';
            document.getElementById('edit-apartment').value = loc.apartment || '';

            document.getElementById('edit-modal').style.display = 'flex';
        };

        // GAVETA DE INDICADORES INDIVIDUAIS
        window.expandProductMetrics = (id) => {
            const prod = localProductsCache.find(p => p._id === id);
            if (!prod) return;

            document.getElementById('details-drawer').style.display = 'block';
            document.getElementById('drawer-product-name').innerHTML = `📊 Métricas Individuais: <strong>${prod.name}</strong> <small>(SKU: ${prod.sku})</small>`;
            
            const loc = prod.location || {};
            document.getElementById('drawer-location').innerText = `Setor ${loc.sector || 'N/D'} | Rua ${loc.row || 'N/D'} | Prédio ${loc.building || 'N/D'} | Vão ${loc.apartment || 'N/D'}`;
            
            const formatCurrency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
            document.getElementById('drawer-turnover').innerText = formatCurrency(prod.sellingPrice * prod.quantityInStock);
            document.getElementById('drawer-status-tag').innerHTML = `<span class="status-badge ${prod.statusVisual.alertColor}">${prod.statusVisual.statusTag}</span>`;
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        // EXCLUSÃO FÍSICA NO BANCO (DELETE)
        window.deleteProductClick = async (id, name) => {
            const confirmation = confirm(`🚨 ATENÇÃO OPERACIONAL:\nDeseja realmente excluir permanentemente o produto "${name}" do inventário?`);
            if (confirmation) {
                try {
                    const result = await StockAPI.deleteProduct(id);
                    alert(result.message || 'Produto removido com sucesso.');
                    loadInventoryTable();
                } catch (error) { alert(`Falha ao remover item: ${error.message}`); }
            }
        };

        const renderTableRows = (productsList) => {
            inventoryTableBody.innerHTML = '';
            if (productsList.length === 0) {
                inventoryTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Nenhum insumo localizado no armazém.</td></tr>';
                return;
            }

            productsList.forEach(p => {
                const row = document.createElement('tr');
                const formatCurrency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
                const loc = p.location || {};

                row.innerHTML = `
                    <td style="cursor:pointer;" onclick="expandProductMetrics('${p._id}')">
                        <strong>🔗 ${p.name}</strong><br><small style="color:var(--text-secondary)">SKU: ${p.sku}</small>
                    </td>
                    <td style="font-family: monospace; font-size: 0.85rem;">S:${loc.sector || 'N/D'} | R:${loc.row || 'N/D'} | Vão:${loc.apartment || 'N/D'}</td>
                    <td><strong>${p.quantityInStock.toLocaleString('pt-BR')}</strong> un</td>
                    <td>${formatCurrency(p.sellingPrice)}</td>
                    <td><span class="status-badge ${p.statusVisual.alertColor}">${p.statusVisual.statusTag}</span></td>
                    <td style="text-align: center;">
                        <button class="action-icon" title="Editar Parâmetros" onclick="openEditModal('${p._id}')">✏️</button>
                        <button class="action-icon" title="Excluir Material" onclick="deleteProductClick('${p._id}', '${p.name}')" style="color:#dc3545;">🗑️</button>
                    </td>
                `;
                inventoryTableBody.appendChild(row);
            });
        };

        const loadInventoryTable = async () => {
            try {
                inventoryTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Buscando posições...</td></tr>';
                const products = await StockAPI.getInventory();
                localProductsCache = products;
                populateCategoryDropdown(products);
                renderTableRows(products);
            } catch (error) { inventoryTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Erro ao carregar inventário NoSQL.</td></tr>'; }
        };

        // EVENTO DE CRIAÇÃO (SUBMIT DO FORMULÁRIO DE CADASTRO)
        if (productForm) {
            productForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const checkboxExpiration = document.getElementById('isIndeterminateExpiration');
                
                const productPayload = {
                    name: document.getElementById('name').value.trim(),
                    category: document.getElementById('category').value.trim(),
                    acquisitionCost: parseFloat(document.getElementById('acquisitionCost').value),
                    sellingPrice: parseFloat(document.getElementById('sellingPrice').value),
                    quantityInStock: parseInt(document.getElementById('quantityInStock').value, 10),
                    minimumStock: parseInt(document.getElementById('minimumStock').value, 10),
                    maximumStock: parseInt(document.getElementById('maximumStock').value, 10),
                    isIndeterminateExpiration: checkboxExpiration.checked,
                    location: {
                        sector: document.getElementById('sector').value.trim().toUpperCase(),
                        row: document.getElementById('row').value.trim().toUpperCase(),
                        building: document.getElementById('building').value.trim().toUpperCase(),
                        floor: document.getElementById('floor').value.trim().toUpperCase(),
                        apartment: document.getElementById('apartment').value.trim().toUpperCase()
                    }
                };

                if (!checkboxExpiration.checked) productPayload.expirationDate = document.getElementById('expirationDate').value;

                try {
                    const result = await StockAPI.createProduct(productPayload);
                    alert(result.message || 'Produto cadastrado com sucesso!');
                    closeCreateModal();
                    loadInventoryTable();
                } catch (error) { alert(`Erro operacional: ${error.message}`); }
            });

            const checkboxExpiration = document.getElementById('isIndeterminateExpiration');
            const expirationContainer = document.getElementById('expiration-container');
            if (checkboxExpiration && expirationContainer) {
                checkboxExpiration.addEventListener('change', (e) => {
                    expirationContainer.style.display = e.target.checked ? 'none' : 'flex';
                    document.getElementById('expirationDate').required = !e.target.checked;
                });
            }
        }

        // EVENTO DE EDIÇÃO (SUBMIT DO FORMULÁRIO DO POP-UP)
        document.getElementById('edit-product-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('edit-id').value;
            const updatedFields = {
                name: document.getElementById('edit-name').value.trim(),
                quantityInStock: parseInt(document.getElementById('edit-quantity').value, 10),
                sellingPrice: parseFloat(document.getElementById('edit-price').value),
                location: {
                    sector: document.getElementById('edit-sector').value.trim().toUpperCase(),
                    row: document.getElementById('edit-row').value.trim().toUpperCase(),
                    building: document.getElementById('edit-building').value.trim().toUpperCase(),
                    floor: document.getElementById('edit-floor').value.trim().toUpperCase(),
                    apartment: document.getElementById('edit-apartment').value.trim().toUpperCase()
                }
            };

            try {
                const result = await StockAPI.updateProduct(id, updatedFields);
                alert(result.message || 'Parâmetros logísticos consolidados!');
                document.getElementById('edit-modal').style.display = 'none';
                loadInventoryTable();
            } catch (error) { alert(`Erro na atualização: ${error.message}`); }
        });

        loadInventoryTable();
    }
});

// =========================================================================
// 6. CONTROLADOR RESPONSIVO DA GAVETA MÓVEL
// =========================================================================
document.addEventListener('click', (e) => {
    const sidebarElement = document.querySelector('.sidebar');
    const clickedToggle = e.target.closest('#mobile-menu-btn') || e.target.closest('.menu-toggle-btn');
    if (clickedToggle && sidebarElement) {
        e.preventDefault();
        e.stopPropagation();
        sidebarElement.classList.toggle('mobile-open');
        return;
    }
    if (sidebarElement && sidebarElement.classList.contains('mobile-open')) {
        if (!sidebarElement.contains(e.target)) {
            sidebarElement.classList.remove('mobile-open');
        }
    }
});