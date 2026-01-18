import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import type { GrowthDataPoint } from '../../types';

interface GrowthChartProps {
  data: GrowthDataPoint[];
  title?: string;
  description?: string;
}

export const GrowthChart: React.FC<GrowthChartProps> = ({
  data,
  title = 'Crecimiento de la Red',
  description = 'Nuevos referidos por día',
}) => {
  const formattedData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString('es-CO', {
      month: 'short',
      day: 'numeric',
    }),
    count: item.count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="count"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
