import { pool } from '../db/pg.js';

export const voiceSessionsRepository = {
  async create(roomId, client = pool) {
    const res = await client.query(
      `insert into voice_sessions (room_id)
       values ($1)
       returning
         id,
         room_id as "roomId",
         started_at as "startedAt",
         ended_at as "endedAt",
         status,
         recording_url as "recordingUrl",
         duration_sec as "durationSec",
         meta_json as "metaJson"`,
      [roomId]
    );
    return res.rows[0] || null;
  },

  async findById(id, client = pool) {
    const res = await client.query(
      `select
         vs.id,
         vs.room_id as "roomId",
         r.name as "roomName",
         vs.started_at as "startedAt",
         vs.ended_at as "endedAt",
         vs.status,
         vs.recording_url as "recordingUrl",
         vs.duration_sec as "durationSec",
         vs.meta_json as "metaJson"
       from voice_sessions vs
       join rooms r on r.id = vs.room_id
       where vs.id = $1
       limit 1`,
      [id]
    );
    return res.rows[0] || null;
  },

  async listByRoom(roomId, limit = 20, client = pool) {
    const res = await client.query(
      `select
         id,
         room_id as "roomId",
         started_at as "startedAt",
         ended_at as "endedAt",
         status,
         recording_url as "recordingUrl",
         duration_sec as "durationSec",
         meta_json as "metaJson"
       from voice_sessions
       where room_id = $1
       order by started_at desc
       limit $2`,
      [roomId, limit]
    );
    return res.rows;
  },

  async listActive(client = pool) {
    const res = await client.query(
      `select
         vs.id,
         vs.room_id as "roomId",
         r.name as "roomName",
         vs.started_at as "startedAt",
         vs.status,
         coalesce((
           select count(*)::int
           from voice_session_participants vsp
           where vsp.session_id = vs.id and vsp.left_at is null
         ), 0) as "participantCount"
       from voice_sessions vs
       join rooms r on r.id = vs.room_id
       where vs.status = 'active'
       order by vs.started_at desc`
    );
    return res.rows;
  },

  async endSession(id, client = pool) {
    const res = await client.query(
      `update voice_sessions
       set
         status = 'ended',
         ended_at = now(),
         duration_sec = extract(epoch from (now() - started_at))::int
       where id = $1 and status = 'active'
       returning
         id,
         room_id as "roomId",
         started_at as "startedAt",
         ended_at as "endedAt",
         status,
         duration_sec as "durationSec"`,
      [id]
    );
    return res.rows[0] || null;
  },

  async participants(sessionId, client = pool) {
    const res = await client.query(
      `select
         vsp.id,
         vsp.session_id as "sessionId",
         vsp.user_id as "userId",
         u.display_name as "displayName",
         u.role,
         vsp.joined_at as "joinedAt",
         vsp.left_at as "leftAt",
         vsp.role,
         vsp.speaker_label as "speakerLabel"
       from voice_session_participants vsp
       join users u on u.id = vsp.user_id
       where vsp.session_id = $1
       order by vsp.joined_at asc`,
      [sessionId]
    );
    return res.rows;
  },

  async latestTranscript(sessionId, quality = 'final', client = pool) {
    const res = await client.query(
      `select
         id,
         session_id as "sessionId",
         version,
         quality,
         content_text as "contentText",
         content_json as "contentJson",
         language,
         created_at as "createdAt"
       from voice_transcripts
       where session_id = $1 and quality = $2
       order by version desc
       limit 1`,
      [sessionId, quality]
    );
    return res.rows[0] || null;
  },

  async upsertTranscript(sessionId, quality, contentText, contentJson, version = 1, client = pool) {
    const res = await client.query(
      `insert into voice_transcripts (session_id, version, quality, content_text, content_json)
       values ($1, $2, $3, $4, $5)
       on conflict (session_id, version)
       do update set
         quality = excluded.quality,
         content_text = excluded.content_text,
         content_json = excluded.content_json
       returning
         id,
         session_id as "sessionId",
         version,
         quality,
         content_text as "contentText",
         content_json as "contentJson",
         language,
         created_at as "createdAt"`,
      [sessionId, version, quality, contentText || null, contentJson || null]
    );
    return res.rows[0] || null;
  }
};
