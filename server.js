import http from "http";
import dotenv from "dotenv";
import handleTasksRoutes from "./routes/tasks.js";
import { connectToDB } from "./database/db.js";
import { handleAuthRoutes } from "./routes/auth.js";
import { authenticate } from "./middleware/authMiddleware.js";
import { rateLimiter } from "./middleware/rateLimiter.js";
import { logInfo } from "./utils/logger.js";
dotenv.config();
const PORT = process.env.PORT || 3000;

async function startServer() {
  await connectToDB();

  const server = http.createServer((req, res) => {
    if (req.url.startsWith("/auth")) {
      rateLimiter(req, res,() => handleAuthRoutes(req, res), 30, 15 * 60 * 1000);
    } else {
      rateLimiter(req, res, () => {
        authenticate(
          req,
          res,
          () => {
            logInfo(`User ${req.user.username} accessed ${req.url}`);
            handleTasksRoutes(req, res);
          },
          2,
          60 * 1000
        );
      });
    }
  });

  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer();
