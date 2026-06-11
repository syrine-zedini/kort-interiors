import { Router } from 'express';
import { signup, login, validateEmail, resendValidation ,validatePhoneOtp,resendPhoneOtp} from '../services/auth.service';

const router = Router();

router.post('/signup', async (req, res) => {
  try {
    const result = await signup(req.body);
    res.status(201).json(result);
  } catch (err: any) {
    const message = err?.message || 'Signup failed';
    const status = /already exists|already in use/i.test(message) ? 409 : 400;
    res.status(status).json({ message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const result = await login(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ message: err.message });
  }
});

router.get('/validate-email', async (req, res) => {
  try {
    const token = req.query.token as string;  
    if (!token) return res.status(400).json({ message: 'Token is required' });

    const result = await validateEmail(token); 
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/resend-validation', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const result = await resendValidation(email);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/validate-phone-otp', async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    const result = await validatePhoneOtp(phoneNumber, otp);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});


router.post('/resend-phone-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ message: 'phoneNumber is required' });
    }

    const result = await resendPhoneOtp(phoneNumber);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});


export default router;
