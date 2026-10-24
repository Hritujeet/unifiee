-- Proposed data migration. Do not apply until reviewed and approved.
UPDATE "ai_documents"
SET "visibility_scope" = 'private'::"ai_visibility_scope"
WHERE "entity_type" = 'requirement'::"ai_entity_type";
