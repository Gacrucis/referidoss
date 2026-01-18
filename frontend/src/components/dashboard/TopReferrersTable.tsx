import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import type { TopReferrer } from '../../types';

interface TopReferrersTableProps {
  referrers: TopReferrer[];
  title?: string;
  description?: string;
}

export const TopReferrersTable: React.FC<TopReferrersTableProps> = ({
  referrers,
  title = 'Top Referidores',
  description = 'Los usuarios con mayor red',
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {referrers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay datos disponibles
            </p>
          ) : (
            referrers.map((referrer, index) => (
              <div
                key={referrer.id}
                className="flex items-center justify-between space-x-4"
              >
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {index + 1}
                  </div>
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-accent">
                      {getInitials(referrer.nombre_completo)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {referrer.nombre_completo}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {referrer.cedula}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="whitespace-nowrap">
                    {referrer.direct_referrals_count} directos
                  </Badge>
                  <Badge variant="default" className="whitespace-nowrap">
                    {referrer.total_network_count} total
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
