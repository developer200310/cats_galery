# Cats Gallery 🐱

A beautiful, responsive web application for showcasing a collection of cats. Built with **Node.js**, **Express**, and **MySQL**, featuring a modern "Light Pastel" aesthetic and Glassmorphism design specific to the "Cat Vibe" theme.

## ✨ Features

-   **User Authentication**: Secure Login and Sign Up for guests.
-   **Gallery Management**:
    -   View exclusive cat collection (Registered Users).
    -   Search cats by name.
    -   Filter cats by tags (e.g., Cute, Fluffy).
    -   Pagination for exploring the gallery.
-   **Admin Features**: Add, Edit, and Delete cats (Authenticated).
-   **Modern UI**: 
    -   Sticky Glassmorphism Navbar.
    -   Responsive Design (Mobile-First).
    -   Beautiful 'Cat Vibe' color palette (Coral & Teal).
    -   Interactive Modals and Notifications.
-   **Multi-Page**: Home, About, and Contact pages.

## 🛠️ Tech Stack

-   **Frontend**: HTML5, CSS3 (Vanilla + Variables), JavaScript (ES6+).
-   **Backend**: Node.js, Express.js.
-   **Database**: MySQL.
-   **Fonts/Icons**: Google Fonts (Outfit), Font Awesome.

## 🚀 Getting Started

### Prerequisites

-   Node.js installed.
-   MySQL Server installed and running.

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/developer200310/cats_galery.git
    cd cats_galery
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Database Setup**:
    -   Create a database (default name: `express_sql_db`).
    -   Import the `cats` table schema (if provided) or create it manually:
        ```sql
        CREATE TABLE cats (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            tag VARCHAR(255),
            description TEXT,
            img TEXT
        );
        ```
    -   *Note: The Users table is initialized automatically by the app.*

4.  **Configuration**:
    -   The application uses default credentials (`root` / empty password) for local dev.
    -   You can set environment variables for production: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.

5.  **Run the App**:
    ```bash
    npm start
    ```
    The server will start on `http://localhost:3000`.

## 📂 Project Structure

```
├── public/             # Static Assets (HTML, CSS, JS)
│   ├── index.html      # Home Page & Gallery
│   ├── about.html      # About Page
│   ├── contact.html    # Contact Page
│   ├── style.css       # Main Stylesheet
│   └── script.js       # Frontend Logic
├── routes/             # Express Routes
├── app.js              # Main Server Entry Point
├── package.json        # Dependencies & Scripts
└── README.md           # Documentation
```

## 🎨 Theme "Cat Vibe"

-   **Primary**: Warm Coral (`#FF6B6B`)
-   **Secondary**: Soft Mint (`#4ECDC4`)
-   **Background**: Soft Pink Gradient
-   **Style**: Glassmorphism (Frosted Glass effects)

## 📄 License

This project is open source and available under the [ISC License](LICENSE).
