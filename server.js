import express from "express";
import * as http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
// const io = socketIo(server);
const io = new Server(server);

// DB connect
/*const { sequelize, User } = require("./models");

sequelize
  .sync()
  .then(() => {
    console.log("DB connection success");
  })
  .catch((err) => {
    console.error(err);
  });*/

// http request 에러 방지
var allowCrossDomain = function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Requeset methods you wish to allow
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );

  // Request headers you wish to allow
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With, content-type"
  );

  // Set to true if need include cookies
  // res.setHeader('Access-Control-Allow-Credentials', true);
  next();
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(allowCrossDomain);

// Test code
app.get("/", (req, res) => {
  console.log("hello this is get api!");
  res.status(200).send({ hi: 1 });
});

// simple socket
io.on("connection", (socket) => {
  console.log(`Socket connected ${socket.id}`);

  socket.on("roomjoin", (userid) => {
    console.log(userid);
  });

  socket.on("message", (obj) => {
    // 클라이언트에서 message라는 이름의 이벤트를 받았을 경우 호출
    console.log("Server received data");
    console.log(obj);
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// 8080 포트로 서버 오픈
server.listen(8080, function () {
  console.log(`Start! express server on port 8080`);
});
