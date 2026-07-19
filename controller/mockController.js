import { body, matchedData } from 'express-validator';

async function home(req, res) {
    res.render('index', {
        title: 'Home Page'
    })
}

async function register(req, res) {
    res.render('register', {
        title: 'Register Page'
    })
}

async function login(req, res) {
    res.render('login', {
        title: 'Login Page'
    })
}

export default {
    home,
    register,
    login,
};