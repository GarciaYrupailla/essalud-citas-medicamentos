import dotenv from 'dotenv';
import { app } from './app.js';

dotenv.config();

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`API EsSalud ejecutandose en http://localhost:${port}`);
});
