import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Palette, Play, RotateCcw, Timer, Trophy, AlertCircle, Info, MousePointer } from 'lucide-react';

interface GraphColoringProps {
  onBackToMenu: () => void;
}

interface Node {
  id: number;
  x: number;
  y: number;
  color: number;
  neighbors: number[];
}

interface Edge {
  from: number;
  to: number;
}

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 400;
const NODE_RADIUS = 20;

// Mobile responsive canvas dimensions
const MOBILE_CANVAS_WIDTH = 350;
const MOBILE_CANVAS_HEIGHT = 280;
const MOBILE_NODE_RADIUS = 16;

const COLORS = [
  '#ef4444', // red
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // yellow
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
];

const COLOR_NAMES = [
  'Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Cyan', 'Orange', 'Lime'
];

const GraphColoring: React.FC<GraphColoringProps> = ({ onBackToMenu }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedColor, setSelectedColor] = useState(0);
  const [conflicts, setConflicts] = useState<Set<number>>(new Set());
  const [isComplete, setIsComplete] = useState(false);
  const [colorsUsed, setColorsUsed] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
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

  const canvasWidth = isMobile ? MOBILE_CANVAS_WIDTH : CANVAS_WIDTH;
  const canvasHeight = isMobile ? MOBILE_CANVAS_HEIGHT : CANVAS_HEIGHT;
  const nodeRadius = isMobile ? MOBILE_NODE_RADIUS : NODE_RADIUS;

  // Generate random graph
  const generateGraph = useCallback(() => {
    const nodeCount = isMobile ? 6 : 8;
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    
    // Create nodes in a circle pattern
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * 2 * Math.PI;
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      const radius = isMobile ? 80 : 120;
      
      newNodes.push({
        id: i,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        color: -1, // -1 means uncolored
        neighbors: []
      });
    }
    
    // Create edges (ensure connected graph with some complexity)
    const edgeSet = new Set<string>();
    
    // Connect each node to next 2 nodes (creates cycles)
    for (let i = 0; i < nodeCount; i++) {
      for (let j = 1; j <= 2; j++) {
        const neighbor = (i + j) % nodeCount;
        const edgeKey = `${Math.min(i, neighbor)}-${Math.max(i, neighbor)}`;
        
        if (!edgeSet.has(edgeKey)) {
          edgeSet.add(edgeKey);
          newEdges.push({ from: i, to: neighbor });
          newNodes[i].neighbors.push(neighbor);
          newNodes[neighbor].neighbors.push(i);
        }
      }
    }
    
    // Add some random edges for complexity
    const randomEdges = isMobile ? 2 : 3;
    for (let i = 0; i < randomEdges; i++) {
      const from = Math.floor(Math.random() * nodeCount);
      const to = Math.floor(Math.random() * nodeCount);
      
      if (from !== to) {
        const edgeKey = `${Math.min(from, to)}-${Math.max(from, to)}`;
        
        if (!edgeSet.has(edgeKey)) {
          edgeSet.add(edgeKey);
          newEdges.push({ from, to });
          newNodes[from].neighbors.push(to);
          newNodes[to].neighbors.push(from);
        }
      }
    }
    
    setNodes(newNodes);
    setEdges(newEdges);
    setConflicts(new Set());
    setIsComplete(false);
    setColorsUsed(0);
    setTimeElapsed(0);
    setStartTime(null);
    setGameStarted(false);
    setShowInstructions(true);
  }, [canvasWidth, canvasHeight, isMobile]);

  // Check for conflicts
  const checkConflicts = useCallback((currentNodes: Node[]) => {
    const newConflicts = new Set<number>();
    
    currentNodes.forEach(node => {
      if (node.color !== -1) {
        node.neighbors.forEach(neighborId => {
          const neighbor = currentNodes[neighborId];
          if (neighbor.color === node.color) {
            newConflicts.add(node.id);
            newConflicts.add(neighborId);
          }
        });
      }
    });
    
    setConflicts(newConflicts);
    
    // Check if complete and valid
    const allColored = currentNodes.every(node => node.color !== -1);
    const noConflicts = newConflicts.size === 0;
    
    if (allColored && noConflicts) {
      const usedColors = new Set(currentNodes.map(node => node.color));
      setColorsUsed(usedColors.size);
      setIsComplete(true);
    } else {
      setIsComplete(false);
    }
  }, []);

  // Draw graph
  const drawGraph = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw edges
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    edges.forEach(edge => {
      const fromNode = nodes[edge.from];
      const toNode = nodes[edge.to];
      
      ctx.beginPath();
      ctx.moveTo(fromNode.x, fromNode.y);
      ctx.lineTo(toNode.x, toNode.y);
      ctx.stroke();
    });
    
    // Draw nodes
    nodes.forEach(node => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
      
      if (node.color === -1) {
        ctx.fillStyle = '#374151';
      } else {
        ctx.fillStyle = COLORS[node.color];
      }
      
      ctx.fill();
      
      // Draw border (red if conflict)
      ctx.strokeStyle = conflicts.has(node.id) ? '#ef4444' : '#9ca3af';
      ctx.lineWidth = conflicts.has(node.id) ? 3 : 2;
      ctx.stroke();
      
      // Draw node ID
      ctx.fillStyle = 'white';
      ctx.font = `${Math.max(12, nodeRadius * 0.7)}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(node.id.toString(), node.x, node.y + 5);
    });
  }, [nodes, edges, conflicts, nodeRadius]);

  // Handle canvas click
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Find clicked node
    const clickedNode = nodes.find(node => {
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      return distance <= nodeRadius;
    });
    
    if (clickedNode) {
      if (!gameStarted) {
        setGameStarted(true);
        setStartTime(Date.now());
        setShowInstructions(false);
      }
      
      const newNodes = [...nodes];
      newNodes[clickedNode.id].color = selectedColor;
      setNodes(newNodes);
      checkConflicts(newNodes);
    }
  };

  // Auto-solve with greedy algorithm
  const autoSolve = () => {
    const newNodes = nodes.map(node => ({ ...node, color: -1 }));
    
    // Greedy coloring algorithm
    newNodes.forEach(node => {
      const usedColors = new Set<number>();
      
      // Check colors used by neighbors
      node.neighbors.forEach(neighborId => {
        const neighborColor = newNodes[neighborId].color;
        if (neighborColor !== -1) {
          usedColors.add(neighborColor);
        }
      });
      
      // Find first available color
      for (let color = 0; color < COLORS.length; color++) {
        if (!usedColors.has(color)) {
          node.color = color;
          break;
        }
      }
    });
    
    setNodes(newNodes);
    checkConflicts(newNodes);
    
    if (!gameStarted) {
      setGameStarted(true);
      setStartTime(Date.now());
      setShowInstructions(false);
    }
  };

  // Clear all colors
  const clearColors = () => {
    const newNodes = nodes.map(node => ({ ...node, color: -1 }));
    setNodes(newNodes);
    setConflicts(new Set());
    setIsComplete(false);
    setColorsUsed(0);
    setShowInstructions(true);
  };

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (gameStarted && startTime && !isComplete) {
      interval = setInterval(() => {
        setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [gameStarted, startTime, isComplete]);

  // Initialize graph on mount
  useEffect(() => {
    generateGraph();
  }, [generateGraph]);

  // Draw graph when it changes
  useEffect(() => {
    drawGraph();
  }, [drawGraph]);

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
              <Palette className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-purple-400" />
              Graph Coloring
            </h1>
            <p className="text-sm sm:text-base text-slate-400">Color nodes so no connected nodes share the same color</p>
          </div>
          
          <div className="hidden sm:block w-24"></div>
        </div>

        {/* Instructions Banner */}
        {showInstructions && (
          <div className="mb-4 sm:mb-6 bg-purple-600/20 border border-purple-500/30 rounded-xl p-3 sm:p-4">
            <div className="flex items-start">
              <Info className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
              <div className="text-xs sm:text-sm text-purple-100">
                <p className="font-semibold mb-1">How to play:</p>
                <p>1. <strong>Pick a color</strong> from the palette below</p>
                <p>2. <strong>Click nodes</strong> to paint them with your selected color</p>
                <p>3. <strong>Goal:</strong> No two connected nodes can have the same color!</p>
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
                  width={canvasWidth}
                  height={canvasHeight}
                  className="border border-white/20 rounded-lg cursor-pointer hover:border-white/40 transition-colors max-w-full"
                  onClick={handleCanvasClick}
                />
              </div>
              
              {/* Current Color Indicator */}
              <div className="text-center mb-4">
                <div className="inline-flex items-center px-3 sm:px-4 py-2 bg-white/10 rounded-lg">
                  <div 
                    className="w-3 h-3 sm:w-4 sm:h-4 rounded-full mr-2 border border-white/30"
                    style={{ backgroundColor: COLORS[selectedColor] }}
                  ></div>
                  <span className="text-white font-medium text-xs sm:text-sm">
                    <MousePointer className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                    Click nodes to paint them {COLOR_NAMES[selectedColor]}
                  </span>
                </div>
              </div>
              
              {conflicts.size > 0 && (
                <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-red-600/20 border border-red-500/30 rounded-lg">
                  <div className="flex items-center justify-center text-red-400 text-sm sm:text-base">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    <span className="font-semibold">Conflict! Connected nodes can't have the same color.</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Control Panel */}
          <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
            {/* Color Palette */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Color Palette</h3>
              <div className="grid grid-cols-4 gap-2">
                {COLORS.map((color, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedColor(index)}
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg border-2 transition-all hover:scale-105 ${
                      selectedColor === index
                        ? 'border-white scale-110 shadow-lg'
                        : 'border-white/30 hover:border-white/60'
                    }`}
                    style={{ backgroundColor: color }}
                    title={COLOR_NAMES[index]}
                  />
                ))}
              </div>
              <div className="mt-2 sm:mt-3 text-center text-xs sm:text-sm text-slate-400">
                Selected: <span className="text-white font-medium">{COLOR_NAMES[selectedColor]}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Actions</h3>
              <div className="space-y-2 sm:space-y-3">
                <button
                  onClick={autoSolve}
                  className="w-full flex items-center justify-center px-3 sm:px-4 py-2 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors text-sm sm:text-base"
                >
                  <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Auto Solve
                </button>
                
                <button
                  onClick={clearColors}
                  className="w-full flex items-center justify-center px-3 sm:px-4 py-2 sm:py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors text-sm sm:text-base"
                >
                  <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Clear All Colors
                </button>
                
                <button
                  onClick={generateGraph}
                  className="w-full flex items-center justify-center px-3 sm:px-4 py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors text-sm sm:text-base"
                >
                  <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  New Graph
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Progress</h3>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 flex items-center text-sm sm:text-base">
                    <Timer className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Time
                  </span>
                  <span className="text-white font-mono text-sm sm:text-base">{timeElapsed}s</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm sm:text-base">Colors Used</span>
                  <span className="text-purple-400 font-mono text-sm sm:text-base">{colorsUsed}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm sm:text-base">Conflicts</span>
                  <span className="text-red-400 font-mono text-sm sm:text-base">{conflicts.size}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm sm:text-base">Nodes Colored</span>
                  <span className="text-slate-400 font-mono text-sm sm:text-base">
                    {nodes.filter(n => n.color !== -1).length}/{nodes.length}
                  </span>
                </div>
              </div>
              
              {isComplete && (
                <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-purple-600/20 border border-purple-500/30 rounded-lg">
                  <div className="flex items-center text-purple-400 text-sm sm:text-base">
                    <Trophy className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    <span className="font-semibold">Perfect Coloring!</span>
                  </div>
                </div>
              )}
            </div>

            {/* Algorithm Info */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">Graph Coloring</h3>
              <div className="text-xs sm:text-sm text-slate-300 space-y-1 sm:space-y-2">
                <p><strong className="text-purple-400">Goal:</strong> Use minimum colors possible</p>
                <p><strong className="text-purple-400">Rule:</strong> Connected nodes must have different colors</p>
                <p><strong className="text-purple-400">Strategy:</strong> Start with high-degree nodes</p>
                <p className="text-xs text-slate-400 mt-2 sm:mt-3 pt-2 border-t border-white/10">
                  Graph coloring has applications in scheduling, register allocation, and map coloring.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraphColoring;