export function BrandGlyph({ size = 56, radius = 16 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: 'linear-gradient(135deg, #3BE38F 0%, #19C37D 58%, #119C67 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 16px 36px rgba(17, 156, 103, 0.32)',
      }}
    >
      <svg viewBox="0 0 64 64" width={size * 0.72} height={size * 0.72} fill="none">
        <path d="M14 28.5C14 19.39 21.39 12 30.5 12H33.5C42.61 12 50 19.39 50 28.5C50 37.61 42.61 45 33.5 45H31L22 53V43.94C17.16 41.49 14 35.43 14 28.5Z" fill="white" />
        <circle cx="28.5" cy="29" r="3.7" fill="#18B978" />
        <circle cx="36.5" cy="29" r="3.7" fill="#18B978" />
        <path d="M27.5 36C29.6 37.9 32.4 37.9 34.5 36" stroke="#18B978" strokeWidth="3.2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function BrandLockup({ compact = false, title = 'Сигнум', subtitle = 'корпоративная связь и комнаты' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 10 : 12, minWidth: 0 }}>
      <BrandGlyph size={compact ? 42 : 56} radius={compact ? 14 : 16} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: compact ? 18 : 22, lineHeight: 1, fontWeight: 800, color: compact ? '#F6FFFA' : '#0E1512' }}>{title}</div>
        {!compact && <div style={{ fontSize: 12, color: '#6B7E75', marginTop: 5 }}>{subtitle}</div>}
      </div>
    </div>
  );
}
