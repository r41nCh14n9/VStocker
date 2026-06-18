---
name: sd
description: "Use when: Designing system architecture, creating component models, generating design documentation, designing data models and database schemas, specifying APIs, or translating system analysis into technical design."
---

# System Design (SD) Skill

## Pre-execution: 自動載入指導文件

**執行任何任務前，依序完成以下步驟：**

1. 使用 `Glob` 工具搜尋以下指導文件（若存在則讀取）：
   - `docs/reference/guidelines/GUIDELINES-Architecture-Decisions-*.md`
   - `docs/reference/guidelines/GUIDELINES-Performance-Security-*.md`
   - `docs/reference/guidelines/GUIDELINES-Tech-Stack-*.md`

2. 使用 `Glob` 搜尋 SA 階段產出的需求文件（設計依據）：
   - `docs/analysis/requirements/*.md`

3. 對每個找到的文件，使用 `Read` 工具讀取其內容

4. 簡短告知用戶已載入的文件列表（若無文件則直接繼續）

5. **然後**執行用戶的系統設計請求：`$ARGUMENTS`

---

Transform system analysis into detailed technical architecture and design specifications.

## What This Skill Does

Creates technical design artifacts from system analysis including:
- System architecture and component diagrams
- Detailed component and module design specifications
- Data models and database schema design
- API contract and interface specifications
- Design pattern documentation and technology stack decisions
- Design rationale and architectural trade-off analysis

## How to Use

**In Copilot Chat:**
```
/sd [Your system analysis or requirements]

Examples:
- /sd Design the system architecture based on the analysis
- /sd Create component design and data models
- /sd Generate API specifications from requirements
- /sd Design the database schema and relationships
```

## Output

The skill generates:
- **System Architecture** - High-level architecture diagrams and documentation
- **Component Design** - Detailed component specifications and relationships
- **Data Models** - ER diagrams and database schema designs
- **API Specifications** - REST API contracts and interface definitions
- **Design Documentation** - Design rationale and pattern documentation
- **Technology Stack** - Technology choices and architectural decisions

**📁 Save to:** `docs/design/`
- Architecture designs: `docs/design/architecture/`
- Component specs: `docs/design/components/`
- API specs: `docs/design/apis/`
- Database schemas: `docs/design/database/`
- Diagrams: `docs/design/diagrams/`

**📖 Reference:** [Documentation Hub](../../../docs/INDEX.md)

## Related

- [SD Agent](./../agents/sd.agent.md)
- [Previous: SA Skill](../sa/)
- [Next: Test Skill](../test/)
