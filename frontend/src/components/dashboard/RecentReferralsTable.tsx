import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import type { User } from '../../types';

interface RecentReferralsTableProps {
  referrals: User[];
  title?: string;
  description?: string;
}

export const RecentReferralsTable: React.FC<RecentReferralsTableProps> = ({
  referrals,
  title = 'Referidos Recientes',
  description = 'Últimos registros en la red',
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {referrals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay referidos recientes
            </p>
          ) : (
            referrals.map((referral) => (
              <div
                key={referral.id}
                className="flex items-start justify-between space-x-4 pb-3 border-b last:border-0 last:pb-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {referral.nombre_completo}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-muted-foreground">
                      {referral.cedula}
                    </p>
                    <span className="text-xs text-muted-foreground">•</span>
                    <p className="text-xs text-muted-foreground">
                      {referral.municipio_votacion}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(referral.created_at)}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0">
                  Nivel {referral.level}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
