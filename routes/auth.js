const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();


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
                return res.status(401).json({ message: 'Invalid email or password' });
            }

            const user = results[0];

            // Compare passwords
            bcrypt.compare(password, user.password, (compareErr, isMatch) => {
                if (compareErr || !isMatch) {
                    return res.status(401).json({ message: 'Invalid email or password' });
                }

                // Set user session
                req.session.user = {
                    id: user.id,
                    username: user.username,
                    email: user.email
                };

                res.json({
                    message: 'Login successful',
                    user: req.session.user
                });
            });
        });
    });
});

// User logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Could not log out' });
        }
        res.clearCookie('cat_gallery_session');
        res.json({ message: 'Logged out successfully' });
    });
});

// Verify session
router.get('/verify', (req, res) => {
    if (req.session.user) {
        return res.json({ user: req.session.user });
    }
    res.status(401).json({ message: 'Not authenticated' });
});

module.exports = router;

