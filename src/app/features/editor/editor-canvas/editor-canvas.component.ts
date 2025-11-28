import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import Konva from 'konva';
import { TemplateField } from '../../../shared/models/template.model';

@Component({
  selector: 'app-editor-canvas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="canvas-wrapper" #stageContainer></div>
  `,
  styles: [
    `
      .canvas-wrapper {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 1;
      }
    `
  ]
})
export class EditorCanvasComponent implements AfterViewInit, OnChanges {
  @Input() fields: TemplateField[] = [];
  @Input() width = 0;
  @Input() height = 0;
  @Input() zoom = 1;
  @Input() selectedFieldId: string | null = null;

  @Output() fieldSelected = new EventEmitter<string>();
  @Output() fieldUpdated = new EventEmitter<TemplateField>();

  @ViewChild('stageContainer', { static: true }) stageContainer?: ElementRef<HTMLDivElement>;

  private stage?: Konva.Stage;
  private layer?: Konva.Layer;
  private transformer?: Konva.Transformer;

  ngAfterViewInit(): void {
    this.buildStage();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['width'] || changes['height']) {
      this.resizeStage();
    }

    if ((changes['zoom'] && !changes['zoom'].firstChange) || changes['fields']) {
      this.renderFields();
    }

    if (changes['selectedFieldId'] && this.stage && this.transformer) {
      this.attachTransformer();
    }
  }

  private buildStage(): void {
    if (!this.stageContainer) return;

    if (this.stage) {
      this.stage.destroy();
    }

    this.stage = new Konva.Stage({
      container: this.stageContainer.nativeElement,
      width: this.width,
      height: this.height
    });
    this.stageContainer.nativeElement.style.pointerEvents = 'auto';
    this.layer = new Konva.Layer();
    this.transformer = new Konva.Transformer({
      padding: 6,
      rotateEnabled: false,
      enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
      ignoreStroke: true
    });
    this.layer.add(this.transformer);
    this.stage.add(this.layer);
    this.renderFields();
  }

  private resizeStage(): void {
    if (!this.stage) {
      this.buildStage();
      return;
    }

    this.stage.size({ width: this.width, height: this.height });
    this.renderFields();
  }

  private renderFields(): void {
    if (!this.layer) return;
    this.layer.destroyChildren();
    this.layer.add(this.transformer!);

    this.fields.forEach((field) => this.drawField(field));
    this.attachTransformer();
    this.layer.draw();
  }

  private drawField(field: TemplateField): void {
    if (!this.layer || !this.stageContainer) return;

    const group = new Konva.Group({
      id: field.id,
      x: field.x * this.zoom,
      y: field.y * this.zoom,
      draggable: !field.locked,
      opacity: field.opacity,
      visible: !field.hidden
    });

    const rect = new Konva.Rect({
      width: (field.width || 180) * this.zoom,
      height: (field.height || 28) * this.zoom,
      fill: field.backgroundColor || 'rgba(255,255,255,0.1)',
      cornerRadius: 4
    });

    const text = new Konva.Text({
      text: field.value ?? field.mapField,
      fontSize: field.fontSize * this.zoom,
      fill: field.color,
      fontFamily: field.fontFamily,
      width: rect.width(),
      height: rect.height(),
      padding: 6,
      align: 'left',
      wrap: field.multiline ? 'word' : 'none'
    });

    group.add(rect);
    group.add(text);

    group.on('click tap', () => {
      this.selectedFieldId = field.id;
      this.attachTransformer();
      this.fieldSelected.emit(field.id);
    });

    group.on('dragend', (evt) => {
      const node = evt.target as Konva.Group;
      this.emitUpdate(field, node.x() / this.zoom, node.y() / this.zoom, rect.width() / this.zoom, rect.height() / this.zoom);
    });

    group.on('transformend', (evt) => {
      const node = evt.target as Konva.Group;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      rect.width(rect.width() * scaleX);
      rect.height(rect.height() * scaleY);
      text.width(rect.width());
      text.height(rect.height());
      node.scale({ x: 1, y: 1 });
      this.emitUpdate(
        field,
        node.x() / this.zoom,
        node.y() / this.zoom,
        rect.width() / this.zoom,
        rect.height() / this.zoom
      );
    });

    group.on('dblclick dbltap', () => this.enableInlineEdit(field, group));

    this.layer.add(group);
  }

  private enableInlineEdit(field: TemplateField, group: Konva.Group): void {
    const stage = this.stage;
    const container = this.stageContainer?.nativeElement;
    if (!stage || !container) return;

    const textarea = document.createElement('textarea');
    textarea.value = field.value ?? field.mapField;
    textarea.style.position = 'absolute';
    textarea.style.top = `${group.y()}px`;
    textarea.style.left = `${group.x()}px`;
    textarea.style.width = `${(field.width || 180) * this.zoom}px`;
    textarea.style.height = `${(field.height || 28) * this.zoom}px`;
    textarea.style.fontSize = `${field.fontSize * this.zoom}px`;
    textarea.style.fontFamily = field.fontFamily;
    textarea.style.background = field.backgroundColor || '#fff';
    textarea.style.border = '1px solid var(--mat-sys-primary)';
    textarea.style.padding = '4px 6px';
    textarea.style.zIndex = '10';
    container.appendChild(textarea);
    textarea.focus();

    const finish = () => {
      const newValue = textarea.value;
      container.removeChild(textarea);
      this.emitUpdate(
        { ...field, value: newValue },
        group.x() / this.zoom,
        group.y() / this.zoom,
        (field.width || 180),
        (field.height || 28)
      );
    };

    textarea.addEventListener('blur', finish);
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !field.multiline) {
        e.preventDefault();
        finish();
      }
    });
  }

  private attachTransformer(): void {
    if (!this.transformer || !this.layer) return;
    const node = this.layer.findOne<Konva.Node>(`#${this.selectedFieldId}`);
    if (node) {
      this.transformer.nodes([node as Konva.Node]);
    } else {
      this.transformer.nodes([]);
    }
    this.layer.draw();
  }

  private emitUpdate(field: TemplateField, x: number, y: number, width: number, height: number): void {
    this.fieldUpdated.emit({ ...field, x, y, width, height });
  }
}
