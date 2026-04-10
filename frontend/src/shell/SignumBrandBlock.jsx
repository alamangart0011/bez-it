import { BrandLockup } from '../brand/BrandMark.jsx';

export function SignumBrandBlock({ compact = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
      <BrandLockup compact={compact} />
    </div>
  );
}
