import express from 'express';
import TodoController from '../app/controllers/TodoController.js';

const router = express.Router();

router.get('/', TodoController.index);
router.post('/', TodoController.create);
router.get('/:id', TodoController.show);
router.put('/:id', TodoController.update);
router.patch('/:id', TodoController.patch);
router.delete('/:id', TodoController.destroy);

export default router;
