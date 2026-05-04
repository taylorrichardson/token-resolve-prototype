# Detailed Design: Automated Token Resolution

## 1. Feature Info
* **VPD Feature:** [Link Placeholder]
* **Jira EPIC:** [Link Placeholder]

## 2. Required Reading
* **Feature Overview:** [Link Placeholder to FO]
* **UI Flow:** N/A
* **Release Note:** [Link Placeholder]

## 3. Background & Stakeholders
Currently, token resolution in Vault Content Plans requires users to manually execute the "Update Tokens in Fields" or "Update Tokens in Field" actions. This manual step often leads to delayed error discovery (such as "publishing string too long" errors) and prevents users from immediately visualizing how their final published output will be structured.

This feature introduces a real-time, reactive token resolution system, replacing the manual process. It aims to reduce customer frustration and publishing errors by allowing users to preview and resolve tokens instantly via UI interactions such as drag-and-drop document matching.

**Key Personas:**
* Submission Publisher
* Content Plan Author

## 4. Data Model & Dependencies

### Data Model Impacts
To support non-destructive manual overrides without losing the original template token strings, a new field will be introduced.

* **Object:** Content Plan Item (`content_plan_item__v`)
* **New Field:** `manual_override__v` (Text)
* **Purpose:** Stores the user's manual override of the resolved string when a document is attached.

### Standard Layouts
* The `manual_override__v` field shall be added to the standard Content Plan Item page layouts, though primarily interacted with via the inline grid edit.

### Vault Object Configuration
* N/A

### Dependencies
* N/A

## 5. Detailed Design

This section details the requirements for the Automated Token Resolution feature.

### 5.1 Real-Time Resolution
The system shall continuously evaluate and resolve tokens based on the current metadata and matched documents.
* **(P1)** The system shall automatically resolve tokens (e.g., `${matched_document.name__v}`) in real-time as metadata changes or documents are matched to Content Plan Items.
* **(P1)** The manual "Update Tokens in Fields" and "Update Tokens in Field" user actions shall be deprecated and removed from the UI.

### 5.2 Folder Structure View & Drag-and-Drop Matching
The UI will be updated to focus on the final deliverable's hierarchy.
* **(P1)** The system shall provide a dedicated folder structure view replacing the standard lifecycle states view to dynamically visualize the post-publishing layout.
* **(P1)** The UI shall allow users to drag and drop documents directly from a sidebar onto Content Plan Items in the grid.
* **(P1)** When a document is dropped onto an item, the system shall instantly simulate document matching and update the UI to display the resolved token values.

### 5.3 Live Path Normalization
The Published Output Location (POL) generation must be transparent and instantaneous.
* **(P1)** The system shall automatically generate and normalize the Published Output Location (`published_output_location__v`) immediately in the UI.
* **(P1)** Normalization rules shall include removing special characters (`~ \ : * ? < > " |`), enforcing lowercase, and truncating multiple consecutive hyphens into a single hyphen.

### 5.4 Publishing Validation
The system must actively prevent incomplete plans from proceeding to publishing.
* **(P1)** Unresolved tokens shall be explicitly highlighted (e.g., in blue) within the UI to signal missing data to the user.
* **(P1)** The system shall visually gate and disable the "Move to Publishing" action until all required Content Plan Items have successfully matched documents attached and no unresolved tokens remain.

### 5.5 Non-Destructive Overrides
Users require the ability to make manual adjustments without permanently breaking the link to the underlying template.
* **(P1)** When a user clicks on an item *without* an attached document, the system shall allow inline editing of the raw template token string.
* **(P1)** When a user clicks on an item *with* an attached document, the system shall allow inline editing to create a manual override of the resolved string. This override shall be saved to the new `manual_override__v` field.
* **(P1)** If an attached document is removed, the system shall clear the `manual_override__v` value and revert the displayed name to the original template token string.

## 6. Accessibility Requirements
* N/A

## 7. Upgrade Requirements
* N/A

## 8. Feature Usage Tracking
* N/A

## 9. Future Considerations & Roadmap
* N/A

## 10. Vault Connections
* N/A

## 11. Performance, Security, and Audit

### Performance
* Token resolution and path normalization must execute in under 1 second to ensure a responsive UI.

### Security
* Field-level security for `manual_override__v` shall mirror existing edit permissions for the Content Plan Item name/template fields.

### Audit
* Changes to the `manual_override__v` field shall be tracked in the standard Vault audit trail for the Content Plan Item.

## 12. MDL Requirements
* N/A

## 13. Testing Considerations
* Verify real-time resolution upon drag-and-drop matching.
* Verify live path normalization accurately removes all restricted characters and forces lowercase.
* Verify the "Move to Publishing" action is strictly disabled when unresolved tokens are present.
* Verify that clearing a matched document properly clears the `manual_override__v` field and restores the template token.

## 14. Discussions & Decisions
* N/A
