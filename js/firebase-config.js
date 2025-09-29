import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

import {
    getDatabase,
    ref,
    push,
    set,
    get,
    update,
    remove,
    serverTimestamp,
    query,
    orderByChild,
    equalTo,
    onValue
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";

import {
    getStorage,
    ref as storageRef,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-storage.js";

// ... firebaseConfig
const firebaseConfig = {
    apiKey: "AIzaSyCcMGzqDQLf59VSkyuX5BsdUe1kcHOfSQw",
    authDomain: "digitaltimecapsule-15e3e.firebaseapp.com",
    projectId: "digitaltimecapsule-15e3e",
    storageBucket: "digitaltimecapsule-15e3e.firebasestorage.app",
    databaseURL: "https://digitaltimecapsule-15e3e-default-rtdb.firebaseio.com",
    messagingSenderId: "436678459636",
    appId: "1:436678459636:web:b57475c6244e43ec301ea1"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getDatabase(app);

export {
    // auth helpers
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,

    // db helpers
    ref,
    push,
    set,
    get,
    update,
    remove,
    query,
    orderByChild,
    equalTo,
    onValue,
    serverTimestamp as rtdbServerTimestamp,
    // storage helpers
    storageRef,
    uploadBytes,
    getDownloadURL
};
