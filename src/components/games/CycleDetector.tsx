import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, RotateCcw, Play, Timer, Trophy, AlertTriangle, CheckCircle, Info, MousePointer } from 'lucide-react';

interface CycleDetectorProps {
  onBackToMenu: () => void;
}

interface Node {
  id: number;
  x: number;
  y: number;
  label: string;
  color: 'white' | 'gray' | 'black'; // For DFS coloring
}

interface Edge {
  from: number;
  to: number;
  isInCycle: boolean;
}

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 400;
const NODE_RADIUS = 25;

// Mobile responsive canvas dimensions
const MOBILE_CANVAS_WIDTH = 350;
const MOBILE_CANVAS_HEIGHT = 280;
const MOBILE_NODE_RADIUS = 20;

const CycleDetector: React.FC<CycleDetectorProps> = ({ onBackToMenu }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isDirected, setIsDirected] = useState(true);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [hasCycle, setHasCycle] = useState(false);
  const [cycleEdges, setCycleEdges] = useState<Set<number>>(new Set());
  const [isRunning, setIsRunning] = useState(false);
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

  // Generate initial nodes
  const generateNodes = useCallback(() => {
    const nodeCount = isMobile ? 4 : 5;
    const newNodes: Node[] = [];
    const labels = ['A', 'B', 'C', 'D', 'E'];
    
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * 2 * Math.PI;
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      const radius = isMobile ? 80 : 120;
      
      newNodes.push({
        id: i,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        label: labels[i],
        color: 'white'
      });
    }
    
    setNodes(newNodes);
    setEdges([]);
    setSelectedNode(null);
    setHasCycle(false);
    setCycleEdges(new Set());
    setTimeElapsed(0);
    setStartTime(null);
    setGameStarted(false);
    setShowInstructions(true);
  }, [canvasWidth, canvasHeight, isMobile]);

  // Detect cycle using DFS
  const detectCycle = useCallback(async () => {
    if (edges.length === 0) return;
    
    setIsRunning(true);
    setShowInstructions(false);
    
    // Reset node colors
    const newNodes = nodes.map(node => ({ ...node, color: 'white' as const }));
    setNodes(newNodes);
    
    const visited = new Set<number>();
    const recursionStack = new Set<number>();
    const cycleEdgeSet = new Set<number>();
    let foundCycle = false;
    
    // Build adjacency list
    const adjacencyList: number[][] = Array(nodes.length).fill(null).map(() => []);
    const edgeMap = new Map<string, number>();
    
    edges.forEach((edge, index) => {
      adjacencyList[edge.from].push(edge.to);
      edgeMap.set(`${edge.from}-${edge.to}`, index);
      
      if (!isDirected) {
        adjacencyList[edge.to].push(edge.from);
        edgeMap.set(`${edge.to}-${edge.from}`, index);
      }
    });
    
    const dfs = async (nodeId: number, parent: number = -1): Promise<boolean> => {
      // Color node gray (being processed)
      newNodes[nodeId].color = 'gray';
      setNodes([...newNodes]);
      await new Promise(resolve => setTimeout(resolve, isMobile ? 800 : 500));
      
      visited.add(nodeId);
      recursionStack.add(nodeId);
      
      // Check all adjacent nodes
      for (const neighbor of adjacencyList[nodeId]) {
        if (isDirected) {
          // For directed graphs, check if neighbor is in recursion stack
          if (recursionStack.has(neighbor)) {
            const edgeIndex = edgeMap.get(`${nodeId}-${neighbor}`);
            if (edgeIndex !== undefined) {
              cycleEdgeSet.add(edgeIndex);
            }
            foundCycle = true;
            return true;
          }
          
          if (!visited.has(neighbor)) {
            if (await dfs(neighbor, nodeId)) {
              return true;
            }
          }
        } else {
          // For undirected graphs, ignore the edge to parent
          if (neighbor !== parent) {
            if (visited.has(neighbor)) {
              const edgeIndex = edgeMap.get(`${nodeId}-${neighbor}`) || edgeMap.get(`${neighbor}-${nodeId}`);
              if (edgeIndex !== undefined) {
                cycleEdgeSet.add(edgeIndex);
              }
              foundCycle = true;
              return true;
            }
            
            if (await dfs(neighbor, nodeId)) {
              return true;
            }
          }
        }
      }
      
      // Color node black (finished processing)
      newNodes[nodeId].color = 'black';
      setNodes([...newNodes]);
      recursionStack.delete(nodeId);
      
      return false;
    };
    
    // Run DFS from all unvisited nodes
    for (let i = 0; i < nodes.length; i++) {
      if (!visited.has(i)) {
        if (await dfs(i)) {
          break;
        }
      }
    }
    
    setHasCycle(foundCycle);
    setCycleEdges(cycleEdgeSet);
    setIsRunning(false);
  }, [nodes, edges, isDirected, isMobile]);

  // Draw graph
  const drawGraph = useCallback(() => {
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
      
      if (cycleEdges.has(index)) {
        strokeColor = '#ef4444';
        lineWidth = 4;
      }
      
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(fromNode.x, fromNode.y);
      ctx.lineTo(toNode.x, toNode.y);
      ctx.stroke();
      
      // Draw arrow for directed edges
      if (isDirected) {
        const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x);
        const arrowLength = isMobile ? 12 : 15;
        const arrowAngle = Math.PI / 6;
        
        // Calculate arrow position (on edge of target node)
        const arrowX = toNode.x - Math.cos(angle) * nodeRadius;
        const arrowY = toNode.y - Math.sin(angle) * nodeRadius;
        
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
          arrowX - arrowLength * Math.cos(angle - arrowAngle),
          arrowY - arrowLength * Math.sin(angle - arrowAngle)
        );
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
          arrowX - arrowLength * Math.cos(angle + arrowAngle),
          arrowY - arrowLength * Math.sin(angle + arrowAngle)
        );
        ctx.stroke();
      }
    });
    
    // Draw nodes
    nodes.forEach(node => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
      
      // Color based on DFS state
      switch (node.color) {
        case 'white':
          ctx.fillStyle = '#374151';
          break;
        case 'gray':
          ctx.fillStyle = '#fbbf24';
          break;
        case 'black':
          ctx.fillStyle = '#22c55e';
          break;
      }
      
      ctx.fill();
      
      // Highlight selected node
      ctx.strokeStyle = selectedNode === node.id ? '#3b82f6' : '#9ca3af';
      ctx.lineWidth = selectedNode === node.id ? 3 : 2;
      ctx.stroke();
      
      // Draw label
      ctx.fillStyle = 'white';
      ctx.font = `${Math.max(14, nodeRadius * 0.6)}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(node.label, node.x, node.y + 5);
    });
  }, [nodes, edges, selectedNode, cycleEdges, isDirected, nodeRadius, isMobile]);

  // Handle canvas click
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isRunning) return;
    
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
      
      if (selectedNode === null) {
        setSelectedNode(clickedNode.id);
      } else if (selectedNode === clickedNode.id) {
        setSelectedNode(null);
      } else {
        // Add edge between selected node and clicked node
        const edgeExists = edges.some(edge => 
          (edge.from === selectedNode && edge.to === clickedNode.id) ||
          (!isDirected && edge.from === clickedNode.id && edge.to === selectedNode)
        );
        
        if (!edgeExists) {
          const newEdge: Edge = {
            from: selectedNode,
            to: clickedNode.id,
            isInCycle: false
          };
          
          setEdges([...edges, newEdge]);
        }
        
        setSelectedNode(null);
      }
    }
  };

  // Clear graph
  const clearGraph = () => {
    setEdges([]);
    setSelectedNode(null);
    setHasCycle(false);
    setCycleEdges(new Set());
    
    // Reset node colors
    const newNodes = nodes.map(node => ({ ...node, color: 'white' as const }));
    setNodes(newNodes);
    setShowInstructions(true);
  };

  // Toggle graph type
  const toggleGraphType = () => {
    setIsDirected(!isDirected);
    clearGraph();
  };

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (gameStarted && startTime) {
      interval = setInterval(() => {
        setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [gameStarted, startTime]);

  // Initialize nodes on mount
  useEffect(() => {
    generateNodes();
  }, [generateNodes]);

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
              <RotateCcw className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-red-400" />
              Cycle Detective
            </h1>
            <p className="text-sm sm:text-base text-slate-400">Find cycles in graphs using DFS algorithm</p>
          </div>
          
          <div className="hidden sm:block w-24"></div>
        </div>

        {/* Instructions Banner */}
        {showInstructions && (
          <div className="mb-4 sm:mb-6 bg-red-600/20 border border-red-500/30 rounded-xl p-3 sm:p-4">
            <div className="flex items-start">
              <Info className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
              <div className="text-xs sm:text-sm text-red-100">
                <p className="font-semibold mb-1">How to play:</p>
                <p>1. <strong>Click a node</strong> to select it (it will turn blue)</p>
                <p>2. <strong>Click another node</strong> to create a connection</p>
                <p>3. <strong>Build your graph</strong> and click "Detect Cycles" to see if there are any loops!</p>
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
              
              {/* Current Action Indicator */}
              <div className="text-center text-slate-400 text-xs sm:text-sm mb-4">
                <div className="flex items-center justify-center">
                  <MousePointer className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  {selectedNode !== null ? (
                    <span className="text-blue-400">
                      Selected: <strong>{nodes[selectedNode]?.label}</strong> - Click another node to connect
                    </span>
                  ) : (
                    <span>Click a node to start connecting</span>
                  )}
                </div>
              </div>
              
              {/* Legend */}
              <div className="flex justify-center space-x-3 sm:space-x-6 text-xs sm:text-sm flex-wrap gap-y-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-slate-600 rounded-full mr-1 sm:mr-2"></div>
                  <span className="text-slate-300">Unvisited</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-500 rounded-full mr-1 sm:mr-2"></div>
                  <span className="text-slate-300">Processing</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full mr-1 sm:mr-2"></div>
                  <span className="text-slate-300">Finished</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-1 sm:w-4 sm:h-1 bg-red-500 mr-1 sm:mr-2"></div>
                  <span className="text-slate-300">Cycle Edge</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-blue-500 rounded-full mr-1 sm:mr-2"></div>
                  <span className="text-slate-300">Selected</span>
                </div>
              </div>
              
              {/* Cycle Status */}
              {edges.length > 0 && !isRunning && (
                <div className="mt-4 text-center">
                  {hasCycle ? (
                    <div className="inline-flex items-center px-3 sm:px-4 py-2 bg-red-600/20 border border-red-500/30 rounded-lg text-red-400 text-sm sm:text-base">
                      <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      <span className="font-semibold">Cycle Detected! Red edges form a loop.</span>
                    </div>
                  ) : edges.length > 0 ? (
                    <div className="inline-flex items-center px-3 sm:px-4 py-2 bg-green-600/20 border border-green-500/30 rounded-lg text-green-400 text-sm sm:text-base">
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      <span className="font-semibold">No Cycles Found - Graph is acyclic!</span>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {/* Control Panel */}
          <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
            {/* Graph Type */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Graph Type</h3>
              <button
                onClick={toggleGraphType}
                disabled={isRunning}
                className={`w-full p-2 sm:p-3 rounded-lg border transition-all text-sm sm:text-base ${
                  isDirected
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg'
                    : 'bg-purple-600 border-purple-500 text-white shadow-lg'
                }`}
              >
                <div className="font-semibold">
                  {isDirected ? 'Directed Graph' : 'Undirected Graph'}
                </div>
                <div className="text-xs mt-1 opacity-75">
                  {isDirected ? 'Arrows show direction' : 'Connections work both ways'}
                </div>
              </button>
            </div>

            {/* Controls */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Actions</h3>
              <div className="space-y-2 sm:space-y-3">
                <button
                  onClick={detectCycle}
                  disabled={isRunning || edges.length === 0}
                  className="w-full flex items-center justify-center px-3 sm:px-4 py-2 sm:py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white rounded-lg font-semibold transition-colors text-sm sm:text-base"
                >
                  <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  {isRunning ? 'Detecting...' : 'Detect Cycles'}
                </button>
                
                <button
                  onClick={clearGraph}
                  disabled={isRunning}
                  className="w-full flex items-center justify-center px-3 sm:px-4 py-2 sm:py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 text-white rounded-lg font-semibold transition-colors text-sm sm:text-base"
                >
                  <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Clear All Edges
                </button>
                
                <button
                  onClick={generateNodes}
                  disabled={isRunning}
                  className="w-full flex items-center justify-center px-3 sm:px-4 py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg font-semibold transition-colors text-sm sm:text-base"
                >
                  <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Reset Everything
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Graph Info</h3>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 flex items-center text-sm sm:text-base">
                    <Timer className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Time
                  </span>
                  <span className="text-white font-mono text-sm sm:text-base">{timeElapsed}s</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm sm:text-base">Nodes</span>
                  <span className="text-blue-400 font-mono text-sm sm:text-base">{nodes.length}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm sm:text-base">Connections</span>
                  <span className="text-purple-400 font-mono text-sm sm:text-base">{edges.length}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm sm:text-base">Type</span>
                  <span className="text-slate-400 font-mono text-xs sm:text-sm">
                    {isDirected ? 'Directed' : 'Undirected'}
                  </span>
                </div>
              </div>
              
              {hasCycle && (
                <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-red-600/20 border border-red-500/30 rounded-lg">
                  <div className="flex items-center text-red-400 text-sm sm:text-base">
                    <Trophy className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    <span className="font-semibold">Cycle Found!</span>
                  </div>
                </div>
              )}
            </div>

            {/* Algorithm Info */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">How It Works</h3>
              <div className="text-xs sm:text-sm text-slate-300 space-y-1 sm:space-y-2">
                <p><strong className="text-yellow-400">Gray nodes:</strong> Currently exploring</p>
                <p><strong className="text-green-400">Green nodes:</strong> Finished exploring</p>
                <p><strong className="text-red-400">Red edges:</strong> Create a cycle</p>
                <p className="text-xs text-slate-400 mt-2 sm:mt-3 pt-2 border-t border-white/10">
                  {isDirected 
                    ? "A cycle exists if we find a back edge to a gray node during DFS traversal."
                    : "A cycle exists if we visit a node that's already been visited (excluding parent)."
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CycleDetector;