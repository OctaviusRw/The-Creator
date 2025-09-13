
import React from 'react';

interface ChoiceButtonProps {
  text: string;
  onClick: () => void;
  disabled: boolean;
}

const ChoiceButton: React.FC<ChoiceButtonProps> = ({ text, onClick, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full text-left p-3 my-1 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      <span className="font-mono text-indigo-400 mr-3">{text.substring(0, 2)}</span>
      <span className="text-gray-200">{text.substring(2)}</span>
    </button>
  );
};

export default ChoiceButton;
