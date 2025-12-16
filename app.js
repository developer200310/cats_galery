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
  queueLimit: 0
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


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});