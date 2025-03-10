import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME;

let db;

export async function connectToDB() {
  try {
    const client = new MongoClient(MONGO_URL);
    await client.connect();
    db = client.db(DB_NAME);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.log("Error connecting to MongoDB", error);
    throw error;
  }
}

export async function getDB() {
  if (!db) {
    throw new Error("Database not connected");
  }
  return db;
}
