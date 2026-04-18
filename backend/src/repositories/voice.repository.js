import { pool } from '../db/pg.js';

const baseSelect = `select
  vp.room_id as "roomId",
  vp.user_id as "userId",
  coalesce(vp.voice_role, 'member') as "voiceRole",
  vp.is_connected as "isConnected",
  vp.is_muted as "isMuted",
  vp.is_deafened as "isDeafened",
  vp.hand_raised as "handRaised",
  vp.is_speaking as "isSpeaking",
  vp.screen_active as "screenActive",
  vp.voice_banned as "voiceBanned",
  vp.connected_at as "connectedAt",
  vp.updated_at as "updatedAt",
  u.display_name as "displayName",
  u.username,
  u.email,
  u.role,
  u.status,
  up.job_title as "jobTitle",
  up.phone,
  d.name as "departmentName"
from voice_participants vp
join users u on u.id = vp.user_id
left join user_profiles up on up.user_id = u.id
left join departments d on d.id = up.department_id`;

export const voiceRepository = {
  async listRoomState(roomId, client = pool) {
    const res = await client.query(
      `${baseSelect}
       where vp.room_id = $1
       order by
         case coalesce(vp.voice_role, 'member')
           when 'host' then 1
           when 'moderator' then 2
           else 3
         end,
         case u.role
           when 'super_admin' then 1
           when 'admin' then 2
           when 'leader' then 3
           when 'moderator' then 4
           when 'member' then 5
           when 'guest' then 6
           when 'external' then 7
           when 'blocked' then 8
           else 9
         end,
         u.display_name asc`,
      [roomId]
    );
    return res.rows;
  },

  async findParticipant(roomId, userId, client = pool) {
    const res = await client.query(`${baseSelect} where vp.room_id = $1 and vp.user_id = $2 limit 1`, [roomId, userId]);
    return res.rows[0] || null;
  },

  async upsertParticipant(roomId, userId, patch = {}, client = pool) {
    const voiceRole = patch.voiceRole || 'member';
    const isConnected = patch.isConnected ?? true;
    const isMuted = patch.isMuted ?? false;
    const isDeafened = patch.isDeafened ?? false;
    const handRaised = patch.handRaised ?? false;
    const isSpeaking = patch.isSpeaking ?? false;
    const screenActive = patch.screenActive ?? false;
    const voiceBanned = patch.voiceBanned ?? false;

    await client.query(
      `insert into voice_participants (
         room_id, user_id, voice_role, is_connected, is_muted, is_deafened, hand_raised, is_speaking, screen_active, voice_banned, connected_at, updated_at
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,case when $4 then now() else null end, now())
       on conflict (room_id, user_id)
       do update set
         voice_role = coalesce(excluded.voice_role, voice_participants.voice_role),
         is_connected = excluded.is_connected,
         is_muted = excluded.is_muted,
         is_deafened = excluded.is_deafened,
         hand_raised = excluded.hand_raised,
         is_speaking = excluded.is_speaking,
         screen_active = excluded.screen_active,
         voice_banned = excluded.voice_banned,
         connected_at = case when excluded.is_connected and voice_participants.connected_at is null then now() else voice_participants.connected_at end,
         updated_at = now()`,
      [roomId, userId, voiceRole, isConnected, isMuted, isDeafened, handRaised, isSpeaking, screenActive, voiceBanned]
    );

    return this.findParticipant(roomId, userId, client);
  },

  async patchParticipant(roomId, userId, patch, client = pool) {
    const keys = [];
    const values = [roomId, userId];
    const mapping = {
      voiceRole: 'voice_role',
      isConnected: 'is_connected',
      isMuted: 'is_muted',
      isDeafened: 'is_deafened',
      handRaised: 'hand_raised',
      isSpeaking: 'is_speaking',
      screenActive: 'screen_active',
      voiceBanned: 'voice_banned'
    };

    Object.entries(mapping).forEach(([input, column]) => {
      if (patch[input] === undefined) return;
      values.push(patch[input]);
      keys.push(`${column} = $${values.length}`);
    });

    if (!keys.length) return this.findParticipant(roomId, userId, client);
    keys.push('updated_at = now()');
    await client.query(
      `update voice_participants set ${keys.join(', ')} where room_id = $1 and user_id = $2`,
      values
    );
    return this.findParticipant(roomId, userId, client);
  },



  async bulkPatchRoom(roomId, patch = {}, client = pool) {
    const mapping = {
      isConnected: 'is_connected',
      isMuted: 'is_muted',
      isDeafened: 'is_deafened',
      handRaised: 'hand_raised',
      isSpeaking: 'is_speaking',
      screenActive: 'screen_active'
    };
    const updates = [];
    const values = [roomId];
    Object.entries(mapping).forEach(([key, column]) => {
      if (patch[key] === undefined) return;
      values.push(patch[key]);
      updates.push(`${column} = $${values.length}`);
    });
    if (!updates.length) return this.listRoomState(roomId, client);
    updates.push('updated_at = now()');
    await client.query(
      `update voice_participants
       set ${updates.join(', ')}
       where room_id = $1`,
      values
    );
    return this.listRoomState(roomId, client);
  },

  async moveParticipant(sourceRoomId, targetRoomId, userId, targetRole = 'member', client = pool) {
    await client.query(
      `update voice_participants
       set is_connected = false, is_speaking = false, screen_active = false, hand_raised = false, updated_at = now()
       where room_id = $1 and user_id = $2`,
      [sourceRoomId, userId]
    );
    return this.upsertParticipant(targetRoomId, userId, { voiceRole: targetRole, isConnected: true }, client);
  },

  async listAllConnected(client = pool) {
    const res = await client.query(
      `${baseSelect}
       join rooms r on r.id = vp.room_id
       where vp.is_connected = true and r.is_archived = false
       order by r.name asc, u.display_name asc`
    );
    return res.rows;
  },

  async findConnectedRoomFor(userId, client = pool) {
    const res = await client.query(
      `${baseSelect}
       where vp.user_id = $1 and vp.is_connected = true
       order by vp.updated_at desc
       limit 1`,
      [userId]
    );
    return res.rows[0] || null;
  },

  async listJoinRequests(roomId, client = pool) {
    const res = await client.query(
      `select rjr.id, rjr.room_id as "roomId", rjr.user_id as "userId", rjr.status, rjr.note,
              rjr.requested_at as "requestedAt", rjr.reviewed_at as "reviewedAt",
              rjr.reviewed_by_user_id as "reviewedByUserId",
              u.display_name as "displayName", u.role, u.status as "userStatus",
              up.job_title as "jobTitle", d.name as "departmentName",
              reviewer.display_name as "reviewedByDisplayName"
       from room_join_requests rjr
       join users u on u.id = rjr.user_id
       left join user_profiles up on up.user_id = u.id
       left join departments d on d.id = up.department_id
       left join users reviewer on reviewer.id = rjr.reviewed_by_user_id
       where rjr.room_id = $1
       order by case rjr.status when 'pending' then 1 when 'approved' then 2 when 'denied' then 3 else 4 end, rjr.requested_at desc`,
      [roomId]
    );
    return res.rows;
  },

  async findPendingJoinRequest(roomId, userId, client = pool) {
    const res = await client.query(
      `select id, room_id as "roomId", user_id as "userId", status, note,
              requested_at as "requestedAt", reviewed_at as "reviewedAt", reviewed_by_user_id as "reviewedByUserId"
       from room_join_requests
       where room_id = $1 and user_id = $2 and status = 'pending'
       order by requested_at desc
       limit 1`,
      [roomId, userId]
    );
    return res.rows[0] || null;
  },

  async findLatestJoinRequest(roomId, userId, client = pool) {
    const res = await client.query(
      `select id, room_id as "roomId", user_id as "userId", status, note,
              requested_at as "requestedAt", reviewed_at as "reviewedAt", reviewed_by_user_id as "reviewedByUserId"
       from room_join_requests
       where room_id = $1 and user_id = $2
       order by requested_at desc
       limit 1`,
      [roomId, userId]
    );
    return res.rows[0] || null;
  },

  async createJoinRequest(roomId, userId, note = '', client = pool) {
    const res = await client.query(
      `insert into room_join_requests (id, room_id, user_id, status, note)
       values (gen_random_uuid(), $1, $2, 'pending', $3)
       returning id, room_id as "roomId", user_id as "userId", status, note,
                 requested_at as "requestedAt", reviewed_at as "reviewedAt", reviewed_by_user_id as "reviewedByUserId"`,
      [roomId, userId, note]
    );
    return res.rows[0];
  },

  async reviewJoinRequest(requestId, status, reviewedByUserId, client = pool) {
    const res = await client.query(
      `update room_join_requests
       set status = $2, reviewed_by_user_id = $3, reviewed_at = now()
       where id = $1
       returning id, room_id as "roomId", user_id as "userId", status, note,
                 requested_at as "requestedAt", reviewed_at as "reviewedAt", reviewed_by_user_id as "reviewedByUserId"`,
      [requestId, status, reviewedByUserId]
    );
    return res.rows[0] || null;
  },

};
