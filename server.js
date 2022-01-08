import express from "express";
import * as http from "http";
import { Server } from "socket.io";
import { BattleScene } from "./game/BattleScene.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

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
var battleScenes = {};
io.on("connection", (socket) => {
  console.log(`Socket connected ${socket.id}  ${++connectCount}`);

  socket.on("room", (obj) => {
    socket.join(obj.roomId);

    // TODO: obj.roomId --hash--> id 만들기 (단어 등 중복 피하기 위해)
    if (obj.roomId in battleScenes) {
      battleScenes[obj.roomId].registerPlayer(socket.id, obj.player);
      // 배틀 시작
      if (io.sockets.adapter.rooms.get(obj.roomId).size === 2) {
        battleScenes[obj.roomId].startBattle();
      }
    } else {
      battleScenes[obj.roomId] = new BattleScene();
      battleScenes[obj.roomId].registerPlayer(socket.id, obj.player);
    }
  });

  socket.on("skill", (obj) => {
    battleScenes[obj.roomId].receiveSkillSelection(socket.id, obj.skill);
  });

  socket.on("attack", (obj) => {
    io.to(obj.roomId).emit("transferAttack", obj);
    obj.damage = obj.damage + Math.random() * 3;
    console.log(`[${obj.socketId}] attack ${obj.damage}`);
    // socket.to("some room").emit("some evet");
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}  ${--connectCount}`);

    // TODO: delete battleScene
  });
});

io.of("/").adapter.on("create-room", (room) => {
  console.log(`room ${room} was created`);
});
io.of("/").adapter.on("join-room", (room, id) => {
  console.log(`socket ${id} has joined room ${room}`);
});
/*io.of("/").adapter.on("leave-room", (room, id) => {
});*/

// 8080 포트로 서버 오픈
server.listen(8080, function () {
  console.log(`Start! express server on port 8080`);
});
