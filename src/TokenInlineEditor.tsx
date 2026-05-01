import React, { useRef, useEffect, useMemo } from 'react';
import type { MetadataContext, Document } from './types';

interface EditableSpanProps {
  value: string;
  onChange: (val: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  className?: string;
}

function EditableSpan({ value, onChange, onKeyDown, className }: EditableSpanProps) {
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (spanRef.current && document.activeElement !== spanRef.current) {
      if (spanRef.current.textContent !== value) {
        spanRef.current.textContent = value;
      }
    }
  }, [value]);

  const handleInput = () => {
    if (spanRef.current) {
      onChange(spanRef.current.textContent || '');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
    if (onKeyDown) onKeyDown(e);
  };

  return (
    <span
      ref={spanRef}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      className={`outline-none whitespace-pre ${className}`}
    />
  );
}

interface TokenInlineEditorProps {
  template: string;
  metadata: MetadataContext;
  matchedDocuments?: Document[];

  onTemplateChange: (newTemplate: string) => void;
  onTokenChange: (tokenName: string, newValue: string) => void;
  onClose: () => void;
}

export function TokenInlineEditor({
  template,
  metadata,
  matchedDocuments,
  onTemplateChange,
  onTokenChange,
  onClose
}: TokenInlineEditorProps) {
  
  const parts = useMemo(() => {
    const p: any[] = [];
    let lastIndex = 0;
    template.replace(/\$\{([^}]+)\}/g, (match, tokenName, offset) => {
      if (offset > lastIndex) {
        p.push({ type: 'text', value: template.substring(lastIndex, offset) });
      }
      let resolvedValue = '';
      if (tokenName.startsWith('matched_document.')) {
        if (matchedDocuments && matchedDocuments.length > 0) {
          const docField = tokenName.split('.')[1];
          resolvedValue = matchedDocuments[0][docField] || '';
        }
      } else {
        resolvedValue = metadata[tokenName] !== undefined ? metadata[tokenName] : '';
      }
      p.push({ type: 'token', name: tokenName, raw: match, value: resolvedValue });
      lastIndex = offset + match.length;
      return match;
    });
    if (lastIndex < template.length) {
      p.push({ type: 'text', value: template.substring(lastIndex) });
    }
    return p;
  }, [template, metadata, matchedDocuments]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      onClose();
    }
  };

  const updateTextPart = (index: number, newVal: string) => {
    const newParts = [...parts];
    newParts[index] = { ...newParts[index], value: newVal };
    const newTemplate = newParts.map(p => p.type === 'text' ? p.value : `\${${p.name}}`).join('');
    onTemplateChange(newTemplate);
  };

  return (
    <div 
      className="flex flex-nowrap items-center bg-white border border-blue-400 rounded shadow-sm focus-within:ring-1 focus-within:ring-blue-500 w-full text-[11px] p-0.5 overflow-hidden whitespace-nowrap"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          onClose();
        }
      }}
    >
      {parts.length === 0 && (
        <EditableSpan 
          value="" 
          onChange={(v) => updateTextPart(0, v)} 
          onKeyDown={handleKeyDown}
          className="text-gray-800 min-w-[20px] whitespace-nowrap"
        />
      )}
      {parts.map((p, i) => {
        if (p.type === 'text') {
          return (
            <EditableSpan 
              key={i} 
              value={p.value} 
              onChange={(v) => updateTextPart(i, v)} 
              onKeyDown={handleKeyDown}
              className="text-gray-800 min-w-[4px] whitespace-nowrap"
            />
          );
        } else {
          const isUnresolved = !p.value;
          if (isUnresolved) {
            return (
              <span key={i} className="text-blue-600 font-medium whitespace-nowrap mx-0.5" title="Unmatched Token">
                {`\${${p.name}}`}
              </span>
            );
          }
          return (
            <div key={i} className="flex flex-nowrap items-center px-1 py-0 mx-0.5 rounded shadow-inner border focus-within:ring-1 focus-within:ring-blue-400 shrink-0 bg-blue-50 text-blue-900 border-blue-200">
              <span className="text-[8px] uppercase font-bold mr-1 opacity-60 cursor-help select-none whitespace-nowrap text-blue-600" title={`Token: ${p.name}`}>
                {p.name.split('.').pop()?.replace('__v', '')}
              </span>
              <EditableSpan 
                value={p.value} 
                onChange={(v) => onTokenChange(p.name, v)} 
                onKeyDown={handleKeyDown}
                className="font-semibold min-w-[10px] whitespace-nowrap max-w-[150px] overflow-hidden text-ellipsis"
              />
            </div>
          );
        }
      })}
    </div>
  );
}