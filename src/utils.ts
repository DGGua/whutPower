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
//       const [ariaid, ariaName] = str.split("@");
//       let ariaInfo: { code: string; builds: Record<string, any> } = {
//         code: ariaid,
//         builds: {},
//       };
  
//       const form = new FormData();
//       form.append("factorycode", "E035");
//       form.append("areaid", ariaid);
//       const { data } = await axiospost(
//         "http://cwsf.whut.edu.cn/queryBuildList",
//         form
//       );
//       for (const str of data.buildList as string[]) {
//         const [buildid, buildName] = str.split("@");
//         let buildInfo: { code: string; floors: Record<number, any> } = {
//           code: buildid,
//           floors: {},
//         };
//         const form = new FormData();
//         form.append("factorycode", "E035");
//         form.append("areaid", ariaid);
  
//         form.append("buildid", buildid);
//         const { data } = await axiospost(
//           "http://cwsf.whut.edu.cn/queryFloorList",
//           form
//         );
//         for (const num of data.floorList as number[]) {
//           let floorInfo: { code: number; rooms: Record<string, any> } = {
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
//           for (const str of data.roomList as string[]) {
//             const [roomId, des] = str.split("@");
//             const form = new FormData();
//             form.append("factorycode", "E035");
//             form.append("roomid", roomId);
//             const { data } = await axiospost(
//               "http://cwsf.whut.edu.cn/queryRoomElec",
//               form
//             );
//             floorInfo.rooms[des] = { roomId, meter: data.meterId };
//           }
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