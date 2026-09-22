import mongoose from 'mongoose';

let mongoOnline = false;

export function isMongoOnline() {
  return mongoOnline && mongoose.connection.readyState === 1;
}

export async function initMongo() {
  const mongoUri = process.env.MONGODB_SRV || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.warn('[!] MongoDB is not configured. Dashboard authentication is unavailable.');
    return false;
  }

  mongoose.connection.on('connected', () => {
    mongoOnline = true;
    console.log('[+] MongoDB connected successfully.');
  });
  mongoose.connection.on('disconnected', () => {
    mongoOnline = false;
    console.warn('[!] MongoDB connection lost.');
  });

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE || 10)
    });
    mongoOnline = true;
    return true;
  } catch (error) {
    mongoOnline = false;
    console.error('[MongoDB] Connection failed:', error.message);
    return false;
  }
}
