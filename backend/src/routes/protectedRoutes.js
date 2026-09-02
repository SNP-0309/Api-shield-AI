import { Router } from 'express';
import { apiController } from '../controllers/apiController.js';
import { securityMiddleware } from '../middleware/securityMiddleware.js';

const router = Router();

// Protect every endpoint in this router with API Shield security middleware.
router.use(securityMiddleware);

router.get('/ping', apiController.ping);

export default router;
