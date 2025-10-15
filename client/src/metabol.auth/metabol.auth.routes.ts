import { ModuleWithProviders, NgModule} from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import {LoginRoutes, SignupRoutes} from './components'

export const AuthRoutes: Routes = [
  ...LoginRoutes,
  ...SignupRoutes,
];

@NgModule({
  imports: [RouterModule.forChild(AuthRoutes)],
  exports: [RouterModule]
})

export class AuthRoutesRouting{}
