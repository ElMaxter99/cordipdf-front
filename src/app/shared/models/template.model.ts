export type FieldType = 'text' | 'image';

export interface TemplateField {
  id: string;
  type: FieldType;
  mapField: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  color: string;
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
  fields: TemplateField[];
}

export interface PdfTemplate {
  id: string;
  name: string;
  description: string;
  pdfUrl: string;
  pages: TemplatePage[];
  updatedAt: string;
  createdAt: string;
}

export interface SavePayload {
  pages: Array<{
    num: number;
    fields: Array<{
      x: number;
      y: number;
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
    }>;
  }>;
}
