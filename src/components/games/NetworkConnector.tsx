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

  // Generate random network
  const generateNetwork = useCallback(() => {
    const nodeCount = 6;
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    
    // Create nodes in a roughly circular pattern
    const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * 2 * Math.PI;
      const centerX = CANVAS_WIDTH / 2;
      const centerY = CANVAS_HEIGHT / 2;
      const radius = 120 + Math.random() * 40;
      
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
        const weight = Math.floor(distance / 10) + Math.floor(Math.random() * 5) + 1;
        
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
  }, []);

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
      
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(midX - 12, midY - 8, 24, 16);
      
      ctx.fillStyle = 'white';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(edge.weight.toString(), midX, midY + 4);
    });
    
    // Draw nodes
    nodes.forEach(node => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, NODE_RADIUS, 0, 2 * Math.PI);
      ctx.fillStyle = '#374151';
      ctx.fill();
      
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw label
      ctx.fillStyle = 'white';
      ctx.font = '16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(node.label, node.x, node.y + 5);
    });
  }, [nodes, edges, selectedEdges, mstEdges, showMST]);

  // Handle canvas click
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Find clicked edge
    let clickedEdgeIndex = -1;
    const clickThreshold = 10;
    
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
              <Network className="w-8 h-8 mr-3 text-orange-400" />
              Network Connector
            </h1>
            <p className="text-slate-400">Build a Minimum Spanning Tree with lowest cost</p>
          </div>
          
          <div className="w-24"></div>
        </div>

        {/* Instructions Banner */}
        {showInstructions && (
          <div className="mb-6 bg-orange-600/20 border border-orange-500/30 rounded-xl p-4">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-orange-400 mr-3 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-100">
                <p className="font-semibold mb-1">How to play:</p>
                <p>1. <strong>Click on connections</strong> (lines between nodes) to select them</p>
                <p>2. <strong>Goal:</strong> Connect all nodes using the minimum total cost</p>
                <p>3. <strong>You need exactly 5 connections</strong> to connect all 6 nodes!</p>
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
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  className="border border-white/20 rounded-lg cursor-pointer hover:border-white/40 transition-colors"
                  onClick={handleCanvasClick}
                />
              </div>
              
              {/* Current Status */}
              <div className="text-center text-slate-400 text-sm mb-4">
                <div className="flex items-center justify-center">
                  <MousePointer className="w-4 h-4 mr-2" />
                  <span>
                    Selected: <strong className="text-blue-400">{selectedEdges.size}</strong> connections, 
                    Need: <strong className="text-orange-400">{nodes.length - 1}</strong> to connect all nodes
                  </span>
                </div>
              </div>
              
              {/* Legend */}
              <div className="flex justify-center space-x-6 text-sm flex-wrap gap-y-2">
                <div className="flex items-center">
                  <div className="w-4 h-1 bg-slate-500 mr-2"></div>
                  <span className="text-slate-300">Available</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-1 bg-blue-500 mr-2"></div>
                  <span className="text-slate-300">Selected</span>
                </div>
                {showMST && (
                  <div className="flex items-center">
                    <div className="w-4 h-1 bg-green-500 mr-2"></div>
                    <span className="text-slate-300">Optimal Solution</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Control Panel */}
          <div className="space-y-6">
            {/* Controls */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={showMSTSolution}
                  className="w-full flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Show Optimal Solution
                </button>
                
                <button
                  onClick={resetSelection}
                  className="w-full flex items-center justify-center px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Clear Selection
                </button>
                
                <button
                  onClick={generateNetwork}
                  className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Generate New Network
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Progress</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 flex items-center">
                    <Timer className="w-4 h-4 mr-2" />
                    Time
                  </span>
                  <span className="text-white font-mono">{timeElapsed}s</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Connections</span>
                  <span className="text-blue-400 font-mono">{selectedEdges.size}/{nodes.length - 1}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Your Cost</span>
                  <span className="text-orange-400 font-mono">{totalCost}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Optimal Cost</span>
                  <span className="text-green-400 font-mono">{mstCost}</span>
                </div>
                
                {isComplete && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Efficiency</span>
                    <span className="text-purple-400 font-mono">
                      {totalCost > 0 ? Math.round((mstCost / totalCost) * 100) : 0}%
                    </span>
                  </div>
                )}
              </div>
              
              {isComplete && (
                <div className="mt-4 p-3 bg-orange-600/20 border border-orange-500/30 rounded-lg">
                  <div className="flex items-center text-orange-400">
                    <Trophy className="w-4 h-4 mr-2" />
                    <span className="font-semibold">
                      {totalCost === mstCost ? 'Perfect! Minimum cost achieved!' : 'Network connected successfully!'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Algorithm Info */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-3">Minimum Spanning Tree</h3>
              <div className="text-sm text-slate-300 space-y-2">
                <p><strong className="text-orange-400">Goal:</strong> Connect all nodes with minimum cost</p>
                <p><strong className="text-orange-400">Rule:</strong> Use exactly N-1 edges for N nodes</p>
                <p><strong className="text-orange-400">Strategy:</strong> Choose cheapest connections first</p>
                <p className="text-xs text-slate-400 mt-3 pt-2 border-t border-white/10">
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