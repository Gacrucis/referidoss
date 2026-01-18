import React, { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Eye, Loader2 } from 'lucide-react';
import api from '../../services/api';
import type { User } from '../../types';

interface DirectReferralsListProps {
  userId: number;
  onViewUser: (userId: number) => void;
}

export const DirectReferralsList: React.FC<DirectReferralsListProps> = ({
  userId,
  onViewUser,
}) => {
  const [referrals, setReferrals] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReferrals();
  }, [userId]);

  const loadReferrals = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/users?referrer_id=${userId}&per_page=10`);
      setReferrals(response.data.data || []);
    } catch (err) {
      console.error('Error loading referrals:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (referrals.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No tiene referidos directos
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
      <div className="max-h-64 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-700">Nombre</th>
              <th className="px-4 py-2 text-left font-medium text-gray-700">Cédula</th>
              <th className="px-4 py-2 text-center font-medium text-gray-700">Red</th>
              <th className="px-4 py-2 text-center font-medium text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {referrals.map((referral) => (
              <tr key={referral.id} className="border-t border-gray-200 hover:bg-white">
                <td className="px-4 py-2">{referral.nombre_completo}</td>
                <td className="px-4 py-2">{referral.cedula}</td>
                <td className="px-4 py-2 text-center">
                  <div className="flex gap-1 justify-center">
                    <Badge variant="secondary" className="text-xs">
                      {referral.direct_referrals_count}
                    </Badge>
                    <Badge variant="default" className="text-xs">
                      {referral.total_network_count}
                    </Badge>
                  </div>
                </td>
                <td className="px-4 py-2 text-center">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onViewUser(referral.id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
