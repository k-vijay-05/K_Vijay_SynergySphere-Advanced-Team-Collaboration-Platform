const pool = require('../config/database');

class LogsModel {
  // System Logs
  static async createSystemLog({ level, message, source, userId = null, metadata = null, stackTrace = null }) {
    const query = `
      INSERT INTO system_logs (level, message, source, user_id, metadata, stack_trace)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, level, message, source, user_id, metadata, stack_trace, created_at
    `;
    
    const result = await pool.query(query, [
      level, message, source, userId, JSON.stringify(metadata), stackTrace
    ]);
    
    return result.rows[0];
  }

  // Activity Logs
  static async createActivityLog({ userId, action, entityType, entityId, description, ipAddress = null, userAgent = null, metadata = null }) {
    const query = `
      INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description, ip_address, user_agent, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, user_id, action, entity_type, entity_id, description, ip_address, user_agent, metadata, created_at
    `;
    
    const result = await pool.query(query, [
      userId, action, entityType, entityId, description, ipAddress, userAgent, JSON.stringify(metadata)
    ]);
    
    return result.rows[0];
  }

  // Audit Logs
  static async createAuditLog({ userId, tableName, recordId, operation, oldValues = null, newValues = null, changedFields = [] }) {
    const query = `
      INSERT INTO audit_logs (user_id, table_name, record_id, operation, old_values, new_values, changed_fields)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, user_id, table_name, record_id, operation, old_values, new_values, changed_fields, created_at
    `;
    
    const result = await pool.query(query, [
      userId, tableName, recordId, operation, 
      JSON.stringify(oldValues), JSON.stringify(newValues), changedFields
    ]);
    
    return result.rows[0];
  }

  // Security Logs
  static async createSecurityLog({ userId = null, event, severity, ipAddress, userAgent = null, details = null, blocked = false }) {
    const query = `
      INSERT INTO security_logs (user_id, event, severity, ip_address, user_agent, details, blocked)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, user_id, event, severity, ip_address, user_agent, details, blocked, created_at
    `;
    
    const result = await pool.query(query, [
      userId, event, severity, ipAddress, userAgent, JSON.stringify(details), blocked
    ]);
    
    return result.rows[0];
  }

  // Get System Logs
  static async getSystemLogs(options = {}) {
    const { level, source, userId, dateFrom, dateTo, limit = 100, offset = 0 } = options;
    
    let query = `
      SELECT sl.*, u.name as user_name, u.email as user_email
      FROM system_logs sl
      LEFT JOIN users u ON sl.user_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (level) {
      query += ` AND sl.level = $${++paramCount}`;
      params.push(level);
    }
    
    if (source) {
      query += ` AND sl.source ILIKE $${++paramCount}`;
      params.push(`%${source}%`);
    }
    
    if (userId) {
      query += ` AND sl.user_id = $${++paramCount}`;
      params.push(userId);
    }
    
    if (dateFrom) {
      query += ` AND sl.created_at >= $${++paramCount}`;
      params.push(dateFrom);
    }
    
    if (dateTo) {
      query += ` AND sl.created_at <= $${++paramCount}`;
      params.push(dateTo);
    }
    
    query += `
      ORDER BY sl.created_at DESC
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;
    
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    return result.rows.map(row => ({
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : null
    }));
  }

  // Get Activity Logs
  static async getActivityLogs(options = {}) {
    const { userId, action, entityType, entityId, dateFrom, dateTo, limit = 100, offset = 0 } = options;
    
    let query = `
      SELECT al.*, u.name as user_name, u.email as user_email
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (userId) {
      query += ` AND al.user_id = $${++paramCount}`;
      params.push(userId);
    }
    
    if (action) {
      query += ` AND al.action = $${++paramCount}`;
      params.push(action);
    }
    
    if (entityType) {
      query += ` AND al.entity_type = $${++paramCount}`;
      params.push(entityType);
    }
    
    if (entityId) {
      query += ` AND al.entity_id = $${++paramCount}`;
      params.push(entityId);
    }
    
    if (dateFrom) {
      query += ` AND al.created_at >= $${++paramCount}`;
      params.push(dateFrom);
    }
    
    if (dateTo) {
      query += ` AND al.created_at <= $${++paramCount}`;
      params.push(dateTo);
    }
    
    query += `
      ORDER BY al.created_at DESC
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;
    
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    return result.rows.map(row => ({
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : null
    }));
  }

  // Get Audit Logs
  static async getAuditLogs(options = {}) {
    const { userId, tableName, recordId, operation, dateFrom, dateTo, limit = 100, offset = 0 } = options;
    
    let query = `
      SELECT al.*, u.name as user_name, u.email as user_email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (userId) {
      query += ` AND al.user_id = $${++paramCount}`;
      params.push(userId);
    }
    
    if (tableName) {
      query += ` AND al.table_name = $${++paramCount}`;
      params.push(tableName);
    }
    
    if (recordId) {
      query += ` AND al.record_id = $${++paramCount}`;
      params.push(recordId);
    }
    
    if (operation) {
      query += ` AND al.operation = $${++paramCount}`;
      params.push(operation);
    }
    
    if (dateFrom) {
      query += ` AND al.created_at >= $${++paramCount}`;
      params.push(dateFrom);
    }
    
    if (dateTo) {
      query += ` AND al.created_at <= $${++paramCount}`;
      params.push(dateTo);
    }
    
    query += `
      ORDER BY al.created_at DESC
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;
    
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    return result.rows.map(row => ({
      ...row,
      old_values: row.old_values ? JSON.parse(row.old_values) : null,
      new_values: row.new_values ? JSON.parse(row.new_values) : null
    }));
  }

  // Get Security Logs
  static async getSecurityLogs(options = {}) {
    const { userId, event, severity, ipAddress, blocked, dateFrom, dateTo, limit = 100, offset = 0 } = options;
    
    let query = `
      SELECT sl.*, u.name as user_name, u.email as user_email
      FROM security_logs sl
      LEFT JOIN users u ON sl.user_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (userId) {
      query += ` AND sl.user_id = $${++paramCount}`;
      params.push(userId);
    }
    
    if (event) {
      query += ` AND sl.event = $${++paramCount}`;
      params.push(event);
    }
    
    if (severity) {
      query += ` AND sl.severity = $${++paramCount}`;
      params.push(severity);
    }
    
    if (ipAddress) {
      query += ` AND sl.ip_address = $${++paramCount}`;
      params.push(ipAddress);
    }
    
    if (blocked !== undefined) {
      query += ` AND sl.blocked = $${++paramCount}`;
      params.push(blocked);
    }
    
    if (dateFrom) {
      query += ` AND sl.created_at >= $${++paramCount}`;
      params.push(dateFrom);
    }
    
    if (dateTo) {
      query += ` AND sl.created_at <= $${++paramCount}`;
      params.push(dateTo);
    }
    
    query += `
      ORDER BY sl.created_at DESC
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;
    
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    return result.rows.map(row => ({
      ...row,
      details: row.details ? JSON.parse(row.details) : null
    }));
  }

  // Get Log Statistics
  static async getLogStats(options = {}) {
    const { dateFrom, dateTo, groupBy = 'day' } = options;
    
    const dateFormat = groupBy === 'hour' ? 'YYYY-MM-DD HH24:00:00' : 'YYYY-MM-DD';
    
    let query = `
      SELECT 
        'system' as log_type,
        TO_CHAR(created_at, '${dateFormat}') as time_period,
        level,
        COUNT(*) as count
      FROM system_logs
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (dateFrom) {
      query += ` AND created_at >= $${++paramCount}`;
      params.push(dateFrom);
    }
    
    if (dateTo) {
      query += ` AND created_at <= $${++paramCount}`;
      params.push(dateTo);
    }
    
    query += `
      GROUP BY time_period, level
      
      UNION ALL
      
      SELECT 
        'activity' as log_type,
        TO_CHAR(created_at, '${dateFormat}') as time_period,
        action as level,
        COUNT(*) as count
      FROM activity_logs
      WHERE 1=1
    `;
    
    if (dateFrom) {
      query += ` AND created_at >= $${dateFrom ? paramCount - 1 : ++paramCount}`;
      if (!dateFrom) params.push(dateFrom);
    }
    
    if (dateTo) {
      query += ` AND created_at <= $${dateTo ? paramCount : ++paramCount}`;
      if (!dateTo) params.push(dateTo);
    }
    
    query += `
      GROUP BY time_period, action
      
      UNION ALL
      
      SELECT 
        'security' as log_type,
        TO_CHAR(created_at, '${dateFormat}') as time_period,
        severity as level,
        COUNT(*) as count
      FROM security_logs
      WHERE 1=1
    `;
    
    if (dateFrom) {
      query += ` AND created_at >= $${dateFrom ? (paramCount > 1 ? paramCount - 1 : paramCount) : ++paramCount}`;
      if (!dateFrom) params.push(dateFrom);
    }
    
    if (dateTo) {
      query += ` AND created_at <= $${dateTo ? paramCount : ++paramCount}`;
      if (!dateTo) params.push(dateTo);
    }
    
    query += `
      GROUP BY time_period, severity
      ORDER BY time_period, log_type, level
    `;
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  // Clean up old logs
  static async cleanupOldLogs(options = {}) {
    const { 
      systemLogRetentionDays = 90, 
      activityLogRetentionDays = 365, 
      auditLogRetentionDays = 2555, // 7 years
      securityLogRetentionDays = 1095 // 3 years
    } = options;
    
    const client = await pool.connect();
    let deletedCounts = {};
    
    try {
      await client.query('BEGIN');
      
      // Clean system logs
      const systemResult = await client.query(
        'DELETE FROM system_logs WHERE created_at < CURRENT_DATE - INTERVAL $1 RETURNING id',
        [`${systemLogRetentionDays} days`]
      );
      deletedCounts.systemLogs = systemResult.rowCount;
      
      // Clean activity logs
      const activityResult = await client.query(
        'DELETE FROM activity_logs WHERE created_at < CURRENT_DATE - INTERVAL $1 RETURNING id',
        [`${activityLogRetentionDays} days`]
      );
      deletedCounts.activityLogs = activityResult.rowCount;
      
      // Clean audit logs (keep longer for compliance)
      const auditResult = await client.query(
        'DELETE FROM audit_logs WHERE created_at < CURRENT_DATE - INTERVAL $1 RETURNING id',
        [`${auditLogRetentionDays} days`]
      );
      deletedCounts.auditLogs = auditResult.rowCount;
      
      // Clean security logs (keep longer for security analysis)
      const securityResult = await client.query(
        'DELETE FROM security_logs WHERE created_at < CURRENT_DATE - INTERVAL $1 RETURNING id',
        [`${securityLogRetentionDays} days`]
      );
      deletedCounts.securityLogs = securityResult.rowCount;
      
      await client.query('COMMIT');
      return deletedCounts;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Helper method to log user actions automatically
  static async logUserAction(userId, action, entityType, entityId, description, req = null) {
    const metadata = {
      timestamp: new Date().toISOString(),
      action: action,
      entity: { type: entityType, id: entityId }
    };
    
    return await this.createActivityLog({
      userId,
      action,
      entityType,
      entityId,
      description,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.get('User-Agent'),
      metadata
    });
  }

  // Helper method to log system errors
  static async logError(error, source, userId = null, metadata = null) {
    return await this.createSystemLog({
      level: 'error',
      message: error.message,
      source,
      userId,
      metadata: { ...metadata, error: error.name },
      stackTrace: error.stack
    });
  }
}

module.exports = LogsModel;
