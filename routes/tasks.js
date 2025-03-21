import { ObjectId } from "mongodb";
import { getDB } from "../database/db.js";
import { getCache, setCache, invalidateCache } from "../utils/cache.js";

async function handleTasksRoutes(req, res) {
  try {
    const db = await getDB();
    const taskCollection = db.collection("tasks");
    if (req.method === "GET" && req.url.startsWith("/tasks")) {
      const urlParams = new URL(req.url, `http://${req.headers.host}`);
      const sortOrder = urlParams.searchParams.get("sort") === "asc" ? 1 : -1;
      const cacheKey = `tasks_${req.user.userId}_sort_${sortOrder}`;
      const cachedTasks = getCache(cacheKey);

      if (cachedTasks) {
        res.writeHead(200, {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=60",
        });
        res.end(JSON.stringify(cachedTasks));
        return;
      }
      const filter =
        req.user.role === "admin" ? {} : { userId: req.user.userId };

      if (urlParams.searchParams.has("completed")) {
        const completedValue = urlParams.searchParams
          .get("completed")
          .toLowerCase();
        filter.completed = completedValue === "true";
      }

      if (urlParams.searchParams.has("priority")) {
        const priorityValue = Number(urlParams.searchParams.get("priority"));
        if (!isNaN(priorityValue)) {
          filter.priority = priorityValue;
        }
      }
      if (
        urlParams.searchParams.has("startDate") ||
        urlParams.searchParams.has("endDate")
      ) {
        filter.createdAt = {};

        if (urlParams.searchParams.has("startDate")) {
          filter.createdAt.$gte = new Date(
            urlParams.searchParams.get("startDate")
          );
        }

        if (urlParams.searchParams.has("endDate")) {
          filter.createdAt.$lte = new Date(
            urlParams.searchParams.get("endDate")
          );
        }
      }

      const tasks = await taskCollection
        .find(filter)
        .project({
          task: 1,
          completed: 1,
          priority: 1,
          createdAt: 1,
        })
        .sort({ createdAt: sortOrder })
        .toArray();
        setCache(cacheKey, tasks, 60);
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      });
      res.end(JSON.stringify(tasks));
    } else if (req.method === "POST" && req.url === "/tasks") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });

      req.on("end", async () => {
        const newTask = JSON.parse(body);
        if (!newTask.task) {
          throw new Error("Task is required");
        }
        newTask.userId = req.user.userId;
        newTask.createdAt = new Date();
        newTask.completed = false;
        const result = await taskCollection.insertOne(newTask);
        invalidateCache(`tasks_${req.user.userId}`);
        res.writeHead(201, {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        });
        res.end(
          JSON.stringify({
            message: "Task created successfully",
            taskId: result.insertedId,
          })
        );
      });
    } else if (req.method === "PUT" && req.url.startsWith("/tasks/")) {
      const taskId = req.url.split("/tasks/")[1];
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });

      req.on("end", async () => {
        const updates = JSON.parse(body);
        const filter =
          req.user.role === "admin"
            ? { _id: new ObjectId(taskId) }
            : { _id: new ObjectId(taskId), userId: req.user.userId };
        const result = await taskCollection.updateOne(filter, {
          $set: updates,
        });
        if (result.matchedCount === 0) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "Task not found" }));
        } else {
          invalidateCache(`tasks_${req.user.userId}`);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "Task updated successfully" }));
        }
      });
    } else if (req.method === "DELETE" && req.url.startsWith("/tasks/")) {
      const taskId = req.url.split("/tasks/")[1];
      const filter =
        req.user.role === "admin"
          ? { _id: new ObjectId(taskId) }
          : { _id: new ObjectId(taskId), userId: req.user.userId };
      const result = await taskCollection.deleteOne(filter);
      if (result.deletedCount === 0) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Task not found" }));
      } else {
        invalidateCache(`tasks_${req.user.userId}`);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Task deleted successfully" }));
      }
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Route not found" }));
    }
  } catch (error) {
    console.error("Error in handleTasksRoutes:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Internal server error" }));
  }
}

export default handleTasksRoutes;
