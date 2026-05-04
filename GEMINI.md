# Token-Resolve Prototype

## Project Overview
This project is a functional, web-based prototype designed to augment and improve Veeva Vault's Content Plan Token Resolution. 
The core goal is to demonstrate **automatic token resolution** without requiring manual user actions, providing immediate visual feedback on how tokens and files will resolve after a content plan is exported or published.

## Key Prototype Features (The "To-Be" State)
- **Automatic Resolution:** Tokens resolve automatically in real-time. No manual "Update Tokens" action is required.
- **Drag and Drop Matching:** A sidebar containing sample documents allows users to drag and drop documents onto content plan items to simulate document matching and see immediate token resolution.
- **Folder Structure View:** Replaces standard lifecycle state views with a folder structure view to visualize the post-publishing layout.
- **Publish Validation:** Prevents the user from "publishing" if any content plan items are missing a populated document.
- **Inline Editing:** 
  - Users can click on a name to edit the "resolved" token string if a document is attached.
  - Users can edit the raw token and format if no document is attached.
  - Users can edit folder paths directly.
- **Dynamic Re-resolution:** If a token is manually edited, it must properly re-resolve immediately when a new document is attached to it.

## Vault Baseline Context (The "As-Is" State)
*This is how Veeva Vault currently operates, which this prototype is designed to improve upon.*

- **Manual Action:** Tokens currently require users to run the "Update Tokens in Fields" or "Update Tokens in Field" action.
- **Supported Fields:** Name, Title (`xml_title__v`), Filename, Folder Path, XML Element Name.
- **Repeating Sections:** Tokens in the *Name* field of a Content Plan Template generate repeating sections. Tokens in other fields resolve statically.
- **Matched Document Tokens:** e.g., `${matched_document.name__v}`. Vault only resolves this based on the *first* matched document, even if multiple are matched.
- **Published Output Location (POL):** Concatenation of Folder Path and Filename. Normalizes text (removes special chars `~\:*?"<>|`, spaces, quotes; replaces multiple hyphens with one; forces lowercase).
- **Unresolved Tokens:** Remain as raw text if the referenced field is blank. Do not auto-update if source data changes after resolution (requires re-running the action).
- **Limitations:** Only one Submission join object token can be resolved per Content Plan record name.

## Agent Instructions
- When modifying this project, ensure that the UI immediately reflects token changes (reactivity is key to the prototype's purpose).
- Adhere to the prototype rules: real-time updates, prevent publishing with empty items, and allow inline editing of paths and tokens.
- Use the Vault Baseline Context to understand the domain terms (Content Plan, POL, Matched Documents, etc.) when implementing or discussing features.
