import React from 'react';
import { GameType } from '../types/Game';
import MazeSolver from './games/MazeSolver';
import PathFinder from './games/PathFinder';
import GraphColoring from './games/GraphColoring';
import NetworkConnector from './games/NetworkConnector';
import CycleDetector from './games/CycleDetector';

interface GameRoomProps {
  gameType: GameType;
  onBackToMenu: () => void;
}

const GameRoom: React.FC<GameRoomProps> = ({ gameType, onBackToMenu }) => {
  const renderGame = () => {
    switch (gameType) {
      case 'maze-solver':
        return <MazeSolver onBackToMenu={onBackToMenu} />;
      case 'path-finder':
        return <PathFinder onBackToMenu={onBackToMenu} />;
      case 'graph-coloring':
        return <GraphColoring onBackToMenu={onBackToMenu} />;
      case 'network-connector':
        return <NetworkConnector onBackToMenu={onBackToMenu} />;
      case 'cycle-detector':
        return <CycleDetector onBackToMenu={onBackToMenu} />;
      default:
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center text-white">
              <h3 className="text-xl mb-2">Game Not Found!</h3>
              <p className="text-slate-400">This game doesn't exist.</p>
              <button
                onClick={onBackToMenu}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Menu
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen">
      {renderGame()}
    </div>
  );
};

export default GameRoom;