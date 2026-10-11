import React, { useState, useEffect } from 'react';
import { FileCode, Download, Copy, Check, FileText, Terminal, Layers } from 'lucide-react';

export const PythonCodebaseView: React.FC = () => {
  const [files, setFiles] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<string>('main.py');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const res = await fetch('/api/certificates/python-codebase/files');
        if (res.ok) {
          const data = await res.json();
          setFiles(data.files || {});
        }
      } catch (err) {
        console.error('Failed to load python files:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFiles();
  }, []);

  const copyCurrentCode = () => {
    const content = files[selectedFile] || '';
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fileList = [
    { name: 'main.py', label: 'main.py (FastAPI Routes & Queue)', icon: FileCode },
    { name: 'models.py', label: 'models.py (SQLAlchemy Schema)', icon: Layers },
    { name: 'schemas.py', label: 'schemas.py (Pydantic Models)', icon: FileCode },
    { name: 'database.py', label: 'database.py (Relational Engine)', icon: Layers },
    { name: 'generator.py', label: 'generator.py (PDF Engine)', icon: FileCode },
    { name: 'test_api.py', label: 'test_api.py (Pytest Suite)', icon: Terminal },
    { name: 'requirements.txt', label: 'requirements.txt (Dependencies)', icon: FileText },
    { name: 'README.md', label: 'README.md (Full Guide)', icon: FileText },
  ];

  return (
    <div className="py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 mb-1">
            <span>Assignment Deliverable</span>
            <span aria-hidden="true">·</span>
            <span>FastAPI + SQLAlchemy + Pytest</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileCode className="w-5 h-5 text-amber-600" />
            <span>Python Backend Implementation</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Production-ready standalone Python repository adhering strictly to the assignment specifications.
          </p>
        </div>

        <a
          href="/api/certificates/python-codebase/download-zip"
          download="bulk-certificate-generator-python.zip"
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download Python Project (.zip)</span>
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: File Explorer */}
        <div className="lg:col-span-3 space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">
            Repository Files
          </div>
          <div className="border border-slate-200 bg-white rounded-xl p-1.5 shadow-xs space-y-1">
            {fileList.map((f) => {
              const Icon = f.icon;
              const isSelected = selectedFile === f.name;
              return (
                <button
                  key={f.name}
                  onClick={() => setSelectedFile(f.name)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-mono rounded-lg text-left transition-colors ${
                    isSelected
                      ? 'bg-slate-900 text-white font-semibold shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />
                  <span className="truncate">{f.name}</span>
                </button>
              );
            })}
          </div>

          <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs space-y-2 text-amber-900">
            <div className="font-bold flex items-center gap-1.5 text-amber-950">
              <Terminal className="w-3.5 h-3.5" />
              <span>Quick Run Instructions</span>
            </div>
            <div className="font-mono text-[11px] bg-white/80 p-2 rounded border border-amber-200/60 space-y-1">
              <div>pip install -r requirements.txt</div>
              <div>uvicorn main:app --reload</div>
              <div>pytest test_api.py</div>
            </div>
          </div>
        </div>

        {/* Right Column: Code Viewer */}
        <div className="lg:col-span-9 border border-slate-200 bg-slate-950 rounded-xl shadow-xs overflow-hidden flex flex-col">
          {/* File bar */}
          <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <span className="font-mono font-medium text-amber-400">{selectedFile}</span>
            <button
              onClick={copyCurrentCode}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white bg-slate-800 rounded transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>

          {/* Code content */}
          <div className="p-4 overflow-x-auto max-h-[640px] flex-1">
            {isLoading ? (
              <div className="py-20 text-center text-xs text-slate-400 font-mono">
                Loading source code...
              </div>
            ) : (
              <pre className="font-mono text-xs text-slate-200 leading-relaxed whitespace-pre font-light">
                {files[selectedFile] || '# File empty or not found'}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
