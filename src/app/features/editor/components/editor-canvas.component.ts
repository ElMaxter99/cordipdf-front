import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import Konva from 'konva';
import { TemplateField } from '../../../shared/models/template.model';

@Component({
  selector: 'app-editor-canvas',
  standalone: true,
  templateUrl: './editor-canvas.component.html',
  styleUrl: './editor-canvas.component.scss'
})
export class EditorCanvasComponent implements AfterViewInit, OnChanges {
  @Input() pageNum!: number;
  @Input() width = 0;
  @Input() height = 0;
  @Input() scale = 1;
  @Input() fields: TemplateField[] = [];
  @Input() selectedFieldId?: string;

  @Output() selectField = new EventEmitter<TemplateField>();
  @Output() fieldsChange = new EventEmitter<TemplateField[]>();

  @ViewChild('stageContainer') stageContainer!: ElementRef<HTMLDivElement>;

  private stage?: Konva.Stage;
  private layer?: Konva.Layer;
  private transformer?: Konva.Transformer;

  ngAfterViewInit(): void {
    this.buildStage();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['scale'] && this.stage && this.layer) {
      this.stage.width(this.width * this.scale);
      this.stage.height(this.height * this.scale);
      this.stage.scale({ x: this.scale, y: this.scale });
      this.redraw();
    }
    if (changes['fields'] && this.layer) {
      this.redraw();
    }
  }

  private buildStage(): void {
    if (!this.stageContainer) return;
    this.stage = new Konva.Stage({
      container: this.stageContainer.nativeElement,
      width: this.width * this.scale,
      height: this.height * this.scale,
      draggable: false
    });
    this.layer = new Konva.Layer();
    this.transformer = new Konva.Transformer({
      rotateEnabled: false,
      enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right']
    });
    this.layer.add(this.transformer);
    this.stage.add(this.layer);
    this.stage.scale({ x: this.scale, y: this.scale });
    this.redraw();
  }

  private redraw(): void {
    if (!this.layer) return;
    this.layer.destroyChildren();
    if (this.transformer) {
      this.layer.add(this.transformer);
    }

    for (const field of this.fields) {
      const group = new Konva.Group({
        x: field.x,
        y: field.y,
        width: field.width,
        height: field.height,
        draggable: !field.locked,
        opacity: field.opacity,
        visible: !field.hidden,
        name: field.id
      });

      const rect = new Konva.Rect({
        width: field.width,
        height: field.height,
        fill: field.backgroundColor,
        cornerRadius: 4
      });

      const text = new Konva.Text({
        text: field.value ?? field.mapField,
        fontSize: field.fontSize,
        fontFamily: field.fontFamily,
        fill: field.color,
        width: field.width,
        height: field.height,
        align: 'left',
        verticalAlign: 'middle',
        padding: 6,
        wrap: field.multiline ? 'word' : 'none'
      });

      group.add(rect);
      group.add(text);

      group.on('dragend', () => {
        field.x = group.x();
        field.y = group.y();
        this.emitChange();
      });

      group.on('click tap', () => this.handleSelect(field, group));
      group.on('dblclick dbltap', () => this.handleInlineEdit(field, text));

      this.layer?.add(group);

      if (this.selectedFieldId === field.id) {
        this.attachTransformer(group);
      }
    }

    this.layer.draw();
  }

  private handleSelect(field: TemplateField, group: Konva.Group): void {
    this.selectedFieldId = field.id;
    this.attachTransformer(group);
    this.selectField.emit(field);
  }

  private attachTransformer(target: Konva.Node): void {
    if (!this.transformer || !this.layer) return;
    this.transformer.nodes([target]);
    this.transformer.on('transformend', () => {
      const node = this.transformer?.nodes()[0];
      if (!node) return;
      const field = this.fields.find((f) => f.id === node.name());
      if (!field) return;
      field.width = node.width() * node.scaleX();
      field.height = node.height() * node.scaleY();
      node.scaleX(1);
      node.scaleY(1);
      this.emitChange();
    });
    this.layer.draw();
  }

  private handleInlineEdit(field: TemplateField, textNode: Konva.Text): void {
    const current = field.value ?? field.mapField;
    const value = prompt('Editar texto', current);
    if (value !== null) {
      field.value = value;
      textNode.text(value);
      this.emitChange();
    }
  }

  private emitChange(): void {
    this.fieldsChange.emit(structuredClone(this.fields));
  }
}
