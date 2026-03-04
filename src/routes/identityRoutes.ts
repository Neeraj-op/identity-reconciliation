import { Router } from 'express';
import { identifyContact } from '../controllers/identityController';

const router = Router();

router.post('/identify', identifyContact);
router.get('/identify', (req, res) => {
    res.json({
      message: 'This endpoint requires POST request',
      usage: {
        method: 'POST',
        url: '/api/identify',
        body: {
          email: 'example@test.com',
          phoneNumber: '123456'
        }
      }
    });
  });

export default router;