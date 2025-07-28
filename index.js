const http = require("http");
const request = require("axios");
const { createLocalStorage } = require("localstorage-ponyfill");
const localStorage = createLocalStorage();
let list = {};
//001: GETリクエスト
//002: Lua以外の場所からアクセス
//003: アクセス解析(認証前、011と参照)
//004: プログラム改竄
//005: 無効な認証用IDでのアクセス(ggsx)
//006: タイムアウト(ggsx)
//007: 情報欠陥による不正リクエスト(setup)
//008: タイムアウト(setup)
//009: executeでの不正リクエスト
//010: タイムアウト(execute)
//011: アクセス解析(認証後)

//ip解析　https://vpnapi.io/dashboard?verified=success
const server = http.createServer((req, res) => {
  res.setHeader("content-type", "text/plain; charset=utf-8");
  
  console.log(req.method);
  if (req.method != "POST") return res.end("アクセス権限がありません。");
  let json = "";
  req.on('data', (chunk) => {
    json += chunk;
  });
  
  req.on("end", async () => {
    // データ初期化
    if (json == "reset") {
      console.log("reset now");
      localStorage.clear();
      return res.end();
    }
    
    json = JSON.parse(json);
    let info = JSON.stringify(json);
    if (info.indexOf("axios") != -1) {
      console.log("維持リクエスト");
      return res.end();
    } else {
      info = info.replaceAll("{", "\n{\n").replaceAll("}", "\n}");
      info = info.replaceAll('":', '": ').replaceAll('",', '",\n');
      
      // Discordから速度制限を喰らったため廃止
      // request.post(process.env.webhook2, {
      //   content: `\`\`\`json\n${info}\`\`\``,
      // })
      // .catch(e => console.log(e));
      
    }
    if (json.type == "server keep") return res.end();

    console.log(json.type);
    if (json.type == "Access Filter: 003") {
      let ip = json.cont["x-forwarded-for"] || null;
      ip = ip ? ip.substring(0, ip.indexOf(",")) : null;
      if (ip) list[ip] = true;
      console.log("003", list[ip]);
    } else if (json.type == "Access Filter: 011") {
      let ip = json.cont["x-forwarded-for"] || null;
      ip = ip ? ip.substring(0, ip.indexOf(",")) : null;
      console.log("011", list[ip]);
      if (ip && list[ip]) {
        
        // Discordからアクセス制限を受けたため廃止
        // request.post(process.env.webhook6, {
        //   content: `> ✅　ID: ${json.id}, ${ip}`,
        // });
        
        let ipinfo = await request(`https://vpnapi.io/api/${ip}?key=${process.env.key}`).then((response) => response.data);
        if (!localStorage.getItem(json.id || "")) {
          /* 不定期にデータがクリアされるため廃止(実績報告)
          if (localStorage.length % 10 == 9) {
            request.post(process.env.notice, {
              content: `【New!】スクリプトx4.1の購入者が${localStorage.length + 1}人を突破しました!!🎊`,
            });
          }
          request.post(process.env.results, {
            content: `【New!】スクリプトx4.1の購入 No.${localStorage.length + 1}🎊`,
          });
          */
          localStorage.setItem(
            json.id,
            JSON.stringify({
              time: new Date().getTime(),
              city: [ipinfo.location.city],
            })
          );
          console.log(localStorage.getItem(json.id));
        }

        //二次配布検知システム
        let item = JSON.parse(localStorage.getItem(json.id));
        if (item && new Date().getTime() - item.time < 8.64e7) {
          if (!item.city.join().match(ipinfo.location.city)) {
            item.city.push(ipinfo.location.city);
            localStorage.setItem(
              json.id,
              JSON.stringify({ time: new Date().getTime(), city: item.city })
            );
            console.log(localStorage.getItem(json.id), 877);
          }
          if (item.city.length > 3 && json.id != "free2024p") {  // && json.id != "free2024"
            //localStorage.removeItem(json.id);
            request.post(process.env.webhook5, {
              content: (async() => {
                try {
                  const sha = await request.get(`https://api.github.com/repos/${process.env.owner}/${process.env.repo}/contents/ids/${json.id}?ref=main`, {
                      headers: {
                          Authorization: `token ${process.env.token}`
                      }
                  }).then((res) => res.data.sha);
                  await request.delete(`https://api.github.com/repos/${process.env.owner}/${process.env.repo}/contents/ids/${json.id}`, {
                    headers: {
                        Authorization: `token ${process.env.token}`
                    },
                    data: {
                        message: `${json.id} Delete!`,
                        sha: sha,
                        branch: "main"
                    }
                  });
                  return `@everyone **二次配布検知システム**によりIDが削除されました。\n対象ID: ${json.id}`;
                  
                } catch(e) {
                  console.log("失敗", e);
                  return `@everyone **二次配布検知システム**でエラーが発生しました！！\nサーバーの点検と対象IDの手動削除を至急行ってください。\n対象ID: ${json.id}`;
                }
              })(),
            });
            request.post(process.env.webhook5, {
              content: `@everyone **二次配布検知システム**によりIDが削除されました。\n対象ID: ${json.id}`,
            });
            
          }
        } else {
          localStorage.setItem(
            json.id,
            JSON.stringify({
              time: new Date().getTime(),
              city: [ipinfo.location.city],
            })
          );
        }
        delete list[ip];
      } else {
        ip = json.cont["x-forwarded-for"] || req.headers["x-forwarded-for"];
        ip = ip ? ip.substring(0, ip.indexOf(",")) : null;
        let ipinfo = ip? await request(`https://vpnapi.io/api/${ip}?key=${process.env.key}`).then((response) => response.data): null;
        let id = Math.floor(Math.random() * 2000);
        
        // Discordからアクセス制限を受けたため廃止
        // request.post(process.env.webhook6, {
        //   content: `> :x:　ID: ${json.id || "null"}`,
        // });
        // request.post(process.env.webhook2, {
        //   content: `アクセス情報 ACID: ${id}\`\`\`json\n${JSON.stringify(ipinfo)}\`\`\``,
        // });
        
      }
    } else {
      //ip情報取得
      let ip = json.cont["x-forwarded-for"] || req.headers["x-forwarded-for"];
      ip = ip ? ip.substring(0, ip.indexOf(",")) : null;
      let ipinfo = ip? await request(`https://vpnapi.io/api/${ip}?key=${process.env.key}`).then((response) => response.data): null;
      let id = Math.floor(Math.random() * 12000);
      
      // Discordからアクセス制限を受けたため廃止
      // request.post(process.env.webhook2, {
      //   content: `アクセス情報 ACID: ${id}\`\`\`json\n${JSON.stringify(ipinfo)}\`\`\``,
      // });
      
      console.log(ip, 999);

      if (!json.type) {
        request.post(process.env.webhook5, {
          content: `@everyone typeなしの無効リクエストを受信しました。\n# サーバーが特定された可能性があります。\n\nアクセス情報　ACID: ${id}\`\`\`json\nIP: ${ipinfo.ip}\nVPN: ${ipinfo.security.vpn}\nCity: ${ipinfo.location.country}, ${ipinfo.location.region}, ${ipinfo.location.city}\nLat, Long: ${ipinfo.location.latitude}, ${ipinfo.location.longitude}\`\`\`\nリクエストデータ\n\`\`\`json\n${JSON.stringify(json)}\`\`\``,
        });
      } else if (json.type == "Access Filter: 001" || json.type == "Access Filter: 002") {
        //準不正アクセス 廃止
        // request.post(process.env.webhook3, {
        //   content: `GETリクエスト又はブラウザからのアクセスを検知\nACID: ${id}\`\`\`json\nIP: ${ipinfo.ip}\nVPN: ${ipinfo.security.vpn}\nCity: ${ipinfo.location.country}, ${ipinfo.location.region}, ${ipinfo.location.city}\nLat, Long: ${ipinfo.location.latitude}, ${ipinfo.location.longitude}\`\`\``,
        // });
      } else {
        //不正アクセス
        //データ通信が不調子の時に開放する
        if (json.type.indexOf("004") != -1) {
          request.post(process.env.webhook4, {
            content: `【プログラム改竄】※誤検知の可能性　ID: ${json.id || "不明"}　ACID: ${id}`,
          });
          return res.end();
        }
        
        request.post(process.env.webhook4, {
          content: `@everyone セキュリティシステムの解析を検知\n# セキュリティを突破される危険があります。\n\n型式　ID: ${json.id || "不明"}\`\`\`json\n${json.type}\`\`\`\nアクセス情報　ACID: ${id}\`\`\`json\nIP: ${ipinfo.ip}\nVPN: ${ipinfo.security.vpn}\nCity: ${ipinfo.location.country}, ${ipinfo.location.region}, ${ipinfo.location.city}\nLat, Long: ${ipinfo.location.latitude}, ${ipinfo.location.longitude}\`\`\``,
        });
      }
    }
  });
  res.end();
});

//request.post("https://discord.com/api/webhooks/1148551365275168828/txLqxDH_evcaHW_9LTnnZtXh816oUHbAEN4uQrNe8UwWqEvFMYFl6fHV3De2w4KBvq9j", {content: `aaa`});

//localStorage.clear();
console.log("起動しました。 " + JSON.stringify(localStorage.getItem("Gokutsuchi0203")));
server.listen(process.env.PORT || 3000);
