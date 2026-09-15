import React, { useState } from 'react';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Dices, RotateCcw } from 'lucide-react';

interface DiceRollerProps {
  onDiceRoll?: (rollText: string, total: number) => void;
}

const DICE_ICONS = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

export const DiceRoller: React.FC<DiceRollerProps> = ({ onDiceRoll }) => {
  const [diceType, setDiceType] = useState<'2d6' | '1d6' | '1d20' | '1d100'>('2d6');
  const [results, setResults] = useState<number[]>([3, 4]);
  const [total, setTotal] = useState<number>(7);
  const [rolling, setRolling] = useState(false);

  const rollDice = () => {
    setRolling(true);
    let rolls: number[] = [];
    let sum = 0;

    setTimeout(() => {
      if (diceType === '2d6') {
        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        rolls = [d1, d2];
        sum = d1 + d2;
      } else if (diceType === '1d6') {
        const d = Math.floor(Math.random() * 6) + 1;
        rolls = [d];
        sum = d;
      } else if (diceType === '1d20') {
        const d = Math.floor(Math.random() * 20) + 1;
        rolls = [d];
        sum = d;
      } else {
        const d = Math.floor(Math.random() * 100) + 1;
        rolls = [d];
        sum = d;
      }

      setResults(rolls);
      setTotal(sum);
      setRolling(false);

      if (onDiceRoll) {
        const desc =
          diceType === '2d6'
            ? `Rolled 2d6: [${rolls[0]} + ${rolls[1]}] = ${sum}`
            : `Rolled ${diceType}: ${sum}`;
        onDiceRoll(desc, sum);
      }
    }, 350);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Dices className="w-3.5 h-3.5 text-indigo-400" />
          Tabletop Dice Roller
        </span>
        <div className="flex gap-1">
          {(['2d6', '1d6', '1d20', '1d100'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setDiceType(type)}
              className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                diceType === type
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {diceType === '2d6' ? (
            <div className="flex gap-2">
              {results.map((val, idx) => {
                const IconComponent = DICE_ICONS[val - 1] || Dice6;
                return (
                  <div
                    key={idx}
                    className={`w-9 h-9 rounded-lg bg-slate-950 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-bold text-base shadow-inner ${
                      rolling ? 'animate-bounce' : ''
                    }`}
                  >
                    <IconComponent className="w-6 h-6" />
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              className={`px-3 py-1.5 rounded-lg bg-slate-950 border border-indigo-500/40 text-indigo-300 font-bold text-lg shadow-inner ${
                rolling ? 'animate-spin' : ''
              }`}
            >
              {results[0]}
            </div>
          )}

          <div className="text-left pl-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total</span>
            <span className="text-lg font-black text-white">{total}</span>
          </div>
        </div>

        <button
          type="button"
          disabled={rolling}
          onClick={rollDice}
          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${rolling ? 'animate-spin' : ''}`} />
          Roll {diceType}
        </button>
      </div>
    </div>
  );
};
