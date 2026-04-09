import { pool } from '../db/pg.js';

export const aiJobsRepository = {
  async create({ type, sourceType, sourceId, templateId, configJson, createdBy, priority }, client = pool) {
    const res = await client.query(
      `insert into ai_jobs (type, source_type, source_id, template_id, config_json, created_by, priority)
       values ($1, $2, $3, $4, $5, $6, $7)
       returning
         id,
         type,
         source_type as "sourceType",
         source_id as "sourceId",
         status,
         priority,
         template_id as "templateId",
         config_json as "configJson",
         error_text as "errorText",
         attempts,
         max_attempts as "maxAttempts",
         created_at as "createdAt",
         started_at as "startedAt",
         completed_at as "completedAt",
         created_by as "createdBy"`,
      [type, sourceType, sourceId, templateId || null, configJson || {}, createdBy || null, priority || 5]
    );
    return res.rows[0] || null;
  },

  async findById(id, client = pool) {
    const res = await client.query(
      `select
         id,
         type,
         source_type as "sourceType",
         source_id as "sourceId",
         status,
         priority,
         template_id as "templateId",
         config_json as "configJson",
         error_text as "errorText",
         attempts,
         max_attempts as "maxAttempts",
         created_at as "createdAt",
         started_at as "startedAt",
         completed_at as "completedAt",
         created_by as "createdBy"
       from ai_jobs
       where id = $1
       limit 1`,
      [id]
    );
    return res.rows[0] || null;
  },

  async list({ sourceType, sourceId, status, limit = 50 }, client = pool) {
    const params = [];
    const where = ['1=1'];
    if (sourceType) {
      params.push(sourceType);
      where.push(`source_type = $${params.length}`);
    }
    if (sourceId) {
      params.push(sourceId);
      where.push(`source_id = $${params.length}`);
    }
    if (status) {
      params.push(status);
      where.push(`status = $${params.length}`);
    }
    params.push(limit);
    const sql = `select
      id,
      type,
      source_type as "sourceType",
      source_id as "sourceId",
      status,
      priority,
      template_id as "templateId",
      config_json as "configJson",
      error_text as "errorText",
      attempts,
      max_attempts as "maxAttempts",
      created_at as "createdAt",
      started_at as "startedAt",
      completed_at as "completedAt",
      created_by as "createdBy"
    from ai_jobs
    where ${where.join(' and ')}
    order by created_at desc
    limit $${params.length}`;
    const res = await client.query(sql, params);
    return res.rows;
  },

  async cancel(id, client = pool) {
    const res = await client.query(
      `update ai_jobs
       set status = 'cancelled'
       where id = $1 and status in ('pending', 'running')
       returning
         id,
         type,
         source_type as "sourceType",
         source_id as "sourceId",
         status,
         priority,
         created_at as "createdAt",
         completed_at as "completedAt"`,
      [id]
    );
    return res.rows[0] || null;
  },

  async outputs({ sourceType, sourceId, outputType }, client = pool) {
    const params = [];
    const where = ['1=1'];
    if (sourceType) {
      params.push(sourceType);
      where.push(`aj.source_type = $${params.length}`);
    }
    if (sourceId) {
      params.push(sourceId);
      where.push(`aj.source_id = $${params.length}`);
    }
    if (outputType) {
      params.push(outputType);
      where.push(`ao.output_type = $${params.length}`);
    }
    const res = await client.query(
      `select
         ao.id,
         ao.job_id as "jobId",
         ao.output_type as "outputType",
         ao.content_text as "contentText",
         ao.content_json as "contentJson",
         ao.review_status as "reviewStatus",
         ao.reviewed_by as "reviewedBy",
         ao.reviewed_at as "reviewedAt",
         ao.model_id as "modelId",
         ao.tokens_input as "tokensInput",
         ao.tokens_output as "tokensOutput",
         ao.created_at as "createdAt"
       from ai_outputs ao
       join ai_jobs aj on aj.id = ao.job_id
       where ${where.join(' and ')}
       order by ao.created_at desc`,
      params
    );
    return res.rows;
  },

  async outputById(id, client = pool) {
    const res = await client.query(
      `select
         id,
         job_id as "jobId",
         output_type as "outputType",
         content_text as "contentText",
         content_json as "contentJson",
         review_status as "reviewStatus",
         reviewed_by as "reviewedBy",
         reviewed_at as "reviewedAt",
         model_id as "modelId",
         tokens_input as "tokensInput",
         tokens_output as "tokensOutput",
         created_at as "createdAt"
       from ai_outputs
       where id = $1
       limit 1`,
      [id]
    );
    return res.rows[0] || null;
  },

  async addFeedback({ outputId, userId, rating, commentText }, client = pool) {
    const res = await client.query(
      `insert into ai_feedback (output_id, user_id, rating, comment_text)
       values ($1, $2, $3, $4)
       returning
         id,
         output_id as "outputId",
         user_id as "userId",
         rating,
         comment_text as "commentText",
         created_at as "createdAt"`,
      [outputId, userId, rating ?? null, commentText ?? null]
    );
    return res.rows[0] || null;
  }
};
