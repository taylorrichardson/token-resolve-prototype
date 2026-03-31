import React, { useState } from 'react';
import { initialMockData, initialMetadata, sampleDocuments } from './mockData';
import { resolveToken, normalizePath } from './TokenResolver';
import { ChevronRight, ChevronDown, Folder, File, FileText, CheckCircle2, X } from 'lucide-react';
import type { ContentPlanNode } from './types';

export default function App() {
  const [nodes, setNodes] = useState<ContentPlanNode[]>(initialMockData);
  const [metadata] = useState(initialMetadata);
  const [isPublished, setIsPublished] = useState(false);
  const [editingCell, setEditingCell] = useState<{ id: string, field: 'name' | 'folder' } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const getChildren = (parentId: string | null) => nodes.filter(n => n.parentId === parentId);
  const rootNodes = getChildren(null);

  const toggleExpand = (id: string) => {
    setNodes(nodes.map(n => n.id === id ? { ...n, isExpanded: !n.isExpanded } : n));
  };

  const allItemsHaveDocuments = nodes.every(n => n.type !== 'Content Plan Item' || !!n.matchedDocument);
  const canPublish = !isPublished && allItemsHaveDocuments;

  const getFinalFolderPath = (node: ContentPlanNode) => {
    const baseResolvedFolder = normalizePath(resolveToken(node.folderTemplate, metadata, node.matchedDocument));
    let finalFolder = node.overrideFolder || baseResolvedFolder;

    if (node.type === 'Content Plan Item' && node.matchedDocument) {
      const extMatch = node.matchedDocument.name__v.match(/(\.[a-z0-9]+)$/i);
      if (extMatch) {
        const ext = extMatch[1].toLowerCase();
        if (!finalFolder.endsWith(ext)) {
          finalFolder = finalFolder.replace(/\.[a-z0-9]+$/i, '') + ext;
        }
      }
    }
    return finalFolder;
  };

  const handlePublish = () => {
    if (!canPublish) return;
    setNodes(nodes.map(n => ({
      ...n,
      actualFileName: getFinalFolderPath(n)
    })));
    setIsPublished(true);
  };

  const removeDocument = (id: string) => {
    setNodes(nodes.map(n => n.id === id ? { ...n, matchedDocument: undefined, overrideName: undefined, overrideFolder: undefined } : n));
  };

  const handleEditStart = (node: ContentPlanNode, field: 'name' | 'folder', resolvedValue: string) => {
    if (isPublished) return;
    setEditingCell({ id: node.id, field });
    if (field === 'name') {
      setEditValue(node.matchedDocument ? (node.overrideName || resolvedValue) : node.nameTemplate);
    } else {
      setEditValue(node.matchedDocument ? (node.overrideFolder || resolvedValue) : node.folderTemplate);
    }
  };

  const handleEditSave = () => {
    if (!editingCell) return;
    const { id, field } = editingCell;
    setNodes(nodes.map(n => {
      if (n.id !== id) return n;
      if (field === 'name') {
        if (n.matchedDocument) {
          return { ...n, overrideName: editValue };
        } else {
          return { ...n, nameTemplate: editValue, overrideName: undefined };
        }
      } else {
        if (n.matchedDocument) {
          return { ...n, overrideFolder: editValue };
        } else {
          return { ...n, folderTemplate: editValue, overrideFolder: undefined };
        }
      }
    }));
    setEditingCell(null);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleEditSave();
    if (e.key === 'Escape') setEditingCell(null);
  };

  const renderNode = (node: ContentPlanNode, level: number = 0) => {
    const children = getChildren(node.id);
    
    const baseResolvedName = resolveToken(node.nameTemplate, metadata, node.matchedDocument);
    const resolvedName = node.overrideName || baseResolvedName;
    const resolvedFolder = getFinalFolderPath(node);

    const hasUnresolvedTokens = resolvedName.includes('${') || resolvedFolder.includes('${');

    const handleDragOver = (e: React.DragEvent) => {
      if (node.type === 'Content Plan Item' && !isPublished) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      }
    };

    const handleDrop = (e: React.DragEvent) => {
      if (node.type === 'Content Plan Item' && !isPublished) {
        e.preventDefault();
        const docId = e.dataTransfer.getData('text/plain');
        const doc = sampleDocuments.find(d => d.id === docId);
        if (doc) {
          setNodes(nodes.map(n => n.id === node.id ? { ...n, matchedDocument: doc } : n));
        }
      }
    };

    return (
      <React.Fragment key={node.id}>
        <tr 
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`border-b border-gray-200 group text-sm transition-colors ${node.type === 'Content Plan Item' && !isPublished ? 'hover:bg-blue-50/50' : 'hover:bg-orange-50/50'}`}
        >
          <td className="px-3 py-2 flex items-center gap-1.5" style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}>
            <div className="w-4 flex justify-center">
              {node.type === 'Content Plan' && (
                <button onClick={() => toggleExpand(node.id)} className="text-gray-500 hover:text-gray-900 focus:outline-none">
                  {node.isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
              )}
            </div>
            {node.type === 'Content Plan' ? (
              <Folder size={14} className="text-gray-500 fill-current" />
            ) : (
              <File size={14} className="text-gray-400" />
            )}
            {editingCell?.id === node.id && editingCell?.field === 'name' ? (
              <input 
                autoFocus
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleEditSave}
                onKeyDown={handleEditKeyDown}
                className="font-medium ml-1 text-sm border border-blue-400 px-1 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[400px] w-full max-w-xl shadow-sm"
              />
            ) : (
              <span 
                onClick={() => handleEditStart(node, 'name', resolvedName)}
                className={`font-medium ml-1 cursor-pointer hover:underline decoration-dashed decoration-gray-400 underline-offset-4 ${hasUnresolvedTokens && !node.actualFileName ? 'text-blue-600' : 'text-blue-700'}`}
                title={!isPublished ? "Click to edit" : ""}
              >
                {node.actualFileName ? node.actualFileName : resolvedName}
              </span>
            )}
            {node.actualFileName && <span title="Locked actual file name"><CheckCircle2 size={12} className="text-green-600 ml-2" /></span>}
            {node.matchedDocument && (
              <span className="ml-2 flex items-center gap-1 text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full border border-blue-200 shadow-sm" title={`Matched Document: ${node.matchedDocument.name__v}`}>
                <FileText size={10} /> {node.matchedDocument.name__v}
                {!isPublished && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeDocument(node.id); }}
                    className="ml-0.5 hover:bg-blue-200 rounded-full p-0.5 transition-colors focus:outline-none"
                    title="Remove Document"
                  >
                    <X size={10} className="text-blue-600 hover:text-blue-800" />
                  </button>
                )}
              </span>
            )}
          </td>
          <td className="px-3 py-2 text-gray-600">{node.status}</td>
          <td className="px-3 py-2 text-gray-600">{node.type}</td>
          <td className="px-3 py-2 text-gray-600">
            {editingCell?.id === node.id && editingCell?.field === 'folder' ? (
              <input 
                autoFocus
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleEditSave}
                onKeyDown={handleEditKeyDown}
                className="font-mono text-xs border border-blue-400 px-1 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-full min-w-[300px] shadow-sm"
              />
            ) : node.actualFileName ? (
              <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-semibold tracking-wide" title="Path Locked">Published: {resolvedFolder}</span>
            ) : (
              <span 
                onClick={() => handleEditStart(node, 'folder', resolvedFolder)}
                className="text-gray-500 font-mono text-xs cursor-pointer hover:underline decoration-dashed decoration-gray-400 underline-offset-4"
                title="Click to edit path"
              >
                {resolvedFolder}
              </span>
            )}
          </td>
          <td className="px-3 py-2 text-gray-500 text-xs font-mono max-w-xs truncate" title={node.nameTemplate}>
            {node.nameTemplate}
          </td>
        </tr>
        {node.isExpanded && children.map(child => renderNode(child, level + 1))}
      </React.Fragment>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-slate-900 text-white h-12 flex items-center justify-between px-4 text-sm font-medium shrink-0 shadow-md">
        <div className="flex items-center gap-4">
          <span className="text-orange-500 font-bold text-lg tracking-tight">Veeva<span className="text-white font-medium">RIM</span></span>
          <div className="bg-white text-gray-900 rounded px-3 py-1 text-xs flex items-center shadow-inner">
            <span>Content Plans</span>
            <ChevronDown size={14} className="ml-2 text-gray-400" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handlePublish}
            disabled={!canPublish}
            title={!isPublished && !allItemsHaveDocuments ? "All Content Plan Items must have a matched document to publish." : ""}
            className={`px-4 py-1.5 rounded text-xs font-semibold shadow-sm transition-all ${isPublished ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : !canPublish ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-500 text-white shadow hover:shadow-md'}`}
          >
            {isPublished ? 'Published' : 'Move to Publishing'}
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden bg-white shadow-sm m-4 rounded-lg border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
            <h1 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FileText size={20} className="text-orange-500" />
              Content Plan
            </h1>
            {isPublished && (
              <span className="text-sm text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-200 flex items-center gap-2 font-medium">
                <CheckCircle2 size={16} /> Names Locked for Export
              </span>
            )}
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-left whitespace-nowrap min-w-max">
              <thead className="sticky top-0 bg-gray-100 shadow-sm border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider z-10">
                <tr>
                  <th className="px-3 py-2 w-1/3">Name</th>
                  <th className="px-3 py-2 w-24">Status</th>
                  <th className="px-3 py-2 w-32">Type</th>
                  <th className="px-3 py-2 w-32">Lifecycle State</th>
                  <th className="px-3 py-2 text-gray-400">Underlying Template (Debug)</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {rootNodes.map(node => renderNode(node, 0))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="w-80 bg-white border-l border-gray-200 shadow-lg flex flex-col shrink-0">
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 bg-slate-50 flex-1 flex flex-col min-h-[250px]">
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-1">Sample Documents</h2>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Drag and drop onto <span className="font-semibold text-blue-600">Content Plan Items</span>.
              </p>
              <div className="space-y-2 overflow-y-auto pb-4">
                {sampleDocuments.map(doc => (
                  <div 
                    key={doc.id}
                    draggable={!isPublished}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', doc.id);
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    className={`p-2 bg-white border border-gray-200 rounded shadow-sm ${!isPublished ? 'cursor-grab active:cursor-grabbing hover:border-blue-400 hover:shadow-md transition-all' : 'opacity-50 cursor-not-allowed'} text-xs group`}
                  >
                    <div className="font-semibold text-gray-700 flex items-center gap-1.5">
                      <FileText size={12} className="text-blue-500 group-hover:text-blue-600" />
                      {doc.title__v}
                    </div>
                    <div className="text-gray-500 font-mono mt-0.5 ml-4 mb-1">{doc.name__v}</div>
                    <div className="flex gap-2 ml-4">
                      {doc.region__v && <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px]">Region: {doc.region__v}</span>}
                      {doc.language__v && <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px]">Lang: {doc.language__v}</span>}
                    </div>
                  </div>
                ))}
              </div>
              
              {isPublished && (
                <div className="mt-2 p-3 bg-blue-50 text-blue-800 text-xs rounded-lg border border-blue-200 leading-relaxed">
                  <strong>Publishing simulated.</strong> The "Actual File Names" have been resolved and locked. Changes to metadata will no longer alter the displayed file names.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}