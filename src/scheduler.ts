import cron from "node-cron";
import dotenv from "dotenv";
import { Client, TextChannel, EmbedBuilder } from "discord.js";

dotenv.config();

export function startScheduledJobs(client: Client) {
  // 개발 테스트
  // cron.schedule("22 * * * *", async () => {
  //   await sendDailyMessage(client);
  // });

  // 매일 오전 10시에 일일 체크인 메시지
  cron.schedule("0 10 * * *", async () => {
    await sendDailyMessage(client);
  });

  // 매일 자정에 서버 정리
  cron.schedule("0 0 * * *", async () => {
    console.log("일일 서버 정리 시작...");

    // 캐시 정리
    client.users.cache.sweep((user) => user.id !== client.user?.id);

    console.log("서버 정리 완료");
  });

  console.log("스케줄러가 시작되었습니다.");
}

// 일일 메시지 발송
async function sendDailyMessage(client: Client) {
  try {
    const targetChannelId = process.env.DISCORD_CHANNEL_ID;

    if (!targetChannelId) {
      console.error(
        "오류: DISCORD_CHANNEL_ID가 .env 파일에 설정되어 있지 않습니다."
      );
      return;
    }

    const channel = client.channels.cache.get(targetChannelId) as TextChannel;

    if (!channel) {
      console.log(`채널을 찾을 수 없습니다. (ID: ${targetChannelId})`);
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("☀️ 좋은 아침!")
      .setDescription("오늘의 공부를 시작해보아요! 화이팅 🍀")
      .setColor(0x00ff00)
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    console.log("일일 메시지를 발송했습니다.");
  } catch (error) {
    console.error("일일 메시지 발송 실패:", error);
  }
}
