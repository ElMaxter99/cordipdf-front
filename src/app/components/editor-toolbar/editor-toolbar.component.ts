import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-editor-toolbar',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, MatSelectModule, MatTooltipModule],
  template: `
    <mat-toolbar color="primary" class="sticky top-0 z-40">
      <div class="flex items-center gap-3 w-full">
        <button mat-icon-button aria-label="Volver" (click)="exit.emit()" matTooltip="Volver">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <span class="font-semibold text-lg flex-1 truncate" [matTooltip]="title">{{ title }}</span>
        <button mat-icon-button (click)="toggleTheme.emit()" matTooltip="Cambiar tema">
          <mat-icon>dark_mode</mat-icon>
        </button>
        <button mat-icon-button color="accent" (click)="save.emit()" matTooltip="Guardar (Ctrl+S)">
          <mat-icon>save</mat-icon>
        </button>
        <button mat-icon-button (click)="undo.emit()" [disabled]="!canUndo" matTooltip="Deshacer">
          <mat-icon>undo</mat-icon>
        </button>
        <button mat-icon-button (click)="redo.emit()" [disabled]="!canRedo" matTooltip="Rehacer">
          <mat-icon>redo</mat-icon>
        </button>
        <button mat-button color="primary" (click)="addField.emit('text')" matTooltip="Añadir campo de texto">
          <mat-icon>text_fields</mat-icon>
          Texto
        </button>
        <button mat-button (click)="addField.emit('image')" matTooltip="Añadir imagen">
          <mat-icon>image</mat-icon>
          Imagen
        </button>
        <mat-select
          [value]="zoom"
          class="w-28"
          (valueChange)="zoomChange.emit($event)"
          disableOptionCentering
        >
          <mat-option *ngFor="let option of zoomOptions" [value]="option">{{ option }}%</mat-option>
        </mat-select>
      </div>
    </mat-toolbar>
  `,
  styles: [``]
})
export class EditorToolbarComponent {
  @Input() title = '';
  @Input() zoom = 100;
  @Input() canUndo = false;
  @Input() canRedo = false;
  @Output() save = new EventEmitter<void>();
  @Output() undo = new EventEmitter<void>();
  @Output() redo = new EventEmitter<void>();
  @Output() addField = new EventEmitter<'text' | 'image'>();
  @Output() zoomChange = new EventEmitter<number>();
  @Output() toggleTheme = new EventEmitter<void>();
  @Output() exit = new EventEmitter<void>();

  readonly zoomOptions = [25, 50, 100, 150, 200];
}
