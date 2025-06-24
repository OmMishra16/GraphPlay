export type GameType = 'maze-solver' | 'path-finder' | 'graph-coloring' | 'network-connector' | 'cycle-detector';

export interface GameInfo {
  id: GameType;
  title: string;
  description: string;
  algorithm: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  icon: string;
  color: string;
  gradient: string;
}

export interface Position {
  x: number;
  y: number;
}

export interface MazeCell {
  x: number;
  y: number;
  isWall: boolean;
  isVisited: boolean;
  isPath: boolean;
  isStart: boolean;
  isEnd: boolean;
  distance?: number;
  parent?: Position;
}

export interface GameStats {
  score: number;
  time: number;
  moves: number;
  completed: boolean;
}