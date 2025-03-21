import { IoCloseSharp } from "react-icons/io5";
import { AiOutlineReload } from "react-icons/ai";
import { FaCopy, FaThumbtack } from "react-icons/fa";
import { HiOutlineChevronLeft, HiOutlineChevronRight } from "react-icons/hi";
import { useEffect, useState } from "react";
import { useToggleQuote } from "@Store";

import quoteData from "./QuoteData.json";
import "./Quotes.scss";

export const Quotes = () => {
  const [quoteNumber, setQuoteNumber] = useState(0);
  const [isPinned, setIsPinned] = useState(false);
  const [showCopyTooltip, setShowCopyTooltip] = useState(false);
  const { setIsQuoteToggled } = useToggleQuote();

  // Cargar el estado de pin y el número de versículo desde localStorage al inicio
  useEffect(() => {
    const savedPin = localStorage.getItem('quote-pinned');
    const savedQuoteNumber = localStorage.getItem('quote-number');
    
    if (savedPin) {
      setIsPinned(savedPin === 'true');
    }
    
    if (savedPin === 'true' && savedQuoteNumber) {
      setQuoteNumber(parseInt(savedQuoteNumber));
    } else {
      setQuoteNumber(Math.floor(Math.random() * quoteData.length));
    }
  }, []);

  // Guardar el estado del pin y el número de versículo en localStorage cuando cambian
  useEffect(() => {
    localStorage.setItem('quote-pinned', isPinned.toString());
    if (isPinned) {
      localStorage.setItem('quote-number', quoteNumber.toString());
    }
  }, [isPinned, quoteNumber]);

  const getRandomQuote = () => {
    if (!isPinned) {
      const newQuoteNumber = Math.floor(Math.random() * quoteData.length);
      setQuoteNumber(newQuoteNumber);
    }
  };

  const copyQuote = () => {
    const textToCopy = `${quoteData[quoteNumber].q} - ${quoteData[quoteNumber].a}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setShowCopyTooltip(true);
      setTimeout(() => {
        setShowCopyTooltip(false);
      }, 2000);
    });
  };

  const togglePin = () => {
    const newPinState = !isPinned;
    setIsPinned(newPinState);
  };

  const goToPreviousQuote = () => {
    const prevIndex = quoteNumber === 0 ? quoteData.length - 1 : quoteNumber - 1;
    setQuoteNumber(prevIndex);
  };

  const goToNextQuote = () => {
    const nextIndex = quoteNumber === quoteData.length - 1 ? 0 : quoteNumber + 1;
    setQuoteNumber(nextIndex);
  };

  return (
    <div className="quote-widget rounded-lg border border-gray-200 bg-white/[.96] shadow-md dark:border-gray-700 dark:bg-gray-800/[.96] dark:text-gray-300 sm:w-96">
      <div className="handle flex w-full cursor-move justify-end p-2">
        <IoCloseSharp
          className="cursor-pointer text-red-500 hover:bg-red-200 dark:hover:bg-red-900"
          onClick={() => setIsQuoteToggled(false)}
        />
      </div>
      <div className="cancelDrag max-w-sm px-6 py-4 text-center">
        <div className="quote-navigation-container relative flex items-center justify-between">
          <button 
            onClick={goToPreviousQuote}
            className="navigation-arrow left-arrow flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            aria-label="Versículo anterior"
          >
            <HiOutlineChevronLeft className="text-xl" />
          </button>
          
          <div className="quote-text relative mx-2 items-center justify-center pb-6 font-radio-canada text-gray-800 dark:text-white">
            <p className="mb-6 font-serif text-xl font-bold italic leading-relaxed">
              {quoteData[quoteNumber].q}
            </p>
            <p className="quote-reference text-right text-sm font-semibold text-gray-600 dark:text-gray-400">
              {quoteData[quoteNumber].a}
            </p>
          </div>
          
          <button 
            onClick={goToNextQuote}
            className="navigation-arrow right-arrow flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            aria-label="Siguiente versículo"
          >
            <HiOutlineChevronRight className="text-xl" />
          </button>
        </div>
      </div>
      <div className="flex w-full items-center justify-end gap-3 pb-3 pr-4 pl-2 text-base">
        <div className="relative">
          <FaCopy
            className="copy-button cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            onClick={copyQuote}
          />
          {showCopyTooltip && (
            <div className="tooltip-text absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded bg-gray-700 px-2 py-1 text-xs text-white">
              Copiado
            </div>
          )}
        </div>
        <FaThumbtack
          className={`pin-button cursor-pointer ${
            isPinned 
            ? "text-amber-500 dark:text-amber-400" 
            : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
          onClick={togglePin}
        />
        <AiOutlineReload 
          className="reload-button cursor-pointer text-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" 
          onClick={getRandomQuote} 
        />
      </div>
    </div>
  );
};
