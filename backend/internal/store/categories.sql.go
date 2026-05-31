package store

import (
	"context"

	"github.com/google/uuid"
)

const createCategory = `-- name: CreateCategory :one
INSERT INTO categories (user_id, name, category_type)
VALUES ($1, $2, $3)
RETURNING id, user_id, name, category_type, created_at`

func (q *Queries) CreateCategory(ctx context.Context, arg CreateCategoryParams) (Category, error) {
	row := q.db.QueryRow(ctx, createCategory, arg.UserID, arg.Name, arg.CategoryType)
	var c Category
	err := row.Scan(&c.ID, &c.UserID, &c.Name, &c.CategoryType, &c.CreatedAt)
	return c, err
}

const listCategoriesByUser = `-- name: ListCategoriesByUser :many
SELECT id, user_id, name, category_type, created_at FROM categories
WHERE user_id = $1
ORDER BY name ASC`

func (q *Queries) ListCategoriesByUser(ctx context.Context, userID uuid.UUID) ([]Category, error) {
	rows, err := q.db.Query(ctx, listCategoriesByUser, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := make([]Category, 0)
	for rows.Next() {
		var c Category
		if err := rows.Scan(&c.ID, &c.UserID, &c.Name, &c.CategoryType, &c.CreatedAt); err != nil {
			return nil, err
		}
		items = append(items, c)
	}
	return items, rows.Err()
}

const getCategoryByID = `-- name: GetCategoryByID :one
SELECT id, user_id, name, category_type, created_at FROM categories
WHERE id = $1 AND user_id = $2`

func (q *Queries) GetCategoryByID(ctx context.Context, arg GetCategoryByIDParams) (Category, error) {
	row := q.db.QueryRow(ctx, getCategoryByID, arg.ID, arg.UserID)
	var c Category
	err := row.Scan(&c.ID, &c.UserID, &c.Name, &c.CategoryType, &c.CreatedAt)
	return c, err
}
