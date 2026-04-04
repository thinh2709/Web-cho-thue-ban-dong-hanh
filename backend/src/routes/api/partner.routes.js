import express from 'express';
import {
  registerPartner,
  getPartnerApplications,
  reviewPartnerApplication,
} from '../../controllers/partner.controller.js';

const router = express.Router();

router.post('/register', registerPartner);
router.get('/applications', getPartnerApplications);
router.patch('/:id/review', reviewPartnerApplication);

export default router;
