import { pool } from '../db/pg.js';

const defaultSettings = {
  theme: 'dark',
  notificationsEnabled: true,
  soundEnabled: true,
  desktopNotifications: true,
  compactMode: false,
  enterToSend: true,
  pushToTalk: false,
  voiceInputDevice: null,
  voiceOutputDevice: null,
  fontScale: 'normal',
  highContrast: false,
  reduceMotion: false
};

export const settingsRepository = {
  async getByUserId(userId, client = pool) {
    const res = await client.query(
      `select
         user_id as "userId",
         theme,
         notifications_enabled as "notificationsEnabled",
         sound_enabled as "soundEnabled",
         desktop_notifications as "desktopNotifications",
         compact_mode as "compactMode",
         enter_to_send as "enterToSend",
         push_to_talk as "pushToTalk",
         voice_input_device as "voiceInputDevice",
         voice_output_device as "voiceOutputDevice",
         font_scale as "fontScale",
         high_contrast as "highContrast",
         reduce_motion as "reduceMotion",
         updated_at as "updatedAt"
       from user_settings
       where user_id = $1
       limit 1`,
      [userId]
    );
    return res.rows[0] || { userId, ...defaultSettings, updatedAt: null };
  },

  async upsert(userId, payload, client = pool) {
    const next = { ...defaultSettings, ...payload };
    await client.query(
      `insert into user_settings (
         user_id, theme, notifications_enabled, sound_enabled, desktop_notifications,
         compact_mode, enter_to_send, push_to_talk, voice_input_device, voice_output_device,
         font_scale, high_contrast, reduce_motion
       )
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       on conflict (user_id) do update set
         theme = excluded.theme,
         notifications_enabled = excluded.notifications_enabled,
         sound_enabled = excluded.sound_enabled,
         desktop_notifications = excluded.desktop_notifications,
         compact_mode = excluded.compact_mode,
         enter_to_send = excluded.enter_to_send,
         push_to_talk = excluded.push_to_talk,
         voice_input_device = excluded.voice_input_device,
         voice_output_device = excluded.voice_output_device,
         font_scale = excluded.font_scale,
         high_contrast = excluded.high_contrast,
         reduce_motion = excluded.reduce_motion,
         updated_at = now()`,
      [
        userId,
        next.theme,
        next.notificationsEnabled,
        next.soundEnabled,
        next.desktopNotifications,
        next.compactMode,
        next.enterToSend,
        next.pushToTalk,
        next.voiceInputDevice,
        next.voiceOutputDevice,
        next.fontScale,
        next.highContrast,
        next.reduceMotion
      ]
    );
    return this.getByUserId(userId, client);
  }
};
