import crypto from 'crypto';
import { pool } from '../db/pg.js';

export const incidentsRepository = {
  async create({ roomId, actorUserId = null, targetUserId = null, incidentType, severity = 'warning', note = null, meta = null }, client = pool) {
    const id = crypto.randomUUID();
    const res = await client.query(
      `insert into room_incidents (
         id, room_id, actor_user_id, target_user_id, incident_type, severity, status, note, meta_json
       ) values ($1, $2, $3, $4, $5, $6, 'open', $7, $8)
       returning id, room_id as "roomId", actor_user_id as "actorUserId", target_user_id as "targetUserId",
                 incident_type as "incidentType", severity, status, note, meta_json as meta,
                 created_at as "createdAt", acknowledged_at as "acknowledgedAt", acknowledged_by_user_id as "acknowledgedByUserId"`,
      [id, roomId, actorUserId, targetUserId, incidentType, severity, note, meta ? JSON.stringify(meta) : null]
    );
    return res.rows[0] || null;
  },

  async list(limit = 80, client = pool) {
    const res = await client.query(
      `select ri.id, ri.room_id as "roomId", r.name as "roomName", r.kind as "roomKind",
              ri.actor_user_id as "actorUserId", actor_ref.display_name as "actorDisplayName",
              ri.target_user_id as "targetUserId", target_ref.display_name as "targetDisplayName",
              ri.incident_type as "incidentType", ri.severity, ri.status, ri.note,
              ri.meta_json as meta, ri.created_at as "createdAt",
              ri.acknowledged_at as "acknowledgedAt", ri.acknowledged_by_user_id as "acknowledgedByUserId",
              ack_ref.display_name as "acknowledgedByDisplayName"
       from room_incidents ri
       join rooms r on r.id = ri.room_id
       left join users actor_ref on actor_ref.id = ri.actor_user_id
       left join users target_ref on target_ref.id = ri.target_user_id
       left join users ack_ref on ack_ref.id = ri.acknowledged_by_user_id
       order by case ri.status when 'open' then 1 else 2 end,
                case ri.severity when 'critical' then 1 when 'warning' then 2 else 3 end,
                ri.created_at desc
       limit $1`,
      [limit]
    );
    return res.rows;
  },


  async resolve(incidentId, actorUserId, client = pool) {
    const res = await client.query(
      `update room_incidents
       set status = 'resolved', acknowledged_at = now(), acknowledged_by_user_id = $2
       where id = $1
       returning id, room_id as "roomId", actor_user_id as "actorUserId", target_user_id as "targetUserId",
                 incident_type as "incidentType", severity, status, note, meta_json as meta,
                 created_at as "createdAt", acknowledged_at as "acknowledgedAt", acknowledged_by_user_id as "acknowledgedByUserId"`,
      [incidentId, actorUserId]
    );
    return res.rows[0] || null;
  },

  async acknowledge(incidentId, actorUserId, client = pool) {
    const res = await client.query(
      `update room_incidents
       set status = 'acknowledged', acknowledged_at = now(), acknowledged_by_user_id = $2
       where id = $1
       returning id, room_id as "roomId", actor_user_id as "actorUserId", target_user_id as "targetUserId",
                 incident_type as "incidentType", severity, status, note, meta_json as meta,
                 created_at as "createdAt", acknowledged_at as "acknowledgedAt", acknowledged_by_user_id as "acknowledgedByUserId"`,
      [incidentId, actorUserId]
    );
    return res.rows[0] || null;
  },

  async getLaunchMonitor(client = pool) {
    const [summaryRes, incidentsRes, hotRoomsRes] = await Promise.all([
      client.query(
        `select
           count(*) filter (where status = 'open')::int as "openTotal",
           count(*) filter (where status = 'open' and severity = 'critical')::int as "criticalOpen",
           max(created_at) as "lastIncidentAt"
         from room_incidents`
      ),
      client.query(
        `select ri.id, ri.room_id as "roomId", r.name as "roomName", r.kind as "roomKind",
                ri.actor_user_id as "actorUserId", actor_ref.display_name as "actorDisplayName",
                ri.target_user_id as "targetUserId", target_ref.display_name as "targetDisplayName",
                ri.incident_type as "incidentType", ri.severity, ri.status, ri.note,
                ri.created_at as "createdAt"
         from room_incidents ri
         join rooms r on r.id = ri.room_id
         left join users actor_ref on actor_ref.id = ri.actor_user_id
         left join users target_ref on target_ref.id = ri.target_user_id
         where ri.status = 'open'
         order by case ri.severity when 'critical' then 1 when 'warning' then 2 else 3 end,
                  ri.created_at desc
         limit 10`
      ),
      client.query(
        `select r.id, r.name, r.kind,
                count(distinct case when ri.status = 'open' then ri.id end)::int as "openIncidentsCount",
                count(distinct case when ri.status = 'open' and ri.severity = 'critical' then ri.id end)::int as "criticalIncidentsCount",
                count(distinct case when rjr.status = 'pending' then rjr.id end)::int as "pendingJoinRequestsCount",
                count(distinct case when vp.is_connected = true then vp.user_id end)::int as "connectedVoiceCount"
         from rooms r
         left join room_incidents ri on ri.room_id = r.id
         left join room_join_requests rjr on rjr.room_id = r.id
         left join voice_participants vp on vp.room_id = r.id
         where r.is_archived = false and r.kind in ('voice','meeting')
         group by r.id
         having count(distinct case when ri.status = 'open' then ri.id end) > 0
             or count(distinct case when rjr.status = 'pending' then rjr.id end) > 0
             or count(distinct case when vp.is_connected = true then vp.user_id end) > 0
         order by "criticalIncidentsCount" desc,
                  "openIncidentsCount" desc,
                  "pendingJoinRequestsCount" desc,
                  "connectedVoiceCount" desc,
                  r.name asc
         limit 8`
      )
    ]);

    return {
      summary: summaryRes.rows[0] || { openTotal: 0, criticalOpen: 0, lastIncidentAt: null },
      recentIncidents: incidentsRes.rows,
      hotRooms: hotRoomsRes.rows
    };
  }
};
