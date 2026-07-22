import { body, matchedData } from 'express-validator';
import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';

// Multer Storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Export the upload middleware to the router to use it
export const uploadMiddleware = multer({ storage: storage });

const alphaErr = 'Must only contain  letters.';
const lengthErr = 'Must be between 1 and 10 characters.';
const pwdErr = 'Password must be at least 3 characters long.';

const validateUser = [
    body('firstname').trim()
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

async function renderUpload(req, res) {
    const userFiles = await prisma.file.findMany({
        where: {
            userId: req.user.id
        },
        orderBy: { id: 'desc' },
    });
    
    res.render('upload', {
        title: 'File Manager',
        files: userFiles,
    });
}

async function newUser(req, res) {
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

async function uploadFile(req, res) {
    if (!req.file) {
        return res.status(400).send('No file uploaded.')
    }
    try {
        // Get or create a default folder for this user
        let folder = await prisma.folder.findFirst({
            where: { userId: req.user.id }
        });

        if (!folder) {
            folder = await prisma.folder.create({
                data: {
                    name: 'General',
                    userId: req.user.id
                }
            });
        }

        // Save file metadata to PostgreSQL and attach the logged in user's ID
        await prisma.file.create({
            data: {
                filename: req.file.originalname,
                path: req.file.path,
                userId: req.user.id,    // Connects to the user
                folderId: folder.id     // Connects to the folder
            },
        });

        res.redirect('/upload');
    } catch (error) {
        console.error('File save error: ', error);
        res.status(500).send('Failed to process upload.');
    }
};

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
    renderUpload,
    newUser,
    uploadFile,
    loggingOut
};