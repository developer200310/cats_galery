const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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
                            return res.status(500).json({ message: 'Error creating user' });
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
                return res.status(401).json({ message: 'Invalid email or password' });
            }

            const user = results[0];

            // Compare passwords
            bcrypt.compare(password, user.password, (compareErr, isMatch) => {
                if (compareErr || !isMatch) {
                    return res.status(401).json({ message: 'Invalid email or password' });
                }

                // Generate JWT token
                const token = jwt.sign(
                    { id: user.id, email: user.email, username: user.username },
                    JWT_SECRET,
                    { expiresIn: '7d' }
                );

                res.json({
                    message: 'Login successful',
                    token,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email
                    }
                });
            });
        });
    });
});

// Verify token middleware
router.get('/verify', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        res.json({ user: decoded });
    });
});

module.exports = router;
