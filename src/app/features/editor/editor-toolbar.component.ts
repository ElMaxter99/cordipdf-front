import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-editor-toolbar',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatButtonToggleModule, MatTooltipModule],
  template: `
    <div class="flex flex-wrap items-center gap-2">
      <button mat-flat-button color="primary" matTooltip="Guardar (Ctrl+S)" (click)="save.emit()">
        <mat-icon>save</mat-icon>
        Guardar plantilla
      </button>

      <button mat-stroked-button matTooltip="Deshacer" (click)="undo.emit()">
        <mat-icon>undo</mat-icon>
      </button>
      <button mat-stroked-button matTooltip="Rehacer" (click)="redo.emit()">
        <mat-icon>redo</mat-icon>
      </button>

      <button mat-stroked-button matTooltip="Añadir campo texto" (click)="addField.emit('text')">
        <mat-icon>title</mat-icon>
      </button>
      <button mat-stroked-button matTooltip="Añadir campo imagen" (click)="addField.emit('image')">
        <mat-icon>image</mat-icon>
      </button>

      <mat-button-toggle-group [value]="zoom" (valueChange)="zoomChange.emit($event)">
        <mat-button-toggle *ngFor="let level of zoomLevels" [value]="level">{{ level * 100 | number : '1.0-0' }}%</mat-button-toggle>
      </mat-button-toggle-group>
    </div>
  `
})
export class EditorToolbarComponent {
  @Input() zoom = 1;
  @Output() save = new EventEmitter<void>();
  @Output() addField = new EventEmitter<'text' | 'image'>();
  @Output() undo = new EventEmitter<void>();
  @Output() redo = new EventEmitter<void>();
  @Output() zoomChange = new EventEmitter<number>();

  readonly zoomLevels = [0.25, 0.5, 1, 1.5, 2];
}
