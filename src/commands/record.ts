import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
// dailyCumulativeTime도 같이 가져옵니다.
import { studyTimers, dailyCumulativeTime } from "../index";

export const data = new SlashCommandBuilder()
  .setName("record")
  .setDescription("오늘 사용자별 총 공부 시간을 보여줍니다.");

export async function execute(interaction: ChatInputCommandInteraction) {
  // 오늘 기록이 있는 모든 사용자 ID 추출 (현재 공부 중 + 이미 끝낸 사람)
  const allUserIds = new Set([
    ...Array.from(studyTimers.keys()),
    ...Array.from(dailyCumulativeTime.keys()),
  ]);

  if (allUserIds.size === 0) {
    await interaction.reply({
      content: "오늘 공부 기록이 있는 멤버가 없습니다.",
      ephemeral: true,
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0xffff33)
    .setTitle("오늘의 스터디 기록 (누적)")
    .setTimestamp();

  const now = new Date();
  let serverTotalDuration = 0;

  const promises = Array.from(allUserIds).map(async (userId) => {
    try {
      const member = await interaction.guild?.members.fetch(userId);
      if (member?.user.bot) return null; // 봇 제외

      const userName = member ? member.displayName : "알 수 없는 유저";

      // 1. 이미 끝낸 누적 시간 가져오기
      let userTotal = dailyCumulativeTime.get(userId) || 0;

      // 2. 만약 지금 공부 중이라면, 현재까지의 시간 더하기
      const startTime = studyTimers.get(userId);
      if (startTime) {
        userTotal += now.getTime() - startTime.getTime();
      }

      serverTotalDuration += userTotal;

      // 시간 포맷팅 (HH:MM:SS)
      const hours = Math.floor(userTotal / 3600000)
        .toString()
        .padStart(2, "0");
      const minutes = Math.floor((userTotal % 3600000) / 60000)
        .toString()
        .padStart(2, "0");
      const seconds = Math.floor((userTotal % 60000) / 1000)
        .toString()
        .padStart(2, "0");

      const status = startTime ? "📖 공부 중" : "💤 종료";

      return {
        name: userName,
        value: `시간: \`${hours}:${minutes}:${seconds}\`\n상태: ${status}`,
        inline: true,
      };
    } catch (error) {
      return null;
    }
  });

  const fields = (await Promise.all(promises)).filter(
    (f): f is any => f !== null
  );

  if (fields.length > 0) {
    embed.addFields(fields);

    const totalHours = Math.floor(serverTotalDuration / 3600000)
      .toString()
      .padStart(2, "0");
    const totalMinutes = Math.floor((serverTotalDuration % 3600000) / 60000)
      .toString()
      .padStart(2, "0");
    const totalSeconds = Math.floor((serverTotalDuration % 60000) / 1000)
      .toString()
      .padStart(2, "0");

    embed.setFooter({
      text: `오늘 총 공부 시간: ${totalHours}:${totalMinutes}:${totalSeconds}`,
    });

    await interaction.reply({ embeds: [embed] });
  } else {
    await interaction.reply({
      content: "기록을 표시할 수 없습니다.",
      ephemeral: true,
    });
  }
}
