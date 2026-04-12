import { useState, useEffect } from 'react';
import { Template, CreateTemplatePayload, UpdateTemplatePayload } from '@/types/template';
import { API_ENDPOINTS, apiFetch } from '@/config/api';

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiFetch(API_ENDPOINTS.templates.list)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setTemplates(data.data || []);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const createTemplate = async (payload: CreateTemplatePayload): Promise<Template> => {
    const res = await apiFetch(API_ENDPOINTS.templates.create, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to create template');
    const created: Template = data.data;
    setTemplates((prev) => [...prev, created]);
    return created;
  };

  const updateTemplate = async (id: number, payload: UpdateTemplatePayload): Promise<Template> => {
    const res = await apiFetch(API_ENDPOINTS.templates.update(id), {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to update template');
    const updated: Template = data.data;
    setTemplates((prev) => prev.map((t) => (t.id === id ? updated : t)));
    return updated;
  };

  const deleteTemplate = async (id: number): Promise<void> => {
    const res = await apiFetch(API_ENDPOINTS.templates.delete(id), { method: 'DELETE' });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to delete template');
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  return { templates, isLoading, createTemplate, updateTemplate, deleteTemplate };
}
