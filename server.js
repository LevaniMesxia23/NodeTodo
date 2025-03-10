import http from "http";
import dotenv from "dotenv";
import handleTasksRoutes from "./routes/tasks.js";
import { connectToDB } from "./database/db.js";
import { handleAuthRoutes } from "./routes/auth.js";
import { authenticate } from "./middleware/authMiddleware.js";
dotenv.config();
const PORT = process.env.PORT || 3000;

async function startServer() {
  await connectToDB();

  const server = http.createServer((req, res) => {
    if(req.url.startsWith("/tasks")){
      authenticate(req, res, () => {
        handleTasksRoutes(req, res);
      });
    } else if(req.url === "/auth/register"){
      handleAuthRoutes(req, res);
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Not found" }));
    }
  });

  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer();
