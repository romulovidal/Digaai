import React, { useEffect, useState, useRef } from 'react';
import { ArrowRight, Check, X, Sparkles, MousePointerClick } from 'lucide-react';

export interface Step {
  title: string;
  description: string;
  targetTab: 'dashboard' | 'chat' | 'goals' | 'limits' | 'history' | 'settings';
  targetId?: string; // Fallback or general ID
  desktopTargetId?: string; // Specific ID for desktop view
  mobileTargetId?: string; // Specific ID for mobile view
}

interface WalkthroughProps {
  steps: Step[];
  currentStepIndex: number;
  onNext: () => void;
  onSkip: (dontShowAgain: boolean) => void;
}

const Walkthrough: React.FC<WalkthroughProps> = ({ 
  steps, 
  currentStepIndex, 
  onNext, 
  onSkip 
}) => {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const step = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;

  // Function to find and measure the target element
  const updateHighlight = () => {
    // Determine which ID to use based on screen width
    let activeId = step.targetId;
    
    if (window.innerWidth >= 768 && step.desktopTargetId) {
       activeId = step.desktopTargetId;
    } else if (window.innerWidth < 768 && step.mobileTargetId) {
       activeId = step.mobileTargetId;
    }

    if (!activeId) {
      setTargetRect(null);
      return;
    }

    // Small delay to ensure the tab switch and render happened
    setTimeout(() => {
      const element = document.getElementById(activeId!);
      if (element) {
        const rect = element.getBoundingClientRect();
        
        // Dynamic padding based on element type (Nav items need less padding to look crisp)
        const isNav = activeId?.includes('nav-');
        const padding = isNav ? 4 : 8;
        
        setTargetRect({
          ...rect,
          top: rect.top - padding,
          left: rect.left - padding,
          width: rect.width + (padding * 2),
          height: rect.height + (padding * 2),
          bottom: rect.bottom + padding,
          right: rect.right + padding,
          x: rect.x - padding,
          y: rect.y - padding,
          toJSON: () => {}
        });
      } else {
        // Fallback if element not found (e.g. scrolled out or loading)
        setTargetRect(null);
      }
    }, 300);
  };

  useEffect(() => {
    updateHighlight();
    window.addEventListener('resize', updateHighlight);
    return () => window.removeEventListener('resize', updateHighlight);
  }, [currentStepIndex, step]);

  // Determine card position (Top or Bottom) to avoid covering the highlight
  const isHighlightInBottomHalf = targetRect ? targetRect.top > window.innerHeight / 2 : false;
  
  return (
    <div className="fixed inset-0 z-[100] overflow-hidden font-sans">
      
      {/* SPOTLIGHT EFFECT */}
      {targetRect && (
        <div 
          className="absolute transition-all duration-500 ease-in-out rounded-2xl pointer-events-none border-2 border-white/50"
          style={{
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
            // The magic: huge box-shadow creates the dark overlay around the hole
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.8)', 
          }}
        >
          {/* Pulsing ring to draw attention */}
          <div className="absolute inset-0 rounded-2xl ring-4 ring-diga-primary/50 animate-ping opacity-75"></div>
          
          {/* Pointer Helper for Navigation Items */}
          {(step.desktopTargetId || step.mobileTargetId) && (
             <div className={`absolute ${isHighlightInBottomHalf ? '-top-12 left-1/2 -translate-x-1/2' : '-bottom-12 left-1/2 -translate-x-1/2'} text-white font-bold text-sm animate-bounce whitespace-nowrap drop-shadow-md flex flex-col items-center`}>
                {!isHighlightInBottomHalf && <div className="h-4 w-0.5 bg-white/50 mb-1"></div>}
                <span>Clique aqui</span>
                {isHighlightInBottomHalf && <div className="h-4 w-0.5 bg-white/50 mt-1"></div>}
             </div>
          )}
        </div>
      )}

      {/* If no target, simple dark background */}
      {!targetRect && (
        <div className="absolute inset-0 bg-black/80 transition-opacity duration-500" />
      )}

      {/* INTERACTION LAYER */}
      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-6">
        
        {/* Spacer to push card to top/bottom */}
        <div className={`flex-1 ${!isHighlightInBottomHalf ? 'order-2' : 'order-1'}`}></div>

        {/* INSTRUCTION CARD */}
        <div 
          className={`pointer-events-auto w-full max-w-md bg-white rounded-[2rem] p-6 shadow-2xl animate-in zoom-in-95 duration-300 border border-white/20 relative z-50 
            ${isHighlightInBottomHalf ? 'mb-auto mt-4 order-1' : 'mt-auto mb-4 order-2'}
          `}
        >
            <div className="flex justify-between items-start mb-4">
               <div className="w-12 h-12 bg-indigo-50 text-diga-primary rounded-2xl flex items-center justify-center shadow-sm">
                  {step.desktopTargetId || step.mobileTargetId ? <MousePointerClick size={24} /> : <Sparkles size={24} />}
               </div>
               <div className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1">
                  <span className="text-xs font-bold text-gray-500">Passo {currentStepIndex + 1} de {steps.length}</span>
               </div>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h2>
            <p className="text-gray-600 leading-relaxed mb-6 text-sm md:text-base">
              {step.description}
            </p>

            <div className="space-y-3">
              <button 
                onClick={onNext}
                className="w-full h-12 bg-diga-primary text-white rounded-xl font-bold text-base shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isLastStep ? 'Começar a usar' : 'Entendi, próximo'} {isLastStep ? <Check size={18} /> : <ArrowRight size={18} />}
              </button>

              <div className="flex items-center justify-between pt-1">
                <button 
                  onClick={() => onSkip(dontShowAgain)}
                  className="text-gray-400 font-bold text-xs hover:text-gray-600 px-2 py-2"
                >
                  Pular tutorial
                </button>

                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${dontShowAgain ? 'bg-diga-primary border-diga-primary' : 'border-gray-300 bg-white'}`}>
                    {dontShowAgain && <Check size={12} className="text-white" />}
                  </div>
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={dontShowAgain}
                    onChange={(e) => setDontShowAgain(e.target.checked)}
                  />
                  <span className="text-xs text-gray-500 font-medium select-none">Não mostrar mais</span>
                </label>
              </div>
            </div>
        </div>

        {/* Spacer */}
        <div className={`flex-1 ${!isHighlightInBottomHalf ? 'order-1' : 'order-2'}`}></div>
      </div>
    </div>
  );
};

export default Walkthrough;
