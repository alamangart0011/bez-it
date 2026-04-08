import crypto from 'crypto';
import { pool } from '../db/pg.js';

export const meetingsRepository = {
  async ensureRoom(roomId, hostUserId = null, client = pool) {
    await client.query(
      `insert into meetings (room_id, host_user_id)
       values ($1, $2)
       on conflict (room_id) do nothing`,
      [roomId, hostUserId]
    );
    return this.findByRoomId(roomId, client);
  },

  async findByRoomId(roomId, client = pool) {
    const res = await client.query(
      `select m.room_id as "roomId", m.status, m.title, m.agenda, m.summary,
              m.host_user_id as "hostUserId", u.display_name as "hostName",
              m.started_at as "startedAt", m.ended_at as "endedAt", m.updated_at as "updatedAt"
       from meetings m
       left join users u on u.id = m.host_user_id
       where m.room_id = $1 limit 1`,
      [roomId]
    );
    return res.rows[0] || null;
  },

  async update(roomId, patch, client = pool) {
    const fields = [];
    const values = [roomId];
    const mapping = {
      status: 'status',
      title: 'title',
      agenda: 'agenda',
      summary: 'summary',
      hostUserId: 'host_user_id',
      startedAt: 'started_at',
      endedAt: 'ended_at'
    };
    Object.entries(mapping).forEach(([input, column]) => {
      if (patch[input] === undefined) return;
      values.push(patch[input]);
      fields.push(`${column} = $${values.length}`);
    });
    if (!fields.length) return this.findByRoomId(roomId, client);
    fields.push('updated_at = now()');
    await client.query(`update meetings set ${fields.join(', ')} where room_id = $1`, values);
    return this.findByRoomId(roomId, client);
  },

  async listEvents(roomId, limit = 100, client = pool) {
    const res = await client.query(
      `select e.id, e.room_id as "roomId", e.actor_user_id as "actorUserId", u.display_name as "actorName",
              e.event_type as "eventType", e.body, e.created_at as "createdAt"
       from meeting_events e
       left join users u on u.id = e.actor_user_id
       where e.room_id = $1
       order by e.created_at desc
       limit $2`,
      [roomId, limit]
    );
    return res.rows;
  },



  async listPresenceLog(roomId, limit = 150, client = pool) {
    const res = await client.query(
      `select mpl.id, mpl.room_id as "roomId", mpl.user_id as "userId", mpl.actor_user_id as "actorUserId",
              mpl.event_type as "eventType", mpl.note, mpl.created_at as "createdAt",
              user_ref.display_name as "userDisplayName", actor_ref.display_name as "actorDisplayName"
       from meeting_presence_logs mpl
       left join users user_ref on user_ref.id = mpl.user_id
       left join users actor_ref on actor_ref.id = mpl.actor_user_id
       where mpl.room_id = $1
       order by mpl.created_at desc
       limit $2`,
      [roomId, limit]
    );
    return res.rows;
  },

  async createPresenceLog(roomId, userId, actorUserId, eventType, note = null, client = pool) {
    const id = crypto.randomUUID();
    const res = await client.query(
      `insert into meeting_presence_logs (id, room_id, user_id, actor_user_id, event_type, note)
       values ($1, $2, $3, $4, $5, $6)
       returning id, room_id as "roomId", user_id as "userId", actor_user_id as "actorUserId",
                 event_type as "eventType", note, created_at as "createdAt"`,
      [id, roomId, userId, actorUserId, eventType, note]
    );
    return res.rows[0];
  },

  async getLaunchBoard(client = pool) {
    const [voiceRoomsRes, queueRes, meetingsRes] = await Promise.all([
      client.query(
        `select r.id, r.name, r.kind,
                count(distinct case when vp.is_connected = true then vp.user_id end)::int as "connectedVoiceCount",
                count(distinct case when vp.hand_raised = true then vp.user_id end)::int as "raisedHandsCount"
         from rooms r
         left join voice_participants vp on vp.room_id = r.id
         where r.is_archived = false and r.kind in ('voice','meeting')
         group by r.id
         order by "connectedVoiceCount" desc, "raisedHandsCount" desc, r.name asc
         limit 8`
      ),
      client.query(
        `select r.id, r.name, r.kind, count(rjr.id)::int as "pendingJoinRequestsCount"
         from rooms r
         join room_join_requests rjr on rjr.room_id = r.id and rjr.status = 'pending'
         where r.is_archived = false
         group by r.id
         order by "pendingJoinRequestsCount" desc, r.name asc
         limit 8`
      ),
      client.query(
        `select r.id, r.name, coalesce(m.status, 'planned') as "status",
                coalesce(u.display_name, 'Не назначен') as "hostName",
                count(distinct case when vp.is_connected = true then vp.user_id end)::int as "presentCount"
         from rooms r
         left join meetings m on m.room_id = r.id
         left join users u on u.id = m.host_user_id
         left join voice_participants vp on vp.room_id = r.id
         where r.is_archived = false and r.kind = 'meeting'
         group by r.id, m.status, u.display_name
         order by case coalesce(m.status, 'planned') when 'active' then 1 when 'planned' then 2 else 3 end,
                  "presentCount" desc, r.name asc
         limit 8`
      )
    ]);

    return {
      activeVoiceRooms: voiceRoomsRes.rows,
      pendingQueues: queueRes.rows,
      meetings: meetingsRes.rows
    };
  },
  async createEvent(roomId, actorUserId, eventType, body, client = pool) {
    const id = crypto.randomUUID();
    const res = await client.query(
      `insert into meeting_events (id, room_id, actor_user_id, event_type, body)
       values ($1, $2, $3, $4, $5)
       returning id, room_id as "roomId", actor_user_id as "actorUserId", event_type as "eventType", body, created_at as "createdAt"`,
      [id, roomId, actorUserId, eventType, body]
    );
    return res.rows[0];
  }
};
