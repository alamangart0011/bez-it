import { useMemo, useState } from 'react';

export function PhoneDevicesModal({ C, Modal, Btn, Inp, devices = [], onClose, onSendBind, onConfirmBind, onDeleteDevice, onToast }) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [deviceName, setDeviceName] = useState('Мой телефон');
  const [stage, setStage] = useState('phone');
  const [loading, setLoading] = useState(false);

  const normalizedDevices = useMemo(() => Array.isArray(devices) ? devices : [], [devices]);

  function formatPhone(value) {
    const digits = String(value || '').replace(/\D/g, '').slice(0, 11);
    if (!digits) return '';
    const n = digits.startsWith('8') ? `7${digits.slice(1)}` : digits;
    let out = '+7';
    if (n.length > 1) out += ` (${n.slice(1, 4)}`;
    if (n.length > 4) out += `) ${n.slice(4, 7)}`;
    if (n.length > 7) out += `-${n.slice(7, 9)}`;
    if (n.length > 9) out += `-${n.slice(9, 11)}`;
    return out;
  }

  async function requestBind() {
    setLoading(true);
    try {
      await onSendBind?.({ phone, deviceName });
      setStage('code');
      onToast?.('Код отправлен');
    } catch (error) {
      onToast?.(error?.message || 'Ошибка отправки кода', 'error');
    }
    setLoading(false);
  }

  async function confirmBind() {
    setLoading(true);
    try {
      await onConfirmBind?.({ phone, code, deviceName });
      setStage('done');
      onToast?.('Телефон подтверждён', 'success');
    } catch (error) {
      onToast?.(error?.message || 'Ошибка подтверждения', 'error');
    }
    setLoading(false);
  }

  return (
    <Modal title="Телефоны и доверенные устройства" onClose={onClose} width={760}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.txt3, textTransform: 'uppercase' }}>Привязка телефона</div>
          <Inp value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} placeholder="+7 (___) ___-__-__" />
          <Inp value={deviceName} onChange={(e) => setDeviceName(e.target.value)} placeholder="Название устройства" />
          {stage !== 'phone' && <Inp value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Код из SMS" />}
          <div style={{ display: 'flex', gap: 8 }}>
            {stage === 'phone' && <Btn variant="primary" onClick={requestBind} disabled={loading || phone.replace(/\D/g, '').length < 11}>Получить код</Btn>}
            {stage === 'code' && <Btn variant="primary" onClick={confirmBind} disabled={loading || code.length < 4}>Подтвердить</Btn>}
            {stage === 'done' && <Btn variant="ghost" onClick={() => { setStage('phone'); setCode(''); }}>Привязать ещё</Btn>}
          </div>
          <div style={{ fontSize: 12, color: C.txt3, lineHeight: 1.6 }}>Этот слой готов под active phone auth routes. После wiring backend здесь появится полный цикл привязки и входа по телефону.</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.txt3, textTransform: 'uppercase' }}>Привязанные телефоны</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
            {normalizedDevices.length === 0 && <div style={{ fontSize: 12, color: C.txt3 }}>Пока нет привязанных телефонов</div>}
            {normalizedDevices.map((item) => (
              <div key={item.id || item.phone} style={{ border: `1px solid ${C.brd}`, borderRadius: 10, padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 18 }}>📱</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.txt }}>{item.phone || '—'} {item.isPrimary && <span style={{ color: C.acc }}>· основной</span>}</div>
                  <div style={{ fontSize: 11, color: C.txt3 }}>{item.deviceName || 'Телефон'} · подтверждён: {item.verifiedAt ? new Date(item.verifiedAt).toLocaleString('ru') : '—'}</div>
                </div>
                <Btn variant="ghost" small onClick={() => onDeleteDevice?.(item.id)}>Удалить</Btn>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
