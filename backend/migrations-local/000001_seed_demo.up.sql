-- Local dev seed: admin@nowhere.com (password: password123)
-- Idempotent inserts only — safe to re-run; never deletes existing rows.

INSERT INTO users (id, email, password_hash, created_at)
VALUES (
    '11111111-1111-4111-8111-111111111111',
    'admin@nowhere.com',
    '$2a$12$Tt0srUQcWW2lPUDtElstmOZJlzcwgy6.144eC86IGKuFH6S3rdG2G',
    '2026-01-15 10:00:00+00'
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash;

INSERT INTO accounts (id, user_id, name, currency, account_type, created_at)
SELECT v.id, u.id, v.name, v.currency, v.account_type, v.created_at
FROM users u
CROSS JOIN (VALUES
    ('22222222-2222-4222-8222-222222222221'::uuid, 'Main Checking', 'USD', 'checking', '2026-01-15 10:05:00+00'::timestamptz),
    ('22222222-2222-4222-8222-222222222222'::uuid, 'Savings', 'USD', 'savings', '2026-01-15 10:06:00+00'::timestamptz)
) AS v(id, name, currency, account_type, created_at)
WHERE u.email = 'admin@nowhere.com'
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, user_id, name, category_type, created_at)
SELECT v.id, u.id, v.name, v.category_type, v.created_at
FROM users u
CROSS JOIN (VALUES
    ('33333333-3333-4333-8333-333333333331'::uuid, 'Salary', 'income', '2026-01-15 10:10:00+00'::timestamptz),
    ('33333333-3333-4333-8333-333333333332'::uuid, 'Freelance', 'income', '2026-01-15 10:10:00+00'::timestamptz),
    ('33333333-3333-4333-8333-333333333333'::uuid, 'Housing', 'expense', '2026-01-15 10:10:00+00'::timestamptz),
    ('33333333-3333-4333-8333-333333333334'::uuid, 'Groceries', 'expense', '2026-01-15 10:10:00+00'::timestamptz),
    ('33333333-3333-4333-8333-333333333335'::uuid, 'Transport', 'expense', '2026-01-15 10:10:00+00'::timestamptz),
    ('33333333-3333-4333-8333-333333333336'::uuid, 'Subscriptions', 'expense', '2026-01-15 10:10:00+00'::timestamptz)
) AS v(id, name, category_type, created_at)
WHERE u.email = 'admin@nowhere.com'
ON CONFLICT (id) DO NOTHING;

INSERT INTO transactions (id, user_id, account_id, category_id, amount, transaction_type, occurred_at, note, created_at)
SELECT v.id, u.id, v.account_id, v.category_id, v.amount, v.transaction_type, v.occurred_at, v.note, v.created_at
FROM users u
CROSS JOIN (VALUES
    ('44444444-4444-4444-8444-444444444401'::uuid, '22222222-2222-4222-8222-222222222221'::uuid, '33333333-3333-4333-8333-333333333331'::uuid, 5200.0000, 'income',  '2026-05-01 09:00:00+00'::timestamptz, 'Monthly salary', '2026-05-01 09:00:00+00'::timestamptz),
    ('44444444-4444-4444-8444-444444444402'::uuid, '22222222-2222-4222-8222-222222222221'::uuid, '33333333-3333-4333-8333-333333333332'::uuid,  850.0000, 'income',  '2026-05-15 14:30:00+00'::timestamptz, 'Client project payment', '2026-05-15 14:30:00+00'::timestamptz),
    ('44444444-4444-4444-8444-444444444403'::uuid, '22222222-2222-4222-8222-222222222221'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 1800.0000, 'expense', '2026-05-03 08:00:00+00'::timestamptz, 'Rent', '2026-05-03 08:00:00+00'::timestamptz),
    ('44444444-4444-4444-8444-444444444404'::uuid, '22222222-2222-4222-8222-222222222221'::uuid, '33333333-3333-4333-8333-333333333336'::uuid,   65.0000, 'expense', '2026-05-05 10:00:00+00'::timestamptz, 'Streaming & cloud', '2026-05-05 10:00:00+00'::timestamptz),
    ('44444444-4444-4444-8444-444444444405'::uuid, '22222222-2222-4222-8222-222222222221'::uuid, '33333333-3333-4333-8333-333333333334'::uuid,  210.5000, 'expense', '2026-05-10 18:20:00+00'::timestamptz, 'Weekly groceries', '2026-05-10 18:20:00+00'::timestamptz),
    ('44444444-4444-4444-8444-444444444406'::uuid, '22222222-2222-4222-8222-222222222221'::uuid, '33333333-3333-4333-8333-333333333335'::uuid,   45.0000, 'expense', '2026-05-12 07:45:00+00'::timestamptz, 'Metro pass top-up', '2026-05-12 07:45:00+00'::timestamptz),
    ('44444444-4444-4444-8444-444444444407'::uuid, '22222222-2222-4222-8222-222222222221'::uuid, '33333333-3333-4333-8333-333333333334'::uuid,  189.7500, 'expense', '2026-05-20 19:10:00+00'::timestamptz, 'Groceries', '2026-05-20 19:10:00+00'::timestamptz),
    ('44444444-4444-4444-8444-444444444408'::uuid, '22222222-2222-4222-8222-222222222222'::uuid, '33333333-3333-4333-8333-333333333335'::uuid,  135.0000, 'expense', '2026-05-18 12:00:00+00'::timestamptz, 'Fuel', '2026-05-18 12:00:00+00'::timestamptz),
    ('44444444-4444-4444-8444-444444444409'::uuid, '22222222-2222-4222-8222-222222222222'::uuid, NULL::uuid, 500.0000, 'income', '2026-05-22 11:00:00+00'::timestamptz, 'Transfer to savings', '2026-05-22 11:00:00+00'::timestamptz)
) AS v(id, account_id, category_id, amount, transaction_type, occurred_at, note, created_at)
WHERE u.email = 'admin@nowhere.com'
ON CONFLICT (id) DO NOTHING;
