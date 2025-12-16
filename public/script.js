const modal = document.getElementById("modal");
const editModal = document.getElementById("editModal");
const authModal = document.getElementById("authModal");
const addCatBtn = document.getElementById("addCatBtn");
const loginBtn = document.getElementById("loginBtn");
const closeModal = document.getElementById("closeModal");
const closeEditModal = document.getElementById("closeEditModal");
const closeAuthModal = document.getElementById("closeAuthModal");
const closeAuthModal2 = document.getElementById("closeAuthModal2");
const addCatForm = document.getElementById("addCatForm");
const editCatForm = document.getElementById("editCatForm");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const pageInfo = document.getElementById("pageInfo");
const searchInput = document.getElementById("searchInput");
const tagContainer = document.getElementById("tagContainer");
const clearFilterBtn = document.getElementById("clearFilterBtn");

// BACKEND URL
const API_URL = "http://localhost:3000/cats";
const AUTH_URL = "http://localhost:3000/auth";
const ITEMS_PER_PAGE = 4;
let currentPage = 1;
let allCats = [];
let filteredCats = [];
let selectedTag = null;
let currentUser = null;

/* ========== NOTIFICATION SYSTEM ========== */
function showNotification(message, type = "success", duration = 4000) {
    const container = document.getElementById("notificationContainer");
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button class="notification-close">&times;</button>
    `;

    container.appendChild(notification);

    const closeBtn = notification.querySelector(".notification-close");
    closeBtn.addEventListener("click", () => {
        notification.style.animation = "slideOut 0.3s ease-out forwards";
        setTimeout(() => notification.remove(), 300);
    });

    // Auto-remove after duration
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = "slideOut 0.3s ease-out forwards";
            setTimeout(() => notification.remove(), 300);
        }
    }, duration);
}

// GALLERY VISIBILITY CONTROL
const gallerySection = document.getElementById("gallerySection");

function showGallery() {
    gallerySection.style.display = "block";
}

function hideGallery() {
    gallerySection.style.display = "none";
}

// OPEN MODAL
addCatBtn.addEventListener("click", () => {
    modal.style.display = "flex";
});

// CLOSE MODAL
closeModal.addEventListener("click", () => {
    modal.style.display = "none";
});

// CLOSE EDIT MODAL
closeEditModal.addEventListener("click", () => {
    editModal.style.display = "none";
});

// PAGINATION HANDLERS
prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        displayCats();
    }
});

nextBtn.addEventListener("click", () => {
    const totalPages = Math.ceil(filteredCats.length / ITEMS_PER_PAGE);
    if (currentPage < totalPages) {
        currentPage++;
        displayCats();
    }
});

// SEARCH FUNCTIONALITY
searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    currentPage = 1;
    applyFilters();
});

// TAG FILTER FUNCTIONALITY
function applyFilters() {
    let result = allCats;

    // Apply tag filter
    if (selectedTag) {
        result = result.filter(cat => cat.tag === selectedTag);
    }

    // Apply search filter
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
        result = result.filter(cat =>
            cat.name.toLowerCase().includes(searchTerm)
        );
    }

    filteredCats = result;
    currentPage = 1;
    displayCats();
}

// Generate unique tags and add click handlers
function generateTags() {
    const uniqueTags = [...new Set(allCats.map(cat => cat.tag))];
    tagContainer.innerHTML = "";

    uniqueTags.forEach(tag => {
        const tagBtn = document.createElement("button");
        tagBtn.className = "tag-btn";
        tagBtn.textContent = tag;
        tagBtn.dataset.tag = tag;

        tagBtn.addEventListener("click", () => {
            // Remove active class from all tags
            document.querySelectorAll(".tag-btn").forEach(btn =>
                btn.classList.remove("active")
            );

            // Add active class to clicked tag
            tagBtn.classList.add("active");
            selectedTag = tag;
            applyFilters();
        });

        tagContainer.appendChild(tagBtn);
    });
}

// Clear filter
clearFilterBtn.addEventListener("click", () => {
    selectedTag = null;
    searchInput.value = "";
    document.querySelectorAll(".tag-btn").forEach(btn =>
        btn.classList.remove("active")
    );
    document.querySelector('[data-tag="all"]').classList.add("active");
    filteredCats = allCats;
    currentPage = 1;
    displayCats();
});

// Show all button
document.querySelector('[data-tag="all"]').addEventListener("click", () => {
    selectedTag = null;
    searchInput.value = "";
    document.querySelectorAll(".tag-btn").forEach(btn =>
        btn.classList.remove("active")
    );
    document.querySelector('[data-tag="all"]').classList.add("active");
    filteredCats = allCats;
    currentPage = 1;
    displayCats();
});

// SUBMIT ADD CAT FORM
addCatForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const newCat = {
        name: document.getElementById("name").value,
        description: document.getElementById("description").value,
        tag: document.getElementById("tag").value,
        img: document.getElementById("img").value,
    };

    await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCat)
    });

    modal.style.display = "none";
    addCatForm.reset();
    loadCats();
});

// SUBMIT EDIT CAT FORM
editCatForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const catId = document.getElementById("editCatId").value;
    const updatedCat = {
        name: document.getElementById("editName").value,
        description: document.getElementById("editDescription").value,
        tag: document.getElementById("editTag").value,
        img: document.getElementById("editImg").value,
    };

    await fetch(`${API_URL}/${catId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedCat)
    });

    editModal.style.display = "none";
    editCatForm.reset();
    loadCats();
});

// LOAD CATS
async function loadCats() {
    try {
        const res = await fetch(API_URL);
        allCats = await res.json();
        filteredCats = allCats;
        generateTags();
        currentPage = 1;
        displayCats();
    } catch (error) {
        console.error("Error loading cats:", error);
    }
}

// DISPLAY CATS WITH PAGINATION
function displayCats() {
    const totalPages = Math.ceil(filteredCats.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const catsToDisplay = filteredCats.slice(startIndex, endIndex);

    const container = document.getElementById("cats-container");
    container.innerHTML = "";

    catsToDisplay.forEach(cat => {
        container.innerHTML += `
            <div class="card">
                <img src="${cat.img}" alt="${cat.name}">
                <h3>${cat.name}</h3>
                <p>${cat.description}</p>
                <span class="tag">${cat.tag}</span>
                <div class="actions">
                    <button class="edit-btn" onclick="editCat(${cat.id}, '${cat.name}', '${cat.description}', '${cat.tag}', '${cat.img}')">Edit</button>
                    <button class="delete-btn" onclick="deleteCat(${cat.id})">Delete</button>
                </div>
            </div>
        `;
    });

    // Update pagination buttons
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
}

// EDIT CAT
function editCat(id, name, description, tag, img) {
    document.getElementById("editCatId").value = id;
    document.getElementById("editName").value = name;
    document.getElementById("editDescription").value = description;
    document.getElementById("editTag").value = tag;
    document.getElementById("editImg").value = img;
    editModal.style.display = "flex";
}

// DELETE CAT
async function deleteCat(id) {
    await fetch(`${API_URL}/${id}`, {
        method: "DELETE"
    });
    loadCats();
}

/* ========== AUTHENTICATION HANDLERS ========== */

// Auth modal toggle
loginBtn.addEventListener("click", () => {
    authModal.style.display = "flex";
});

closeAuthModal.addEventListener("click", () => {
    authModal.style.display = "none";
});

closeAuthModal2.addEventListener("click", () => {
    authModal.style.display = "none";
});

// Login button - toggle between login and logout
loginBtn.addEventListener("click", () => {
    if (currentUser) {
        // User is logged in - logout
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        currentUser = null;
        updateAuthUI();
        showNotification("Logged out successfully!", "success");
    } else {
        // User is not logged in - show auth modal
        authModal.style.display = "flex";
    }
});

// Auth tab switching
document.querySelectorAll(".auth-tab").forEach(tab => {
    tab.addEventListener("click", (e) => {
        document.querySelectorAll(".auth-tab").forEach(t => t.classList.remove("active"));
        document.querySelectorAll(".auth-form").forEach(f => f.classList.remove("active"));

        e.target.classList.add("active");
        const tabName = e.target.dataset.tab;
        document.getElementById(`${tabName}Form`).classList.add("active");
    });
});

// Login form submission
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    try {
        const res = await fetch(`${AUTH_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            currentUser = data.user;
            authModal.style.display = "none";
            loginForm.reset();
            updateAuthUI();
            showNotification("Login successful!", "success");
        } else {
            showNotification(data.message || "Login failed", "error");
        }
    } catch (error) {
        console.error("Login error:", error);
        showNotification("Login error: " + error.message, "error");
    }
});

// Signup form submission
signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("signupUsername").value;
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;
    const confirmPassword = document.getElementById("signupConfirmPassword").value;

    if (password !== confirmPassword) {
        showNotification("Passwords do not match!", "warning");
        return;
    }

    try {
        const res = await fetch(`${AUTH_URL}/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password })
        });

        const data = await res.json();

        if (res.ok) {
            showNotification("Sign up successful! Please login.", "success");
            document.querySelector('[data-tab="login"]').click();
            signupForm.reset();
        } else {
            showNotification(data.message || "Sign up failed", "error");
        }
    } catch (error) {
        console.error("Signup error:", error);
        showNotification("Signup error: " + error.message, "error");
    }
});

// Update auth UI
function updateAuthUI() {
    if (currentUser) {
        loginBtn.textContent = `Logout (${currentUser.username})`;
        loginBtn.id = "logoutBtn";
        showGallery();
    } else {
        loginBtn.textContent = "Login";
        loginBtn.id = "loginBtn";
        hideGallery();
    }
}

// Check if user is logged in on page load
window.addEventListener("load", () => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (savedToken && savedUser) {
        currentUser = JSON.parse(savedUser);
        updateAuthUI();
    }
});

loadCats();
