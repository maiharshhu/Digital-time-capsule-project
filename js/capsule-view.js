import {
    auth,
    db,
    signOut,
    onAuthStateChanged,
    ref,
    get
} from "./firebase-config.js";

// === DOM ELEMENTS ===
const statusMessage = document.getElementById("statusMessage");
const capsuleTitle = document.getElementById("capsuleTitle");
const lockedMessage = document.getElementById("lockedMessage");
const unlockedContent = document.getElementById("unlockedContent");
const unlockDateLocked = document.getElementById("unlockDateLocked");
const openDateActual = document.getElementById("openDateActual");
const capsuleImage = document.getElementById("capsuleImage");
const capsuleMessage = document.getElementById("capsuleMessage");
const logoutBtn = document.getElementById("logoutBtn");
const backToDashboardBtn = document.getElementById("backToDashboardBtn");

let currentUser = null;

// === UTILITY FUNCTION ===
function formatUnlockDate(isoDate) {
    return new Date(isoDate).toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

// === MAIN LOGIC ===

async function loadCapsule() {
    // 1. Get Capsule ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id");

    if (!id) {
        statusMessage.textContent = "Error: Capsule ID missing.";
        return;
    }

    statusMessage.textContent = "Fetching capsule details...";

    try {
        const capsuleRef = ref(db, `capsules/${id}`);
        const snapshot = await get(capsuleRef);

        if (!snapshot.exists()) {
            statusMessage.textContent = "Error: Capsule not found.";
            capsuleTitle.textContent = "Capsule Not Found";
            return;
        }

        const capsule = snapshot.val();

        // 2. Security Check: Ensure the logged-in user owns the capsule
        if (capsule.userId !== currentUser.uid) {
            statusMessage.textContent = "Access Denied: You do not own this capsule.";
            capsuleTitle.textContent = "Unauthorized Access";
            return;
        }

        capsuleTitle.textContent = capsule.title;
        const unlockTime = new Date(capsule.openDate);
        const currentTime = new Date();
        const isUnlocked = currentTime >= unlockTime;

        // 3. Display Logic
        if (isUnlocked) {
            // UNLOCKED VIEW
            statusMessage.textContent = "🔓 Capsule is Open!";
            lockedMessage.classList.add('hidden');
            unlockedContent.classList.remove('hidden');

            openDateActual.textContent = formatUnlockDate(capsule.openDate);
            capsuleMessage.textContent = capsule.message;

            if (capsule.imageUrl) {
                capsuleImage.src = capsule.imageUrl;
                capsuleImage.classList.remove('hidden');
            } else {
                capsuleImage.classList.add('hidden');
            }

        } else {
            // LOCKED VIEW
            statusMessage.textContent = "🔒 Capsule is Sealed.";
            unlockedContent.classList.add('hidden');
            lockedMessage.classList.remove('hidden');

            unlockDateLocked.textContent = formatUnlockDate(capsule.openDate);
        }

    } catch (error) {
        console.error("Error loading capsule:", error);
        statusMessage.textContent = "An error occurred while loading the capsule.";
    }
}

// === AUTH CHECK AND INITIALIZATION ===
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        // Redirect to login if not authenticated
        window.location.href = "index.html";
        return;
    }
    currentUser = user;
    loadCapsule(); // Start loading the capsule after successful auth
});

// === EVENT LISTENERS ===
logoutBtn.addEventListener("click", async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout failed", error);
    }
});

backToDashboardBtn.addEventListener("click", () => {
    window.location.href = "dashboard.html";
});