---
name: db-migrate
description: Safely create and run database migrations
context: fork
model: opus
tools:
  - Read
  - Write
  - Bash
allowed_commands:
  - "npx prisma*"
  - "alembic*"
  - "npm run db:*"
  - "psql*"
---

# Database Migration

Safely create and manage database migrations.

## Input

$ARGUMENTS should specify:
- Action: `create` | `run` | `rollback` | `status`
- Description: "add user email column" (for create)

## Process

### Create Migration

1. **Detect ORM**
   - Prisma → `prisma migrate dev`
   - Drizzle → `drizzle-kit generate`
   - SQLAlchemy → `alembic revision`
   - TypeORM → `typeorm migration:create`

2. **Generate Migration**
   ```bash
   # Prisma
   npx prisma migrate dev --name $DESCRIPTION --create-only

   # Alembic
   alembic revision --autogenerate -m "$DESCRIPTION"
   ```

3. **Review Generated SQL**
   - Check for destructive operations
   - Verify data preservation
   - Warn about potential issues

4. **Report**

### Run Migration

1. **Backup Reminder**
   ```
   ⚠️ REMINDER: Ensure database is backed up before proceeding
   ```

2. **Check Current State**
   ```bash
   npx prisma migrate status
   ```

3. **Run Migration**
   ```bash
   npx prisma migrate deploy
   ```

4. **Verify**
   - Check migration applied
   - Verify schema matches
   - Run quick smoke test

### Rollback

1. **Identify Last Migration**
2. **Generate Rollback**
3. **Apply Rollback**
4. **Verify State**

## Safety Checks

Before any migration:
- [ ] Is this a production database? (STOP and confirm)
- [ ] Is there a backup?
- [ ] Are destructive operations intended?
- [ ] Is there a rollback plan?

## Output

```markdown
## Migration Report

**Action**: Create
**Description**: add user email column
**ORM**: Prisma

### Generated Migration
File: `prisma/migrations/20240115_add_user_email/migration.sql`

```sql
ALTER TABLE "User" ADD COLUMN "email" TEXT;
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
```

### Analysis
- ✅ Non-destructive (adding column)
- ✅ Index created for performance
- ⚠️ Column is nullable (intentional?)

### Next Steps
1. Review the migration file
2. Run `npx prisma migrate dev` to apply
3. Update application code to use new column
```
