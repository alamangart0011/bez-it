import crypto from 'crypto';
import { pool } from '../db/pg.js';

export const uploadsRepository = {
  async createMetadata(client, { messageId, fileName, originalName, filePath, publicUrl, contentType, sizeBytes, fileKind }) {
    const id = crypto.randomUUID();
    const res = await client.query(
      `insert into attachments (id, message_id, file_name, original_name, file_path, public_url, content_type, size_bytes, file_kind)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       returning id, message_id as "messageId", file_name as "fileName", original_name as "originalName", public_url as "publicUrl",
                 size_bytes as "sizeBytes", content_type as "contentType", file_kind as "fileKind", created_at as "createdAt"`,
      [id, messageId, fileName, originalName, filePath, publicUrl, contentType, sizeBytes, fileKind]
    );
    return res.rows[0];
  },

  async listByMessageIds(messageIds) {
    if (!messageIds.length) return [];
    const res = await pool.query(
      `select id, message_id as "messageId", file_name as "fileName", original_name as "originalName",
              public_url as "publicUrl", size_bytes as "sizeBytes", content_type as "contentType", file_kind as "fileKind",
              created_at as "createdAt"
       from attachments where message_id = any($1::uuid[]) order by created_at asc`,
      [messageIds]
    );
    return res.rows;
  },

  async listByRoom(roomId) {
    const res = await pool.query(
      `select a.id, a.message_id as "messageId", a.file_name as "fileName", a.original_name as "originalName",
              a.public_url as "publicUrl", a.size_bytes as "sizeBytes", a.content_type as "contentType", a.file_kind as "fileKind",
              a.created_at as "createdAt", m.author_user_id as "authorId", u.display_name as "authorName"
       from attachments a
       join messages m on m.id = a.message_id
       join users u on u.id = m.author_user_id
       where m.room_id = $1
       order by a.created_at desc`,
      [roomId]
    );
    return res.rows;
  }
};
