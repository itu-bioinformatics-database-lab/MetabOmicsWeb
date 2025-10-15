import { ModuleWithProviders , NgModule} from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import {
  SubsystemDetailComponent,
  SubsystemComponent,
  ReactionDetailsComponent,
  SearchResultComponent,
  SearchPageComponent,
  MetaboliteDetailsComponent,
  AnalysisSearchComponent
} from "./components";

const SearchEngineRoutes: Routes = [
  { path: 'metabolite/:id', component: MetaboliteDetailsComponent },
  { path: 'reaction/:id', component: ReactionDetailsComponent },
  { path: 'search-analysis', component: AnalysisSearchComponent },
  { path: 'search-result/:query', component: SearchResultComponent },
  {
    path: 'subsystem', component: SubsystemComponent,
    children: [{ path: 'detail/:id', component: SubsystemDetailComponent }]
  },
  { path: 'subsystem', component: SubsystemComponent },
];

@NgModule({
  imports: [RouterModule.forChild(SearchEngineRoutes)],
  exports: [RouterModule]
})

export class searchEngineRouting{}
