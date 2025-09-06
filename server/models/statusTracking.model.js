const pool = require('../config/database');

class StatusTrackingModel {
  static async createProjectStatusChange({ projectId, oldStatus, newStatus, changedBy, reason = null, metadata = null }) {
    const query = `
      INSERT INTO project_status_history (project_id, old_status, new_status, changed_by, reason, metadata)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, project_id, old_status, new_status, changed_by, reason, metadata, created_at
    `;
    
    const result = await pool.query(query, [
      projectId, oldStatus, newStatus, changedBy, reason, JSON.stringify(metadata)
    ]);
    
    return result.rows[0];
  }

  static async createTaskStatusChange({ taskId, oldStatus, newStatus, changedBy, reason = null, timeSpent = null, metadata = null }) {
    const query = `
      INSERT INTO task_status_history (task_id, old_status, new_status, changed_by, reason, time_spent_minutes, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, task_id, old_status, new_status, changed_by, reason, time_spent_minutes, metadata, created_at
    `;
    
    const result = await pool.query(query, [
      taskId, oldStatus, newStatus, changedBy, reason, timeSpent, JSON.stringify(metadata)
    ]);
    
    return result.rows[0];
  }

  static async getProjectStatusHistory(projectId, options = {}) {
    const { limit = 50, offset = 0 } = options;
    
    const query = `
      SELECT psh.*, u.name as changed_by_name, u.email as changed_by_email
      FROM project_status_history psh
      LEFT JOIN users u ON psh.changed_by = u.id
      WHERE psh.project_id = $1
      ORDER BY psh.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await pool.query(query, [projectId, limit, offset]);
    return result.rows.map(row => ({
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : null
    }));
  }

  static async getTaskStatusHistory(taskId, options = {}) {
    const { limit = 50, offset = 0 } = options;
    
    const query = `
      SELECT tsh.*, u.name as changed_by_name, u.email as changed_by_email
      FROM task_status_history tsh
      LEFT JOIN users u ON tsh.changed_by = u.id
      WHERE tsh.task_id = $1
      ORDER BY tsh.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await pool.query(query, [taskId, limit, offset]);
    return result.rows.map(row => ({
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : null
    }));
  }

  static async getUserStatusChanges(userId, options = {}) {
    const { entityType = 'both', limit = 100, offset = 0, dateFrom, dateTo } = options;
    
    let queries = [];
    let params = [userId];
    let paramCount = 1;
    
    if (entityType === 'project' || entityType === 'both') {
      let projectQuery = `
        SELECT 'project' as entity_type, psh.project_id as entity_id, p.name as entity_name,
               psh.old_status, psh.new_status, psh.reason, psh.created_at
        FROM project_status_history psh
        LEFT JOIN projects p ON psh.project_id = p.id
        WHERE psh.changed_by = $1
      `;
      
      if (dateFrom) {
        projectQuery += ` AND psh.created_at >= $${++paramCount}`;
        params.push(dateFrom);
      }
      
      if (dateTo) {
        projectQuery += ` AND psh.created_at <= $${++paramCount}`;
        params.push(dateTo);
      }
      
      queries.push(projectQuery);
    }
    
    if (entityType === 'task' || entityType === 'both') {
      let taskQuery = `
        SELECT 'task' as entity_type, tsh.task_id as entity_id, t.title as entity_name,
               tsh.old_status, tsh.new_status, tsh.reason, tsh.created_at
        FROM task_status_history tsh
        LEFT JOIN tasks t ON tsh.task_id = t.id
        WHERE tsh.changed_by = $1
      `;
      
      if (dateFrom) {
        taskQuery += ` AND tsh.created_at >= $${dateFrom ? paramCount : ++paramCount}`;
        if (!dateFrom) params.push(dateFrom);
      }
      
      if (dateTo) {
        taskQuery += ` AND tsh.created_at <= $${dateTo ? paramCount : ++paramCount}`;
        if (!dateTo) params.push(dateTo);
      }
      
      queries.push(taskQuery);
    }
    
    const unionQuery = `
      (${queries.join(') UNION ALL (')})
      ORDER BY created_at DESC
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;
    
    params.push(limit, offset);
    
    const result = await pool.query(unionQuery, params);
    return result.rows;
  }

  static async getStatusChangeStats(options = {}) {
    const { projectId, taskId, userId, dateFrom, dateTo } = options;
    
    let query = `
      SELECT 
        entity_type,
        old_status,
        new_status,
        COUNT(*) as change_count,
        AVG(CASE WHEN entity_type = 'task' THEN time_spent_minutes END) as avg_time_spent
      FROM (
        SELECT 'project' as entity_type, old_status, new_status, NULL as time_spent_minutes, created_at, changed_by, project_id as entity_id
        FROM project_status_history
        UNION ALL
        SELECT 'task' as entity_type, old_status, new_status, time_spent_minutes, created_at, changed_by, task_id as entity_id
        FROM task_status_history
      ) combined
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (projectId) {
      query += ` AND (entity_type = 'project' AND entity_id = $${++paramCount} OR 
                      entity_type = 'task' AND entity_id IN (SELECT id FROM tasks WHERE project_id = $${paramCount}))`;
      params.push(projectId);
    }
    
    if (taskId) {
      query += ` AND entity_type = 'task' AND entity_id = $${++paramCount}`;
      params.push(taskId);
    }
    
    if (userId) {
      query += ` AND changed_by = $${++paramCount}`;
      params.push(userId);
    }
    
    if (dateFrom) {
      query += ` AND created_at >= $${++paramCount}`;
      params.push(dateFrom);
    }
    
    if (dateTo) {
      query += ` AND created_at <= $${++paramCount}`;
      params.push(dateTo);
    }
    
    query += `
      GROUP BY entity_type, old_status, new_status
      ORDER BY entity_type, change_count DESC
    `;
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async getTimeSpentOnTasks(options = {}) {
    const { userId, projectId, taskId, dateFrom, dateTo } = options;
    
    let query = `
      SELECT 
        tsh.task_id,
        t.title as task_title,
        p.name as project_name,
        u.name as user_name,
        SUM(tsh.time_spent_minutes) as total_time_spent,
        COUNT(*) as status_changes
      FROM task_status_history tsh
      LEFT JOIN tasks t ON tsh.task_id = t.id
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON tsh.changed_by = u.id
      WHERE tsh.time_spent_minutes IS NOT NULL
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (userId) {
      query += ` AND tsh.changed_by = $${++paramCount}`;
      params.push(userId);
    }
    
    if (projectId) {
      query += ` AND t.project_id = $${++paramCount}`;
      params.push(projectId);
    }
    
    if (taskId) {
      query += ` AND tsh.task_id = $${++paramCount}`;
      params.push(taskId);
    }
    
    if (dateFrom) {
      query += ` AND tsh.created_at >= $${++paramCount}`;
      params.push(dateFrom);
    }
    
    if (dateTo) {
      query += ` AND tsh.created_at <= $${++paramCount}`;
      params.push(dateTo);
    }
    
    query += `
      GROUP BY tsh.task_id, t.title, p.name, u.name
      ORDER BY total_time_spent DESC
    `;
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async getProjectProgressOverTime(projectId, options = {}) {
    const { intervalDays = 7 } = options;
    
    const query = `
      WITH date_series AS (
        SELECT generate_series(
          (SELECT MIN(created_at)::date FROM project_status_history WHERE project_id = $1),
          CURRENT_DATE,
          interval '${intervalDays} days'
        ) as date_point
      ),
      status_changes AS (
        SELECT 
          DATE_TRUNC('week', created_at) as week_start,
          new_status,
          COUNT(*) as changes
        FROM project_status_history
        WHERE project_id = $1
        GROUP BY DATE_TRUNC('week', created_at), new_status
      )
      SELECT 
        ds.date_point,
        COALESCE(sc.new_status, 'no_change') as status,
        COALESCE(sc.changes, 0) as change_count
      FROM date_series ds
      LEFT JOIN status_changes sc ON DATE_TRUNC('week', ds.date_point) = sc.week_start
      ORDER BY ds.date_point
    `;
    
    const result = await pool.query(query, [projectId]);
    return result.rows;
  }

  static async getCurrentStatusDuration(entityType, entityId) {
    const table = entityType === 'project' ? 'project_status_history' : 'task_status_history';
    const idColumn = entityType === 'project' ? 'project_id' : 'task_id';
    
    const query = `
      SELECT 
        new_status as current_status,
        created_at as status_since,
        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - created_at))/3600 as hours_in_status
      FROM ${table}
      WHERE ${idColumn} = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    const result = await pool.query(query, [entityId]);
    return result.rows[0];
  }
}

module.exports = StatusTrackingModel;
