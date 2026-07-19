import express from 'express';
const app = express();
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import session from 'express-session';
import expressSession from 'express-session';
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