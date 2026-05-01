// #51 — surfaces a single relevant milestone at the top of /today so newcomers
// + daily players have something positive to anchor on. Hidden once any of the
// banner messages would render falsy or the user is unauthed.
//
// Priority (top wins):
// 1. "all 7 today" once gamesPlayedToday === 7
// 2. "first PB earned today" if any PB was set today
// 3. day-N streak callout while streak >= 1
// 4. "X / 7 games today" otherwise (or hide entirely if 0 plays + no streak)

type Props = {
  streakCurrent: number;
  gamesPlayedToday: number;
  pbSetToday: boolean;
  totalGames: number;
};

export function TodayMilestoneBanner({
  streakCurrent,
  gamesPlayedToday,
  pbSetToday,
  totalGames,
}: Props) {
  const message = pickMessage({ streakCurrent, gamesPlayedToday, pbSetToday, totalGames });
  if (!message) return null;
  return (
    <div className="milestone-banner" role="status">
      <span aria-hidden>{message.icon}</span>
      <span className="milestone-banner-text">{message.text}</span>
    </div>
  );
}

type Msg = { icon: string; text: string };

export function pickMessage({
  streakCurrent,
  gamesPlayedToday,
  pbSetToday,
  totalGames,
}: Props): Msg | null {
  if (gamesPlayedToday >= totalGames) {
    return { icon: "🎯", text: `all ${totalGames} games today — clean sweep` };
  }
  if (pbSetToday) {
    return { icon: "🏆", text: "new personal best earned today" };
  }
  if (streakCurrent >= 1) {
    return {
      icon: "🔥",
      text: `day ${streakCurrent} streak — keep it going`,
    };
  }
  if (gamesPlayedToday > 0) {
    return {
      icon: "•",
      text: `${gamesPlayedToday} / ${totalGames} games today`,
    };
  }
  return null;
}
