import { pool } from '../db/pg.js';

function mapLead(row) {
  if (!row) return null;
  return {
    id: row.id,
    createdAt: row.created_at,
    source: row.source,
    channel: row.channel,
    segment: row.segment,
    serviceKey: row.service_key,
    routeTarget: row.route_target,
    companyName: row.company_name,
    contactName: row.contact_name,
    phone: row.phone,
    email: row.email,
    city: row.city,
    headCount: row.head_count,
    budget: row.budget,
    deadline: row.deadline,
    comment: row.comment,
    quizAnswers: row.quiz_answers || {},
    utm: row.utm || {},
    userAgent: row.user_agent,
    ipAddr: row.ip_addr,
    status: row.status,
    assignedTo: row.assigned_to,
    notes: row.notes
  };
}

export const bezItLeadsRepository = {
  async createLead(input) {
    const res = await pool.query(
      `insert into bez_it_leads (
         source, channel, segment, service_key, route_target,
         company_name, contact_name, phone, email, city,
         head_count, budget, deadline, comment, quiz_answers,
         utm, user_agent, ip_addr
       ) values (
         coalesce($1,'bez-it.ru'), coalesce($2,'form'), $3, $4, coalesce($5,'both'),
         $6, $7, $8, $9, $10,
         $11, $12, $13, $14, coalesce($15,'{}'::jsonb),
         coalesce($16,'{}'::jsonb), $17, $18
       )
       returning *`,
      [
        input.source || null,
        input.channel || null,
        input.segment || null,
        input.serviceKey || null,
        input.routeTarget || null,
        input.companyName || null,
        input.contactName || null,
        input.phone || null,
        input.email || null,
        input.city || null,
        input.headCount || null,
        input.budget || null,
        input.deadline || null,
        input.comment || null,
        input.quizAnswers ? JSON.stringify(input.quizAnswers) : null,
        input.utm ? JSON.stringify(input.utm) : null,
        input.userAgent || null,
        input.ipAddr || null
      ]
    );
    return mapLead(res.rows[0]);
  },

  async listLeads({ limit = 100, offset = 0, status = null, search = null } = {}) {
    const params = [];
    const where = [];
    if (status) { params.push(status); where.push(`status = $${params.length}`); }
    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      where.push(`(lower(coalesce(company_name,'')) like $${params.length}
                   or lower(coalesce(contact_name,'')) like $${params.length}
                   or lower(coalesce(phone,'')) like $${params.length}
                   or lower(coalesce(email,'')) like $${params.length})`);
    }
    params.push(limit);
    params.push(offset);
    const res = await pool.query(
      `select * from bez_it_leads
       ${where.length ? 'where ' + where.join(' and ') : ''}
       order by created_at desc
       limit $${params.length - 1} offset $${params.length}`,
      params
    );
    return res.rows.map(mapLead);
  },

  async countLeads({ status = null } = {}) {
    const params = [];
    const where = [];
    if (status) { params.push(status); where.push(`status = $${params.length}`); }
    const res = await pool.query(
      `select count(*)::int as total,
              count(*) filter (where status='new')::int as new_cnt,
              count(*) filter (where status='won')::int as won_cnt
       from bez_it_leads
       ${where.length ? 'where ' + where.join(' and ') : ''}`,
      params
    );
    return res.rows[0] || { total: 0, new_cnt: 0, won_cnt: 0 };
  },

  async getLead(id) {
    const res = await pool.query('select * from bez_it_leads where id = $1', [id]);
    return mapLead(res.rows[0]);
  },

  async updateLeadStatus(id, { status = null, notes = null, assignedTo = null }) {
    const res = await pool.query(
      `update bez_it_leads set
         status = coalesce($2, status),
         notes = coalesce($3, notes),
         assigned_to = coalesce($4, assigned_to)
       where id = $1 returning *`,
      [id, status, notes, assignedTo]
    );
    return mapLead(res.rows[0]);
  },

  async logRoute({ leadId, target, channel, status, attempt = 0, lastError = null, payload = null, deliveredAt = null }) {
    await pool.query(
      `insert into bez_it_lead_routes (lead_id, target, channel, status, attempt, last_error, payload, delivered_at)
       values ($1,$2,$3,$4,$5,$6,coalesce($7,'{}'::jsonb),$8)`,
      [leadId, target, channel, status, attempt, lastError, payload ? JSON.stringify(payload) : null, deliveredAt]
    );
  },

  async getRoutesForLead(leadId) {
    const res = await pool.query(
      'select * from bez_it_lead_routes where lead_id = $1 order by created_at asc',
      [leadId]
    );
    return res.rows;
  },

  async logEvent({ eventType, page = null, sessionId = null, payload = null, userAgent = null, ipAddr = null }) {
    await pool.query(
      `insert into bez_it_landing_stats (event_type, page, session_id, payload, user_agent, ip_addr)
       values ($1,$2,$3,coalesce($4,'{}'::jsonb),$5,$6)`,
      [eventType, page, sessionId, payload ? JSON.stringify(payload) : null, userAgent, ipAddr]
    );
  },

  async findTokenByHash(hash) {
    const res = await pool.query(
      `select * from bez_it_cabinet_tokens
       where token_hash = $1 and revoked_at is null
         and (expires_at is null or expires_at > now())
       limit 1`,
      [hash]
    );
    return res.rows[0] || null;
  },

  async touchToken(id) {
    await pool.query('update bez_it_cabinet_tokens set last_used_at = now() where id = $1', [id]);
  },

  async ensureSeedToken(hash, label) {
    await pool.query(
      `insert into bez_it_cabinet_tokens (token_hash, label)
       values ($1,$2) on conflict (token_hash) do nothing`,
      [hash, label]
    );
  }
};
