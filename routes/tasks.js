import { ObjectId } from "mongodb";
import { getDB } from "../database/db.js";

async function handleTasksRoutes(req, res) {
  const db = await getDB();
  const taskCollection = db.collection("tasks");
  if (req.method === "GET" && req.url === "/tasks") {
    const tasks = await taskCollection.find({}).toArray();
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
      const result = await taskCollection.insertOne(newTask);
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
      const result = await taskCollection.updateOne(
        { _id: new ObjectId(taskId) },
        { $set: updates }
      );
      if (result.matchedCount === 0) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Task not found" }));
      } else {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Task updated successfully" }));
      }
    });
  } else if (req.method === "DELETE" && req.url.startsWith("/tasks/")) {
    const taskId = req.url.split("/tasks/")[1];
    const result = await taskCollection.deleteOne({
      _id: new ObjectId(taskId),
    });
    if (result.deletedCount === 0) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Task not found" }));
    } else {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Task deleted successfully" }));
    }
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Route not found" }));
  }
}

export default handleTasksRoutes;
