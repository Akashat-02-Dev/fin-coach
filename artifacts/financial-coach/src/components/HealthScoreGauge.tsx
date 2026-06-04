interface HealthScoreGaugeProps {
  score: number;
  label: string;
}

export function HealthScoreGauge({ score, label }: HealthScoreGaugeProps) {
  // SVG arc math
  const radius = 60;
  const strokeWidth = 12;
  const cx = 80;
  const cy = 80;
  const circumference = 2 * Math.PI * radius;
  
  // Create a 270 degree arc (3/4 of a circle)
  // We want to start at bottom-left (-225 degrees from standard 0=right)
  // and end at bottom-right (45 degrees)
  // Standard SVG coordinates: 0 is right, 90 is bottom, 180 is left, 270 is top
  
  // Draw the background arc
  // Start point: x = cx + r * cos(135 deg), y = cy + r * sin(135 deg)
  const startAngle = 135 * (Math.PI / 180);
  const endAngle = 45 * (Math.PI / 180);
  
  const startX = cx + radius * Math.cos(startAngle);
  const startY = cy + radius * Math.sin(startAngle);
  const endX = cx + radius * Math.cos(endAngle);
  const endY = cy + radius * Math.sin(endAngle);

  // Large arc flag is 1 if sweep > 180 degrees
  const largeArcFlag = 1;
  const sweepFlag = 1; // sweep clockwise
  
  const backgroundPath = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`;

  // Draw the progress arc
  // Total sweep angle is 270 degrees
  const clampedScore = Math.max(0, Math.min(100, score));
  const progressSweepAngle = (270 * (clampedScore / 100)) * (Math.PI / 180);
  
  const progressAngle = startAngle + progressSweepAngle;
  const progressX = cx + radius * Math.cos(progressAngle);
  const progressY = cy + radius * Math.sin(progressAngle);
  
  const progressLargeArcFlag = progressSweepAngle > Math.PI ? 1 : 0;
  
  const progressPath = clampedScore === 0 
    ? "" 
    : `M ${startX} ${startY} A ${radius} ${radius} 0 ${progressLargeArcFlag} ${sweepFlag} ${progressX} ${progressY}`;

  // Color selection
  let colorClass = "stroke-destructive"; // hsl(0 84% 60%)
  if (score >= 80) colorClass = "stroke-[hsl(142_60%_45%)]";
  else if (score >= 65) colorClass = "stroke-primary"; // hsl(200 45% 30%)
  else if (score >= 40) colorClass = "stroke-[hsl(38_92%_50%)]"; // amber

  return (
    <div className="relative flex flex-col items-center justify-center w-[160px] h-[160px]">
      <svg width="160" height="160" viewBox="0 0 160 160" className="absolute top-0 left-0">
        {/* Background arc */}
        <path
          d={backgroundPath}
          fill="none"
          className="stroke-muted"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Progress arc */}
        {clampedScore > 0 && (
          <path
            d={progressPath}
            fill="none"
            className={colorClass}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        )}
      </svg>
      <div className="flex flex-col items-center justify-center mt-2 z-10">
        <span className="text-4xl font-bold font-mono tracking-tighter">{score}</span>
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
    </div>
  );
}
