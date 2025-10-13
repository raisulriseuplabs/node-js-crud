import express from 'express';
import EmployeeController from '../app/controllers/EmployeeController.js';
import { imageUpload } from '../app/middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/', EmployeeController.index);
router.post('/', EmployeeController.create);
router.get('/:id', EmployeeController.show);
router.put('/:id', EmployeeController.update);
router.patch('/:id', EmployeeController.patch);
router.delete('/:id', EmployeeController.destroy);
router.post('/:id/avatar', imageUpload, EmployeeController.uploadAvatar);

export default router;