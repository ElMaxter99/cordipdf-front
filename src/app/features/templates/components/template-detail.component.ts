import { AsyncPipe, DatePipe, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { TemplateService } from '../../../services/template.service';
import { TemplateFormComponent } from './template-form.component';
import { PdfTemplate } from '../../../shared/models/template.model';

@Component({
  selector: 'app-template-detail',
  standalone: true,
  imports: [AsyncPipe, DatePipe, NgIf, RouterLink, MatCardModule, MatButtonModule, MatDividerModule, TemplateFormComponent],
  templateUrl: './template-detail.component.html',
  styleUrl: './template-detail.component.scss'
})
export class TemplateDetailComponent implements OnInit {
  template$!: Observable<PdfTemplate | undefined>;

  constructor(private readonly templateService: TemplateService, private readonly route: ActivatedRoute) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.template$ = this.templateService.getById(id);
  }

  updateTemplate(data: { name: string; description: string; file?: File }): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    const { file, ...changes } = data;
    if (file) {
      this.templateService.uploadPdf(file).subscribe((pdfUrl) => {
        this.templateService.update(id, { ...changes, pdfUrl }).subscribe();
      });
      return;
    }
    this.templateService.update(id, changes).subscribe();
  }
}
