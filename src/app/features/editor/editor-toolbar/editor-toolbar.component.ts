import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-editor-toolbar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatSelectModule
  ],
  template: `
    <mat-toolbar color="primary" class="editor-toolbar">
      <div class="left">
        <button mat-icon-button matTooltip="Guardar" (click)="save.emit()">
          <mat-icon>save</mat-icon>
        </button>
        <button mat-icon-button matTooltip="Deshacer" (click)="undo.emit()">
          <mat-icon>undo</mat-icon>
        </button>
        <button mat-icon-button matTooltip="Rehacer" (click)="redo.emit()">
          <mat-icon>redo</mat-icon>
        </button>
        <button mat-icon-button matTooltip="Añadir texto" (click)="addText.emit()">
          <mat-icon>text_fields</mat-icon>
        </button>
        <button mat-icon-button matTooltip="Añadir imagen" (click)="addImage.emit()">
          <mat-icon>image</mat-icon>
        </button>
      </div>
      <div class="right">
        <mat-select [(ngModel)]="zoom" (ngModelChange)="zoomChange.emit($event)" aria-label="Zoom" class="zoom-select">
          <mat-option *ngFor="let level of zoomLevels" [value]="level">{{ level * 100 }}%</mat-option>
        </mat-select>
        <button mat-icon-button matTooltip="Vista previa" (click)="preview.emit()">
          <mat-icon>visibility</mat-icon>
        </button>
        <button mat-icon-button matTooltip="Salir" routerLink="/templates">
          <mat-icon>logout</mat-icon>
        </button>
      </div>
    </mat-toolbar>
  `,
  styles: [
    `
      .editor-toolbar {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
      }
      .left,
      .right {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
      }
      .zoom-select {
        min-width: 120px;
        color: inherit;
      }
    `
  ]
})
export class EditorToolbarComponent {
  @Input() zoom = 1;
  @Output() zoomChange = new EventEmitter<number>();
  @Output() save = new EventEmitter<void>();
  @Output() preview = new EventEmitter<void>();
  @Output() undo = new EventEmitter<void>();
  @Output() redo = new EventEmitter<void>();
  @Output() addText = new EventEmitter<void>();
  @Output() addImage = new EventEmitter<void>();

  protected readonly zoomLevels = [0.25, 0.5, 1, 1.5, 2];
}
