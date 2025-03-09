function handleTasksRoutes(req, res) {
  if (req.method === "GET" && req.url === "/tasks") {
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    });
    res.end(JSON.stringify({ message: "Tasks fetched successfully" }));
  } else if (req.method === "POST" && req.url === "/tasks") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      const task = JSON.parse(body);
      res.writeHead(201, {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      });
      res.end(
        JSON.stringify({ message: "Task created successfully", task: task })
      );
    });
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Route not found" }));
  }
}

export default handleTasksRoutes;
