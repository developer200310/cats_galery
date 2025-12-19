const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const authRoutes = require('./routes/auth');

const app = express();
const port = process.env.PORT || 3000;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const cors = require("cors");
app.use(cors());

app.use(express.static('public'));

const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'express_sql_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : undefined
})

// Make db available to routes
app.set('db', db);

// Initialize users table if it doesn't exist
const initUsersTable = () => {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  db.query(createTableSQL, (err) => {
    if (err) {
      console.error('Error creating users table:', err);
    } else {
      console.log('Users table initialized');
    }
  });
};

initUsersTable();

// Initialize adoptions table
const initAdoptionsTable = () => {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS adoptions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      cat_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (cat_id) REFERENCES cats(id) ON DELETE CASCADE,
      UNIQUE KEY unique_adoption (user_id, cat_id)
    )
  `;

  db.query(createTableSQL, (err) => {
    if (err) {
      console.error('Error creating adoptions table:', err);
    } else {
      console.log('Adoptions table initialized');
    }
  });
};

initAdoptionsTable();



const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token || token === "undefined") {
    console.log("Auth failed: Token is missing or 'undefined'");
    return res.status(401).json({ error: "Missing token" });
  }


  console.log(`Verifying token: ${token.substring(0, 10)}... (length: ${token.length})`);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error("JWT Verification Error:", err.message);
      return res.status(403).json({ error: "Invalid token" });
    }
    req.user = user;
    next();
  });
};



// ADOPTION ENDPOINTS
app.get('/adoptions', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const sql = `
    SELECT c.* FROM cats c
    JOIN adoptions a ON c.id = a.cat_id
    WHERE a.user_id = ?
  `;

  db.query(sql, [userId], (err, rows) => {
    if (err) {
      console.error("Error fetching adoptions:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(rows);
  });
});

app.post('/adoptions', authenticateToken, (req, res) => {
  console.log("POST /adoptions hit with body:", req.body);
  const { catId } = req.body;

  const userId = req.user.id;

  if (!catId) {
    return res.status(400).json({ error: "Missing catId" });
  }

  const sql = 'INSERT IGNORE INTO adoptions (user_id, cat_id) VALUES (?, ?)';
  db.query(sql, [userId, catId], (err, result) => {
    if (err) {
      console.error("Error saving adoption:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.status(201).json({ message: "Cat adopted successfully" });
  });
});

app.delete('/adoptions/:catId', authenticateToken, (req, res) => {
  const catId = req.params.catId;
  const userId = req.user.id;

  const sql = 'DELETE FROM adoptions WHERE user_id = ? AND cat_id = ?';
  db.query(sql, [userId, catId], (err, result) => {
    if (err) {
      console.error("Error removing adoption:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ message: "Adoption removed successfully" });
  });
});

// Serve HTML pages

const path = require('path');

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

// Serve static files explicitly
app.get('/style.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'style.css'));
});

app.get('/script.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'script.js'));
});

// Auth routes
app.use('/auth', authRoutes);

app.get('/cats', (req, res) => {
  db.getConnection((err, connection) => {
    if (err) {
      console.error('Error connecting to database:', err);
      return res.status(500).json({ error: 'Db connection error' });
    }


    connection.query("SELECT * FROM cats", (qErr, rows) => {
      connection.release();

      if (qErr) {
        console.error('Error executing query:', qErr);
        return res.status(500).json({ error: "Query execution error" })
      }

      res.json(rows);
    });
  });
});



// Get cats by id
app.get("/cats/:id", (req, res) => {
  db.getConnection((err, connection) => {
    if (err) {
      console.error("DB connection error:", err);
      return res.status(500).json({
        error: "DB connection error"
      });
    }
    connection.query("SELECT * FROM cats where id = ?", [req.params.id], (qErr, rows) => {
      // const sql = "SELECT * FROM cats WHERE id = " + req.params.id;
      // SELECT * FROM cats WHERE id = '5; DROP TABLE cats;'
      console.log(req.params.id);

      connection.release();
      if (qErr) {
        console.error("Query error:", qErr);
        return res.status(500).json({
          error: "Query error"
        });
      }
      res.json(rows);
    });
  });
});


app.post("/cats", (req, res) => {
  const { name, tag, description, img } = req.body;

  if (!name || !tag || !description || !img) {
    return res.status(400).json({ error: "Missing fields" });
  }

  db.getConnection((err, connection) => {
    if (err) {
      return res.status(500).json({ error: "DB connection error" });
    }

    const sql = `
            INSERT INTO cats (name, tag, description, img)
            VALUES (?, ?, ?, ?)
        `;

    connection.query(sql, [name, tag, description, img], (qErr, result) => {
      connection.release();

      if (qErr) {
        return res.status(500).json({ error: "Query error" });
      }

      res.status(201).json({
        message: "Cat inserted successfully",
        insertedId: result.insertId
      });
    });
  });
});

app.delete("/cats/:id", (req, res) => {
  const catId = req.params.id;

  db.getConnection((err, connection) => {
    if (err) {
      return res.status(500).json({ error: "DB connection error" });
    }

    const sql = "DELETE FROM cats WHERE id = ?";

    connection.query(sql, [catId], (qErr, result) => {
      connection.release();

      if (qErr) {
        return res.status(500).json({ error: "Query error" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Cat not found" });
      }

      res.json({
        message: "Cat deleted successfully",
        deletedId: catId
      });
    });
  });
});


app.put("/cats/:id", (req, res) => {
  const catId = req.params.id;
  const { name, tag, description, img } = req.body;

  if (!name || !tag || !description || !img) {
    return res.status(400).json({ error: "Missing fields" });
  }

  db.getConnection((err, connection) => {
    if (err) {
      return res.status(500).json({ error: "DB connection error" });
    }

    const sql = `
            UPDATE cats 
            SET name = ?, tag = ?, description = ?, img = ?
            WHERE id = ?
        `;

    connection.query(sql, [name, tag, description, img, catId], (qErr, result) => {
      connection.release();

      if (qErr) {
        return res.status(500).json({ error: "Query error" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Cat not found" });
      }

      res.json({
        message: "Cat updated successfully",
        id: catId
      });
    });
  });
});


app.patch("/cats/:id", (req, res) => {
  const catId = req.params.id;
  const fieldsToUpdate = req.body;

  if (Object.keys(fieldsToUpdate).length === 0) {
    return res.status(400).json({ error: "No fields provided to update" });
  }

  db.getConnection((err, connection) => {
    if (err) {
      return res.status(500).json({ error: "DB connection error" });
    }

    const sql = "UPDATE cats SET ? WHERE id = ?";

    connection.query(sql, [fieldsToUpdate, catId], (qErr, result) => {
      connection.release();

      if (qErr) {
        return res.status(500).json({ error: "Query error" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Cat not found" });
      }

      res.json({
        message: "Cat updated successfully (PATCH)",
        updatedFields: fieldsToUpdate
      });
    });
  });
});



// Export for Vercel (serverless)

module.exports = app;

// Local development server
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}