// src/lib/mongodb.ts
import mongoose from 'mongoose';
import '../models/Bill';      // <-- Added this
import '../models/Customer';   // <-- Added this
import '../models/SparePart';  // <-- Added this

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

declare global {
  var mongooseConnectionCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

async function dbConnect() {
  if (!global.mongooseConnectionCache) {
    global.mongooseConnectionCache = { conn: null, promise: null };
  }

  const cached = global.mongooseConnectionCache;

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((m) => {
      return m;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;