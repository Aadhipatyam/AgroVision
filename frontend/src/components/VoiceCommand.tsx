import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVoice } from '../contexts/VoiceContext';

const VoiceCommand: React.FC = () => {
  const { transcript, speak } = useVoice();
  const navigate = useNavigate();

  useEffect(() => {
    if (transcript) {
      const command = transcript.toLowerCase();
      
      if (command.includes('dashboard') || command.includes('डैशबोर्ड')) {
        navigate('/dashboard');
        speak('Dashboard पर जा रहे हैं');
      } else if (command.includes('policies') || command.includes('नीति')) {
        navigate('/policies');
        speak('Policies पृष्ठ पर जा रहे हैं');
      } else if (command.includes('cultivation') || command.includes('खेती')) {
        navigate('/cultivation');
        speak('Cultivation की जानकारी पर जा रहे हैं');
      } else if (command.includes('price') || command.includes('कीमत')) {
        navigate('/price-predictor');
        speak('Price Predictor पर जा रहे हैं');
      } else if (command.includes('weather') || command.includes('मौसम')) {
        navigate('/weather');
        speak('Weather की जानकारी पर जा रहे हैं');
      }
    }
  }, [transcript, navigate, speak]);

  return null;
};

export default VoiceCommand;