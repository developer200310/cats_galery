const modal = document.getElementById("modal");
const editModal = document.getElementById("editModal");
const addCatBtn = document.getElementById("addCatBtn");
const closeModal = document.getElementById("closeModal");
const closeEditModal = document.getElementById("closeEditModal");
const addCatForm = document.getElementById("addCatForm");
const editCatForm = document.getElementById("editCatForm");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const pageInfo = document.getElementById("pageInfo");
const searchInput = document.getElementById("searchInput");

// BACKEND URL
const API_URL = "http://localhost:3000/cats";
const ITEMS_PER_PAGE = 4;
let currentPage = 1;
let allCats = [];
let filteredCats = [];

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

    if (searchTerm === "") {
        filteredCats = allCats;
    } else {
        filteredCats = allCats.filter(cat =>
            cat.name.toLowerCase().includes(searchTerm)
        );
    }
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

loadCats();
