import { SampleComponent } from "./sample/sample.component";
import { Routes } from '@angular/router';

import { AuthGuard } from "../../metabol.auth";

import { ConcentrationTableComponent } from './concentration-table';
import { ManualComponent } from './manual/manual.component';
import { UploadComponent } from './upload/upload.component';
import { SubsystemAnalyzeComponent } from './subsystem-analyze.component';
import { ExcelComponent } from './Excel';
import { WelcomeComponent } from './welcome/welcome.component';
import { MetabolomicsComponent } from './metabolomics/metabolomics.component';
import { TranscriptomicsComponent } from './transcriptomics/transcriptomics.component';
import { MetabolomicsMeasurementComponent } from './metabolomics-measurement/metabolomics-measurement.component';
import { ProteomicsComponent } from './proteomics/proteomics.component';
import { MirnaComponent } from './mirna/mirna.component';
import { SubmitComponent } from "./submit/submit.component";

export const SubsystemAnalyzeRoutes: Routes = [
  {
    path: 'analyze',
    component: SubsystemAnalyzeComponent,
    children: [
      { path: 'welcome', component: WelcomeComponent },
      { path: 'manual', component: ManualComponent },
      { path: 'upload', component: UploadComponent },
      { path: 'sample', component: SampleComponent },
      { path: 'excel-data', component: ExcelComponent },
      { path: 'metabolomics', component: MetabolomicsComponent },
      { path: 'transcriptomics', component: TranscriptomicsComponent },
      { path: 'metabolomics-measurement', component: MetabolomicsMeasurementComponent },
      { path: 'proteomics', component: ProteomicsComponent },
      { path: 'mirnas', component: MirnaComponent },
      { path: '', redirectTo: 'welcome', pathMatch: 'full' },
      { path: 'submit', component: SubmitComponent }
    ],
    canActivate: [AuthGuard]
  }
];
