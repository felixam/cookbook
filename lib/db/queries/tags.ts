import { query, getClient } from '../connection';
import type { Tag, TagInput, TagColor } from '@/lib/types/recipe';

interface TagRow {
  id: number;
  name: string;
  color: string;
  created_at: Date;
  updated_at: Date;
}

function rowToTag(row: TagRow): Tag {
  return {
    id: row.id,
    name: row.name,
    color: row.color as TagColor,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAllTags(): Promise<Tag[]> {
  const result = await query<TagRow>(
    `SELECT id, name, color, created_at, updated_at
     FROM recipes_tags
     ORDER BY name`
  );

  return result.rows.map(rowToTag);
}

export async function getTagById(id: number): Promise<Tag | null> {
  const result = await query<TagRow>(
    `SELECT id, name, color, created_at, updated_at
     FROM recipes_tags WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return rowToTag(result.rows[0]);
}

export async function getTagsByRecipeId(recipeId: string): Promise<Tag[]> {
  const result = await query<TagRow>(
    `SELECT t.id, t.name, t.color, t.created_at, t.updated_at
     FROM recipes_tags t
     INNER JOIN recipes_recipe_tags rt ON t.id = rt.tag_id
     WHERE rt.recipe_id = $1
     ORDER BY t.name`,
    [recipeId]
  );

  return result.rows.map(rowToTag);
}

export async function createTag(input: TagInput): Promise<Tag> {
  const result = await query<TagRow>(
    `INSERT INTO recipes_tags (name, color)
     VALUES ($1, $2)
     RETURNING id, name, color, created_at, updated_at`,
    [input.name.trim(), input.color]
  );

  return rowToTag(result.rows[0]);
}

export async function updateTag(id: number, input: TagInput): Promise<Tag | null> {
  const result = await query<TagRow>(
    `UPDATE recipes_tags
     SET name = $1, color = $2
     WHERE id = $3
     RETURNING id, name, color, created_at, updated_at`,
    [input.name.trim(), input.color, id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return rowToTag(result.rows[0]);
}

export async function deleteTag(id: number): Promise<boolean> {
  const result = await query('DELETE FROM recipes_tags WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function tagExistsByName(name: string, excludeId?: number): Promise<boolean> {
  let sql = `SELECT EXISTS(SELECT 1 FROM recipes_tags WHERE LOWER(name) = LOWER($1)`;
  const params: (string | number)[] = [name.trim()];

  if (excludeId !== undefined) {
    sql += ` AND id != $2`;
    params.push(excludeId);
  }

  sql += `) as exists`;

  const result = await query<{ exists: boolean }>(sql, params);
  return result.rows[0].exists;
}

export async function setRecipeTags(recipeId: string, tagIds: number[]): Promise<void> {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Delete existing tags for this recipe
    await client.query('DELETE FROM recipes_recipe_tags WHERE recipe_id = $1', [recipeId]);

    // Insert new tags
    for (const tagId of tagIds) {
      await client.query(
        `INSERT INTO recipes_recipe_tags (recipe_id, tag_id) VALUES ($1, $2)`,
        [recipeId, tagId]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getTagUsageCount(tagId: number): Promise<number> {
  const result = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM recipes_recipe_tags WHERE tag_id = $1`,
    [tagId]
  );
  return parseInt(result.rows[0].count, 10);
}
