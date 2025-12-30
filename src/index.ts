// src/index.ts
import { Client, Events, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";

// .env 파일에서 환경 변수를 로드합니다.
dotenv.config();

const token = process.env.DISCORD_TOKEN;

// 토큰이 설정되지 않았으면 오류를 출력하고 종료합니다.
if (!token) {
  console.error(
    "오류: DISCORD_TOKEN이 .env 파일에 설정되어 있지 않습니다. .env 파일을 확인해주세요."
  );
  process.exit(1);
}

// 새로운 디스코드 클라이언트 인스턴스를 생성합니다.
// 인텐트(Intents)는 봇이 어떤 종류의 이벤트에 접근할 수 있는지를 명시합니다.
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, // 서버 관련 이벤트 (봇 추가/제거, 서버 정보 변경 등)
    GatewayIntentBits.GuildMessages, // 서버 내 메시지 생성/수정/삭제 이벤트
    GatewayIntentBits.MessageContent, // 메시지의 내용을 읽기 위한 권한 (중요! Discord Developer Portal에서 활성화 필요)
  ],
});

// 클라이언트(봇)가 준비되었을 때 한 번 실행되는 이벤트 리스너입니다.
// readyClient는 로그인된 클라이언트, 즉 우리 봇 자신을 가리킵니다.
client.once(Events.ClientReady, (readyClient) => {
  console.log(`로그인 성공! ${readyClient.user.tag} (으)로 접속 완료!`);
  console.log("봇이 준비되었습니다. 달려봅시다!");
  // 봇의 활동 상태를 설정합니다. 예: "메시지 기다리는 중" (WATCHING)
  // type: 0 (Playing), 1 (Streaming), 2 (Listening), 3 (Watching), 5 (Competing)
  readyClient.user.setActivity("메시지 기다리는 중", {
    type: 3 /* Watching */,
  });
});

// 서버에서 메시지가 생성될 때마다 실행되는 이벤트 리스너입니다.
client.on(Events.MessageCreate, async (message) => {
  // 메시지를 보낸 이가 봇이라면 아무 작업도 하지 않고 반환합니다 (무한 루프 방지).
  if (message.author.bot) return;

  // 사용자가 "핑" 이라고 메시지를 보내면 "퐁!" 이라고 답장합니다.
  if (message.content === "핑") {
    message.reply("퐁!!");
  }

  // 사용자가 "안녕" 이라고 메시지를 보내면, 해당 유저를 언급하며 인사합니다.
  // toLowerCase()를 사용하여 대소문자 구분 없이 처리합니다.
  if (message.content.toLowerCase() === "안녕") {
    message.channel.send(
      `안녕하세요, ${message.author.toString()}님! 반가워요.`
    );
  }
});

// .env 파일에서 가져온 토큰을 사용하여 Discord에 로그인합니다.
client
  .login(token)
  .then(() => {
    console.log("봇이 Discord에 성공적으로 연결되었습니다.");
  })
  .catch((error) => {
    console.error("봇 로그인 중 오류 발생:", error);
  });
