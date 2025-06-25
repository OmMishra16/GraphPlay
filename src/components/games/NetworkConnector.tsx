import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Network, Play, RotateCcw, Timer, Trophy, Zap, Info, MousePointer } from 'lucide-react';

interface NetworkConnectorProps {
  onBackToMenu: () => void;
}

interface Node {
  id: number;
  x: number;
  y: number;
  label: string;
}

interface Edge {
  from: number;
  to: number;
  weight: number;
  isSelected: boolean;
  isInMST: boolean;
}

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 400;
const NODE_RADIUS = 25;

// Mobile responsive canvas dimensions
const MOBILE_CANVAS_WIDTH = 350;
const MOBILE_CANVAS_HEIGHT = 280;
const MOBILE_NODE_RADIUS = 20;

const NetworkConnector: React.FC<NetworkConnectorProps> = ({ onBackToMenu }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<Set<number>>(new Set());
  const [mstEdges, setMstEdges] = useState<Set<number>>(new Set());
  const [totalCost, setTotalCost] = useState(0);
  const [mstCost, setMstCost] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [showMST, setShowMST] = useState(false);
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

  // Generate random network
  const generateNetwork = useCallback(() => {
    const nodeCount = isMobile ? 5 : 6;
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    
    // Create nodes in a roughly circular pattern
    const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * 2 * Math.PI;
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      const radius = (isMobile ? 80 : 120) + Math.random() * (isMobile ? 20 : 40);
      
      newNodes.push({
        id: i,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        label: labels[i]
      });
    }
    
    // Create edges between all pairs of nodes
    let edgeId = 0;
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const distance = Math.sqrt(
          (newNodes[i].x - newNodes[j].x) ** 2 + 
          (newNodes[i].y - newNodes[j].y) ** 2
        );
        
        // Weight based on distance with some randomization
        const weight = Math.floor(distance / (isMobile ? 8 : 10)) + Math.floor(Math.random() * 5) + 1;
        
        newEdges.push({
          from: i,
          to: j,
          weight,
          isSelected: false,
          isInMST: false
        });
        edgeId++;
      }
    }
    
    setNodes(newNodes);
    setEdges(newEdges);
    setSelectedEdges(new Set());
    setMstEdges(new Set());
    setTotalCost(0);
    setMstCost(0);
    setIsComplete(false);
    setTimeElapsed(0);
    setStartTime(null);
    setGameStarted(false);
    setShowMST(false);
    setShowInstructions(true);
  }, [canvasWidth, canvasHeight, isMobile]);

  // Find MST using Kruskal's algorithm
  const findMST = useCallback(() => {
    const sortedEdges = [...edges].sort((a, b) => a.weight - b.weight);
    const parent: number[] = nodes.map((_, i) => i);
    const rank: number[] = new Array(nodes.length).fill(0);
    
    const find = (x: number): number => {
      if (parent[x] !== x) {
        parent[x] = find(parent[x]);
      }
      return parent[x];
    };
    
    const union = (x: number, y: number): boolean => {
      const rootX = find(x);
      const rootY = find(y);
      
      if (rootX === rootY) return false;
      
      if (rank[rootX] < rank[rootY]) {
        parent[rootX] = rootY;
      } else if (rank[rootX] > rank[rootY]) {
        parent[rootY] = rootX;
      } else {
        parent[rootY] = rootX;
        rank[rootX]++;
      }
      
      return true;
    };
    
    const mstEdgeIndices = new Set<number>();
    let mstWeight = 0;
    
    sortedEdges.forEach((edge, originalIndex) => {
      const edgeIndex = edges.findIndex(e => 
        e.from === edge.from && e.to === edge.to && e.weight === edge.weight
      );
      
      if (union(edge.from, edge.to)) {
        mstEdgeIndices.add(edgeIndex);
        mstWeight += edge.weight;
      }
    });
    
    setMstEdges(mstEdgeIndices);
    setMstCost(mstWeight);
  }, [edges, nodes]);

  // Check if current selection forms a valid spanning tree
  const checkSpanningTree = useCallback((selectedIndices: Set<number>) => {
    if (selectedIndices.size !== nodes.length - 1) return false;
    
    // Check if all nodes are connected
    const visited = new Set<number>();
    const adjacencyList: number[][] = nodes.map(() => []);
    
    // Build adjacency list from selected edges
    selectedIndices.forEach(edgeIndex => {
      const edge = edges[edgeIndex];
      adjacencyList[edge.from].push(edge.to);
      adjacencyList[edge.to].push(edge.from);
    });
    
    // DFS to check connectivity
    const dfs = (node: number) => {
      visited.add(node);
      adjacencyList[node].forEach(neighbor => {
        if (!visited.has(neighbor)) {
          dfs(neighbor);
        }
      });
    };
    
    dfs(0);
    return visited.size === nodes.length;
  }, [nodes, edges]);

  // Calculate total cost of selected edges
  const calculateTotalCost = useCallback((selectedIndices: Set<number>) => {
    return Array.from(selectedIndices).reduce((sum, edgeIndex) => {
      return sum + edges[edgeIndex].weight;
    }, 0);
  }, [edges]);

  // Draw network
  const drawNetwork = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw edges
    edges.forEach((edge, index) => {
      const fromNode = nodes[edge.from];
      const toNode = nodes[edge.to];
      
      let strokeColor = '#64748b';
      let lineWidth = 2;
      
      if (showMST && mstEdges.has(index)) {
        strokeColor = '#22c55e';
        lineWidth = 4;
      } else if (selectedEdges.has(index)) {
        strokeColor = '#3b82f6';
        lineWidth = 3;
      }
      
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(fromNode.x, fromNode.y);
      ctx.lineTo(toNode.x, toNode.y);
      ctx.stroke();
      
      // Draw weight
      const midX = (fromNode.x + toNode.x) / 2;
      const midY = (fromNode.y + toNode.y) / 2;
      
      const rectSize = isMobile ? 20 : 24;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(midX - rectSize/2, midY - 8, rectSize, 16);
      
      ctx.fillStyle = 'white';
      ctx.font = `${isMobile ? 10 : 12}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(edge.weight.toString(), midX, midY + 4);
    });
    
    // Draw nodes
    nodes.forEach(node => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
      ctx.fillStyle = '#374151';
      ctx.fill();
      
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw label
      ctx.fillStyle = 'white';
      ctx.font = `${Math.max(14, nodeRadius * 0.6)}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(node.label, node.x, node.y + 5);
    });
  }, [nodes, edges, selectedEdges, mstEdges, showMST, nodeRadius, isMobile]);

  // Handle canvas click
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Find clicked edge
    let clickedEdgeIndex = -1;
    const clickThreshold = isMobile ? 15 : 10;
    
    edges.forEach((edge, index) => {
      const fromNode = nodes[edge.from];
      const toNode = nodes[edge.to];
      
      // Calculate distance from click point to line segment
      const A = x - fromNode.x;
      const B = y - fromNode.y;
      const C = toNode.x - fromNode.x;
      const D = toNode.y - fromNode.y;
      
      const dot = A * C + B * D;
      const lenSq = C * C + D * D;
      
      if (lenSq === 0) return;
      
      const param = dot / lenSq;
      
      let xx, yy;
      if (param < 0) {
        xx = fromNode.x;
        yy = fromNode.y;
      } else if (param > 1) {
        xx = toNode.x;
        yy = toNode.y;
      } else {
        xx = fromNode.x + param * C;
        yy = fromNode.y + param * D;
      }
      
      const dx = x - xx;
      const dy = y - yy;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= clickThreshold) {
        clickedEdgeIndex = index;
      }
    });
    
    if (clickedEdgeIndex !== -1) {
      if (!gameStarted) {
        setGameStarted(true);
        setStartTime(Date.now());
        setShowInstructions(false);
      }
      
      const newSelectedEdges = new Set(selectedEdges);
      
      if (newSelectedEdges.has(clickedEdgeIndex)) {
        newSelectedEdges.delete(clickedEdgeIndex);
      } else {
        newSelectedEdges.add(clickedEdgeIndex);
      }
      
      setSelectedEdges(newSelectedEdges);
      
      const cost = calculateTotalCost(newSelectedEdges);
      setTotalCost(cost);
      
      const isValidSpanningTree = checkSpanningTree(newSelectedEdges);
      setIsComplete(isValidSpanningTree);
    }
  };

  // Show MST solution
  const showMSTSolution = () => {
    setShowMST(true);
    findMST();
    setShowInstructions(false);
  };

  // Reset selection
  const resetSelection = () => {
    setSelectedEdges(new Set());
    setTotalCost(0);
    setIsComplete(false);
    setShowMST(false);
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

  // Initialize network on mount
  useEffect(() => {
    generateNetwork();
  }, [generateNetwork]);

  // Find MST when edges change
  useEffect(() => {
    if (edges.length > 0) {
      findMST();
    }
  }, [findMST]);

  // Draw network when it changes
  useEffect(() => {
    drawNetwork();
  }, [drawNetwork]);

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
              <Network className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-orange-400" />
              Network Connector
            </h1>
            <p className="text-sm sm:text-base text-slate-400">Build a Minimum Spanning Tree with lowest cost</p>
          </div>
          
          <div className="hidden sm:block w-24"></div>
        </div>

        {/* Instructions Banner */}
        {showInstructions && (
          <div className="mb-4 sm:mb-6 bg-orange-600/20 border border-orange-500/30 rounded-xl p-3 sm:p-4">
            <div className="flex items-start">
              <Info className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
              <div className="text-xs sm:text-sm text-orange-100">
                <p className="font-semibold mb-1">How to play:</p>
                <p>1. <strong>Click on connections</strong> (lines between nodes) to select them</p>
                <p>2. <strong>Goal:</strong> Connect all nodes using the minimum total cost</p>
                <p>3. <strong>You need exactly {nodes.length - 1} connections</strong> to connect all {nodes.length} nodes!</p>
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
              
              {/* Current Status */}
              <div className="text-center text-slate-400 text-xs sm:text-sm mb-4">
                <div className="flex items-center justify-center">
                  <MousePointer className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  <span>
                    Selected: <strong className="text-blue-400">{selectedEdges.size}</strong> connections, 
                    Need: <strong className="text-orange-400">{nodes.length - 1}</strong> to connect all nodes
                  </span>
                </div>
              </div>
              
              {/* Legend */}
              <div className="flex justify-center space-x-3 sm:space-x-6 text-xs sm:text-sm flex-wrap gap-y-2">
                <div className="flex items-center">
                  <div className="w-3 h-1 sm:w-4 sm:h-1 bg-slate-500 mr-1 sm:mr-2"></div>
                  <span className="text-slate-300">Available</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-1 sm:w-4 sm:h-1 bg-blue-500 mr-1 sm:mr-2"></div>
                  <span className="text-slate-300">Selected</span>
                </div>
                {showMST && (
                  <div className="flex items-center">
                    <div className="w-3 h-1 sm:w-4 sm:h-1 bg-green-500 mr-1 sm:mr-2"></div>
                    <span className="text-slate-300">Optimal Solution</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Control Panel */}
          <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
            {/* Controls */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Actions</h3>
              <div className="space-y-2 sm:space-y-3">
                <button
                  onClick={showMSTSolution}
                  className="w-full flex items-center justify-center px-3 sm:px-4 py-2 sm:py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors text-sm sm:text-base"
                >
                  <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Show Optimal Solution
                </button>
                
                <button
                  onClick={resetSelection}
                  className="w-full flex items-center justify-center px-3 sm:px-4 py-2 sm:py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors text-sm sm:text-base"
                >
                  <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Clear Selection
                </button>
                
                <button
                  onClick={generateNetwork}
                  className="w-full flex items-center justify-center px-3 sm:px-4 py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors text-sm sm:text-base"
                >
                  <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Generate New Network
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
                  <span className="text-slate-300 text-sm sm:text-base">Connections</span>
                  <span className="text-blue-400 font-mono text-sm sm:text-base">{selectedEdges.size}/{nodes.length - 1}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm sm:text-base">Your Cost</span>
                  <span className="text-orange-400 font-mono text-sm sm:text-base">{totalCost}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm sm:text-base">Optimal Cost</span>
                  <span className="text-green-400 font-mono text-sm sm:text-base">{mstCost}</span>
                </div>
                
                {isComplete && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 text-sm sm:text-base">Efficiency</span>
                    <span className="text-purple-400 font-mono text-sm sm:text-base">
                      {totalCost > 0 ? Math.round((mstCost / totalCost) * 100) : 0}%
                    </span>
                  </div>
                )}
              </div>
              
              {isComplete && (
                <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-orange-600/20 border border-orange-500/30 rounded-lg">
                  <div className="flex items-center text-orange-400 text-sm sm:text-base">
                    <Trophy className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    <span className="font-semibold">
                      {totalCost === mstCost ? 'Perfect! Minimum cost achieved!' : 'Network connected successfully!'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Algorithm Info */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">Minimum Spanning Tree</h3>
              <div className="text-xs sm:text-sm text-slate-300 space-y-1 sm:space-y-2">
                <p><strong className="text-orange-400">Goal:</strong> Connect all nodes with minimum cost</p>
                <p><strong className="text-orange-400">Rule:</strong> Use exactly N-1 edges for N nodes</p>
                <p><strong className="text-orange-400">Strategy:</strong> Choose cheapest connections first</p>
                <p className="text-xs text-slate-400 mt-2 sm:mt-3 pt-2 border-t border-white/10">
                  MST algorithms like Kruskal's and Prim's are used in network design, circuit design, and clustering.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkConnector;