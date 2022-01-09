import { createHash } from "crypto";

function hashRoomId(roomId) {
  return createHash("sha1").update(roomId).digest("hex");
}

export { hashRoomId };
