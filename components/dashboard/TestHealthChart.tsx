'use client';

import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { chartData7Days, chartData30Days } from '@/data/mockData';

const tabs = [
  { label: '7 Days', data: chartData7Days },
  { label: '30 Days', data: chartData30Days },
];

export function TestHealthChart() {
  const [activeTab, setActiveTab] = useState(0);
  const data = tabs[activeTab].data;

  return (
    <div className="rounded-xl bg-surface border border-border p-5 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Test Health Overview
          </h3>
          <p className="text-sm text-secondary-text mt-0.5">
            Execution trends across your QA workspace.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-elevated rounded-lg p-1 border border-border w-fit">
          {tabs.map((tab, i) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(i)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === i
                  ? 'bg-primary text-white'
                  : 'text-secondary-text hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-success" />
          <span className="text-secondary-text">Passed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-danger" />
          <span className="text-secondary-text">Failed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-warning" />
          <span className="text-secondary-text">Skipped</span>
        </div>
      </div>

      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="cPassed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22C55E" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="cFailed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EF4444" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="cSkipped" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#232C38" vertical={false} />
            <XAxis
              dataKey="day"
              stroke="#667085"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#667085"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#151C26',
                border: '1px solid #232C38',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#F5F7FA',
              }}
              labelStyle={{ color: '#98A2B3' }}
            />
            <Area
              type="monotone"
              dataKey="passed"
              stroke="#22C55E"
              strokeWidth={2}
              fill="url(#cPassed)"
            />
            <Area
              type="monotone"
              dataKey="failed"
              stroke="#EF4444"
              strokeWidth={2}
              fill="url(#cFailed)"
            />
            <Area
              type="monotone"
              dataKey="skipped"
              stroke="#F59E0B"
              strokeWidth={2}
              fill="url(#cSkipped)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
