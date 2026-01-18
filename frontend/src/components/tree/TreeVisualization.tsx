import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { TreeNode } from '../../services/tree.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ZoomIn, ZoomOut, Maximize2, Download, Search } from 'lucide-react';

interface TreeVisualizationProps {
  data: TreeNode;
  onNodeClick?: (node: TreeNode) => void;
}

interface HierarchyNode extends d3.HierarchyPointNode<TreeNode> {
  _children?: HierarchyNode[];
}

export const TreeVisualization: React.FC<TreeVisualizationProps> = ({
  data,
  onNodeClick,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [maxDepth, setMaxDepth] = useState(3);
  const [nodeSpacing, setNodeSpacing] = useState(2.5);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height: Math.max(height, 600) });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || !data || dimensions.width === 0) return;
    renderTree();
  }, [data, dimensions, maxDepth, searchTerm, nodeSpacing]);

  const getShortName = (fullName: string): string => {
    const parts = fullName.split(' ');
    if (parts.length <= 2) return fullName;
    return `${parts[0]} ${parts[parts.length - 1]}`;
  };

  const toggleNode = (d: HierarchyNode) => {
    if (d.children) {
      d._children = d.children;
      d.children = undefined;
    } else if (d._children) {
      d.children = d._children;
      d._children = undefined;
    }
    renderTree();
  };

  const collapseAll = (node: HierarchyNode, depth: number = 0) => {
    if (node.children) {
      if (depth >= maxDepth) {
        node._children = node.children;
        node.children = undefined;
      } else {
        node.children.forEach((child) => collapseAll(child as HierarchyNode, depth + 1));
      }
    }
  };

  const getAllDescendants = (node: HierarchyNode): HierarchyNode[] => {
    let descendants: HierarchyNode[] = [];
    if (node.children) {
      node.children.forEach((child) => {
        descendants.push(child as HierarchyNode);
        descendants = descendants.concat(getAllDescendants(child as HierarchyNode));
      });
    }
    return descendants;
  };

  const renderTree = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 40, right: 250, bottom: 40, left: 250 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    let currentTransform = d3.zoomIdentity;

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 8])
      .on('zoom', (event) => {
        currentTransform = event.transform;
        g.attr('transform', currentTransform.toString());

        // Ocultar/mostrar nombres según el nivel de zoom
        const scale = currentTransform.k;

        // Calcular opacidad de texto basada en el zoom
        // Cuando zoom < 0.5, ocultar todos los textos
        // Cuando zoom >= 0.5, mostrar solo algunos textos según la escala
        let textOpacity = 0;
        if (scale >= 0.8) {
          textOpacity = 1; // Mostrar todos
        } else if (scale >= 0.5) {
          textOpacity = 0.5; // Mostrar semi-transparente
        } else if (scale >= 0.3) {
          textOpacity = 0.2; // Apenas visible
        }

        g.selectAll('text')
          .style('opacity', textOpacity)
          .style('display', scale > 0.25 ? 'block' : 'none');

        // Ajustar tamaño de nodos según zoom
        g.selectAll('circle:not(.network-badge)')
          .attr('r', (d: any) => {
            const hierNode = d as HierarchyNode;
            const baseSize = hierNode._children ? 10 : (d.depth === 0 ? 12 : 8);
            return scale < 0.5 ? baseSize * 0.7 : baseSize;
          });
      });

    svg.call(zoom as any);

    // Create tree layout with dynamic spacing
    const treeLayout = d3
      .tree<TreeNode>()
      .size([height, width])
      .separation((a, b) => (a.parent === b.parent ? nodeSpacing : nodeSpacing * 1.2));

    // Convert data to hierarchy
    const root = d3.hierarchy(data, (d) => d.children) as HierarchyNode;

    // Collapse nodes beyond maxDepth
    collapseAll(root);

    // Compute tree layout
    treeLayout(root);

    // Create links group
    const linksGroup = g.append('g').attr('class', 'links');

    // Add links with curved paths
    linksGroup
      .selectAll('.link')
      .data(root.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', (d) => {
        const targetName = (d.target as HierarchyNode).data.nombre_completo.toLowerCase();
        const targetCedula = (d.target as HierarchyNode).data.cedula;
        if (searchTerm && (targetName.includes(searchTerm.toLowerCase()) || targetCedula.includes(searchTerm))) {
          return '#ef4444';
        }
        return '#cbd5e1';
      })
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.6)
      .attr(
        'd',
        d3
          .linkHorizontal<d3.HierarchyPointLink<TreeNode>, d3.HierarchyPointNode<TreeNode>>()
          .x((d) => d.y)
          .y((d) => d.x)
      );

    // Create nodes group
    const nodesGroup = g.append('g').attr('class', 'nodes');

    // Add nodes
    const node = nodesGroup
      .selectAll('.node')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d) => `translate(${d.y},${d.x})`)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        const hierNode = d as HierarchyNode;

        if (hierNode.children || hierNode._children) {
          toggleNode(hierNode);
        } else if (onNodeClick) {
          onNodeClick(d.data);
        }
      })
      .on('mouseenter', function(_event, d) {
        const hierNode = d as HierarchyNode;
        const descendants = getAllDescendants(hierNode);
        const descendantIds = descendants.map(desc => desc.data.id);

        // Highlight this node and all descendants
        nodesGroup.selectAll('.node')
          .style('opacity', (node: any) => {
            if (node.data.id === hierNode.data.id || descendantIds.includes(node.data.id)) {
              return 1;
            }
            return 0.2;
          });

        // Highlight links
        linksGroup.selectAll('.link')
          .style('opacity', (linkData: any) => {
            const source = linkData.source as HierarchyNode;
            if (source.data.id === hierNode.data.id || descendantIds.includes(source.data.id)) {
              return 1;
            }
            return 0.1;
          })
          .attr('stroke-width', (linkData: any) => {
            const source = linkData.source as HierarchyNode;
            if (source.data.id === hierNode.data.id || descendantIds.includes(source.data.id)) {
              return 4;
            }
            return 2;
          });

        // Highlight network badge
        d3.select(this).select('.network-badge')
          .transition()
          .duration(200)
          .attr('r', 25)
          .attr('opacity', 0.3);
      })
      .on('mouseleave', function() {
        // Reset all opacities
        nodesGroup.selectAll('.node').style('opacity', 1);
        linksGroup.selectAll('.link')
          .style('opacity', 0.6)
          .attr('stroke-width', 2);

        d3.select(this).select('.network-badge')
          .transition()
          .duration(200)
          .attr('r', 0)
          .attr('opacity', 0);
      });

    // Add network highlight circle (hidden by default)
    node
      .append('circle')
      .attr('class', 'network-badge')
      .attr('r', 0)
      .attr('fill', '#3b82f6')
      .attr('opacity', 0)
      .lower();

    // Add glow effect for searched nodes
    node
      .filter((d) => {
        const name = d.data.nombre_completo.toLowerCase();
        const cedula = d.data.cedula;
        return !!(searchTerm && (name.includes(searchTerm.toLowerCase()) || cedula.includes(searchTerm)));
      })
      .append('circle')
      .attr('r', 20)
      .attr('fill', '#ef4444')
      .attr('opacity', 0.2);

    // Add circles for nodes
    node
      .append('circle')
      .attr('r', (d) => {
        const hierNode = d as HierarchyNode;
        if (hierNode._children) return 10;
        if (d.depth === 0) return 12;
        return 8;
      })
      .attr('fill', (d) => {
        const hierNode = d as HierarchyNode;
        const name = d.data.nombre_completo.toLowerCase();
        const cedula = d.data.cedula;

        if (searchTerm && (name.includes(searchTerm.toLowerCase()) || cedula.includes(searchTerm))) {
          return '#ef4444';
        }

        if (d.depth === 0) return '#3b82f6';
        if (hierNode._children) return '#f59e0b';
        if (d.data.direct_referrals_count > 0) return '#10b981';
        return '#64748b';
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 3);

    // Add "+" indicator for collapsed nodes
    node
      .filter((d) => !!(d as HierarchyNode)._children)
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', '#fff')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .text('+');

    // Add badge for direct referrals count
    node
      .filter((d) => d.data.direct_referrals_count > 0 && !(d as HierarchyNode)._children)
      .append('circle')
      .attr('r', 11)
      .attr('cx', 18)
      .attr('cy', -18)
      .attr('fill', '#ef4444')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    node
      .filter((d) => d.data.direct_referrals_count > 0 && !(d as HierarchyNode)._children)
      .append('text')
      .attr('x', 18)
      .attr('y', -13)
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .text((d) => d.data.direct_referrals_count);

    // Add labels with shortened names
    node
      .append('text')
      .attr('dy', '0.31em')
      .attr('x', (d) => {
        const hierNode = d as HierarchyNode;
        return hierNode.children || hierNode._children ? -20 : 20;
      })
      .attr('text-anchor', (d) => {
        const hierNode = d as HierarchyNode;
        return hierNode.children || hierNode._children ? 'end' : 'start';
      })
      .text((d) => getShortName(d.data.nombre_completo))
      .attr('font-size', '14px')
      .attr('font-weight', (d) => {
        const name = d.data.nombre_completo.toLowerCase();
        const cedula = d.data.cedula;
        if (d.depth === 0) return 'bold';
        return searchTerm && (name.includes(searchTerm.toLowerCase()) || cedula.includes(searchTerm)) ? 'bold' : 'normal';
      })
      .attr('fill', '#1e293b')
      .clone(true)
      .lower()
      .attr('stroke', '#fff')
      .attr('stroke-width', 4);

    // Add cedula below name
    node
      .append('text')
      .attr('dy', '2em')
      .attr('x', (d) => {
        const hierNode = d as HierarchyNode;
        return hierNode.children || hierNode._children ? -20 : 20;
      })
      .attr('text-anchor', (d) => {
        const hierNode = d as HierarchyNode;
        return hierNode.children || hierNode._children ? 'end' : 'start';
      })
      .text((d) => d.data.cedula.substring(0, 10))
      .attr('font-size', '10px')
      .attr('fill', '#94a3b8')
      .clone(true)
      .lower()
      .attr('stroke', '#fff')
      .attr('stroke-width', 3);

    // Center and fit the tree
    setTimeout(() => {
      const bounds = g.node()?.getBBox();
      if (bounds) {
        const fullWidth = dimensions.width;
        const fullHeight = dimensions.height;
        const midX = bounds.x + bounds.width / 2;
        const midY = bounds.y + bounds.height / 2;

        const scale = 0.8 / Math.max(bounds.width / fullWidth, bounds.height / fullHeight);
        const clampedScale = Math.max(0.2, Math.min(scale, 1.2));

        const translateX = fullWidth / 2 - clampedScale * midX;
        const translateY = fullHeight / 2 - clampedScale * midY;

        svg.call(
          zoom.transform as any,
          d3.zoomIdentity.translate(translateX, translateY).scale(clampedScale)
        );
      }
    }, 100);
  };

  const handleZoomIn = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 1.3);
  };

  const handleZoomOut = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 0.7);
  };

  const handleResetZoom = () => {
    renderTree();
  };

  const handleDownloadSVG = () => {
    if (!svgRef.current) return;

    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'arbol-referidos.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle>Árbol Jerárquico de Referidos</CardTitle>
            <CardDescription>
              Pasa el mouse sobre un nodo para ver toda su red. Haz clic para expandir/colapsar.
            </CardDescription>
          </div>
        </div>

        <div className="flex gap-4 items-end flex-wrap mt-4">
          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="search">Buscar (Nombre o Cédula)</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Buscar persona..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="min-w-[150px]">
            <Label htmlFor="maxDepth">Niveles Visibles</Label>
            <select
              id="maxDepth"
              value={maxDepth}
              onChange={(e) => setMaxDepth(Number(e.target.value))}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            >
              <option value="1">1 nivel</option>
              <option value="2">2 niveles</option>
              <option value="3">3 niveles</option>
              <option value="4">4 niveles</option>
              <option value="5">5 niveles</option>
              <option value="999">Todos</option>
            </select>
          </div>

          <div className="min-w-[150px]">
            <Label htmlFor="spacing">Separación</Label>
            <select
              id="spacing"
              value={nodeSpacing}
              onChange={(e) => setNodeSpacing(Number(e.target.value))}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            >
              <option value="1.5">Compacto</option>
              <option value="2.5">Normal</option>
              <option value="3.5">Espaciado</option>
              <option value="5">Muy Espaciado</option>
            </select>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleZoomIn} title="Acercar">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomOut} title="Alejar">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleResetZoom} title="Centrar">
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadSVG} title="Descargar SVG">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="w-full" style={{ height: '700px' }}>
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            style={{ background: '#f8fafc', borderRadius: '0.5rem' }}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-muted-foreground">Nodo raíz</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-muted-foreground">Con referidos visibles</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-muted-foreground">Con referidos ocultos (clic para expandir)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-500"></div>
            <span className="text-muted-foreground">Sin referidos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-muted-foreground">Búsqueda activa</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
