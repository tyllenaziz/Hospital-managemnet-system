const normalizeHospitalIdentifier = (value = "") =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const slugifyHospitalName = (value = "") =>
  normalizeHospitalIdentifier(
    String(value)
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-")
  );

const attachHospitalTenantMeta = (hospital) =>
  hospital
    ? {
        ...hospital,
        tenant_slug: slugifyHospitalName(hospital.name || hospital.code || ""),
      }
    : null;

const matchesHospitalIdentifier = (hospital, identifier) => {
  const normalizedIdentifier = normalizeHospitalIdentifier(identifier);
  if (!hospital || !normalizedIdentifier) {
    return false;
  }

  return [
    normalizeHospitalIdentifier(hospital.code),
    slugifyHospitalName(hospital.name),
    normalizeHospitalIdentifier(hospital.name),
  ].includes(normalizedIdentifier);
};

const findHospitalByIdentifier = async (
  executor,
  identifier,
  options = {}
) => {
  const normalizedIdentifier = normalizeHospitalIdentifier(identifier);
  if (!normalizedIdentifier) {
    return null;
  }

  const fields =
    options.fields ||
    "id, name, code, logo_path, phone, email, is_active";
  const includeInactive = options.includeInactive === true;

  const activeFilter = includeInactive ? "" : " AND is_active = 1";
  const [[codeMatch]] = await executor.query(
    `SELECT ${fields}
     FROM hospitals
     WHERE LOWER(code) = ?${activeFilter}
     LIMIT 1`,
    [normalizedIdentifier]
  );

  if (codeMatch) {
    return attachHospitalTenantMeta(codeMatch);
  }

  const [hospitals] = await executor.query(
    `SELECT ${fields}
     FROM hospitals${includeInactive ? "" : " WHERE is_active = 1"}
     ORDER BY id ASC`
  );

  const matchedHospital = hospitals.find((hospital) =>
    matchesHospitalIdentifier(hospital, normalizedIdentifier)
  );

  return attachHospitalTenantMeta(matchedHospital || null);
};

module.exports = {
  normalizeHospitalIdentifier,
  slugifyHospitalName,
  attachHospitalTenantMeta,
  findHospitalByIdentifier,
};
