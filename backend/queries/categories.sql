-- name: CreateCategory :one
INSERT INTO categories (user_id, name, category_type)
VALUES ($1, $2, $3)
RETURNING *;

-- name: ListCategoriesByUser :many
SELECT * FROM categories
WHERE user_id = $1
ORDER BY name ASC;

-- name: GetCategoryByID :one
SELECT * FROM categories
WHERE id = $1 AND user_id = $2;
