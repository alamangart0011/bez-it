export const DESIGN_TOKENS = {
  bg: '#f2f3f5',
  bg1: '#ffffff',
  bg2: '#f8f9fa',
  bg3: '#ebedf0',
  hov: 'rgba(0,0,0,.04)',
  act: 'rgba(88,101,242,.09)',
  brd: 'rgba(0,0,0,.09)',
  txt: '#060607',
  txt2: '#4e5058',
  txt3: '#80848e',
  acc: '#5865f2',
  acc2: '#4752c4',
  grn: '#1a8a4a',
  red: '#d73f3f',
  amb: '#b45309',
  pur: '#7c3aed',
  shd: '0 1px 4px rgba(0,0,0,.08)',
};

export const AVATAR_COLORS = [
  '#5865f2',
  '#d73f3f',
  '#1a8a4a',
  '#b45309',
  '#7c3aed',
  '#0891b2',
  '#c2410c',
  '#9c27b0',
];

export function avatarColor(seed = '') {
  const hash = String(seed)
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}
