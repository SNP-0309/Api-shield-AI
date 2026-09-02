import { Router } from 'express';
import { dashboardController } from '../controllers/dashboardController.js';

const router = Router();

router.get('/overview', dashboardController.getOverview);
router.get('/clients', dashboardController.getClients);
router.get('/traffic', dashboardController.getTraffic);
router.get('/timeseries', dashboardController.getTimeseries);
router.get('/client/:id', dashboardController.getClientDetails);

export default router;
