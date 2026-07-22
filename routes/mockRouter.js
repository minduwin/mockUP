import { Router } from 'express';
import mockController, { uploadMiddleware } from '../controller/mockController.js';
import passport from '../config/passport.js';
import { isAuth } from '../middleware/isAuth.js';

const mockRouter = Router();

mockRouter.get('/', mockController.home);
mockRouter.get('/register', mockController.register);
mockRouter.get('/login', mockController.login);
mockRouter.get('/upload', isAuth, mockController.renderUpload);
mockRouter.get('/logout', mockController.loggingOut);

mockRouter.post('/register', mockController.newUser);
mockRouter.post('/login', 
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/',
        failureMessage: true
    })
);
mockRouter.post('/upload', isAuth, uploadMiddleware.single('yourfile'), mockController.uploadFile);

export default mockRouter;