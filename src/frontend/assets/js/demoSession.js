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
                    targetStorage.removeItem('sv_demo_inventory');
                    targetStorage.removeItem('sv_demo_partners');
                    targetStorage.removeItem('sv_demo_mode');
                    return { active: false, blocked: false, expiresAt: session.expiresAt, startedAt: session.startedAt, remainingMs: 0 };
                }

                return {
                    active: true,
                    blocked,
                    expiresAt: session.expiresAt,
                    startedAt: session.startedAt,
                    remainingMs: Math.max(0, session.expiresAt - nowFn())
                };
            } catch (error) {
                targetStorage.removeItem(DEMO_SESSION_KEY);
                return { active: false, blocked, expiresAt: null, startedAt: null, remainingMs: 0 };
            }
        };

        const isBlocked = () => getState().blocked;

        const startSession = () => {
            const now = nowFn();
            const session = {
                startedAt: now,
                expiresAt: now + durationMs
            };

            targetStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
            targetStorage.removeItem(DEMO_BLOCKED_KEY);
            return {
                active: true,
                expiresAt: session.expiresAt,
                remainingMs: durationMs,
                message: 'Sessão demo iniciada com sucesso.'
            };
        };

        const endSession = () => {
            targetStorage.removeItem(DEMO_SESSION_KEY);
            targetStorage.removeItem('sv_token');
            targetStorage.removeItem('sv_user');
            targetStorage.removeItem('sv_demo_inventory');
            targetStorage.removeItem('sv_demo_partners');
            targetStorage.removeItem('sv_demo_mode');
            targetStorage.removeItem(DEMO_BLOCKED_KEY);
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
            targetStorage.removeItem(DEMO_SESSION_KEY);
            targetStorage.removeItem(DEMO_BLOCKED_KEY);
            targetStorage.removeItem('sv_token');
            targetStorage.removeItem('sv_user');
            targetStorage.removeItem('sv_demo_inventory');
            targetStorage.removeItem('sv_demo_partners');
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
