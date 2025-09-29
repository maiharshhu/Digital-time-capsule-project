// === Dark/Ligh
const themeCheckbox = document.getElementById('checkbox-toggle');
const htmlElement = document.documentElement; // Represents the <html> tag

// Function to apply the theme to the HTML element and set the checkbox state
const applyTheme = (theme) => {
    if (theme === 'dark') {
        htmlElement.setAttribute('data-theme', 'dark');
        if (themeCheckbox) {
            themeCheckbox.checked = true;
        }
    } else {
        htmlElement.removeAttribute('data-theme');
        if (themeCheckbox) {
            themeCheckbox.checked = false;
        }
    }
};

// 1. Initialize theme from localStorage, defaulting to 'light'
const currentTheme = localStorage.getItem('theme');
applyTheme(currentTheme || 'light');

// 2. Handler for theme switch toggle (uses the change event of the checkbox)
const switchTheme = (e) => {
    const newTheme = e.target.checked ? 'dark' : 'light';

    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
};

// 3. Event Listener for the switch
if (themeCheckbox) {
    // We listen for the 'change' event on the hidden checkbox
    themeCheckbox.addEventListener('change', switchTheme);
}