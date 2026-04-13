export const BRANDING_DEFAULTS = {
  appName: 'Сигнум',
  organizationName: 'Корпоративный контур связи',
  organizationInn: '',
  licensePlan: 'Корпоративный пакет',
  supportLabel: 'Поддержка',
  supportEmail: 'support@signalum.local',
  releaseLabel: '17.17.0',
  footerMark: 'Единый корпоративный контур связи',
};

export function normalizeBranding(input = {}) {
  return {
    appName: input.appName || BRANDING_DEFAULTS.appName,
    organizationName: input.organizationName || BRANDING_DEFAULTS.organizationName,
    organizationInn: input.organizationInn || BRANDING_DEFAULTS.organizationInn,
    licensePlan: input.licensePlan || BRANDING_DEFAULTS.licensePlan,
    supportLabel: input.supportLabel || BRANDING_DEFAULTS.supportLabel,
    supportEmail: input.supportEmail || BRANDING_DEFAULTS.supportEmail,
    releaseLabel: input.releaseLabel || BRANDING_DEFAULTS.releaseLabel,
    footerMark: input.footerMark || BRANDING_DEFAULTS.footerMark,
  };
}
