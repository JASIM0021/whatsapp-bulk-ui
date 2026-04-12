import { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, Download, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isLoading?: boolean;
}

export function FileUpload({ onFileUpload, isLoading }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showTips, setShowTips] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        onFileUpload(file);
      }
    },
    [onFileUpload]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <div
        className={`border-2 border-dashed rounded-lg p-4 sm:p-8 text-center transition-colors ${
          isDragging
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-gray-100 rounded-full">
            <FileSpreadsheet size={48} className="text-gray-600" />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Upload Contacts File
            </h3>
            <p className="text-sm text-gray-600">
              Drag and drop or click to select
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Supports .xlsx, .xls, and .csv files (max 10MB)
            </p>
          </div>

          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            disabled={isLoading}
          />

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <label htmlFor="file-upload" className="inline-block">
              <div className={`inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 px-4 py-2 text-base bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                {isLoading && (
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                {!isLoading && <Upload size={20} className="mr-2" />}
                {isLoading ? 'Processing...' : 'Select File'}
              </div>
            </label>

            <a
              href="/sample-contacts.xlsx"
              download="sample-contacts.xlsx"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Download size={16} />
              Download Sample Template
            </a>
          </div>
        </div>
      </div>

      {/* Tips section */}
      <div className="border border-amber-200 bg-amber-50 rounded-lg overflow-hidden">
        <button
          onClick={() => setShowTips(!showTips)}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-amber-100/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Lightbulb size={18} className="text-amber-600" />
            <span className="text-sm font-semibold text-amber-800">File Format Tips</span>
          </div>
          {showTips ? <ChevronUp size={16} className="text-amber-600" /> : <ChevronDown size={16} className="text-amber-600" />}
        </button>

        {showTips && (
          <div className="px-4 pb-4 border-t border-amber-200">
            <div className="mt-3 space-y-3">
              <p className="text-sm text-amber-900">
                Your file should have columns for <strong>Name</strong> and <strong>Phone</strong> number. Here's how it should look:
              </p>

              {/* Mini table preview */}
              <div className="overflow-hidden rounded-lg border border-amber-300 bg-white">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-amber-100">
                      <th className="px-4 py-2 text-left font-semibold text-amber-900">Name</th>
                      <th className="px-4 py-2 text-left font-semibold text-amber-900">Phone</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100">
                    <tr>
                      <td className="px-4 py-2 text-gray-700">Rahul Sharma</td>
                      <td className="px-4 py-2 text-gray-700 font-mono">919876543210</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-gray-700">Priya Patel</td>
                      <td className="px-4 py-2 text-gray-700 font-mono">918765432109</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-gray-700">Amit Kumar</td>
                      <td className="px-4 py-2 text-gray-700 font-mono">917654321098</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <ul className="space-y-1.5 text-sm text-amber-800">
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">*</span>
                  <span>First row should be headers (Name, Phone/Mobile/Contact/Number)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">*</span>
                  <span>Phone numbers should include country code (e.g. <code className="bg-amber-100 px-1 rounded">91</code> for India)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">*</span>
                  <span>No spaces or special characters needed in phone numbers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">*</span>
                  <span>Accepted formats: <code className="bg-amber-100 px-1 rounded">.xlsx</code>, <code className="bg-amber-100 px-1 rounded">.xls</code>, <code className="bg-amber-100 px-1 rounded">.csv</code></span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
