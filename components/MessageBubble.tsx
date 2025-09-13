import React, { useMemo } from 'react';
import { Message, Sender, LoreEntry } from '../types';

interface MessageBubbleProps {
  message: Message;
  animationClass?: string;
  loreEntries?: LoreEntry[];
  onLoreTermClick?: (term: string) => void;
  onSpeak?: (text: string, messageId: string) => void;
  isSpeaking?: boolean;
  speakingMessageId?: string | null;
}

const parseTextWithLore = (
  text: string, 
  loreEntries?: LoreEntry[], 
  onLoreTermClick?: (term: string) => void
): React.ReactNode => {
  if (!loreEntries || loreEntries.length === 0 || !onLoreTermClick) {
    return text;
  }

  // Create a map for quick, case-insensitive lookup of the original term casing
  const termsMap = new Map<string, string>();
  loreEntries.forEach(entry => termsMap.set(entry.term.toLowerCase(), entry.term));
  
  // Sort terms by length descending to match longer phrases first
  const sortedTerms = [...termsMap.keys()].sort((a, b) => b.length - a.length);
  
  if (sortedTerms.length === 0) {
    return text;
  }

  // Escape special regex characters in terms
  const escapedTerms = sortedTerms.map(term => term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
  
  const pattern = new RegExp(`\\b(${escapedTerms.join('|')})\\b`, 'gi');
  const parts = text.split(pattern);

  return parts.map((part, index) => {
    const lowerPart = part.toLowerCase();
    if (termsMap.has(lowerPart)) {
      const originalTerm = termsMap.get(lowerPart)!;
      return (
        <button
          key={index}
          onClick={() => onLoreTermClick(originalTerm)}
          className="text-yellow-300 hover:text-yellow-200 font-semibold border-b border-yellow-300/50 hover:border-yellow-200 transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-yellow-400 rounded-sm px-0.5"
        >
          {part}
        </button>
      );
    }
    return part;
  });
};

const SpeakerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
  </svg>
);


const MessageBubble: React.FC<MessageBubbleProps> = ({ message, animationClass, loreEntries, onLoreTermClick, onSpeak, isSpeaking, speakingMessageId }) => {
  const isUser = message.sender === Sender.USER;

  const bubbleClasses = isUser
    ? 'bg-indigo-800 self-end'
    : 'bg-gray-800 self-start';
  
  const textClasses = isUser ? 'text-white' : 'text-gray-300';

  const parsedText = useMemo(() => parseTextWithLore(message.text, loreEntries, onLoreTermClick), [message.text, loreEntries, onLoreTermClick]);
  
  const isThisMessageSpeaking = !!(isSpeaking && speakingMessageId === message.id);

  return (
    <div className={`w-full flex ${isUser ? 'justify-end' : 'justify-start'} animate-message-in`}>
      <div
        className={`max-w-xl lg:max-w-3xl rounded-xl p-4 my-2 shadow-md transition-shadow duration-500 ${bubbleClasses} ${animationClass || ''}`}
      >
        <div className="flex items-start space-x-3">
          <div className="flex-1">
            <p className={`whitespace-pre-wrap ${textClasses}`}>{parsedText}</p>
          </div>
          {onSpeak && message.text && (
            <button
              onClick={() => onSpeak(message.text, message.id)}
              className={`flex-shrink-0 p-1 rounded-full transition-colors duration-200 ${
                isThisMessageSpeaking
                  ? 'text-indigo-300 bg-indigo-900/80 animate-pulse'
                  : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
              }`}
              aria-label={isThisMessageSpeaking ? 'Stop speech' : 'Read text aloud'}
            >
              <SpeakerIcon />
            </button>
          )}
        </div>

        {message.imageUrl && (
          <div className="mt-4 border-2 border-gray-700 rounded-lg overflow-hidden animate-fade-in">
             <img 
              src={message.imageUrl} 
              alt="A vision of creation." 
              className="w-full h-auto object-cover" 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;