'use client';

import { useState, useRef } from 'react';

type ImportType = 'companies' | 'people' | 'opportunities' | 'leads' | 'tasks';

export default function CopperImportAllPage() {
  const [loading, setLoading] = useState<Record<ImportType, boolean>>({
    companies: false,
    people: false,
    opportunities: false,
    leads: false,
    tasks: false
  });
  
  const [progress, setProgress] = useState<Record<ImportType, { current: number; total: number; message: string }>>({
    companies: { current: 0, total: 0, message: '' },
    people: { current: 0, total: 0, message: '' },
    opportunities: { current: 0, total: 0, message: '' },
    leads: { current: 0, total: 0, message: '' },
    tasks: { current: 0, total: 0, message: '' }
  });
  
  const [results, setResults] = useState<Record<ImportType, any>>({
    companies: null,
    people: null,
    opportunities: null,
    leads: null,
    tasks: null
  });
  
  const [errors, setErrors] = useState<Record<ImportType, string | null>>({
    companies: null,
    people: null,
    opportunities: null,
    leads: null,
    tasks: null
  });
  
  const [files, setFiles] = useState<Record<ImportType, File | null>>({
    companies: null,
    people: null,
    opportunities: null,
    leads: null,
    tasks: null
  });

  const handleImport = async (type: ImportType, endpoint: string, fileKey: string) => {
    const file = files[type];
    if (!file) {
      setErrors({ ...errors, [type]: 'Please select a file' });
      return;
    }

    setLoading({ ...loading, [type]: true });
    setErrors({ ...errors, [type]: null });
    setResults({ ...results, [type]: null });
    
    // Set initial progress message
    setProgress({
      ...progress,
      [type]: { current: 0, total: 0, message: 'Uploading file...' }
    });

    try {
      const formData = new FormData();
      formData.append(fileKey, file);
      
      // Update progress
      setProgress({
        ...progress,
        [type]: { current: 0, total: 0, message: 'Processing file... Check terminal for detailed progress!' }
      });

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      // Set final progress
      setProgress({
        ...progress,
        [type]: { current: data.count, total: data.count, message: 'Complete!' }
      });

      setResults({ ...results, [type]: data });
      setFiles({ ...files, [type]: null });
    } catch (err: any) {
      setErrors({ ...errors, [type]: err.message });
    } finally {
      setLoading({ ...loading, [type]: false });
    }
  };

  const ImportCard = ({ 
    type, 
    title, 
    description, 
    endpoint, 
    fileKey,
    icon 
  }: { 
    type: ImportType; 
    title: string; 
    description: string; 
    endpoint: string;
    fileKey: string;
    icon: string;
  }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-2">{icon} {title}</h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      
      <div className="space-y-4">
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => setFiles({ ...files, [type]: e.target.files?.[0] || null })}
          disabled={loading[type]}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
        />
        
        {files[type] && (
          <p className="text-sm text-green-600">
            ✅ {files[type]!.name} ({(files[type]!.size / 1024 / 1024).toFixed(1)} MB)
          </p>
        )}
        
        <button
          onClick={() => handleImport(type, endpoint, fileKey)}
          disabled={loading[type] || !files[type]}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading[type] ? '⏳ Importing...' : '📥 Import'}
        </button>
        
        {loading[type] && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-blue-800">
              <span>Progress:</span>
              <span className="font-mono font-semibold">
                {progress[type].current.toLocaleString()} / {progress[type].total.toLocaleString()}
              </span>
            </div>
            {progress[type].total > 0 && (
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(progress[type].current / progress[type].total * 100)}%` }}
                ></div>
              </div>
            )}
            <p className="text-xs text-blue-600">{progress[type].message}</p>
          </div>
        )}
        
        {results[type] && (
          <div className="p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-sm text-green-800 font-semibold">
              ✅ Imported {results[type].count.toLocaleString()} records
            </p>
          </div>
        )}
        
        {errors[type] && (
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-800">❌ {errors[type]}</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            📥 Import All Copper Data
          </h1>
          <a href="/admin" className="text-sm text-kanva-green hover:underline">
            ← Back to Admin
          </a>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>💡 Import Order:</strong> Import Companies first, then People (they link to companies), then Opportunities/Leads/Tasks.
            </p>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>⏱️ Large Imports:</strong> Companies (270K) and People (75K) take 1-3 hours each. 
              Check your terminal/console for detailed progress (batch commits every 100 records).
            </p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              <strong>📁 File Format:</strong> Upload CSV or Excel files. CSV is 10x faster! 
              Convert in Excel: File → Save As → CSV (Comma delimited)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ImportCard
            type="companies"
            title="Companies"
            description="Upload: companies_10.2.csv (or .xlsx) - 270K company records"
            endpoint="/api/copper/import"
            fileKey="companiesFile"
            icon="🏢"
          />
          
          <ImportCard
            type="people"
            title="People / Contacts"
            description="Upload: people_10.2.csv (or .xlsx) - 75K contact records"
            endpoint="/api/copper/import-people"
            fileKey="peopleFile"
            icon="👥"
          />
          
          <ImportCard
            type="opportunities"
            title="Opportunities"
            description="Upload: opportunities_10.2.csv (or .xlsx) - Sales pipeline data"
            endpoint="/api/copper/import-opportunities"
            fileKey="opportunitiesFile"
            icon="💰"
          />
          
          <ImportCard
            type="leads"
            title="Leads"
            description="Upload: leads_10.2.csv (or .xlsx) - Lead records"
            endpoint="/api/copper/import-leads"
            fileKey="leadsFile"
            icon="🎯"
          />
          
          <ImportCard
            type="tasks"
            title="Tasks"
            description="Upload: tasks_10.2.csv (or .xlsx) - Task and activity records"
            endpoint="/api/copper/import-tasks"
            fileKey="tasksFile"
            icon="✅"
          />
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">📊 Import Status</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Companies:</span>
              <span className={results.companies ? 'text-green-600 font-semibold' : 'text-gray-400'}>
                {results.companies ? `✅ ${results.companies.count.toLocaleString()}` : 'Pending'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>People:</span>
              <span className={results.people ? 'text-green-600 font-semibold' : 'text-gray-400'}>
                {results.people ? `✅ ${results.people.count.toLocaleString()}` : 'Pending'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Opportunities:</span>
              <span className={results.opportunities ? 'text-green-600 font-semibold' : 'text-gray-400'}>
                {results.opportunities ? `✅ ${results.opportunities.count.toLocaleString()}` : 'Pending'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Leads:</span>
              <span className={results.leads ? 'text-green-600 font-semibold' : 'text-gray-400'}>
                {results.leads ? `✅ ${results.leads.count.toLocaleString()}` : 'Pending'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Tasks:</span>
              <span className={results.tasks ? 'text-green-600 font-semibold' : 'text-gray-400'}>
                {results.tasks ? `✅ ${results.tasks.count.toLocaleString()}` : 'Pending'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
