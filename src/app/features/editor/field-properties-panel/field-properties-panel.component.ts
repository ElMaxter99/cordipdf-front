import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
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
  protected form: FormGroup<FieldForm>;

  constructor(private readonly fb: FormBuilder) {
    this.form = this.fb.group<FieldForm>({
      mapField: new FormControl('', { nonNullable: true }),
      fontFamily: new FormControl(this.fonts[0], { nonNullable: true }),
      fontSize: new FormControl(14, { nonNullable: true }),
      color: new FormControl('#000000', { nonNullable: true }),
      backgroundColor: new FormControl('#ffffff', { nonNullable: true }),
      opacity: new FormControl(1, { nonNullable: true }),
      width: new FormControl(180, { nonNullable: true }),
      height: new FormControl(28, { nonNullable: true }),
      multiline: new FormControl(false, { nonNullable: true }),
      locked: new FormControl(false, { nonNullable: true }),
      hidden: new FormControl(false, { nonNullable: true })
    });
  }

  ngOnChanges(): void {
    if (this.field) {
      this.form.patchValue(this.field);
    }
  }

  save(): void {
    if (!this.field) return;
    const value = this.form.getRawValue();
    const updated: TemplateField = {
      ...this.field,
      ...value,
      fontSize: Number(value.fontSize),
      opacity: Number(value.opacity),
      width: Number(value.width),
      height: Number(value.height)
    } as TemplateField;
    this.updated.emit(updated);
  }
}

type FieldForm = {
  mapField: FormControl<string>;
  fontFamily: FormControl<string>;
  fontSize: FormControl<number>;
  color: FormControl<string>;
  backgroundColor: FormControl<string>;
  opacity: FormControl<number>;
  width: FormControl<number>;
  height: FormControl<number>;
  multiline: FormControl<boolean>;
  locked: FormControl<boolean>;
  hidden: FormControl<boolean>;
};
