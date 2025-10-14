import express from 'express';
import morgan from 'morgan';
import config from '../config/app.js';
import todoRoutes from '../routes/todoRoutes.js';
import employeeRoutes from '../routes/employeeRoutes.js';
import authRoutes from '../routes/authRoutes.js';
import llmRoutes from '../routes/llmRoutes.js';
import { authenticateToken } from '../app/middleware/authMiddleware.js';

const app = express();
app.use(express.json());
app.use('/contents', express.static('contents'));

if (process.env.APP_ENV === 'local') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

//Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});
app.use('/', authRoutes);
app.use('/todos', authenticateToken, todoRoutes);
app.use('/employees', authenticateToken, employeeRoutes);
app.use('/llm', llmRoutes);



app.listen(config.port, () => {
  console.log(`Server listening on port ${config.port}`);
});
