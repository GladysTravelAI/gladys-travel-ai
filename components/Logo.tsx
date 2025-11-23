import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  variant?: 'light' | 'dark'; // NEW: To handle different backgrounds
}

export default function Logo({ 
  size = 40, 
  className = "", 
  showText = true, 
  variant = 'dark' // Default to dark text
}: LogoProps) {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Logo Icon - This SVG is great, no changes needed */}
      <div 
        className="relative rounded-2xl flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* ... (Your entire <svg> code is perfect) ... */ }
          {/* Gradient Definitions */}
           <defs>
             <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
               <stop offset="0%" stopColor="#3B82F6" />
               <stop offset="50%" stopColor="#2563EB" />
               <stop offset="100%" stopColor="#1E40AF" />
             </linearGradient>
             <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
               <stop offset="0%" stopColor="#FCD34D" />
               <stop offset="50%" stopColor="#FBBF24" />
               <stop offset="100%" stopColor="#F59E0B" />
             </linearGradient>
             <radialGradient id="whiteGlow" cx="50%" cy="50%" r="50%">
               <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.3" />
               <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
             </radialGradient>
           </defs>

           {/* Outer Glow */}
           <circle cx="50" cy="50" r="48" fill="url(#whiteGlow)" />

           {/* Main Circle Background - Blue Gradient */}
           <circle cx="50" cy="50" r="45" fill="url(#blueGradient)" />
           
           {/* Globe Lines - White */}
           <circle cx="50" cy="50" r="35" stroke="white" strokeWidth="2.5" fill="none" opacity="0.9" />
           
           {/* Vertical Ellipse */}
           <ellipse cx="50" cy="50" rx="15" ry="35" stroke="white" strokeWidth="2" fill="none" opacity="0.8" />
           
           {/* Horizontal Line - Equator */}
           <line x1="15" y1="50" x2="85" y2="50" stroke="white" strokeWidth="2.5" opacity="0.9" />
           
           {/* Horizontal Ellipse */}
           <ellipse cx="50" cy="50" rx="35" ry="15" stroke="white" strokeWidth="2" fill="none" opacity="0.7" />

           {/* Additional Detail Lines */}
           <ellipse cx="50" cy="50" rx="25" ry="35" stroke="white" strokeWidth="1.5" fill="none" opacity="0.5" />
           <line x1="15" y1="35" x2="85" y2="35" stroke="white" strokeWidth="1.5" opacity="0.6" />
           <line x1="15" y1="65" x2="85" y2="65" stroke="white" strokeWidth="1.5" opacity="0.6" />

           {/* Airplane - Gold */}
           <g transform="translate(62, 28) rotate(45 0 0)">
             <path 
               d="M12 2L8 8L2 10L8 12L12 18L16 12L22 10L16 8L12 2Z" 
               fill="url(#goldGradient)"
               filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"
             />
             {/* Airplane highlight */}
             <path 
               d="M12 2L10 6L8 8L10 9L12 12L14 9L16 8L14 6L12 2Z" 
               fill="white"
               opacity="0.4"
             />
           </g>

           {/* Gold Sparkles */}
           <g fill="url(#goldGradient)">
             {/* Top Right Sparkle */}
             <circle cx="78" cy="22" r="3" />
             <path d="M78 18L78.5 20L80 20.5L78.5 21L78 23L77.5 21L76 20.5L77.5 20Z" fill="white" opacity="0.6" />
             
             {/* Bottom Left Sparkle */}
             <circle cx="22" cy="78" r="2.5" opacity="0.9" />
             <path d="M22 75L22.4 76.5L24 77L22.4 77.5L22 79L21.6 77.5L20 77L21.6 76.5Z" fill="white" opacity="0.5" />
             
             {/* Small accent sparkle */}
             <circle cx="70" cy="70" r="2" opacity="0.7" />
           </g>

           {/* White accent dots for extra detail */}
           <circle cx="30" cy="30" r="1.5" fill="white" opacity="0.8" />
           <circle cx="65" cy="50" r="1" fill="white" opacity="0.6" />
           <circle cx="35" cy="50" r="1" fill="white" opacity="0.6" />

           {/* Subtle outer ring for depth */}
           <circle cx="50" cy="50" r="47" stroke="white" strokeWidth="1" fill="none" opacity="0.3" />
        </svg>
      </div>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col">
          {/* NEW: Conditional text color */}
          <span className={`text-2xl font-bold leading-tight ${
            variant === 'light' 
              ? 'text-white' 
              : 'bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 bg-clip-text text-transparent'
          }`}>
            Gladys
          </span>
          <span className={`text-sm font-medium tracking-wide ${
             variant === 'light'
               ? 'text-amber-400' // Use gold for the "light" variant
               : 'bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent'
          }`}>
            Travel AI
          </span>
        </div>
      )}
    </div>
  );
}

// Compact version for favicons or small spaces
export function LogoCompact({ size = 32 }: { size?: number }) {
  // ... (Your LogoCompact component is perfect as-is) ...
  return (
     <div 
       className="relative rounded-xl flex items-center justify-center shadow-lg"
       style={{ width: size, height: size }}
     >
       <svg
         width={size}
         height={size}
         viewBox="0 0 100 100"
         fill="none"
         xmlns="http://www.w3.org/2000/svg"
       >
         <defs>
           <linearGradient id="compactBlue" x1="0%" y1="0%" x2="100%" y2="100%">
             <stop offset="0%" stopColor="#3B82F6" />
             <stop offset="100%" stopColor="#1E40AF" />
           </linearGradient>
           <linearGradient id="compactGold" x1="0%" y1="0%" x2="100%" y2="100%">
             <stop offset="0%" stopColor="#FCD34D" />
             <stop offset="100%" stopColor="#F59E0B" />
           </linearGradient>
         </defs>
         <circle cx="50" cy="50" r="48" fill="url(#compactBlue)" />
         <circle cx="50" cy="50" r="35" stroke="white" strokeWidth="2.5" fill="none" />
         <ellipse cx="50" cy="50" rx="15" ry="35" stroke="white" strokeWidth="2" fill="none" />
         <line x1="15" y1="50" x2="85" y2="50" stroke="white" strokeWidth="2.5" />
         <g transform="translate(62, 28) rotate(45 0 0)">
           <path d="M12 2L8 8L2 10L8 12L12 18L16 12L22 10L16 8L12 2Z" fill="url(#compactGold)" />
         </g>
       </svg>
     </div>
   );
}

