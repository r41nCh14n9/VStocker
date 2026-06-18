---
name: review
description: "Skill for reviewing code quality, design compliance, and requirements implementation. Conducts static analysis and generates comprehensive review reports."
---

# Review Skill

## Pre-execution: 自動載入指導文件（不可跳過）

**執行任何任務前，依序完成以下步驟：**

1. 使用 `Glob` 搜尋所有指導文件（review 的評分標準）：
   - `docs/reference/guidelines/GUIDELINES-*.md`

2. 使用 `Glob` 搜尋範例程式碼（好的範例與反模式）：
   - `docs/reference/examples/good/*`
   - `docs/reference/examples/anti-patterns/*`

3. 使用 `Glob` 搜尋開發實作記錄（dev 產出，作為 review 對象）：
   - `docs/implementation/code-records/*.md`

4. 對每個找到的文件，使用 `Read` 工具讀取其內容

5. 簡短告知用戶已載入的文件清單（若無文件則直接繼續）

6. **然後**執行用戶的 review 請求：`$ARGUMENTS`

---

## Overview

This skill provides the capability to conduct comprehensive reviews of code, design, and requirements to ensure quality, compliance, and completeness. The review process is systematic and standards-based.

## How to Use

### For Code Reviews:
```
/review Code review the payment module implementation
/review Check if UserAuthentication component follows standards
/review Audit the database migration service for best practices
```

### For Design Reviews:
```
/review Design review the API endpoint architecture
/review Validate the payment service design against requirements
/review Check system integration points
```

### For Requirements Reviews:
```
/review Requirements review the user authentication feature
/review Verify all functional requirements are implemented
/review Check if non-functional requirements are met
```

---

## Required Input

Review Agent MUST read these materials before generating reviews:

### 1. Reference Materials (Mandatory ⚠️)
```
docs/reference/guidelines/
├─ GUIDELINES-Coding-Standards-v*.md (For code review)
├─ GUIDELINES-Naming-Convention-v*.md (For naming review)
├─ GUIDELINES-Performance-Security-v*.md (For quality review)
├─ GUIDELINES-Architecture-Decisions-v*.md (For design review)
├─ GUIDELINES-Tech-Stack-v*.md (For tech compliance)
└─ GUIDELINES-Development-Workflow-v*.md (For process review)

docs/reference/templates/
├─ (Reference templates for expected code structure)

docs/reference/examples/
├─ examples/good/ (Reference implementations)
└─ examples/anti-patterns/ (What to avoid)
```

### 2. Implementation Materials (For Code Review)
```
docs/implementation/
├─ code-records/ (CODE-[Component]-[Feature]-v*.md)
├─ plans/ (IMPL-PLAN-[Feature]-v*.md)
└─ review-guides/ (Self-generated checklists)
```

### 3. Design Materials (For Design Review)
```
docs/design/
├─ architecture/ (ARCHITECTURE-*.md)
├─ components/ (COMPONENTS-*.md)
├─ apis/ (API-SPEC-*.md)
├─ database/ (DATABASE-SCHEMA-*.md)
└─ diagrams/ (Architecture diagrams)
```

### 4. Requirements Materials (For Requirements Review)
```
docs/analysis/requirements/
├─ REQUIREMENTS-Functional-*.md (Functional requirements)
└─ REQUIREMENTS-NonFunctional-*.md (Non-functional requirements)
```

---

## Review Workflow

### Phase 1: Preparation & Context Gathering
```
1. Identify Review Type
   ├─ Code Review (check implementation records)
   ├─ Design Review (check design specs)
   └─ Requirements Review (check coverage and traceability)

2. Read All Relevant Guidelines
   ├─ Coding standards (if code review)
   ├─ Architecture standards (if design review)
   ├─ Requirements structure (if requirements review)
   └─ Security and performance guidelines

3. Read Reference Examples
   ├─ Good implementations (what to look for)
   └─ Anti-patterns (what to avoid)

4. Gather Review Materials
   ├─ Implementation records / Design specs / Requirements docs
   └─ Understand context and scope
```

### Phase 2: Review Analysis
```
5. Conduct Review
   ├─ For Code: Check each line against standards
   │  ├─ Naming conventions
   │  ├─ Error handling
   │  ├─ Documentation
   │  ├─ Performance
   │  └─ Security
   │
   ├─ For Design: Validate architecture
   │  ├─ Pattern compliance
   │  ├─ Scalability
   │  ├─ Security
   │  ├─ Integration
   │  └─ Performance
   │
   └─ For Requirements: Create traceability
      ├─ Functional requirements mapping
      ├─ Non-functional requirements verification
      ├─ Gap identification
      └─ Implementation status tracking

6. Identify Issues
   ├─ Critical (must fix)
   ├─ Major (should fix)
   └─ Minor (nice to have)

7. Document Findings
   ├─ What was found
   ├─ Why it's an issue
   ├─ How to fix it
   └─ Reference to guidelines
```

### Phase 3: Report Generation
```
8. Create Review Report
   ├─ Summary section
   ├─ Detailed findings
   ├─ Recommendations
   ├─ Action items
   └─ Standards compliance score

9. Generate Actionable Output
   └─ CODE-REVIEW-*.md OR
   └─ DESIGN-REVIEW-*.md OR
   └─ REQUIREMENTS-REVIEW-*.md
```

---

## What This Skill Produces

**📁 Output Location:** `docs/review/`

### Code Review Reports
```
docs/review/code-reviews/
├─ CODE-REVIEW-[Component]-[Feature]-v1.md
├─ CODE-REVIEW-[Component]-[Feature]-v2.md (after improvements)
└─ (One report per reviewed component/feature)

Contains:
├─ Standards Compliance Score (0-100%)
├─ Strengths (what's done well)
├─ Issues Found
│  ├─ Critical issues
│  ├─ Major issues
│  └─ Minor suggestions
├─ References to Guidelines
└─ Action Items for Developer
```

### Design Review Reports
```
docs/review/design-reviews/
├─ DESIGN-REVIEW-[Module]-v1.md
├─ DESIGN-REVIEW-[Module]-v2.md (after iterations)
└─ (One report per reviewed design element)

Contains:
├─ Architecture Compliance Assessment
├─ Pattern Verification Results
├─ Performance Analysis
├─ Security Review
├─ Integration Point Analysis
├─ Issues and Risks
└─ Recommendations
```

### Requirements Review Reports
```
docs/review/requirements-reviews/
├─ REQUIREMENTS-REVIEW-[Feature]-v1.md
├─ REQUIREMENTS-REVIEW-[Feature]-v2.md
└─ (One report per reviewed feature)

Contains:
├─ Functional Requirements Traceability
├─ Non-Functional Requirements Verification
├─ Implementation Status Matrix
├─ Gaps and Missing Items
└─ Coverage Summary
```

---

## Review Quality Standards

### Code Review Must:
- ✅ Check EVERY coding standard requirement
- ✅ Reference specific guidelines
- ✅ Compare against template structure
- ✅ Identify all issues (critical, major, minor)
- ✅ Suggest concrete improvements
- ✅ Reference good examples for patterns
- ✅ Flag anti-patterns
- ✅ Provide actionable feedback
- ✅ Track issues in action items
- ✅ Calculate compliance score

### Design Review Must:
- ✅ Verify architecture pattern compliance
- ✅ Check design principles adherence
- ✅ Assess performance implications
- ✅ Evaluate security approach
- ✅ Validate scalability design
- ✅ Review integration points
- ✅ Identify risks and issues
- ✅ Provide architectural guidance
- ✅ Reference guidelines and principles
- ✅ Suggest improvements

### Requirements Review Must:
- ✅ Create traceability matrix
- ✅ Map each requirement to implementation
- ✅ Check functional requirements coverage
- ✅ Verify non-functional requirements
- ✅ Identify gaps and missing items
- ✅ Document implementation status
- ✅ Flag risks and concerns
- ✅ Verify acceptance criteria
- ✅ Check test coverage
- ✅ Report coverage percentage

---

## Example Outputs

### CODE-REVIEW-User-Authentication-v1.md
```markdown
# Code Review: User Authentication v1

## Summary
- **Component**: UserAuthenticationService
- **Reviewed Date**: 2026-05-06
- **Standards Compliance Score**: 85%

## Strengths ✅
- Proper error handling with try-catch blocks
- Clear function names following naming convention
- Comprehensive inline documentation
- Security practices applied (password hashing)

## Issues Found ⚠️

### Critical
- [ ] Missing input validation for email parameter
  - **Why**: Security vulnerability, potential injection attack
  - **Reference**: GUIDELINES-Performance-Security-v1.md (Input Validation section)
  - **Fix**: Add email format validation before processing

### Major
- [ ] Inconsistent variable naming in login function
  - **Why**: Violates GUIDELINES-Naming-Convention-v1.md
  - **Reference**: GUIDELINES-Naming-Convention-v1.md (camelCase for functions)
  - **Fix**: Rename `user_token` to `userToken`

- [ ] Missing error logging
  - **Why**: Makes debugging difficult
  - **Reference**: GUIDELINES-Coding-Standards-v1.md (Error Handling section)
  - **Fix**: Add logger.error() calls in catch blocks

### Minor
- [ ] Some functions lack JSDoc comments
  - **Suggestion**: Add JSDoc for `validatePassword()` function
  - **Reference**: See EXAMPLE-Service.ts in examples/good/

## References to Guidelines
- GUIDELINES-Coding-Standards-v1.md (Error Handling, Comments)
- GUIDELINES-Naming-Convention-v1.md (Function naming)
- GUIDELINES-Performance-Security-v1.md (Security practices)

## Action Items for Developer
- [ ] Add input validation for email
- [ ] Rename variables to match convention
- [ ] Add error logging throughout
- [ ] Add missing JSDoc comments
- [ ] Re-request review after fixes

## Recommendations
1. Run linter to catch naming issues automatically
2. Add pre-commit hook to validate code style
3. Refer to EXAMPLE-Service.ts for code pattern reference
```

### DESIGN-REVIEW-Payment-Service-v1.md
```markdown
# Design Review: Payment Service v1

## Summary
- **Module**: Payment Processing Service
- **Reviewed Date**: 2026-05-06
- **Architecture Compliance**: 90%

## Architecture Compliance ✅
- ✅ Follows microservice pattern
- ✅ Clear separation of concerns
- ✅ Proper dependency injection
- ✅ Event-driven architecture for notifications

## Issues & Recommendations ⚠️

### Major Concerns
1. **Missing Fallback Strategy**
   - Issue: No fallback if payment gateway is unavailable
   - Reference: GUIDELINES-Performance-Security-v1.md (Resilience)
   - Recommendation: Implement circuit breaker pattern

2. **Scalability Risk**
   - Issue: Single database connection pool
   - Reference: GUIDELINES-Architecture-Decisions-v1.md (Scalability)
   - Recommendation: Implement connection pooling

## Performance Considerations
- ✅ Response time targets are met (< 500ms)
- ⚠️ Consider caching for frequent queries
- ✅ Async processing for notifications

## Security Review
- ✅ Encryption for sensitive data
- ✅ Rate limiting implemented
- ✅ Input validation in place
- ⚠️ Add audit logging for all transactions

## Integration Points
- ✅ Clear API contracts defined
- ✅ Dependency injection properly configured
- ⚠️ Document timeout settings for external APIs

## Recommendations
1. Implement circuit breaker for payment gateway
2. Add connection pooling strategy
3. Enhance audit logging
4. Document all timeout and retry settings
```

### REQUIREMENTS-REVIEW-User-Authentication-v1.md
```markdown
# Requirements Review: User Authentication v1

## Summary
- **Feature**: User Authentication Module
- **Reviewed Date**: 2026-05-06
- **Requirements Coverage**: 95%

## Functional Requirements Traceability

| Requirement | Status | Implementation | Notes |
|---|---|---|---|
| REQ-001: User Login | ✅ Complete | UserAuthService.login() | Email + password |
| REQ-002: Password Reset | ✅ Complete | PasswordReset handler | Email verification |
| REQ-003: Two-Factor Auth | ⚠️ Partial | SMS service integrated | TOTP not implemented |
| REQ-004: Session Management | ✅ Complete | SessionStore | JWT tokens |
| REQ-005: Logout | ✅ Complete | SessionStore.logout() | Token invalidation |

## Non-Functional Requirements

| Requirement | Status | Verification |
|---|---|---|
| Performance: < 500ms response | ✅ Met | Load tested |
| Security: Password hashing | ✅ Met | bcrypt algorithm |
| Scalability: 10k users | ⚠️ Partial | Database indexing needed |
| Availability: 99.9% uptime | ✅ Target | Monitoring in place |

## Gaps & Missing Items
1. ⚠️ REQ-003: TOTP implementation missing
   - Expected: Authenticator app support
   - Current: SMS only
   - Risk: Incomplete 2FA implementation

2. ⚠️ Non-functional: Database scaling
   - Expected: Support 10k concurrent users
   - Current: Single database instance
   - Recommendation: Add read replicas and indexing

## Implementation Status Matrix

```
✅ 12 requirements fully implemented
⚠️  2 requirements partially implemented
❌  0 requirements missing
─────────────────────────────────
   14 total requirements
   92% coverage
```

## Coverage Summary
- **Functional Coverage**: 95% (12/13 features)
- **Non-Functional Coverage**: 75% (3/4 requirements)
- **Overall Coverage**: 92%

## Risks & Concerns
1. TOTP feature incomplete
2. Database scalability needs validation
3. Error handling for edge cases needs verification

## Recommendations
1. Complete TOTP implementation for full 2FA support
2. Add database read replicas for scalability
3. Add edge case testing for session handling
```

---

## Review Metrics & Scoring

### Standards Compliance Score
```
Score = (# Guidelines Met / Total Guidelines) × 100

Example:
- Naming conventions: 9/10 ✓
- Error handling: 8/10 ✓
- Documentation: 10/10 ✓
- Performance: 7/10 ✓
- Security: 9/10 ✓
─────────────────────────────
Total: 43/50 = 86% compliance score
```

### Issue Classification
```
Critical
├─ Security vulnerabilities
├─ Memory leaks or data corruption
└─ Must fix before production

Major
├─ Deviations from standards
├─ Performance issues
└─ Should fix before merging

Minor
├─ Code style suggestions
├─ Documentation improvements
└─ Nice to have
```

---

## Integration with Development Flow

```
Development Agent
    ↓ generates code & implementation records
    ↓
Review Agent
    ├─ CODE-REVIEW-*.md (issues found)
    ├─ DESIGN-REVIEW-*.md (design issues)
    └─ REQUIREMENTS-REVIEW-*.md (coverage gaps)
    ↓
Issues found?
├─ Yes → Development Agent makes fixes (v2)
│        ↓ Review Agent audits again
│        └─ Approval or repeat
│
└─ No → Test Agent proceeds with testing
        ↓ Execute test plans
        ↓ Validate implementation
```

---

## Validation Checklist

Before delivering review reports:

- ✅ All guidelines have been read and understood
- ✅ Every issue is referenced to a specific guideline
- ✅ Recommendations are actionable and concrete
- ✅ Examples from docs/reference/examples/ provided where applicable
- ✅ Anti-patterns identified and explained
- ✅ Compliance score accurately reflects findings
- ✅ Issues are properly classified (Critical/Major/Minor)
- ✅ Report is well-structured and easy to read
- ✅ Action items are clear and assignable
- ✅ Report is traceable to inputs (implementation/design/requirements)

---

## Related Resources

- [Review Agent](../../agents/review.agent.md) - Agent definition
- [Development Agent](../../agents/dev.agent.md) - Generates implementation records
- [SD Agent](../../agents/sd.agent.md) - Creates design specs
- [Test Agent](../../agents/test.agent.md) - Executes tests
- [Reference Agent](../../agents/reference.agent.md) - Manages guidelines
- [ARCHITECTURE.md](../../ARCHITECTURE.md) - System overview

---

## 📖 Reference

**Input**: 
- `docs/implementation/` (from Development Agent)
- `docs/design/` (from SD Agent)
- `docs/analysis/requirements/` (from SA Agent)
- `docs/reference/` (guidelines and examples)

**Output**: `docs/review/`

**Sub-folders**:
- `code-reviews/` - Code quality reviews
- `design-reviews/` - Architecture and design reviews
- `requirements-reviews/` - Requirements coverage reviews

**All Outputs Are**: Versioned, Detailed, Actionable, and Standards-Based
