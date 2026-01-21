import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { X, Loader2, Layers, GitBranch, Save } from 'lucide-react';
import { leaderService } from '../../services/leader.service';
import { lineaService } from '../../services/linea.service';
import { okService } from '../../services/ok.service';
import type { User, Linea, Ok, AdnType } from '../../types';

interface EditLeaderModalProps {
  leader: User;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditLeaderModal: React.FC<EditLeaderModalProps> = ({
  leader,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Datos del líder
  const [formData, setFormData] = useState({
    primer_nombre: leader.primer_nombre || '',
    segundo_nombre: leader.segundo_nombre || '',
    primer_apellido: leader.primer_apellido || '',
    segundo_apellido: leader.segundo_apellido || '',
    celular: leader.celular || '',
    email: leader.email || '',
  });

  // Datos de ADN
  const [adnType, setAdnType] = useState<AdnType>((leader as any).adn_type || null);
  const [selectedLineaIds, setSelectedLineaIds] = useState<number[]>(
    (leader as any).lineas?.map((l: Linea) => l.id) || []
  );
  const [selectedOkIds, setSelectedOkIds] = useState<number[]>(
    (leader as any).oks?.map((o: Ok) => o.id) || []
  );

  // Opciones disponibles
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [oks, setOks] = useState<Ok[]>([]);
  const [loadingAdn, setLoadingAdn] = useState(false);

  // Cargar opciones de ADN
  useEffect(() => {
    const loadAdnOptions = async () => {
      setLoadingAdn(true);
      try {
        const [lineasData, oksData] = await Promise.all([
          lineaService.getActiveLineas(),
          okService.getActiveOks(),
        ]);
        setLineas(lineasData);
        setOks(oksData);
      } catch (error) {
        console.error('Error al cargar opciones ADN:', error);
      } finally {
        setLoadingAdn(false);
      }
    };
    loadAdnOptions();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdnTypeChange = (type: AdnType) => {
    setAdnType(type);
    if (type === 'linea') {
      setSelectedOkIds([]);
    } else if (type === 'ok') {
      setSelectedLineaIds([]);
    } else {
      setSelectedLineaIds([]);
      setSelectedOkIds([]);
    }
  };

  const handleLineaToggle = (lineaId: number) => {
    setSelectedLineaIds((prev) =>
      prev.includes(lineaId)
        ? prev.filter((id) => id !== lineaId)
        : [...prev, lineaId]
    );
  };

  const handleOkToggle = (okId: number) => {
    setSelectedOkIds((prev) =>
      prev.includes(okId) ? prev.filter((id) => id !== okId) : [...prev, okId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const updateData: any = {
        ...formData,
        adn_type: adnType,
      };

      // Incluir IDs de ADN según el tipo
      if (adnType === 'linea') {
        updateData.linea_ids = selectedLineaIds;
        updateData.ok_ids = [];
      } else if (adnType === 'ok') {
        updateData.linea_ids = [];
        updateData.ok_ids = selectedOkIds;
      } else {
        updateData.linea_ids = [];
        updateData.ok_ids = [];
      }

      await leaderService.updateLeader(leader.id, updateData);
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string; error?: string } };
      };
      setError(
        error.response?.data?.error ||
          error.response?.data?.message ||
          'Error al actualizar el líder'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-blue-600">
          <div>
            <h2 className="text-xl font-bold text-white">Editar Líder</h2>
            <p className="text-white/80 text-sm">{leader.nombre_completo}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {success && (
            <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md border border-green-200 mb-4">
              Líder actualizado exitosamente
            </div>
          )}

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200 mb-4">
              {error}
            </div>
          )}

          {/* Información básica */}
          <div className="space-y-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-700">Información Personal</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="primer_nombre">Primer Nombre *</Label>
                <Input
                  id="primer_nombre"
                  name="primer_nombre"
                  value={formData.primer_nombre}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="segundo_nombre">Segundo Nombre</Label>
                <Input
                  id="segundo_nombre"
                  name="segundo_nombre"
                  value={formData.segundo_nombre}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="primer_apellido">Primer Apellido *</Label>
                <Input
                  id="primer_apellido"
                  name="primer_apellido"
                  value={formData.primer_apellido}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="segundo_apellido">Segundo Apellido *</Label>
                <Input
                  id="segundo_apellido"
                  name="segundo_apellido"
                  value={formData.segundo_apellido}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="celular">Celular *</Label>
                <Input
                  id="celular"
                  name="celular"
                  value={formData.celular}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Clasificación ADN */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Clasificación ADN</h3>
            <p className="text-xs text-gray-500">
              Un líder puede pertenecer a Líneas O a OKs, pero no a ambos.
            </p>

            {/* Radio buttons para tipo */}
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="adn_type"
                  checked={adnType === null}
                  onChange={() => handleAdnTypeChange(null)}
                  disabled={loading}
                  className="w-4 h-4 text-gray-600"
                />
                <span className="text-sm">Sin ADN</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="adn_type"
                  checked={adnType === 'linea'}
                  onChange={() => handleAdnTypeChange('linea')}
                  disabled={loading || lineas.length === 0}
                  className="w-4 h-4 text-blue-600"
                />
                <Layers className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Líneas</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="adn_type"
                  checked={adnType === 'ok'}
                  onChange={() => handleAdnTypeChange('ok')}
                  disabled={loading || oks.length === 0}
                  className="w-4 h-4 text-green-600"
                />
                <GitBranch className="h-4 w-4 text-green-600" />
                <span className="text-sm">OKs</span>
              </label>
            </div>

            {/* Selector de Líneas */}
            {adnType === 'linea' && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Label className="text-blue-800 mb-2 block">Selecciona Líneas:</Label>
                {loadingAdn ? (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cargando...
                  </div>
                ) : lineas.length === 0 ? (
                  <p className="text-sm text-blue-600">No hay líneas disponibles</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {lineas.map((linea) => {
                      const isSelected = selectedLineaIds.includes(linea.id);
                      return (
                        <button
                          key={linea.id}
                          type="button"
                          onClick={() => handleLineaToggle(linea.id)}
                          disabled={loading}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: linea.color || '#3B82F6' }}
                          />
                          {linea.nombre}
                          {isSelected && <X className="h-3 w-3" />}
                        </button>
                      );
                    })}
                  </div>
                )}
                {selectedLineaIds.length > 0 && (
                  <p className="text-xs text-blue-600 mt-2">
                    {selectedLineaIds.length} línea(s) seleccionada(s)
                  </p>
                )}
              </div>
            )}

            {/* Selector de OKs */}
            {adnType === 'ok' && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <Label className="text-green-800 mb-2 block">Selecciona OKs:</Label>
                {loadingAdn ? (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cargando...
                  </div>
                ) : oks.length === 0 ? (
                  <p className="text-sm text-green-600">No hay OKs disponibles</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {oks.map((ok) => {
                      const isSelected = selectedOkIds.includes(ok.id);
                      return (
                        <button
                          key={ok.id}
                          type="button"
                          onClick={() => handleOkToggle(ok.id)}
                          disabled={loading}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            isSelected
                              ? 'bg-green-600 text-white'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: ok.color || '#10B981' }}
                          />
                          {ok.nombre}
                          {isSelected && <X className="h-3 w-3" />}
                        </button>
                      );
                    })}
                  </div>
                )}
                {selectedOkIds.length > 0 && (
                  <p className="text-xs text-green-600 mt-2">
                    {selectedOkIds.length} OK(s) seleccionado(s)
                  </p>
                )}
              </div>
            )}

            {/* Mostrar ADN actual */}
            {((leader as any).lineas?.length > 0 || (leader as any).oks?.length > 0) && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-2">ADN actual:</p>
                <div className="flex flex-wrap gap-1">
                  {(leader as any).lineas?.map((l: Linea) => (
                    <Badge
                      key={l.id}
                      variant="outline"
                      className="text-xs"
                      style={{ borderColor: l.color || '#3B82F6', color: l.color || '#3B82F6' }}
                    >
                      <Layers className="h-3 w-3 mr-1" />
                      {l.nombre}
                    </Badge>
                  ))}
                  {(leader as any).oks?.map((o: Ok) => (
                    <Badge
                      key={o.id}
                      variant="outline"
                      className="text-xs"
                      style={{ borderColor: o.color || '#10B981', color: o.color || '#10B981' }}
                    >
                      <GitBranch className="h-3 w-3 mr-1" />
                      {o.nombre}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50 flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
