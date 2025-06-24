import React, { useState } from 'react';
import HomePage from './components/HomePage';
import GameMenu from './components/GameMenu';
import GameRoom from './components/GameRoom';
import { GameType } from './types/Game';

export type Screen = 'home' | 'menu' | 'game';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);

  const handleGameSelect = (game: GameType) => {
    setSelectedGame(game);
    setCurrentScreen('game');
  };

  const handleBackToMenu = () => {
    setCurrentScreen('menu');
    setSelectedGame(null);
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
    setSelectedGame(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {currentScreen === 'home' && (
        <HomePage onStartPlaying={() => setCurrentScreen('menu')} />
      )}
      
      {currentScreen === 'menu' && (
        <GameMenu 
          onGameSelect={handleGameSelect}
          onBackToHome={handleBackToHome}
        />
      )}
      
      {currentScreen === 'game' && selectedGame && (
        <GameRoom 
          gameType={selectedGame}
          onBackToMenu={handleBackToMenu}
        />
      )}
    </div>
  );
}

export default App;