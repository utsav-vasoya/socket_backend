const express = require("express");
const app = express();
const socketio = require("socket.io");
const { userJoin, getCurrentUser, userLeave } = require("./common");
const port = 3000;

const server = app.listen(port, (err) => {
  if (err) {
    console.log(err);
  } else {
    console.log(`Server is running on port ${port}`);
  }
});

const io = socketio(server);
const user = {};

io.on("connection", (socket) => {
  socket.on("set-user", (username) => {
    user[username] = socket.id;
  });
  socket.on("one-to-one", ({ username, message }) => {
    const recipientSocket = user[username];
    if (recipientSocket) {
      socket.to(recipientSocket).emit("message", {
        sender: socket.id,
        text: message,
      });
    } else {
      socket.emit("one-to-one", { message: "Recipient not found" });
    }
  });
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    socket.join(user.room);
    socket.emit("message", "Welcome to Chat!");
    socket.broadcast
      .to(user.room)
      .emit("message", `${user.username} has joined the chat`);
  });
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);
    if (user) {
      socket
        .to(user.room)
        .emit("message", { username: user.username, message: msg });
    }
  });
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);
    if (user) {
      io.to(user.room).emit("message", `${user.username} has left the chat`);
    }
  });
});
