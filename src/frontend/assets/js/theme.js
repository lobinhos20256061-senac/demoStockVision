// Gerenciador de Tema (Claro / Escuro) persistido no LocalStorage
document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const applyTheme = (theme) => {
        const normalizedTheme = theme === 'dark' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', normalizedTheme);
        document.documentElement.setAttribute('data-bs-theme', normalizedTheme);
        localStorage.setItem('theme', normalizedTheme);

        const icon = themeToggle ? themeToggle.querySelector('i') : null;
        if (icon) {
            if (normalizedTheme === 'dark') {
                icon.classList.replace('bi-moon-stars-fill', 'bi-sun-fill');
            } else {
                icon.classList.replace('bi-sun-fill', 'bi-moon-stars-fill');
            }
        }
    };

    const currentTheme = localStorage.getItem('theme') || 'light';
    applyTheme(currentTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const nextTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            applyTheme(nextTheme);
        });
    }
});