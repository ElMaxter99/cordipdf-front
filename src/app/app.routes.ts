import { Routes } from '@angular/router';
import { TemplateListComponent } from './features/templates/components/template-list.component';
import { TemplateDetailComponent } from './features/templates/components/template-detail.component';
import { TemplateEditorComponent } from './features/editor/template-editor.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'templates' },
  { path: 'templates', component: TemplateListComponent },
  { path: 'templates/:id', component: TemplateDetailComponent },
  { path: 'editor/:id', component: TemplateEditorComponent },
  { path: '**', redirectTo: 'templates' }
];
