import { TemplateField } from './template-field.model';

export interface Template {
  id: string;
  name: string;
  description: string;
  pdfUrl: string;
  updatedAt: string;
  pages: number;
  fields: TemplateField[];
}
