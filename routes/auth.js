import { getDB } from "../database/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

export async function handleAuthRoutes(req, res) {
  const db = await getDB();
  const userCollection = db.collection("users");

  if (req.method === "POST" && req.url === "/auth/register") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", async () => {
      try {
        const { username, password, phone, email } = JSON.parse(body);
        if (!username || !password || !phone || !email) {
          throw new Error("Missing required fields");
        }

        const existingUser = await userCollection.findOne({ email });
        if (existingUser) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "User already exists" }));
          return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await userCollection.insertOne({
          username,
          password: hashedPassword,
          phone,
          email
        })

        res.writeHead(201, {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        })
        res.end(JSON.stringify({
          message: "User registered successfully",
          userId: result.insertedId
        }))
      } catch (error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: error.message }));
      }
    });
  }
}
