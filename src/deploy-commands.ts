import { REST, Routes } from "discord.js";
import dotenv from "dotenv";
import { commands } from "./commands"; // 우리가 정의한 명령어 모듈들

// .env 파일의 환경 변수를 로드합니다.
dotenv.config();

// 환경 변수에서 값을 가져옵니다.
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;

// 필수 환경 변수가 없을 경우 에러를 발생시킵니다.
if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID || !DISCORD_GUILD_ID) {
  console.error(
    "오류: .env 파일에 필요한 환경 변수(TOKEN, CLIENT_ID, GUILD_ID)가 누락되었습니다."
  );
  process.exit(1);
}

// 등록할 명령어들의 data 속성만 추출합니다.
const commandsData = Object.values(commands).map((command) =>
  command.data.toJSON()
);

const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

export async function deployCommands({ guildId }: { guildId: string }) {
  try {
    console.log(
      `Started refreshing application (/) commands for guild: ${guildId}`
    );

    // 특정 서버에 명령어를 등록합니다.
    // 모든 서버에 등록하려면 Routes.applicationCommands(config.DISCORD_CLIENT_ID)를 사용합니다.
    await rest.put(
      Routes.applicationGuildCommands(DISCORD_CLIENT_ID!, guildId),
      {
        body: commandsData,
      }
    );

    console.log(
      `Successfully reloaded application (/) commands for guild: ${guildId}`
    );
  } catch (error) {
    console.error(error);
  }
}

// 배포 실행
deployCommands({ guildId: DISCORD_GUILD_ID });
