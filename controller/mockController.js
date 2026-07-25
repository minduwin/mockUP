import { body, matchedData } from 'express-validator';
import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

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
        where: { userId: req.user.id },
        orderBy: { id: 'desc' },
        include: { folder: true } // Include folder details in the query
    });
    
    // Fetch folders and include their associated files directly
    const userFolders = await prisma.folder.findMany({
        where: { userId: req.user.id },
        include: {
            files: {
                orderBy: { id: 'desc' }
            }
        },
        orderBy: { id: 'desc' }
    });

    res.render('upload', {
        title: 'File Manager',
        files: userFiles,
        folders: userFolders
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

async function createFolder(req, res) {
    const { newFolder } = req.body;

    if (!newFolder || newFolder.trim() === '') {
        return res.status(400).send('Folder name cannot be empty');
    }

    try {
        await prisma.folder.create({
            data: {
                name: newFolder.trim(),
                userId: req.user.id
            }
        });

        res.redirect('/upload');  // Refresh page to show the new folder
    } catch (error) {
        console.error('Folder creation error: ', error);
        res.status(500).send('Failed to create folder.');
    }
}

async function uploadFile(req, res) {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    try {
        // 1. Check if the user passed a folderId from a dropdown, OR find an existing folder
        let folderId = req.body.folderId ? parseInt(req.body.folderId) : null;

        if (!folderId) {
            // Find an existing folder for this user, or create a default "General" folder ONCE
            let defaultFolder = await prisma.folder.findFirst({
                where: { userId: req.user.id }
            });

            if (!defaultFolder) {
                defaultFolder = await prisma.folder.create({
                    data: {
                        name: 'General',
                        userId: req.user.id
                    }
                });
            }
            folderId = defaultFolder.id;
        }

        // 2. Save the file linked to the correct folder
        await prisma.file.create({
            data: {
                filename: req.file.originalname,
                path: req.file.path,
                userId: req.user.id,
                folderId: folderId
            }
        });

        res.redirect('/upload');
    } catch (error) {
        console.error('File save error: ', error);
        res.status(500).send('Failed to process upload.');
    }
}

async function openFolder(req, res) {
    // Grab ID from URL parameters, NOT req.body:
    const folderId = parseInt(req.params.id);

    if (isNaN(folderId)) {
        return res.status(400).send('Invalid folder ID.');
    }

    try {
        // Find folder and make sure it belongs to the logged user
        const folder = await prisma.folder.findFirst({
            where: { 
                id: folderId,
                userId: req.user.id     // Security check
            },
            include: {
                files: {
                    orderBy: { id: 'desc' }
                }
            }
        });

        // If no folder found or belong to another user
        if (!folder) {
            return res.status(404).send('Folder not found.');
        }

        // Render in another view
        res.render('folders', {
            title: `Folder: ${folder.name}`,
            folder: folder
        });
    } catch (error) {
        console.error('Error opening folder: ', error);
        res.status(500).send('Server error opening folder');
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

async function updateFolder(req, res) {
    const folderId = parseInt(req.params.id);
    const { name } = req.body;

    if (isNaN(folderId)) {
        return res.status(400).send('Invalid folder ID.');
    }

    try {
        // updateMany will ensure to only update if both folder ID and userId match
        const result = await prisma.folder.updateMany({
            where: {
                id: folderId,
                userId: req.user.id  // Authorization check
            },
            data: {
                name: name.trim()
            }
        });

        if (result.count === 0) {
            return res.status(404).send('Folder not found or unauthorized.');
        }

        res.redirect('/upload');
    } catch (error) {
        console.error('Update error: ', error);
        return res.status(500).send('Error updating folder.');
    }
}

async function deleteFolder(req, res) {
    const folderId = parseInt(req.params.id);

    try {
        // Find all files in the folder
        const filesToDelete = await prisma.file.findMany({
            where: { 
                folderId: folderId, 
                userId: req.user.id
            }
        });

        // Delete files off the disk
        for (const file of filesToDelete) {
            try {
                await fs.unlink(file.path);  // remove physical file from uploads/
            } catch (error) {
                console.error(`Could not delete file at ${file.path}: `, error);
            }
        }

        // Remove records from database
        await prisma.file.deleteMany({ where: {folderId: folderId, userId: req.user.id } });
        await prisma.folder.deleteMany({ where: { id: folderId, userId: req.user.id } });

        res.redirect('/upload');
    } catch (error) {
        console.error('Delete error: ', error);
        res.status(500).send('Error deleting folder.');
    }
}

export default {
    home,
    register,
    login,
    renderUpload,
    newUser,
    createFolder,
    uploadFile,
    openFolder,
    loggingOut,
    updateFolder,
    deleteFolder
};