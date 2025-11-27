import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TemplateService } from '../../services/template.service';
import { Template } from '../../shared/models/template.model';

@Component({
  selector: 'app-template-list',
  standalone: true,
  imports: [CommonModule, RouterLink, MatTableModule, MatButtonModule, MatIconModule, MatCardModule, MatTooltipModule, DatePipe],
  template: `
    <mat-card class="page-card">
      <div class="card-header">
        <div>
          <h2>Plantillas PDF</h2>
          <p class="muted">Gestiona tus plantillas, sube nuevos PDFs y edita metadatos.</p>
        </div>
        <div class="actions">
          <a mat-stroked-button color="primary" [routerLink]="['/templates/new']">
            <mat-icon>add</mat-icon>
            Nueva plantilla
          </a>
        </div>
      </div>
      <div class="table-wrapper">
        <table mat-table [dataSource]="templates" class="mat-elevation-z1">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Nombre</th>
            <td mat-cell *matCellDef="let template">
              <div class="cell-title">{{ template.name }}</div>
              <div class="cell-sub">{{ template.description }}</div>
            </td>
          </ng-container>

          <ng-container matColumnDef="updatedAt">
            <th mat-header-cell *matHeaderCellDef>Actualizado</th>
            <td mat-cell *matCellDef="let template">{{ template.updatedAt | date: 'short' }}</td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef class="actions-col"></th>
            <td mat-cell *matCellDef="let template" class="actions-col">
              <a mat-icon-button color="primary" [routerLink]="['/templates', template.id]" matTooltip="Ver detalles">
                <mat-icon>open_in_new</mat-icon>
              </a>
              <a mat-icon-button color="accent" [routerLink]="['/editor', template.id]" matTooltip="Abrir editor">
                <mat-icon>design_services</mat-icon>
              </a>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
        </table>
        <div class="empty-state" *ngIf="templates.length === 0">
          <mat-icon>description</mat-icon>
          <p>No hay plantillas creadas aún.</p>
        </div>
      </div>
    </mat-card>
  `,
  styles: [
    `
      .page-card {
        padding: 1.5rem;
        display: block;
      }
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
      }
      .card-header h2 {
        margin: 0;
      }
      .card-header .muted {
        color: var(--mat-sys-on-surface-variant);
        margin-top: 0.25rem;
      }
      .actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .table-wrapper {
        margin-top: 1rem;
      }
      table {
        width: 100%;
      }
      .cell-title {
        font-weight: 600;
      }
      .cell-sub {
        color: var(--mat-sys-on-surface-variant);
      }
      .actions-col {
        width: 128px;
        text-align: right;
      }
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        padding: 2rem 0;
        color: var(--mat-sys-on-surface-variant);
      }
    `
  ]
})
export class TemplateListComponent implements OnInit {
  protected templates: Template[] = [];
  protected readonly displayedColumns = ['name', 'updatedAt', 'actions'];

  private readonly templateService = inject(TemplateService);

  ngOnInit(): void {
    this.templateService.getAll().subscribe((templates) => (this.templates = templates));
  }
}
