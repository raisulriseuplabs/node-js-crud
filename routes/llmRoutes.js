import express from 'express';
import LLMController from '../app/controllers/LLMController.js';
import { imageUpload } from '../app/middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/gen', imageUpload, LLMController.gen);

export default router;