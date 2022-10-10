import request = require("request");
import * as Jimp from "jimp";
import { charDistinguish } from "./numberIdentify";
import FormData = require("form-data");
import "fs";
import * as config from "./config.json";
import dayjs from "dayjs";
import bot from "./bot/bot";
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
async function run() {
  const code = await getCode();
  await login(code);
  //   await gendata();
  return await getPower();
}
// run();

async function requestAnswer(retType: "private" | "group", retId: number) {
  function sendMessage(msg: string) {
    bot.send(
      JSON.stringify({
        event: retType == "group" ? "sendGroupMsg" : "sendPrivateMsg",
        data: {
          // TODO: 耦合
          userId: retId,
          groupId: retId,
          message: msg,
        },
      })
    );
  }
  // jwc 下班时间
  const time = dayjs();
  if (
    (time.hour() == 23 && time.minute() > 20) ||
    (time.hour() == 0 && time.minute() < 10)
  ) {
    sendMessage(`系统开放时间早00:10到23:20`);
  } else {
    run()
      .then((data) => {
        const { remainPower, meterOverdue } = data;
        sendMessage(`还有${remainPower}度，${meterOverdue}元`);
      })
      .catch((e) => {
        sendMessage(e.toString());
      });
  }
}

bot.on("message", (message) => {
  const obj = JSON.parse(message.toString());
  const { event, data } = obj;
  if (event === "message.private") {
    const { user_id, raw_message } = data;
    if (user_id == masterqq && raw_message == "电费") {
      requestAnswer("private", user_id);
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
      requestAnswer("group", group_id);
    }
  }
});
