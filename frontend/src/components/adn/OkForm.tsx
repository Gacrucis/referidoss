import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Loader2, X } from 'lucide-react';
import { okService } from '../../services/ok.service';
import type { Ok, OkFormData } from '../../types';

interface OkFormProps {
  ok?: Ok | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const OkForm: React.FC<OkFormProps> = ({ ok, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState<OkFormData>({
    nombre: ok?.nombre || '',
    descripcion: ok?.descripcion || '',
    color: ok?.color || '#10B981',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isEditing = !!ok;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEditing) {
        await okService.updateOk(ok.id, formData);
        setSuccess('OK actualizado exitosamente');
      } else {
        await okService.createOk(formData);
        setSuccess('OK creado exitosamente');
      }

      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string; message?: string } } };
      setError(error.response?.data?.error || error.response?.data?.message || 'Error al guardar el OK');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">
          {isEditing ? 'Editar OK' : 'Nuevo OK'}
        </h2>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Nombre del OK"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                id="color"
                name="color"
                value={formData.color || '#10B981'}
                onChange={handleChange}
                disabled={loading}
                className="w-16 h-10 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={formData.color || '#10B981'}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                disabled={loading}
                placeholder="#10B981"
                className="flex-1"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="descripcion">Descripción</Label>
          <textarea
            id="descripcion"
            name="descripcion"
            value={formData.descripcion || ''}
            onChange={handleChange}
            disabled={loading}
            placeholder="Descripción del OK (opcional)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              isEditing ? 'Actualizar' : 'Crear OK'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
