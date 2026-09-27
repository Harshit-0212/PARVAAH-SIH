import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Language } from '../types';
import { dictionary } from '../data/translations';

interface AnimatedHeroHeadingProps {
  lang: Language;
}

// Grapheme segmenter for clean Devanagari and English character typing
function getGraphemes(text: string, lang: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    try {
      const segmenter = new Intl.Segmenter(lang === 'hi' ? 'hi' : 'en', { granularity: 'grapheme' });
      return Array.from(segmenter.segment(text), s => s.segment);
    } catch {
      return Array.from(text);
    }
  }
  return Array.from(text);
}

export const AnimatedHeroHeading: React.FC<AnimatedHeroHeadingProps> = ({ lang }) => {
  const t = dictionary[lang];
  const prefix = t.heroHeadingPrefix || (lang === 'hi' ? "पर्वतीय जीवन की रक्षा के लिए " : "Protecting Mountain Lives with ");
  const dynamicWords = t.heroDynamicWords || (lang === 'hi' ? ["AI-संचालित", "वास्तविक समय", "सटीक पूर्व"] : ["AI-Powered", "Real-Time", "Early Warning"]);
  const suffix = t.heroHeadingSuffix || (lang === 'hi' ? " भूस्खलन चेतावनी।" : " Landslide Intelligence.");

  const [wordIndex, setWordIndex] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [status, setStatus] = useState<'typing' | 'complete' | 'holding' | 'deleting'>('typing');
  const [reducedMotion, setReducedMotion] = useState(false);

  // Check reduced motion
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  // When language changes, reset to the first dynamic word and start deliberate typing
  useEffect(() => {
    setWordIndex(0);
    setCharCount(0);
    setStatus('typing');
  }, [lang]);

  const currentWord = dynamicWords[wordIndex] || dynamicWords[0];
  const wordGraphemes = useMemo(() => getGraphemes(currentWord, lang), [currentWord, lang]);
  const totalChars = wordGraphemes.length;

  // Immediate full render if reduced motion is requested
  useEffect(() => {
    if (reducedMotion) {
      setCharCount(totalChars);
      setStatus('complete');
    }
  }, [reducedMotion, totalChars]);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (reducedMotion) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (status === 'typing') {
      if (charCount < totalChars) {
        // Deliberate, calm typing speed: 115ms per character (slow and readable)
        timeoutRef.current = setTimeout(() => {
          setCharCount(prev => prev + 1);
        }, 115);
      } else {
        // Main word finished writing! Complete state activates the teal underline draw
        setStatus('complete');
      }
    } else if (status === 'complete') {
      // Hold the completed word and sentence so it can be comfortably read (6 seconds)
      timeoutRef.current = setTimeout(() => {
        if (dynamicWords.length > 1) {
          setStatus('deleting');
        } else {
          setStatus('holding');
        }
      }, 6000);
    } else if (status === 'deleting') {
      if (charCount > 0) {
        // Steady, unhurried backspacing: 55ms per character
        timeoutRef.current = setTimeout(() => {
          setCharCount(prev => prev - 1);
        }, 55);
      } else {
        // Advance to next dynamic word
        setWordIndex(prev => (prev + 1) % dynamicWords.length);
        setStatus('typing');
      }
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [status, charCount, totalChars, dynamicWords.length, reducedMotion]);

  const revealedWord = wordGraphemes.slice(0, charCount).join('');
  const isComplete = status === 'complete' || status === 'holding' || reducedMotion;
  const showCursor = !isComplete;

  return (
    <div className="w-full relative max-w-4xl mx-auto text-center">

      {/* 
        The whole sentence is always visible and stable.
        ONLY the main highlighted word is progressively revealed/typed at a calm, slow pace.
      */}
      <h1
        className={`text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 tracking-tight leading-[1.18] text-center ${lang === 'hi' ? 'lang-hi' : ''
          }`}
      >
        <span>{prefix}</span>

        {/* Dynamic Highlighted Main Word Container */}
        <span className="relative inline-block text-[#0F766E] mx-1 min-w-[20px] text-left align-baseline">
          <span>{revealedWord}</span>

          {/* Subtle typing cursor right after the main word */}
          {showCursor && (
            <span
              className="inline-block w-[3px] sm:w-[4px] h-[0.8em] bg-[#0F766E] ml-1 align-baseline rounded-full animate-pulse opacity-90"
              aria-hidden="true"
            />
          )}

          {/* Underline drawn smoothly once the main word is complete */}
          <span
            aria-hidden="true"
            className="absolute left-0 -bottom-1 h-[4px] bg-teal-400 rounded-full transition-all duration-700 ease-out pointer-events-none"
            style={{
              width: isComplete ? '100%' : '0%',
              opacity: isComplete ? 1 : 0
            }}
          />
        </span>

        <span>{suffix}</span>
      </h1>

      {/* Accessible screen-reader heading */}
      <h1 className="sr-only">
        {`${prefix}${currentWord}${suffix}`}
      </h1>

    </div>
  );
};

export default AnimatedHeroHeading;
