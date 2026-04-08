import { pool } from '../db/pg.js';

const BRANDING_KEY = 'branding';
const DEFAULT_BRANDING = {
  appName: 'Контур Связи',
  organizationName: 'IT Group Company',
  organizationInn: '',
  licensePlan: 'Корпоративный пакет · 100 пользователей',
  supportLabel: 'Техническая поддержка',
  supportEmail: 'support@kontur.local',
  releaseLabel: 'V17',
  footerMark: 'Единый корпоративный контур связи, собраний и администрирования'
};

const ANNOUNCEMENT_KEY = 'announcement';
const DEFAULT_ANNOUNCEMENT = {
  isActive: false,
  level: 'info',
  title: '',
  message: '',
  activeUntil: null,
  scope: 'all'
};

export const systemRepository = {
  async getBranding() {
    const res = await pool.query(
      `select value_json as value, updated_at as "updatedAt"
       from system_settings
       where key = $1
       limit 1`,
      [BRANDING_KEY]
    );
    if (!res.rows[0]) return { ...DEFAULT_BRANDING };
    return { ...DEFAULT_BRANDING, ...(res.rows[0].value || {}), updatedAt: res.rows[0].updatedAt };
  },



  async getAnnouncement() {
    const res = await pool.query(
      `select value_json as value, updated_at as "updatedAt"
       from system_settings
       where key = $1
       limit 1`,
      [ANNOUNCEMENT_KEY]
    );
    if (!res.rows[0]) return { ...DEFAULT_ANNOUNCEMENT };
    const value = { ...DEFAULT_ANNOUNCEMENT, ...(res.rows[0].value || {}) };
    const activeUntilTs = value.activeUntil ? new Date(value.activeUntil).getTime() : null;
    const isExpired = activeUntilTs && activeUntilTs < Date.now();
    return { ...value, isActive: Boolean(value.isActive) && !isExpired, updatedAt: res.rows[0].updatedAt };
  },

  async upsertAnnouncement(payload, client = pool) {
    const current = await this.getAnnouncement();
    const merged = { ...current, ...payload, isActive: Boolean(payload.isActive) };
    await client.query(
      `insert into system_settings (key, value_json)
       values ($1, $2::jsonb)
       on conflict (key) do update set value_json = excluded.value_json, updated_at = now()`,
      [ANNOUNCEMENT_KEY, JSON.stringify(merged)]
    );
    return this.getAnnouncement();
  },

  async clearAnnouncement(client = pool) {
    await client.query(
      `insert into system_settings (key, value_json)
       values ($1, $2::jsonb)
       on conflict (key) do update set value_json = excluded.value_json, updated_at = now()`,
      [ANNOUNCEMENT_KEY, JSON.stringify(DEFAULT_ANNOUNCEMENT)]
    );
    return this.getAnnouncement();
  },

  async getRuntimeConfig() {
    const [branding, announcement] = await Promise.all([this.getBranding(), this.getAnnouncement()]);
    return { ...branding, announcement };
  },

  async upsertBranding(payload, client = pool) {
    const current = await this.getBranding();
    const merged = { ...current, ...payload };
    await client.query(
      `insert into system_settings (key, value_json)
       values ($1, $2::jsonb)
       on conflict (key) do update set value_json = excluded.value_json, updated_at = now()`,
      [BRANDING_KEY, JSON.stringify(merged)]
    );
    return this.getBranding();
  }
};
