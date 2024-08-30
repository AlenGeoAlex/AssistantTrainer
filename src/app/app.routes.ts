import { Routes } from "@angular/router";

export const routes: Routes = [
    {
        path: 'storage',
        loadComponent: () => import('./components/pages/storage/storage.component').then(m => m.StorageComponent)
    },
    {
        path: 'local',
        loadComponent: () => import('./components/pages/local/local.component').then(m => m.LocalComponent)
    },
    {
        path: '',
        redirectTo: '/storage',
        pathMatch: 'full'
    }
];
