import { Routes } from '@angular/router';
import { TemplateListComponent } from './features/templates/template-list.component';
import { TemplateDetailComponent } from './features/templates/template-detail.component';
import { TemplateFormComponent } from './features/templates/template-form.component';
import { TemplateEditorComponent } from './features/editor/template-editor.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'templates' },
  { path: 'templates', component: TemplateListComponent },
  { path: 'templates/new', component: TemplateFormComponent },
  { path: 'templates/:id', component: TemplateDetailComponent },
  { path: 'editor/:id', component: TemplateEditorComponent },
  { path: '**', redirectTo: 'templates' }
];
