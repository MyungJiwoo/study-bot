import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

// 명령어의 기본 정보를 정의합니다.
export const data = new SlashCommandBuilder()
  .setName("ping") // 슬래시 명령어 이름 (한글도 가능하지만, 보통 영어 소문자를 권장)
  .setDescription("봇의 응답 속도를 확인합니다."); // 명령어에 대한 설명

// 명령어가 실행될 때 호출될 함수입니다.
export async function execute(interaction: ChatInputCommandInteraction) {
  // interaction.reply()는 명령어에 대한 첫 응답을 보냅니다.
  // ephemeral: true 옵션을 주면 명령어 사용자에게만 보이는 메시지를 보낼 수 있습니다.
  const sentMessage = await interaction.reply({
    content: "퐁! 응답 속도를 계산하고 있어요...",
    fetchReply: true,
  });

  // fetchReply: true로 응답 메시지 객체를 받아온 후, editReply로 내용을 수정할 수 있습니다.
  // 여기서는 실제 응답 속도를 계산해서 보여줍니다.
  const latency = sentMessage.createdTimestamp - interaction.createdTimestamp;
  await interaction.editReply(
    `퐁! 🏓 응답 속도는 \\${latency}ms 입니다. API 지연 시간은 약 \\${Math.round(
      interaction.client.ws.ping
    )}ms 입니다.`
  );
}
