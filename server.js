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

  socket.on("room", (obj) => {
    const hRoomId = hashRoomId(obj.roomId);

    // leave all current room before join new room
    var rooms = io.sockets.adapter.sids[socket.id];
    for (var room in rooms) {
      socket.leave(room);
    }
    socket.join(hRoomId);

    if (hRoomId in battleScenes) {
      let CONTINUE = true;
      try {
        battleScenes[hRoomId].registerPlayer(socket.id, obj.player);
      } catch (e) {
        console.error("Register player failed");
        CONTINUE = false;
        clearRoom(hRoomId);
      }

      if (CONTINUE) {
        // 배틀 시작
        if (io.sockets.adapter.rooms.get(hRoomId).size === 2) {
          // Notify to clients that battle started
          try {
            let startObj = battleScenes[hRoomId].startBattle();
            io.to(hRoomId).emit("battle_start", JSON.stringify(startObj));
          } catch (e) {
            console.error("Start battle failed");
          }
        }
      } else {
        try {
          battleScenes[hRoomId] = new BattleScene(hRoomId);
          battleScenes[hRoomId].registerPlayer(socket.id, obj.player);
        } catch (e) {
          console.error("Register player failed");
        }
      }
    }
  });

  // socket.on("create", (obj) => {});

  socket.on("skill", (obj) => {
    try {
      battleScenes[hashRoomId(obj.roomId)].receiveSkillSelection(
        socket.id,
        obj.skillIndex
      );
    } catch (e) {
      console.error("Receive skill selection failed");
    }
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
/*io.of("/").adapter.on("leave-room", (room, id) => {
});*/

// 80 포트로 서버 오픈
server.listen(80, function () {
  console.log(`Start! express server on port 80`);
});

function clearRoom(roomId) {
  io.sockets.clients(roomId).forEach(function (s) {
    s.leave(roomId);
  });
  if (roomId in battleScenes) {
    delete battleScenes[roomId];
  }
}

function emitBattleEnd(roomId, state) {
  io.to(roomId).emit("battle_end", JSON.stringify(state));
  clearRoom(roomId);
}

function emitBattleResult(roomId, resultObj) {
  io.to(roomId).emit("battle_result", JSON.stringify(resultObj));
}

export { emitBattleEnd, emitBattleResult };
