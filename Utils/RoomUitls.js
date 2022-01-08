import { createHash } from 'crypto';

function hashRoomId(roomId) {
    let shasum = createHash('sha1');
    shasum.update(toString(roomId));
    shasum.digest('hex');
}

export { hashRoomId };