# AGENT.md

## PURPOSE

This file defines the rules for creating Markdown documents intended only for AI agents, LLMs, and IDE agents.

It is the common documentation rulebook for project-planning files such as:

- PRD.md
- MVP.md
- TRD.md
- PROCESS_FLOW.md
- Architecture documents
- Technical planning documents
- Other project-specific `.md` files

This file defines HOW those documents should be written. It does not define the content of any specific document.

## AGENT-FIRST DOCUMENTATION

Every generated `.md` MUST be written for an agent to understand and use directly.

The document MUST:

- Be self-contained.
- Provide the context required to understand the subject.
- Clearly state its purpose.
- Clearly state what the agent needs to understand or do.
- Make important relationships and dependencies explicit.
- Avoid unnecessary human-oriented explanation.
- Avoid relying on previous conversation history.

The agent should be able to read the file and immediately understand the relevant project context without reconstructing it from the original prompt.

## DOCUMENT STRUCTURE

Each `.md` should use a clear and predictable structure appropriate to its purpose.

Use sections such as:

```text
PURPOSE
CONTEXT
OBJECTIVE
SCOPE
REQUIREMENTS
CONSTRAINTS
INPUTS
DEPENDENCIES
WORKFLOW / PROCESS
OUTPUTS
VALIDATION
CURRENT STATE
NEXT ACTIONS
```

Only include sections that are relevant.

Do not force the same structure onto every document when the document's purpose requires a different structure.

## PROJECT DOCUMENT RELATIONSHIP

Project-planning documents should have distinct responsibilities.

```text
PRD
→ What are we building, why are we building it, and what should it do?

MVP
→ What is the minimum version that must be built?

TRD
→ How will the product be technically implemented?

PROCESS_FLOW
→ How does the system, user journey, or operational process work?
```

These documents SHOULD complement each other rather than repeat the same information.

When one document depends on another, explicitly state the relationship.

## CONTEXT RULE

Critical context MUST be written inside the document.

Do not assume the agent remembers:

- The original prompt
- Previous conversations
- Previous decisions
- Unwritten project assumptions
- Information contained only in another document

If another document is required to understand the current document, reference it explicitly.

## REQUIREMENTS AND CONSTRAINTS

Requirements describe what the project or system MUST do.

Constraints describe what the project or system MUST or MUST NOT use, change, or support.

Keep them explicit and separate.

Use:

```text
MUST
MUST NOT
SHOULD
SHOULD NOT
MAY
```

when precise instruction is required.

## NO-INFERENCE RULE

Do not make the agent guess important information.

If a critical detail is unknown, mark it as:

```text
UNKNOWN
```

or:

```text
UNRESOLVED
```

Do not invent requirements, technologies, data, APIs, workflows, users, or project decisions.

Reasonable structural decisions MAY be made when they do not change the project's intended meaning.

## CONSISTENCY RULE

Use consistent names for:

- Features
- Components
- Modules
- Users
- APIs
- Databases
- Services
- Files
- Variables
- Project concepts

The same concept MUST NOT be given different names across project documents unless the relationship is explicitly defined.

## TECHNICAL CLARITY

When technical information is required, prefer exact information over vague descriptions.

Use exact:

- File paths
- Component names
- API endpoints
- Technologies
- Data formats
- Inputs
- Outputs
- Dependencies
- Parameters

Use diagrams or Mermaid when they make a system relationship or process substantially clearer.

Do not add diagrams for decoration.

## DOCUMENT GENERATION RULE

When creating a specific `.md` file:

```text
USER PROMPT
+
PROJECT CONTEXT
+
AGENT.md RULES
=
SPECIFIC PROJECT DOCUMENT
```

The specific document MUST follow the purpose requested by the prompt while following the documentation rules defined here.

Do not copy irrelevant rules, sections, or information into the generated document.

## QUALITY CHECK

Before finalizing a generated `.md`, verify:

```text
[ ] Purpose is clear.
[ ] Required context is present.
[ ] Scope is clear.
[ ] Requirements are explicit.
[ ] Constraints are explicit.
[ ] Dependencies are clear.
[ ] Important inputs and outputs are defined.
[ ] Important workflows are clear.
[ ] Related documents are identified when necessary.
[ ] Unknown information is not invented.
[ ] Terminology is consistent.
[ ] The document can be understood without the original conversation.
[ ] Unnecessary human-oriented content has been removed.
```

## FINAL RULE

The goal is not to make Markdown documents long or complex.

The goal is to make every generated `.md` contain exactly the information an agent needs to understand the project, make correct decisions, and perform the intended work without unnecessary inference.
