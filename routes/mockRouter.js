import { Router } from 'express';
import mockController from '../controller/mockController.js';
import passport from '../config/passport.js';
import { isAuth } from '../middleware/isAuth.js';

const mockRouter = Router();

mockRouter.get('/', mockController.home);
mockRouter.get('/register', mockController.register);
mockRouter.get('/login', mockController.login);
mockRouter.get('/upload', isAuth, mockController.renderUpload);
mockRouter.get('/logout', mockController.loggingOut);
mockRouter.get('/folders/:id', isAuth, mockController.openFolder);

mockRouter.post('/register', mockController.newUser);
mockRouter.post('/login', 
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/',
        failureMessage: true
    })
);
mockRouter.post('/createFolder', isAuth, mockController.createFolder);
mockRouter.post('/upload', isAuth, mockController.uploadMiddleware.single('yourfile'), mockController.uploadFile);

mockRouter.post('/folders/:id/update', isAuth, mockController.updateFolder);
mockRouter.post('/folders/:id/delete', isAuth, mockController.deleteFolder);

export default mockRouter;