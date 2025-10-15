import { NgModule } from '@angular/core';
import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import {DemoComponent} from './demo.component';

const demoRoutes: Routes = [
    { path: '', component: DemoComponent },
];

@NgModule({
    imports: [RouterModule.forChild(demoRoutes)],
    exports: [RouterModule]
})
export class DemoRoutingModule { }

