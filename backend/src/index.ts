import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler, notFoundHandler, logError } from './middleware/errorHandler';
import rekapanRoutes from './routes/rekapan.routes';
import rekapanInternalRoutes from './routes/rekapanInternal.routes';
import kasbonRoutes from './routes/kasbon.routes';
import pengeluaranRoutes from './routes/pengeluaran.routes';
import scheduleRoutes from './routes/schedule.routes';
import payrollRoutes from './routes/payroll.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ========== Middleware ==========

// CORS
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3001,http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method.toUpperCase()} ${req.path}`);
  next();
});

// Response time tracking
app.use((req, res, next) => {
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`✓ Response: ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// ========== Routes ==========

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/rekapan', rekapanRoutes);
app.use('/api/rekapan-internal', rekapanInternalRoutes);
app.use('/api/kasbon', kasbonRoutes);
app.use('/api/pengeluaran', pengeluaranRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/payroll', payrollRoutes);

// ========== Error Handlers ==========

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ========== Server Startup ==========

app.listen(PORT, () => {
  const border = '═'.repeat(60);
  console.log(`\n${border}`);
  console.log(`🚀 Server Running`);
  console.log(`${border}`);
  console.log(`🌐 URL       : http://localhost:${PORT}`);
  console.log(`📝 API Docs  : http://localhost:${PORT}/api`);
  console.log(`💚 Health    : http://localhost:${PORT}/health`);
  console.log(`📚 Database  : ${process.env.DATABASE_URL?.split('@')[1] || 'Not configured'}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`${border}\n`);
});
