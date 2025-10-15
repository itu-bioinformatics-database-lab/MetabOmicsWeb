import { ModuleWithProviders , NgModule} from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from "../metabol.auth";
import {
  PanelComponent,
  ProfileComponent,
  PastAnalysisComponent,
  ChangePasswordComponent,
  PastAnalysisDetailComponent,
  CompareAnalysisComponent,
  SearchAnalysisResultComponent
} from "./components";


const metabolPanelRoutes: Routes = [
  { path: 'panel', redirectTo: 'profile', pathMatch: 'full', canActivate: [AuthGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'past-analysis', component: PastAnalysisComponent },
  { path: 'search-past-analysis/:query', component: PastAnalysisComponent },
  { path: 'past-analysis/:key', component: PastAnalysisDetailComponent },
  { path: 'compare-analysis', component: CompareAnalysisComponent },
  { path: 'search-analysis-result', component: SearchAnalysisResultComponent},
];

@NgModule({
  imports: [RouterModule.forChild(metabolPanelRoutes)],
  exports: [RouterModule]
})

export class MetabolPanelRoutes{}

