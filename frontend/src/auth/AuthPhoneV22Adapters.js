export function extendPhoneAuthApi(baseReq, baseApi = {}) {
  return {
    ...baseApi,
    sendPhoneOtp: ({ phone, purpose = 'login' }) => baseReq('POST', '/api/auth/phone/send-otp', { phone, purpose }),
    verifyPhoneOtp: ({ phone, code }) => baseReq('POST', '/api/auth/phone/verify-otp', { phone, code }),
    bindPhone: ({ phone, deviceName = null }) => baseReq('POST', '/api/auth/phone/bind', { phone, deviceName }),
    confirmBindPhone: ({ phone, code, deviceName = null }) => baseReq('POST', '/api/auth/phone/bind/confirm', { phone, code, deviceName }),
    phoneDevices: () => baseReq('GET', '/api/auth/phone/devices'),
    deletePhoneDevice: (deviceId) => baseReq('DELETE', `/api/auth/phone/devices/${deviceId}`)
  };
}

export function normalizePhoneDevice(item = {}) {
  return {
    id: item.id || item.phone || '',
    phone: item.phone || '',
    isPrimary: Boolean(item.isPrimary || item.is_primary),
    deviceName: item.deviceName || item.device_name || 'Телефон',
    verifiedAt: item.verifiedAt || item.verified_at || null,
    createdAt: item.createdAt || item.created_at || null
  };
}

export function normalizePhoneOtpResponse(data = {}) {
  return {
    ok: Boolean(data.ok),
    provider: data.provider || data.delivery || 'unknown',
    phone: data.phone || '',
    debugCode: data.debugCode || data.debug || null,
    message: data.message || null
  };
}
