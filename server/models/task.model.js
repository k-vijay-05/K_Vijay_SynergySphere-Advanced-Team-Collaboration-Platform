const pool = require('../config/database');

class TaskModel {
  static async create({ title, description, projectId, assigneeId, createdBy, dueDate, priority = 'medium', status = 'todo', tags = [] }) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create task
      const taskQuery = `
        INSERT INTO tasks (title, description, project_id, assignee_id, created_by, due_date, priority, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, title, description, project_id, assignee_id, created_by, due_date, priority, status, created_at, updated_at
      `;
      
      const taskResult = await client.query(taskQuery, [
        title, description, projectId, assigneeId, createdBy, dueDate, priority, status
      ]);
      
      const task = taskResult.rows[0];
      
      // Add tags if provided
      if (tags.length > 0) {
        const tagQuery = `
          INSERT INTO task_tags (task_id, tag_name)
          VALUES ($1, $2)
          ON CONFLICT (task_id, tag_name) DO NOTHING
        `;
        
        for (const tag of tags) {
          await client.query(tagQuery, [task.id, tag]);
        }
      }
      
      await client.query('COMMIT');
      return task;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async findById(id) {
    const query = `
      SELECT t.*, 
             u1.name as assignee_name, u1.email as assignee_email,
             u2.name as creator_name, u2.email as creator_email,
             p.name as project_name,
             ARRAY_AGG(DISTINCT tt.tag_name) FILTER (WHERE tt.tag_name IS NOT NULL) as tags
      FROM tasks t
      LEFT JOIN users u1 ON t.assignee_id = u1.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN task_tags tt ON t.id = tt.task_id
      WHERE t.id = $1
      GROUP BY t.id, u1.name, u1.email, u2.name, u2.email, p.name
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByProjectId(projectId, options = {}) {
    const { status, assigneeId, priority, limit = 100, offset = 0 } = options;
    
    let query = `
      SELECT t.*, 
             u1.name as assignee_name, u1.email as assignee_email,
             u2.name as creator_name,
             ARRAY_AGG(DISTINCT tt.tag_name) FILTER (WHERE tt.tag_name IS NOT NULL) as tags
      FROM tasks t
      LEFT JOIN users u1 ON t.assignee_id = u1.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      LEFT JOIN task_tags tt ON t.id = tt.task_id
      WHERE t.project_id = $1
    `;
    
    const params = [projectId];
    let paramCount = 1;
    
    if (status) {
      query += ` AND t.status = $${++paramCount}`;
      params.push(status);
    }
    
    if (assigneeId) {
      query += ` AND t.assignee_id = $${++paramCount}`;
      params.push(assigneeId);
    }
    
    if (priority) {
      query += ` AND t.priority = $${++paramCount}`;
      params.push(priority);
    }
    
    query += `
      GROUP BY t.id, u1.name, u1.email, u2.name
      ORDER BY 
        CASE t.priority 
          WHEN 'high' THEN 1 
          WHEN 'medium' THEN 2 
          WHEN 'low' THEN 3 
        END,
        t.due_date ASC NULLS LAST,
        t.created_at DESC
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;
    
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async findByAssigneeId(assigneeId, options = {}) {
    const { status, projectId, priority, limit = 50, offset = 0 } = options;
    
    let query = `
      SELECT t.*, 
             p.name as project_name,
             u.name as creator_name,
             ARRAY_AGG(DISTINCT tt.tag_name) FILTER (WHERE tt.tag_name IS NOT NULL) as tags
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN task_tags tt ON t.id = tt.task_id
      WHERE t.assignee_id = $1
    `;
    
    const params = [assigneeId];
    let paramCount = 1;
    
    if (status) {
      query += ` AND t.status = $${++paramCount}`;
      params.push(status);
    }
    
    if (projectId) {
      query += ` AND t.project_id = $${++paramCount}`;
      params.push(projectId);
    }
    
    if (priority) {
      query += ` AND t.priority = $${++paramCount}`;
      params.push(priority);
    }
    
    query += `
      GROUP BY t.id, p.name, u.name
      ORDER BY 
        CASE t.status 
          WHEN 'in_progress' THEN 1 
          WHEN 'todo' THEN 2 
          WHEN 'completed' THEN 3 
        END,
        t.due_date ASC NULLS LAST
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;
    
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async update(id, updates) {
    const allowedUpdates = ['title', 'description', 'assignee_id', 'due_date', 'priority', 'status'];
    const updateFields = [];
    const values = [];
    let paramCount = 1;
    
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updateFields.push(`${key} = $${paramCount++}`);
        values.push(updates[key]);
      }
    });
    
    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }
    
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    
    const query = `
      UPDATE tasks 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async updateStatus(id, status, updatedBy) {
    const query = `
      UPDATE tasks 
      SET status = $1, updated_at = CURRENT_TIMESTAMP,
          completed_at = CASE WHEN $1 = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [status, id]);
    return result.rows[0];
  }

  static async delete(id) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Delete task tags first
      await client.query('DELETE FROM task_tags WHERE task_id = $1', [id]);
      
      // Delete task comments
      await client.query('DELETE FROM task_comments WHERE task_id = $1', [id]);
      
      // Delete the task
      const result = await client.query('DELETE FROM tasks WHERE id = $1 RETURNING id', [id]);
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async addTag(taskId, tagName) {
    const query = `
      INSERT INTO task_tags (task_id, tag_name)
      VALUES ($1, $2)
      ON CONFLICT (task_id, tag_name) DO NOTHING
      RETURNING *
    `;
    
    const result = await pool.query(query, [taskId, tagName]);
    return result.rows[0];
  }

  static async removeTag(taskId, tagName) {
    const query = 'DELETE FROM task_tags WHERE task_id = $1 AND tag_name = $2 RETURNING *';
    const result = await pool.query(query, [taskId, tagName]);
    return result.rows[0];
  }

  static async getTasksByDueDate(dueDate, userId = null) {
    let query = `
      SELECT t.*, p.name as project_name, u.name as assignee_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assignee_id = u.id
      WHERE DATE(t.due_date) = DATE($1) AND t.status != 'completed'
    `;
    
    const params = [dueDate];
    
    if (userId) {
      query += ' AND t.assignee_id = $2';
      params.push(userId);
    }
    
    query += ' ORDER BY t.priority DESC, t.due_date ASC';
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async getOverdueTasks(userId = null) {
    let query = `
      SELECT t.*, p.name as project_name, u.name as assignee_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assignee_id = u.id
      WHERE t.due_date < CURRENT_DATE AND t.status != 'completed'
    `;
    
    const params = [];
    
    if (userId) {
      query += ' AND t.assignee_id = $1';
      params.push(userId);
    }
    
    query += ' ORDER BY t.due_date ASC, t.priority DESC';
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async getTaskStats(projectId = null, userId = null) {
    let query = `
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'todo' THEN 1 END) as todo_tasks,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority_tasks,
        COUNT(CASE WHEN due_date < CURRENT_DATE AND status != 'completed' THEN 1 END) as overdue_tasks
      FROM tasks t
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (projectId) {
      query += ` AND t.project_id = $${++paramCount}`;
      params.push(projectId);
    }
    
    if (userId) {
      query += ` AND t.assignee_id = $${++paramCount}`;
      params.push(userId);
    }
    
    const result = await pool.query(query, params);
    return result.rows[0];
  }
}

module.exports = TaskModel;
