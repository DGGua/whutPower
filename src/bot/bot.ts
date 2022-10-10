import { WebSocket } from "ws";
import config from "../config.json";
const { wsUrl, masterqq } = config;
const socket = new WebSocket(wsUrl);
socket.once("open", () =>
  socket.send(
    JSON.stringify({
      event: "sendPrivateMsg",
      data: {
        userId: masterqq.toString(),
        message: "电费 online",
      },
    })
  )
);
export default socket;
