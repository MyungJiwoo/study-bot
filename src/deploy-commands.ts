import { REST, Routes } from "discord.js";
import config from "./config.json";
import { commands } from "./commands"; // 우리가 정의한 명령어 모듈들

// 등록할 명령어들의 data 속성만 추출합니다.
const commandsData = Object.values(commands).map((command) =>
  command.data.toJSON()
);

const rest = new REST({ version: "10" }).setToken(config.DISCORD_TOKEN);

export async function deployCommands({ guildId }: { guildId: string }) {
  try {
    console.log(
      `Started refreshing application (/) commands for guild: ${guildId}`
    );

    // 특정 서버에 명령어를 등록합니다.
    // 모든 서버에 등록하려면 Routes.applicationCommands(config.DISCORD_CLIENT_ID)를 사용합니다.
    await rest.put(
      Routes.applicationGuildCommands(config.DISCORD_CLIENT_ID, guildId),
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
deployCommands({ guildId: config.DISCORD_GUILD_ID });
