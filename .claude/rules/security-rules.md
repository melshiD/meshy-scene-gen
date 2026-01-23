# Security Rules

## NEVER Do

- ❌ Hardcode secrets, API keys, passwords
- ❌ Use `eval()`, `Function()`, or dynamic code execution
- ❌ Trust user input without validation
- ❌ Log sensitive data (passwords, tokens, PII)
- ❌ Use `innerHTML` with user content
- ❌ Disable SSL verification
- ❌ Store passwords in plain text

## ALWAYS Do

- ✅ Validate and sanitize all user input
- ✅ Use parameterized queries (no string concatenation for SQL)
- ✅ Escape HTML output
- ✅ Use HTTPS for all external requests
- ✅ Implement rate limiting on public endpoints
- ✅ Use secure session management
- ✅ Hash passwords with bcrypt/argon2

## Input Validation

```javascript
// Bad
const userId = req.params.id;
db.query(`SELECT * FROM users WHERE id = ${userId}`);

// Good
const userId = parseInt(req.params.id, 10);
if (isNaN(userId)) throw new ValidationError('Invalid user ID');
db.query('SELECT * FROM users WHERE id = ?', [userId]);
```

## Authentication & Authorization

- Verify authentication on every protected route
- Check authorization for every resource access
- Use short-lived tokens
- Implement proper logout (invalidate tokens)

## Sensitive Data

- Use environment variables for secrets
- Never commit `.env` files
- Encrypt sensitive data at rest
- Mask sensitive data in logs

## Dependencies

- Keep dependencies updated
- Run `npm audit` / `pip-audit` regularly
- Review new dependencies before adding
- Remove unused dependencies
