-- Migration: Add tags support for recipes
-- Tags can be freely created by users and assigned to any number of recipes

-- Tags table
CREATE TABLE IF NOT EXISTS recipes_tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(20) NOT NULL DEFAULT 'gray',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Junction table for recipe-tag many-to-many relationship
CREATE TABLE IF NOT EXISTS recipes_recipe_tags (
    recipe_id UUID NOT NULL REFERENCES recipes_recipes(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES recipes_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (recipe_id, tag_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_recipes_tags_name ON recipes_tags(name);
CREATE INDEX IF NOT EXISTS idx_recipes_recipe_tags_recipe_id ON recipes_recipe_tags(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipes_recipe_tags_tag_id ON recipes_recipe_tags(tag_id);

-- Trigger for updated_at on tags
DROP TRIGGER IF EXISTS update_recipes_tags_updated_at ON recipes_tags;
CREATE TRIGGER update_recipes_tags_updated_at
    BEFORE UPDATE ON recipes_tags
    FOR EACH ROW EXECUTE FUNCTION recipes_update_updated_at_column();

-- Insert some example tags
INSERT INTO recipes_tags (name, color) VALUES
    ('Vegetarisch', 'green'),
    ('Vegan', 'emerald'),
    ('Schnell', 'yellow'),
    ('Dessert', 'pink'),
    ('Hauptgericht', 'blue'),
    ('Vorspeise', 'purple'),
    ('Frühstück', 'orange'),
    ('Backen', 'amber'),
    ('Italienisch', 'red'),
    ('Asiatisch', 'cyan')
ON CONFLICT (name) DO NOTHING;
