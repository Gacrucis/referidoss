import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Share2, Copy, Check, ExternalLink } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const ReferralCodeCard: React.FC = () => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (!user) return null;

  const referralUrl = `${window.location.origin}/register/${user.referral_code}`;

  const copyCode = () => {
    navigator.clipboard.writeText(user.referral_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const shareWhatsApp = () => {
    const message = encodeURIComponent(
      `¡Únete a mi red! Regístrate usando mi código: ${user.referral_code}\n\nO usa este link directo: ${referralUrl}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5 text-primary" />
          Tu Código de Referido
        </CardTitle>
        <CardDescription>
          Comparte este código para que otras personas se unan a tu red
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Código */}
        <div>
          <p className="text-sm font-medium mb-2">Código:</p>
          <div className="flex gap-2">
            <Input
              value={user.referral_code}
              readOnly
              className="font-mono font-bold text-lg bg-white"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={copyCode}
              title="Copiar código"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* URL */}
        <div>
          <p className="text-sm font-medium mb-2">Link de Registro:</p>
          <div className="flex gap-2">
            <Input
              value={referralUrl}
              readOnly
              className="font-mono text-sm bg-white"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={copyUrl}
              title="Copiar link"
            >
              {copiedUrl ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.open(referralUrl, '_blank')}
              title="Abrir link"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Botón WhatsApp */}
        <Button
          onClick={shareWhatsApp}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          <Share2 className="mr-2 h-4 w-4" />
          Compartir por WhatsApp
        </Button>

        <div className="bg-white/50 p-3 rounded border border-blue-200">
          <p className="text-xs text-muted-foreground">
            Las personas que se registren usando tu código quedarán automáticamente
            asociadas a tu red y podrán seguir refiriendo a otras personas.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
