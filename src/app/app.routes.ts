import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'templates' },
  {
    path: 'templates',
    loadComponent: () => import('./features/templates/templates-shell.component').then((m) => m.TemplatesShellComponent)
  },
  {
    path: 'templates/:id',
    loadComponent: () => import('./features/templates/template-detail.component').then((m) => m.TemplateDetailComponent)
  },
  {
    path: 'editor/:id',
    loadComponent: () => import('./features/editor/editor-page.component').then((m) => m.EditorPageComponent)
  },
  { path: '**', redirectTo: 'templates' }
];
