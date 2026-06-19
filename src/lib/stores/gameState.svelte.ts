import { STARTING_HP, STARTING_GOLD } from '$lib/types';

export const gameState = createGameState();

function createGameState() {
  let health = $state(STARTING_HP);
  let maxHealth = $state(STARTING_HP);
  let gold = $state(STARTING_GOLD);
  let wave = $state(0);
  let score = $state(0);
  let isPlaying = $state(false);
  let isPlacing = $state(false);
  let selectedTowerDefId: string | null = $state(null);
  let isGameOver = $state(false);
  let isVictory = $state(false);

  return {
    get health() { return health; },
    get maxHealth() { return maxHealth; },
    get gold() { return gold; },
    get wave() { return wave; },
    get score() { return score; },
    get isPlaying() { return isPlaying; },
    get isPlacing() { return isPlacing; },
    get selectedTowerDefId() { return selectedTowerDefId; },
    get isGameOver() { return isGameOver; },
    get isVictory() { return isVictory; },

    // Direct sync from engine (called by GameCanvas)
    syncFromEngine(engineGold: number, engineHp: number) {
      gold = engineGold;
      health = engineHp;
    },

    startGame() {
      health = STARTING_HP;
      maxHealth = STARTING_HP;
      gold = STARTING_GOLD;
      wave = 1;
      score = 0;
      isPlaying = true;
      isGameOver = false;
      isVictory = false;
      isPlacing = false;
      selectedTowerDefId = null;
    },

    takeDamage(amount: number) {
      health = Math.max(0, health - amount);
    },

    addGold(amount: number) {
      gold += amount;
    },

    spendGold(amount: number): boolean {
      if (gold >= amount) {
        gold -= amount;
        return true;
      }
      return false;
    },

    setWave(n: number) { wave = n; },
    addScore(points: number) { score += points; },

    startPlacing(towerDefId: string) {
      isPlacing = true;
      selectedTowerDefId = towerDefId;
    },

    cancelPlacing() {
      isPlacing = false;
      selectedTowerDefId = null;
    },

    endGame(victory: boolean) {
      isPlaying = false;
      isGameOver = true;
      isVictory = victory;
    },
  };
}
