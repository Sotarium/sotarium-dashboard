'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { Calendar, Activity, ChevronLeft, ChevronRight } from 'lucide-react';

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
  dayNum: number;
  label: string;
  fullDate: string;
  timestamp: number;
  volume: number;
  count: number;
}

export default function OverviewPage() {
  const { user, isAdmin, isLoaded } = useAuth();
  const router = useRouter();
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [metricMode, setMetricMode] = useState<'payback' | 'volume'>('payback');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Selected Month State for Calendar Navigation (initialized safely to prevent Next.js prerender error)
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date('2026-11-01T00:00:00Z'));

  useEffect(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    setSelectedMonth(d);
  }, []);

  const [chartData, setChartData] = useState<ChartDay[]>([]);

  useEffect(() => {
    if (isLoaded && !isAdmin) {
      router.push('/ask-loan');
    }
  }, [isLoaded, isAdmin, router]);

  useEffect(() => {
    if (isAdmin && user?.id) {
      fetch(`/api/roadmap?requesterId=${user.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setLoans(data);
          }
        })
        .catch((err) => console.error(err));
    }
  }, [isAdmin, user?.id]);

  // Aggregate Metrics: Only consider accepted / approved / issued loans
  const issuedLoans = useMemo(() => {
    return loans.filter((l) => l.status === 'approved' || l.status === 'active' || l.status === 'completed' || l.status === 'repaid');
  }, [loans]);

  const totalPrincipal = useMemo(() => {
    return issuedLoans.reduce((acc, l) => acc + (l.amount || 0), 0);
  }, [issuedLoans]);

  const totalRepaid = useMemo(() => {
    return issuedLoans
      .filter((l) => l.is_paid || l.status === 'completed' || l.status === 'repaid')
      .reduce((acc, l) => acc + (l.amount || 0), 0);
  }, [issuedLoans]);

  const activeLoans = useMemo(() => {
    return loans.filter((l) => (l.status === 'approved' || l.status === 'active') && !l.is_paid).length;
  }, [loans]);

  const uniqueBorrowers = useMemo(() => {
    const activeBorrowersList = loans.filter((l) => (l.status === 'approved' || l.status === 'active') && !l.is_paid);
    return new Set(activeBorrowersList.map((l) => l.user_id || l.user_name).filter(Boolean)).size;
  }, [loans]);

  const totalLoansCount = issuedLoans.length;

  // Build daily graph points for the currently selected month
  useEffect(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: ChartDay[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      d.setHours(0, 0, 0, 0);
      const nextD = new Date(year, month, day + 1);
      nextD.setHours(0, 0, 0, 0);

      const fullDateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      // Match loans occurring on this exact day
      let daySum = 0;
      let dayCount = 0;

      issuedLoans.forEach((loan) => {
        if (!loan.created_at) return;
        const loanDate = new Date(loan.created_at);
        if (loanDate >= d && loanDate < nextD) {
          if (metricMode === 'payback') {
            if (loan.is_paid || loan.status === 'completed' || loan.status === 'repaid') {
              daySum += loan.total_due || loan.amount;
              dayCount++;
            }
          } else {
            daySum += loan.amount;
            dayCount++;
          }
        }
      });

      // Show day label only on spaced intervals (Day 1, 5, 10, 15, 20, 25, and last day) to prevent crowding
      const shouldShowLabel = day === 1 || day % 5 === 0 || day === daysInMonth;

      days.push({
        dayNum: day,
        label: shouldShowLabel ? `${day}` : '',
        fullDate: fullDateStr,
        timestamp: d.getTime(),
        volume: daySum,
        count: dayCount,
      });
    }

    setChartData(days);
  }, [selectedMonth, issuedLoans, metricMode]);

  // Total volume in the selected month
  const monthTotal = useMemo(() => {
    return chartData.reduce((acc, d) => acc + d.volume, 0);
  }, [chartData]);

  // SVG Chart Dimensions & Spline calculation
  const svgWidth = 800;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingTop = 30;
  const paddingBottom = 40;

  // Calculate dynamic max value for scaling: if peak volume is low, scale up so peaks rise clearly
  const peakVolume = Math.max(...chartData.map((d) => d.volume), 0);
  const maxVal = peakVolume > 0 ? peakVolume : 10;

  const points = chartData.map((d, idx) => {
    const x = paddingX + (idx / Math.max(chartData.length - 1, 1)) * (svgWidth - paddingX * 2);
    const y = paddingTop + (1 - d.volume / (maxVal * 1.25)) * (svgHeight - paddingTop - paddingBottom);
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

  // Month navigation helpers
  const handlePrevMonth = () => {
    setSelectedMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const handleNextMonth = () => {
    setSelectedMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  // Access check AFTER all hooks have executed
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-6xl">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white font-sans">Overview</h1>
      </div>

      {/* Interactive Payback & Lending Activity Graph Container */}
      <div ref={containerRef} className="soteria-card p-6 space-y-6">
        
        {/* Graph Header: Title, Metric Toggle, and Calendar Month Selector */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold text-white">
              Payback activity
            </h3>
          </div>

          {/* Right: Total Value + Month Calendar Selector */}
          <div className="flex items-center gap-4 self-stretch md:self-auto justify-between md:justify-end">
            <div className="text-right">
              <div className="text-2xl font-bold text-white font-sans">
                ${monthTotal.toFixed(2)}
              </div>
            </div>

            {/* Calendar Month Navigation Button */}
            <div className="flex items-center gap-1 bg-[#171717] p-1 rounded-xl border border-white/[0.06] select-none">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 px-2.5 py-1 text-xs font-semibold text-white">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                <span>
                  {selectedMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              </div>

              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* The Clean, Uncrowded Interactive SVG Chart */}
        <div className="relative w-full h-72 select-none">
          
          {/* Tooltip Overlay (Clean: Date + Amount only, zero 'No volume recorded' text) */}
          {activePoint && (
            <div
              className="absolute z-20 pointer-events-none transition-all duration-75 -translate-x-1/2 -translate-y-full mb-3"
              style={{
                left: `${(activePoint.x / svgWidth) * 100}%`,
                top: `${(activePoint.y / svgHeight) * 100}%`,
              }}
            >
              <div className="bg-[#18181b]/95 backdrop-blur-md border border-white/15 rounded-xl px-3.5 py-2 shadow-2xl space-y-1 text-center whitespace-nowrap">
                <div className="text-[10px] text-neutral-400 font-mono flex items-center justify-center gap-1">
                  <Calendar className="w-3 h-3 text-neutral-500" />
                  <span>{activePoint.data.fullDate}</span>
                </div>
                <div className="text-sm font-bold text-white font-sans">
                  ${activePoint.data.volume.toFixed(2)}
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
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.16" />
                <stop offset="50%" stopColor="#ffffff" stopOpacity="0.04" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
              </linearGradient>

              <linearGradient id="paybackStrokeGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#888888" />
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

            {/* Hover Vertical Guideline & Glowing Point */}
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
              const isSpacedTick = pt.data.dayNum === 1 || pt.data.dayNum % 5 === 0 || pt.data.dayNum === chartData.length;

              return (
                <circle
                  key={idx}
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : isSpacedTick ? 3.5 : 2}
                  fill={isHovered ? '#ffffff' : isSpacedTick ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.15)'}
                  className="transition-all duration-200"
                />
              );
            })}

            {/* X-Axis Day Labels: Cleanly spaced (Day 1, 5, 10, 15, 20, 25, 30) - Zero Crowding */}
            {points.map((pt, idx) => {
              if (!pt.data.label) return null;

              return (
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
              );
            })}
          </svg>
        </div>

      </div>
    </div>
  );
}
