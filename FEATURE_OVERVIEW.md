# Automated Token Resolution
VPD Feature: [Link Placeholder]

## Overview / Description
This feature replaces the manual, action-driven token resolution process in Vault Content Plans with a fully automated, real-time resolution mechanism. The goal is to provide instantaneous feedback to users on how tokens and files resolve prior to publishing, shifting from a "batch update" mindset to a "live preview" workflow. 

### Success Metrics
* Reduce customer frustration with token resolution workflows.
* Reduce "publishing string too long" errors by 5%.
* Token resolution and path normalization must execute in under 1 second to ensure a responsive UI.

## Key Concepts / Data Model Updates
* **Instantaneous Resolution:** Tokens resolve automatically in real-time as metadata changes or documents are matched. The manual "Update Tokens" action is entirely eliminated.
* **Drag-and-Drop Matching:** Users can drag and drop documents directly onto Content Plan Items to instantly visualize how matched document tokens resolve.
* **Live Path Normalization:** The Published Output Location (POL) generates and normalizes immediately in the UI (removing special characters, enforcing lowercase, and truncating multiple hyphens), allowing users to see the exact final output path.
* **Publishing Validation:** The system visually gates the "Move to Publishing" action until all required Content Plan Items have successfully matched documents attached. Unresolved tokens are explicitly highlighted to signal missing data.
* **Non-Destructive Overrides:** Users can edit the raw template token when a document is absent, and create a safe manual override of the resolved string when a document is attached.
* **Folder Structure View:** Replaces the standard lifecycle states view with a dedicated folder structure view to visualize the post-publishing layout dynamically.
* **Data Model Updates:** A new field will be introduced on the Content Plan Item (CPI) object to explicitly store the user's manual override string, keeping it separate from the original template token field.

## Dependencies
* None identified for this release.

## Enablement
* **Auto-On:** This feature will be automatically enabled and available to all users immediately upon release. No admin configuration or support enablement is required.

## Not In Scope / Future Considerations
* There are no explicit functionality exclusions identified for the Minimum Viable Product (MVP) at this time.