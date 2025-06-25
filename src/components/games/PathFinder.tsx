import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Play, RotateCcw, MapPin, Timer, Trophy, Target, Info } from 'lucide-react';

interface PathFinderProps {
  onBackToMenu: () => void;
}

interface GridCell {
  x: number;
  y: number;
  isWall: boolean;
  isStart: boolean;
  isEnd: boolean;
  isVisited: boolean;
  isPath: boolean;
  distance: number;
  weight: number;
  previous: GridCell | null;
}

const CELL_SIZE = 25;
const GRID_WIDTH = 20;
const GRID_HEIGHT = 12;

// Mobile responsive grid dimensions
const MOBILE_CELL_SIZE = 20;
const MOBILE_GRID_WIDTH = 16;
const MOBILE_GRID_HEIGHT = 10;

const PathFinder: React.FC<PathFinderProps> = ({ onBackToMenu }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [grid, setGrid] = useState<GridCell[][]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [drawMode, setDrawMode] = useState<'wall' | 'weight'>('wall');
  const [visitedCount, setVisitedCount] = useState(0);
  const [pathLength, setPathLength] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const cellSize = isMobile ? MOBILE_CELL_SIZE : CELL_SIZE;
  const gridWidth = isMobile ? MOBILE_GRID_WIDTH : GRID_WIDTH;
  const gridHeight = isMobile ? MOBILE_GRID_HEIGHT : GRID_HEIGHT;

  // Initialize grid
  const initializeGrid = useCallback(() => {
    const newGrid: GridCell[][] = [];
    
    for (let y = 0; y < gridHeight; y++) {
      const row: GridCell[] = [];
      for (let x = 0; x < gridWidth; x++) {
        row.push({
          x,
          y,
          isWall: false,
          isStart: x === 2 && y === Math.floor(gridHeight / 2),
          isEnd: x === gridWidth - 3 && y === Math.floor(gridHeight / 2),
          isVisited: false,
          isPath: false,
          distance: Infinity,
          weight: Math.random() < 0.3 ? Math.floor(Math.random() * 5) + 2 : 1,
          previous: null,
        });
      }
      newGrid.push(row);
    }
    
    setGrid(newGrid);
    setVisitedCount(0);
    setPathLength(0);
    setTotalDistance(0);
    setTimeElapsed(0);
    setGameCompleted(false);
    setStartTime(null);
    setShowInstructions(true);
  }, [gridWidth, gridHeight]);

  // Draw grid on canvas
  const drawGrid = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    grid.forEach(row => {
      row.forEach(cell => {
        const x = cell.x * cellSize;
        const y = cell.y * cellSize;
        
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
        
        ctx.fillRect(x, y, cellSize, cellSize);
        
        // Draw weight if not wall/start/end and weight > 1
        if (!cell.isWall && !cell.isStart && !cell.isEnd && cell.weight > 1) {
          ctx.fillStyle = '#fbbf24';
          ctx.font = `${Math.max(10, cellSize * 0.5)}px monospace`;
          ctx.textAlign = 'center';
          ctx.fillText(cell.weight.toString(), x + cellSize/2, y + cellSize/2 + 4);
        }
        
        // Draw border
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, cellSize, cellSize);
      });
    });
  }, [grid, cellSize]);

  // Dijkstra's Algorithm
  const runDijkstra = async () => {
    const newGrid = grid.map(row => 
      row.map(cell => ({ 
        ...cell, 
        isVisited: false, 
        isPath: false, 
        distance: cell.isStart ? 0 : Infinity,
        previous: null
      }))
    );
    
    setGrid(newGrid);
    
    // Find start cell
    let startCell: GridCell | null = null;
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        if (newGrid[y][x].isStart) {
          startCell = newGrid[y][x];
          break;
        }
      }
      if (startCell) break;
    }
    
    if (!startCell) return;
    
    const unvisited: GridCell[] = [];
    
    // Add all non-wall cells to unvisited
    newGrid.forEach(row => {
      row.forEach(cell => {
        if (!cell.isWall) {
          unvisited.push(cell);
        }
      });
    });
    
    let visited = 0;
    
    while (unvisited.length > 0) {
      // Sort by distance and get closest unvisited cell
      unvisited.sort((a, b) => a.distance - b.distance);
      const current = unvisited.shift()!;
      
      if (current.distance === Infinity) break;
      
      current.isVisited = true;
      visited++;
      setVisitedCount(visited);
      
      if (current.isEnd) {
        // Reconstruct path
        let pathNode: GridCell | null = current;
        let pathLen = 0;
        let totalDist = 0;
        
        while (pathNode) {
          pathNode.isPath = true;
          pathLen++;
          totalDist += pathNode.weight;
          pathNode = pathNode.previous;
        }
        
        setPathLength(pathLen);
        setTotalDistance(totalDist);
        setGameCompleted(true);
        setIsRunning(false);
        break;
      }
      
      // Get neighbors
      const directions = [
        { x: 0, y: -1 }, // up
        { x: 1, y: 0 },  // right
        { x: 0, y: 1 },  // down
        { x: -1, y: 0 }  // left
      ];
      
      directions.forEach(dir => {
        const newX = current.x + dir.x;
        const newY = current.y + dir.y;
        
        if (newX >= 0 && newX < gridWidth && newY >= 0 && newY < gridHeight) {
          const neighbor = newGrid[newY][newX];
          
          if (!neighbor.isWall && !neighbor.isVisited) {
            const tentativeDistance = current.distance + neighbor.weight;
            
            if (tentativeDistance < neighbor.distance) {
              neighbor.distance = tentativeDistance;
              neighbor.previous = current;
            }
          }
        }
      });
      
      setGrid([...newGrid]);
      await new Promise(resolve => setTimeout(resolve, isMobile ? 150 : 100));
    }
    
    setIsRunning(false);
  };

  // Handle canvas click
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isRunning) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / cellSize);
    const y = Math.floor((event.clientY - rect.top) / cellSize);
    
    if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
      const newGrid = [...grid];
      const cell = newGrid[y][x];
      
      if (!cell.isStart && !cell.isEnd) {
        if (drawMode === 'wall') {
          cell.isWall = !cell.isWall;
          if (cell.isWall) {
            cell.isVisited = false;
            cell.isPath = false;
          }
        } else if (drawMode === 'weight' && !cell.isWall) {
          cell.weight = cell.weight === 1 ? 5 : 1;
        }
      }
      
      setGrid(newGrid);
      setShowInstructions(false);
    }
  };

  // Start algorithm
  const startAlgorithm = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setStartTime(Date.now());
    setShowInstructions(false);
    await runDijkstra();
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

  // Initialize grid on mount
  useEffect(() => {
    initializeGrid();
  }, [initializeGrid]);

  // Draw grid when it changes
  useEffect(() => {
    drawGrid();
  }, [drawGrid]);

  return (
    <div className="min-h-screen px-4 sm:px-6 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <button
            onClick={onBackToMenu}
            className="flex items-center text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Back to Menu
          </button>
          
          <div className="text-center flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center justify-center">
              <MapPin className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-teal-400" />
              Path Finder
            </h1>
            <p className="text-sm sm:text-base text-slate-400">Find the shortest path using Dijkstra's algorithm</p>
          </div>
          
          <div className="hidden sm:block w-24"></div>
        </div>

        {/* Instructions Banner */}
        {showInstructions && (
          <div className="mb-4 sm:mb-6 bg-teal-600/20 border border-teal-500/30 rounded-xl p-3 sm:p-4">
            <div className="flex items-start">
              <Info className="w-4 h-4 sm:w-5 sm:h-5 text-teal-400 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
              <div className="text-xs sm:text-sm text-teal-100">
                <p className="font-semibold mb-1">How to play:</p>
                <p>1. <strong>Click cells</strong> to add walls (dark blocks) or weights (numbered cells)</p>
                <p>2. Switch between "Add Walls" and "Add Weights" modes below</p>
                <p>3. Click "Find Shortest Path" to watch Dijkstra's algorithm in action!</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Game Canvas */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10">
              <div className="flex justify-center mb-4 overflow-x-auto">
                <canvas
                  ref={canvasRef}
                  width={gridWidth * cellSize}
                  height={gridHeight * cellSize}
                  className="border border-white/20 rounded-lg cursor-pointer hover:border-white/40 transition-colors max-w-full"
                  onClick={handleCanvasClick}
                />
              </div>
              
              {/* Current Mode Indicator */}
              <div className="text-center mb-4">
                <div className="inline-flex items-center px-3 sm:px-4 py-2 bg-white/10 rounded-lg">
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    drawMode === 'wall' ? 'bg-slate-500' : 'bg-yellow-500'
                  }`}></div>
                  <span className="text-white font-medium text-xs sm:text-sm">
                    {drawMode === 'wall' ? 'Click to add/remove walls' : 'Click to add/remove weights (cost: 5)'}
                  </span>
                </div>
              </div>
              
              {/* Legend */}
              <div className="flex justify-center space-x-2 sm:space-x-4 text-xs sm:text-sm flex-wrap gap-y-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded mr-1 sm:mr-2"></div>
                  <span className="text-slate-300">Start</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded mr-1 sm:mr-2"></div>
                  <span className="text-slate-300">End</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded mr-1 sm:mr-2"></div>
                  <span className="text-slate-300">Explored</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-500 rounded mr-1 sm:mr-2"></div>
                  <span className="text-slate-300">Path</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-slate-600 rounded mr-1 sm:mr-2"></div>
                  <span className="text-slate-300">Wall</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-slate-700 rounded mr-1 sm:mr-2 relative">
                    <span className="absolute inset-0 flex items-center justify-center text-yellow-400 text-xs font-bold">5</span>
                  </div>
                  <span className="text-slate-300">Weight</span>
                </div>
              </div>
            </div>
          </div>

          {/* Control Panel */}
          <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
            {/* Drawing Tools */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Drawing Tools</h3>
              <div className="space-y-2 sm:space-y-3">
                <button
                  onClick={() => setDrawMode('wall')}
                  disabled={isRunning}
                  className={`w-full p-2 sm:p-3 rounded-lg border transition-all text-sm sm:text-base ${
                    drawMode === 'wall'
                      ? 'bg-slate-600 border-slate-500 text-white shadow-lg'
                      : 'bg-white/5 border-white/20 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-center">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-slate-500 rounded mr-2"></div>
                    Add Walls
                  </div>
                  <div className="text-xs mt-1 opacity-75">Block the path</div>
                </button>
                <button
                  onClick={() => setDrawMode('weight')}
                  disabled={isRunning}
                  className={`w-full p-2 sm:p-3 rounded-lg border transition-all text-sm sm:text-base ${
                    drawMode === 'weight'
                      ? 'bg-yellow-600 border-yellow-500 text-white shadow-lg'
                      : 'bg-white/5 border-white/20 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-center">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-500 rounded mr-2 flex items-center justify-center text-xs font-bold text-black">5</div>
                    Add Weights
                  </div>
                  <div className="text-xs mt-1 opacity-75">Make path more expensive</div>
                </button>
              </div>
            </div>

            {/* Controls */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Algorithm</h3>
              <div className="space-y-2 sm:space-y-3">
                <button
                  onClick={startAlgorithm}
                  disabled={isRunning}
                  className="w-full flex items-center justify-center px-3 sm:px-4 py-2 sm:py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-800 text-white rounded-lg font-semibold transition-colors text-sm sm:text-base"
                >
                  <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  {isRunning ? 'Finding Path...' : 'Find Shortest Path'}
                </button>
                
                <button
                  onClick={initializeGrid}
                  disabled={isRunning}
                  className="w-full flex items-center justify-center px-3 sm:px-4 py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg font-semibold transition-colors text-sm sm:text-base"
                >
                  <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Reset Grid
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Results</h3>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 flex items-center text-sm sm:text-base">
                    <Timer className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Time
                  </span>
                  <span className="text-white font-mono text-sm sm:text-base">{timeElapsed}s</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm sm:text-base">Cells Explored</span>
                  <span className="text-blue-400 font-mono text-sm sm:text-base">{visitedCount}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm sm:text-base">Path Length</span>
                  <span className="text-yellow-400 font-mono text-sm sm:text-base">{pathLength} steps</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm sm:text-base">Total Cost</span>
                  <span className="text-teal-400 font-mono text-sm sm:text-base">{totalDistance}</span>
                </div>
              </div>
              
              {gameCompleted && (
                <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-teal-600/20 border border-teal-500/30 rounded-lg">
                  <div className="flex items-center text-teal-400 text-sm sm:text-base">
                    <Trophy className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    <span className="font-semibold">Shortest Path Found!</span>
                  </div>
                </div>
              )}
            </div>

            {/* Algorithm Info */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">How It Works</h3>
              <div className="text-xs sm:text-sm text-slate-300 space-y-1 sm:space-y-2">
                <p><strong className="text-teal-400">Step 1:</strong> Start at the green cell</p>
                <p><strong className="text-teal-400">Step 2:</strong> Explore nearest unvisited cells first</p>
                <p><strong className="text-teal-400">Step 3:</strong> Calculate cost to reach each cell</p>
                <p><strong className="text-teal-400">Step 4:</strong> Always pick the cheapest path</p>
                <p className="text-xs text-slate-400 mt-2 sm:mt-3 pt-2 border-t border-white/10">
                  Dijkstra's algorithm guarantees the shortest path in weighted graphs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PathFinder;