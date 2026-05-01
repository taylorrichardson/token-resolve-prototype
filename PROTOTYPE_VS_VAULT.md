# Token Resolution Prototype: Design Decisions & Feature Comparison

This document outlines the core functional differences between the built prototype and the current token resolution behavior in Veeva Vault RIM. It also logs the architectural and design decisions made during the development of the prototype.

## Current Prototype Functionality

The prototype currently implements a highly interactive, dense, spreadsheet-like interface for managing Content Plans and their tokens:
*   **Permanent Compact Grid View:** A single-page, full-screen grid view that merges the hierarchical tree with data columns, enforcing strict single-line row heights to mimic a dense Excel spreadsheet.
*   **Token Inline Editor:** An interactive token editor built directly into table cells. It visually parses template strings, separating raw text from highlighted token blocks, and allows direct metadata manipulation.
*   **Multi-Document Matching:** Supports dragging and dropping up to 1,000 documents onto a single Content Plan Item.
*   **Content Plan Item Splitting:** Identifies when an item is "overmatched" (documents exceed the Expected Steady State Count) and provides a permanently visible inline "Split" action to automatically chunk extra documents into newly generated items in the tree.
*   **Reactive Token Resolution:** Instant resolution of tokens based on document matches and global metadata.
*   **Smart Path Normalization:** Real-time sanitization of paths and enforcement of correct file extensions.

---

## Functional Differences: Prototype vs. Current Vault

### 1. Grid Layout and UX Density
*   **Current Vault:** Vault typically employs a split-pane layout for Content Plans: a hierarchical tree view on the left, with a properties panel or document viewer occupying the center/right pane upon selection.
*   **Our Prototype:** The prototype has been heavily optimized into a **permanent, unified Grid View**. The tree hierarchy and the properties columns (Name, Output Location, Steady State, Documents) are combined into a single, dense spreadsheet format where every row strictly adheres to a one-line height. Actions like "Split" or "Remove Document" are exposed directly in the grid rather than hidden behind action menus.

### 2. Token Resolution Rules for Multiple Documents
*   **Current Vault:** Vault only resolves matched document tokens (e.g., `${matched_document.title__v}`) when there is *exactly one* single document matched to the Content Plan Item (unless explicitly merging/bundling). If multiple documents are matched, the token remains unresolved until the item is split.
*   **Our Prototype:** The prototype was updated to **always resolve tokens based on the first document added**, even if multiple documents are matched to the same Content Plan Item. This allows users to immediately see the expected output based on the primary document before initiating a split.

### 3. Inline and Synchronous Token Editing
*   **Current Vault:** Token templates are edited in standard text fields. If a user manually overrides the resolved text of a record's name, the automatic token synchronization is broken permanently. Updating a document's metadata requires navigating to that document's separate property page.
*   **Our Prototype:** The `TokenInlineEditor` provides a revolutionary **synchronous editing** experience. It parses the template visually. If a user edits the text *inside* a token block (e.g., changing the text inside the `[TITLE]` token), they are actually directly editing the underlying document's metadata or global metadata. This updates the value globally wherever that token is used, without ever breaking the template synchronization.

### 4. Real-Time vs. Action-Driven Resolution
*   **Current Vault:** Token resolution is action-driven (requiring a user to run "Update Content Plan" or "Update Tokens in Fields").
*   **Our Prototype:** Token resolution is **instant and reactive**. Dropping a document or typing in the inline editor immediately updates the UI across the entire grid.

### 5. Display of Unmatched Tokens
*   **Current Vault:** Unmatched or empty tokens render as their raw literal strings (e.g., `${matched_document.name__v}`).
*   **Our Prototype:** The prototype accurately mirrors this behavior, displaying the raw token string in blue when no data is available. However, because of the inline editor, users can click directly on this raw string to input the missing metadata on the fly.

### 6. Automatic Extension Enforcement
*   **Current Vault:** File extensions are dictated by the template. Incorrectly typed extensions might persist until publishing fails or generates an improper file.
*   **Our Prototype:** Features **smart extension enforcement**. It intercepts the matched document's true extension and automatically corrects the Published Output Location to match, seamlessly replacing incorrect manual extensions.

---

## Architectural & Design Decisions

* **Tech Stack:** React, Vite, and Tailwind CSS. This stack enables the complex reactive state management required for live token resolution across a dense tree-grid without a backend.
* **Component Structure:** The app is designed around a central `App.tsx` utilizing a recursive `renderGridNode` function to generate the unified spreadsheet layout.
* **TokenInlineEditor:** A custom component (`TokenInlineEditor.tsx`) that uses Regex to split a template string into interactive nodes (`EditableSpan`). It maintains strict `flex-nowrap`, `overflow-hidden`, and `text-ellipsis` styling to ensure it never expands beyond a single line height, preserving the spreadsheet density.
* **State Management:** Core state relies on a `nodes` array of `ContentPlanNode` objects. Token replacement is handled purely through functional derivations (`TokenResolver.ts`), meaning the "resolved" state is never permanently saved to the database model; it is strictly a view-layer projection based on the live template and metadata.