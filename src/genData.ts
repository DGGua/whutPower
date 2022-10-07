// 吃灰
// const arr: Array<{ url: string; data: FormData; res: (value: any) => void }> =
//   [];

// async function reduce() {
//   if (arr.length > 0) {
//     const { url, data, res } = arr.pop();
//     res(
//       await axios.post(url, data, {
//         headers: { Cookie: cookie },
//       })
//     );
//   }
//   setTimeout(reduce, 200);
// }

// async function gendata() {
//     reduce();
//     function axiospost(url: string, data: FormData) {
//       return new Promise<any>((resolve) => {
//         arr.push({ url, data, res: resolve });
//       });
//     }
//     let powerInfo: Record<string, any> = {};
//     const form = new FormData();

//     form.append("factorycode", "E035");
//     const { data } = await axiospost("http://cwsf.whut.edu.cn/getAreaInfo", form);
//     for (const str of (data.areaList as string[]).slice(0, 4)) {
//       let ariaInfo: { code: string; builds: Record<string, any> } = {
//         code: str,
//         builds: {},
//       };
//       const [ariaid, ariaName] = str.split("@");
//       const form = new FormData();
//       form.append("factorycode", "E035");
//       form.append("areaid", ariaid);
//       const { data } = await axiospost(
//         "http://cwsf.whut.edu.cn/queryBuildList",
//         form
//       );
//       for (const str of data.buildList as string[]) {
//         let buildInfo: { code: string; floors: Record<number, any> } = {
//           code: str,
//           floors: {},
//         };
//         const [buildid, buildName] = str.split("@");
//         const form = new FormData();
//         form.append("factorycode", "E035");
//         form.append("areaid", ariaid);

//         form.append("buildid", buildid);
//         const { data } = await axiospost(
//           "http://cwsf.whut.edu.cn/queryFloorList",
//           form
//         );
//         for (const num of data.floorList as number[]) {
//           let floorInfo: { code: number; rooms: Record<string, string> } = {
//             code: num,
//             rooms: {},
//           };
//           const form = new FormData();
//           form.append("factorycode", "E035");
//           form.append("buildid", buildid);
//           form.append("floorid", num);
//           const { data } = await axiospost(
//             "http://cwsf.whut.edu.cn/getRoomInfo",
//             form
//           );
//           (data.roomList as string[]).forEach((str) => {
//             const [roomId, des] = str.split("@");
//             floorInfo.rooms[des] = roomId;
//           });
//           buildInfo.floors[num] = floorInfo;
//           console.log(floorInfo);
//         }
//         console.log(buildInfo);
//         ariaInfo.builds[buildName] = buildInfo;
//       }
//       console.log(ariaInfo);
//       powerInfo[ariaName] = ariaInfo;
//     }
//     console.log(powerInfo);
//     writeFileSync("buf.json", JSON.stringify(powerInfo));
//   }
