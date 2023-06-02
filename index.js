const dotenv = require("dotenv");
dotenv.config();
const express = require('express');
const app = express();
const cors = require('cors');
const pool = require('./db');
const bcrypt = require('bcrypt');
const saltRounds = 10;

// middleware
app.use(cors()); // allows us to parse json
app.use(express.json()); // allows us to parse json

// ROUTES //

// create a post
app.post('/post/:id', async (req, res) => {
    try {
        const { post_txt, status } = req.body;
        
        // set rise_vote to 0
        const rise_vote = 0;
        // get user_id from params
        const { id } = req.params;

        // // post_id 
        // const = 22;

        // insert into post table
        const newPost = await pool.query(
            'INSERT INTO post ( post_txt, status, user_id, rise_vote) VALUES ($1, $2, $3, $4) RETURNING *',
            [ post_txt, status, id, rise_vote]
        );

        res.json(newPost.rows[0]);
    } catch (err) {
        console.error(err.message);
        console.log(err.message);
    }
});

// get all posts
app.get('/posts', async (req, res) => {
    try {
        const allPosts = await pool.query(
            'SELECT * FROM post'
        );
        res.json(allPosts.rows);
    } catch (err) {
        console.error(err.message);
    }
});

// get posts of where status lost
app.get('/posts/lost', async (req, res) => {
    try {
        const allPosts = await pool.query(
            'SELECT * FROM post WHERE status = $1',
            ['Lost']
        );
        res.json(allPosts.rows);
    } catch (err) {
        console.error(err.message);
    }
});

// get posts of where status found
app.get('/posts/found', async (req, res) => {
    try {
        const allPosts = await pool.query(
            'SELECT * FROM post WHERE status = $1',
            ['Found']
        );
        res.json(allPosts.rows);
    } catch (err) {
        console.error(err.message);
    }
});

// Delete post using post_id
app.delete('/posts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletePost = await pool.query(
            'DELETE FROM post WHERE post_id = $1',
            [id]
        );
        
        res.json('Post deleted');

    } catch (err) {
        console.error(err.message);
    }
});

// get posts of where status share
app.get('/posts/share', async (req, res) => {
    try {
        const allPosts = await pool.query(
            'SELECT * FROM post WHERE status = $1',
            ['Share']
        );
        res.json(allPosts.rows);
    } catch (err) {
        console.error(err.message);
    }
});

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
        if (checkUsername.rows.length !== 0) {
            return res.status(401).json('Username already exist');
        } else if (checkEmail.rows.length !== 0) {
            return res.status(401).json('Email already exist');
        }

        // Check the error
        // console.log("long character password: " + req.body.password.length);
        // console.log("long character username: " + username.length);
        // console.log("long character email: " + email.length);
        // console.log("long character name: " + name.length);
        // console.log("long character birth_date: " + birth_date.length);
        // console.log("long character jurusan_kuliah: " + jurusan_kuliah.length);

        // insert into user table
        const newUser = await pool.query(
            'INSERT INTO user_data (username, email, name, birth_date, jurusan_kuliah, password) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [username, email, name, birth_date, jurusan_kuliah, hashedPassword]
        );

        res.json(newUser.rows[0]);
        

    } catch (err) {
        console.error(err.message);
    }
});

// Login using username and password
app.post('/login', async (req, res) => {
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

        // if username and password is correct, return the user
        res.json(checkUsername.rows[0]);

    } catch (err) {
        console.error(err.message);
    }
});

app.listen(5000, () => {
    console.log('Server is running on port 5000');
});