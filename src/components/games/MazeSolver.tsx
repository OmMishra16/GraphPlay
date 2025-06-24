import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Play, Pause, RotateCcw, Zap, Timer, Trophy, Info } from 'lucide-react';
import { MazeCell, Position } from '../../types/Game';

interface MazeSolverProps {
  onBackToMenu: () => void;
}

type Algorithm = 'BFS' | 'DFS';

const CELL_SIZE = 20;
const MAZE_WIDTH = 25;
const MAZE_HEIGHT = 15;

const MazeSolver: React.FC<MazeSolverProps> = ({ onBackToMenu }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [maze, setMaze] = useState<MazeCell[][]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [algorithm, setAlgorithm] = useState<Algorithm>('BFS');
  const [visitedCount, setVisitedCount] = useState(0);
  const [pathLength, setPathLength] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);

  // Initialize maze
  const initializeMaze = useCallback(() => {
    const newMaze: MazeCell[][] = [];
    
    for (let y = 0; y < MAZE_HEIGHT; y++) {
      const row: MazeCell[] = [];
      for (let x = 0; x < MAZE_WIDTH; x++) {
        row.push({
          x,
          y,
          isWall: Math.random() < 0.3 && !(x === 1 && y === 1) && !(x === MAZE_WIDTH - 2 && y === MAZE_HEIGHT - 2),
          isVisited: false,
          isPath: false,
          isStart: x === 1 && y === 1,
          isEnd: x === MAZE_WIDTH - 2 && y === MAZE_HEIGHT - 2,
        });
      }
      newMaze.push(row);
    }
    
    // Ensure borders are walls
    for (let x = 0; x < MAZE_WIDTH; x++) {
      newMaze[0][x].isWall = true;
      newMaze[MAZE_HEIGHT - 1][x].isWall = true;
    }
    for (let y = 0; y < MAZE_HEIGHT; y++) {
      newMaze[y][0].isWall = true;
      newMaze[y][MAZE_WIDTH - 1].isWall = true;
    }
    
    setMaze(newMaze);
    setVisitedCount(0);
    setPathLength(0);
    setTimeElapsed(0);
    setGameCompleted(false);
    setStartTime(null);
    setShowInstructions(true);
  }, []);

  // Draw maze on canvas
  const drawMaze = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    maze.forEach(row => {
      row.forEach(cell => {
        const x = cell.x * CELL_SIZE;
        const y = cell.y * CELL_SIZE;
        
        if (cell.isWall) {
          ctx.fillStyle = '#334155';
        } else if (cell.isStart) {
          ctx.fillStyle = '#22c55e';
        } else if (cell.isEnd) {
          ctx.fillStyle = '#ef4444';
        } else if (cell.isPath) {
          ctx.fillStyle = '#f59e0b';
        } else if (cell.isVisited) {
          ctx.fillStyle = '#3b82f6';
        } else {
          ctx.fillStyle = '#1e293b';
        }
        
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        
        // Draw border
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
      });
    });
  }, [maze]);

  // Get neighbors of a cell
  const getNeighbors = (cell: MazeCell): Position[] => {
    const neighbors: Position[] = [];
    const directions = [
      { x: 0, y: -1 }, // up
      { x: 1, y: 0 },  // right
      { x: 0, y: 1 },  // down
      { x: -1, y: 0 }  // left
    ];
    
    directions.forEach(dir => {
      const newX = cell.x + dir.x;
      const newY = cell.y + dir.y;
      
      if (newX >= 0 && newX < MAZE_WIDTH && newY >= 0 && newY < MAZE_HEIGHT) {
        if (!maze[newY][newX].isWall && !maze[newY][newX].isVisited) {
          neighbors.push({ x: newX, y: newY });
        }
      }
    });
    
    return neighbors;
  };

  // BFS Algorithm
  const runBFS = async () => {
    const newMaze = maze.map(row => row.map(cell => ({ ...cell, isVisited: false, isPath: false })));
    const queue: Position[] = [{ x: 1, y: 1 }];
    const parent: Map<string, Position> = new Map();
    let visited = 0;
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentCell = newMaze[current.y][current.x];
      
      if (currentCell.isVisited) continue;
      
      currentCell.isVisited = true;
      visited++;
      setVisitedCount(visited);
      
      if (currentCell.isEnd) {
        // Reconstruct path
        let pathNode: Position | undefined = current;
        let pathLen = 0;
        
        while (pathNode) {
          newMaze[pathNode.y][pathNode.x].isPath = true;
          pathLen++;
          pathNode = parent.get(`${pathNode.x},${pathNode.y}`);
        }
        
        setPathLength(pathLen);
        setGameCompleted(true);
        setIsRunning(false);
        break;
      }
      
      const neighbors = getNeighbors(currentCell);
      neighbors.forEach(neighbor => {
        if (!newMaze[neighbor.y][neighbor.x].isVisited) {
          parent.set(`${neighbor.x},${neighbor.y}`, current);
          queue.push(neighbor);
        }
      });
      
      setMaze([...newMaze]);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  };

  // DFS Algorithm
  const runDFS = async () => {
    const newMaze = maze.map(row => row.map(cell => ({ ...cell, isVisited: false, isPath: false })));
    const stack: Position[] = [{ x: 1, y: 1 }];
    const parent: Map<string, Position> = new Map();
    let visited = 0;
    
    while (stack.length > 0) {
      const current = stack.pop()!;
      const currentCell = newMaze[current.y][current.x];
      
      if (currentCell.isVisited) continue;
      
      currentCell.isVisited = true;
      visited++;
      setVisitedCount(visited);
      
      if (currentCell.isEnd) {
        // Reconstruct path
        let pathNode: Position | undefined = current;
        let pathLen = 0;
        
        while (pathNode) {
          newMaze[pathNode.y][pathNode.x].isPath = true;
          pathLen++;
          pathNode = parent.get(`${pathNode.x},${pathNode.y}`);
        }
        
        setPathLength(pathLen);
        setGameCompleted(true);
        setIsRunning(false);
        break;
      }
      
      const neighbors = getNeighbors(currentCell);
      neighbors.forEach(neighbor => {
        if (!newMaze[neighbor.y][neighbor.x].isVisited) {
          parent.set(`${neighbor.x},${neighbor.y}`, current);
          stack.push(neighbor);
        }
      });
      
      setMaze([...newMaze]);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  };

  // Start algorithm
  const startAlgorithm = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setStartTime(Date.now());
    setShowInstructions(false);
    
    if (algorithm === 'BFS') {
      await runBFS();
    } else {
      await runDFS();
    }
    
    setIsRunning(false);
  };

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && startTime) {
      interval = setInterval(() => {
        setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  // Initialize maze on mount
  useEffect(() => {
    initializeMaze();
  }, [initializeMaze]);

  // Draw maze when it changes
  useEffect(() => {
    drawMaze();
  }, [drawMaze]);

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBackToMenu}
            className="flex items-center text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Menu
          </button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center">
              <Zap className="w-8 h-8 mr-3 text-blue-400" />
              Maze Solver
            </h1>
            <p className="text-slate-400">Compare BFS vs DFS pathfinding algorithms</p>
          </div>
          
          <div className="w-24"></div>
        </div>

        {/* Instructions Banner */}
        {showInstructions && (
          <div className="mb-6 bg-blue-600/20 border border-blue-500/30 rounded-xl p-4">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-100">
                <p className="font-semibold mb-1">How to play:</p>
                <p>1. <strong>Choose an algorithm:</strong> BFS (explores level by level) or DFS (goes deep first)</p>
                <p>2. <strong>Click "Start Solving"</strong> to watch the algorithm find a path from green to red</p>
                <p>3. <strong>Compare results:</strong> See which algorithm visits fewer cells!</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Game Canvas */}
          <div className="lg:col-span-3">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="flex justify-center mb-4">
                <canvas
                  ref={canvasRef}
                  width={MAZE_WIDTH * CELL_SIZE}
                  height={MAZE_HEIGHT * CELL_SIZE}
                  className="border border-white/20 rounded-lg"
                />
              </div>
              
              {/* Legend */}
              <div className="flex justify-center space-x-6 text-sm flex-wrap gap-y-2">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                  <span className="text-slate-300">Start</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                  <span className="text-slate-300">Exit</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                  <span className="text-slate-300">Explored</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
                  <span className="text-slate-300">Final Path</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-slate-600 rounded mr-2"></div>
                  <span className="text-slate-300">Wall</span>
                </div>
              </div>
            </div>
          </div>

          {/* Control Panel */}
          <div className="space-y-6">
            {/* Algorithm Selection */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Choose Algorithm</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setAlgorithm('BFS')}
                  disabled={isRunning}
                  className={`w-full p-3 rounded-lg border transition-all ${
                    algorithm === 'BFS'
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg'
                      : 'bg-white/5 border-white/20 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <div className="font-semibold">BFS (Breadth-First)</div>
                  <div className="text-xs mt-1 opacity-75">Explores level by level</div>
                </button>
                <button
                  onClick={() => setAlgorithm('DFS')}
                  disabled={isRunning}
                  className={`w-full p-3 rounded-lg border transition-all ${
                    algorithm === 'DFS'
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg'
                      : 'bg-white/5 border-white/20 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <div className="font-semibold">DFS (Depth-First)</div>
                  <div className="text-xs mt-1 opacity-75">Goes deep first</div>
                </button>
              </div>
            </div>

            {/* Controls */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={startAlgorithm}
                  disabled={isRunning}
                  className="w-full flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded-lg font-semibold transition-colors"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {isRunning ? 'Solving...' : 'Start Solving'}
                </button>
                
                <button
                  onClick={initializeMaze}
                  disabled={isRunning}
                  className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg font-semibold transition-colors"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Generate New Maze
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Results</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 flex items-center">
                    <Timer className="w-4 h-4 mr-2" />
                    Time
                  </span>
                  <span className="text-white font-mono">{timeElapsed}s</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Cells Explored</span>
                  <span className="text-blue-400 font-mono">{visitedCount}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Path Length</span>
                  <span className="text-yellow-400 font-mono">{pathLength} steps</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Algorithm</span>
                  <span className="text-slate-400 font-mono text-sm">{algorithm}</span>
                </div>
              </div>
              
              {gameCompleted && (
                <div className="mt-4 p-3 bg-green-600/20 border border-green-500/30 rounded-lg">
                  <div className="flex items-center text-green-400">
                    <Trophy className="w-4 h-4 mr-2" />
                    <span className="font-semibold">Path Found!</span>
                  </div>
                </div>
              )}
            </div>

            {/* Algorithm Info */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-3">Algorithm Comparison</h3>
              <div className="text-sm text-slate-300 space-y-2">
                <p><strong className="text-blue-400">BFS:</strong> Guarantees shortest path</p>
                <p><strong className="text-blue-400">DFS:</strong> Uses less memory</p>
                <p><strong className="text-blue-400">BFS:</strong> Explores systematically</p>
                <p><strong className="text-blue-400">DFS:</strong> Can get lucky and find path quickly</p>
                <p className="text-xs text-slate-400 mt-3 pt-2 border-t border-white/10">
                  Try both algorithms on the same maze to see the difference!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MazeSolver;