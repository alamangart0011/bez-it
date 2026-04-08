import crypto from 'crypto';
import { pool } from '../db/pg.js';

function messageFields() {
  return `
    m.id,
    m.room_id as "roomId",
    m.author_user_id as "authorId",
    u.display_name as "authorName",
    m.body as text,
    m.reply_to_message_id as "replyToMessageId",
    m.is_edited as "isEdited",
    m.is_deleted as "isDeleted",
    m.is_pinned as "isPinned",
    m.edited_at as "editedAt",
    m.deleted_at as "deletedAt",
    m.created_at as "createdAt"
  `;
}

export const messagesRepository = {
  async listByRoom(roomId) {
    const res = await pool.query(
      `select ${messageFields()}
       from messages m
       join users u on u.id = m.author_user_id
       where m.room_id = $1
       order by m.created_at asc`,
      [roomId]
    );
    return res.rows;
  },

  async listPinnedByRoom(roomId) {
    const res = await pool.query(
      `select ${messageFields()}
       from messages m
       join users u on u.id = m.author_user_id
       where m.room_id = $1 and m.is_pinned = true and m.is_deleted = false
       order by m.created_at desc`,
      [roomId]
    );
    return res.rows;
  },

  async searchInRoom(roomId, query) {
    const needle = `%${String(query || '').trim()}%`;
    const res = await pool.query(
      `select ${messageFields()}
       from messages m
       join users u on u.id = m.author_user_id
       where m.room_id = $1 and m.body ilike $2
       order by m.created_at desc
       limit 100`,
      [roomId, needle]
    );
    return res.rows;
  },

  async findById(messageId) {
    const res = await pool.query(
      `select ${messageFields()} from messages m join users u on u.id = m.author_user_id where m.id = $1 limit 1`,
      [messageId]
    );
    return res.rows[0] || null;
  },

  async create({ roomId, authorId, text, replyToMessageId = null }, client = pool) {
    const id = crypto.randomUUID();
    const res = await client.query(
      `insert into messages (id, room_id, author_user_id, body, reply_to_message_id)
       values ($1, $2, $3, $4, $5)
       returning id, room_id as "roomId", author_user_id as "authorId", body as text,
                 reply_to_message_id as "replyToMessageId", is_edited as "isEdited", is_deleted as "isDeleted",
                 is_pinned as "isPinned", edited_at as "editedAt", deleted_at as "deletedAt", created_at as "createdAt"`,
      [id, roomId, authorId, text, replyToMessageId]
    );
    return res.rows[0];
  },

  async updateText({ messageId, authorId, text }) {
    const res = await pool.query(
      `update messages
       set body = $3, is_edited = true, edited_at = now()
       where id = $1 and author_user_id = $2 and is_deleted = false
       returning id`,
      [messageId, authorId, text]
    );
    return Boolean(res.rows[0]);
  },

  async markDeleted({ messageId, authorId, allowModerator }) {
    const res = await pool.query(
      `update messages
       set body = '[удалено]', is_deleted = true, deleted_at = now(), is_pinned = false
       where id = $1 and (author_user_id = $2 or $3 = true) and is_deleted = false
       returning id`,
      [messageId, authorId, allowModerator]
    );
    return Boolean(res.rows[0]);
  },

  async setPinned({ messageId, value }) {
    const res = await pool.query(
      `update messages set is_pinned = $2 where id = $1 returning id`,
      [messageId, value]
    );
    return Boolean(res.rows[0]);
  }
};
