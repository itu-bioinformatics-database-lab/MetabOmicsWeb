import { ModuleWithProviders, NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import {SubsystemAnalyzeRoutes} from './components';

const subsystemRoutes: Routes = [
  ...SubsystemAnalyzeRoutes,
];

@NgModule({
  imports: [RouterModule.forChild(subsystemRoutes)],
  exports: [RouterModule]
})
export class subsystemAnalyzeRouting {}

