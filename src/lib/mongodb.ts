// src/lib/mongodb.ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

// Extend the global object with a specific property for our Mongoose connection cache.
// Using a more unique name like `mongooseConnectionCache` is safer to avoid conflicts.
declare global {
  var mongooseConnectionCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

async function dbConnect() {
  // Initialize the cache property on the global object if it doesn't exist.
  // This ensures `global.mongooseConnectionCache` is always an object before we try to access its properties.
  if (!global.mongooseConnectionCache) {
    global.mongooseConnectionCache = { conn: null, promise: null };
  }

  // Use a local constant for brevity, referring to the global cache.
  const cached = global.mongooseConnectionCache;

  // If a connection is already established, return it immediately.
  if (cached.conn) {
    return cached.conn;
  }

  // If there's no pending connection promise, create one.
  // This prevents multiple connection attempts if `dbConnect` is called rapidly.
  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Recommended for serverless environments
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((m) => {
      // The `then` callback receives the mongoose instance itself, which is what we need to cache.
      return m;
    });
  }

  // Await the connection promise and store the actual connection object.
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;