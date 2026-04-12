export type TemplateCategory = 'Marketing' | 'Utility' | 'Authentication' | 'Custom';

export interface Template {
  id: number;
  userId: number;
  name: string;
  category: TemplateCategory;
  body: string;
  variables: string[];
  isDefault: boolean;
  createdAt: string;
}

export interface CreateTemplatePayload {
  name: string;
  category: TemplateCategory;
  body: string;
  variables: string[];
}

export interface UpdateTemplatePayload {
  name: string;
  category: TemplateCategory;
  body: string;
  variables: string[];
}
