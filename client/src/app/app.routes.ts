import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SearchPageComponent } from 'src/metabol.search-engine/components';
import { MainComponent } from './main/main.component';

const appRoutes: Routes = [
    {path: 'documentation', loadChildren: '../documentation/documentation.module#DocumentationModule'},
    {path: 'demo', loadChildren: '../demo/demo.module#DemoModule'},
    {path: 'panel',  loadChildren: '../metabol.panel/metabol.panel.module#MetabolPanelModule'},
    {path: 'auth', loadChildren: '../metabol.auth/metabol.auth.module#MetabolAuthModule'},
    {path: 'search', loadChildren: '../metabol.search-engine#SearchEngineModule'},
    {path: 'main', component: MainComponent},
    {path: '', redirectTo: '/main', pathMatch:'full'}
];

export const appRoutingProviders: any[] = [];

export const routing: ModuleWithProviders = RouterModule.forRoot(appRoutes);
