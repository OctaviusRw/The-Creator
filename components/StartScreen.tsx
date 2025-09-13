import React, { useState } from 'react';

interface StartScreenProps {
  onStart: (seed: string) => void;
  isLoading: boolean;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart, isLoading }) => {
  const [seed, setSeed] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    onStart(seed.trim());
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center animate-fade-in p-4 z-10">
      <div className="text-center bg-gray-900/50 backdrop-blur-sm p-8 rounded-2xl border border-indigo-500/20 shadow-2xl shadow-indigo-900/50">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-wider text-indigo-400 mb-2">The Creator</h1>
        <p className="text-lg text-gray-300 mb-8">Plant a seed, and watch a universe grow.</p>
        
        <form onSubmit={handleSubmit} className="flex flex-col items-center w-full max-w-md mx-auto">
          <label htmlFor="seed-input" className="sr-only">Seed of Creation</label>
          <input
            id="seed-input"
            type="text"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            placeholder="Enter a word or phrase (e.g., 'Eternal Echo')"
            disabled={isLoading}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg p-4 text-white text-center placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow duration-200 disabled:opacity-50 text-lg mb-4"
          />
          <button
            type="submit"
            disabled={isLoading || !seed.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-6 rounded-lg text-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-gray-900 transform hover:scale-105"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </span>
            ) : (
              'Begin Creation'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StartScreen;
