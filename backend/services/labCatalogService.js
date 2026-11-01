const db = require("../config/dbconfig");
const masterLabTests = require("../config/masterLabTests");

async function seedMasterLabTemplates(executor = db) {
  for (const test of masterLabTests) {
    await executor.query(
      `INSERT INTO lab_test_templates
        (test_name, test_code, category, default_price, normal_range, unit, description, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)
       ON DUPLICATE KEY UPDATE
        test_name = VALUES(test_name),
        category = VALUES(category),
        default_price = VALUES(default_price),
        normal_range = VALUES(normal_range),
        unit = VALUES(unit),
        description = VALUES(description),
        is_active = TRUE`,
      [
        test.test_name,
        test.test_code,
        test.category,
        test.default_price,
        test.normal_range,
        test.unit,
        test.description,
      ]
    );

    const [[template]] = await executor.query(
      "SELECT id FROM lab_test_templates WHERE test_code = ? LIMIT 1",
      [test.test_code]
    );

    for (let index = 0; index < test.parameters.length; index += 1) {
      const parameter = test.parameters[index];
      await executor.query(
        `INSERT INTO lab_test_template_parameters
          (template_id, parameter_name, unit, normal_range, sort_order)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
          unit = VALUES(unit),
          normal_range = VALUES(normal_range),
          sort_order = VALUES(sort_order)`,
        [
          template.id,
          parameter.parameter_name,
          parameter.unit,
          parameter.normal_range,
          index,
        ]
      );
    }
  }
}

async function syncTemplatesToHospital(hospitalId, executor = db) {
  await executor.query(
    `INSERT INTO lab_tests
      (hospital_id, template_id, test_name, test_code, category, price, normal_range, unit, description, is_enabled, is_custom, synced_at)
     SELECT ?, t.id, t.test_name, t.test_code, t.category, COALESCE(t.default_price, 0), t.normal_range, t.unit, t.description, FALSE, FALSE, NOW()
     FROM lab_test_templates t
     LEFT JOIN lab_tests existing
       ON existing.hospital_id = ? AND existing.template_id = t.id
     WHERE t.is_active = TRUE
       AND existing.id IS NULL`,
    [hospitalId, hospitalId]
  );

  await executor.query(
    `UPDATE lab_tests lt
     JOIN lab_test_templates t ON lt.template_id = t.id
     SET lt.test_name = t.test_name,
         lt.test_code = t.test_code,
         lt.category = t.category,
         lt.normal_range = t.normal_range,
         lt.unit = t.unit,
         lt.description = t.description,
         lt.synced_at = NOW()
     WHERE lt.hospital_id = ?
       AND lt.is_custom = FALSE`,
    [hospitalId]
  );

  await executor.query(
    `INSERT INTO lab_test_parameters
      (lab_test_id, template_parameter_id, parameter_name, unit, normal_range)
     SELECT lt.id, tp.id, tp.parameter_name, tp.unit, tp.normal_range
     FROM lab_tests lt
     JOIN lab_test_templates t ON lt.template_id = t.id
     JOIN lab_test_template_parameters tp ON tp.template_id = t.id
     LEFT JOIN lab_test_parameters existing
       ON existing.lab_test_id = lt.id AND existing.template_parameter_id = tp.id
     WHERE lt.hospital_id = ?
       AND lt.is_custom = FALSE
       AND existing.id IS NULL`,
    [hospitalId]
  );

  await executor.query(
    `UPDATE lab_test_parameters ltp
     JOIN lab_test_template_parameters tp ON ltp.template_parameter_id = tp.id
     JOIN lab_tests lt ON ltp.lab_test_id = lt.id
     SET ltp.parameter_name = tp.parameter_name,
         ltp.unit = tp.unit,
         ltp.normal_range = tp.normal_range
     WHERE lt.hospital_id = ?
       AND lt.is_custom = FALSE`,
    [hospitalId]
  );
}

async function syncTemplatesToAllHospitals(executor = db) {
  const [hospitals] = await executor.query("SELECT id FROM hospitals ORDER BY id ASC");
  for (const hospital of hospitals) {
    await syncTemplatesToHospital(hospital.id, executor);
  }
}

module.exports = {
  seedMasterLabTemplates,
  syncTemplatesToHospital,
  syncTemplatesToAllHospitals,
};
