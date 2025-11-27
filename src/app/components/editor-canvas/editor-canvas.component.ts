import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgxKonvaModule } from 'ngx-konva';
import { TemplateField } from '../../shared/models/template.model';
import Konva from 'konva';

@Component({
  selector: 'app-editor-canvas',
  standalone: true,
  imports: [NgxKonvaModule],
  template: `
    <div class="relative bg-slate-50 rounded-lg shadow-inner" [style.width.px]="stageWidth" [style.height.px]="stageHeight">
      <ko-stage [config]="stageConfig" (click)="clearSelection()">
        <ko-layer>
          <ng-container *ngFor="let field of fields">
            <ko-group
              [config]="fieldConfig(field)"
              (click)="select(field, $event)"
              (dragend)="onDragEnd(field, $event)"
              (transformend)="onTransform(field, $event)"
            >
              <ko-rect
                [config]="{
                  width: field.width || 180,
                  height: field.height || (field.multiline ? 120 : 40),
                  fill: field.backgroundColor,
                  opacity: field.opacity,
                  cornerRadius: 4,
                  stroke: selectedField?.id === field.id ? '#3f51b5' : '#94a3b8',
                  dash: field.locked ? [6, 4] : [],
                  strokeWidth: 1
                }"
              ></ko-rect>
              <ko-text
                [config]="{
                  text: field.mapField,
                  fill: field.color,
                  fontSize: field.fontSize,
                  fontFamily: field.fontFamily,
                  width: field.width || 180,
                  height: field.height || (field.multiline ? 120 : 40),
                  align: 'left',
                  verticalAlign: 'middle'
                }"
                (dblclick)="editInline(field)"
              ></ko-text>
            </ko-group>
          </ng-container>
          <ko-transformer
            *ngIf="selectedField"
            [config]="{ nodes: [selectedNode].filter(Boolean) }"
            #transformer
          ></ko-transformer>
        </ko-layer>
      </ko-stage>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
    `
  ]
})
export class EditorCanvasComponent {
  @Input() fields: TemplateField[] = [];
  @Input() pageWidth = 800;
  @Input() pageHeight = 1100;
  @Input() zoom = 100;
  @Output() selectField = new EventEmitter<TemplateField>();
  @Output() changeField = new EventEmitter<TemplateField>();

  selectedField: TemplateField | null = null;
  selectedNode: Konva.Node | null = null;

  get stageWidth(): number {
    return this.pageWidth * this.zoom;
  }

  get stageHeight(): number {
    return this.pageHeight * this.zoom;
  }

  get stageConfig() {
    return {
      width: this.stageWidth,
      height: this.stageHeight,
      draggable: false,
      scaleX: this.zoom,
      scaleY: this.zoom
    };
  }

  fieldConfig(field: TemplateField) {
    return {
      x: field.x,
      y: field.y,
      draggable: !field.locked && !field.hidden,
      id: field.id,
      opacity: field.hidden ? 0.3 : 1
    } as Konva.ContainerConfig;
  }

  select(field: TemplateField, event: any): void {
    event.cancelBubble = true;
    this.selectedField = field;
    this.selectField.emit(field);
    this.selectedNode = event.target.getParent();
  }

  clearSelection(): void {
    this.selectedField = null;
    this.selectedNode = null;
  }

  onDragEnd(field: TemplateField, event: any): void {
    const { x, y } = event.target.position();
    this.emitChange({ ...field, x: x / this.zoom, y: y / this.zoom });
  }

  onTransform(field: TemplateField, event: any): void {
    const node = event.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const width = (field.width || 180) * scaleX;
    const height = (field.height || (field.multiline ? 120 : 40)) * scaleY;
    node.scaleX(1);
    node.scaleY(1);
    this.emitChange({ ...field, width: width / this.zoom, height: height / this.zoom });
  }

  editInline(field: TemplateField): void {
    const value = prompt('Editar texto de muestra', field.mapField);
    if (value !== null) {
      this.emitChange({ ...field, mapField: value });
    }
  }

  private emitChange(field: TemplateField): void {
    this.changeField.emit(field);
  }
}
