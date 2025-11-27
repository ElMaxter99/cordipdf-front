import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import Konva from 'konva';

import { TemplateField, TemplatePage } from '../../core/models/template.model';

export interface CanvasDimensions {
  width: number;
  height: number;
}

@Component({
  selector: 'app-editor-canvas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #stageHost class="editor-stage border border-outline rounded relative overflow-hidden"></div>
  `
})
export class EditorCanvasComponent implements AfterViewInit, OnChanges {
  @Input() page!: TemplatePage;
  @Input() dimensions!: CanvasDimensions;
  @Input() zoom = 1;
  @Input() selectedFieldId?: string;

  @Output() selectField = new EventEmitter<string>();
  @Output() updateField = new EventEmitter<TemplateField>();
  @Output() deleteField = new EventEmitter<string>();

  @ViewChild('stageHost', { static: true }) stageHost!: ElementRef<HTMLDivElement>;

  private stage?: Konva.Stage;
  private layer?: Konva.Layer;
  private transformer?: Konva.Transformer;

  ngAfterViewInit() {
    this.initializeStage();
    this.renderFields();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['dimensions'] || changes['zoom']) && this.stage) {
      this.stage.width(this.dimensions.width * this.zoom);
      this.stage.height(this.dimensions.height * this.zoom);
      this.stage.scale({ x: this.zoom, y: this.zoom });
    }

    if (changes['page'] || changes['selectedFieldId'] || changes['zoom']) {
      this.renderFields();
    }
  }

  private initializeStage() {
    this.stage = new Konva.Stage({
      container: this.stageHost.nativeElement,
      width: this.dimensions.width * this.zoom,
      height: this.dimensions.height * this.zoom,
      draggable: false
    });

    this.stage.scale({ x: this.zoom, y: this.zoom });
    this.layer = new Konva.Layer();
    this.transformer = new Konva.Transformer({
      rotateEnabled: false,
      enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
      anchorSize: 8
    });

    this.layer.add(this.transformer);
    this.stage.add(this.layer);
  }

  private renderFields() {
    if (!this.layer || !this.stage || !this.page) return;
    this.layer.destroyChildren();
    this.layer.add(this.transformer as Konva.Transformer);

    this.page.fields.forEach((field) => {
      if (field.hidden) return;

      const group = new Konva.Group({
        x: field.x,
        y: field.y,
        draggable: !field.locked,
        opacity: field.opacity
      });

      const background = new Konva.Rect({
        width: field.width || 160,
        height: field.height || (field.multiline ? 80 : 40),
        fill: field.backgroundColor,
        cornerRadius: 4,
        opacity: 0.2
      });

      if (field.type === 'text') {
        const text = new Konva.Text({
          text: field.value ?? 'Campo de texto',
          fontSize: field.fontSize,
          fill: field.color,
          width: field.width || 160,
          height: field.height || (field.multiline ? 80 : 40),
          fontFamily: field.fontFamily,
          padding: 6,
          align: 'left',
          listening: true
        });

        group.add(background);
        group.add(text);
      } else {
        const rect = new Konva.Rect({
          width: field.width || 160,
          height: field.height || 120,
          stroke: field.color,
          fill: field.backgroundColor,
          dash: [8, 4]
        });
        const label = new Konva.Text({
          text: 'Campo imagen',
          fontSize: 14,
          fill: field.color,
          padding: 6
        });
        group.add(rect);
        group.add(label);
      }

      group.on('dragend', () => {
        this.emitUpdate(field, group.x(), group.y(), field.width, field.height);
      });

      group.on('dblclick', () => {
        if (field.type === 'text') {
          const newText = prompt('Editar texto', field.value ?? '');
          if (newText !== null) {
            this.emitUpdate({ ...field, value: newText }, group.x(), group.y(), field.width, field.height);
          }
        }
      });

      group.on('click', () => {
        this.selectField.emit(field.id);
        this.transformer?.nodes([group]);
        this.layer?.draw();
      });

      this.layer.add(group);
      if (this.selectedFieldId === field.id) {
        this.transformer.nodes([group]);
      }
    });

    this.layer.draw();
  }

  private emitUpdate(field: TemplateField, x?: number, y?: number, width?: number, height?: number) {
    const updated: TemplateField = {
      ...field,
      x: x ?? field.x,
      y: y ?? field.y,
      width: width ?? field.width,
      height: height ?? field.height
    };
    this.updateField.emit(updated);
  }
}
