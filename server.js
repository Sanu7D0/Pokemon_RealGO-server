import { randomInt } from "crypto";
import express from "express";
import * as http from "http";
import { Server } from "socket.io";
// import { Pool } from "pg";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Connect Postgres
/*const pg = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: '1234',
  port: 1234
});
pg.connect(err => {
  if (err) {
    console.log(err);
  } else {
    console.log("Connected to db");
  }
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
var connectCount = 0;
io.on("connection", (socket) => {
  console.log(`Socket connected ${socket.id}  ${++connectCount}`);

  socket.on("room", (obj) => {
    socket.join(obj.roomId);
  });

  socket.on("attack", (obj) => {
    io.to(obj.roomId).emit("transferAttack", obj);
    obj.damage = obj.damage + Math.random() * 3;
    console.log(`[${obj.socketId}] attack ${obj.damage}`);
    // socket.to("some room").emit("some evet");
  });

  socket.on("message", (obj) => {
    // 클라이언트에서 message라는 이름의 이벤트를 받았을 경우 호출
    console.log("Server received data");
    console.log(obj);
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}  ${--connectCount}`);
  });
});

io.of("/").adapter.on("create-room", (room) => {
  console.log(`room ${room} was created`);
});
io.of("/").adapter.on("join-room", (room, id) => {
  console.log(`socket ${id} has joined room ${room}`);
});
io.of("/").adapter.on("leave-room", (room, id) => {
  // TODO: 사람 없으면 room 삭제
});

// 8080 포트로 서버 오픈
server.listen(8080, function () {
  console.log(`Start! express server on port 8080`);
});
