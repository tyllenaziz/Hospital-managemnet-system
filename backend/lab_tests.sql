/*
  Template-based lab catalog sync
  --------------------------------
  The authoritative master lab test list now lives in:
    - backend/config/masterLabTests.js
    - backend/services/labCatalogService.js

  Run one of these first to seed the master template catalog:
    - node backend/scripts/seed_lab_tests.js
    - cd backend && npm run prisma:seed

  This SQL file is now focused on syncing the seeded template catalog into one
  hospital or all hospitals without redefining the database structure again.
*/

-- Set a hospital id to sync one hospital, or leave NULL to sync all hospitals.
SET @hospital_id = NULL;

/*
  1. Create missing hospital-specific tests from the master template catalog.
  New hospital rows start disabled so the hospital admin can enable and price them.
*/
INSERT INTO lab_tests (
  hospital_id,
  template_id,
  test_name,
  test_code,
  category,
  price,
  normal_range,
  unit,
  description,
  is_enabled,
  is_custom,
  synced_at
)
SELECT
  h.id,
  t.id,
  t.test_name,
  t.test_code,
  t.category,
  COALESCE(t.default_price, 0),
  t.normal_range,
  t.unit,
  t.description,
  FALSE,
  FALSE,
  NOW()
FROM hospitals h
JOIN lab_test_templates t ON t.is_active = TRUE
LEFT JOIN lab_tests existing
  ON existing.hospital_id = h.id
 AND existing.template_id = t.id
WHERE existing.id IS NULL
  AND (@hospital_id IS NULL OR h.id = @hospital_id);

/*
  2. Refresh synced template metadata for non-custom hospital tests.
  Price and enabled state remain hospital-controlled.
*/
UPDATE lab_tests lt
JOIN lab_test_templates t ON lt.template_id = t.id
SET lt.test_name = t.test_name,
    lt.test_code = t.test_code,
    lt.category = t.category,
    lt.normal_range = t.normal_range,
    lt.unit = t.unit,
    lt.description = t.description,
    lt.synced_at = NOW()
WHERE lt.is_custom = FALSE
  AND (@hospital_id IS NULL OR lt.hospital_id = @hospital_id);

/*
  3. Create missing parameter rows for each hospital test from the template.
*/
INSERT INTO lab_test_parameters (
  lab_test_id,
  template_parameter_id,
  parameter_name,
  unit,
  normal_range
)
SELECT
  lt.id,
  tp.id,
  tp.parameter_name,
  tp.unit,
  tp.normal_range
FROM lab_tests lt
JOIN lab_test_templates t ON lt.template_id = t.id
JOIN lab_test_template_parameters tp ON tp.template_id = t.id
LEFT JOIN lab_test_parameters existing
  ON existing.lab_test_id = lt.id
 AND existing.template_parameter_id = tp.id
WHERE lt.is_custom = FALSE
  AND existing.id IS NULL
  AND (@hospital_id IS NULL OR lt.hospital_id = @hospital_id);

/*
  4. Refresh hospital test parameters from the template for synced tests.
*/
UPDATE lab_test_parameters ltp
JOIN lab_test_template_parameters tp ON ltp.template_parameter_id = tp.id
JOIN lab_tests lt ON ltp.lab_test_id = lt.id
SET ltp.parameter_name = tp.parameter_name,
    ltp.unit = tp.unit,
    ltp.normal_range = tp.normal_range
WHERE lt.is_custom = FALSE
  AND (@hospital_id IS NULL OR lt.hospital_id = @hospital_id);
