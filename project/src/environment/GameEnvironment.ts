import { Game, Player, GameObject } from '../interfaces/Game';

export class GameEnvironment {
  private readonly game: Game;
  public readonly actions: string[];
  private readonly maxObstacles: number = 5;

  constructor(game: Game) {
    this.game = game;
    this.actions = ['left', 'right', 'jump'];
  }

  private normalize(value: number, maxValue: number): number {
    return maxValue > 0 ? value / maxValue : 0;
  }

  public getState(): number[] {
    const player = this.game.getPlayer();
    const goal = this.game.getGoal();
    const obstacles = this.game.getObstacles();

    const playerX = this.normalize(player.x, this.game.width);
    const playerY = this.normalize(player.y, this.game.height);
    const playerHealth = player.health / 100;

    const goalX = this.normalize(goal.x, this.game.width);
    const goalY = this.normalize(goal.y, this.game.height);

    const obstaclePositions = obstacles
      .slice(0, this.maxObstacles)
      .map(obstacle => this.normalize(obstacle.x, this.game.width));

    while (obstaclePositions.length < this.maxObstacles) {
      obstaclePositions.push(0);
    }

    return [
      playerX,
      playerY,
      playerHealth,
      goalX,
      goalY,
      ...obstaclePositions
    ];
  }

  public applyAction(action: string): void {
    switch (action) {
      case 'left':
        this.game.movePlayerLeft();
        break;
      case 'right':
        this.game.movePlayerRight();
        break;
      case 'jump':
        this.game.playerJump();
        break;
      default:
        console.warn(`Unknown action: ${action}`);
    }
    this.game.update();
  }

  public getReward(): number {
    const player = this.game.getPlayer();
    
    if (player.health <= 0) {
      return -10; // Penalty for death
    }
    
    if (this.game.isGoalReached()) {
      return 100; // Reward for reaching goal
    }

    if (player.isHitByEnemy()) {
      return -5; // Penalty for being hit
    }
    
    return 1; // Default reward for progress
  }

  public isDone(): boolean {
    const player = this.game.getPlayer();
    return player.health <= 0 || this.game.isGoalReached();
  }

  public reset(): void {
    this.game.reset();
  }
}