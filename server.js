import express from "express";
import * as http from "http";
import { Server } from "socket.io";
import { BattleScene } from "./game/BattleScene.js";
import { hashRoomId } from "./Utils/RoomUitls.js";

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

  socket.on("join", (obj) => {
    const hRoomId = hashRoomId(obj.roomId);

    socket.join(hRoomId);

    if (hRoomId in battleScenes) {
      battleScenes[hRoomId].registerPlayer(socket.id, JSON.parse(obj.player));
      // 배틀 시작
      if (io.sockets.adapter.rooms.get(hRoomId).size === 2) {
        battleScenes[hRoomId].startBattle();
      }
    } else {
      battleScenes[hRoomId] = new BattleScene(hRoomId);
      battleScenes[hRoomId].registerPlayer(socket.id, JSON.parse(obj.player));
    }
  });

  // socket.on("create", (obj) => {});

  socket.on("skill", (obj) => {
    battleScenes[hashRoomId(obj.roomId)].receiveSkillSelection(
      socket.id,
      obj.skillIndex
    );
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}  ${--connectCount}`);

    // TODO: delete battleScene and levae room
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

// 80 포트로 서버 오픈
server.listen(80, function () {
  console.log(`Start! express server on port 80`);
});

function gameOver(roomId) {
  io.to(roomId).emit("gameover");
}

function responsePokHp(roomId, resultObj) {
  io.to(roomId).emit("battle_result", JSON.parse(JSON.stringify(resultObj)));
}

export { gameOver, responsePokHp };
