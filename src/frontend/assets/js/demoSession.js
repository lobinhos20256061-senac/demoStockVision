(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    root.createDemoSessionManager = api.createDemoSessionManager;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    const DEFAULT_DURATION_MS = 5 * 60 * 1000;
    const DEMO_SESSION_KEY = 'sv_demo_session';
    const DEMO_BLOCKED_KEY = 'sv_demo_blocked';
    const DEMO_DATA_KEYS = ['sv_demo_inventory', 'sv_demo_partners'];

    const clearDemoArtifacts = (storage, preserveMode = false) => {
        storage.removeItem(DEMO_SESSION_KEY);
        storage.removeItem(DEMO_BLOCKED_KEY);
        DEMO_DATA_KEYS.forEach((key) => storage.removeItem(key));
        if (!preserveMode) {
            storage.removeItem('sv_demo_mode');
        }
    };

    const clearDemoSession = (storage) => {
        clearDemoArtifacts(storage, true);
        storage.removeItem('sv_token');
        storage.removeItem('sv_user');
        storage.removeItem('sv_demo_mode');
    };

    function createMemoryStorage() {
        const store = new Map();
        return {
            getItem(key) { return store.has(key) ? store.get(key) : null; },
            setItem(key, value) { store.set(key, String(value)); },
            removeItem(key) { store.delete(key); },
            clear() { store.clear(); }
        };
    }

    function normalizeStorage(storage) {
        if (storage && typeof storage.getItem === 'function' && typeof storage.setItem === 'function') {
            return storage;
        }

        if (typeof localStorage !== 'undefined') {
            return localStorage;
        }

        return createMemoryStorage();
    }

    function createDemoSessionManager(storage, options = {}) {
        const targetStorage = normalizeStorage(storage);
        const nowFn = options.now || (() => Date.now());
        const durationMs = options.durationMs || DEFAULT_DURATION_MS;

        const getState = () => {
            const rawSession = targetStorage.getItem(DEMO_SESSION_KEY);
            if (!rawSession) {
                return { active: false, blocked: false, expiresAt: null, startedAt: null, remainingMs: 0, expired: false, message: 'Nenhuma sessão demo ativa.' };
            }

            try {
                const session = JSON.parse(rawSession);
                if (!session || !session.expiresAt) {
                    return { active: false, blocked: false, expiresAt: null, startedAt: null, remainingMs: 0, expired: false, message: 'Sessão demo inválida.' };
                }

                if (nowFn() >= session.expiresAt) {
                    clearDemoSession(targetStorage);
                    return {
                        active: false,
                        blocked: true,
                        expiresAt: session.expiresAt,
                        startedAt: session.startedAt,
                        remainingMs: 0,
                        expired: true,
                        message: 'A sessão demo expirou e os dados temporários foram removidos.'
                    };
                }

                return {
                    active: true,
                    blocked: false,
                    expiresAt: session.expiresAt,
                    startedAt: session.startedAt,
                    remainingMs: Math.max(0, session.expiresAt - nowFn()),
                    expired: false,
                    message: 'Sessão demo ativa.'
                };
            } catch (error) {
                clearDemoSession(targetStorage);
                return { active: false, blocked: true, expiresAt: null, startedAt: null, remainingMs: 0, expired: true, message: 'A sessão demo expirou e os dados temporários foram removidos.' };
            }
        };

        const isBlocked = () => getState().blocked;

        const startSession = () => {
            const now = nowFn();
            const session = {
                startedAt: now,
                expiresAt: now + durationMs
            };

            clearDemoArtifacts(targetStorage);
            targetStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
            targetStorage.removeItem(DEMO_BLOCKED_KEY);
            targetStorage.setItem('sv_demo_mode', 'true');
            return {
                active: true,
                expiresAt: session.expiresAt,
                remainingMs: durationMs,
                message: 'Sessão demo iniciada com sucesso.'
            };
        };

        const endSession = () => {
            clearDemoSession(targetStorage);
            return { active: false, blocked: false };
        };

        const isActive = () => getState().active;

        const getRemainingSeconds = () => Math.ceil(getState().remainingMs / 1000);

        const getRemainingMs = () => getState().remainingMs;

        const getDemoUser = () => ({
            fullname: 'Usuário Demo',
            company: 'Versão de demonstração',
            email: 'demo@stockvision.local',
            role: 'demo'
        });

        const clearAll = () => {
            clearDemoArtifacts(targetStorage);
        };

        return {
            startSession,
            endSession,
            isActive,
            isBlocked,
            getState,
            getRemainingSeconds,
            getRemainingMs,
            getDemoUser,
            clearAll
        };
    }

    return {
        createDemoSessionManager,
        DEFAULT_DURATION_MS
    };
});
