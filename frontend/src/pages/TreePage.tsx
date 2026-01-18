import React, { useEffect, useState } from 'react';
import { treeService, type TreeNode, type TreeData } from '../services/tree.service';
import { TreeVisualization } from '../components/tree/TreeVisualization';
import { NodeDetails } from '../components/tree/NodeDetails';
import { StatCard } from '../components/dashboard/StatCard';
import { Network, GitBranch, Users, Layers } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const TreePage: React.FC = () => {
  const { user } = useAuth();
  const [treeData, setTreeData] = useState<TreeData | null>(null);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTreeData();
  }, []);

  const loadTreeData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Si es super admin, carga árbol global, si no, carga su árbol
      const data = user?.role === 'super_admin'
        ? await treeService.getTree()
        : await treeService.getTree(user?.id);

      setTreeData(data);

      // Auto-select root node
      setSelectedNode(data.tree);
    } catch (err) {
      console.error('Error loading tree:', err);
      setError('Error al cargar el árbol jerárquico');
    } finally {
      setLoading(false);
    }
  };

  const handleNodeClick = (node: TreeNode) => {
    setSelectedNode(node);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando árbol jerárquico...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-destructive">{error}</p>
          <button
            onClick={loadTreeData}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!treeData) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">No hay datos disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Árbol Jerárquico</h1>
        <p className="text-muted-foreground mt-2">
          {user?.role === 'super_admin'
            ? 'Visualización global de toda la red de referidos'
            : 'Visualización de tu red de referidos'}
        </p>
      </div>

      {/* Stats */}
      {treeData.stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total de Nodos"
            value={treeData.stats.total_nodes}
            icon={Network}
            description="Personas en la red"
          />
          <StatCard
            title="Profundidad Máxima"
            value={treeData.stats.max_depth}
            icon={Layers}
            description="Niveles en el árbol"
          />
          <StatCard
            title="Total Líderes"
            value={treeData.stats.total_leaders}
            icon={Users}
            description="Con referidos directos"
          />
          <StatCard
            title="Nodo Raíz"
            value={treeData.tree.nombre_completo.split(' ')[0]}
            icon={GitBranch}
            description="Inicio de la jerarquía"
          />
        </div>
      )}

      {/* Tree Visualization and Details */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TreeVisualization data={treeData.tree} onNodeClick={handleNodeClick} />
        </div>
        <div>
          <NodeDetails node={selectedNode} />
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
        <h3 className="font-semibold mb-2">Instrucciones:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Haz clic en cualquier nodo para ver sus detalles</li>
          <li>Usa los botones de zoom para acercar o alejar el árbol</li>
          <li>Arrastra el árbol para moverlo por el área de visualización</li>
          <li>Los números rojos indican la cantidad de referidos directos</li>
          <li>Descarga el árbol como imagen SVG usando el botón de descarga</li>
        </ul>
      </div>
    </div>
  );
};
