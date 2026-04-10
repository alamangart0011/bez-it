export const BRANDING_DEFAULTS = {
  appName: 'Контур Связи',
  organizationName: 'IT Group Company',
  organizationInn: '',
  licensePlan: 'Корпоративный пакет · 100 пользователей',
  supportLabel: 'Техническая поддержка',
  supportEmail: 'support@kontur.local',
  releaseLabel: 'V17',
  footerMark: 'Единый корпоративный контур связи, собраний и администрирования',
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
