export function SignumPresenceDot({ size = 10, color = '#19C37D', border = '#101816' }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        border: `2px solid ${border}`,
        boxShadow: '0 0 0 3px rgba(25,195,125,0.18)',
        flexShrink: 0,
      }}
    />
  );
}
