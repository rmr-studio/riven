import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { AnimatePresence, motion } from 'motion/react';
import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { edgeConfigurations } from '../../config/edge-configurations';
import { nodeConfigurations } from '../../config/node-configurations';
import { Bounds, NodeModel, TabId } from '../../types';
import { computeBounds } from '../../utils/node-helpers';
import { Edge } from './edge';
import { PrimaryNode, SecondaryNode } from './node';

interface Props {
  tab: TabId;
}

export const DataModelGraph: FC<Props> = ({ tab }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const breakpoint = useBreakpoint();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setContainerWidth(el.getBoundingClientRect().width);
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const isMobile = useIsMobile('md');
  const resolvedNodes = useMemo(() => {
    const raw = nodeConfigurations[tab];
    if (!isMobile) return raw;
    return raw
      .filter((n) => n.mobile != null)
      .map((n) => ({
        ...n,
        position: n.mobile!.position,
        dimensions: n.mobile!.dimensions,
      }));
  }, [tab, isMobile]);

  const currentEdges = useMemo(() => {
    const ids = new Set(resolvedNodes.map((n) => n.id));
    return edgeConfigurations[tab].filter((e) => ids.has(e.source) && ids.has(e.target));
  }, [tab, resolvedNodes]);

  const delays = useMemo(() => {
    const d = new Map<string, number>();
    let ei = 0,
      fi = 0;
    for (const n of resolvedNodes) {
      if (n.type === 'secondary') {
        d.set(n.id, 0.3 + fi * 0.05);
        fi++;
      } else {
        d.set(n.id, ei * 0.1);
        ei++;
      }
    }
    return d;
  }, [resolvedNodes]);

  const bounds: Bounds = useMemo(() => computeBounds(resolvedNodes), [resolvedNodes]);

  const nodeMap = useMemo(() => {
    const m = new Map<string, NodeModel>();
    resolvedNodes.forEach((n) => m.set(n.id, n));
    return m;
  }, [resolvedNodes]);

  const getScale = () => {
    if (breakpoint === 'sm') return 0.6;
    // if (breakpoint === 'md') return 0.9;
    return containerWidth > 0 ? (containerWidth / bounds.width) * 0.7 : 1;
  };

  const scale = getScale();
  const scaledH = bounds.height * scale;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="relative overflow-hidden shadow"
    >
      {/* Graph */}
      <div
        ref={containerRef}
        className="relative"
        style={{
          height: containerWidth > 0 ? scaledH : 450,
          backgroundImage:
            'radial-gradient(color-mix(in srgb, var(--color-primary) 15%, transparent) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      >
        {containerWidth > 0 && (
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative top-0 left-0"
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                width: bounds.width,
                height: bounds.height,
                position: 'relative',
                left: (containerWidth - bounds.width * scale) / 2,
              }}
            >
              {/* Edges */}
              <svg
                className="pointer-events-none absolute inset-0"
                width={bounds.width}
                height={bounds.height}
              >
                <defs>
                  <linearGradient
                    id="edgeGradient"
                    x1="0"
                    y1="0"
                    x2={bounds.width}
                    y2="0"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="50%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#f43f5e" />
                  </linearGradient>
                </defs>
                {currentEdges.map((edge) => {
                  const source = nodeMap.get(edge.source);
                  const target = nodeMap.get(edge.target);
                  if (!source || !target) return null;

                  return (
                    <Edge
                      key={edge.id}
                      edge={edge}
                      source={source}
                      target={target}
                      bounds={bounds}
                    />
                  );
                })}
              </svg>

              {/* Nodes */}
              {resolvedNodes.map((node) => (
                <div
                  key={node.id}
                  className="absolute"
                  style={{
                    left: node.position.x - bounds.ox,
                    top: node.position.y - bounds.oy,
                  }}
                >
                  {node.type === 'primary' && (
                    <PrimaryNode node={node} delay={delays.get(node.id)} />
                  )}
                  {node.type === 'secondary' && (
                    <SecondaryNode node={node} delay={delays.get(node.id)} />
                  )}
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
};
