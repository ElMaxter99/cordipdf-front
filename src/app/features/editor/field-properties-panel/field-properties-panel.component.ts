import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { TemplateField, FONT_OPTIONS } from '../../../shared/models/template.model';

@Component({
  selector: 'app-field-properties-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatButtonModule
  ],
  template: `
    <div class="panel" *ngIf="field; else empty">
      <h3>Propiedades</h3>
      <form [formGroup]="form" (ngSubmit)="save()">
        <mat-form-field appearance="fill">
          <mat-label>Texto</mat-label>
          <input matInput formControlName="mapField" />
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>Fuente</mat-label>
          <mat-select formControlName="fontFamily">
            <mat-option *ngFor="let font of fonts" [value]="font">{{ font }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>Tamaño</mat-label>
          <input matInput type="number" min="6" formControlName="fontSize" />
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>Color</mat-label>
          <input matInput type="color" formControlName="color" />
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>Fondo</mat-label>
          <input matInput type="color" formControlName="backgroundColor" />
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>Opacidad</mat-label>
          <input matInput type="number" step="0.1" min="0" max="1" formControlName="opacity" />
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>Ancho</mat-label>
          <input matInput type="number" min="20" formControlName="width" />
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>Alto</mat-label>
          <input matInput type="number" min="20" formControlName="height" />
        </mat-form-field>

        <mat-slide-toggle formControlName="multiline">Multilínea</mat-slide-toggle>
        <mat-slide-toggle formControlName="locked">Bloquear</mat-slide-toggle>
        <mat-slide-toggle formControlName="hidden">Ocultar</mat-slide-toggle>

        <div class="actions">
          <button mat-flat-button color="primary" type="submit">Aplicar</button>
        </div>
      </form>
    </div>
    <ng-template #empty>
      <div class="panel empty">Selecciona un campo para editar sus propiedades</div>
    </ng-template>
  `,
  styles: [
    `
      .panel {
        display: block;
        padding: 1rem;
        background: var(--mat-sys-surface-container-highest);
        border-radius: 0.75rem;
        height: 100%;
        overflow: auto;
      }
      form {
        display: grid;
        gap: 0.5rem;
      }
      .actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 0.75rem;
      }
      .empty {
        color: var(--mat-sys-on-surface-variant);
        text-align: center;
      }
    `
  ]
})
export class FieldPropertiesPanelComponent implements OnChanges {
  @Input() field: TemplateField | null = null;
  @Output() updated = new EventEmitter<TemplateField>();

  protected readonly fonts = FONT_OPTIONS;
  protected form: ReturnType<FormBuilder['nonNullable']['group']>;

  constructor(private readonly fb: FormBuilder) {
    this.form = this.fb.nonNullable.group({
      mapField: '',
      fontFamily: this.fonts[0],
      fontSize: 14,
      color: '#000000',
      backgroundColor: '#ffffff',
      opacity: 1,
      width: 180,
      height: 28,
      multiline: false,
      locked: false,
      hidden: false
    });
  }

  ngOnChanges(): void {
    if (this.field) {
      this.form.patchValue(this.field);
    }
  }

  save(): void {
    if (!this.field) return;
    const updated: TemplateField = {
      ...this.field,
      ...this.form.value,
      fontSize: Number(this.form.value.fontSize),
      opacity: Number(this.form.value.opacity),
      width: Number(this.form.value.width),
      height: Number(this.form.value.height)
    } as TemplateField;
    this.updated.emit(updated);
  }
}
