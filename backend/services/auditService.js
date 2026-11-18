const Audit = require("../models/auditModel");

const sensitiveKey = /(password|passwd|secret|token|credential)/i;

const removeSensitiveValues = (value) => {
  if (Array.isArray(value)) {
    return value.map(removeSensitiveValues);
  }

  if (value && typeof value === "object" && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !sensitiveKey.test(key))
        .map(([key, nestedValue]) => [
          key,
          removeSensitiveValues(nestedValue),
        ])
    );
  }

  return value;
};

const capture = async (loadSnapshot) => {
  try {
    return await loadSnapshot();
  } catch (error) {
    console.error("Audit snapshot failed:", error.message);
    return null;
  }
};

const record = async (
  req,
  { action, entityType, entityId, previousData = null, newData = null }
) => {
  try {
    const actor = req.user || {};

    await Audit.create({
      actorId: actor.id,
      actorUsername: actor.username || "unknown",
      actorRole: actor.role || "unknown",
      action,
      entityType,
      entityId: entityId ?? null,
      previousData: removeSensitiveValues(previousData),
      newData: removeSensitiveValues(newData),
      ipAddress: req.ip || req.socket?.remoteAddress || null,
    });
  } catch (error) {
    console.error("Audit log insert failed:", error.message);
  }
};

module.exports = { capture, record };