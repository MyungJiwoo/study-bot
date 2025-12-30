import { commands } from "./commands/index";
// src/index.ts
import {
  Client,
  Events,
  GatewayIntentBits,
  ChannelType,
  TextChannel,
  EmbedBuilder,
} from "discord.js";
import dotenv from "dotenv";
import { startScheduledJobs } from "./scheduler";
import http from "http";

/**
 * 봇이 잠들지 않도록 자기 자신에게 신호를 보내는 함수
 */
function keepAlive() {
  const url = process.env.KOYEB_URL; // Koyeb에서 제공하는 앱의 URL

  if (!url) {
    console.warn("KOYEB_URL이 설정되지 않아 Self-Ping을 시작할 수 없습니다.");
    return;
  }

  // 3분(180,000ms)마다 실행
  setInterval(() => {
    http
      .get(url, (res) => {
        console.log(`Self-ping 보냄: 상태 코드 ${res.statusCode}`);
      })
      .on("error", (err) => {
        console.error(`Self-ping 에러: ${err.message}`);
      });
  }, 180000);
}

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
  console.log("봇이 준비되었습니다. 달려봅시다!==");

  // 스케줄러 시작
  startScheduledJobs(client);
  startHealthCheckServer(); // Health Check 서버
  keepAlive(); // Self-Ping 시작

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
    // logChannel.send(`${user.toString()}님이 스터디룸에 입장했습니다!`);

    const enterEmbed = new EmbedBuilder()
      .setTitle("✏️ 스터디 시작")
      .setDescription(`${user.toString()}님이 스터디룸에 입장했습니다!`)
      .setColor(0x00ff00) // 초록색
      .setTimestamp();

    logChannel.send({ embeds: [enterEmbed] });
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

      // logChannel.send(
      //   `[${dateString}] ${user.toString()}님이 ${hours}시간 ${minutes}분 ${seconds}초 동안 공부했습니다. (${startTimeString}~${endTimeString})`
      // );
      const exitEmbed = new EmbedBuilder()
        .setTitle("🚀 스터디 종료")
        .setThumbnail(user.displayAvatarURL()) // 유저 프로필 사진 추가
        .addFields(
          {
            name: "📚 공부 시간",
            value: `${hours}시간 ${minutes}분 ${seconds}초`,
            inline: false,
          },
          {
            name: "⏰ 진행 시간",
            value: `${dateString} \`${startTimeString}\` ~ \`${endTimeString}\``,
            inline: true,
          }
        )
        .setColor(0x3498db) // 파란색
        .setFooter({
          text: `${user.username}님의 기록`,
          iconURL: user.displayAvatarURL(),
        })
        .setTimestamp();

      logChannel.send({ embeds: [exitEmbed] });

      studyTimers.delete(user.id);
    }
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    // 슬래시 커맨드인지 확인합니다.
    if (!interaction.isChatInputCommand()) return;

    // commands 객체에서 명령어 이름으로 해당 명령어 모듈을 가져옵니다.
    const command = commands[interaction.commandName as keyof typeof commands];

    // 명령어가 존재하지 않으면 아무것도 하지 않습니다.
    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`
      );
      return;
    }

    // 명령어의 execute 함수를 실행합니다.
    await command.execute(interaction);
  } catch (error) {
    console.error("Error handling interaction:", error);
    // 사용자에게 오류 메시지를 보낼 수도 있습니다.
    if (interaction.isRepliable()) {
      await interaction.reply({
        content: "명령어 실행 중 오류가 발생했습니다.",
        ephemeral: true,
      });
    }
  }
});

/**
 * Koyeb Health Check를 위한 간단한 웹 서버
 */
export function startHealthCheckServer() {
  const port = 8080; // Koyeb 설정에서 지정할 포트 번호

  http
    .createServer((req, res) => {
      // 어떤 경로로 들어오든 200 OK를 반환하여 봇이 살아있음을 알림
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.write("OK");
      res.end();
    })
    .listen(port, "0.0.0.0", () => {
      console.log(`Health Check 서버가 포트 ${port}에서 작동 중입니다.`);
    });
}

// .env 파일에서 가져온 토큰을 사용하여 Discord에 로그인합니다.
client
  .login(token)
  .then(() => {
    console.log("봇이 Discord에 성공적으로 연결되었습니다.");
  })
  .catch((error) => {
    console.error("봇 로그인 중 오류 발생:", error);
  });
