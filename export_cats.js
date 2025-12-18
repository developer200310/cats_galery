const mysql = require('mysql');
const fs = require('fs');

// Connect to local database
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'express_sql_db'
});

db.connect((err) => {
    if (err) {
        console.error('Connection error:', err);
        process.exit(1);
    }

    console.log('Connected to database');

    // Query all cats
    db.query('SELECT * FROM cats', (qErr, results) => {
        if (qErr) {
            console.error('Query error:', qErr);
            db.end();
            process.exit(1);
        }

        console.log(`Found ${results.length} cats`);

        // Generate INSERT statements
        let sqlStatements = '';
        results.forEach(cat => {
            const name = mysql.escape(cat.name);
            const tag = mysql.escape(cat.tag);
            const description = mysql.escape(cat.description);
            const img = mysql.escape(cat.img);

            sqlStatements += `INSERT INTO cats (name, tag, description, img) VALUES (${name}, ${tag}, ${description}, ${img});\n`;
        });

        // Save to file
        fs.writeFileSync('cats_data.sql', sqlStatements);
        console.log('Export complete! File saved as cats_data.sql');
        console.log('You can now import this to TiDB Cloud');

        db.end();
    });
});
