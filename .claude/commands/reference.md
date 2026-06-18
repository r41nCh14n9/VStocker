---
name: reference
description: "Skill for managing project guidelines, standards, templates, and reference materials. Maintains the single source of truth for technical standards."
---

# Reference Skill

## Pre-execution: 自動載入現有 Reference 材料

**執行任何任務前，依序完成以下步驟（避免重複建立已存在的材料）：**

1. 使用 `Glob` 搜尋現有的所有指導文件：
   - `docs/reference/guidelines/GUIDELINES-*.md`

2. 使用 `Glob` 搜尋現有的所有模板：
   - `docs/reference/templates/TEMPLATE-*.ts`
   - `docs/reference/templates/TEMPLATE-*.md`

3. 使用 `Glob` 搜尋現有的範例程式碼：
   - `docs/reference/examples/good/*`
   - `docs/reference/examples/anti-patterns/*`

4. 對每個找到的文件，使用 `Read` 工具讀取其內容

5. 簡短告知用戶當前已有哪些 reference 材料（版本、覆蓋範圍）

6. **然後**執行用戶的 reference 管理請求：`$ARGUMENTS`

---

## Overview

This skill provides the capability to create, update, and maintain reference materials that guide all other agents and team members. Reference materials ensure consistency across the project and provide clear guidelines for implementation.

## How to Use

### For Initial Setup:
```
/reference Create the initial tech stack guidelines for this project
/reference Establish coding standards and naming conventions
/reference Create component implementation templates
```

### For Updates:
```
/reference Update tech stack guidelines - we're upgrading to React 19
/reference Add new code example showing how to handle async errors
/reference Create architecture decision record for microservices migration
```

### For New Guidelines:
```
/reference Add performance optimization guidelines for database queries
/reference Create security best practices guide for API endpoints
/reference Establish code review process and guidelines
```

---

## What This Skill Produces

**📁 Output Location:** `docs/reference/`

### Guidelines (Mandatory Reference for All Teams)
- `docs/reference/guidelines/`
  - `GUIDELINES-Tech-Stack-v1.md` - Framework versions, dependencies, configurations
  - `GUIDELINES-Naming-Convention-v1.md` - Naming rules, file structure
  - `GUIDELINES-Coding-Standards-v1.md` - Code style, quality standards
  - `GUIDELINES-Development-Workflow-v1.md` - Git workflow, CI/CD process
  - `GUIDELINES-Performance-Security-v1.md` - Performance, security best practices
  - `GUIDELINES-Architecture-Decisions-v1.md` - ADRs (Architecture Decision Records)

### Templates (Reference for Code Generation)
- `docs/reference/templates/`
  - `TEMPLATE-Component.ts` - React/Vue component structure
  - `TEMPLATE-Service.ts` - Business logic service
  - `TEMPLATE-Unit-Test.spec.ts` - Unit test structure
  - `TEMPLATE-Integration-Test.spec.ts` - Integration test structure
  - `TEMPLATE-API-Endpoint.ts` - REST API endpoint
  - `TEMPLATE-README.md` - Documentation template
  - `TEMPLATE-Database-Migration.ts` - Database migration template

### Examples (Reference Implementations)
- `docs/reference/examples/good/`
  - `EXAMPLE-Component-User-Dashboard.ts`
  - `EXAMPLE-Service-Authentication.ts`
  - `EXAMPLE-Test-Integration-Payment.spec.ts`
  - `EXAMPLE-API-User-Endpoint.ts`
- `docs/reference/examples/anti-patterns/`
  - `ANTIPATTERN-Memory-Leak.ts`
  - `ANTIPATTERN-Poor-Error-Handling.ts`
  - `ANTIPATTERN-Security-Vulnerability.ts`

---

## Key Features

### 1. Version Control
Every guideline, template, and example is versioned (v1, v2, v3, etc.)
- Allows tracking of changes over time
- Previous versions kept as reference
- Clear history of why changes were made

### 2. Comprehensive Coverage
Materials should cover:
- ✅ Technology stack and versions
- ✅ Naming conventions (files, functions, variables)
- ✅ Coding standards and style guides
- ✅ Development workflow (Git, code review)
- ✅ Performance and security considerations
- ✅ Architecture decisions and rationale
- ✅ Reusable templates
- ✅ Good and bad implementation examples

### 3. Cross-Agent Integration
Reference materials are read by:
- 📖 **Plan Agent** → Understands project workflow and naming conventions
- 📖 **SA Agent** → Reviews tech stack and architecture guidelines
- 📖 **SD Agent** → References design standards and performance guidelines
- 📖 **Development Agent** → Must follow all guidelines, templates, examples
- 📖 **Test Agent** → Uses testing guidelines and test templates

---

## Best Practices

### Creating Guidelines
1. ✅ Be specific and actionable (don't say "write good code")
2. ✅ Provide reasoning (why this standard, not just what)
3. ✅ Include examples (good and bad)
4. ✅ Link to external resources if relevant
5. ✅ Make it enforceable (code can check it)

### Creating Templates
1. ✅ Start with real, working code
2. ✅ Include inline comments explaining each section
3. ✅ Show where to customize for specific use cases
4. ✅ Include imports, dependencies, and type definitions
5. ✅ Reference the guidelines the template follows

### Creating Examples
1. ✅ Show production-ready implementations
2. ✅ Include comments explaining the approach
3. ✅ Reference which guidelines were followed
4. ✅ Show how to integrate with other components
5. ✅ For anti-patterns: clearly explain why it's wrong

---

## Example Outputs

### Guidelines
```markdown
# Tech Stack Guidelines v1

## Frontend Framework
- **Framework**: React 18+
- **Version**: ^18.0.0
- **Why**: Component-based, large ecosystem, team expertise
- **Setup**: See TEMPLATE-Component.ts

## State Management
- **Library**: Redux Toolkit
- **Version**: ^1.9.0
- **Alternative**: Zustand (for smaller projects)
- **Usage**: See EXAMPLE-Component-User-Dashboard.ts

## Database
- **System**: PostgreSQL
- **Version**: ^14.0
- **ORM**: Prisma v4+
- **Migrations**: See TEMPLATE-Database-Migration.ts

## API Framework
- **Framework**: Express.js
- **Version**: ^4.18
- **See**: TEMPLATE-API-Endpoint.ts
```

### Templates
```typescript
// TEMPLATE-Component.ts
/**
 * @component ComponentName
 * @description Brief description of what this component does
 * @example
 * <ComponentName prop1={value1} prop2={value2} />
 */

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

interface ComponentNameProps {
  // Define props with JSDoc
  /** Description of prop1 */
  prop1: string;
  /** Optional callback */
  onChange?: (value: string) => void;
}

export const ComponentName: React.FC<ComponentNameProps> = ({
  prop1,
  onChange,
}) => {
  // Implementation here
  return <div>{/* JSX */}</div>;
};

export default ComponentName;
```

### Examples
```markdown
# EXAMPLE-Component-User-Dashboard.ts

Shows how to build a user dashboard following all guidelines.

✅ Uses TEMPLATE-Component.ts structure
✅ Follows GUIDELINES-Naming-Convention.md
✅ Implements error handling per GUIDELINES-Performance-Security.md
✅ Uses Redux Toolkit as per GUIDELINES-Tech-Stack.md

See the code for:
- Proper error handling
- Loading states
- Type safety
- Component composition
- Integration with services
```

---

## When to Update Reference Materials

### Update Tech Stack Guidelines When:
- Upgrading major framework versions
- Adding new library or tool to project
- Changing architecture approach

### Update Coding Standards When:
- Team agrees on new best practice
- ESLint/Prettier rules change
- New language features adopted

### Add Examples When:
- Solving complex problem that others will face
- Discovering anti-pattern developers keep making
- Implementing new pattern or approach

### Version All Changes
```
v1 → Initial version
v2 → React upgraded from 17 to 18 (YYYY-MM-DD)
v3 → Added TypeScript stricter mode (YYYY-MM-DD)
```

---

## Integration with Other Agents

```
Reference Agent (This Skill)
├─ Produces guidelines/templates/examples
│
└─ Consumed by:
   ├─ Plan Agent → planning guidelines, naming conventions
   ├─ SA Agent → tech stack, architecture guidelines
   ├─ SD Agent → design standards, performance/security
   ├─ Development Agent → all materials (mandatory)
   └─ Test Agent → testing guidelines, test templates
```

---

## Validation Checklist

Before finalizing reference materials:

- ✅ Document is versioned (v1, v2, etc.)
- ✅ Content is clear and actionable
- ✅ Includes examples (good and bad)
- ✅ Links to related materials
- ✅ Explains rationale behind recommendations
- ✅ No contradictions with other guidelines
- ✅ Relevant to all team members
- ✅ Enforceable (team can check compliance)
- ✅ Up-to-date with current tech stack
- ✅ Accessible location in docs/reference/

---

## Related Resources

- [Reference Agent](../../agents/reference.agent.md) - Agent definition
- [Development Agent](../../agents/dev.agent.md) - Uses these materials
- [Plan Agent](../../agents/plan.agent.md) - Uses guidelines
- [ARCHITECTURE.md](../../ARCHITECTURE.md) - System overview
- [Documentation Hub](../../../docs/INDEX.md) - Project structure

---

## 📖 Reference

**Output**: `docs/reference/`

**Sub-folders**:
- `guidelines/` - Technical and process guidelines
- `templates/` - Reusable code templates
- `examples/good/` - Good implementations
- `examples/anti-patterns/` - Mistakes to avoid

**Naming Format**: `[GUIDELINES|TEMPLATE|EXAMPLE|ANTIPATTERN]-[Subject]-v[#].md`

**All Materials Are**: Versioned, Linked, Actionable, and Team-Accessible
