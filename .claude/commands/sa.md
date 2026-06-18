---
name: sa
description: "Use when: Analyzing requirements, creating requirement-code mapping documents, documenting non-functional requirements, decomposing requirements into system analysis artifacts, or reverse-engineering existing systems."
---

# System Analysis (SA) Skill

## Pre-execution: 自動載入指導文件

**執行任何任務前，依序完成以下步驟：**

1. 使用 `Glob` 工具搜尋以下指導文件（若存在則讀取）：
   - `docs/reference/guidelines/GUIDELINES-Tech-Stack-*.md`
   - `docs/reference/guidelines/GUIDELINES-Architecture-Decisions-*.md`

2. 使用 `Glob` 搜尋現有進行中的計畫（了解範疇脈絡）：
   - `docs/plans/active/*.md`

3. 對每個找到的文件，使用 `Read` 工具讀取其內容

4. 簡短告知用戶已載入的文件列表（若無文件則直接繼續）

5. **然後**執行用戶的需求分析請求：`$ARGUMENTS`

---

Transform requirements and project plans into comprehensive system analysis documentation.

## What This Skill Does

Analyzes requirements and generates system analysis artifacts including:
- Detailed requirement analysis and decomposition
- Requirement-to-code mapping documents
- Non-functional requirements (NFR) specification
- System analysis decomposition documents
- Reverse engineering analysis for existing systems
- Traceability matrices and impact analysis

## How to Use

**In Copilot Chat:**
```
/sa [Your requirements or analysis scope]

Examples:
- /sa Analyze these requirements and create a requirement-code mapping
- /sa Document non-functional requirements for the system
- /sa Reverse-engineer the existing authentication system
- /sa Decompose the module requirements into analysis artifacts
```

## Structured Documentation Workflow (Doc-Coauthoring)

This skill integrates **Anthropic's official doc-coauthoring workflow** for systematic requirements documentation. The workflow has three stages:

### Stage 1: Context Gathering
- **Purpose**: Capture all relevant context about the requirements
- **Process**: 
  1. Answer initial metadata questions (doc type, audience, desired impact)
  2. Dump all available context about requirements
  3. Answer clarifying questions to close knowledge gaps
- **Output**: Complete context for authoring

### Stage 2: Refinement & Structure
- **Purpose**: Build requirements document section by section
- **Process** (for each section):
  1. Clarifying questions about what to include
  2. Brainstorm 5-20 relevant points
  3. Curate and select which points to keep
  4. Gap check for missing items
  5. Draft the section
  6. Iterative refinement with surgical edits
- **Output**: Well-structured requirements document (Markdown or Word)

### Stage 3: Reader Testing
- **Purpose**: Verify the document works for actual readers
- **Process**:
  1. Predict what readers will ask
  2. Test with fresh context to catch blind spots
  3. Run additional consistency/clarity checks
  4. Iterate on problematic sections
- **Output**: Reader-tested requirements document ready for stakeholder review

### When to Use This Workflow
- Creating complex requirements documents for business teams
- Writing requirement confirmation documents (需求確認書)
- Drafting non-functional requirement specifications
- Preparing documents for stakeholder review and approval

---

## Word Document Generation (DOCX Skill)

For professional Word document delivery to business teams, this skill integrates **Anthropic's official docx skill** for creating polished .docx files with:
- Professional formatting (headers, footers, styles)
- Tables and structured layouts
- Table of Contents with hyperlinks
- Tracked changes and comments
- Images and media

### Quick Start: Generate Requirements Confirmation Document

**Install Node.js dependency (one-time):**
```bash
npm install -g docx
```

**Create a Word requirements document:**

1. **Use the doc-coauthoring workflow** to prepare Markdown content
2. **Convert to Word** using Node.js with the docx library:

```javascript
// Create a generic requirements confirmation document
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');
const fs = require('fs');

const doc = new Document({
  sections: [{
    children: [
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Requirements Confirmation Document")] }),
      new Paragraph({ children: [new TextRun("Project: [Project Name] - [Date]")] }),
      new Paragraph({ children: [new TextRun("")] }),
      new Paragraph({ children: [new TextRun("Document your requirements and confirmation details...")] }),
      // Add more sections here
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("Requirements_Confirmation.docx", buffer);
  console.log("✅ Document created");
});
```

**Run to generate:**
```bash
node requirements.js
```

### Document Structure Tips

**Best Practices for Requirements Confirmation:**
- **Header**: Project name, date, version, author
- **Table of Contents**: Auto-generated from Heading 1/2/3
- **Executive Summary**: 1-2 page overview
- **Functional Requirements**: Detailed specifications table
- **Non-Functional Requirements**: Performance, security, scalability
- **Assumptions & Constraints**: Business and technical context
- **Sign-off Section**: For stakeholder approval

### Helper Scripts

**Unpack existing .docx for editing:**
```bash
# Requires: python scripts available in .github/skills/sa/scripts/
python scripts/office/unpack.py document.docx unpacked/
# Edit XML in unpacked/word/
python scripts/office/pack.py unpacked/ output.docx
```

**Add tracked changes comments:**
```bash
python scripts/comment.py unpacked/ 0 "Comment text"
```

---

## Output

The skill generates:
- **需求代碼對照表.md** - Requirement-code mapping documentation
- **non-functional-requirement-analysis.md** - NFR specifications
- System analysis decomposition documents
- Requirement traceability matrices
- Reverse engineering analysis reports
- Impact analysis for requirement changes
- **需求確認文件.docx** - Professional Word requirements document
- **需求確認書.docx** - Formal requirements confirmation letter

**📁 Save to:** `docs/analysis/`

*Always produce:*
- Requirements analysis: `docs/analysis/requirements/`
- NFR analysis: `docs/analysis/requirements/`

*Produce when applicable:*
- System analysis: `docs/analysis/system-analysis/`
- Use for:
  - Existing system architecture documentation (integration scenarios)
  - Current system reference during development (greenfield projects)
  - Reverse engineering analysis (legacy system migration)
  - Architecture decision records (future reference and updates)

**📖 Reference:** [Documentation Hub](../../../docs/INDEX.md)

---

## README Template

A generic, project-agnostic README template suitable for any software project.

**📄 Template:** [README-TEMPLATE.md](./assets/README-TEMPLATE.md)

### Quick Reference

The template includes optional and required sections:

| Section | Required | Purpose |
|---------|----------|---------|
| 徽章與統計 | ❌ | Project statistics and badges |
| 專案描述 | ✅ | Project purpose and value |
| 功能清單 | ✅ | Feature overview |
| 畫面展示 | ❌ | Screenshots (important for UI projects) |
| 快速開始 | ✅ | Installation and execution steps |
| 環境變數說明 | ❌ | Configuration reference |
| 文件結構 | ❌ | Directory organization |
| 技術棧 | ✅ | Technologies and versions |
| 開發指南 | ❌ | Development workflow |
| CI/CD 說明 | ❌ | Automation explanation |
| 常見問題 | ❌ | FAQ and troubleshooting |
| 聯絡方式 | ❌ | Team contact information |
| 授權 | ✅ | License information |

### Usage Tips

- **Customize for your project**: Adapt sections based on your actual needs
- **Keep it concise**: Use lists, tables, and code examples instead of long paragraphs
- **Provide real values**: Use actual port numbers, file names, and commands
- **Update regularly**: Keep documentation in sync with codebase
- **Use placeholders**: All `[xxx]` elements should be replaced with project-specific values

### When to Create a Custom README

1. **Before development starts**: Create early to clarify project scope
2. **During development**: Update as features are implemented
3. **After major releases**: Ensure documentation reflects current state
4. **When onboarding**: Verify README helps new contributors get started

## Resources

- **Doc-Coauthoring Workflow**: [Anthropic doc-coauthoring skill](https://github.com/anthropics/skills/tree/main/skills/doc-coauthoring)
- **DOCX Creation & Editing**: [Anthropic docx skill](https://github.com/anthropics/skills/tree/main/skills/docx)
- **DOCX Library**: [docx npm package](https://www.npmjs.com/package/docx)
- **Markdown to HTML/PDF**: [Pandoc documentation](https://pandoc.org/)
- **README Template**: [README-TEMPLATE.md](./assets/README-TEMPLATE.md) - Generic template for any project
- **Awesome README**: [GitHub collection of great README examples](https://github.com/matiassingers/awesome-readme)
- **Shields.io**: [Badge generation service](https://shields.io/)

## Related

- [SA Agent](./../agents/sa.agent.md)
- [Previous: Plan Skill](../plan/)
- [Next: System Design Skill](../sd/)
