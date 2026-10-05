// Pixel-grid logo mark, echoing TissueLab's tiled motif.
export function PixelLogo({ size = 28 }: { size?: number }) {
  const cells = [
    [1, 0, 1],
    [0, 1, 1],
    [1, 1, 0],
  ];
  const gap = size * 0.12;
  const cell = (size - gap * 2) / 3;
  const colors = ["#6366f1", "#8b5cf6", "#a855f7"];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      {cells.flatMap((row, r) =>
        row.map((on, c) =>
          on ? (
            <rect
              key={`${r}-${c}`}
              x={c * (cell + gap)}
              y={r * (cell + gap)}
              width={cell}
              height={cell}
              rx={cell * 0.28}
              fill={colors[(r + c) % colors.length]}
            />
          ) : null
        )
      )}
    </svg>
  );
}
