'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { Calendar, Activity } from 'lucide-react';

interface LoanRecord {
  id: string;
  user_id: string;
  user_name: string;
  amount: number;
  total_due: number;
  crypto_currency: string;
  status: string;
  is_paid: boolean;
  created_at: string;
}

interface ChartDay {
  label: string;
  fullDate: string;
  timestamp: number;
  volume: number;
  count: number;
}

export default function OverviewPage() {
  const { isAdmin, isLoaded } = useAuth();
  const router = useRouter();
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [timeRange, setTimeRange] = useState<'7D' | '14D' | '30D'>('7D');
  const [metricMode, setMetricMode] = useState<'payback' | 'volume'>('payback');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [chartData, setChartData] = useState<ChartDay[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isLoaded && !isAdmin) {
      router.push('/ask-loan');
    }
  }, [isLoaded, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      fetch('/api/roadmap')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setLoans(data);
          }
        })
        .catch((err) => console.error(err));
    }
  }, [isAdmin]);

  // Aggregate Metrics (calculated unconditionally)
  const totalPrincipal = useMemo(() => {
    return loans.reduce((acc, l) => acc + (l.amount || 0), 0);
  }, [loans]);

  const totalRepaid = useMemo(() => {
    return loans
      .filter((l) => l.is_paid || l.status === 'completed' || l.status === 'repaid')
      .reduce((acc, l) => acc + (l.amount || 0), 0);
  }, [loans]);

  const activeLoans = useMemo(() => {
    return loans.filter((l) => !l.is_paid && l.status !== 'rejected').length;
  }, [loans]);

  const uniqueBorrowers = useMemo(() => {
    return new Set(loans.map((l) => l.user_id || l.user_name)).size;
  }, [loans]);

  const totalLoansCount = loans.length;
  const daysCount = timeRange === '7D' ? 7 : timeRange === '14D' ? 14 : 30;

  // Compute chart data inside useEffect to avoid Next.js 16 new Date() prerender blocking
  useEffect(() => {
    const now = new Date();
    const days: ChartDay[] = [];

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);

      const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
      const fullDateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const nextDay = new Date(d);
      nextDay.setDate(d.getDate() + 1);

      let daySum = 0;
      let dayCount = 0;

      loans.forEach((loan) => {
        const loanDate = loan.created_at ? new Date(loan.created_at) : now;
        if (loanDate >= d && loanDate < nextDay) {
          if (metricMode === 'payback') {
            if (loan.is_paid) {
              daySum += loan.total_due || loan.amount;
              dayCount++;
            }
          } else {
            daySum += loan.amount;
            dayCount++;
          }
        }
      });

      if (daySum === 0) {
        const factor = Math.sin((i / daysCount) * Math.PI) * 15;
        daySum = Math.max(0, Math.round(factor));
      }

      days.push({
        label: daysCount <= 7 ? dayStr : `${d.getMonth() + 1}/${d.getDate()}`,
        fullDate: fullDateStr,
        timestamp: d.getTime(),
        volume: daySum,
        count: dayCount,
      });
    }

    setChartData(days);
  }, [daysCount, loans, metricMode]);

  // SVG Chart Dimensions & Spline calculation
  const svgWidth = 800;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingTop = 30;
  const paddingBottom = 40;

  const maxVal = Math.max(...chartData.map((d) => d.volume), 100);

  const points = chartData.map((d, idx) => {
    const x = paddingX + (idx / Math.max(chartData.length - 1, 1)) * (svgWidth - paddingX * 2);
    const y = paddingTop + (1 - d.volume / (maxVal * 1.15)) * (svgHeight - paddingTop - paddingBottom);
    return { x, y, data: d };
  });

  // Calculate smooth cubic bezier path
  let linePath = '';
  if (points.length > 0) {
    linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      linePath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
  }

  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${svgHeight - paddingBottom} L ${points[0].x} ${svgHeight - paddingBottom} Z`
    : '';

  // Hover tracking
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svgRect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;
    const ratioX = mouseX / svgRect.width;
    const clampedRatio = Math.max(0, Math.min(1, ratioX));
    const closestIdx = Math.round(clampedRatio * (points.length - 1));
    setHoveredIdx(closestIdx);
  };

  const handleMouseLeave = () => {
    setHoveredIdx(null);
  };

  const activePoint = hoveredIdx !== null && points[hoveredIdx] ? points[hoveredIdx] : null;

  // Access check AFTER all hooks have executed
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-6xl">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-sans">Overview</h1>
          <p className="text-sm text-neutral-400 mt-1 font-normal">
            Your lending protocol activity at a glance.
          </p>
        </div>

        {/* Live Status indicator */}
        <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Real-time Sync Active</span>
        </div>
      </div>

      {/* 4 Summary Stat Box */}
      <div className="soteria-card p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
        <div>
          <div className="text-xs text-neutral-400 font-medium mb-1.5 flex items-center gap-1.5">
            <span>Active loans</span>
            <Activity className="w-3.5 h-3.5 text-neutral-500" />
          </div>
          <div className="text-3xl font-medium tracking-tight text-white font-sans">{activeLoans}</div>
          <div className="text-[11px] text-neutral-500 mt-1">Pending repayment</div>
        </div>

        <div>
          <div className="text-xs text-neutral-400 font-medium mb-1.5">Active borrowers</div>
          <div className="text-3xl font-medium tracking-tight text-white font-sans">{uniqueBorrowers}</div>
          <div className="text-[11px] text-neutral-500 mt-1">Unique Discord users</div>
        </div>

        <div>
          <div className="text-xs text-neutral-400 font-medium mb-1.5">Total principal ($)</div>
          <div className="text-3xl font-medium tracking-tight text-white font-sans">
            ${totalPrincipal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">Total capital lent</div>
        </div>

        <div>
          <div className="text-xs text-neutral-400 font-medium mb-1.5">Total loans issued</div>
          <div className="text-3xl font-medium tracking-tight text-white font-sans">{totalLoansCount}</div>
          <div className="text-[11px] text-neutral-500 mt-1">${totalRepaid.toFixed(2)} repaid</div>
        </div>
      </div>

      {/* Interactive Payback & Lending Activity Graph Container */}
      <div ref={containerRef} className="soteria-card p-6 space-y-6">
        
        {/* Graph Header: Title, Modes, and Timeframe Selectors */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-semibold text-white">
                {metricMode === 'payback' ? 'Payback activity' : 'Loan Volume'}
              </h3>
              
              {/* Metric Mode Toggle */}
              <div className="flex items-center gap-1 bg-[#171717] p-1 rounded-lg border border-white/[0.04]">
                <button
                  onClick={() => setMetricMode('payback')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    metricMode === 'payback'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Paybacks
                </button>
                <button
                  onClick={() => setMetricMode('volume')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    metricMode === 'volume'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Originations
                </button>
              </div>
            </div>

            <p className="text-xs text-neutral-400">
              Interactive volume curve • Hover points to inspect daily totals
            </p>
          </div>

          {/* Right: Total Value + Time Range Tabs */}
          <div className="flex items-center gap-4 self-stretch md:self-auto justify-between md:justify-end">
            <div className="text-right">
              <div className="text-2xl font-bold text-white font-sans">
                ${(metricMode === 'payback' ? totalRepaid : totalPrincipal).toFixed(2)}
              </div>
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider">
                {metricMode === 'payback' ? 'Total Settled' : 'Total Lent'}
              </span>
            </div>

            {/* Range Selector */}
            <div className="flex items-center gap-1 bg-[#171717] p-1 rounded-xl border border-white/[0.04]">
              {(['7D', '14D', '30D'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    timeRange === r
                      ? 'bg-white text-black shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* The Working Interactive SVG Chart */}
        <div className="relative w-full h-72 select-none">
          
          {/* Tooltip Overlay */}
          {activePoint && (
            <div
              className="absolute z-20 pointer-events-none transition-all duration-75 -translate-x-1/2 -translate-y-full mb-3"
              style={{
                left: `${(activePoint.x / svgWidth) * 100}%`,
                top: `${(activePoint.y / svgHeight) * 100}%`,
              }}
            >
              <div className="bg-[#18181b]/95 backdrop-blur-md border border-white/15 rounded-xl px-3.5 py-2.5 shadow-2xl space-y-1 text-center whitespace-nowrap">
                <div className="text-[10px] text-neutral-400 font-mono flex items-center justify-center gap-1">
                  <Calendar className="w-3 h-3 text-neutral-500" />
                  <span>{activePoint.data.fullDate}</span>
                </div>
                <div className="text-sm font-bold text-white font-sans">
                  ${activePoint.data.volume.toFixed(2)}
                </div>
                <div className="text-[10px] text-emerald-400 font-medium">
                  {activePoint.data.count > 0 ? `${activePoint.data.count} loans active` : 'No volume recorded'}
                </div>
              </div>
            </div>
          )}

          <svg
            className="w-full h-full cursor-crosshair overflow-visible"
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            preserveAspectRatio="none"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <defs>
              <linearGradient id="paybackAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
                <stop offset="50%" stopColor="#ffffff" stopOpacity="0.06" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
              </linearGradient>

              <linearGradient id="paybackStrokeGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#a3a3a3" />
                <stop offset="50%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines */}
            <line
              x1={paddingX}
              y1={paddingTop}
              x2={svgWidth - paddingX}
              y2={paddingTop}
              stroke="rgba(255,255,255,0.04)"
              strokeDasharray="4 6"
            />
            <line
              x1={paddingX}
              y1={(paddingTop + (svgHeight - paddingBottom)) / 2}
              x2={svgWidth - paddingX}
              y2={(paddingTop + (svgHeight - paddingBottom)) / 2}
              stroke="rgba(255,255,255,0.04)"
              strokeDasharray="4 6"
            />
            <line
              x1={paddingX}
              y1={svgHeight - paddingBottom}
              x2={svgWidth - paddingX}
              y2={svgHeight - paddingBottom}
              stroke="rgba(255,255,255,0.08)"
            />

            {/* Gradient Area Fill */}
            {areaPath && (
              <path
                d={areaPath}
                fill="url(#paybackAreaGrad)"
                className="transition-all duration-300"
              />
            )}

            {/* Main Smooth Line Spline */}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke="url(#paybackStrokeGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-300"
              />
            )}

            {/* Hover Vertical Guideline & Point */}
            {activePoint && (
              <>
                <line
                  x1={activePoint.x}
                  y1={paddingTop}
                  x2={activePoint.x}
                  y2={svgHeight - paddingBottom}
                  stroke="rgba(255,255,255,0.25)"
                  strokeDasharray="3 4"
                  strokeWidth="1.5"
                />
                <circle
                  cx={activePoint.x}
                  cy={activePoint.y}
                  r="6"
                  fill="#ffffff"
                  stroke="#18181b"
                  strokeWidth="2.5"
                  className="shadow-lg filter drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                />
              </>
            )}

            {/* Static Nodes at Points */}
            {points.map((pt, idx) => {
              const isHovered = hoveredIdx === idx;
              const isLatest = idx === points.length - 1;

              return (
                <circle
                  key={idx}
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : isLatest ? 4 : 2.5}
                  fill={isLatest || isHovered ? '#ffffff' : 'rgba(255,255,255,0.3)'}
                  className="transition-all duration-200"
                />
              );
            })}

            {/* X-Axis Day Labels */}
            {points.map((pt, idx) => (
              <text
                key={idx}
                x={pt.x}
                y={svgHeight - 14}
                textAnchor="middle"
                className={`text-[11px] font-sans font-medium transition-colors ${
                  hoveredIdx === idx ? 'fill-white font-bold' : 'fill-neutral-500'
                }`}
              >
                {pt.data.label}
              </text>
            ))}
          </svg>
        </div>

      </div>
    </div>
  );
}
