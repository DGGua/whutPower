import request = require("request");
import * as Jimp from "jimp";
import { charDistinguish } from "./numberIdentify";
import axios from "axios";
import FormData = require("form-data");
import "fs";
import { writeFileSync } from "fs";
const nickName = "";
const password = "";
let cookie = "";
let list = {};
async function req() {
  return new Promise<Buffer>((res) => {
    request("http://cwsf.whut.edu.cn/authImage")
      .on("response", (resp) => {
        console.log(resp.headers["set-cookie"]);
        cookie = resp.headers["set-cookie"].toString().split(";")[0];
        console.log(cookie);
      })
      .on("data", (data) => {
        res(Buffer.from(data));
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
  form.append("meterId", "0311.008847.1");
  form.append("factorycode", "E035");
  axios
    .post("http://cwsf.whut.edu.cn/queryReserve", form, {
      headers: { Cookie: cookie },
    })
    .then((val) => console.log(val.data));
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
  setTimeout(reduce, 100);
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
  await gendata();
  await getPower();
}

run();
