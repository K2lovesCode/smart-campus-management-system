import mongoose from 'mongoose';

export async function connectDB(uri) {
  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`[db] connected to MongoDB`);
  } catch (err) {
    console.error('[db] connection error:', err.message);
    // Retry once after a short delay so the container can wait for Mongo to be ready.
    await new Promise((r) => setTimeout(r, 5000));
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log(`[db] connected to MongoDB (after retry)`);
  }

  mongoose.connection.on('disconnected', () => console.warn('[db] disconnected'));
  mongoose.connection.on('error', (e) => console.error('[db] error:', e.message));
}
