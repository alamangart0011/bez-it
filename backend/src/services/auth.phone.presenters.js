export function presentPhoneOtpRequest(result = {}) {
  return {
    ok: Boolean(result.ok),
    provider: result.provider || 'dev',
    phone: result.phone || '',
    purpose: result.purpose || 'login',
    debugCode: result.debugCode || result.codePreview || null,
    message: result.message || 'OTP подготовлен'
  };
}

export function presentPhoneOtpVerify(result = {}) {
  return {
    ok: Boolean(result.ok),
    accessToken: result.accessToken || null,
    refreshToken: result.refreshToken || null,
    sessionId: result.sessionId || null,
    user: result.user || null,
    phone: result.phone || '',
    deviceFingerprint: result.deviceFingerprint || null
  };
}

export function presentPhoneDevice(item = {}) {
  return {
    id: item.id || item.phone || '',
    phone: item.phone || '',
    isPrimary: Boolean(item.isPrimary),
    deviceName: item.deviceName || 'Телефон',
    verifiedAt: item.verifiedAt || null,
    createdAt: item.createdAt || null
  };
}

export function presentPhoneDevicesList(result = {}) {
  return {
    devices: Array.isArray(result.devices) ? result.devices.map(presentPhoneDevice) : []
  };
}
