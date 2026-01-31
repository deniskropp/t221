import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { LearningGraphData, GraphNode, GraphLink } from '../types';

interface KnowledgeGraphProps {
  data: LearningGraphData;
  currentNodeId: string;
  onNodeClick: (nodeId: string) => void;
}

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ data, currentNodeId, onNodeClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });

  // Handle Resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    
    window.addEventListener('resize', updateDimensions);
    updateDimensions();
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // D3 Logic
  useEffect(() => {
    if (!svgRef.current || data.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous

    const width = dimensions.width;
    const height = dimensions.height;

    // Simulation Setup
    // We create a copy of nodes/links because d3 mutates them
    const nodes = data.nodes.map(d => ({ ...d }));
    const links = data.links.map(d => ({ ...d }));

    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(40));

    // Arrow Marker
    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25) // Offset to not overlap node
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("xoverflow", "visible")
      .append("path")
      .attr("d", "M 0,-5 L 10 ,0 L 0,5")
      .attr("fill", "#64748b")
      .style("stroke", "none");

    // Links
    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "#475569")
      .attr("stroke-width", 2)
      .attr("marker-end", "url(#arrowhead)");

    // Nodes Group
    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("cursor", "pointer")
      .call(d3.drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Node Circles
    node.append("circle")
      .attr("r", 20)
      .attr("fill", (d: any) => {
        if (d.id === currentNodeId) return "#3b82f6"; // Primary Blue
        if (d.status === 'completed') return "#10b981"; // Emerald
        return "#1e293b"; // Dark Slate
      })
      .attr("stroke", (d: any) => d.id === currentNodeId ? "#60a5fa" : "#94a3b8")
      .attr("stroke-width", (d: any) => d.id === currentNodeId ? 3 : 2)
      .on("click", (event, d) => onNodeClick(d.id));

    // Labels
    node.append("text")
      .text((d: any) => d.label)
      .attr("x", 0)
      .attr("y", 35)
      .attr("text-anchor", "middle")
      .attr("fill", "#f1f5f9")
      .attr("font-size", "12px")
      .attr("font-family", "Inter, sans-serif")
      .style("pointer-events", "none"); // Let clicks pass through to circle if needed

    // Simulation Tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [data, dimensions, currentNodeId, onNodeClick]);

  return (
    <div ref={containerRef} className="w-full h-full bg-slate-900/50 rounded-lg border border-slate-700 overflow-hidden relative">
      <div className="absolute top-4 left-4 z-10 bg-slate-800/80 backdrop-blur px-3 py-1 rounded text-xs text-slate-300 border border-slate-700">
        <span className="font-bold text-blue-400">Lyra</span> Knowledge Graph
      </div>
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="w-full h-full block" />
    </div>
  );
};

export default KnowledgeGraph;
