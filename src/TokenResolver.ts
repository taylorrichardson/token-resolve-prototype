import type { MetadataContext, Document } from './types';

/**
 * Normalizes resolved tokens or paths for valid folder/file structures.
 * Rules: removes special characters (~, \, :, *, ?, <, >, and spaces), 
 * changes to lowercase, replaces multiple hyphens with a single hyphen.
 */
export function normalizePath(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[~\\:*?<> ]/g, '') // remove special chars and spaces
    .replace(/-+/g, '-');        // replace multiple hyphens with single hyphen
}

/**
 * Resolves token strings like ${field_name} using the provided metadata context.
 * If the field_name is not present in the context, or if its value is blank,
 * the token remains unresolved in the string.
 */
export function resolveToken(templateStr: string, metadata: MetadataContext, matchedDocument?: Document | null): string {
  if (!templateStr) return '';

  return templateStr.replace(/\$\{([^}]+)\}/g, (match, tokenName) => {
    // Handle matched document tokens
    if (tokenName.startsWith('matched_document.')) {
      if (!matchedDocument) return match;
      const docField = tokenName.split('.')[1];
      const docValue = matchedDocument[docField];
      if (docValue !== undefined && docValue.trim() !== '') {
        return docValue;
      }
      return match;
    }

    // Check if we have a value for the token
    const value = metadata[tokenName];
    
    // If a value is present and not blank, resolve the token.
    // Otherwise, return the original token string (e.g., "${token_name}").
    if (value !== undefined && value.trim() !== '') {
      return value;
    }
    
    return match;
  });
}