import React, { useEffect, useRef } from 'react';
import { LoreEntry } from '../types';

interface LoreEncyclopediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: LoreEntry[];
  scrollToTerm?: string | null;
}

const LoreEncyclopediaModal: React.FC<LoreEncyclopediaModalProps> = ({ isOpen, onClose, entries, scrollToTerm }) => {
  const entryRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

  useEffect(() => {
    if (isOpen && scrollToTerm) {
      const entryElement = entryRefs.current.get(scrollToTerm);
      if (entryElement) {
        // Use a timeout to ensure the modal animation is complete before scrolling
        setTimeout(() => {
          entryElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          entryElement.classList.add('highlight-entry');
          setTimeout(() => {
            entryElement.classList.remove('highlight-entry');
          }, 2000); // Highlight for 2 seconds
        }, 150); // Delay should be less than modal animation
      }
    }
  }, [isOpen, scrollToTerm]);


  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lore-title"
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4 animate-modal-in"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col border border-indigo-500/30"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <header className="p-4 border-b border-gray-700 flex justify-between items-center sticky top-0 bg-gray-800">
          <h2 id="lore-title" className="text-2xl font-bold text-indigo-400">Lore Encyclopedia</h2>
          <button
            onClick={onClose}
            aria-label="Close encyclopedia"
            className="text-gray-400 hover:text-white transition-colors text-2xl"
          >
            &times;
          </button>
        </header>
        <div className="overflow-y-auto p-6 space-y-6">
          {entries.length > 0 ? (
            entries.map((entry, index) => (
              <div 
                key={entry.term}
                // FIX: The ref callback function was implicitly returning a value (the Map instance from .set()), which is not allowed for a ref prop.
                // By wrapping the call in curly braces, it becomes a statement block with an implicit `undefined` return, satisfying the ref's type requirement.
                ref={el => { entryRefs.current.set(entry.term, el); }}
                className="animate-fade-in" 
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <h3 className="text-xl font-semibold text-gray-100 mb-1">{entry.term}</h3>
                <p className="text-gray-300 whitespace-pre-wrap">{entry.description}</p>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400 py-10">
              <p className="text-lg">The annals of creation are yet to be written.</p>
              <p>Your actions will shape the lore of this universe.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoreEncyclopediaModal;
