const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authorization = require('../middleware/authorization');

// Register
app.post('/register', async (req, res) => {
    try {
        // save the password using bcrypt
        const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
        // get the username and password from the request body
        const { username, email, name, birth_date, jurusan_kuliah } = req.body;

        // check if username or email already exist
        const checkUsername = await pool.query(
            'SELECT * FROM user_data WHERE username = $1',
            [username]
        );
        const checkEmail = await pool.query(
            'SELECT * FROM user_data WHERE email = $1',
            [email]
        );

        // if username or email already exist, return error
        if (checkUsername.rows.length !== 0 && checkEmail.rows.length !== 0) {
            return res.status(401).json({ error: 'Email and username already exists' });
        } else if (checkEmail.rows.length !== 0) {
            return res.status(401).json({ error: 'Email already exists' });
        } else if (checkUsername.rows.length !== 0) {
            return res.status(401).json({ error: 'Username already exists' });
        }

        // insert into user table
        const newUser = await pool.query(
            'INSERT INTO user_data (username, email, name, birth_date, jurusan_kuliah, password) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [username, email, name, birth_date, jurusan_kuliah, hashedPassword]
        );

        res.json(newUser.rows[0]);
        console.log("Register success");

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// Login
// Login using username and password
app.post('/login', validInfo, async (req, res) => {
    try {
        // get the username and password from the request body
        const { username, password } = req.body;

        // check if username already exist
        const checkUsername = await pool.query(
            'SELECT * FROM user_data WHERE username = $1',
            [username]
        );

        // if username already exist, return error
        if (checkUsername.rows.length === 0) {
            return res.status(401).json('Username not found');
        }

        // check if password is correct
        const checkPassword = await bcrypt.compare(password, checkUsername.rows[0].password);

        // if password is not correct, return error
        if (!checkPassword) {
            return res.status(401).json('Password is incorrect');
        }

        // generate jwt token
        const token = jwtGenerator(checkUsername.rows[0].user_id);
        
        // if username and password is correct, return the token and user_id
        res.json({ token, user_id: checkUsername.rows[0].user_id });

    } catch (err) {
        console.error(err.message);
    }
});

// To verify the access
app.get("/is-verify", authorization, async (req, res) => {
    try {
        res.json(true);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

module.exports = router;