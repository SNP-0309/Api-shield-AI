import { Router } from 'express';
import { proxyController } from '../controllers/proxyController.js';
import { securityMiddleware } from '../middleware/securityMiddleware.js';

const router = Router();

router.use(securityMiddleware);
router.all('*', proxyController.forward);

export default router;

