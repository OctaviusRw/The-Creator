import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Message, Sender, LoreEntry, NarrativeState, SaveData } from './types';
import { getGameUpdateStream, generateSceneImage, extractLoreFromNarrative, getInitialGameUpdateStream, RateLimitError } from './services/geminiService';
import MessageBubble from './components/MessageBubble';
import ChoiceButton from './components/ChoiceButton';
import LoreEncyclopediaModal from './components/LoreEncyclopediaModal';
import StartScreen from './components/StartScreen';
import MemoryDisplay from './components/MemoryDisplay';
import { useParticleEffects } from './hooks/useParticleEffects';
import { useTextToSpeech } from './hooks/useTextToSpeech';
import type { Content } from '@google/genai';

const getAnimationForMessage = (text: string): string => {
  if (/\blight|luminescence|radiant|brilliant\b/i.test(text)) {
    return 'animate-glow-light';
  }
  if (/\bstar|stars|heat|searing|sun\b/i.test(text)) {
    return 'animate-glow-star';
  }
  if (/\bvoid|dark|silence|emptiness\b/i.test(text)) {
    return 'animate-pulse-void';
  }
  return '';
};

// Helper to trigger a particle burst based on the user's action text
const triggerEffectForAction = (text: string, effects: ReturnType<typeof useParticleEffects> | null) => {
  if (!effects) return;
  if (/\blight|luminescence|radiant|brilliant\b/i.test(text)) {
    effects.burstLight();
  } else if (/\bstar|stars|heat|searing|sun\b/i.test(text)) {
    effects.burstStar();
  } else if (/\bvoid|dark|silence|emptiness\b/i.test(text)) {
    effects.burstVoid();
  }
};

// A base64 encoded 1x1 black PNG to represent the initial void.
const INITIAL_VOID_IMAGE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

// SVG icon for the mobile menu
const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);


const App: React.FC = () => {
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatHistory, setChatHistory] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [sceneImage, setSceneImage] = useState<string>(INITIAL_VOID_IMAGE_BASE64);
  const [error, setError] = useState<string | null>(null);
  const [customInput, setCustomInput] = useState<string>('');
  
  // New state for Lore Encyclopedia
  const [loreEntries, setLoreEntries] = useState<LoreEntry[]>([]);
  const [isLoreModalOpen, setIsLoreModalOpen] = useState<boolean>(false);
  const [hasNewLore, setHasNewLore] = useState<boolean>(false);
  const [scrollToTerm, setScrollToTerm] = useState<string | null>(null);

  // New state for branching narratives
  const [narrativeState, setNarrativeState] = useState<NarrativeState>({});

  // New state for lore API rate limiting
  const [loreApiRateLimited, setLoreApiRateLimited] = useState<boolean>(false);

  // New state for mobile menu
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  // New state for toggling image generation, persisted in localStorage
  const [isImageGenerationEnabled, setIsImageGenerationEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('imageGenerationEnabled');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true; // Default to true if parsing fails
    }
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const particleEffects = useParticleEffects(canvasRef);
  const effectTriggeredRef = useRef<{ [key: string]: boolean }>({});
  
  // Text-to-speech hook
  const { speak, isSpeaking, speakingMessageId, isTTSSupported } = useTextToSpeech();

  // Persist image generation preference to localStorage
  useEffect(() => {
    localStorage.setItem('imageGenerationEnabled', JSON.stringify(isImageGenerationEnabled));
  }, [isImageGenerationEnabled]);


  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (gameStarted) {
      scrollToBottom();
    }
  }, [messages, gameStarted]);

  const handleNewGame = () => {
    setMessages([]);
    setChatHistory([]);
    setIsLoading(false);
    setIsGeneratingImage(false);
    setSceneImage(INITIAL_VOID_IMAGE_BASE64);
    setError(null);
    setCustomInput('');
    setLoreEntries([]);
    setHasNewLore(false);
    setLoreApiRateLimited(false); // Reset rate limit indicator
    setNarrativeState({});
    setGameStarted(false);
    effectTriggeredRef.current = {};
    setIsMenuOpen(false); // Close menu on action
  };

  const handleStartGame = useCallback(async (seed: string) => {
    setIsLoading(true);
    setError(null);
    setLoreApiRateLimited(false);
    effectTriggeredRef.current = {};

    const narratorMessageId = `narrator-${Date.now()}`;
    const streamingNarratorMessage: Message = { id: narratorMessageId, sender: Sender.NARRATOR, text: '', choices: [] };
    
    setGameStarted(true);
    // Use a timeout to allow the UI to transition before messages are set and scrolling happens
    setTimeout(() => {
        setMessages([streamingNarratorMessage]);
    }, 0);
    
    try {
      let fullResponseText = '';
      const stream = await getInitialGameUpdateStream(seed);

      for await (const chunk of stream) {
        fullResponseText += chunk.text;
        
        const narrativeStart = fullResponseText.indexOf('[NARRATIVE]');
        const choicesStart = fullResponseText.indexOf('[CHOICES]');
        
        let narrativeToShow = '';
        if (narrativeStart !== -1) {
            const endOfNarrative = choicesStart !== -1 ? choicesStart : fullResponseText.length;
            narrativeToShow = fullResponseText.substring(narrativeStart + '[NARRATIVE]'.length, endOfNarrative).trimStart();
        } else {
            const choiceMarkerIndex = fullResponseText.search(/\n\s*[A-C]\.\s/);
            narrativeToShow = choiceMarkerIndex === -1 ? fullResponseText : fullResponseText.substring(0, choiceMarkerIndex).trimStart();
        }

        setMessages(prev => prev.map(msg => msg.id === narratorMessageId ? { ...msg, text: narrativeToShow } : msg));
      }
      
      const responseRegex = /\[STATE_UPDATES\]\s*(?<state>.+?)\s*\[NARRATIVE\]\s*(?<narrative>.+?)\s*\[CHOICES\]\s*(?<choices>.+)/s;
      const match = fullResponseText.match(responseRegex);

      let finalNarrative: string;
      let finalChoices: string[];

      if (match && match.groups) {
        const { state, narrative, choices } = match.groups;
        
        try {
          const newStateUpdates = JSON.parse(state.trim());
          setNarrativeState(prevState => ({ ...prevState, ...newStateUpdates }));
        } catch (e) {
          console.error("Failed to parse state update JSON:", e, "State string:", state);
        }

        finalNarrative = narrative.trim();
        finalChoices = choices.trim().split('\n').map(c => c.trim()).filter(c => /^[A-C]\.\s/.test(c));

      } else {
        console.warn("Model response did not match expected format. Using fallback parsing.");
        const choiceMarkerIndex = fullResponseText.search(/\n\s*[A-C]\.\s/);
        if (choiceMarkerIndex !== -1) {
          finalNarrative = fullResponseText.substring(0, choiceMarkerIndex).trim();
          const choicesText = fullResponseText.substring(choiceMarkerIndex).trim();
          finalChoices = choicesText.split('\n').map(c => c.trim()).filter(c => /^[A-C]\.\s/.test(c));
        } else {
          finalNarrative = fullResponseText.trim();
          finalChoices = ["A. Focus your will.", "B. Observe the chaos.", "C. Try again."]; 
        }
      }
      
      const userPrompt = `The seed for this universe is: "${seed}". Begin the story.`;
      const newChatHistory: Content[] = [{ role: 'user', parts: [{ text: userPrompt }] }, { role: 'model', parts: [{ text: fullResponseText }] }];
      
      setMessages(prev => prev.map(msg => msg.id === narratorMessageId ? { ...msg, text: finalNarrative, choices: finalChoices } : msg));
      setChatHistory(newChatHistory);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      setMessages(prev => prev.map(msg => msg.id === narratorMessageId ? { ...msg, text: "A flicker of chaos disrupts creation. The path forward is momentarily obscured. Perhaps try again?", choices: ["A. Rest", "B. Focus your will", "C. Observe the chaos"] } : msg));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const processPlayerAction = useCallback(async (actionText: string) => {
    setIsLoading(true);
    setError(null);
    setLoreApiRateLimited(false); // Reset any previous rate limit warning on new action
    effectTriggeredRef.current = {};

    triggerEffectForAction(actionText, particleEffects);

    const userMessage: Message = { id: `user-${Date.now()}`, sender: Sender.USER, text: actionText };
    const narratorMessageId = `narrator-${Date.now()}`;
    const streamingNarratorMessage: Message = { id: narratorMessageId, sender: Sender.NARRATOR, text: '', choices: [] };
    setMessages(prev => [...prev, userMessage, streamingNarratorMessage]);
    
    try {
      let fullResponseText = '';
      const stream = await getGameUpdateStream(chatHistory, actionText, narrativeState);

      for await (const chunk of stream) {
        fullResponseText += chunk.text;
        
        // Extract narrative part for display during streaming
        const narrativeStart = fullResponseText.indexOf('[NARRATIVE]');
        const choicesStart = fullResponseText.indexOf('[CHOICES]');
        
        let narrativeToShow = '';
        if (narrativeStart !== -1) {
            const endOfNarrative = choicesStart !== -1 ? choicesStart : fullResponseText.length;
            narrativeToShow = fullResponseText.substring(narrativeStart + '[NARRATIVE]'.length, endOfNarrative).trimStart();
        } else {
            // Fallback for cases where format isn't immediately available
            const choiceMarkerIndex = fullResponseText.search(/\n\s*[A-C]\.\s/);
            narrativeToShow = choiceMarkerIndex === -1 ? fullResponseText : fullResponseText.substring(0, choiceMarkerIndex).trimStart();
        }

        setMessages(prev => prev.map(msg => msg.id === narratorMessageId ? { ...msg, text: narrativeToShow } : msg));

        if (particleEffects) {
            if (/\blight|luminescence|radiant|brilliant\b/i.test(fullResponseText) && !effectTriggeredRef.current.light) {
                particleEffects.triggerLight();
                effectTriggeredRef.current.light = true;
            }
            if (/\bstar|stars|heat|searing|sun\b/i.test(fullResponseText) && !effectTriggeredRef.current.star) {
                particleEffects.triggerStar();
                effectTriggeredRef.current.star = true;
            }
            if (/\bvoid|dark|silence|emptiness\b/i.test(fullResponseText) && !effectTriggeredRef.current.void) {
                particleEffects.triggerVoid();
                effectTriggeredRef.current.void = true;
            }
        }
      }
      
      // Final parsing of the full response
      const responseRegex = /\[STATE_UPDATES\]\s*(?<state>.+?)\s*\[NARRATIVE\]\s*(?<narrative>.+?)\s*\[CHOICES\]\s*(?<choices>.+)/s;
      const match = fullResponseText.match(responseRegex);

      let finalNarrative: string;
      let finalChoices: string[];

      if (match && match.groups) {
        const { state, narrative, choices } = match.groups;
        
        try {
          const newStateUpdates = JSON.parse(state.trim());
          setNarrativeState(prevState => ({ ...prevState, ...newStateUpdates }));
        } catch (e) {
          console.error("Failed to parse state update JSON:", e, "State string:", state);
        }

        finalNarrative = narrative.trim();
        finalChoices = choices.trim().split('\n').map(c => c.trim()).filter(c => /^[A-C]\.\s/.test(c));

      } else {
        // Fallback for when the model doesn't follow the new format
        console.warn("Model response did not match expected format. Using fallback parsing.");
        const choiceMarkerIndex = fullResponseText.search(/\n\s*[A-C]\.\s/);
        if (choiceMarkerIndex !== -1) {
          finalNarrative = fullResponseText.substring(0, choiceMarkerIndex).trim();
          const choicesText = fullResponseText.substring(choiceMarkerIndex).trim();
          finalChoices = choicesText.split('\n').map(c => c.trim()).filter(c => /^[A-C]\.\s/.test(c));
        } else {
          finalNarrative = fullResponseText.trim();
          finalChoices = ["A. Focus your will.", "B. Observe the chaos.", "C. Try again."]; 
        }
      }
      
      // The user prompt sent to the model includes state, so let's reflect that in history for consistency.
      const playerInputWithState = `Current State: ${JSON.stringify(narrativeState)}\n\nPlayer Action: ${actionText}`;
      const newChatHistory: Content[] = [...chatHistory, { role: 'user', parts: [{ text: playerInputWithState }] }, { role: 'model', parts: [{ text: fullResponseText }] }];
      
      setMessages(prev => prev.map(msg => msg.id === narratorMessageId ? { ...msg, text: finalNarrative, choices: finalChoices } : msg));
      setChatHistory(newChatHistory);

      // --- Start Lore Extraction (in background) ---
      if (finalNarrative) {
        extractLoreFromNarrative(finalNarrative, newChatHistory).then(newEntries => {
          if (newEntries.length > 0) {
            setLoreEntries(prevEntries => {
              const existingTerms = new Set(prevEntries.map(e => e.term.toLowerCase()));
              const uniqueNewEntries = newEntries.filter(
                newEntry => !existingTerms.has(newEntry.term.toLowerCase())
              );
              if (uniqueNewEntries.length > 0) {
                setHasNewLore(true); // Signal new lore
              }
              return [...prevEntries, ...uniqueNewEntries];
            });
          }
        }).catch(err => {
          if (err instanceof RateLimitError) {
            setError("Lore Encyclopedia update delayed: API rate limit reached.");
            setLoreApiRateLimited(true);
          } else {
            console.error("Lore extraction failed:", err);
          }
        });
      }

      // --- Start Image Generation (if enabled) ---
      if (isImageGenerationEnabled && finalNarrative) {
        try {
          setIsGeneratingImage(true);
          const newImageBase64 = await generateSceneImage({
            prompt: finalNarrative,
            base64ImageData: sceneImage,
            mimeType: 'image/png'
          });
          if (newImageBase64) {
            setSceneImage(newImageBase64);
            setMessages(prev => prev.map(msg => msg.id === narratorMessageId ? { ...msg, imageUrl: `data:image/png;base64,${newImageBase64}` } : msg));
          }
        } catch (imgErr) {
          console.error("Image generation failed:", imgErr);
        } finally {
          setIsGeneratingImage(false);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      setMessages(prev => prev.map(msg => msg.id === narratorMessageId ? { ...msg, text: "A flicker of chaos disrupts creation. The path forward is momentarily obscured. Perhaps try again?", choices: ["A. Rest", "B. Focus your will", "C. Observe the chaos"] } : msg));
    } finally {
      setIsLoading(false);
    }
  }, [chatHistory, particleEffects, sceneImage, narrativeState, isImageGenerationEnabled]);
  
  const handleChoiceClick = (choice: string) => {
    if (isLoading) return;
    setCustomInput('');
    processPlayerAction(choice);
  };
  
  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim() || isLoading) return;
    processPlayerAction(customInput.trim());
    setCustomInput('');
  };

  const handleOpenLoreModal = () => {
    setScrollToTerm(null); // Ensure no term is targeted when opening manually
    setIsLoreModalOpen(true);
    setHasNewLore(false); // Reset notification on open
    setIsMenuOpen(false); // Close menu on action
  };

  const handleCloseLoreModal = () => {
    setIsLoreModalOpen(false);
    setScrollToTerm(null); // Reset term on close
  };

  const handleLoreTermClick = (term: string) => {
    setScrollToTerm(term);
    setIsLoreModalOpen(true);
    setHasNewLore(false);
  };

  const handleSave = () => {
    try {
      const saveData: SaveData = {
        messages,
        chatHistory,
        loreEntries,
        narrativeState,
        sceneImage,
      };
      const jsonString = JSON.stringify(saveData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'the-creator-save.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to save the game.");
      console.error("Save error:", err);
    }
    setIsMenuOpen(false); // Close menu on action
  };

  const handleLoadClick = () => {
    fileInputRef.current?.click();
    setIsMenuOpen(false); // Close menu on action
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error("File content is not readable text.");
        }
        const loadedData = JSON.parse(text) as SaveData;
        
        // Basic validation to ensure it's a valid save file
        if (
          'messages' in loadedData &&
          'chatHistory' in loadedData &&
          'loreEntries' in loadedData &&
          'narrativeState' in loadedData &&
          'sceneImage' in loadedData
        ) {
          setMessages(loadedData.messages);
          setChatHistory(loadedData.chatHistory);
          setLoreEntries(loadedData.loreEntries);
          setNarrativeState(loadedData.narrativeState);
          setSceneImage(loadedData.sceneImage);
          setGameStarted(true); // Make sure to set game as started
          setError(null);
        } else {
          throw new Error("Invalid save file structure.");
        }
      } catch (err) {
        setError("Failed to load save file. It may be corrupted or in the wrong format.");
        console.error("Load error:", err);
      }
    };
    reader.onerror = () => {
      setError("Failed to read the selected file.");
    };
    reader.readAsText(file);
    
    // Reset file input value to allow loading the same file again
    event.target.value = '';
  };
  
  const lastMessage = messages[messages.length - 1];
  const showChoices = lastMessage?.sender === Sender.NARRATOR && lastMessage.choices && lastMessage.choices.length > 0;
  const memory = (narrativeState?.memory as string[]) || [];

  return (
    <>
      <main className="bg-gray-900 text-white w-full h-screen flex flex-col font-sans relative">
        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none" />
        
        {!gameStarted ? (
            <StartScreen onStart={handleStartGame} isLoading={isLoading} />
        ) : (
          <>
            <header className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-700 p-4 flex justify-between items-center shadow-lg sticky top-0 z-20">
              <div className="flex-1 flex justify-start">
                <label htmlFor="image-toggle" className="flex items-center cursor-pointer group">
                    <span className="mr-3 text-sm font-medium text-gray-400 group-hover:text-white transition-colors hidden sm:inline">Image Vision</span>
                    <div className="relative">
                        <input
                            type="checkbox"
                            id="image-toggle"
                            className="sr-only"
                            checked={isImageGenerationEnabled}
                            onChange={() => setIsImageGenerationEnabled(prev => !prev)}
                        />
                        <div className="block bg-gray-600 w-14 h-8 rounded-full transition-colors group-hover:bg-gray-500"></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${isImageGenerationEnabled ? 'transform translate-x-6 bg-indigo-300' : ''}`}></div>
                    </div>
                </label>
              </div>
              <div className="text-center absolute left-1/2 -translate-x-1/2 w-2/3 sm:w-1/2">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-wider text-indigo-400 truncate">The Creator</h1>
                  <MemoryDisplay memory={memory} />
              </div>
              <div className="flex-1 flex justify-end">
                {/* Desktop Menu Buttons */}
                <div className="hidden lg:flex items-center space-x-2">
                    <button onClick={handleNewGame} className="bg-red-800/50 hover:bg-red-700/50 text-red-300 font-semibold py-2 px-4 border border-red-500/30 rounded-lg shadow-md transition-all duration-200">New Game</button>
                    <button onClick={handleSave} className="bg-gray-700/50 hover:bg-gray-600/50 text-indigo-300 font-semibold py-2 px-4 border border-indigo-500/30 rounded-lg shadow-md transition-all duration-200">Save Game</button>
                    <button onClick={handleLoadClick} className="bg-gray-700/50 hover:bg-gray-600/50 text-indigo-300 font-semibold py-2 px-4 border border-indigo-500/30 rounded-lg shadow-md transition-all duration-200">Load Game</button>
                    <button onClick={handleOpenLoreModal} className={`relative bg-gray-700/50 hover:bg-gray-600/50 font-semibold py-2 px-4 border rounded-lg shadow-md transition-all duration-200 ${loreApiRateLimited ? 'border-red-500/30 text-red-300 animate-pulse' : 'border-indigo-500/30 text-indigo-300'}`}>
                        Lore
                        {hasNewLore && !loreApiRateLimited && <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span></span>}
                        {loreApiRateLimited && <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>}
                    </button>
                </div>
                 {/* Mobile Menu Button */}
                <div className="lg:hidden">
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-md text-gray-300 hover:bg-gray-700/50 hover:text-white" aria-label="Open menu">
                        <MenuIcon />
                    </button>
                </div>
              </div>
            </header>
            
             {/* Mobile Menu Dropdown */}
            {isMenuOpen && (
              <div className="lg:hidden absolute top-16 right-4 w-48 bg-gray-800/90 backdrop-blur-md border border-gray-700 rounded-lg shadow-xl z-30 animate-fade-in">
                  <div className="p-2 space-y-1">
                      <button onClick={handleOpenLoreModal} className="relative w-full text-left p-2 rounded-md hover:bg-gray-700/50">
                        <span className={loreApiRateLimited ? 'text-red-400 animate-pulse' : 'text-indigo-300'}>Lore Encyclopedia</span>
                        {hasNewLore && !loreApiRateLimited && <span className="absolute top-1/2 right-2 -translate-y-1/2 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span></span>}
                        {loreApiRateLimited && <span className="absolute top-1/2 right-2 -translate-y-1/2 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>}
                      </button>
                      <button onClick={handleSave} className="w-full text-left p-2 rounded-md text-indigo-300 hover:bg-gray-700/50">Save Game</button>
                      <button onClick={handleLoadClick} className="w-full text-left p-2 rounded-md text-indigo-300 hover:bg-gray-700/50">Load Game</button>
                      <hr className="border-gray-600 my-1"/>
                      <button onClick={handleNewGame} className="w-full text-left p-2 rounded-md text-red-400 hover:bg-gray-700/50">New Game</button>
                  </div>
              </div>
            )}
            
            <div className="flex-1 overflow-y-auto px-4 py-6 md:px-6 md:py-8 lg:px-8 lg:py-10 z-10 relative">
              <div className="max-w-4xl mx-auto flex flex-col space-y-6">
                {messages.map((msg) => (
                  <MessageBubble 
                    key={msg.id} 
                    message={msg} 
                    animationClass={msg.sender === Sender.NARRATOR ? getAnimationForMessage(msg.text) : ''}
                    loreEntries={loreEntries}
                    onLoreTermClick={handleLoreTermClick}
                    onSpeak={isTTSSupported ? speak : undefined}
                    isSpeaking={isSpeaking}
                    speakingMessageId={speakingMessageId}
                  />
                ))}
                <div ref={chatEndRef} />
              </div>
            </div>

            <footer className="bg-gray-900/50 backdrop-blur-sm border-t border-gray-700 p-4 md:p-6 sticky bottom-0 z-10">
              <div className="max-w-4xl mx-auto">
                {error && <p className="text-red-400 text-center mb-2">{error}</p>}
                
                {isGeneratingImage && <p className="text-indigo-300 text-center mb-2 animate-pulse">Conjuring a vision...</p>}

                {showChoices && !isLoading && (
                  <div className="mb-4 animate-fade-in">
                    {lastMessage.choices?.map((choice, index) => (
                      <ChoiceButton key={index} text={choice} onClick={() => handleChoiceClick(choice)} disabled={isLoading || isGeneratingImage} />
                    ))}
                  </div>
                )}

                <form onSubmit={handleCustomSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                  <input
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="Or, type your own action..."
                    disabled={isLoading || isGeneratingImage}
                    className="flex-1 bg-gray-800 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow duration-200 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || isGeneratingImage || !customInput.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-5 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-gray-900"
                  >
                    Create
                  </button>
                </form>
              </div>
            </footer>
          </>
        )}
      </main>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/json"
        className="hidden"
        aria-hidden="true"
      />

      <LoreEncyclopediaModal 
        isOpen={isLoreModalOpen}
        onClose={handleCloseLoreModal}
        entries={loreEntries}
        scrollToTerm={scrollToTerm}
      />
    </>
  );
};

export default App;