import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { TemplateField } from '../../shared/models/template.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-field-properties-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSlideToggleModule, MatSelectModule, MatButtonModule],
  template: `
    <div class="p-4 space-y-3" *ngIf="field; else empty">
      <div class="flex items-center justify-between gap-2">
        <h3 class="font-semibold text-lg">Propiedades</h3>
        <button mat-stroked-button color="primary" size="small" (click)="emitUpdate()">Aplicar</button>
      </div>
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Nombre de campo</mat-label>
        <input matInput [(ngModel)]="draft.mapField" />
      </mat-form-field>

      <div class="grid grid-cols-2 gap-3">
        <mat-form-field appearance="outline">
          <mat-label>Color</mat-label>
          <input matInput type="color" [(ngModel)]="draft.color" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Fondo</mat-label>
          <input matInput type="color" [(ngModel)]="draft.backgroundColor" />
        </mat-form-field>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <mat-form-field appearance="outline">
          <mat-label>Tamaño fuente</mat-label>
          <input matInput type="number" min="8" [(ngModel)]="draft.fontSize" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Fuente</mat-label>
          <mat-select [(ngModel)]="draft.fontFamily">
            <mat-option *ngFor="let font of fonts" [value]="font">{{ font }}</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <mat-form-field appearance="outline">
          <mat-label>Opacidad</mat-label>
          <input matInput type="number" min="0" max="1" step="0.1" [(ngModel)]="draft.opacity" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Tamaño</mat-label>
          <div class="flex items-center gap-2">
            <input matInput type="number" placeholder="Ancho" [(ngModel)]="draft.width" />
            <input matInput type="number" placeholder="Alto" [(ngModel)]="draft.height" />
          </div>
        </mat-form-field>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <mat-form-field appearance="outline">
          <mat-label>Posición X</mat-label>
          <input matInput type="number" [(ngModel)]="draft.x" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Posición Y</mat-label>
          <input matInput type="number" [(ngModel)]="draft.y" />
        </mat-form-field>
      </div>

      <div class="flex flex-col gap-2">
        <mat-slide-toggle [(ngModel)]="draft.multiline">Multilínea</mat-slide-toggle>
        <mat-slide-toggle [(ngModel)]="draft.locked">Bloquear</mat-slide-toggle>
        <mat-slide-toggle [(ngModel)]="draft.hidden">Oculto</mat-slide-toggle>
      </div>
    </div>
    <ng-template #empty>
      <div class="p-6 text-sm text-slate-500">Selecciona un campo para editar sus propiedades.</div>
    </ng-template>
  `
})
export class FieldPropertiesPanelComponent implements OnChanges {
  @Input() field: TemplateField | null = null;
  @Output() update = new EventEmitter<TemplateField>();

  draft: TemplateField | null = null;
  readonly fonts = ['standard:roboto', 'standard:arial', 'standard:times', 'standard:mono'];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['field']) {
      this.draft = this.field ? { ...this.field } : null;
    }
  }

  emitUpdate(): void {
    if (this.draft) {
      this.update.emit({ ...this.draft });
    }
  }
}
