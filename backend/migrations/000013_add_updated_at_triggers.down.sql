-- Drop all updated_at triggers
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
DROP TRIGGER IF EXISTS update_chapters_updated_at ON chapters;
DROP TRIGGER IF EXISTS update_wiki_pages_updated_at ON wiki_pages;
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;

-- Drop the trigger function
DROP FUNCTION IF EXISTS update_updated_at_column();
