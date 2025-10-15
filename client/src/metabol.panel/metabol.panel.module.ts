//import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { SubsystemAnalyzeModule } from "../metabol.subsystem-analyze";
import { VisualizationModule } from '../metabol.visualization';
import { MatSelectModule } from '@angular/material/select';
import { NgPipesModule } from 'ngx-pipes';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatRippleModule } from '@angular/material';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';

import { MatTabsModule} from '@angular/material';
import {MatExpansionModule} from '@angular/material/expansion';

import {MatListModule} from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material'; 


import {
  PanelComponent,
  ProfileComponent,
  PastAnalysisComponent,
  ChangePasswordComponent,
  PastAnalysisDetailComponent,
  CompareAnalysisComponent,
  DialogPathwayVisualizationComponent,
  DialogReactionResultsComponent,
  ResultTableComponent,
  SimilarDiseasesComponent,
  DiseasePredictionComponent,
  AnalysisListComponent,
  SearchAnalysisResultComponent,

} from "./components";

import { LoginService } from '../metabol.auth/services/login/login.service';

import { MetabolPanelRoutes } from './metabol.panel.routes';
import { from } from 'rxjs';

@NgModule({
  declarations: [
    PanelComponent,
    ProfileComponent,
    ChangePasswordComponent,
    PastAnalysisComponent,
    PastAnalysisDetailComponent,
    CompareAnalysisComponent,
    DialogPathwayVisualizationComponent,
    DialogReactionResultsComponent,
    ResultTableComponent,
    SimilarDiseasesComponent,
    DiseasePredictionComponent,
    AnalysisListComponent,
    SearchAnalysisResultComponent,
  ],

  imports: [
    MatListModule,
    MatExpansionModule,
    CommonModule,

    ReactiveFormsModule,
    FormsModule,
    MatTabsModule,
    MatSelectModule,
    NgPipesModule,
    MatRippleModule,
    FlexLayoutModule,
    NgxPaginationModule,
    NgxDatatableModule,

    MetabolPanelRoutes,
    SubsystemAnalyzeModule,
    VisualizationModule,
    MatProgressSpinnerModule,

  ],
  providers: [
    LoginService,
  ],
  entryComponents: [
    DialogPathwayVisualizationComponent,
    DialogReactionResultsComponent
  ]
})
export class MetabolPanelModule { }
