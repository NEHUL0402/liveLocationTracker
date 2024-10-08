const express = require("express");
const path = require("path");
const app = express();
const http = require("http");
const socketio = require("socket.io");
const server = http.createServer(app);
const io = socketio(server);

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "public")));

// Set the view engine to EJS
app.set("view engine", "ejs");

io.on("connection", function (socket) {
  console.log("A new user connected: " + socket.id);

  // Listen for the user's location updates
  socket.on("location", function (data) {
    // Emit the location to all clients, including the user ID
    io.emit("location", { id: socket.id, ...data });
  });

  // Handle custom user-disconnected event
  socket.on("user-disconnected", (id) => {
    console.log("User disconnected: " + id);
    // Emit event to all clients to remove the disconnected user's marker
    io.emit("user-disconnected", id);
  });

  // Listen for the disconnection of users
  socket.on("disconnect", function () {
    console.log("User disconnected: " + socket.id);
    // Emit event to notify about the user disconnection
    socket.broadcast.emit("user-disconnected", socket.id);
  });
});

// Serve the main page
app.get("/", function (req, res) {
  res.render("index");
});

// Start the server on port 3000
server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
