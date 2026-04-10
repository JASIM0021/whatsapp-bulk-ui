interface TemplatePreviewProps {
  text: string;
}

export function TemplatePreview({ text }: TemplatePreviewProps) {
  if (!text) {
    return (
      <div className="rounded-xl bg-[#e5ddd5] p-4 min-h-[120px] flex items-center justify-center">
        <p className="text-gray-400 text-sm italic">Preview will appear here</p>
      </div>
    );
  }

  // Render text with {{variable}} as orange italic and URLs as blue underline
  const renderText = (rawText: string) => {
    const parts = rawText.split(/({{[^}]+}}|https?:\/\/\S+)/g);
    return parts.map((part, i) => {
      if (/^{{[^}]+}}$/.test(part)) {
        return (
          <span key={i} className="text-orange-500 italic font-medium">
            {part}
          </span>
        );
      }
      if (/^https?:\/\//.test(part)) {
        return (
          <span key={i} className="text-blue-600 underline break-all">
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="rounded-xl bg-[#e5ddd5] p-4">
      <div className="max-w-xs ml-auto">
        <div
          className="bg-[#dcf8c6] rounded-lg rounded-br-none px-3 py-2 shadow-sm text-sm text-gray-900 whitespace-pre-wrap break-words leading-relaxed"
          style={{ minWidth: '120px' }}
        >
          {renderText(text)}
          <div className="text-right mt-1">
            <span className="text-xs text-gray-500">10:30 AM</span>
          </div>
        </div>
      </div>
    </div>
  );
}
