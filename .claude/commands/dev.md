---
name: dev
description: "Skill for implementing features based on requirements and designs. Generates code that follows all project guidelines, uses established templates, and tracks implementation progress."
---

# Development Skill

## Pre-execution: 自動載入指導文件（不可跳過）

**執行任何任務前，依序完成以下步驟：**

1. 使用 `Glob` 搜尋所有指導文件：
   - `docs/reference/guidelines/GUIDELINES-*.md`

2. 使用 `Glob` 搜尋所有程式碼模板：
   - `docs/reference/templates/TEMPLATE-*.ts`
   - `docs/reference/templates/TEMPLATE-*.md`

3. 使用 `Glob` 搜尋範例程式碼（好的範例與反模式）：
   - `docs/reference/examples/good/*`
   - `docs/reference/examples/anti-patterns/*`

4. 使用 `Glob` 搜尋設計規格文件（SD 產出）：
   - `docs/design/**/*.md`

5. 使用 `Glob` 搜尋需求文件（SA 產出）：
   - `docs/analysis/requirements/*.md`

6. 對每個找到的文件，使用 `Read` 工具讀取其內容

7. 簡短告知用戶已載入的文件清單（若無文件則直接繼續）

8. **然後**執行用戶的開發請求：`$ARGUMENTS`

---

## Overview

This skill provides the capability to implement features and write code that adheres to all project standards. The development process follows a structured workflow that ensures code quality, traceability, and consistency with established guidelines.

## How to Use

### For Feature Implementation:
```
/dev Implement user authentication feature based on REQUIREMENTS and DESIGN docs
/dev Build payment processing service following tech stack guidelines
/dev Create REST API endpoint for user profile management
```

### For Bug Fixes:
```
/dev Fix memory leak in user dashboard component
/dev Resolve race condition in payment processor
```

### For Integration:
```
/dev Integrate new payment gateway with existing checkout flow
/dev Connect Redux store to user profile component
```

---

## Required Input

Development Agent MUST read these materials before generating code:

### 1. Reference Materials (Non-negotiable ⚠️)
```
docs/reference/guidelines/
├─ GUIDELINES-Tech-Stack-v*.md
├─ GUIDELINES-Naming-Convention-v*.md
├─ GUIDELINES-Coding-Standards-v*.md
├─ GUIDELINES-Development-Workflow-v*.md
├─ GUIDELINES-Performance-Security-v*.md
└─ (All other guidelines)

docs/reference/templates/
├─ TEMPLATE-Component.ts
├─ TEMPLATE-Service.ts
├─ TEMPLATE-Unit-Test.spec.ts
└─ (All applicable templates)

docs/reference/examples/
├─ examples/good/ (Reference implementations)
└─ examples/anti-patterns/ (What to avoid)
```

### 2. Design Specifications (Required)
```
docs/design/
├─ ARCHITECTURE-*.md (System architecture context)
├─ COMPONENTS-*.md (Component specifications)
├─ API-SPEC-*.md (API contracts)
└─ DATABASE-SCHEMA-*.md (Database structure)
```

### 3. Requirements (Required)
```
docs/analysis/requirements/
├─ REQUIREMENTS-Functional-*.md (What to build)
├─ REQUIREMENTS-NonFunctional-*.md (How it should perform)
└─ (System analysis if applicable)
```

### 4. Project Context (Optional)
```
docs/plans/active/
└─ (Project timeline and dependencies)
```

---

## Development Workflow

### Phase 1: Preparation
```
1. Read all reference materials
   ├─ Tech stack and versions available
   ├─ Naming conventions to follow
   ├─ Code standards and style guide
   └─ Templates to use as starting point

2. Review design specifications
   ├─ Understand architecture context
   ├─ Know component interfaces
   ├─ Understand data flow

3. Review requirements
   ├─ Know functional requirements
   ├─ Know non-functional requirements
   ├─ Understand acceptance criteria
```

### Phase 2: Planning
```
4. Create Implementation Plan
   └─ Output: IMPL-PLAN-[Feature]-v1.md
      ├─ Approach overview
      ├─ Implementation steps
      ├─ File structure
      ├─ Dependencies
      └─ Estimated effort

5. Identify Templates & Examples
   ├─ Which templates apply
   ├─ Which examples are relevant
   └─ Any guidelines that need attention
```

### Phase 3: Implementation
```
6. Write Code
   ├─ Follow all guidelines strictly
   ├─ Use templates as structure
   ├─ Reference examples for patterns
   ├─ Include documentation
   ├─ Handle errors properly
   └─ Track decisions: IMPL-DECISIONS-[Feature]-v1.md

7. Create Code Record
   └─ Output: CODE-[Component]-[Feature]-v1.md
      ├─ Code snippets/references
      ├─ Design decisions made
      ├─ Patterns used
      ├─ References to requirements
      └─ Integration points
```

### Phase 4: Self-Check & Documentation
```
8. Create Self-Check Materials
   └─ Output: SELF-CHECK-[Feature]-v1.md
      ├─ Developer's pre-review validation
      ├─ Code standards compliance check
      ├─ Test coverage verification
      └─ Documentation completeness check
      
   Note: Formal code review is done by Review Agent

9. Document Integration
   └─ Output: INTEGRATION-GUIDE-[Feature]-v1.md
      ├─ How to use new feature
      ├─ Integration examples
      ├─ Testing approach
      └─ Local dev setup
```

---

## What This Skill Produces

**📁 Output Location:** `docs/implementation/`

### Implementation Plans
```
docs/implementation/plans/
├─ IMPL-PLAN-[Feature]-v1.md (Overall approach)
├─ IMPL-PROGRESS-[Feature]-v1.md (Progress tracking)
└─ IMPL-DECISIONS-[Feature]-v1.md (Technical decisions)
```

### Code Implementation Records
```
docs/implementation/code-records/
├─ CODE-Component-[Feature]-v1.md (Component implementation record)
├─ CODE-Service-[Feature]-v1.md (Service implementation record)
└─ CODE-API-[Feature]-v1.md (API implementation record)
```

### Self-Check Materials
```
docs/implementation/review-guides/
└─ SELF-CHECK-[Feature]-v1.md (Developer's pre-review checklist)

Note: Formal code reviews are produced by Review Agent:
  docs/review/
  ├─ code-reviews/
  ├─ design-reviews/
  └─ requirements-reviews/
```

### Integration Guides
```
docs/implementation/integration-guides/
├─ INTEGRATION-GUIDE-[Feature]-v1.md
├─ SETUP-LOCAL-DEV-[Feature]-v1.md
└─ DEPLOYMENT-NOTES-[Feature]-v1.md
```

---

## Quality Standards

### Code Must:
- ✅ Follow GUIDELINES-Naming-Convention-v*.md exactly
- ✅ Follow GUIDELINES-Coding-Standards-v*.md exactly
- ✅ Use tech stack versions from GUIDELINES-Tech-Stack-v*.md
- ✅ Implement security practices from GUIDELINES-Performance-Security-v*.md
- ✅ Follow component structure from TEMPLATE-Component.ts (or relevant template)
- ✅ Include proper error handling
- ✅ Include inline documentation and comments
- ✅ Include unit tests using TEMPLATE-Unit-Test.spec.ts
- ✅ Be traceable back to requirements

### Documentation Must:
- ✅ Include implementation plan
- ✅ Include self-check checklist (for developer validation)
- ✅ Include integration guide
- ✅ Link to requirements and design
- ✅ Explain any deviations from standards (with justification)
- ✅ Be versioned (v1, v2, etc.)
- ✅ Be ready for Review Agent audit (formal code review)

---

## Example Outputs

### IMPL-PLAN-User-Authentication-v1.md
```markdown
# Implementation Plan: User Authentication v1

## Overview
Implement JWT-based user authentication following REQUIREMENTS-Functional-v1.md

## Approach
1. Create authentication service using TEMPLATE-Service.ts
2. Create login component using TEMPLATE-Component.ts
3. Set up JWT token management
4. Integrate with Redux store
5. Add unit tests using TEMPLATE-Unit-Test.spec.ts

## File Structure
```
src/
├─ services/
│  └─ authService.ts
├─ components/
│  └─ LoginComponent.tsx
├─ store/
│  └─ authSlice.ts
└─ tests/
   └─ authService.spec.ts
```

## Guidelines Followed
- Tech Stack: See GUIDELINES-Tech-Stack-v1.md
- Naming: See GUIDELINES-Naming-Convention-v1.md
- Code Standards: See GUIDELINES-Coding-Standards-v1.md
- Security: See GUIDELINES-Performance-Security-v1.md

## Dependencies
- jsonwebtoken (JWT generation)
- bcrypt (password hashing)
- Redux Toolkit (state management)

## Estimated Effort
- Planning: 1 hour
- Implementation: 4 hours
- Testing: 2 hours
- Documentation: 1 hour
```

### SELF-CHECK-User-Authentication-v1.md
```markdown
# Self-Check: User Authentication v1

Developer's pre-review validation before submitting for formal review.

## Code Standards Compliance
- [ ] All function names follow camelCase convention
- [ ] All variable names follow camelCase convention
- [ ] All file names follow kebab-case convention
- [ ] No hardcoded values (use env variables)
- [ ] Proper error handling in all try-catch blocks
- [ ] Meaningful error messages for debugging
- [ ] All public functions have JSDoc comments
- [ ] Complex logic has inline comments

## Security Practices
- [ ] Passwords hashed using bcrypt
- [ ] Tokens don't contain sensitive data
- [ ] API endpoints require authentication
- [ ] Input validation on all endpoints
- [ ] CORS configured correctly
- [ ] No secrets in code or logs

## Testing Coverage
- [ ] Unit tests for authService functions
- [ ] Component render tests
- [ ] Error scenario tests
- [ ] Mock external dependencies
- [ ] Test coverage > 80%
- [ ] All tests passing

## Template Adherence
- [ ] Service follows TEMPLATE-Service.ts structure
- [ ] Component follows TEMPLATE-Component.ts structure
- [ ] Tests follow TEMPLATE-Unit-Test.spec.ts pattern

## Integration Points
- [ ] Redux store integration correct
- [ ] API endpoint contracts match design
- [ ] Database migrations ready
- [ ] Backward compatibility maintained

## Documentation
- [ ] README updated with setup instructions
- [ ] Integration points documented
- [ ] Config variables documented
- [ ] Known limitations listed

## Ready for Review?
- [ ] All checks passed
- [ ] Code follows guidelines
- [ ] Tests passing
- [ ] Documentation complete

**Note:** This self-check is for developer validation. Formal code review 
will be conducted by Review Agent and saved in docs/review/code-reviews/.
```

---

## Integration with Reference Materials

### Code Generation Process:
```
Reference Materials (Truth Source)
    ├─ Tech Stack Guidelines
    │  ├─ React 18, TypeScript, Redux
    │  └─ PostgreSQL with Prisma ORM
    │
    ├─ Code Templates
    │  ├─ Component structure
    │  ├─ Service structure
    │  └─ Test structure
    │
    └─ Examples
       ├─ Good: Component with hooks
       └─ Anti-pattern: Direct DOM access
              ↓
Development Agent Follows These
              ↓
         Generates Code
              ↓
    Matches Guidelines Exactly
```

---

## Pre-Review Validation Checklist

Before submitting implementation for formal Review Agent audit:

- ✅ Code follows EVERY guideline (self-validated)
- ✅ Uses established templates as base structure
- ✅ References good examples for patterns
- ✅ Avoids identified anti-patterns
- ✅ Includes comprehensive documentation
- ✅ Traceable back to requirements
- ✅ Test coverage adequate (target: 80%+)
- ✅ Self-check checklist completed
- ✅ Integration guide provided
- ✅ Implementation record complete
- ✅ Ready to pass to Review Agent for formal audit

**Next Step:** Review Agent will conduct formal code, design, and requirements reviews and produce:
- `docs/review/code-reviews/CODE-REVIEW-*.md`
- `docs/review/design-reviews/DESIGN-REVIEW-*.md`
- `docs/review/requirements-reviews/REQUIREMENTS-REVIEW-*.md`

---

## When Deviations Occur

If code cannot follow a guideline:
1. Document the deviation
2. Explain why (technical constraint, requirement conflict, etc.)
3. Get approval before implementation
4. Record decision in IMPL-DECISIONS-[Feature]-v1.md
5. Update guideline if it's truly limiting

Example:
```markdown
## Deviation: Promise instead of async/await

Per GUIDELINES-Coding-Standards-v1.md, we prefer async/await.
However, this library requires callback-based promises.

Decision: Use promises for this service only.
Link: See authService.ts for details.
```

---

## Workflow Integration

```
User provides requirement
    ↓
/dev Implement [Feature] based on requirements
    ↓
Development Agent
    ├─ Reads all reference materials
    ├─ Reads requirements and design
    ├─ Creates implementation plan
    ├─ Writes code following standards
    ├─ Creates code record
    ├─ Creates self-check checklist
    └─ Produces integration guide
        ↓
/review Code review the implementation
    ↓
Review Agent
    ├─ CODE-REVIEW-*.md (code quality audit)
    ├─ DESIGN-REVIEW-*.md (architecture audit)
    └─ REQUIREMENTS-REVIEW-*.md (coverage audit)
        ↓
Issues found?
├─ Yes → Development Agent (v2)
│        └─ Fixes issues, resubmits
│           ↓ Review Agent re-audits
│           └─ (repeat until approved)
│
└─ No → /test Create test cases
        ↓
        Test Agent
        └─ Execute tests
            ↓
Tests pass, code ready for merge
```

---

## Related Resources

- [Development Agent](../../agents/dev.agent.md) - Agent definition
- [Reference Agent](../../agents/reference.agent.md) - Manages guidelines/templates
- [Reference Skill](./reference/SKILL.md) - How to maintain guidelines
- [Review Agent](../../agents/review.agent.md) - Conducts code/design reviews
- [Review Skill](../review/SKILL.md) - How to review implementations
- [System Design Agent](../../agents/sd.agent.md) - Creates design specs
- [Test Agent](../../agents/test.agent.md) - Creates test cases
- [ARCHITECTURE.md](../../ARCHITECTURE.md) - System overview

---

## 📖 Reference

**Input**: 
- `docs/reference/` (guidelines, templates, examples)
- `docs/design/` (architecture, component specs)
- `docs/analysis/requirements/` (requirements)
- `docs/plans/active/` (project context)

**Output**: `docs/implementation/`

**Sub-folders**:
- `plans/` - Implementation planning
- `code-records/` - Code implementation records
- `review-guides/` - Review and QA materials
- `integration-guides/` - Integration and setup guides

**All Outputs Are**: Versioned, Linked, Traceable, and Quality-Assured
