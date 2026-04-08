import crypto from 'crypto';
import { pool } from '../db/pg.js';

export const profilesRepository = {
  async getUserProfile(userId) {
    const res = await pool.query(
      `select
         u.id,
         u.display_name as "displayName",
         u.username,
         u.email,
         u.role,
         u.status,
         u.is_active as "isActive",
         u.created_at as "createdAt",
         up.photo_url as "photoUrl",
         up.job_title as "jobTitle",
         up.phone,
         up.about,
         up.department_id as "departmentId",
         d.name as "departmentName",
         d.id as "departmentRefId"
       from users u
       left join user_profiles up on up.user_id = u.id
       left join departments d on d.id = up.department_id
       where u.id = $1
       limit 1`,
      [userId]
    );
    return res.rows[0] || null;
  },

  async upsertUserProfile({ userId, displayName, status, jobTitle, phone, departmentId = null, about = null, photoUrl = null }, client = pool) {
    if (displayName) {
      await client.query(
        'update users set display_name = $2, status = coalesce($3, status) where id = $1',
        [userId, displayName, status || null]
      );
    } else if (status) {
      await client.query('update users set status = $2 where id = $1', [userId, status]);
    }

    await client.query(
      `insert into user_profiles (user_id, job_title, phone, department_id, about, photo_url)
       values ($1, $2, $3, $4, $5, $6)
       on conflict (user_id) do update set
         job_title = excluded.job_title,
         phone = excluded.phone,
         department_id = excluded.department_id,
         about = excluded.about,
         photo_url = excluded.photo_url,
         updated_at = now()`,
      [userId, jobTitle || null, phone || null, departmentId || null, about || null, photoUrl || null]
    );

    return this.getUserProfile(userId);
  },

  async setDepartmentForUser(userId, departmentId = null, client = pool) {
    await client.query(
      `insert into user_profiles (user_id, department_id)
       values ($1, $2)
       on conflict (user_id) do update set department_id = excluded.department_id, updated_at = now()`,
      [userId, departmentId]
    );
  },

  async listDepartments() {
    const res = await pool.query(
      `select d.id, d.name, d.code, d.created_at as "createdAt",
              d.leader_user_id as "leaderUserId",
              u.display_name as "leaderName",
              count(distinct up.user_id)::int as "membersCount"
       from departments d
       left join users u on u.id = d.leader_user_id
       left join user_profiles up on up.department_id = d.id
       group by d.id, u.display_name
       order by d.name asc`
    );
    return res.rows;
  },

  async createDepartment({ id = crypto.randomUUID(), name, code = null, leaderUserId = null }, client = pool) {
    const res = await client.query(
      `insert into departments (id, name, code, leader_user_id)
       values ($1, $2, $3, $4)
       returning id, name, code, created_at as "createdAt", leader_user_id as "leaderUserId"`,
      [id, name, code, leaderUserId]
    );
    return res.rows[0] || null;
  },

  async updateDepartmentLeader(departmentId, leaderUserId = null, client = pool) {
    const res = await client.query(
      `update departments set leader_user_id = $2 where id = $1
       returning id, name, code, created_at as "createdAt", leader_user_id as "leaderUserId"`,
      [departmentId, leaderUserId]
    );
    return res.rows[0] || null;
  },

  async listUsersForAdmin() {
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
         d.id as "departmentId",
         u.created_at as "createdAt"
       from users u
       left join user_profiles up on up.user_id = u.id
       left join departments d on d.id = up.department_id
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
         u.display_name asc`
    );
    return res.rows;
  }
};
