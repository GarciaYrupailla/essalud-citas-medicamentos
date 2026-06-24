import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';
import { apiRoutes } from './routes/index.js';
import { errorMiddleware } from './middlewares/error.middleware.js';

dotenv.config();

export const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax'
  }
}));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', apiRoutes);
app.use(errorMiddleware);
