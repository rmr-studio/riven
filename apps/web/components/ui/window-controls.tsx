export function WindowControls({ size = 7 }: { size?: number }) {
  const shadow =
    size <= 5
      ? 'shadow-[inset_0_0.5px_0.5px_rgba(0,0,0,0.25)]'
      : 'shadow-[inset_0_1px_1px_rgba(0,0,0,0.25)]';
  const gap = size <= 5 ? 'gap-[4px]' : 'gap-[6px]';

  return (
    <div className={`flex items-center ${gap}`}>
      <div
        className={`rounded-full bg-[#F72F2F] ${shadow}`}
        style={{ width: size, height: size }}
      />
      <div
        className={`rounded-full bg-[#FFE72F] ${shadow}`}
        style={{ width: size, height: size }}
      />
      <div
        className={`rounded-full bg-[#56F659] ${shadow}`}
        style={{ width: size, height: size }}
      />
    </div>
  );
}
