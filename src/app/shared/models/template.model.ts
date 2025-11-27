export type TemplateFieldType = 'text' | 'image';

export interface TemplateField {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  mapField: string;
  fontSize: number;
  color: string;
  type: TemplateFieldType;
  fontFamily: string;
  opacity: number;
  backgroundColor?: string;
  locked: boolean;
  hidden: boolean;
  value?: string | null;
  multiline?: boolean;
}

export interface TemplatePage {
  num: number;
  fields: TemplateField[];
}

export interface Template {
  id: string;
  name: string;
  description: string;
  pdfUrl: string;
  pages: TemplatePage[];
  updatedAt: string;
}

export const FONT_OPTIONS = [
  'standard:roboto',
  'standard:inter',
  'standard:opensans',
  'standard:montserrat',
  'standard:lato'
];
