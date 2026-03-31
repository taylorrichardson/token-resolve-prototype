import type { ContentPlanNode, Document } from './types';

export const sampleDocuments: Document[] = [
  { id: 'doc-1', name__v: 'CL-001.pdf', title__v: 'Cover Letter AU', region__v: 'Australia', language__v: 'en' },
  { id: 'doc-2', name__v: 'Form-X.pdf', title__v: 'Application Form Draft', region__v: 'Global', language__v: 'en' },
  { id: 'doc-3', name__v: 'Summary.docx', title__v: 'General Summary Doc', region__v: 'Global', language__v: 'en' },
  { id: 'doc-4', name__v: 'Decl-001.pdf', title__v: 'Declaration of Conformity', region__v: 'EU', language__v: 'en' },
  { id: 'doc-5', name__v: 'TOC-Main.pdf', title__v: 'Master Table of Contents', region__v: 'Global', language__v: 'en' },
  { id: 'doc-6', name__v: 'Rationale-FR.pdf', title__v: 'Device Rationale (FR)', region__v: 'France', language__v: 'fr' }
];

export const initialMockData: ContentPlanNode[] = [
  {
    id: 'root-1',
    parentId: null,
    nameTemplate: '${submission_type} - ${submission_product} - ${submission_site}',
    type: 'Content Plan',
    status: 'Active',
    folderTemplate: '/${application_folder}/${submission_id}',
    actualFileName: null,
    isExpanded: true,
  },
  {
    id: 'cover-letter',
    parentId: 'root-1',
    nameTemplate: 'Cover Letter - ${matched_document.region__v} - ${matched_document.title__v}',
    type: 'Content Plan Item',
    status: 'Active',
    folderTemplate: '/${application_folder}/${submission_id}/m1/10-cover/${matched_document.name__v}',
    actualFileName: null,
  },
  {
    id: 'app-form',
    parentId: 'root-1',
    nameTemplate: 'Application Form - ${submission_form_type} (${matched_document.language__v})',
    type: 'Content Plan Item',
    status: 'Active',
    folderTemplate: '/${application_folder}/${submission_id}/m1/12-form/form-${matched_document.language__v}.pdf',
    actualFileName: null,
  },
  {
    id: 'general-summary',
    parentId: 'root-1',
    nameTemplate: 'General Summary of Submission - ${matched_document.title__v}',
    type: 'Content Plan Item',
    status: 'Active',
    folderTemplate: '/${application_folder}/${submission_id}/m2/20-summary/summary.pdf',
    actualFileName: null,
  }
];

export const initialMetadata = {
  submission_type: 'AU Marketing Approval',
  submission_product: 'Nimbus',
  submission_site: '0002 - New Manufacturing Site - Nimbus',
  submission_region: '',
  submission_form_type: 'Type II',
  submission_device_class: 'Class III',
  application_folder: 'Nimbus AU ~ App', // Intentionally adding spaces and special chars to test normalization
  submission_id: '0001 - Initial', // Intentionally adding spaces to test normalization
};