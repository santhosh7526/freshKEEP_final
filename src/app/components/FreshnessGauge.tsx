import { getFreshnessState } from '../lib/helpers';

interface FreshnessGaugeProps {
  score: number;
  name: string;
}

export function FreshnessGauge({ score, name }: FreshnessGaugeProps) {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (score >= 85) return '#22c55e';
    if (score >= 70) return '#86A789';
    if (score >= 50) return '#eab308';
    if (score >= 30) return '#f97316';
    return '#ef4444';
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="w-32 h-32 transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="45"
            stroke="#f1f5f9"
            strokeWidth="10"
            fill="none"
          />
          <circle
            cx="64"
            cy="64"
            r="45"
            stroke={getColor()}
            strokeWidth="10"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl" style={{ color: getColor() }}>
            {Math.round(score)}%
          </span>
          <span className="text-xs text-gray-500">Fresh</span>
        </div>
      </div>
      <div className="mt-3 text-center">
        <p className="font-medium text-gray-900">{name}</p>
        <p className="text-sm text-gray-600">{getFreshnessState(score)}</p>
      </div>
    </div>
  );
}
