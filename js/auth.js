import {
    auth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    onAuthStateChanged
} from "./firebase-config.js";

// === DOM ELEMENTS ===
// Views
const loginView = document.getElementById('login-view');
const registerView = document.getElementById('register-view');

// Login Elements
const loginEmailInput = document.getElementById('email');
const loginPasswordInput = document.getElementById('password');
const loginButton = document.getElementById('loginBtn');
const authMessage = document.getElementById('auth-message'); // For Login/Forgot Password messages
const forgotPasswordLink = document.getElementById('forgotPasswordLink');

// Register Elements
const registerEmailInput = document.getElementById('registerEmail');
const registerPasswordInput = document.getElementById('registerPassword');
const registerButton = document.getElementById('registerBtn');
const registerMessage = document.getElementById('register-message'); // For Register messages

// View Toggles
const toggleRegisterLink = document.getElementById('toggleRegister');
const toggleLoginLink = document.getElementById('toggleLogin');


// === VIEW TOGGLE FUNCTIONS ===

const showLoginView = (message = '') => {
    registerView.style.display = 'none';
    loginView.style.display = 'block';
    authMessage.style.color = 'red'; // Default to red for errors
    authMessage.textContent = message;
    registerMessage.textContent = ''; // Clear register message
};

const showRegisterView = (message = '') => {
    loginView.style.display = 'none';
    registerView.style.display = 'block';
    registerMessage.style.color = 'red'; // Default to red for errors
    registerMessage.textContent = message;
    authMessage.textContent = ''; // Clear login message
};


// === FIREBASE AUTH FUNCTIONS ===

// 1. LOGIN
const loginUser = async () => {
    authMessage.textContent = '';
    const email = loginEmailInput.value;
    const password = loginPasswordInput.value;

    if (!email || !password) {
        authMessage.textContent = 'Please enter both email and password.';
        return;
    }

    try {
        // Firebase sign in function
        await signInWithEmailAndPassword(auth, email, password);
        // If successful, onAuthStateChanged will handle the redirect

    } catch (error) {
        let message = 'Login failed. Please check your credentials.';
        console.error("Login Error:", error.code);
        authMessage.textContent = message;
    }
};

// 2. SIGN UP (REGISTER)
const registerUser = async () => {
    registerMessage.textContent = '';
    const email = registerEmailInput.value;
    const password = registerPasswordInput.value;

    if (!email || !password) {
        registerMessage.textContent = 'Please fill in all fields.';
        return;
    }
    if (password.length < 6) {
        registerMessage.textContent = 'Password must be at least 6 characters.';
        return;
    }

    try {
        await createUserWithEmailAndPassword(auth, email, password);
        // Successful sign up will redirect via onAuthStateChanged

    } catch (error) {
        let message = 'Registration failed.';
        if (error.code === 'auth/email-already-in-use') {
            message = 'This email is already registered. Try logging in.';
        }
        console.error("Register Error:", error.code);
        registerMessage.textContent = message;
    }
};

// 3. FORGOT PASSWORD
const resetPassword = async (e) => {
    e.preventDefault();
    authMessage.textContent = '';
    const email = loginEmailInput.value;

    if (!email) {
        authMessage.textContent = 'Please enter your email in the field above to reset password.';
        return;
    }

    try {
        await sendPasswordResetEmail(auth, email);
        authMessage.style.color = 'green'; // Success message in green
        authMessage.textContent = `Password reset link sent to ${email}. Check your inbox.`;
    } catch (error) {
        let message = 'Could not send reset link. Please check the email.';
        console.error("Reset Error:", error.code);
        authMessage.style.color = 'red';
        authMessage.textContent = message;
    }
};


// === EVENT LISTENERS ===

// 1. Initial Auth State Check (Redirect if logged in)
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User logged in, redirecting...");
        window.location.href = 'dashboard.html';
    } else {
        console.log("User is logged out.");
    }
});

// 2. Auth Button Clicks ()
loginButton.addEventListener('click', loginUser);
registerButton.addEventListener('click', registerUser);

// 3. View Toggle Clicks 
toggleRegisterLink.addEventListener('click', (e) => {
    e.preventDefault(); // Default link action को रोकें
    showRegisterView();
});

toggleLoginLink.addEventListener('click', (e) => {
    e.preventDefault(); //
    showLoginView();
});

// 4. Forgot Password Click
forgotPasswordLink.addEventListener('click', resetPassword);