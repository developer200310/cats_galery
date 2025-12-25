const express = require('express');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'JWT Unset';
console.log("Auth Route JWT_SECRET:", JWT_SECRET);

// Middleware to get DB connection
const getDb = (req) => req.app.get('db');

// User registration
router.post('/signup', (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const db = getDb(req);

    // Check if user already exists
    db.getConnection((err, connection) => {
        if (err) {
            return res.status(500).json({ message: 'Database connection error' });
        }

        connection.query('SELECT * FROM users WHERE email = ?', [email], (qErr, results) => {
            if (qErr) {
                connection.release();
                return res.status(500).json({ message: 'Database error' });
            }

            if (results.length > 0) {
                connection.release();
                return res.status(400).json({ message: 'User already exists' });
            }

            // Hash password
            bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
                if (hashErr) {
                    connection.release();
                    return res.status(500).json({ message: 'Error hashing password' });
                }

                // Insert user
                connection.query(
                    'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                    [username, email, hashedPassword],
                    (insertErr) => {
                        connection.release();

                        if (insertErr) {
                            console.error("Error creating user in DB:", insertErr); // Log the actual error
                            return res.status(500).json({ message: 'Error creating user', error: insertErr.message });
                        }

                        res.status(201).json({ message: 'User created successfully' });
                    }
                );
            });
        });
    });
});

// User login
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    const db = getDb(req);

    db.getConnection((err, connection) => {
        if (err) {
            return res.status(500).json({ message: 'Database connection error' });
        }

        connection.query('SELECT * FROM users WHERE email = ?', [email], (qErr, results) => {
            connection.release();

            if (qErr) {
                return res.status(500).json({ message: 'Database error' });
            }

            if (results.length === 0) {
                console.log("Login failed: User not found for email", email);
                return res.status(401).json({ message: 'Invalid email or password' });
            }

            const user = results[0];

            // Compare passwords
            bcrypt.compare(password, user.password, (compareErr, isMatch) => {
                if (compareErr || !isMatch) {
                    console.log("Login failed: Password mismatch for user", email);
                    return res.status(401).json({ message: 'Invalid email or password' });
                }

                const token = jwt.sign(
                    { id: user.id, username: user.username, email: user.email },
                    JWT_SECRET,
                    { expiresIn: '2h' }
                );

                res.cookie('token', token, {
                    httpOnly: true,
                    // secure: process.env.NODE_ENV === 'production', // Uncomment in production
                    maxAge: 7200000 // 2 hours
                });

                res.json({
                    message: 'Login successful',
                    user: { id: user.id, username: user.username, email: user.email }
                });
            });
        });
    });
});

// User logout
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
});

// Verify 
router.get('/verify', (req, res) => {
    const token = req.cookies.token;

    if (!token || token === "undefined") {
        return res.status(401).json({ message: 'Not authenticated' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid token' });
        }
        res.json({ user: decoded });
    });
});

module.exports = router;

