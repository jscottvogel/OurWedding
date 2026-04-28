'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { Schema } from '../../../../amplify/data/resource';

interface CategoryChartProps {
  items: Schema['BudgetItem']['type'][];
}

const COLORS = ['#6B8F71', '#4A6B50', '#C1693C', '#9A4F2A', '#B8972A', '#2C2C2C', '#666666'];

export default function CategoryChart({ items }: CategoryChartProps) {
  // Group items by category and sum actual costs
  const categoryData = items.reduce((acc: Record<string, number>, item) => {
    const category = item.category || 'Uncategorized';
    const cost = item.actualCost || 0;
    if (cost > 0) {
      acc[category] = (acc[category] || 0) + cost;
    }
    return acc;
  }, {});

  const data = Object.entries(categoryData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-light-gray shadow-sm p-6 h-80 flex flex-col items-center justify-center text-mid-gray">
        <p>No expense data yet</p>
        <p className="text-sm mt-2">Add actual costs to see your breakdown</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-light-gray shadow-sm p-6 h-96 flex flex-col">
      <h3 className="text-lg font-display text-sage mb-4">Spend by Category</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Spent']}
              contentStyle={{ borderRadius: '8px', border: '1px solid #EEEEEE' }}
            />
            <Legend 
              layout="horizontal" 
              verticalAlign="bottom" 
              align="center"
              wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
