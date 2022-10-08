import request = require("request");
import * as Jimp from "jimp";
import { charDistinguish } from "./numberIdentify";
import FormData = require("form-data");
import "fs";
import { writeFileSync } from "fs";
import { WebSocket } from "ws";
import * as config from "./config.json";
import { Dayjs } from "dayjs";
const axios = require("axios");
const { wsUrl, whutAuth, masterqq, selfqq, meterId } = config;
const { nickName, password } = whutAuth;
let cookie = "";
let list = {};

async function req(countdown: number = 10) {
  if (countdown <= 0) return Promise.reject("请求失败，请重试");
  return new Promise<Buffer>((resolve, reject) => {
    console.log("hi");
    request("http://cwsf.whut.edu.cn/authImage")
      .on("response", (resp) => {
        console.log(resp.headers["set-cookie"]);
        cookie = resp.headers["set-cookie"].toString().split(";")[0];
        console.log(cookie);
      })
      .on("data", (data) => {
        if (data.toString("hex").endsWith("ffd9")) {
          resolve(Buffer.from(data));
        } else {
          console.log("fail   ");
          req(countdown - 1)
            .then((data) => resolve(data))
            .catch((reason) => reject(reason));
        }
      });
  });
}
async function getCode() {
  const image = await Jimp.read(await req());
  image.grayscale(); // 灰度
  let ans = "";
  [8, 23, 38, 53].forEach((left) => {
    const imagec = image.clone();
    ans += charDistinguish(imagec.crop(left, 3, 9, 12));
  });
  console.log(ans);
  return ans;
}

async function login(code: string) {
  const form = new FormData();
  form.append("logintype", "PLATFORM");
  form.append("nickName", nickName);
  form.append("password", password);
  form.append("checkCode", code);
  await axios.post("http://cwsf.whut.edu.cn/innerUserLogin", form, {
    headers: { Cookie: cookie },
  });
}

async function getPower() {
  const form = new FormData();
  form.append("meterId", meterId);
  form.append("factorycode", "E035");
  const { data } = await axios.post(
    "http://cwsf.whut.edu.cn/queryReserve",
    form,
    {
      headers: { Cookie: cookie },
    }
  );
  return data;
}

const arr: Array<{ url: string; data: FormData; res: (value: any) => void }> =
  [];

async function reduce() {
  if (arr.length > 0) {
    const { url, data, res } = arr.pop();
    res(
      await axios.post(url, data, {
        headers: { Cookie: cookie },
      })
    );
  }
  setTimeout(reduce, 50);
}

async function gendata() {
  reduce();
  function axiospost(url: string, data: FormData) {
    return new Promise<any>((resolve) => {
      arr.push({ url, data, res: resolve });
    });
  }
  let powerInfo: Record<string, any> = {};
  const form = new FormData();

  form.append("factorycode", "E035");
  const { data } = await axiospost("http://cwsf.whut.edu.cn/getAreaInfo", form);
  for (const str of (data.areaList as string[]).slice(0, 4)) {
    const [ariaid, ariaName] = str.split("@");
    let ariaInfo: { code: string; builds: Record<string, any> } = {
      code: ariaid,
      builds: {},
    };

    const form = new FormData();
    form.append("factorycode", "E035");
    form.append("areaid", ariaid);
    const { data } = await axiospost(
      "http://cwsf.whut.edu.cn/queryBuildList",
      form
    );
    for (const str of data.buildList as string[]) {
      const [buildid, buildName] = str.split("@");
      let buildInfo: { code: string; floors: Record<number, any> } = {
        code: buildid,
        floors: {},
      };
      const form = new FormData();
      form.append("factorycode", "E035");
      form.append("areaid", ariaid);

      form.append("buildid", buildid);
      const { data } = await axiospost(
        "http://cwsf.whut.edu.cn/queryFloorList",
        form
      );
      for (const num of data.floorList as number[]) {
        let floorInfo: { code: number; rooms: Record<string, any> } = {
          code: num,
          rooms: {},
        };
        const form = new FormData();
        form.append("factorycode", "E035");
        form.append("buildid", buildid);
        form.append("floorid", num);
        const { data } = await axiospost(
          "http://cwsf.whut.edu.cn/getRoomInfo",
          form
        );
        for (const str of data.roomList as string[]) {
          const [roomId, des] = str.split("@");
          const form = new FormData();
          form.append("factorycode", "E035");
          form.append("roomid", roomId);
          const { data } = await axiospost(
            "http://cwsf.whut.edu.cn/queryRoomElec",
            form
          );
          floorInfo.rooms[des] = { roomId, meter: data.meterId };
        }
        buildInfo.floors[num] = floorInfo;
        console.log(floorInfo);
      }
      console.log(buildInfo);
      ariaInfo.builds[buildName] = buildInfo;
    }
    console.log(ariaInfo);
    powerInfo[ariaName] = ariaInfo;
  }
  console.log(powerInfo);
  writeFileSync("buf.json", JSON.stringify(powerInfo));
}
async function run() {
  const code = await getCode();
  await login(code);
  //   await gendata();
  return await getPower();
}
// run();
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
socket.on("message", (message) => {
  const obj = JSON.parse(message.toString());
  const { event, data } = obj;
  console.log(data);
  if (event === "message.private") {
    const { user_id, raw_message } = data;
    if (user_id == masterqq && raw_message == "电费") {
      const time = new Dayjs();
      if (
        (time.hour() == 23 && time.minute() > 20) ||
        (time.hour() == 0 && time.minute() < 10)
      ) {
        socket.send(
          JSON.stringify({
            event: "sendGroupMsg",
            data: {
              userId: user_id,
              message: `系统开放时间早00:10到23:20`,
            },
          })
        );
      } else {
        run()
          .then((data) => {
            const { remainPower, meterOverdue } = data;
            socket.send(
              JSON.stringify({
                event: "sendPrivateMsg",
                data: {
                  userId: masterqq,
                  message: `还有${remainPower}度，${meterOverdue}元`,
                },
              })
            );
          })
          .catch((e) => {
            socket.send(
              JSON.stringify({
                event: "sendPrivateMsg",
                data: {
                  userId: masterqq,
                  message: e,
                },
              })
            );
          });
      }
    }
  }
  if (event === "message.group") {
    const { group_id, message } = data;
    if (
      message.length > 1 &&
      message[0].type === "at" &&
      message[0].qq === selfqq &&
      message[1].type === "text" &&
      message[1].text.trim() === "电费"
    ) {
      const time = new Dayjs();
      if (
        (time.hour() == 23 && time.minute() > 20) ||
        (time.hour() == 0 && time.minute() < 10)
      ) {
        socket.send(
          JSON.stringify({
            event: "sendGroupMsg",
            data: {
              groupId: group_id,
              message: `系统开放时间早00:10到23:20`,
            },
          })
        );
      } else {
        run()
          .then((data) => {
            const { remainPower, meterOverdue } = data;
            socket.send(
              JSON.stringify({
                event: "sendGroupMsg",
                data: {
                  groupId: group_id,
                  message: `还有${remainPower}度，${meterOverdue}元`,
                },
              })
            );
          })
          .catch((e) => {
            socket.send(
              JSON.stringify({
                event: "sendGroupMsg",
                data: {
                  groupId: group_id,
                  message: e.toString(),
                },
              })
            );
          });
      }
    }
  }
});
