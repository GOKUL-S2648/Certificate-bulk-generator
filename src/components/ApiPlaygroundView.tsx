import React, { useState } from 'react';
import { Terminal, Play, Copy, Check, Code, RefreshCw } from 'lucide-react';

interface EndpointConfig {
  id: string;
  name: string;
  method: 'GET' | 'POST';
  path: string;
  description: string;
  defaultParams?: Record<string, string>;
  defaultBody?: any;
}

const ENDPOINTS: EndpointConfig[] = [
  {
    id: 'generate_job',
    name: '1. Create Bulk Generation Job',
    method: 'POST',
    path: '/api/certificates/generate',
    description: 'Accepts a batch of recipients along with course information. Returns 202 Accepted with a job ID.',
    defaultBody: {
      title: 'Advanced Distributed Systems',
      instructor_name: 'Dr. Sarah Lin',
      organization_name: 'Stanford Online',
      issue_date: '2026-10-10',
      description: 'Mastery in distributed systems design, fault tolerance, and consensus.',
      recipients: [
        { name: 'Alex Mercer', email: 'alex.mercer@example.com' },
        { name: 'Jordan Hayes', email: 'jordan.hayes@example.com' },
        { name: '', email: 'nameless@test.com' }, // Invalid name test
        { name: 'Casey Stone', email: 'invalid-email-format' }, // Invalid email test
      ],
    },
  },
  {
    id: 'get_job',
    name: '2. Check Job Status & Progress',
    method: 'GET',
    path: '/api/certificates/jobs/{jobId}',
    description: 'Returns progress percentage, processed count, success count, failures with error codes, and certificates.',
    defaultParams: {
      jobId: 'job_recent',
    },
  },
  {
    id: 'list_jobs',
    name: '3. List All Generation Jobs',
    method: 'GET',
    path: '/api/certificates/jobs?limit=10',
    description: 'Lists recent generation jobs with pagination and summary counts.',
  },
  {
    id: 'get_job_certs',
    name: '4. Retrieve Job Certificates',
    method: 'GET',
    path: '/api/certificates/jobs/{jobId}/certificates',
    description: 'Retrieves all certificates successfully issued for a given job ID.',
    defaultParams: {
      jobId: 'job_recent',
    },
  },
  {
    id: 'verify_cert',
    name: '5. Public Certificate Verification',
    method: 'GET',
    path: '/api/certificates/verify/{certId}',
    description: 'Verifies authenticity and cryptographic SHA-256 integrity hash of a certificate credential.',
    defaultParams: {
      certId: 'CERT-2026-EXAMPLE',
    },
  },
  {
    id: 'download_cert',
    name: '6. Download Single Certificate',
    method: 'GET',
    path: '/api/certificates/{certId}/download?format=pdf',
    description: 'Downloads the individual high-resolution certificate PDF or SVG.',
    defaultParams: {
      certId: 'CERT-2026-EXAMPLE',
    },
  },
  {
    id: 'download_zip',
    name: '7. Bulk Download All Certificates ZIP',
    method: 'GET',
    path: '/api/certificates/jobs/{jobId}/download-zip',
    description: 'Generates and downloads a ZIP archive containing all generated certificate PDFs and manifest.',
    defaultParams: {
      jobId: 'job_recent',
    },
  },
];

export const ApiPlaygroundView: React.FC = () => {
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>('generate_job');
  const [paramValues, setParamValues] = useState<Record<string, string>>({
    jobId: '',
    certId: '',
  });
  const [requestBodyText, setRequestBodyText] = useState<string>(() =>
    JSON.stringify(ENDPOINTS[0].defaultBody, null, 2)
  );
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});
  const [responseBodyText, setResponseBodyText] = useState<string>('');
  const [responseTimeMs, setResponseTimeMs] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [codeSnippetTab, setCodeSnippetTab] = useState<'curl' | 'python' | 'fetch'>('curl');
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);

  const currentEndpoint = ENDPOINTS.find((e) => e.id === selectedEndpointId) || ENDPOINTS[0];

  const handleSelectEndpoint = (id: string) => {
    setSelectedEndpointId(id);
    const ep = ENDPOINTS.find((e) => e.id === id);
    if (ep) {
      if (ep.defaultBody) {
        setRequestBodyText(JSON.stringify(ep.defaultBody, null, 2));
      } else {
        setRequestBodyText('');
      }
      if (ep.defaultParams) {
        setParamValues((prev) => ({ ...prev, ...ep.defaultParams }));
      }
    }
  };

  const resolvePath = () => {
    let p = currentEndpoint.path;
    Object.entries(paramValues).forEach(([k, v]) => {
      p = p.replace(`{${k}}`, v || `{${k}}`);
    });
    return p;
  };

  const handleExecute = async () => {
    setIsLoading(true);
    setResponseStatus(null);
    setResponseBodyText('');
    const start = performance.now();

    try {
      const path = resolvePath();
      const options: RequestInit = {
        method: currentEndpoint.method,
        headers: {},
      };

      if (currentEndpoint.method === 'POST') {
        (options.headers as Record<string, string>)['Content-Type'] = 'application/json';
        options.body = requestBodyText;
      }

      const res = await fetch(path, options);
      const duration = Math.round(performance.now() - start);
      setResponseTimeMs(duration);
      setResponseStatus(res.status);

      const headersObj: Record<string, string> = {};
      res.headers.forEach((val, key) => {
        headersObj[key] = val;
      });
      setResponseHeaders(headersObj);

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        setResponseBodyText(JSON.stringify(json, null, 2));
      } else {
        const text = await res.text();
        setResponseBodyText(text.substring(0, 1000) + (text.length > 1000 ? '... [Truncated binary content]' : ''));
      }
    } catch (err: any) {
      setResponseStatus(0);
      setResponseBodyText(`Execution failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate Snippets
  const path = resolvePath();
  const generateSnippet = () => {
    if (codeSnippetTab === 'curl') {
      if (currentEndpoint.method === 'POST') {
        return `curl -X POST "http://localhost:3000${path}" \\
  -H "Content-Type: application/json" \\
  -d '${requestBodyText.replace(/\n/g, '').replace(/\s+/g, ' ')}'`;
      }
      return `curl -X GET "http://localhost:3000${path}"`;
    }

    if (codeSnippetTab === 'python') {
      if (currentEndpoint.method === 'POST') {
        return `import requests

url = "http://localhost:3000${path}"
payload = ${requestBodyText}

response = requests.post(url, json=payload)
print(response.status_code)
print(response.json())`;
      }
      return `import requests

url = "http://localhost:3000${path}"
response = requests.get(url)
print(response.status_code)
print(response.json())`;
    }

    // fetch
    if (currentEndpoint.method === 'POST') {
      return `const response = await fetch("${path}", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(${requestBodyText.trim()})
});
const data = await response.json();
console.log(data);`;
    }
    return `const response = await fetch("${path}");
const data = await response.json();
console.log(data);`;
  };

  return (
    <div className="py-6 space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Terminal className="w-5 h-5 text-amber-500" />
          <span>Interactive REST API Playground</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Send live HTTP requests against the backend, test validation boundary conditions, and copy code snippets.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Endpoint Selection & Request Builder */}
        <div className="lg:col-span-6 space-y-4">
          <div className="border border-slate-200 bg-white rounded-xl p-5 shadow-xs space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target API Endpoint
              </label>
              <select
                value={selectedEndpointId}
                onChange={(e) => handleSelectEndpoint(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-slate-50/50 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                {ENDPOINTS.map((ep) => (
                  <option key={ep.id} value={ep.id}>
                    {ep.method} {ep.path.split('?')[0]} — {ep.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1.5">{currentEndpoint.description}</p>
            </div>

            {/* Path Parameters Inputs */}
            {currentEndpoint.path.includes('{jobId}') && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Job ID Parameter (<code className="font-mono text-[10px]">&#123;jobId&#125;</code>)
                </label>
                <input
                  type="text"
                  value={paramValues.jobId || ''}
                  onChange={(e) => setParamValues({ ...paramValues, jobId: e.target.value })}
                  placeholder="Paste or enter target Job ID..."
                  className="w-full px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            )}

            {currentEndpoint.path.includes('{certId}') && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Certificate ID Parameter (<code className="font-mono text-[10px]">&#123;certId&#125;</code>)
                </label>
                <input
                  type="text"
                  value={paramValues.certId || ''}
                  onChange={(e) => setParamValues({ ...paramValues, certId: e.target.value })}
                  placeholder="e.g. CERT-2026-..."
                  className="w-full px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            )}

            {/* Request Body (For POST) */}
            {currentEndpoint.method === 'POST' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    JSON Request Payload
                  </label>
                  <button
                    onClick={() => {
                      if (currentEndpoint.defaultBody) {
                        setRequestBodyText(JSON.stringify(currentEndpoint.defaultBody, null, 2));
                      }
                    }}
                    className="text-[11px] text-amber-700 hover:text-amber-800"
                  >
                    Reset Payload
                  </button>
                </div>
                <textarea
                  value={requestBodyText}
                  onChange={(e) => setRequestBodyText(e.target.value)}
                  rows={10}
                  className="w-full p-3 text-[11px] font-mono bg-slate-900 text-slate-100 rounded-lg focus:outline-none border border-slate-800"
                />
              </div>
            )}

            {/* URL Display and Send Action */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <div className="flex-1 overflow-hidden font-mono text-[11px] text-slate-600 bg-slate-100 px-3 py-2 rounded-lg truncate">
                <span className="font-bold text-slate-900 mr-1.5">{currentEndpoint.method}</span>
                <span>{path}</span>
              </div>
              <button
                onClick={handleExecute}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shrink-0 shadow-xs"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Execute</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Code Snippets Box */}
          <div className="border border-slate-200 bg-white rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-slate-500" />
                <span>Client Code Snippet</span>
              </h3>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded text-[11px]">
                {(['curl', 'python', 'fetch'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setCodeSnippetTab(tab)}
                    className={`px-2 py-0.5 rounded uppercase font-medium ${
                      codeSnippetTab === tab ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <pre className="p-3 text-[11px] font-mono bg-slate-950 text-slate-200 rounded-lg overflow-x-auto max-h-48">
                {generateSnippet()}
              </pre>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateSnippet());
                  setCopiedSnippet(true);
                  setTimeout(() => setCopiedSnippet(false), 2000);
                }}
                className="absolute top-2 right-2 p-1 text-slate-400 hover:text-white bg-slate-800/80 rounded"
                title="Copy snippet"
              >
                {copiedSnippet ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live HTTP Response Console */}
        <div className="lg:col-span-6 space-y-4">
          <div className="border border-slate-200 bg-white rounded-xl p-5 shadow-xs flex flex-col h-full min-h-[500px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-900">Live Response</span>
                {responseStatus !== null && (
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      responseStatus >= 200 && responseStatus < 300
                        ? 'bg-emerald-100 text-emerald-800'
                        : responseStatus >= 400
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    HTTP {responseStatus}
                  </span>
                )}
                {responseTimeMs !== null && (
                  <span className="text-[11px] font-mono text-slate-400">
                    {responseTimeMs}ms
                  </span>
                )}
              </div>

              {responseBodyText && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(responseBodyText);
                    setCopiedResponse(true);
                    setTimeout(() => setCopiedResponse(false), 2000);
                  }}
                  className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900"
                >
                  {copiedResponse ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>Copy Body</span>
                </button>
              )}
            </div>

            {responseBodyText ? (
              <div className="flex-1 overflow-auto rounded-lg bg-slate-950 p-4 border border-slate-800">
                <pre className="text-[11px] font-mono text-emerald-400 whitespace-pre-wrap leading-relaxed">
                  {responseBodyText}
                </pre>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 border border-dashed border-slate-200 rounded-lg">
                <Terminal className="w-8 h-8 opacity-40 mb-2" />
                <p className="text-xs font-medium text-slate-700">No response received yet</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Select an endpoint and click "Execute" to observe status codes and JSON payloads.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
