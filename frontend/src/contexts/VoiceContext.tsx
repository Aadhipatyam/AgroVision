import React, { createContext, useContext, useState, useEffect } from 'react';

interface VoiceContextType {
  isListening: boolean;
  isSupported: boolean;
  language: string;
  setLanguage: (lang: string) => void;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string) => void;
  transcript: string;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (context === undefined) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
};

export const VoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [language, setLanguage] = useState('hi-IN'); // Default to Hindi
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;
      
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        setTranscript(transcript);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(recognition);
    }
  }, [language]);

  const startListening = () => {
    if (recognition) {
      recognition.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <VoiceContext.Provider value={{
      isListening,
      isSupported,
      language,
      setLanguage,
      startListening,
      stopListening,
      speak,
      transcript
    }}>
      {children}
    </VoiceContext.Provider>
  );
};