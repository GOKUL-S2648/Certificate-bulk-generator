import { apiFetch } from '../lib/api.ts';
import React, { useState } from 'react';
import { RecipientInput } from '../types.ts';
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  Send, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle,
  HelpCircle,
  Layers
} from 'lucide-react';

interface BatchCreatorViewProps {
  onJobCreated: (jobId: string) => void;
}

export const BatchCreatorView: React.FC<BatchCreatorViewProps> = ({ onJobCreated }) => {
  const [title, setTitle] = useState('Advanced Distributed Systems & Cloud Architecture');
  const [instructor, setInstructor] = useState('Dr. Sarah Lin, Principal Architect');
  const [organization, setOrganization] = useState('Institute of Cloud Engineering');
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState(
    'for successfully demonstrating mastery in distributed consensus, fault-tolerant microservices, and high-concurrency systems design.'
  );
  const [isAsync, setIsAsync] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const [recipients, setRecipients] = useState<RecipientInput[]>([
    { name: 'Alex Mercer', email: 'alex.mercer@example.com' },
    { name: 'Jordan Hayes', email: 'jordan.hayes@cloudcorp.org' },
    { name: 'Dr. Elena Vance', email: 'elena.vance@blackmesa.edu' },
    // Intentional failure test cases to demonstrate requirement #5
    { name: '', email: 'missing-name@test.org' },
    { name: 'Taylor Swift', email: 'invalid-email-without-at' },
  ]);

  const loadPreset = (presetType: 'mixed' | 'clean' | 'large') => {
    if (presetType === 'mixed') {
      setTitle('Fault Tolerance & Reliability Engineering');
      setInstructor('Prof. Leslie Lamport');
      setOrganization('Systems Research Institute');
      setRecipients([
        { name: 'Catherine Halsey', email: 'halsey@reach.mil' },
        { name: 'David Bowman', email: 'david.bowman@discovery-one.org' },
        { name: '', email: 'nameless-candidate@domain.com' }, // Invalid name
        { name: 'Arthur Dent', email: 'arthur-dent-not-valid' }, // Invalid email
        { name: 'SIMULATED_RENDER_FAIL', email: 'trigger-render-error@fault.test' }, // Trigger test engine error
        { name: 'Maya Lin', email: 'maya.lin@architecture.org' },
      ]);
    } else if (presetType === 'clean') {
      setTitle('Executive Data Science & Applied Machine Learning');
      setInstructor('Dr. Andrew Ng, Chief AI Scientist');
      setOrganization('AI Frontier Institute');
      setRecipients([
        { name: 'Sophia Chen', email: 'sophia.chen@stanford.alumni.edu' },
        { name: 'Marcus Sterling', email: 'marcus.sterling@fintech.io' },
        { name: 'Liam O\'Connor', email: 'liam.oconnor@dublin-tech.ie' },
        { name: 'Zara Al-Mansoor', email: 'zara.mansoor@gulfresearch.org' },
      ]);
    } else if (presetType === 'large') {
      setTitle('Full-Stack Web & Backend Microservices');
      setInstructor('Prof. Roy Fielding, PhD');
      setOrganization('Open Web Academy');
      const sampleNames = [
        'Aria Stark', 'Tyrion Lannister', 'Jon Snow', 'Brienne Tarth',
        'Samwell Tarly', 'Davos Seaworth', 'Bran Stark', 'Theon Greyjoy',
        'Gendry Baratheon', 'Tormund Giantsbane', 'Bronn Blackwater', 'Jorah Mormont'
      ];
      setRecipients(
        sampleNames.map((n, i) => ({
          name: n,
          email: `${n.toLowerCase().replace(' ', '.')}@westeros-tech.org`,
        }))
      );
    }
  };

  const addRecipientRow = () => {
    setRecipients([...recipients, { name: '', email: '' }]);
  };

  const removeRecipientRow = (index: number) => {
    if (recipients.length <= 1) return;
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const updateRecipient = (index: number, field: 'name' | 'email', value: string) => {
    const updated = [...recipients];
    updated[index] = { ...updated[index], [field]: value };
    setRecipients(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBanner(null);

    if (!title.trim() || !instructor.trim() || !organization.trim()) {
      setErrorBanner('Course title, lead instructor, and organization are all required fields.');
      return;
    }

    if (recipients.length === 0) {
      setErrorBanner('Recipients list cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    try {
      const url = `/api/certificates/generate${isAsync ? '' : '?sync=true'}`;
      const res = await apiFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          instructor_name: instructor.trim(),
          organization_name: organization.trim(),
          issue_date: issueDate,
          description: description.trim(),
          recipients: recipients.map((r) => ({
            name: r.name,
            email: r.email,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.details ? data.details.join('; ') : data.error || 'Failed to submit job');
      }

      const jobId = data.job_id || data.id;
      if (jobId) {
        onJobCreated(jobId);
      }
    } catch (err: any) {
      setErrorBanner(err.message || 'Error communicating with generation API');
    } finally {
      setIsSubmitting(false);
    }
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Create Bulk Certificate Generation Job</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit a bulk batch of recipients for automated validation, isolated failure handling, and PDF issuance.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Load Preset:</span>
          <button
            type="button"
            onClick={() => loadPreset('mixed')}
            className="px-2.5 py-1 text-xs font-medium rounded border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors"
            title="Includes 3 valid recipients and 3 deliberate failures to test isolation"
          >
            Mixed Test Cohort
          </button>
          <button
            type="button"
            onClick={() => loadPreset('clean')}
            className="px-2.5 py-1 text-xs font-medium rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Clean Cohort
          </button>
          <button
            type="button"
            onClick={() => loadPreset('large')}
            className="px-2.5 py-1 text-xs font-medium rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
          >
            12 Recipients
          </button>
        </div>
      </div>

      {errorBanner && (
        <div className="border border-rose-200 bg-rose-50 text-rose-800 rounded-lg p-3 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorBanner}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Certificate Master Info */}
        <div className="border border-slate-200 bg-white rounded-xl p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Certificate Template Parameters</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Course or Event Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Full-Stack Distributed Systems"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Issuing Organization <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="e.g. Stanford School of Engineering"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Lead Instructor / Authorized Signer <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                placeholder="e.g. Dr. Sarah Lin, Principal Architect"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Official Issue Date
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Achievement Text / Citation
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="e.g. for demonstrating excellence in modern architecture..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Recipients Batch Table */}
        <div className="border border-slate-200 bg-white rounded-xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-slate-700" />
                <span>Recipient Manifest ({recipients.length} participants)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Each row is validated individually. Failures are isolated without stopping valid issuances.
              </p>
            </div>

            <button
              type="button"
              onClick={addRecipientRow}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Recipient</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 font-semibold w-12 text-center">#</th>
                  <th className="py-2.5 px-4 font-semibold">Recipient Full Name</th>
                  <th className="py-2.5 px-4 font-semibold">Email Address</th>
                  <th className="py-2.5 px-4 font-semibold w-40">Validation Check</th>
                  <th className="py-2.5 px-4 font-semibold w-16 text-center">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recipients.map((rec, idx) => {
                  const hasNameError = !rec.name.trim() || rec.name.trim().length < 2;
                  const hasEmailError = !rec.email.trim() || !emailRegex.test(rec.email.trim());
                  const isSimulatedFail = rec.name === 'SIMULATED_RENDER_FAIL' || rec.email.includes('trigger-render-error');
                  const willFail = hasNameError || hasEmailError || isSimulatedFail;

                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2 px-4 text-center font-mono text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-4">
                        <input
                          type="text"
                          value={rec.name}
                          onChange={(e) => updateRecipient(idx, 'name', e.target.value)}
                          placeholder="e.g. Johnathan Doe"
                          className={`w-full px-2.5 py-1.5 text-xs border rounded focus:outline-none ${
                            hasNameError ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
                          }`}
                        />
                      </td>
                      <td className="py-2 px-4">
                        <input
                          type="text"
                          value={rec.email}
                          onChange={(e) => updateRecipient(idx, 'email', e.target.value)}
                          placeholder="e.g. recipient@example.com"
                          className={`w-full px-2.5 py-1.5 text-xs border rounded focus:outline-none ${
                            hasEmailError ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
                          }`}
                        />
                      </td>
                      <td className="py-2 px-4">
                        {willFail ? (
                          <div className="flex items-center gap-1.5 text-rose-700 font-medium text-[11px]">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                            <span>
                              {hasNameError
                                ? 'Missing Name'
                                : hasEmailError
                                ? 'Invalid Email'
                                : 'Simulated Error'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-emerald-700 font-medium text-[11px]">
                            <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                            <span>Valid Recipient</span>
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => removeRecipientRow(idx)}
                          disabled={recipients.length <= 1}
                          className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 transition-colors"
                          title="Remove row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
            <span>
              Tip: The "Mixed Test Cohort" deliberately includes invalid rows to prove failure isolation.
            </span>
            <button
              type="button"
              onClick={addRecipientRow}
              className="text-xs font-medium text-slate-900 hover:underline"
            >
              + Add another row
            </button>
          </div>
        </div>

        {/* Execution Mode & Submit Bar */}
        <div className="border border-slate-200 bg-white rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAsync}
                onChange={(e) => setIsAsync(e.target.checked)}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4"
              />
              <span className="text-xs font-medium text-slate-800">
                Asynchronous Background Queue (HTTP 202 Accepted)
              </span>
            </label>
            <span
              className="text-slate-400"
              title="Recommended for large batches. The API returns instantly and worker generates certificates in background."
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-900 bg-amber-400 rounded-lg hover:bg-amber-300 disabled:opacity-50 transition-colors shadow-xs"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                <span>Dispatching Batch...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Submit Generation Request ({recipients.length} Recipients)</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
