import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { studyTimers } from "../index";

/**
 * 명령어의 기본 정보를 정의합니다.
 */
export const data = new SlashCommandBuilder()
  .setName("record") // 슬래시 명령어 이름
  .setDescription("현재 공부 중인 사람들의 목록과 시간을 보여줍니다."); // 명령어에 대한 설명

/**
 * 명령어가 실행될 때 호출될 함수입니다.
 * @param interaction 상호작용 객체
 */
export async function execute(interaction: ChatInputCommandInteraction) {
  // studyTimers가 비어 있는지 확인합니다.
  if (studyTimers.size === 0) {
    await interaction.reply({
      content: "현재 스터디룸에서 공부 중인 사람이 없습니다.",
      ephemeral: true, // 이 메시지는 명령어 사용자에게만 보입니다.
    });
    return;
  }

  // 임베드를 생성합니다.
  const embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle("현재 공부 중인 멤버")
    .setTimestamp();

  const now = new Date();
  let description = "이름\t\t공부 시간\n";
  description += "-------------------------------------\n";

  // studyTimers에 있는 각 사용자에 대해 정보를 추가합니다.
  for (const [userId, startTime] of studyTimers.entries()) {
    try {
      // 서버(guild)에서 사용자 정보를 가져옵니다.
      const member = await interaction.guild?.members.fetch(userId);
      const userName = member ? member.displayName : "알 수 없는 유저";

      // 경과 시간을 계산합니다.
      const duration = now.getTime() - startTime.getTime();
      const hours = Math.floor(duration / 3600000)
        .toString()
        .padStart(2, "0");
      const minutes = Math.floor((duration % 3600000) / 60000)
        .toString()
        .padStart(2, "0");
      const seconds = Math.floor((duration % 60000) / 1000)
        .toString()
        .padStart(2, "0");

      // 임베드 필드에 사용자 정보를 추가합니다.
      embed.addFields({
        name: userName,
        value: `\`${hours}:${minutes}:${seconds}\``,
        inline: true,
      });
    } catch (error) {
      console.error(`사용자 ID ${userId}를 가져오는 데 실패했습니다:`, error);
      // 특정 사용자를 가져오는 데 실패하더라도 계속 진행합니다.
    }
  }

  // 필드가 하나라도 추가되었다면 임베드를 전송하고, 그렇지 않다면 오류 메시지를 보냅니다.
  if (embed.data.fields && embed.data.fields.length > 0) {
    await interaction.reply({ embeds: [embed] });
  } else {
    // 만약 루프에서 사용자를 한 명도 추가하지 못했다면(예: 모두 서버를 나간 경우)
    await interaction.reply({
      content: "현재 스터디 참여 인원의 정보를 가져올 수 없습니다.",
      ephemeral: true,
    });
  }
}
