import http from "http";
import dotenv from "dotenv";
import handleTasksRoutes from "./routes/tasks.js";
import { connectToDB } from "./database/db.js";

dotenv.config();
const PORT = process.env.PORT || 3000;

async function startServer() {
  await connectToDB();

  const server = http.createServer((req, res) => {
    handleTasksRoutes(req, res);
  });

  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer();
