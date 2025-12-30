// src/index.ts
import {
  Client,
  Events,
  GatewayIntentBits,
  ChannelType,
  TextChannel,
} from "discord.js";
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

// 사용자별 스터디 시작 시간을 저장할 Map
const studyTimers = new Map<string, Date>();

// 새로운 디스코드 클라이언트 인스턴스를 생성합니다.
// 인텐트(Intents)는 봇이 어떤 종류의 이벤트에 접근할 수 있는지를 명시합니다.
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, // 서버 관련 이벤트 (봇 추가/제거, 서버 정보 변경 등)
    GatewayIntentBits.GuildMessages, // 서버 내 메시지 생성/수정/삭제 이벤트
    GatewayIntentBits.MessageContent, // 메시지의 내용을 읽기 위한 권한 (중요! Discord Developer Portal에서 활성화 필요)
    GatewayIntentBits.GuildVoiceStates, // 음성 채널 관련 이벤트 감지를 위한 인텐트 추가
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

// 음성 채널 상태 변경 이벤트를 감지합니다.
client.on(Events.VoiceStateUpdate, (oldState, newState) => {
  const user = newState.member?.user;
  if (!user || user.bot) return; // 봇의 이벤트는 무시

  const oldChannel = oldState.channel;
  const newChannel = newState.channel;
  const guild = newState.guild;
  const studyRoomName = "스터디룸";
  const logChannelName = "스터디-기록";

  const logChannel = guild.channels.cache.find(
    (channel) =>
      channel.name === logChannelName && channel.type === ChannelType.GuildText
  ) as TextChannel;
  if (!logChannel) return; // 로그 채널이 없으면 아무것도 하지 않음

  // 사용자가 '스터디룸'에 들어왔을 때
  if (
    newChannel?.name === studyRoomName &&
    oldChannel?.name !== studyRoomName
  ) {
    studyTimers.set(user.id, new Date());
    logChannel.send(`${user.toString()}님이 스터디룸에 입장했습니다!`);
  }
  // 사용자가 '스터디룸'에서 나갔을 때
  else if (
    oldChannel?.name === studyRoomName &&
    newChannel?.name !== studyRoomName
  ) {
    const startTime = studyTimers.get(user.id);
    if (startTime) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime(); // 밀리초 단위
      const hours = Math.floor(duration / 3600000);
      const minutes = Math.floor((duration % 3600000) / 60000);
      const seconds = Math.floor((duration % 60000) / 1000);

      const today = new Date();
      const dateString = `${today.getFullYear()}.${
        today.getMonth() + 1
      }.${today.getDate()}`;
      const startTimeString = startTime.toTimeString().slice(0, 5);
      const endTimeString = endTime.toTimeString().slice(0, 5);

      logChannel.send(
        `[${dateString}] ${user.toString()}님이 ${hours}시간 ${minutes}분 ${seconds}초 동안 공부했습니다. (${startTimeString}~${endTimeString})`
      );
      studyTimers.delete(user.id);
    }
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
