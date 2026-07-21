import { body, matchedData } from 'express-validator';
import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcryptjs';

const alphaErr = 'Must only contain  letters.';
const lengthErr = 'Must be between 1 and 10 characters.';
const pwdErr = 'Password must be at least 3 characters long.';

const validateUser = [
    body('firstName').trim()
        .isAlpha().withMessage(`First name ${alphaErr}`)
        .isLength({ min: 1, max: 10 }).withMessage(`First name ${lengthErr}`),
    body('password')
        .isLength({ min: 3 }).withMessage(`${pwdErr}`),
    body('confirmPwd').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Password confirmation does not match');
        }
        return true
    }),
]

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

async function addUser(req, res) {
    const { firstname, password } = req.body;

    if (!firstname || !password) {
        return res.status(400).send('Please fill all fields...');
    }

    const hashedPwd = await bcrypt.hash(password, 10);

    try {
        const user = await prisma.user.create({
            data: {
                name: firstname,
                password: hashedPwd
            }
        });
        res.redirect('/login');
    } catch (error) {
        console.error('Database error: ', error);
        res.status(500).send('Something went wrong.');
    }
}

async function loggingOut(req, res, next) {
    req.logout((error) => {
        if (error) {
            return next(error);
        }

        res.redirect('/');
    });
};

export default {
    home,
    register,
    login,
    addUser,
    loggingOut
};