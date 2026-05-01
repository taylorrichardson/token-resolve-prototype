import React, { useState } from 'react';
import { initialMockData, initialMetadata, sampleDocuments as initialSampleDocuments } from './mockData';
import { resolveToken, normalizePath } from './TokenResolver';
import { ChevronRight, ChevronDown, Folder, FileText, CheckCircle2, X, FileBox, Settings, Copy } from 'lucide-react';
import { TokenInlineEditor } from './TokenInlineEditor';
import type { ContentPlanNode, Document } from './types';

export default function App() {
  const [nodes, setNodes] = useState<ContentPlanNode[]>(initialMockData);
  const [metadata, setMetadata] = useState(initialMetadata);
  const [documents, setDocuments] = useState<Document[]>(initialSampleDocuments);
  const [isPublished, setIsPublished] = useState(false);

  const getChildren = (parentId: string | null) => nodes.filter(n => n.parentId === parentId);
  const rootNodes = getChildren(null);

  const toggleExpand = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNodes(nodes.map(n => n.id === id ? { ...n, isExpanded: !n.isExpanded } : n));
  };

  const allItemsHaveDocuments = nodes.every(n => n.type !== 'Content Plan Item' || (n.matchedDocuments && n.matchedDocuments.length > 0));
  const canPublish = !isPublished && allItemsHaveDocuments;

  const getFinalFolderPath = (node: ContentPlanNode) => {
    const baseResolvedFolder = normalizePath(resolveToken(node.folderTemplate, metadata, node.matchedDocuments));
    let finalFolder = node.overrideFolder || baseResolvedFolder;

    if (node.type === 'Content Plan Item' && node.matchedDocuments && node.matchedDocuments.length > 0) {
      const firstDoc = node.matchedDocuments[0];
      const extMatch = firstDoc.name__v.match(/(\.[a-z0-9]+)$/i);
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

  const removeDocument = (nodeId: string, docId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNodes(nodes.map(n => {
      if (n.id === nodeId && n.matchedDocuments) {
        const updatedDocs = n.matchedDocuments.filter(d => d.id !== docId);
        return { 
          ...n, 
          matchedDocuments: updatedDocs,
          overrideName: updatedDocs.length === 0 ? undefined : n.overrideName,
          overrideFolder: updatedDocs.length === 0 ? undefined : n.overrideFolder 
        };
      }
      return n;
    }));
  };

  const handleSplit = (node: ContentPlanNode) => {
    const docs = node.matchedDocuments || [];
    const steadyState = node.expectedSteadyStateCount || 1;
    if (docs.length <= steadyState || steadyState <= 0) return;

    const sortedDocs = [...docs].sort((a, b) => a.name__v.localeCompare(b.name__v));
    const sourceDocs = sortedDocs.slice(0, steadyState);
    const extraDocs = sortedDocs.slice(steadyState);

    const newNodes: ContentPlanNode[] = [];
    for (let i = 0; i < extraDocs.length; i += steadyState) {
      const chunk = extraDocs.slice(i, i + steadyState);
      newNodes.push({
        ...node,
        id: `${node.id}-split-${Date.now()}-${i}`,
        matchedDocuments: chunk,
        fullDocumentType: '',
        overrideName: undefined,
        overrideFolder: undefined,
        actualFileName: null,
      });
    }

    setNodes(prev => {
      const index = prev.findIndex(n => n.id === node.id);
      if (index === -1) return prev;
      const updatedSourceNode = { ...node, matchedDocuments: sourceDocs };
      const nextNodes = [...prev];
      nextNodes[index] = updatedSourceNode;
      nextNodes.splice(index + 1, 0, ...newNodes);
      return nextNodes;
    });
  };

  const handleTokenChange = (node: ContentPlanNode, tokenName: string, newValue: string) => {
    if (tokenName.startsWith('matched_document.')) {
      const docField = tokenName.split('.')[1];
      if (node.matchedDocuments && node.matchedDocuments.length > 0) {
        const docId = node.matchedDocuments[0].id;
        
        setDocuments(prev => prev.map(d => d.id === docId ? { ...d, [docField]: newValue } : d));
        setNodes(prev => prev.map(n => {
          if (n.matchedDocuments && n.matchedDocuments.some(d => d.id === docId)) {
            return {
              ...n,
              matchedDocuments: n.matchedDocuments.map(d => d.id === docId ? { ...d, [docField]: newValue } : d)
            };
          }
          return n;
        }));
      }
    } else {
      setMetadata(prev => ({ ...prev, [tokenName]: newValue }));
    }
  };

  const handleTemplateChange = (nodeId: string, field: 'name' | 'folder', newTemplate: string) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, [field === 'name' ? 'nameTemplate' : 'folderTemplate']: newTemplate } : n));
  };

  const handleSteadyStateSave = (nodeId: string, value: string) => {
    const count = parseInt(value, 10);
    setNodes(nodes.map(n => n.id === nodeId ? { ...n, expectedSteadyStateCount: isNaN(count) || count < 1 ? 1 : count } : n));
  };

  const renderGridNode = (node: ContentPlanNode, level: number = 0) => {
    const children = getChildren(node.id);
    const docs = node.matchedDocuments || [];
    const baseResolvedName = resolveToken(node.nameTemplate, metadata, node.matchedDocuments);
    const resolvedName = node.overrideName || baseResolvedName;
    const resolvedFolder = getFinalFolderPath(node);

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
        const doc = documents.find(d => d.id === docId);
        if (doc && !(node.matchedDocuments || []).find(d => d.id === doc.id)) {
          setNodes(nodes.map(n => n.id === node.id ? { ...n, matchedDocuments: [...(n.matchedDocuments || []), doc], isExpanded: true } : n));
        }
      }
    };

    return (
      <React.Fragment key={node.id}>
        <tr className="bg-white hover:bg-blue-50/40 transition-colors group border-b border-gray-200">
          <td 
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="px-1.5 py-0.5 align-middle border-r border-gray-200" 
          >
            <div className="flex items-center gap-1 text-[12px]" style={{ paddingLeft: `${level * 16}px` }}>
              <div className="w-3 flex justify-center shrink-0 cursor-pointer" onClick={(e) => toggleExpand(node.id, e)}>
                {(node.type === 'Content Plan' || docs.length > 0) && (
                  <button className="text-gray-400 hover:text-gray-700 focus:outline-none">
                    {node.isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  </button>
                )}
              </div>
              {node.type === 'Content Plan Item' ? (
                <div className="flex items-center gap-1.5 overflow-hidden w-full pr-1 group/cpi">
                  <div className="w-2 h-2 rounded-full bg-green-500 shrink-0 shadow-sm"></div>
                  <span className="text-blue-600 font-medium truncate select-none hover:underline leading-tight" title={node.actualFileName ? node.actualFileName : resolvedName}>{node.actualFileName ? node.actualFileName : resolvedName}</span>
                  {node.actualFileName && <CheckCircle2 size={10} className="text-green-600 shrink-0" />}
                  {docs.length > (node.expectedSteadyStateCount || 1) && !isPublished && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleSplit(node); }} 
                      className="ml-auto opacity-0 group-hover/cpi:opacity-100 bg-indigo-100 text-indigo-700 px-1 py-0.5 rounded flex items-center gap-1 text-[9px] hover:bg-indigo-200 transition-opacity shrink-0"
                      title="Split Content Plan Item"
                    >
                      <Copy size={10} /> Split
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 overflow-hidden w-full pr-1">
                  <Folder size={12} className="text-gray-400 fill-gray-200 shrink-0" />
                  <span className="text-gray-800 font-medium truncate select-none hover:underline leading-tight" title={resolvedName}>{resolvedName}</span>
                </div>
              )}
            </div>
            {/* Show documents visually indented under the CPI inside the grid cell */}
            {node.isExpanded && docs.map(doc => (
              <div key={doc.id} className="flex items-center gap-1.5 py-0.5 hover:bg-orange-50/50 rounded pr-2 group/tree-doc" style={{ paddingLeft: `${(level + 1) * 16 + 20}px` }}>
                 <FileText size={10} className="text-red-500 shrink-0" />
                 <span className="text-gray-600 truncate text-[11px] leading-tight" title={doc.name__v}>{doc.name__v}</span>
                 {!isPublished && (
                   <button 
                     onClick={(e) => removeDocument(node.id, doc.id, e)} 
                     className="text-gray-400 hover:text-red-500 p-0.5 shrink-0 ml-1"
                     title="Remove Document"
                   >
                     <X size={10} />
                   </button>
                 )}
              </div>
            ))}
          </td>
          
          <td className="px-2 py-0.5 border-r border-gray-200 align-middle">
            {isPublished || node.actualFileName ? (
              <div className="text-[12px] text-gray-800 leading-tight">{node.actualFileName || resolvedName}</div>
            ) : (
              <div className="w-full overflow-hidden">
                <TokenInlineEditor
                  template={node.nameTemplate}
                  metadata={metadata}
                  matchedDocuments={node.matchedDocuments}
                  onTemplateChange={(newTemplate) => handleTemplateChange(node.id, 'name', newTemplate)}
                  onTokenChange={(token, val) => handleTokenChange(node, token, val)}
                  onClose={() => {}}
                />
              </div>
            )}
          </td>

          <td className="px-2 py-0.5 border-r border-gray-200 align-middle">
            {isPublished || node.actualFileName ? (
              <div className="text-[11px] font-mono text-gray-800 break-all leading-tight">{resolvedFolder}</div>
            ) : (
              <div className="w-full overflow-hidden">
                <TokenInlineEditor
                  template={node.folderTemplate}
                  metadata={metadata}
                  matchedDocuments={node.matchedDocuments}
                  onTemplateChange={(newTemplate) => handleTemplateChange(node.id, 'folder', newTemplate)}
                  onTokenChange={(token, val) => handleTokenChange(node, token, val)}
                  onClose={() => {}}
                />
              </div>
            )}
          </td>

          <td className="px-2 py-0.5 border-r border-gray-200 align-middle text-center">
            {node.type === 'Content Plan Item' ? (
              <input
                type="number"
                min="1"
                disabled={isPublished}
                value={node.expectedSteadyStateCount || 1}
                onChange={e => handleSteadyStateSave(node.id, e.target.value)}
                className="w-12 border border-gray-300 px-1 py-0 rounded text-[11px] text-center focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
              />
            ) : null}
          </td>

          <td className="px-2 py-0.5 align-middle">
             {node.type === 'Content Plan Item' && docs.length > 0 && (
               <div className="flex flex-nowrap gap-1 overflow-hidden w-full mask-gradient-right">
                 {docs.map(doc => (
                   <div key={doc.id} className="flex items-center gap-1 px-1 py-0 bg-gray-50 border border-gray-200 rounded text-[10px] group/doc leading-tight whitespace-nowrap shrink-0 max-w-[150px]">
                     <FileText size={8} className="text-red-500 shrink-0" />
                     <span className="text-gray-700 truncate max-w-[100px]" title={doc.name__v}>{doc.name__v}</span>
                     {!isPublished && (
                       <button onClick={(e) => removeDocument(node.id, doc.id, e)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover/doc:opacity-100 ml-0.5">
                         <X size={8} />
                       </button>
                     )}
                   </div>
                 ))}
               </div>
             )}
          </td>
        </tr>
        {node.isExpanded && children.map(child => renderGridNode(child, level + 1))}
      </React.Fragment>
    );
  };

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* Global Header */}
      <header className="bg-slate-900 text-white h-12 flex items-center justify-between px-4 text-sm font-medium shrink-0">
        <div className="flex items-center gap-6">
          <span className="text-orange-500 font-bold text-lg tracking-tight">Veeva<span className="text-white font-medium">RIM</span></span>
          <nav className="flex gap-4 text-gray-300 text-xs">
            <span className="hover:text-white cursor-pointer pb-3 mt-3">Events</span>
            <span className="hover:text-white cursor-pointer pb-3 mt-3">Product Families</span>
            <span className="text-orange-500 border-b-2 border-orange-500 pb-3 mt-3 font-bold">Applications</span>
            <span className="hover:text-white cursor-pointer pb-3 mt-3">Registrations</span>
          </nav>
        </div>
      </header>

      {/* Sub Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 shrink-0 flex flex-col gap-2">
        <div className="text-[11px] text-blue-600 flex items-center gap-1 font-semibold">
          <Folder size={12} /> Submissions <ChevronRight size={10} className="text-gray-400" /> Demo Product XYZ NDA <ChevronRight size={10} className="text-gray-400" /> Initial NDA Filing
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500 text-white rounded px-1.5 py-0.5 text-[10px] font-bold flex items-center gap-1">
              <FileBox size={10} /> CONTENT PLAN
            </div>
            <h1 className="text-xl font-semibold text-blue-700">Demo Product XYZ NDA - Initial NDA Filing</h1>
            <span className="bg-gray-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wide">DRAFT</span>
            <CheckCircle2 size={16} className="text-green-500" />
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handlePublish}
              disabled={!canPublish}
              className={`px-4 py-1.5 rounded text-xs font-semibold shadow-sm transition-all ${isPublished ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : !canPublish ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
              {isPublished ? 'Published' : 'Publish Plan'}
            </button>
            <Settings size={16} className="text-gray-500 cursor-pointer" />
          </div>
        </div>
      </div>

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
          <div className="flex items-center gap-4 px-4 py-2 border-b border-gray-200 text-xs font-semibold text-gray-500 shrink-0">
            <span className="hover:text-blue-600 cursor-pointer text-gray-800 border-b-2 border-blue-500 pb-2 -mb-2 mt-2">Grid View</span>
          </div>
          <div className="flex-1 overflow-auto pb-20">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-4 py-2 text-[11px] uppercase font-bold text-gray-500 border-r border-gray-200 w-1/4 min-w-[300px]">Name</th>
                  <th className="px-3 py-2 text-[11px] uppercase font-bold text-gray-500 border-r border-gray-200 w-1/4 min-w-[200px]">Name / Template</th>
                  <th className="px-3 py-2 text-[11px] uppercase font-bold text-gray-500 border-r border-gray-200 w-1/4 min-w-[200px]">Published Output Location</th>
                  <th className="px-3 py-2 text-[11px] uppercase font-bold text-gray-500 border-r border-gray-200 w-32">Steady State</th>
                  <th className="px-3 py-2 text-[11px] uppercase font-bold text-gray-500 w-48">Matched Documents</th>
                </tr>
              </thead>
              <tbody>
                {rootNodes.map(node => renderGridNode(node, 0))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Pane: Sample Documents */}
        <div className="w-[280px] bg-slate-50 border-l border-gray-200 shadow-inner flex flex-col shrink-0">
          <div className="p-3 border-b border-gray-200 bg-white">
            <h2 className="text-[11px] font-bold text-gray-800 uppercase tracking-wider">Sample Documents</h2>
            <p className="text-[10px] text-gray-500 mt-1">Drag onto Content Plan Items to match.</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {documents.map(doc => (
              <div 
                key={doc.id}
                draggable={!isPublished}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', doc.id);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                className={`p-2 bg-white border border-gray-200 rounded shadow-sm ${!isPublished ? 'cursor-grab active:cursor-grabbing hover:border-blue-400 transition-all' : 'opacity-50 cursor-not-allowed'} group`}
              >
                <div className="font-semibold text-gray-700 flex items-center gap-1.5 text-[12px]">
                  <FileText size={12} className="text-red-500 shrink-0" />
                  <span className="truncate">{doc.title__v}</span>
                </div>
                <div className="text-gray-500 font-mono mt-1 ml-4 text-[10px] truncate">{doc.name__v}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}