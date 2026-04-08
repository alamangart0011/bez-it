import crypto from "crypto";
import { pool } from "../db/pg.js";

function roomFields(prefix = 'r') {
  return `${prefix}.id, ${prefix}.name, ${prefix}.kind, ${prefix}.is_private as "isPrivate", ${prefix}.is_archived as "isArchived", ${prefix}.entry_mode as "entryMode", ${prefix}.created_at as "createdAt"`;
}

export const roomsRepository = {
  async getAllForUser(userId) {
    const res = await pool.query(
      `select ${roomFields('r')},
              count(distinct rm.user_id)::int as "membersCount",
              count(distinct case when vp.is_connected = true then vp.user_id end)::int as "connectedVoiceCount",
              count(distinct case when rjr.status = 'pending' then rjr.id end)::int as "pendingJoinRequestsCount",
              m.status as "meetingStatus"
       from rooms r
       left join room_members rm on rm.room_id = r.id
       left join voice_participants vp on vp.room_id = r.id
       left join room_join_requests rjr on rjr.room_id = r.id
       left join meetings m on m.room_id = r.id
       where r.is_archived = false and (r.is_private = false or exists (
         select 1 from room_members rm_access where rm_access.room_id = r.id and rm_access.user_id = $1
       ))
       group by r.id, m.status
       order by r.created_at asc`,
      [userId]
    );
    return res.rows;
  },

  async listForAdmin() {
    const res = await pool.query(
      `select ${roomFields('r')},
              count(distinct rm.user_id)::int as "membersCount",
              count(distinct case when vp.is_connected = true then vp.user_id end)::int as "connectedVoiceCount",
              count(distinct case when rjr.status = 'pending' then rjr.id end)::int as "pendingJoinRequestsCount",
              m.status as "meetingStatus",
              m.host_user_id as "meetingHostUserId",
              host.display_name as "meetingHostName"
       from rooms r
       left join room_members rm on rm.room_id = r.id
       left join voice_participants vp on vp.room_id = r.id
       left join room_join_requests rjr on rjr.room_id = r.id
       left join meetings m on m.room_id = r.id
       left join users host on host.id = m.host_user_id
       group by r.id, m.status, m.host_user_id, host.display_name
       order by r.is_archived asc, r.kind asc, r.name asc`
    );
    return res.rows;
  },

  async findById(roomId) {
    const res = await pool.query(
      `select ${roomFields('rooms')}
       from rooms where id = $1 limit 1`,
      [roomId]
    );
    return res.rows[0] || null;
  },

  async create({ id = crypto.randomUUID(), name, kind, isPrivate = false }, client = pool) {
    const res = await client.query(
      `insert into rooms (id, name, kind, is_private)
       values ($1, $2, $3, $4)
       returning ${roomFields('rooms')}`,
      [id, name, kind, isPrivate]
    );
    return res.rows[0];
  },

  async setArchived(roomId, isArchived = true, client = pool) {
    const res = await client.query(
      `update rooms set is_archived = $2 where id = $1 returning ${roomFields('rooms')}`,
      [roomId, isArchived]
    );
    return res.rows[0] || null;
  },


  async setEntryMode(roomId, entryMode = 'open', client = pool) {
    const res = await client.query(
      `update rooms set entry_mode = $2 where id = $1 returning ${roomFields('rooms')}`,
      [roomId, entryMode]
    );
    return res.rows[0] || null;
  },

  async addMembers(roomId, userIds = [], client = pool) {
    const unique = [...new Set((userIds || []).filter(Boolean))];
    if (!unique.length) return;
    for (const userId of unique) {
      await client.query(
        `insert into room_members (room_id, user_id)
         values ($1, $2)
         on conflict do nothing`,
        [roomId, userId]
      );
    }
  },

  async userHasAccess(roomId, userId) {
    const res = await pool.query(
      `select 1
       from rooms r
       left join room_members rm on rm.room_id = r.id and rm.user_id = $2
       where r.id = $1 and r.is_archived = false and (r.is_private = false or rm.user_id is not null)
       limit 1`,
      [roomId, userId]
    );
    return Boolean(res.rows[0]);
  },

  async getRoomStats(roomId) {
    const res = await pool.query(
      `select
         count(distinct rm.user_id)::int as "membersCount",
         count(distinct case when vp.is_connected = true then vp.user_id end)::int as "connectedVoiceCount",
         count(distinct case when vp.hand_raised = true then vp.user_id end)::int as "raisedHandsCount",
         count(distinct case when rjr.status = 'pending' then rjr.id end)::int as "pendingJoinRequestsCount"
       from rooms r
       left join room_members rm on rm.room_id = r.id
       left join voice_participants vp on vp.room_id = r.id
       left join room_join_requests rjr on rjr.room_id = r.id
       where r.id = $1
       group by r.id`,
      [roomId]
    );
    return res.rows[0] || { membersCount: 0, connectedVoiceCount: 0, raisedHandsCount: 0, pendingJoinRequestsCount: 0 };
  },

  async getMembers(roomId) {
    const res = await pool.query(
      `select
         u.id,
         u.display_name as "displayName",
         u.username,
         u.email,
         u.role,
         u.status,
         u.is_active as "isActive",
         up.job_title as "jobTitle",
         up.phone,
         d.name as "departmentName",
         rm.joined_at as "joinedAt"
       from room_members rm
       join users u on u.id = rm.user_id
       left join user_profiles up on up.user_id = u.id
       left join departments d on d.id = up.department_id
       where rm.room_id = $1
       order by
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

  async listForUser(userId) {
    const res = await pool.query(
      `select ${roomFields('r')}
       from rooms r
       join room_members rm on rm.room_id = r.id
       where rm.user_id = $1 and r.is_archived = false
       order by r.created_at asc`,
      [userId]
    );
    return res.rows;
  },

  async addUserToDefaultRooms(userId, client = pool) {
    await client.query(
      `insert into room_members (room_id, user_id)
       select id, $1 from rooms where is_private = false and is_archived = false
       on conflict do nothing`,
      [userId]
    );
  },


  async getOperatorWallboard() {
    const [summaryRes, roomsRes] = await Promise.all([
      pool.query(
        `select
           count(*) filter (where r.is_archived = false and r.kind in ('voice','meeting'))::int as "trackedRooms",
           count(*) filter (where r.is_archived = false and r.kind in ('voice','meeting') and r.entry_mode = 'closed')::int as "closedRooms",
           count(*) filter (where r.is_archived = false and r.kind in ('voice','meeting') and r.entry_mode = 'knock')::int as "knockRooms",
           count(distinct case when rjr.status = 'pending' then rjr.id end)::int as "pendingJoinRequests",
           count(distinct case when ri.status = 'open' then ri.id end)::int as "openIncidents"
         from rooms r
         left join room_join_requests rjr on rjr.room_id = r.id
         left join room_incidents ri on ri.room_id = r.id
         where r.kind in ('voice','meeting')`
      ),
      pool.query(
        `select ${roomFields('r')},
                count(distinct case when vp.is_connected = true then vp.user_id end)::int as "connectedVoiceCount",
                count(distinct case when vp.hand_raised = true then vp.user_id end)::int as "raisedHandsCount",
                count(distinct case when rjr.status = 'pending' then rjr.id end)::int as "pendingJoinRequestsCount",
                count(distinct case when ri.status = 'open' then ri.id end)::int as "openIncidentsCount",
                count(distinct case when ri.status = 'open' and ri.severity = 'critical' then ri.id end)::int as "criticalIncidentsCount",
                m.status as "meetingStatus",
                host.display_name as "meetingHostName"
         from rooms r
         left join voice_participants vp on vp.room_id = r.id
         left join room_join_requests rjr on rjr.room_id = r.id
         left join room_incidents ri on ri.room_id = r.id
         left join meetings m on m.room_id = r.id
         left join users host on host.id = m.host_user_id
         where r.is_archived = false and r.kind in ('voice','meeting')
         group by r.id, m.status, host.display_name
         order by "criticalIncidentsCount" desc,
                  "openIncidentsCount" desc,
                  "pendingJoinRequestsCount" desc,
                  "connectedVoiceCount" desc,
                  r.name asc
         limit 12`
      )
    ]);
    return {
      summary: summaryRes.rows[0] || { trackedRooms: 0, closedRooms: 0, knockRooms: 0, pendingJoinRequests: 0, openIncidents: 0 },
      rooms: roomsRes.rows
    };
  },

  async getOverview() {
    const res = await pool.query(
      `select
         count(*) filter (where is_archived = false)::int as "totalRooms",
         count(*) filter (where is_archived = false and kind in ('group', 'channel', 'dm'))::int as "chatRooms",
         count(*) filter (where is_archived = false and kind = 'voice')::int as "voiceRooms",
         count(*) filter (where is_archived = false and kind = 'meeting')::int as "meetingRooms",
         count(*) filter (where is_archived = true)::int as "archivedRooms"
       from rooms`
    );
    return res.rows[0] || { totalRooms: 0, chatRooms: 0, voiceRooms: 0, meetingRooms: 0, archivedRooms: 0 };
  }
};
