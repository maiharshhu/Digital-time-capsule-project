import {
    auth,
    db,
    signOut,
    onAuthStateChanged,
    rtdbServerTimestamp,
    ref,
    query,
    orderByChild,
    equalTo,
    onValue,
    remove,
    get,
    push,
    set,
    update
} from "./firebase-config.js";

// ===================================
// 1. DOM ELEMENTS
// ===================================
const mainHeader = document.querySelector('header');
const logoutBtn = document.getElementById("logoutBtn");
const userEmailSpan = document.getElementById("userEmail");

// Dashboard View Elements
const capsuleList = document.getElementById("capsuleContainer");
const myCapsulesView = document.getElementById('myCapsulesView');
const scrollToCreateBtn = document.getElementById('scrollToCreateBtn');

// Form View Elements
const createCapsuleView = document.getElementById('createCapsuleView');
const newCapsuleForm = document.getElementById('newCapsuleForm');
const titleInput = document.getElementById("capsuleTitle");
const messageInput = document.getElementById("capsuleMessage");
const dateInput = document.getElementById("openDate");
const imageInput = document.getElementById("capsuleImageURL");
const saveCapsuleBtn = document.getElementById("saveCapsuleBtn");
const cancelCreateBtn = document.getElementById('cancelCreateBtn');
const messageAlertContainer = document.getElementById("messageAlertContainer");

// ===================================
// 2. GLOBAL STATE
// ===================================
let currentUser = null;
let currentCapsuleId = null; // Used for editing
let lastScrollY = window.scrollY; // Used for header hide/show

// ===================================
// 3. UTILITY FUNCTIONS
// ===================================

/**
 * Custom alert को container में दिखाता है।
 * @param {string} type - 'success' or 'error'
 * @param {string} title - Main bold message title
 * @param {string} message - Secondary descriptive message
 */
function showAlertMessage(type, title, message) {
    const isSuccess = type === 'success';
    // Success (Checkmark) or Error (Exclamation) SVG path
    const iconPath = isSuccess
        ? 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
        : 'M12 9v3.75m-9.303 3.376c-.866 1.5.174 3.374 1.94 3.374h14.71c1.766 0 2.806-1.874 1.94-3.374L13.94 3.376c-.866-1.5-3.033-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z';

    // Dismiss (X) SVG path
    const dismissIconPath = 'M6 18L18 6M6 6l12 12';

    const alertHtml = `
        <div class="custom-alert alert-${type}">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="alert-icon">
                <path stroke-linecap="round" stroke-linejoin="round" d="${iconPath}"/>
            </svg>

            <div class="alert-content">
                <strong>${title}</strong>
                <p>${message}</p>
            </div>

            <button class="alert-dismiss" type="button" aria-label="Dismiss alert" onclick="this.closest('.alert-container').classList.add('hidden')">
                <span class="sr-only">Dismiss popup</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="${dismissIconPath}" />
                </svg>
            </button>
        </div>
    `;

    messageAlertContainer.innerHTML = alertHtml;
    messageAlertContainer.classList.remove('hidden');

    if (isSuccess) {
        // Auto-hide success alert after 5 seconds
        setTimeout(() => {
            messageAlertContainer.classList.add('hidden');
        }, 5000);
    }
}

/**
 * फॉर्म डेटा को मान्य (validate) करता है।
 * @param {object} data - Capsule form data.
 * @returns {boolean}
 */
function validateForm(data) {
    messageAlertContainer.classList.add('hidden');
    messageAlertContainer.innerHTML = "";

    if (!data.title || !data.message || !data.openDate) {
        showAlertMessage('error', 'Required Fields Missing', 'Please fill in the title, message, and open date to seal your capsule.');
        return false;
    }
    if (new Date(data.openDate) <= new Date()) {
        showAlertMessage('error', 'Invalid Date', 'The unlock date must be set for a time in the future.');
        return false;
    }
    return true;
}

/**
 * तारीख को उपयोगकर्ता के अनुकूल प्रारूप (user-friendly format) में फॉर्मेट करता है।
 * @param {string} isoDate - ISO date string.
 * @returns {string}
 */
function formatDisplayDate(isoDate) {
    return new Date(isoDate).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

// ===================================
// 4. VIEW & STATE MANAGEMENT
// ===================================

/** Hides the form and shows the capsule list. */
function showMyCapsules() {
    // createCapsuleView.classList.add('hidden');
    // myCapsulesView.classList.remove('hidden');


    window.scrollTo({ top: 0, behavior: "smooth" });

    messageAlertContainer.classList.add('hidden');
    messageAlertContainer.innerHTML = "";

    currentCapsuleId = null;
    newCapsuleForm.reset();
    saveCapsuleBtn.textContent = "Create Time Capsule"; // बटन टेक्स्ट रीसेट करें

    if (currentUser) {
        loadUserCapsules(currentUser.uid);
    }
}

// /** Shows the form view (no need to define showCreateCapsule here since we use anchor scroll) */

// ===================================
// 5. DATA (READ, CREATE, UPDATE)
// ===================================

/** Fetches and displays the user's capsules. */
function loadUserCapsules(userId) {
    capsuleList.innerHTML = "<p>Loading capsules...</p>";

    const capsulesRef = ref(db, "capsules");
    const userCapsulesQuery = query(
        capsulesRef,
        orderByChild("userId"),
        equalTo(userId)
    );

    // Realtime listener for dynamic updates
    onValue(userCapsulesQuery, (snapshot) => {
        capsuleList.innerHTML = ""; // Clear previous list

        if (!snapshot.exists()) {
            capsuleList.innerHTML = "<p>No capsules found. Create one!</p>";
            return;
        }

        snapshot.forEach((childSnapshot) => {
            const capsule = childSnapshot.val();
            const capsuleId = childSnapshot.key;

            const unlockDate = formatDisplayDate(capsule.openDate);
            const isUnlocked = new Date() >= new Date(capsule.openDate);
            const statusClass = isUnlocked ? "unlocked" : "locked";

            const div = document.createElement("div");
            div.classList.add("capsule-card", statusClass);
            div.addEventListener('click', () => window.viewCapsule(capsuleId));

            div.innerHTML = `
                <div class="capsule-header">
                    <h3>${capsule.title}</h3>
                    <span class="status-icon">${isUnlocked ? "🔓" : "🔒"}</span>
                </div>
                <p>Status: ${isUnlocked ? "Ready to Open" : "Sealed"}</p>
                <p>Unlocks: ${unlockDate}</p>
            `;
            capsuleList.appendChild(div);
        });
    }, (error) => {
        console.error("Error fetching capsules:", error);
        capsuleList.innerHTML = "<p>Error loading capsules. Check your Realtime Database rules.</p>";
    });
}

/** Handles form submission for creating or updating a capsule. */
async function handleNewCapsuleSubmission(e) {
    e.preventDefault();

    if (!currentUser) {
        showAlertMessage('error', 'Authentication Error', 'You must be logged in to create a capsule.');
        return;
    }

    const capsuleData = {
        title: titleInput.value.trim(),
        message: messageInput.value.trim(),
        openDate: new Date(dateInput.value).toISOString(),
        imageUrl: imageInput.value.trim(),
        userId: currentUser.uid
    };

    if (!validateForm(capsuleData)) return;

    messageAlertContainer.classList.add('hidden');
    messageAlertContainer.innerHTML = "";

    try {
        let titleMessage = "";
        let bodyMessage = "";

        if (currentCapsuleId) {
            // Update Logic
            const capsuleRef = ref(db, `capsules/${currentCapsuleId}`);
            await update(capsuleRef, {
                title: capsuleData.title,
                message: capsuleData.message,
                openDate: capsuleData.openDate,
                imageUrl: capsuleData.imageUrl
            });
            titleMessage = "Capsule Updated!";
            bodyMessage = "Your time capsule edits have been successfully saved.";

        } else {
            // Create Logic
            const capsulesRef = ref(db, "capsules");
            const newCapsuleRef = push(capsulesRef);
            await set(newCapsuleRef, {
                ...capsuleData,
                createdAt: rtdbServerTimestamp(),
                opened: false
            });
            titleMessage = "Capsule Sealed!";
            bodyMessage = "Your new time capsule has been successfully created.";
        }

        showAlertMessage('success', titleMessage, bodyMessage);

        setTimeout(() => {
            showMyCapsules();
            if (window.location.hash) {
                history.replaceState(null, '', window.location.pathname + window.location.search);
            }
        }, 1500);

    } catch (err) {
        console.error("Error saving capsule:", err);
        showAlertMessage('error', 'Database Save Failed', 'There was an error saving your capsule. Please check your connection.');
    }
}

// ===================================
// 6. GLOBAL EXPOSURES (For inline HTML events)
// ===================================

window.viewCapsule = function (id) {
    window.location.href = `capsule-view.html?id=${id}`;
};

window.editCapsule = async function (id) {
    if (!currentUser) return;

    currentCapsuleId = id;

    // Scroll to the form
    document.getElementById('formTitle').scrollIntoView({ behavior: 'smooth' });
    saveCapsuleBtn.textContent = "Update Capsule";

    try {
        const capsuleRef = ref(db, `capsules/${id}`);
        const snapshot = await get(capsuleRef);

        if (snapshot.exists()) {
            const capsule = snapshot.val();
            if (capsule.userId !== currentUser.uid) {
                showAlertMessage('error', 'Access Denied', 'You are not authorized to edit this capsule.');
                currentCapsuleId = null;
                return;
            }

            // Populate Form
            titleInput.value = capsule.title;
            messageInput.value = capsule.message;
            dateInput.value = new Date(capsule.openDate).toISOString().slice(0, 16);
            imageInput.value = capsule.imageUrl || "";
        } else {
            showAlertMessage('error', 'Capsule Not Found', 'The capsule you tried to edit does not exist.');
        }
    } catch (err) {
        console.error("Error loading capsule for edit:", err);
        showAlertMessage('error', 'Failed to Load', 'Failed to load capsule data for editing.');
    }
};

window.deleteCapsule = async function (id) {
    if (!currentUser) return;

    if (confirm("Are you sure you want to delete this capsule? This cannot be undone.")) {
        try {
            const capsuleRef = ref(db, `capsules/${id}`);
            await remove(capsuleRef);
            showAlertMessage('success', 'Deleted!', 'Capsule deleted successfully.');
        } catch (err) {
            console.error("Error deleting capsule:", err);
            showAlertMessage('error', 'Deletion Failed', 'Failed to delete capsule from the database.');
        }
    }
};

// ===================================
// 7. EVENT LISTENERS & INITIALIZATION
// ===================================

// Auth Check & Initial Load
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "index.html";
        return;
    }

    currentUser = user;
    userEmailSpan.textContent = user.email;
    loadUserCapsules(user.uid);
});

// Logout
logoutBtn.addEventListener("click", async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout failed", error);
    }
});

// Form Submission & Cancel
if (newCapsuleForm) {
    newCapsuleForm.addEventListener('submit', handleNewCapsuleSubmission);
}
if (cancelCreateBtn) {
    cancelCreateBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showMyCapsules();
    });
}
if (scrollToCreateBtn) {
    scrollToCreateBtn.addEventListener('click', (e) => {
        // Anchor टैग के डिफ़ॉल्ट व्यवहार (behavior) को रोकें ताकि हम स्मूथ स्क्रॉल नियंत्रित कर सकें।
        e.preventDefault();

        const formTitleElement = document.getElementById('formTitle');
        if (formTitleElement) {
            // फ़ॉर्म की हेडिंग पर स्मूथली स्क्रॉल करें
            formTitleElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start' // हेडिंग को viewport के टॉप पर रखें
            });
        }
    });
}

// Header Scroll Logic
if (mainHeader) {
    // Scroll to Top on Header Click
    mainHeader.style.cursor = 'pointer';
    mainHeader.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // Header Hide/Shrink on Scroll Down
    window.addEventListener("scroll", () => {
        if (window.scrollY > lastScrollY && window.scrollY > 100) {
            mainHeader.classList.add("header-hidden");
        } else if (window.scrollY < lastScrollY) {
            mainHeader.classList.remove("header-hidden");
        }
        lastScrollY = window.scrollY;
    });
}