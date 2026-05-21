import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const JSON_DB_PATH = path.join(DATA_DIR, 'db.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-Memory/JSON Local Fallback DB
class LocalJSONDb {
  constructor() {
    this.data = {
      users: [],
      goals: [],
      activities: [],
      notifications: [],
      leaderboards: []
    };
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(JSON_DB_PATH)) {
        const fileContent = fs.readFileSync(JSON_DB_PATH, 'utf8');
        this.data = JSON.parse(fileContent);
      } else {
        this.save();
      }
    } catch (err) {
      console.error('Error loading JSON DB, resetting to empty:', err);
    }
  }

  save() {
    try {
      fs.writeFileSync(JSON_DB_PATH, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('Error writing to JSON DB:', err);
    }
  }

  find(collection, filter = {}) {
    const list = this.data[collection] || [];
    return list.filter(item => {
      for (const key in filter) {
        if (item[key] !== filter[key]) return false;
      }
      return true;
    });
  }

  findOne(collection, filter = {}) {
    const list = this.find(collection, filter);
    return list.length > 0 ? list[0] : null;
  }

  insertOne(collection, doc) {
    if (!this.data[collection]) {
      this.data[collection] = [];
    }
    const newDoc = {
      _id: Math.random().toString(36).substring(2, 11),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...doc
    };
    this.data[collection].push(newDoc);
    this.save();
    return newDoc;
  }

  updateOne(collection, filter, update) {
    const doc = this.findOne(collection, filter);
    if (!doc) return null;
    
    // Apply update (simplified)
    const index = this.data[collection].indexOf(doc);
    const updatedDoc = {
      ...doc,
      ...update,
      updatedAt: new Date().toISOString()
    };
    this.data[collection][index] = updatedDoc;
    this.save();
    return updatedDoc;
  }

  deleteMany(collection, filter) {
    const initialLength = (this.data[collection] || []).length;
    this.data[collection] = (this.data[collection] || []).filter(item => {
      for (const key in filter) {
        if (item[key] === filter[key]) return false;
      }
      return true;
    });
    this.save();
    return { deletedCount: initialLength - this.data[collection].length };
  }
}

export const localDb = new LocalJSONDb();

let isConnected = false;
let isFallback = false;

export async function dbConnect() {
  if (isConnected) return { isFallback };

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.warn('⚠️ No MONGODB_URI provided in env. Falling back to local JSON database.');
    isFallback = true;
    isConnected = true;
    return { isFallback };
  }

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000 // 3 seconds timeout
    });
    isConnected = true;
    isFallback = false;
    console.log('✅ MongoDB connected successfully.');
    return { isFallback };
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.warn('⚠️ Falling back to local JSON database.');
    isFallback = true;
    isConnected = true;
    return { isFallback };
  }
}

export function getDb() {
  return isFallback ? localDb : null;
}
