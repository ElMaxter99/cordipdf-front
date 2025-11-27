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
import { NgIf } from '@angular/common';
import Konva from 'konva';

import { TemplateField } from '../../../core/models/template-field.model';
import { PdfPageView } from '../../../core/models/pdf-page.model';

@Component({
  selector: 'app-editor-canvas',
  standalone: true,
  imports: [NgIf],
  templateUrl: './editor-canvas.component.html',
  styleUrl: './editor-canvas.component.scss'
})
export class EditorCanvasComponent implements AfterViewInit, OnChanges {
  @Input() pages: PdfPageView[] = [];
  @Input() fields: TemplateField[] = [];
  @Input() scale = 1;
  @Input() selectedFieldId?: string;
  @Output() fieldSelected = new EventEmitter<TemplateField>();
  @Output() fieldUpdated = new EventEmitter<TemplateField>();

  @ViewChild('stageHost') stageHost!: ElementRef<HTMLDivElement>;

  private stage?: Konva.Stage;
  private layer?: Konva.Layer;
  private transformer?: Konva.Transformer;
  private pageSpacing = 24;

  ngAfterViewInit(): void {
    this.initializeStage();
    this.render();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['fields'] || changes['pages'] || changes['scale']) && this.stage) {
      this.render();
    }
    if (changes['selectedFieldId'] && this.transformer) {
      this.applySelection();
    }
  }

  private initializeStage(): void {
    if (!this.stageHost) return;
    this.stage = new Konva.Stage({
      container: this.stageHost.nativeElement,
      width: this.getStageWidth(),
      height: this.getStageHeight()
    });
    this.layer = new Konva.Layer();
    this.stage.add(this.layer);
    this.transformer = new Konva.Transformer({ rotateEnabled: false });
    this.layer.add(this.transformer);
  }

  private render(): void {
    if (!this.layer) return;
    this.layer.destroyChildren();
    // re-add transformer
    this.transformer = new Konva.Transformer({ rotateEnabled: false });
    this.layer.add(this.transformer);
    this.stage?.size({ width: this.getStageWidth(), height: this.getStageHeight() });

    for (const field of this.fields.filter((f) => !f.hidden)) {
      const offsetY = this.getPageOffset(field.page);
      const group = new Konva.Group({
        id: field.id,
        x: field.x * this.scale,
        y: (field.y + offsetY) * this.scale,
        draggable: !field.locked
      });
      const rect = new Konva.Rect({
        width: Math.max(40, field.width * this.scale),
        height: Math.max(24, field.height * this.scale),
        fill: field.backgroundColor,
        opacity: field.opacity,
        cornerRadius: 4
      });
      const text = new Konva.Text({
        text: field.value ?? field.mapField,
        fontSize: field.fontSize * this.scale,
        fontFamily: field.fontFamily,
        fill: field.color,
        padding: 6,
        width: Math.max(40, field.width * this.scale),
        height: Math.max(24, field.height * this.scale),
        align: 'left',
        wrap: field.multiline ? 'char' : 'none'
      });

      group.add(rect);
      group.add(text);
      group.on('click', () => this.onSelect(field, group));
      group.on('dragend', () => this.onDragEnd(field, group));
      group.on('transformend', () => this.onResize(field, group, rect, text));
      group.on('dblclick', () => this.onInlineEdit(field, text));
      this.layer.add(group);

      if (field.id === this.selectedFieldId) {
        this.transformer?.nodes([group]);
      }
    }

    this.layer.draw();
  }

  private onSelect(field: TemplateField, group: Konva.Group): void {
    this.selectedFieldId = field.id;
    this.transformer?.nodes([group]);
    this.fieldSelected.emit(field);
  }

  private onDragEnd(field: TemplateField, group: Konva.Group): void {
    const offsetY = this.getPageOffset(field.page);
    const updated: TemplateField = {
      ...field,
      x: group.x() / this.scale,
      y: group.y() / this.scale - offsetY,
      width: group.width() / this.scale,
      height: group.height() / this.scale
    };
    this.fieldUpdated.emit(updated);
  }

  private onResize(
    field: TemplateField,
    group: Konva.Group,
    rect: Konva.Rect,
    text: Konva.Text
  ): void {
    const newWidth = rect.width() * group.scaleX();
    const newHeight = rect.height() * group.scaleY();
    rect.width(newWidth);
    rect.height(newHeight);
    text.width(newWidth);
    text.height(newHeight);
    group.scale({ x: 1, y: 1 });
    const updated: TemplateField = {
      ...field,
      width: newWidth / this.scale,
      height: newHeight / this.scale,
      x: group.x() / this.scale,
      y: group.y() / this.scale - this.getPageOffset(field.page)
    };
    this.fieldUpdated.emit(updated);
    this.layer?.batchDraw();
  }

  private onInlineEdit(field: TemplateField, textNode: Konva.Text): void {
    const newValue = prompt('Editar texto del campo', field.value ?? field.mapField);
    if (newValue !== null) {
      const updated = { ...field, value: newValue };
      textNode.text(newValue);
      this.fieldUpdated.emit(updated);
    }
  }

  getStageWidth(): number {
    return (this.pages[0]?.width ?? 800) * this.scale;
  }

  getStageHeight(): number {
    if (!this.pages.length) return 1200;
    return (
      this.pages.reduce((acc, page) => acc + page.height, 0) +
      (this.pages.length - 1) * this.pageSpacing
    ) * this.scale;
  }

  private getPageOffset(pageNum: number): number {
    const sorted = [...this.pages].sort((a, b) => a.num - b.num);
    let offset = 0;
    for (const page of sorted) {
      if (page.num === pageNum) {
        return offset;
      }
      offset += page.height + this.pageSpacing;
    }
    return 0;
  }

  private applySelection(): void {
    if (!this.layer || !this.transformer) return;
    const group = this.layer.findOne<Konva.Group>((node) => node instanceof Konva.Group && (node as any).attrs.id === this.selectedFieldId);
    if (group) {
      this.transformer.nodes([group]);
      this.layer.draw();
    }
  }
}
