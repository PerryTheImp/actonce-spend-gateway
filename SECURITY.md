# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | Yes       |

## Reporting a Vulnerability

If you discover a security issue in ActOnce Spend Gateway, please report it privately:

- Email: **security@actonceapi.com**
- Do not open a public issue for security bugs

We will respond within 48 hours with next steps.

## What we consider in scope

- Policy bypass vulnerabilities
- Dedupe evasion
- Approval queue tampering
- Log tampering or injection
- Credential exposure (gateway never handles credentials, but if this changes, it is critical)

## What is NOT a vulnerability

- Policy misconfiguration by the user
- Weak policy rules (the user controls the policy)
- Social engineering against the approval system
- Compromise of the host machine (defend at OS level)

## Disclosure timeline

1. You report privately
2. We confirm receipt within 48 hours
3. We investigate and prepare a fix
4. We release the fix and credit you (with your permission)