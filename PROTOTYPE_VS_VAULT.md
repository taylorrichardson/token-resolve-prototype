# Token Resolution Prototype: Design Decisions & Feature Comparison

This document outlines the core functional differences between the built prototype and the current token resolution behavior in Veeva Vault RIM. It also logs the architectural and design decisions made during the development of the prototype.

## Functional Differences: Prototype vs. Current Vault

### 1. Real-Time vs. Action-Driven Resolution
*   **Current Vault:** Token resolution is action-driven. If a field is blank or a document is updated, the token text remains unresolved until a user explicitly triggers the "Update Content Plan" or "Update Tokens in Fields" action.
*   **Our Prototype:** Token resolution is **instant and reactive**. The moment a document is dragged onto a Content Plan Item (or when metadata is edited), the tokens in both the Name and the Published Output Location automatically resolve and update in the UI without needing a page refresh or manual action.

### 2. Forgiving Manual Edits (Non-Destructive Overrides)
*   **Current Vault:** If Vault detects that a user manually edited the non-token text of a record's name, the synchronization is broken permanently. The text and the token will no longer be refreshed by Vault during future updates.
*   **Our Prototype:** The prototype introduces a **non-destructive override system**. 
    * If a user clicks an item *without* a document, they are editing the raw underlying token template. 
    * If they click an item *with* a matched document, they are creating a safe "override" of the resolved string. 
    * If they later remove the document, the custom override is safely cleared, and the item perfectly reverts back to its original template string.

### 3. Transparent Path Normalization
*   **Current Vault:** Vault normalizes output paths (removing spaces, special characters like `~ \ : * ? < >`, lowercase conversions) and combines the Dossier parameters with the Item templates during the backend export/publishing process. Users don't easily see the final exact file path until it's generated.
*   **Our Prototype:** Path normalization happens **live in the grid**. The "Published Output Location" column instantly shows the fully sanitized, lowercase, concatenated file path exactly as it will appear in the final export, allowing for preemptive error checking.

### 4. Automatic Extension Enforcement
*   **Current Vault:** File extensions are dictated strictly by what resolves in the template. If a template expects a `.pdf` but a user matches a `.docx` document, the extension could be incorrect upon publishing.
*   **Our Prototype:** The prototype features **smart extension enforcement**. It actively intercepts the matched document, extracts its true extension, and ensures the Published Output Location always ends with the correct extension, seamlessly replacing incorrect ones that might have been manually typed into the template.

### 5. Publishing Gating & Validation
*   **Current Vault:** Unresolved tokens simply render as raw text (e.g., `${field_name}`) and can sometimes slip through if a user isn't diligently checking their views before triggering a publishing action.
*   **Our Prototype:** Introduces strict visual states and gating. Unresolved tokens are explicitly highlighted in a different color (blue) to signal missing data. Furthermore, the **"Move to Publishing" button is strictly disabled** until every Content Plan Item has a successfully matched document attached.

---

## Architectural & Design Decisions

* **Tech Stack:** Built as a single-page application using React, Vite, and Tailwind CSS. This allows for complex, reactive state management (like live token replacement across a tree-grid) without requiring a backend.
* **Component Structure:** The app is designed around a central `App.tsx` that holds the state, utilizing a recursive `renderNode` function to generate the hierarchical "Tree Grid" layout that mimics the Vault UI.
* **Token Resolution Logic:** Token replacement is decoupled into a dedicated `TokenResolver.ts` utility. It uses standard regex matching `/\$\{([^}]+)\}/g` to identify and safely inject data without evaluating code. 
* **State Management:** The core state relies on a single `nodes` array containing `ContentPlanNode` objects. Modifying a template, dropping a document, or typing an override simply updates the object in this array, and React's reactivity handles instantly re-rendering the resolved tokens in the UI.
* **Drag-and-Drop Implementation:** Relies on native HTML5 Drag and Drop APIs (`onDragStart`, `onDrop`, `onDragOver`). The `dataTransfer` payload only carries the `doc.id`, keeping the event payload lightweight while the UI looks up the full document object from the `sampleDocuments` store upon drop.