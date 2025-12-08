import React from 'react';

type MascotMood = 'happy' | 'thinking' | 'sleepy' | 'sad' | 'excited' | 'neutral';

interface MascotProps {
  mood?: MascotMood;
  size?: number;
  className?: string;
}

export const Mascot: React.FC<MascotProps> = ({ mood = 'happy', size = 100, className = '' }) => {
  // Colors
  const bodyColor = "#2DD4BF"; // Teal-400
  const bellyColor = "#CCFBF1"; // Teal-100
  const cheekColor = "#FDA4AF"; // Rose-300
  const strokeColor = "#115E59"; // Teal-800

  // Expressions
  const getEyes = () => {
    switch (mood) {
      case 'sleepy':
        return (
          <g>
            <path d="M35 55 Q45 60 55 55" fill="none" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
            <path d="M85 55 Q95 60 105 55" fill="none" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
            <text x="110" y="40" fontSize="24" fill="#64748B" className="animate-pulse">Zzz</text>
          </g>
        );
      case 'sad':
        return (
          <g>
            <circle cx="45" cy="55" r="5" fill={strokeColor} />
            <circle cx="95" cy="55" r="5" fill={strokeColor} />
            <path d="M40 45 Q30 50 35 55" fill="none" stroke={strokeColor} strokeWidth="2" opacity="0.5"/>
            <path d="M100 45 Q110 50 105 55" fill="none" stroke={strokeColor} strokeWidth="2" opacity="0.5"/>
          </g>
        );
      case 'excited':
        return (
          <g>
            <path d="M35 55 L45 45 L55 55" fill="none" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
            <path d="M85 55 L95 45 L105 55" fill="none" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
          </g>
        );
      case 'thinking':
        return (
           <g>
            <circle cx="45" cy="50" r="5" fill={strokeColor} />
            <circle cx="95" cy="50" r="5" fill={strokeColor} />
            <path d="M90 40 Q100 35 110 40" fill="none" stroke={strokeColor} strokeWidth="2" />
           </g>
        );
      default: // Happy/Neutral
        return (
          <g>
            <ellipse cx="45" cy="55" rx="5" ry="8" fill={strokeColor} />
            <ellipse cx="95" cy="55" rx="5" ry="8" fill={strokeColor} />
            <circle cx="47" cy="53" r="2" fill="white" />
            <circle cx="97" cy="53" r="2" fill="white" />
          </g>
        );
    }
  };

  const getMouth = () => {
    switch (mood) {
      case 'sad':
        return <path d="M60 75 Q70 65 80 75" fill="none" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />;
      case 'sleepy':
        return <circle cx="70" cy="75" r="3" fill={strokeColor} />;
      case 'excited':
        return <path d="M55 70 Q70 85 85 70" fill="none" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />;
      case 'thinking':
        return <line x1="60" y1="75" x2="80" y2="75" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />;
      default:
        return <path d="M60 72 Q70 80 80 72" fill="none" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />;
    }
  };

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 140 140" className="w-full h-full drop-shadow-xl animate-float">
        {/* Leaf Antenna */}
        <path d="M70 20 Q70 5 85 5 Q90 15 70 20" fill="#84CC16" stroke={strokeColor} strokeWidth="2" />
        <line x1="70" y1="20" x2="70" y2="30" stroke={strokeColor} strokeWidth="3" />

        {/* Body Shape - Soft Rectangle/Blob */}
        <rect x="20" y="30" width="100" height="90" rx="35" fill={bodyColor} stroke={strokeColor} strokeWidth="3" />
        
        {/* Belly highlight */}
        <ellipse cx="70" cy="85" rx="35" ry="25" fill={bellyColor} opacity="0.6" />

        {/* Face */}
        {getEyes()}
        {getMouth()}

        {/* Cheeks */}
        {(mood === 'happy' || mood === 'excited' || mood === 'sleepy') && (
          <>
            <circle cx="35" cy="65" r="6" fill={cheekColor} opacity="0.6" />
            <circle cx="105" cy="65" r="6" fill={cheekColor} opacity="0.6" />
          </>
        )}

        {/* Arms - change based on mood */}
        {mood === 'excited' ? (
             <>
               <path d="M20 60 Q5 40 15 30" fill="none" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
               <path d="M120 60 Q135 40 125 30" fill="none" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
             </>
        ) : (
             <>
               <path d="M20 65 Q10 80 25 85" fill="none" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
               <path d="M120 65 Q130 80 115 85" fill="none" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
             </>
        )}
      </svg>
    </div>
  );
};