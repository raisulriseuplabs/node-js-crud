import express from 'express';
import config from '../config/app.js';
import todoRoutes from '../routes/todoRoutes.js';
import employeeRoutes from '../routes/employeeRoutes.js';
import authRoutes from '../routes/authRoutes.js';
import { authenticateToken } from '../app/middleware/authMiddleware.js';

const app = express();
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Auth routes
app.use('/', authRoutes);

// Protected routes
app.use('/todos', authenticateToken, todoRoutes);
app.use('/employees', authenticateToken, employeeRoutes);

app.listen(config.port, () => {
  console.log(`Server listening on port ${config.port}`);
});
