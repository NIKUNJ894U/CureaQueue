import React, { useState, useEffect } from 'react';
import { Palette, Check, X, Sparkles, ChevronRight } from 'lucide-react';
import CuraQueueLogo, { getGlobalLogoVariant, setGlobalLogoVariant } from './CuraQueueLogo';

export default function LogoVariantSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeVariant, setActiveVariant] = useState(getGlobalLogoVariant());

  const logoOptions = [
    {
      id: 1,
      title: "Sky Classic",
      desc: "Trust Blue & Medical Teal Contrast",
      crossColor: "#133d7c",
      arrowColor: "#1cbba5",
    },
    {
      id: 2,
      title: "Indigo Ocean",
      desc: "Royal Indigo & Celestial Blue Flow",
      crossColor: "#1e3a8a",
      arrowColor: "#0ea5e9",
    },
    {
      id: 3,
      title: "Emerald Forest",
      desc: "Cedar Green & High-Contrast Mint",
      crossColor: "#065f46",
      arrowColor: "#10b981",
    },
    {
      id: 4,
      title: "Slate Cyber",
      desc: "Digital Charcoal & Cyber Cyan",
      crossColor: "#334155",
      arrowColor: "#06b6d4",
    },
    {
      id: 5,
      title: "Regal Coral",
      desc: "Twilight Plum & Vibrant Orchid",
      crossColor: "#581c87",
      arrowColor: "#f43f5e",
    }
  ];

  const handleSelect = (id: number) => {
    setActiveVariant(id);
    setGlobalLogoVariant(id);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans select-none pointer-events-auto">
      {/* Mini Floating Trigger Badge */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-full shadow-2xl hover:bg-slate-800 border border-slate-700/80 transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Palette size={16} className="text-sky-400 animate-pulse" />
          <span className="text-xs font-extrabold uppercase tracking-wider">Choose logo ({activeVariant}/5)</span>
          <ChevronRight size={14} className="text-slate-400" />
        </button>
      )}

      {/* Main Bottom Sheet Options Deck */}
      {isOpen && (
        <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 p-5 shadow-2xl max-w-sm sm:max-w-md w-80 sm:w-96 animate-fade-in text-slate-800 flex flex-col gap-4 relative">
          
          {/* Close Panel Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer transition select-none"
            title="Close selector"
          >
            <X size={16} />
          </button>

          {/* Header */}
          <div className="flex items-center gap-2 pb-1.5 border-b border-slate-150">
            <Sparkles size={16} className="text-amber-500 animate-pulse" />
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Brand Logo Selector</h4>
              <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Select your preferred concept below</p>
            </div>
          </div>

          {/* List of Concepts */}
          <div className="flex flex-col gap-2 max-h-[280px] overflow-y-auto pr-1">
            {logoOptions.map((opt) => {
              const isSelected = activeVariant === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelect(opt.id)}
                  className={`flex items-center gap-3.5 p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer w-full group ${
                    isSelected
                      ? 'bg-sky-50/70 border-sky-400 shadow-sm'
                      : 'bg-white hover:bg-slate-50 border-slate-150 hover:border-slate-200'
                  }`}
                >
                  {/* Miniature Logo Preview using actual variant rendering */}
                  <div className="bg-slate-100 rounded-lg p-1.5 shrink-0 flex items-center justify-center border border-slate-150 overflow-hidden transform group-hover:scale-105 transition-transform duration-200">
                    <CuraQueueLogo size={36} variant={opt.id} />
                  </div>

                  {/* Description Box */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">
                        Concept #{opt.id}: {opt.title}
                      </span>
                      {isSelected && (
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-sky-500 text-white">
                          <Check size={10} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5 truncate">
                      {opt.desc}
                    </p>
                    
                    {/* Visual Color Chips */}
                    <div className="flex gap-1.5 mt-1.5 items-center">
                      <span 
                        className="w-2.5 h-2.5 rounded-full border border-slate-200" 
                        style={{ backgroundColor: opt.crossColor }}
                        title="Main Cross Color"
                      />
                      <span 
                        className="w-2.5 h-2.5 rounded-full border border-slate-200" 
                        style={{ backgroundColor: opt.arrowColor }}
                        title="Accent Arrow Color"
                      />
                      <span className="text-[9px] text-slate-350 font-semibold uppercase">{opt.crossColor} / {opt.arrowColor}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Status Footer */}
          <div className="bg-slate-50/80 border border-slate-150 rounded-xl p-2.5 text-center text-[10px] font-bold text-slate-500 flex items-center justify-center gap-1.5">
            <Palette size={13} className="text-slate-400" />
            <span>Select any concept above to live-apply changes across all elements!</span>
          </div>

        </div>
      )}
    </div>
  );
}
