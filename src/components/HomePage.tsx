import React from 'react';
import { Play, BookOpen, Trophy, Users } from 'lucide-react';

interface HomePageProps {
  onStartPlaying: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onStartPlaying }) => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo and Title */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-teal-400 rounded-2xl mb-6 shadow-lg">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-6xl md:text-7xl font-bold text-white mb-4 tracking-tight">
              Graph<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">Play</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 font-light">
              Master Graph Algorithms Through Interactive Games
            </p>
          </div>

          {/* Description */}
          <div className="mb-12 max-w-2xl mx-auto">
            <p className="text-lg text-slate-400 leading-relaxed">
              Transform your understanding of graph algorithms with hands-on, visual learning experiences. 
              From BFS and DFS to Dijkstra's algorithm, master the concepts that power modern computing.
            </p>
          </div>

          {/* CTA Button */}
          <button
            onClick={onStartPlaying}
            className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            <Play className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" />
            Start Learning
          </button>
        </div>
      </div>

      {/* Features Section */}
      <div className="px-6 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Interactive Learning</h3>
              <p className="text-slate-400">
                Visualize algorithms in action with step-by-step execution and real-time feedback.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg flex items-center justify-center mb-4">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Gamified Progress</h3>
              <p className="text-slate-400">
                Earn points, unlock achievements, and track your mastery across different algorithms.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">For Everyone</h3>
              <p className="text-slate-400">
                Perfect for students, interview prep, or anyone curious about computer science fundamentals.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;