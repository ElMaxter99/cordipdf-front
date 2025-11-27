export type TemplateFieldType = 'text' | 'image';

export interface TemplateField {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
  mapField: string;
  fontSize: number;
  color: string;
  type: TemplateFieldType;
  fontFamily: string;
  opacity: number;
  backgroundColor: string;
  locked: boolean;
  hidden: boolean;
  value: string | null;
  multiline?: boolean;
}
