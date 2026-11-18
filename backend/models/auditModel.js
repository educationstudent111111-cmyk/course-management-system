const db = require("../config/db");

const Audit = {
  async create(entry) {
    const [result] = await db.execute(
      `INSERT INTO audit_logs
       (actor_id, actor_username, actor_role, action, entity_type,
        entity_id, previous_data, new_data, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.actorId,
        entry.actorUsername,
        entry.actorRole,
        entry.action,
        entry.entityType,
        entry.entityId,
        entry.previousData === null
          ? null
          : JSON.stringify(entry.previousData),
        entry.newData === null
          ? null
          : JSON.stringify(entry.newData),
        entry.ipAddress,
      ]
    );

    return result.insertId;
  },

  async getAll(filters = {}) {
    const {
      entityType = "",
      entityId = "",
      actor = "",
      action = "",
      from = "",
      to = "",
      page = 1,
      limit = 20,
    } = filters;

    const conditions = [];
    const params = [];

    if (entityType) {
      conditions.push("entity_type = ?");
      params.push(entityType);
    }

    if (entityId) {
      conditions.push("entity_id = ?");
      params.push(Number(entityId));
    }

    if (actor) {
      conditions.push(
        "(actor_username LIKE ? OR CAST(actor_id AS CHAR) = ?)"
      );
      params.push(`%${actor}%`, actor);
    }

    if (action) {
      conditions.push("action LIKE ?");
      params.push(`%${action}%`);
    }

    if (from) {
      conditions.push("created_at >= ?");
      params.push(`${from} 00:00:00`);
    }

    if (to) {
      conditions.push("created_at < DATE_ADD(?, INTERVAL 1 DAY)");
      params.push(to);
    }

    const whereSQL = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const [countRows] = await db.execute(
      `SELECT COUNT(*) AS total FROM audit_logs ${whereSQL}`,
      params
    );

    const offset = (Number(page) - 1) * Number(limit);
    const [rows] = await db.execute(
      `SELECT id, actor_id, actor_username, actor_role, action, entity_type,
              entity_id, previous_data, new_data, ip_address, created_at
       FROM audit_logs
       ${whereSQL}
       ORDER BY created_at DESC, id DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );

    return {
      logs: rows,
      total: Number(countRows[0]?.total || 0),
    };
  },
};

module.exports = Audit;