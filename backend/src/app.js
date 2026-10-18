import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import attendanceRoutes from './routes/attendance.js';
import timetableRoutes from './routes/timetable.js';
import noticeRoutes from './routes/notice.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { metricsMiddleware, register } from './metrics.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
  app.use(express.json());
  app.use(morgan('dev'));
  app.use(metricsMiddleware);

  // Health + readiness probes (used by Kubernetes).
  app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));
  app.get('/ready', (req, res) => res.json({ status: 'ready' }));

  // Prometheus scrape endpoint.
  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/timetable', timetableRoutes);
  app.use('/api/notices', noticeRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
