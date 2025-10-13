import express from 'express';
import config from '../config/app.js';
import todoRoutes from '../routes/todoRoutes.js';
import employeeRoutes from '../routes/employeeRoutes.js';

const app = express();
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Todo routes
app.use('/todos', todoRoutes);

// Employee routes
app.use('/employees', employeeRoutes);

app.listen(config.port, () => {
  console.log(`Server listening on port ${config.port}`);
});
