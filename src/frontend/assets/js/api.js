/**
 * STOCKVISION - CENTRAL DE COMUNICAÇÃO COM A API (fetch)
 * Este arquivo centraliza todas as chamadas HTTP para o servidor Node.js.
 */

// const BASE_URL = 'http://localhost:3000/api';
const FALLBACK_BASE_URL = 'http://localhost:3000/api';
const BASE_URL = window.location.protocol === 'file:' ? FALLBACK_BASE_URL : `${window.location.origin}/api`;

// const BASE_URL = 'http://localhost:3000/api';

const DemoSessionRuntime = (() => {
    if (typeof window !== 'undefined' && typeof window.createDemoSessionManager === 'function') {
        return { createDemoSessionManager: window.createDemoSessionManager };
    }

    const DEFAULT_DURATION_MS = 5 * 60 * 1000;
    const DEMO_SESSION_KEY = 'sv_demo_session';
    const DEMO_BLOCKED_KEY = 'sv_demo_blocked';

    const createDemoSessionManager = (storage = localStorage, options = {}) => {
        const targetStorage = storage || localStorage;
        const nowFn = options.now || (() => Date.now());
        const durationMs = options.durationMs || DEFAULT_DURATION_MS;

        const getState = () => {
            const blocked = targetStorage.getItem(DEMO_BLOCKED_KEY) === 'true';
            const rawSession = targetStorage.getItem(DEMO_SESSION_KEY);
            if (!rawSession) {
                return { active: false, blocked, expiresAt: null, startedAt: null, remainingMs: 0 };
            }

            try {
                const session = JSON.parse(rawSession);
                if (!session || !session.expiresAt) {
                    return { active: false, blocked, expiresAt: null, startedAt: null, remainingMs: 0 };
                }

                if (nowFn() >= session.expiresAt) {
                    targetStorage.removeItem(DEMO_SESSION_KEY);
                    targetStorage.removeItem('sv_token');
                    targetStorage.removeItem('sv_user');
                    targetStorage.setItem(DEMO_BLOCKED_KEY, 'true');
                    return { active: false, blocked: true, expiresAt: session.expiresAt, startedAt: session.startedAt, remainingMs: 0 };
                }

                return { active: true, blocked, expiresAt: session.expiresAt, startedAt: session.startedAt, remainingMs: Math.max(0, session.expiresAt - nowFn()) };
            } catch (error) {
                targetStorage.removeItem(DEMO_SESSION_KEY);
                return { active: false, blocked, expiresAt: null, startedAt: null, remainingMs: 0 };
            }
        };

        const isBlocked = () => getState().blocked;
        const startSession = () => {
            if (isBlocked()) {
                return { active: false, blocked: true, message: 'A versão demo já foi utilizada e não pode ser reaberta nesta máquina.' };
            }

            const now = nowFn();
            const session = { startedAt: now, expiresAt: now + durationMs };
            targetStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
            targetStorage.removeItem(DEMO_BLOCKED_KEY);
            return { active: true, expiresAt: session.expiresAt, remainingMs: durationMs, message: 'Sessão demo iniciada com sucesso.' };
        };

        const endSession = () => {
            targetStorage.removeItem(DEMO_SESSION_KEY);
            targetStorage.removeItem('sv_token');
            targetStorage.removeItem('sv_user');
            targetStorage.removeItem('sv_demo_inventory');
            targetStorage.removeItem('sv_demo_partners');
            targetStorage.removeItem('sv_demo_mode');
            targetStorage.setItem(DEMO_BLOCKED_KEY, 'true');
            return { active: false, blocked: true };
        };

        const isActive = () => getState().active;
        const getRemainingSeconds = () => Math.ceil(getState().remainingMs / 1000);
        const getRemainingMs = () => getState().remainingMs;
        const getDemoUser = () => ({ fullname: 'Usuário Demo', company: 'Versão de demonstração', email: 'demo@stockvision.local', role: 'demo' });

        return { startSession, endSession, isActive, isBlocked, getState, getRemainingSeconds, getRemainingMs, getDemoUser };
    };

    return { createDemoSessionManager };
})();

const createDemoSessionManager = DemoSessionRuntime.createDemoSessionManager;
if (typeof window !== 'undefined') {
    window.createDemoSessionManager = createDemoSessionManager;
}

const safeJsonResponse = async (response) => {
    const text = await response.text();
    return text ? JSON.parse(text) : {};
};

/**
 * 💾 GERENCIADOR DE SESSÃO LOCAL (LocalStorage)
 */
const TokenManager = {
    saveToken: (token) => localStorage.setItem('sv_token', token),
    getToken: () => localStorage.getItem('sv_token'),
    clearToken: () => localStorage.removeItem('sv_token'),
    saveUser: (user) => localStorage.setItem('sv_user', JSON.stringify(user)),
    getUser: () => {
        const rawUser = localStorage.getItem('sv_user');
        return rawUser ? JSON.parse(rawUser) : null;
    },
    saveDemoMode: (value) => localStorage.setItem('sv_demo_mode', String(value)),
    isDemoMode: () => localStorage.getItem('sv_demo_mode') === 'true',
    clearAll: () => {
        localStorage.removeItem('sv_token');
        localStorage.removeItem('sv_user');
        localStorage.removeItem('sv_demo_mode');
        localStorage.removeItem('sv_demo_inventory');
        localStorage.removeItem('sv_demo_partners');
    }
};

/**
 * 🛡️ MÓDULO DE AUTENTICAÇÃO E GOVERNANÇA CORPORATIVA
 */
const AuthAPI = {
    registerCompany: async (fullname, email, company, password) => {
        try {
            const response = await fetch(`${BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullname, email, company, password })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Falha ao registrar empresa/usuário.');
            if (data.token) {
                TokenManager.saveToken(data.token);
                TokenManager.saveUser(data.user);
            }
            return data;
        } catch (error) { throw error; }
    },

    login: async (email, password) => {
        try {
            const response = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Falha na autenticação.');
            TokenManager.saveToken(data.token);
            TokenManager.saveUser(data.user);
            TokenManager.saveDemoMode(false);
            return data;
        } catch (error) { throw error; }
    },

    enterDemo: async () => {
        try {
            const demoManager = createDemoSessionManager(localStorage);
            const result = demoManager.startSession();
            if (!result.active) throw new Error(result.message || 'Não foi possível iniciar a demo.');
            TokenManager.saveToken('demo-token');
            TokenManager.saveUser(demoManager.getDemoUser());
            TokenManager.saveDemoMode(true);
            return { ...result, user: demoManager.getDemoUser(), message: 'Versão demo iniciada com sucesso.' };
        } catch (error) { throw error; }
    },

    registerEmployee: async (fullname, email, password) => {
        try {
            const token = TokenManager.getToken();
            const response = await fetch(`${BASE_URL}/auth/employees`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ fullname, email, password })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao registrar funcionário.');
            return data;
        } catch (error) { throw error; }
    }
};

/**
 * 📦 MÓDULO DE OPERAÇÃO DE ESTOQUE, HISTÓRICO, ESG, PREVISÃO DE IA E XML
 */
const StockAPI = {
    getInventory: async () => {
        if (TokenManager.isDemoMode() && createDemoSessionManager(localStorage).isActive()) {
            const storedInventory = localStorage.getItem('sv_demo_inventory');
            if (storedInventory) {
                try { return JSON.parse(storedInventory); } catch (error) { console.warn(error); }
            }
            const demoInventory = [
                { _id: 'demo-1', name: 'Caixa de Embalagem', sku: 'PKG-001', category: 'Embalagem', acquisitionCost: 18.5, sellingPrice: 32.9, quantityInStock: 145, minimumStock: 50, maximumStock: 220, statusVisual: { alertColor: 'green', statusTag: 'Estoque Normal' }, isIndeterminateExpiration: false, expirationDate: null, barcode: '7891234567890', supplier: 'EcoPack', location: { sector: 'A', row: '01', building: 'B', floor: '1', apartment: '01' } },
                { _id: 'demo-2', name: 'Palete de Armazenagem', sku: 'PLT-002', category: 'Equipamento', acquisitionCost: 220, sellingPrice: 460, quantityInStock: 24, minimumStock: 12, maximumStock: 80, statusVisual: { alertColor: 'blue', statusTag: 'Normal' }, isIndeterminateExpiration: true, expirationDate: null, barcode: '7896541230001', supplier: 'LogiHub', location: { sector: 'C', row: '03', building: 'A', floor: '2', apartment: '05' } },
                { _id: 'demo-3', name: 'Etiqueta RFID', sku: 'RFID-003', category: 'Tecnologia', acquisitionCost: 4.8, sellingPrice: 11.2, quantityInStock: 9, minimumStock: 20, maximumStock: 80, statusVisual: { alertColor: 'orange', statusTag: 'Estoque Baixo' }, isIndeterminateExpiration: false, expirationDate: '2026-12-10', barcode: '7890001112223', supplier: 'TagFlow', location: { sector: 'B', row: '02', building: 'C', floor: '1', apartment: '03' } }
            ];
            localStorage.setItem('sv_demo_inventory', JSON.stringify(demoInventory));
            return demoInventory;
        }

        try {
            const token = TokenManager.getToken();
            const response = await fetch(`${BASE_URL}/stock`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao carregar estoque.');
            return data;
        } catch (error) { throw error; }
    },

    getDashboardMetrics: async () => {
        if (TokenManager.isDemoMode() && createDemoSessionManager(localStorage).isActive()) {
            return {
                financials: { totalRevenue: 60351, totalCosts: 40354, estimatedProfit: 19997 },
                indicators: { stockLevel: 240 },
                historyTimeline: {
                    months: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
                    revenue: [12000, 14400, 15400, 17900, 18800, 20300],
                    costs: [9800, 10200, 11100, 11900, 12700, 13200],
                    stockLevels: [180, 210, 195, 225, 240, 250]
                }
            };
        }

        try {
            const token = TokenManager.getToken();
            const response = await fetch(`${BASE_URL}/stock/metrics`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao processar indicadores.');
            return data;
        } catch (error) { throw error; }
    },

    getExpirationAlerts: async () => {
        try {
            const token = TokenManager.getToken();
            const response = await fetch(`${BASE_URL}/esg/expiration-alerts`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao buscar alertas de vencimento.');
            return data.alerts;
        } catch (error) { throw error; }
    },

    createProduct: async (productPayload) => {
        if (TokenManager.isDemoMode() && createDemoSessionManager(localStorage).isActive()) {
            const inventory = JSON.parse(localStorage.getItem('sv_demo_inventory') || '[]');
            const newProduct = { _id: `demo-${Date.now()}`, ...productPayload, statusVisual: { alertColor: 'green', statusTag: 'Estoque Normal' } };
            inventory.push(newProduct);
            localStorage.setItem('sv_demo_inventory', JSON.stringify(inventory));
            return { success: true, product: newProduct, message: 'Produto adicionado à demo.' };
        }

        try {
            const token = TokenManager.getToken();
            const response = await fetch(`${BASE_URL}/stock`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(productPayload)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao registrar produto no servidor.');
            return data;
        } catch (error) { throw error; }
    },

    updateProduct: async (id, updatedFields) => {
        if (TokenManager.isDemoMode() && createDemoSessionManager(localStorage).isActive()) {
            const inventory = JSON.parse(localStorage.getItem('sv_demo_inventory') || '[]');
            const updatedInventory = inventory.map(item => item._id === id ? { ...item, ...updatedFields } : item);
            localStorage.setItem('sv_demo_inventory', JSON.stringify(updatedInventory));
            return { success: true, message: 'Produto atualizado na demo.' };
        }

        try {
            const token = TokenManager.getToken();
            const response = await fetch(`${BASE_URL}/stock/${id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatedFields)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao atualizar dados logísticos do produto.');
            return data;
        } catch (error) { throw error; }
    },

    deleteProduct: async (id) => {
        if (TokenManager.isDemoMode() && createDemoSessionManager(localStorage).isActive()) {
            const inventory = JSON.parse(localStorage.getItem('sv_demo_inventory') || '[]');
            const updatedInventory = inventory.filter(item => item._id !== id);
            localStorage.setItem('sv_demo_inventory', JSON.stringify(updatedInventory));
            return { success: true, message: 'Produto removido da demo.' };
        }

        try {
            const token = TokenManager.getToken();
            const response = await fetch(`${BASE_URL}/stock/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao remover material.');
            return data;
        } catch (error) {
            console.error('[API Stock - Delete Error]:', error.message);
            throw error;
        }
    },

    /**
     * 🔮 CONECTOR DE INTELIGÊNCIA ARTIFICIAL: PREVISÃO DE DEMANDA (MMP + GIRO)
     * GET -> /api/demand/forecast
     */
    getDemandForecast: async () => {
        try {
            const token = TokenManager.getToken();
            const response = await fetch(`${BASE_URL}/demand/forecast`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao processar análise preditiva da IA.');
            return data;
        } catch (error) {
            console.error('[API Demand - Forecast Error]:', error.message);
            throw error;
        }
    },

    /**
     * 🧾 PROCESSAR INGESTÃO DE NOTA FISCAL VIA STRING XML
     * POST -> /api/stock/invoice/xml
     */
    importInvoiceXml: async (xmlData) => {
        try {
            const token = TokenManager.getToken();
            const response = await fetch(`${BASE_URL}/stock/invoice/xml`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ xmlData })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao processar arquivo fiscal.');
            return data;
        } catch (error) {
            console.error('[API Stock - XML Invoice Error]:', error.message);
            throw error;
        }
    },

    /**
     * 🌱 BUSCAR ANÁLISE COMPLETA E MÉTRICAS ESG DE COMPATIBILIDADE
     * GET -> /api/reverse/analytics
     */
    getReverseAnalytics: async () => {
        try {
            const token = TokenManager.getToken();
            const response = await fetch(`${BASE_URL}/reverse/analytics`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao ler indicadores ESG.');
            return data;
        } catch (error) { throw error; }
    },

    /**
     * 🌱 BUSCAR PAINEL E METRICAS ESG COMPLETAS
     * GET -> /api/esg/dashboard
     */
    getEsgDashboard: async () => {
        try {
            const token = TokenManager.getToken();
            const response = await fetch(`${BASE_URL}/esg/dashboard`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao carregar painel ESG.');
            return data;
        } catch (error) { throw error; }
    },

    /**
     * ♻️ DAR ENTRADA EM FLUXO DE DEVOLUÇÃO / LOGÍSTICA REVERSA
     * POST -> /api/reverse/return
     */
    createReverseReturn: async (payload) => {
        try {
            const token = TokenManager.getToken();
            const response = await fetch(`${BASE_URL}/reverse/return`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao registrar manifesto de devolução.');
            return data;
        } catch (error) { throw error; }
    },

    /**
     * 📋 BUSCAR FOLHA DE CONTAGEM CEGA PARA INVENTÁRIO ROTATIVO
     * GET -> /api/stock/inventory/rotative
     */
    getRotativeSheet: async (category = '', sector = '') => {
        try {
            const token = TokenManager.getToken();
            const response = await fetch(`${BASE_URL}/stock/inventory/rotative?category=${category}&sector=${sector}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao gerar folha rotativa.');
            return data;
        } catch (error) { throw error; }
    },

    /**
     * ⚖️ SUBMETER CONTAGEM FÍSICA PARA AUDITORIA GERAL E CONCILIAÇÃO
     * POST -> /api/stock/inventory/general
     */
    submitInventoryAudit: async (countedItems) => {
        try {
            const token = TokenManager.getToken();
            const response = await fetch(`${BASE_URL}/stock/inventory/general`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ countedItems })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao processar auditoria.');
            return data;
        } catch (error) { throw error; }
    }
};

const PartnerAPI = {
    getPartners: async () => {
        if (TokenManager.isDemoMode() && createDemoSessionManager(localStorage).isActive()) {
            const storedPartners = localStorage.getItem('sv_demo_partners');
            if (storedPartners) {
                try { return JSON.parse(storedPartners); } catch (error) { console.warn(error); }
            }
            const demoPartners = [
                { _id: 'demo-partner-1', companyName: 'EcoPack Supply', cnpj: '12.345.678/0001-90', contactName: 'Marina', phone: '(11) 3333-4444', status: 'Ativo' },
                { _id: 'demo-partner-2', companyName: 'LogiHub', cnpj: '98.765.432/0001-10', contactName: 'Renato', phone: '(11) 9999-1111', status: 'Em revisão' }
            ];
            localStorage.setItem('sv_demo_partners', JSON.stringify(demoPartners));
            return demoPartners;
        }

        try {
            const token = TokenManager.getToken();
            const headers = {};
            if (token) headers.Authorization = `Bearer ${token}`;

            const response = await fetch(`${BASE_URL}/supply/partners`, {
                method: 'GET',
                headers
            });
            const data = await safeJsonResponse(response);
            if (!response.ok) throw new Error(data.message || 'Erro ao carregar fornecedores.');
            return data;
        } catch (error) {
            console.error('[API Partner - Get Partners Error]:', error.message);
            throw error;
        }
    },

    createPartner: async (partnerPayload) => {
        if (TokenManager.isDemoMode() && createDemoSessionManager(localStorage).isActive()) {
            const partners = JSON.parse(localStorage.getItem('sv_demo_partners') || '[]');
            const newPartner = { _id: `demo-partner-${Date.now()}`, ...partnerPayload };
            partners.push(newPartner);
            localStorage.setItem('sv_demo_partners', JSON.stringify(partners));
            return { success: true, partner: newPartner, message: 'Fornecedor adicionado à demo.' };
        }

        try {
            const token = TokenManager.getToken();
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers.Authorization = `Bearer ${token}`;

            const response = await fetch(`${BASE_URL}/supply/partners`, {
                method: 'POST',
                headers,
                body: JSON.stringify(partnerPayload)
            });
            const data = await safeJsonResponse(response);
            if (!response.ok) throw new Error(data.message || 'Erro ao cadastrar fornecedor.');
            return data;
        } catch (error) {
            console.error('[API Partner - Create Partner Error]:', error.message);
            throw error;
        }
    },

    updatePartner: async (id, partnerPayload) => {
        if (TokenManager.isDemoMode() && createDemoSessionManager(localStorage).isActive()) {
            const partners = JSON.parse(localStorage.getItem('sv_demo_partners') || '[]');
            const updatedPartners = partners.map(item => item._id === id ? { ...item, ...partnerPayload } : item);
            localStorage.setItem('sv_demo_partners', JSON.stringify(updatedPartners));
            return { success: true, message: 'Fornecedor atualizado na demo.' };
        }

        try {
            const token = TokenManager.getToken();
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers.Authorization = `Bearer ${token}`;

            const response = await fetch(`${BASE_URL}/supply/partners/${id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(partnerPayload)
            });
            const data = await safeJsonResponse(response);
            if (!response.ok) throw new Error(data.message || 'Erro ao atualizar fornecedor.');
            return data;
        } catch (error) {
            console.error('[API Partner - Update Partner Error]:', error.message);
            throw error;
        }
    },

    deletePartner: async (id) => {
        if (TokenManager.isDemoMode() && createDemoSessionManager(localStorage).isActive()) {
            const partners = JSON.parse(localStorage.getItem('sv_demo_partners') || '[]');
            const updatedPartners = partners.filter(item => item._id !== id);
            localStorage.setItem('sv_demo_partners', JSON.stringify(updatedPartners));
            return { success: true, message: 'Fornecedor removido da demo.' };
        }

        try {
            const token = TokenManager.getToken();
            const headers = {};
            if (token) headers.Authorization = `Bearer ${token}`;

            const response = await fetch(`${BASE_URL}/supply/partners/${id}`, {
                method: 'DELETE',
                headers
            });
            const data = await safeJsonResponse(response);
            if (!response.ok) throw new Error(data.message || 'Erro ao excluir fornecedor.');
            return data;
        } catch (error) {
            console.error('[API Partner - Delete Partner Error]:', error.message);
            throw error;
        }
    }
};
