import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Loader2, X } from 'lucide-react';
import { lineaService } from '../../services/linea.service';
import type { Linea, LineaFormData } from '../../types';

interface LineaFormProps {
  linea?: Linea | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const LineaForm: React.FC<LineaFormProps> = ({ linea, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState<LineaFormData>({
    nombre: linea?.nombre || '',
    descripcion: linea?.descripcion || '',
    color: linea?.color || '#3B82F6',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isEditing = !!linea;

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
        await lineaService.updateLinea(linea.id, formData);
        setSuccess('Línea actualizada exitosamente');
      } else {
        await lineaService.createLinea(formData);
        setSuccess('Línea creada exitosamente');
      }

      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string; message?: string } } };
      setError(error.response?.data?.error || error.response?.data?.message || 'Error al guardar la línea');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">
          {isEditing ? 'Editar Línea' : 'Nueva Línea'}
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
              placeholder="Nombre de la línea"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                id="color"
                name="color"
                value={formData.color || '#3B82F6'}
                onChange={handleChange}
                disabled={loading}
                className="w-16 h-10 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={formData.color || '#3B82F6'}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                disabled={loading}
                placeholder="#3B82F6"
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
            placeholder="Descripción de la línea (opcional)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              isEditing ? 'Actualizar' : 'Crear Línea'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
