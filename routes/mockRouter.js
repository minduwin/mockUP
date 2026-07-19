import { Router } from 'express';
const mockRouter = Router();
import mockController from '../controller/mockController.js';

mockRouter.get('/', mockController.home);
mockRouter.get('/register', mockController.register);
mockRouter.get('/login', mockController.login);

export default mockRouter;