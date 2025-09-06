const pool = require('../config/database');

class ProjectModel {
  static async create({ name, description, ownerId, teamMembers = [], startDate, endDate, status = 'planning', priority = 'medium' }) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create project
      const projectQuery = `
        INSERT INTO projects (name, description, owner_id, start_date, end_date, status, priority)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, name, description, owner_id, start_date, end_date, status, priority, created_at, updated_at
      `;
      
      const projectResult = await client.query(projectQuery, [
        name, description, ownerId, startDate, endDate, status, priority
      ]);
      
      const project = projectResult.rows[0];
      
      // Add team members if provided
      if (teamMembers.length > 0) {
        const memberQuery = `
          INSERT INTO project_members (project_id, user_id, role, joined_at)
          VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        `;
        
        for (const member of teamMembers) {
          await client.query(memberQuery, [project.id, member.userId, member.role || 'member']);
        }
      }
      
      await client.query('COMMIT');
      return project;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async findById(id) {
    const query = `
      SELECT p.*, u.name as owner_name, u.email as owner_email,
             COUNT(t.id) as total_tasks,
             COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      LEFT JOIN tasks t ON p.id = t.project_id
      WHERE p.id = $1
      GROUP BY p.id, u.name, u.email
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByUserId(userId, options = {}) {
    const { status, limit = 50, offset = 0 } = options;
    
    let query = `
      SELECT DISTINCT p.*, u.name as owner_name,
             COUNT(t.id) as total_tasks,
             COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      LEFT JOIN project_members pm ON p.id = pm.project_id
      LEFT JOIN tasks t ON p.id = t.project_id
      WHERE (p.owner_id = $1 OR pm.user_id = $1)
    `;
    
    const params = [userId];
    let paramCount = 1;
    
    if (status) {
      query += ` AND p.status = $${++paramCount}`;
      params.push(status);
    }
    
    query += `
      GROUP BY p.id, u.name
      ORDER BY p.updated_at DESC
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;
    
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async update(id, updates) {
    const allowedUpdates = ['name', 'description', 'start_date', 'end_date', 'status', 'priority'];
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
      UPDATE projects 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM projects WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async addTeamMember(projectId, userId, role = 'member') {
    const query = `
      INSERT INTO project_members (project_id, user_id, role, joined_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (project_id, user_id) 
      DO UPDATE SET role = $3, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const result = await pool.query(query, [projectId, userId, role]);
    return result.rows[0];
  }

  static async removeTeamMember(projectId, userId) {
    const query = 'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2 RETURNING *';
    const result = await pool.query(query, [projectId, userId]);
    return result.rows[0];
  }

  static async getTeamMembers(projectId) {
    const query = `
      SELECT pm.*, u.name, u.email
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = $1
      ORDER BY pm.joined_at ASC
    `;
    
    const result = await pool.query(query, [projectId]);
    return result.rows;
  }

  static async getProjectStats(projectId) {
    const query = `
      SELECT 
        COUNT(t.id) as total_tasks,
        COUNT(CASE WHEN t.status = 'todo' THEN 1 END) as todo_tasks,
        COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress_tasks,
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN t.priority = 'high' THEN 1 END) as high_priority_tasks,
        COUNT(pm.user_id) as team_size
      FROM projects p
      LEFT JOIN tasks t ON p.id = t.project_id
      LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE p.id = $1
      GROUP BY p.id
    `;
    
    const result = await pool.query(query, [projectId]);
    return result.rows[0];
  }
}

module.exports = ProjectModel;
