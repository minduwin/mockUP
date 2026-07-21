import express from 'express';
const app = express();
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import session from 'express-session';
import expressSession from 'express-session';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import { prisma } from './lib/prisma.js';
import passport from 'passport';
import 'dotenv/config';
import mockRouter from './routes/mockRouter.js';
import { mock } from 'node:test';

const port = process.env.PORT || 3000;

// Adapter to use views directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(
    expressSession({
        cookie: {
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in ms 
        },
        secret: 'a santa at nasa', // Fun palindrome! 
        resave: false,             // Pro-tip: false is safer with custom stores to avoid race conditions
        saveUninitialized: false,  // Pro-tip: false prevents empty cookie spam from random site visitors
        store: new PrismaSessionStore(
            prisma,
            {
                checkPeriod: 2 * 60 * 1000, // 2 minutes in ms
                dbRecordIdIsSessionId: true,
                dbRecordIdFunction: undefined,
            }
        )
    })
);

app.use(session({ secret: 'mario', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// Global middleware to access local variables as user
app.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});

app.use('/', mockRouter);

app.listen(port, (error) => {
    if (error) {
        throw error;
    }

    console.log(`Listening on port ${port}`);
});