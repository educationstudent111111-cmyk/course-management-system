const Audit = require("../models/auditModel");

const isPositiveInteger = (value) =>
  typeof value === "string" &&
  /^\d+$/.test(value) &&
  Number.isSafeInteger(Number(value)) &&
  Number(value) > 0;

const isValidDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const getAuditLogs = async (req, res) => {
  const {
    entityType = "",
    entityId = "",
    actor = "",
    action = "",
    from = "",
    to = "",
    page = "1",
    limit = "20",
  } = req.query;

  const queryValues = [entityType, entityId, actor, action, from, to, page, limit];
  if (queryValues.some((value) => typeof value !== "string")) {
    return res.status(400).json({ message: "Invalid query parameter format." });
  }

  if (entityId && !isPositiveInteger(entityId)) {
    return res.status(400).json({ message: "Entity ID must be a positive integer." });
  }

  if (!isPositiveInteger(page)) {
    return res.status(400).json({ message: "Page must be a positive integer." });
  }

  if (!isPositiveInteger(limit) || Number(limit) > 100) {
    return res.status(400).json({ message: "Limit must be between 1 and 100." });
  }

  if ((from && !isValidDate(from)) || (to && !isValidDate(to))) {
    return res.status(400).json({ message: "Dates must use YYYY-MM-DD format." });
  }

  if (from && to && from > to) {
    return res.status(400).json({ message: "From date cannot be after to date." });
  }

  try {
    const currentPage = Number(page);
    const pageLimit = Number(limit);
    const result = await Audit.getAll({
      entityType,
      entityId,
      actor: actor.trim(),
      action: action.trim(),
      from,
      to,
      page: currentPage,
      limit: pageLimit,
    });

    return res.status(200).json({
      logs: result.logs,
      pagination: {
        page: currentPage,
        limit: pageLimit,
        total: result.total,
        totalPages: Math.ceil(result.total / pageLimit),
      },
    });
  } catch (error) {
    console.error("Error retrieving audit logs:", error.message);
    return res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = { getAuditLogs };