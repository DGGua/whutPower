import { WebSocket } from "ws";
import { config } from "../config";
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
socket.once("error", (e) => console.log(e));
export default socket;
