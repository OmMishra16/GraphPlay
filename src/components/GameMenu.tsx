import React from 'react';
import { ArrowLeft, Zap, MapPin, Palette, Network, RotateCcw } from 'lucide-react';
import { GameType, GameInfo } from '../types/Game';

interface GameMenuProps {
  onGameSelect: (game: GameType) => void;
  onBackToHome: () => void;
}

const games: GameInfo[] = [
  {
    id: 'maze-solver',
    title: 'Maze Solver',
    description: 'Navigate through mazes using BFS and DFS algorithms. Compare their approaches and efficiency.',
    algorithm: 'BFS & DFS',
    difficulty: 'Easy',
    icon: 'zap',
    color: 'blue',
    gradient: 'from-blue-500 to-blue-600'
  },
  {
    id: 'path-finder',
    title: 'Path Finder',
    description: 'Find the shortest path between points using Dijkstra\'s algorithm on weighted graphs.',
    algorithm: 'Dijkstra\'s',
    difficulty: 'Medium',
    icon: 'map-pin',
    color: 'teal',
    gradient: 'from-teal-500 to-teal-600'
  },
  {
    id: 'graph-coloring',
    title: 'Graph Coloring',
    description: 'Color vertices so no adjacent vertices share the same color. Master greedy algorithms.',
    algorithm: 'Greedy Coloring',
    difficulty: 'Medium',
    icon: 'palette',
    color: 'purple',
    gradient: 'from-purple-500 to-purple-600'
  },
  {
    id: 'network-connector',
    title: 'Network Connector',
    description: 'Connect all nodes with minimum cost using Minimum Spanning Tree algorithms.',
    algorithm: 'MST (Prim/Kruskal)',
    difficulty: 'Hard',
    icon: 'network',
    color: 'orange',
    gradient: 'from-orange-500 to-orange-600'
  },
  {
    id: 'cycle-detector',
    title: 'Cycle Detective',
    description: 'Detect cycles in graphs and understand the mathematics behind cycle detection.',
    algorithm: 'DFS Cycle Detection',
    difficulty: 'Hard',
    icon: 'rotate-ccw',
    color: 'red',
    gradient: 'from-red-500 to-red-600'
  }
];

const GameMenu: React.FC<GameMenuProps> = ({ onGameSelect, onBackToHome }) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'zap': return <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-white" />;
      case 'map-pin': return <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-white" />;
      case 'palette': return <Palette className="w-6 h-6 sm:w-8 sm:h-8 text-white" />;
      case 'network': return <Network className="w-6 h-6 sm:w-8 sm:h-8 text-white" />;
      case 'rotate-ccw': return <RotateCcw className="w-6 h-6 sm:w-8 sm:h-8 text-white" />;
      default: return <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-white" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-400 bg-green-400/10';
      case 'Medium': return 'text-yellow-400 bg-yellow-400/10';
      case 'Hard': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  return (
    <div className="min-h-screen px-4 sm:px-6 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 sm:mb-12 gap-4">
          <button
            onClick={onBackToHome}
            className="flex items-center text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Back to Home
          </button>
          
          <div className="text-center flex-1">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2">
              Choose Your Challenge
            </h1>
            <p className="text-sm sm:text-base text-slate-400">
              Select a game to start learning graph algorithms
            </p>
          </div>
          
          <div className="hidden sm:block w-24"></div> {/* Spacer for centering on desktop */}
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {games.map((game) => (
            <div
              key={game.id}
              onClick={() => onGameSelect(game.id)}
              className="group bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10 hover:border-white/20 cursor-pointer transition-all duration-300 hover:transform hover:scale-105"
            >
              {/* Icon */}
              <div className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r ${game.gradient} rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:shadow-lg transition-shadow`}>
                {getIcon(game.icon)}
              </div>

              {/* Content */}
              <div className="mb-3 sm:mb-4">
                <div className="flex items-start justify-between mb-2 gap-2">
                  <h3 className="text-lg sm:text-xl font-semibold text-white group-hover:text-blue-300 transition-colors leading-tight">
                    {game.title}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getDifficultyColor(game.difficulty)}`}>
                    {game.difficulty}
                  </span>
                </div>
                
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-3">
                  {game.description}
                </p>
                
                <div className="flex items-center text-xs sm:text-sm text-blue-300 font-medium">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-2 flex-shrink-0"></span>
                  <span className="truncate">{game.algorithm}</span>
                </div>
              </div>

              {/* Play Button */}
              <div className="pt-3 sm:pt-4 border-t border-white/10">
                <div className="text-center text-xs sm:text-sm text-slate-400 group-hover:text-white transition-colors">
                  Click to play →
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameMenu;