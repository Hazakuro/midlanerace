import {refreshRaceData} from '@/lib/server-race-refresh';

const globalState = globalThis as typeof globalThis & {
  __midlaneArenaRefreshStarted?: boolean;
};

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (globalState.__midlaneArenaRefreshStarted) return;

  globalState.__midlaneArenaRefreshStarted = true;

  const runRefresh = async () => {
    try {
      const result = await refreshRaceData();
      console.log(
        `[Midlane Arena] Automatic refresh: ${result.updated} updated, ${result.failed} failed`
      );
    } catch (error) {
      console.error('[Midlane Arena] Automatic refresh failed:', error);
    }
  };

  // Give Next.js a moment to finish starting before the first refresh.
  setTimeout(() => {
    void runRefresh();
  }, 10_000);

  // Keep collecting fresh OP.GG data every hour without requiring visitors.
  setInterval(() => {
    void runRefresh();
  }, 60 * 60 * 1000);
}
