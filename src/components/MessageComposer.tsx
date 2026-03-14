import React, { useState, useRef } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Message } from '@/types/message';
import { MessageSquare, Link, Image as ImageIcon, Upload, X } from 'lucide-react';
import { API_BASE_URL } from '@/config/api';

interface MessageComposerProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (message: Message) => void;
  selectedCount: number;
}

export function MessageComposer({
  isOpen,
  onClose,
  onSend,
  selectedCount,
}: MessageComposerProps) {
  const [message, setMessage] = useState<Message>({
    text: '',
    link: '',
    imageUrl: '',
  });
  const [uploadedImage, setUploadedImage] = useState<{
    file: File;
    preview: string;
    path: string;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image must be less than 10MB');
      return;
    }

    setUploadError('');
    setIsUploading(true);

    try {
      // Create preview
      const preview = URL.createObjectURL(file);

      // Upload to backend
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${API_BASE_URL}/api/upload/image`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUploadedImage({
          file,
          preview,
          path: data.filePath,
        });
        // Clear imageUrl if image is uploaded
        setMessage({ ...message, imageUrl: '' });
      } else {
        setUploadError(data.error || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Image upload error:', error);
      setUploadError(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    if (uploadedImage?.preview) {
      URL.revokeObjectURL(uploadedImage.preview);
    }
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = () => {
    if (!message.text.trim()) {
      return;
    }

    // Add uploaded image path to message
    const messageToSend = {
      ...message,
      imagePath: uploadedImage?.path,
    };

    onSend(messageToSend);
    setMessage({ text: '', link: '', imageUrl: '' });
    handleRemoveImage();
    onClose();
  };

  const characterCount = message.text.length;
  const maxCharacters = 1000;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Compose Message" maxWidth="xl">
      <div className="space-y-6">
        {/* Selected contacts info */}
        <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
          <p className="text-sm font-medium text-primary-900">
            Sending to {selectedCount} selected {selectedCount === 1 ? 'contact' : 'contacts'}
          </p>
        </div>

        {/* Message text */}
        <div>
          <label
            htmlFor="message-text"
            className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
          >
            <MessageSquare size={18} />
            Message Text *
          </label>
          <textarea
            id="message-text"
            value={message.text}
            onChange={(e) => setMessage({ ...message, text: e.target.value })}
            placeholder="Enter your message here..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            rows={6}
            maxLength={maxCharacters}
          />
          <div className="flex justify-between mt-1">
            <p className="text-xs text-gray-500">
              Messages will be sent with 3-5 second delays between each
            </p>
            <p className={`text-xs ${characterCount > maxCharacters * 0.9 ? 'text-red-600' : 'text-gray-500'}`}>
              {characterCount} / {maxCharacters}
            </p>
          </div>
        </div>

        {/* Link (optional) */}
        <div>
          <label
            htmlFor="message-link"
            className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
          >
            <Link size={18} />
            Link (Optional)
          </label>
          <input
            id="message-link"
            type="url"
            value={message.link}
            onChange={(e) => setMessage({ ...message, link: e.target.value })}
            placeholder="https://example.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Link will be added at the end of your message
          </p>
        </div>

        {/* Image Upload (optional) */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <ImageIcon size={18} />
            Image (Optional)
          </label>

          {!uploadedImage ? (
            <div className="space-y-3">
              {/* File Upload */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className={`
                    flex items-center justify-center gap-2 w-full px-4 py-3
                    border-2 border-dashed border-gray-300 rounded-lg
                    hover:border-primary-400 hover:bg-primary-50
                    cursor-pointer transition-colors
                    ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <Upload size={18} className="text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {isUploading ? 'Uploading...' : 'Click to upload image'}
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Supports: JPG, PNG, GIF, WebP (max 10MB)
                </p>
              </div>

              {/* OR Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white text-gray-500">OR</span>
                </div>
              </div>

              {/* Image URL */}
              <div>
                <input
                  id="message-image-url"
                  type="url"
                  value={message.imageUrl}
                  onChange={(e) => setMessage({ ...message, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={isUploading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Or paste an image URL
                </p>
              </div>
            </div>
          ) : (
            /* Image Preview */
            <div className="relative border border-gray-300 rounded-lg p-3 bg-gray-50">
              <button
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                type="button"
              >
                <X size={16} />
              </button>
              <div className="flex items-center gap-3">
                <img
                  src={uploadedImage.preview}
                  alt="Preview"
                  className="w-20 h-20 object-cover rounded"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {uploadedImage.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(uploadedImage.file.size / 1024).toFixed(1)} KB
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Uploaded successfully
                  </p>
                </div>
              </div>
            </div>
          )}

          {uploadError && (
            <p className="text-xs text-red-600 mt-1">
              {uploadError}
            </p>
          )}
        </div>

        {/* Preview */}
        {message.text && (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <p className="text-xs font-medium text-gray-600 mb-2">Preview:</p>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                {message.text}
              </p>
              {message.link && (
                <a
                  href={message.link}
                  className="text-sm text-blue-600 hover:underline mt-2 block"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {message.link}
                </a>
              )}
              {(message.imageUrl || uploadedImage) && (
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <ImageIcon size={12} />
                  Image attachment
                </p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSend}
            disabled={!message.text.trim()}
          >
            Send Messages
          </Button>
        </div>
      </div>
    </Modal>
  );
}
