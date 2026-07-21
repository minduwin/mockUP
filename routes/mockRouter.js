import { Router } from 'express';
const mockRouter = Router();
import mockController from '../controller/mockController.js';
import passport from '../config/passport.js';

mockRouter.get('/', mockController.home);
mockRouter.get('/register', mockController.register);
mockRouter.get('/login', mockController.login);
mockRouter.get('/logout', mockController.loggingOut);

mockRouter.post('/register', mockController.addUser);
mockRouter.post('/login', 
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/',
        failureMessage: true
    })
);

export default mockRouter;