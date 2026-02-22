import { NodeModel } from "../types";

export function edgePath(
  src: NodeModel,
  tgt: NodeModel,
  ox: number,
  oy: number,
) {
  const CORNER_RADIUS = 8;
  const sd = src.dimensions;
  const td = tgt.dimensions;
  const scx = src.position.x - ox + sd.width / 2;
  const scy = src.position.y - oy + sd.height / 2;
  const tcx = tgt.position.x - ox + td.width / 2;
  const tcy = tgt.position.y - oy + td.height / 2;
  const dx = tcx - scx;
  const dy = tcy - scy;

  if (Math.abs(dx) >= Math.abs(dy)) {
    // Horizontal dominant — smooth-step with midpoint vertical segment
    const sx = dx > 0 ? src.position.x - ox + sd.width : src.position.x - ox;
    const sy = scy;
    const tx = dx > 0 ? tgt.position.x - ox : tgt.position.x - ox + td.width;
    const ty = tcy;

    if (Math.abs(ty - sy) < 1) return `M ${sx} ${sy} L ${tx} ${ty}`;

    const mx = (sx + tx) / 2;
    const dxS = tx > sx ? 1 : -1;
    const dyS = ty > sy ? 1 : -1;
    const r = Math.min(
      CORNER_RADIUS,
      Math.abs(mx - sx),
      Math.abs(ty - sy) / 2,
      Math.abs(tx - mx),
    );

    return [
      `M ${sx} ${sy}`,
      `L ${mx - r * dxS} ${sy}`,
      `Q ${mx} ${sy}, ${mx} ${sy + r * dyS}`,
      `L ${mx} ${ty - r * dyS}`,
      `Q ${mx} ${ty}, ${mx + r * dxS} ${ty}`,
      `L ${tx} ${ty}`,
    ].join(" ");
  } else {
    // Vertical dominant — smooth-step with midpoint horizontal segment
    const sx = scx;
    const sy = dy > 0 ? src.position.y - oy + sd.height : src.position.y - oy;
    const tx = tcx;
    const ty = dy > 0 ? tgt.position.y - oy : tgt.position.y - oy + td.height;

    if (Math.abs(tx - sx) < 1) return `M ${sx} ${sy} L ${tx} ${ty}`;

    const my = (sy + ty) / 2;
    const dxS = tx > sx ? 1 : -1;
    const dyS = ty > sy ? 1 : -1;
    const r = Math.min(
      CORNER_RADIUS,
      Math.abs(my - sy),
      Math.abs(tx - sx) / 2,
      Math.abs(ty - my),
    );

    return [
      `M ${sx} ${sy}`,
      `L ${sx} ${my - r * dyS}`,
      `Q ${sx} ${my}, ${sx + r * dxS} ${my}`,
      `L ${tx - r * dxS} ${my}`,
      `Q ${tx} ${my}, ${tx} ${my + r * dyS}`,
      `L ${tx} ${ty}`,
    ].join(" ");
  }
}
