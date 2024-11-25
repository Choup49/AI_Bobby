import { Game, Player, GameObject } from '../interfaces/Game';

export class SimpleGame implements Game {
  public width = 800;
  public height = 400;
  private player: Player;
  private goal: GameObject;
  private obstacles: GameObject[];
  private readonly gravity = 0.5;
  private readonly jumpForce = -10;
  private readonly moveSpeed = 5;

  constructor() {
    this.player = {
      x: 50,
      y: this.height - 50,
      health: 100,
      isHitByEnemy: () => this.checkCollisions()
    };

    this.goal = {
      x: this.width - 50,
      y: this.height - 50
    };

    this.obstacles = [
      { x: 300, y: this.height - 50 },
      { x: 500, y: this.height - 50 }
    ];

    this.reset();
  }

  public getPlayer(): Player {
    return this.player;
  }

  public getGoal(): GameObject {
    return this.goal;
  }

  public getObstacles(): GameObject[] {
    return this.obstacles;
  }

  public movePlayerLeft(): void {
    this.player.x = Math.max(0, this.player.x - this.moveSpeed);
  }

  public movePlayerRight(): void {
    this.player.x = Math.min(this.width, this.player.x + this.moveSpeed);
  }

  public playerJump(): void {
    if (this.player.y === this.height - 50) {
      this.player.y += this.jumpForce;
    }
  }

  public isGoalReached(): boolean {
    return Math.abs(this.player.x - this.goal.x) < 30 &&
           Math.abs(this.player.y - this.goal.y) < 30;
  }

  public update(): void {
    // Apply gravity
    if (this.player.y < this.height - 50) {
      this.player.y += this.gravity;
    }

    // Keep player within bounds
    this.player.y = Math.min(this.height - 50, this.player.y);
  }

  private checkCollisions(): boolean {
    return this.obstacles.some(obstacle => 
      Math.abs(this.player.x - obstacle.x) < 30 &&
      Math.abs(this.player.y - obstacle.y) < 30
    );
  }

  public reset(): void {
    this.player.x = 50;
    this.player.y = this.height - 50;
    this.player.health = 100;
  }
}