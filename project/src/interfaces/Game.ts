export interface GameObject {
  x: number;
  y: number;
}

export interface Player extends GameObject {
  health: number;
  isHitByEnemy(): boolean;
}

export interface Game {
  width: number;
  height: number;
  getPlayer(): Player;
  getGoal(): GameObject;
  getObstacles(): GameObject[];
  movePlayerLeft(): void;
  movePlayerRight(): void;
  playerJump(): void;
  isGoalReached(): boolean;
  update(): void;
  reset(): void;
}