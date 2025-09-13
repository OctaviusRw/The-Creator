import React from 'react';

interface MemoryDisplayProps {
  memory: string[];
}

const MemoryDisplay: React.FC<MemoryDisplayProps> = ({ memory }) => {
  const latestMemory = memory && memory.length > 0 ? memory[memory.length - 1] : null;

  // Use the latest memory text as a key to force a re-render and re-trigger the animation when it changes.
  const animationKey = latestMemory || 'initial';

  return (
    <div className="text-center mt-1 h-6 overflow-hidden"> {/* Fixed height to prevent layout shift */}
      {latestMemory ? (
        <p key={animationKey} className="text-sm text-gray-400 italic animate-fade-in truncate" title={latestMemory}>
          <span className="font-semibold text-gray-300 not-italic">Latest Memory:</span> {latestMemory}
        </p>
      ) : (
        <p className="text-sm text-gray-500 italic">The story is yet to be written.</p>
      )}
    </div>
  );
};

export default MemoryDisplay;
