import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { TemplateField } from '../../core/models/template.model';

@Component({
  selector: 'app-field-properties-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSliderModule,
    MatButtonToggleModule,
    MatSlideToggleModule
  ],
  template: `
    <div class="p-4 space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">Propiedades</h3>
        <button mat-icon-button color="warn" *ngIf="field" (click)="delete.emit(field.id)">
          <mat-icon>delete</mat-icon>
        </button>
      </div>

      <ng-container *ngIf="field; else empty">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Map Field</mat-label>
          <input matInput [(ngModel)]="field.mapField" (ngModelChange)="emit()" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Texto</mat-label>
          <input matInput [(ngModel)]="field.value" (ngModelChange)="emit()" />
        </mat-form-field>

        <div class="grid grid-cols-2 gap-3">
          <mat-form-field appearance="outline">
            <mat-label>Color</mat-label>
            <input matInput type="color" [(ngModel)]="field.color" (ngModelChange)="emit()" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Fondo</mat-label>
            <input matInput type="color" [(ngModel)]="field.backgroundColor" (ngModelChange)="emit()" />
          </mat-form-field>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <mat-form-field appearance="outline">
            <mat-label>Tamaño de fuente</mat-label>
            <input type="number" matInput [(ngModel)]="field.fontSize" (ngModelChange)="emit()" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Fuente</mat-label>
            <mat-select [(ngModel)]="field.fontFamily" (ngModelChange)="emit()">
              <mat-option value="standard:roboto">Roboto</mat-option>
              <mat-option value="serif:times">Times</mat-option>
              <mat-option value="mono:menlo">Monospace</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Opacidad</mat-label>
          <input matInput type="number" step="0.1" min="0" max="1" [(ngModel)]="field.opacity" (ngModelChange)="emit()" />
        </mat-form-field>

        <div class="flex items-center justify-between">
          <mat-slide-toggle [(ngModel)]="field.locked" (ngModelChange)="emit()">Bloquear</mat-slide-toggle>
          <mat-slide-toggle [(ngModel)]="field.hidden" (ngModelChange)="emit()">Ocultar</mat-slide-toggle>
          <mat-slide-toggle [(ngModel)]="field.multiline" (ngModelChange)="emit()">Multilínea</mat-slide-toggle>
        </div>
      </ng-container>

      <ng-template #empty>
        <p class="text-sm text-surface-variant">Selecciona un campo para editar sus propiedades.</p>
      </ng-template>
    </div>
  `
})
export class FieldPropertiesPanelComponent {
  @Input() field?: TemplateField;
  @Output() change = new EventEmitter<TemplateField>();
  @Output() delete = new EventEmitter<string>();

  emit() {
    if (this.field) this.change.emit({ ...this.field });
  }
}
