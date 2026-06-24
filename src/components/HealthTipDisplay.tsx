/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Lightbulb, Heart, Brain, Activity } from 'lucide-react';

interface HealthTip {
  title: string;
  icon: React.ReactNode;
  color: string;
  tip: string;
}

const HEALTH_TIPS: HealthTip[] = [
  {
    title: 'Stay Hydrated',
    icon: <Activity className="w-6 h-6" />,
    color: 'from-blue-500 to-cyan-500',
    tip: 'Drink at least 8 glasses of water daily to maintain optimal health and mental clarity.',
  },
  {
    title: 'Move More',
    icon: <Activity className="w-6 h-6" />,
    color: 'from-emerald-500 to-green-500',
    tip: 'Take short walks throughout the day. Even 5 minutes of movement boosts energy and circulation.',
  },
  {
    title: 'Sleep Well',
    icon: <Brain className="w-6 h-6" />,
    color: 'from-indigo-500 to-purple-500',
    tip: 'Aim for 7-8 hours of quality sleep each night for better immune function and mental health.',
  },
  {
    title: 'Eat Healthy',
    icon: <Heart className="w-6 h-6" />,
    color: 'from-orange-500 to-red-500',
    tip: 'Include colorful fruits and vegetables in every meal for essential vitamins and nutrients.',
  },
  {
    title: 'Breathe Deeply',
    icon: <Lightbulb className="w-6 h-6" />,
    color: 'from-sky-500 to-blue-500',
    tip: 'Practice deep breathing exercises to reduce stress and improve oxygen intake.',
  },
  {
    title: 'Social Connection',
    icon: <Heart className="w-6 h-6" />,
    color: 'from-pink-500 to-rose-500',
    tip: 'Spend time with loved ones. Strong relationships contribute to better overall health.',
  },
  {
    title: 'Posture Matters',
    icon: <Activity className="w-6 h-6" />,
    color: 'from-amber-500 to-yellow-500',
    tip: 'Maintain good posture to prevent back pain and improve digestion and confidence.',
  },
  {
    title: 'Wash Hands',
    icon: <Lightbulb className="w-6 h-6" />,
    color: 'from-teal-500 to-cyan-500',
    tip: 'Regular handwashing for 20 seconds prevents the spread of infections and illnesses.',
  },
  {
    title: 'Sun Exposure',
    icon: <Heart className="w-6 h-6" />,
    color: 'from-yellow-500 to-orange-500',
    tip: 'Get 15-30 minutes of sunlight daily for Vitamin D production and mood boost.',
  },
  {
    title: 'Stress Less',
    icon: <Brain className="w-6 h-6" />,
    color: 'from-violet-500 to-purple-500',
    tip: 'Try meditation or yoga to reduce stress and improve your mental and physical wellbeing.',
  },
];

interface HealthTipDisplayProps {
  rotationInterval?: number; // milliseconds between tip rotations
}

export default function HealthTipDisplay({ rotationInterval = 8000 }: HealthTipDisplayProps) {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    if (!isAnimating) return;

    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % HEALTH_TIPS.length);
    }, rotationInterval);

    return () => clearInterval(interval);
  }, [isAnimating, rotationInterval]);

  const currentTip = HEALTH_TIPS[currentTipIndex];

  return (
    <div
      className={`bg-gradient-to-r ${currentTip.color} rounded-xl p-4 text-white shadow-lg transition-all duration-500 cursor-pointer hover:shadow-xl`}
      onClick={() => setIsAnimating(!isAnimating)}
      title="Click to pause/resume tips"
    >
      <div className="flex items-start gap-3">
        <div className="mt-1 flex-shrink-0">{currentTip.icon}</div>
        <div className="flex-1">
          <h3 className="font-bold text-sm mb-1 uppercase tracking-wide">
            💡 {currentTip.title}
          </h3>
          <p className="text-xs leading-relaxed opacity-95">{currentTip.tip}</p>
          <div className="mt-2 flex gap-1">
            {HEALTH_TIPS.map((_, index) => (
              <div
                key={index}
                className={`h-1 rounded-full transition-all ${
                  index === currentTipIndex ? 'bg-white w-3' : 'bg-white/30 w-1.5'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
