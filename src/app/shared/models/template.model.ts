export type FieldType = 'text' | 'image';

export interface TemplateField {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  mapField: string;
  fontSize: number;
  color: string;
  type: FieldType;
  fontFamily: string;
  opacity: number;
  backgroundColor: string;
  locked: boolean;
  hidden: boolean;
  value: string | null;
  multiline?: boolean;
}

export interface TemplatePage {
  num: number;
  width?: number;
  height?: number;
  fields: TemplateField[];
}

export interface TemplateModel {
  id: string;
  name: string;
  description: string;
  pdfUrl: string;
  pages: TemplatePage[];
  updatedAt: string;
  createdAt: string;
}

export interface FieldUpdatePayload {
  page: number;
  field: TemplateField;
}
