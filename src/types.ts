export interface Document {
  id: string;
  name__v: string;
  title__v: string;
  [key: string]: string;
}

export interface ContentPlanNode {
  id: string;
  parentId: string | null;
  nameTemplate: string;
  type: 'Content Plan' | 'Content Plan Item';
  status: string;
  folderTemplate: string;
  actualFileName: string | null;
  isExpanded?: boolean;
  matchedDocument?: Document | null;
  overrideName?: string;
  overrideFolder?: string;
}

export type MetadataContext = Record<string, string>;