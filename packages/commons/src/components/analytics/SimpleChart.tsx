'use client';

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

interface SimpleChartProps {
  data: ChartData[];
  title?: string;
  type?: 'bar' | 'line';
  height?: number;
}

export function SimpleBarChart({
  data,
  title,
  height = 200,
}: SimpleChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className="w-full">
      {title && <h3 className="text-sm font-medium mb-3">{title}</h3>}
      <div className="space-y-3" style={{ height }}>
        {data.map((item, index) => (
          <div key={item.label} className="flex items-center gap-3">
            <div className="w-16 text-xs text-neutral-400 truncate">
              {item.label}
            </div>
            <div className="flex-1 relative">
              <div className="w-full bg-neutral-800 rounded-sm h-6 overflow-hidden">
                <div
                  className="h-full rounded-sm transition-all duration-500 ease-out"
                  style={{
                    width: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: item.color || '#00FF88',
                    background:
                      item.color || 'linear-gradient(90deg, #00FF88, #00E077)',
                  }}
                />
              </div>
              <div className="absolute right-2 top-0 h-6 flex items-center">
                <span className="text-xs font-medium text-neutral-200">
                  {item.value.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SimpleLineChart({
  data,
  title,
  height = 200,
}: SimpleChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));
  const range = maxValue - minValue || 1;

  const points = data
    .map((item, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((item.value - minValue) / range) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="w-full">
      {title && <h3 className="text-sm font-medium mb-3">{title}</h3>}
      <div
        className="relative bg-neutral-900 rounded-lg p-4"
        style={{ height }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {[20, 40, 60, 80].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="100"
              y2={y}
              stroke="rgb(64, 64, 64)"
              strokeWidth="0.5"
            />
          ))}

          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke="#00FF88"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Dots */}
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = 100 - ((item.value - minValue) / range) * 100;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="2"
                fill="#00FF88"
                className="hover:r-3 transition-all cursor-pointer"
              />
            );
          })}
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-neutral-500 pr-2">
          <span>{maxValue.toLocaleString()}</span>
          <span>{Math.round((maxValue + minValue) / 2).toLocaleString()}</span>
          <span>{minValue.toLocaleString()}</span>
        </div>

        {/* X-axis labels */}
        <div className="absolute bottom-0 left-0 w-full flex justify-between text-xs text-neutral-500 pt-2">
          {data.map((item, index) => (
            <span key={index} className="truncate max-w-16">
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
