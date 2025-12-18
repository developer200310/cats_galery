const loginModal = document.getElementById("loginModal");
const signupModal = document.getElementById("signupModal");
const modal = document.getElementById("modal");
const editModal = document.getElementById("editModal");

// Buttons & Forms
const addCatBtn = document.getElementById("addCatBtn");
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const logoutBtn = document.getElementById("logoutBtn");
const heroLoginBtn = document.getElementById("heroLoginBtn");
const heroSignupBtn = document.getElementById("heroSignupBtn");

// Close Buttons
const closeModal = document.getElementById("closeModal");
const closeEditModal = document.getElementById("closeEditModal");
const closeLoginModal = document.getElementById("closeLoginModal");
const closeSignupModal = document.getElementById("closeSignupModal");

// Forms
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
const API_URL = "/cats";
const AUTH_URL = "/auth";
const ITEMS_PER_PAGE = 4;
let currentPage = 1;
let allCats = [];
let filteredCats = [];
let selectedTag = null;
let currentUser = null;

/* ========== NOTIFICATION SYSTEM ========== */
function showNotification(message, type = "success", duration = 4000) {
    const container = document.getElementById("notificationContainer");
    if (!container) return;

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
function showGallery() {
    const gallerySection = document.getElementById("gallerySection");
    if (gallerySection) gallerySection.style.display = "block";
}

function hideGallery() {
    const gallerySection = document.getElementById("gallerySection");
    if (gallerySection) gallerySection.style.display = "none";
}

// OPEN MODAL
if (addCatBtn) {
    addCatBtn.addEventListener("click", () => {
        modal.style.display = "flex";
    });
}

// CLOSE MODAL
if (closeModal) {
    closeModal.addEventListener("click", () => {
        modal.style.display = "none";
    });
}

// CLOSE EDIT MODAL
if (closeEditModal) {
    closeEditModal.addEventListener("click", () => {
        editModal.style.display = "none";
    });
}

// PAGINATION HANDLERS
if (prevBtn) {
    prevBtn.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            displayCats();
        }
    });
}

if (nextBtn) {
    nextBtn.addEventListener("click", () => {
        const totalPages = Math.ceil(filteredCats.length / ITEMS_PER_PAGE);
        if (currentPage < totalPages) {
            currentPage++;
            displayCats();
        }
    });
}

// SEARCH FUNCTIONALITY
if (searchInput) {
    searchInput.addEventListener("input", (e) => {
        const searchTerm = e.target.value.toLowerCase();
        currentPage = 1;
        applyFilters();
    });
}

// TAG FILTER FUNCTIONALITY
function applyFilters() {
    let result = allCats;

    // Apply tag filter
    if (selectedTag) {
        result = result.filter(cat => cat.tag === selectedTag);
    }

    // Apply search filter
    if (searchInput) {
        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm) {
            result = result.filter(cat =>
                cat.name.toLowerCase().includes(searchTerm)
            );
        }
    }

    filteredCats = result;
    currentPage = 1;
    displayCats();
}

// Generate unique tags and add click handlers
function generateTags() {
    if (!tagContainer) return;

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
if (clearFilterBtn) {
    clearFilterBtn.addEventListener("click", () => {
        selectedTag = null;
        if (searchInput) searchInput.value = "";
        document.querySelectorAll(".tag-btn").forEach(btn =>
            btn.classList.remove("active")
        );
        const allBtn = document.querySelector('.tag-btn[data-tag="all"]');
        if (allBtn) allBtn.classList.add("active");
        filteredCats = allCats;
        currentPage = 1;
        displayCats();
    });
}

// Show all button
const allTagBtn = document.querySelector('.tag-btn[data-tag="all"]');
if (allTagBtn) {
    allTagBtn.addEventListener("click", () => {
        selectedTag = null;
        if (searchInput) searchInput.value = "";
        document.querySelectorAll(".tag-btn").forEach(btn =>
            btn.classList.remove("active")
        );
        allTagBtn.classList.add("active");
        filteredCats = allCats;
        currentPage = 1;
        displayCats();
    });
}

// SUBMIT ADD CAT FORM
if (addCatForm) {
    addCatForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const newCat = {
            name: document.getElementById("name").value,
            description: document.getElementById("description").value,
            tag: document.getElementById("tag").value,
            img: document.getElementById("img").value,
        };

        try {
            const res = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newCat)
            });

            const data = await res.json();

            if (res.ok) {
                showNotification("Cat added successfully!", "success");
                modal.style.display = "none";
                addCatForm.reset();
                loadCats();
            } else {
                showNotification(data.error || "Failed to add cat", "error");
            }
        } catch (error) {
            console.error("Error adding cat:", error);
            showNotification("Error adding cat: " + error.message, "error");
        }
    });
}

// SUBMIT EDIT CAT FORM
if (editCatForm) {
    editCatForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const catId = document.getElementById("editCatId").value;
        const updatedCat = {
            name: document.getElementById("editName").value,
            description: document.getElementById("editDescription").value,
            tag: document.getElementById("editTag").value,
            img: document.getElementById("editImg").value,
        };

        try {
            const res = await fetch(`${API_URL}/${catId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedCat)
            });

            const data = await res.json();

            if (res.ok) {
                showNotification("Cat updated successfully!", "success");
                editModal.style.display = "none";
                editCatForm.reset();
                loadCats();
            } else {
                showNotification(data.error || "Failed to update cat", "error");
            }
        } catch (error) {
            console.error("Error updating cat:", error);
            showNotification("Error updating cat: " + error.message, "error");
        }
    });
}

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
    const container = document.getElementById("cats-container");
    if (!container) return;

    const totalPages = Math.ceil(filteredCats.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const catsToDisplay = filteredCats.slice(startIndex, endIndex);

    container.innerHTML = "";

    catsToDisplay.forEach(cat => {
        container.innerHTML += `
            <div class="card">
                <img src="${cat.img}" alt="${cat.name}">
                <h3>${cat.name}</h3>
                <p>${cat.description}</p>
                <span class="tag">${cat.tag}</span>
                <div class="actions">
                    <button class="edit-btn" onclick="editCat(${cat.id}, '${cat.name}', '${cat.description}', '${cat.tag}', '${cat.img}')"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
                    <button class="delete-btn" onclick="deleteCat(${cat.id})"><i class="fa-solid fa-trash"></i> Delete</button>
                </div>
            </div>
        `;
    });

    // Update pagination buttons
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages;
    if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;
}

// EDIT CAT
window.editCat = function (id, name, description, tag, img) {
    document.getElementById("editCatId").value = id;
    document.getElementById("editName").value = name;
    document.getElementById("editDescription").value = description;
    document.getElementById("editTag").value = tag;
    document.getElementById("editImg").value = img;
    editModal.style.display = "flex";
}

// DELETE CAT
window.deleteCat = async function (id) {
    if (confirm("Are you sure you want to delete this cat?")) {
        try {
            const res = await fetch(`${API_URL}/${id}`, {
                method: "DELETE"
            });

            if (res.ok) {
                showNotification("Cat deleted successfully", "success");
                loadCats();
            } else {
                const data = await res.json();
                showNotification(data.error || "Failed to delete cat", "error");
            }
        } catch (error) {
            console.error("Error deleting cat:", error);
            showNotification("Error deleting cat: " + error.message, "error");
        }
    }
}

// AUTH OPEN/CLOSE
if (loginBtn) {
    loginBtn.addEventListener("click", () => {
        loginModal.style.display = "flex";
    });
}

if (signupBtn) {
    signupBtn.addEventListener("click", () => {
        signupModal.style.display = "flex";
    });
}

// HERO BUTTONS
if (heroLoginBtn) {
    heroLoginBtn.addEventListener("click", () => {
        loginModal.style.display = "flex";
    });
}

if (heroSignupBtn) {
    heroSignupBtn.addEventListener("click", () => {
        signupModal.style.display = "flex";
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        currentUser = null;
        updateAuthUI();
        showNotification("Logged out successfully!", "success");
    });
}

if (closeLoginModal) {
    closeLoginModal.addEventListener("click", () => {
        loginModal.style.display = "none";
    });
}

if (closeSignupModal) {
    closeSignupModal.addEventListener("click", () => {
        signupModal.style.display = "none";
    });
}

// Login form submission
if (loginForm) {
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
                loginModal.style.display = "none";
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
}

// Signup form submission
if (signupForm) {
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
                signupModal.style.display = "none";
                loginModal.style.display = "flex";
                signupForm.reset();
            } else {
                showNotification(data.message || "Sign up failed", "error");
            }
        } catch (error) {
            console.error("Signup error:", error);
            showNotification("Signup error: " + error.message, "error");
        }
    });
}

// Update auth UI
function updateAuthUI() {
    const guestControls = document.getElementById("guestControls");
    const userControls = document.getElementById("userControls");
    const logoutBtn = document.getElementById("logoutBtn");
    const guestMessage = document.getElementById("guestMessage");

    if (currentUser) {
        if (guestControls) guestControls.style.display = "none";
        if (userControls) userControls.style.display = "flex";
        if (logoutBtn) logoutBtn.innerHTML = `<i class="fa-solid fa-right-from-bracket"></i> Logout (${currentUser.username})`;
        if (guestMessage) guestMessage.style.display = "none";
        showGallery();
    } else {
        if (guestControls) guestControls.style.display = "flex";
        if (userControls) userControls.style.display = "none";
        if (guestMessage) guestMessage.style.display = "flex";
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

// Initial load check
if (document.getElementById("cats-container")) {
    loadCats();
}
