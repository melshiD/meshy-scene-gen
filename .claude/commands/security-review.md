# Security Review

Scan codebase for security vulnerabilities and risky patterns.

## Scope

Review code for OWASP Top 10 and common security issues:

1. **Injection** - SQL, command, LDAP injection
2. **Broken Authentication** - Weak auth, session issues
3. **Sensitive Data Exposure** - Hardcoded secrets, logging PII
4. **XXE** - XML external entity attacks
5. **Broken Access Control** - Missing auth checks
6. **Security Misconfiguration** - Debug mode, default creds
7. **XSS** - Cross-site scripting vectors
8. **Insecure Deserialization** - Untrusted data parsing
9. **Vulnerable Dependencies** - Known CVEs
10. **Insufficient Logging** - Missing audit trails

## Process

1. **Scan for Secrets**
   - Hardcoded API keys
   - Passwords in code
   - Private keys
   - Connection strings

2. **Review Authentication**
   - Password handling
   - Session management
   - Token validation

3. **Check Input Validation**
   - User input sanitization
   - SQL query construction
   - Command execution

4. **Review Access Control**
   - Authorization checks
   - Role validation
   - Resource ownership

5. **Check Dependencies**
   ```bash
   npm audit  # or: pip-audit, cargo audit
   ```

## Output Format

```
## Security Review Report

### Critical Issues 🔴
1. [Location] - [Issue] - [Fix]

### High Severity 🟠
1. [Location] - [Issue] - [Fix]

### Medium Severity 🟡
1. [Location] - [Issue] - [Fix]

### Low Severity 🟢
1. [Location] - [Issue] - [Fix]

### Dependency Vulnerabilities
- [package@version] - [CVE] - [Fix version]

### Recommendations
1. [Action item]
```

## Arguments

$ARGUMENTS can specify:
- Specific path: "src/auth"
- Specific concern: "authentication only"
- Depth: "quick" or "deep"

## Example Usage

```
/security-review
/security-review "src/api"
/security-review "deep scan"
```
