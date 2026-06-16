function createGameState() {
  let health = $state(20);
  let maxHealth = $state(20);
  let gold = $state(150);
  let wave = $state(0);
  let score = $state(0);
  let isPlaying = $state(false);
  let isPlacing = $state(false);
  let selectedTowerDefId: string | null = $state(null);
  let isGameOver = $state(false);
  let isVictory = $state(false);
  let fps = $state(0);
  let wavePrep = $state(false);
  let wavePrepTime = $state(0);
  let enemyScreenPositions: { x: number; y: number; distance: number }[] = $state([]);

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
    get fps() { return fps; },
    set fps(v: number) { fps = v; },
    get wavePrep() { return wavePrep; },
    set wavePrep(v: boolean) { wavePrep = v; },
    get wavePrepTime() { return wavePrepTime; },
    set wavePrepTime(v: number) { wavePrepTime = v; },
    get enemyScreenPositions() { return enemyScreenPositions; },
    set enemyScreenPositions(v: { x: number; y: number; distance: number }[]) { enemyScreenPositions = v; },

    startGame() {
      health = 20;
      maxHealth = 20;
      gold = 150;
      wave = 1;
      score = 0;
      isPlaying = true;
      isGameOver = false;
      isVictory = false;
      isPlacing = false;
      selectedTowerDefId = null;
      fps = 0;
      wavePrep = false;
      wavePrepTime = 0;
      enemyScreenPositions = [];
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

    setWave(n: number) {
      wave = n;
    },

    addScore(points: number) {
      score += points;
    },

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

    reset() {
      health = 20;
      maxHealth = 20;
      gold = 150;
      wave = 0;
      score = 0;
      isPlaying = false;
      isGameOver = false;
      isVictory = false;
      isPlacing = false;
      selectedTowerDefId = null;
      fps = 0;
    },
  };
}

export const gameState = createGameState();
