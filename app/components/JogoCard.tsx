"use client";

import React from 'react';

type JogoProps = {
  campeonato: string;
  time1: string;
  time2: string;
  hora: string;
  canal: string;
};

export default function JogoCard({ campeonato, time1, time2, hora, canal }: JogoProps) {
  return (
    <div className="bg-white shadow p-4 rounded-xl">
      <h3 className="font-semibold text-lg mb-2">{campeonato}</h3>
      <p className="text-gray-700">
        {time1} x {time2}
      </p>
      <p className="text-sm text-gray-500 mt-1">
        🕒 {hora} | 📺 {canal}
      </p>
    </div>
  );
}