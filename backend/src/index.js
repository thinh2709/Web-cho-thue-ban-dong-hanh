import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/database.js';
import { seedDatabase } from '../Config/seedData.js';

const PORT = Number(process.env.PORT) || 3000;

try {
  await connectDB();
  if (process.env.NODE_ENV === 'development') {
    await seedDatabase();
  }
  app.listen(PORT, () => {
    console.log(`API lắng nghe tại http://localhost:${PORT}`);
  });
} catch (err) {
  console.error('Không khởi động được server:', err);
  process.exit(1);
}
