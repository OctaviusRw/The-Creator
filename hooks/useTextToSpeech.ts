import { useState, useEffect, useCallback } from 'react';

/**
 * A custom hook to provide text-to-speech functionality using the browser's Web Speech API.
 * It manages speaking state and provides controls to speak or cancel speech.
 * To align with the user request of using "Google" TTS, it actively seeks out a voice
 * with "Google" in its name, falling back to the browser's default if not available.
 */
export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      setIsSupported(true);
      const onVoicesChanged = () => {
        // This event ensures voices are loaded before we try to use them.
      };
      window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
      
      // Cleanup function to cancel any ongoing speech when the component unmounts.
      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
        window.speechSynthesis.cancel();
      };
    }
  }, []);

  const speak = useCallback((text: string, messageId: string) => {
    if (!isSupported || !text) return;
    
    // If the same message's button is clicked while it's speaking, treat it as a toggle to stop.
    if (isSpeaking && speakingMessageId === messageId) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingMessageId(null);
      return;
    }
    
    // If another message is speaking, cancel it before starting the new one.
    if (isSpeaking) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);

    // Attempt to find and use a Google-provided voice.
    const voices = window.speechSynthesis.getVoices();
    const googleVoice = voices.find(voice => voice.name.includes('Google'));
    if (googleVoice) {
      utterance.voice = googleVoice;
    }
    
    utterance.onstart = () => {
      setIsSpeaking(true);
      setSpeakingMessageId(messageId);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    };
    
    utterance.onerror = (event) => {
      console.error('SpeechSynthesisUtterance.onerror', event);
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    };

    window.speechSynthesis.speak(utterance);
  }, [isSpeaking, speakingMessageId, isSupported]);
  
  const cancel = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    }
  }, [isSupported]);

  return { speak, cancel, isSpeaking, speakingMessageId, isTTSSupported: isSupported };
};