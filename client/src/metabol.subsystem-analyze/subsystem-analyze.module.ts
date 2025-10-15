import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MatRippleModule } from '@angular/material';
import { FileSelectDirective } from 'ng2-file-upload';
import { MatFormFieldModule, MatInputModule , MatSelectModule } from '@angular/material';
import {MatTableModule} from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material';
import { MatAutocompleteModule} from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import {
  ConcentrationTableComponent,
  ManualComponent,
  UploadComponent,
  SampleComponent,
  ExcelComponent,
  SubsystemAnalyzeComponent,
  WelcomeComponent
} from './components';

import { subsystemAnalyzeRouting } from './subsystem-analyze.routes';
import { OmicsSelectionService } from './services/omics-selection.service';

import { MetabolCommonModule } from '../metabol.common';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import { MetabolomicsComponent } from './components/metabolomics/metabolomics.component';
import { TranscriptomicsComponent } from './components/transcriptomics/transcriptomics.component';
import { MetabolomicsMeasurementComponent } from './components/metabolomics-measurement/metabolomics-measurement.component';
import { TranscriptomicsMeasurementComponent } from './components/transcriptomics-measurement/transcriptomics-measurement.component';
import { ProteomicsComponent } from './components/proteomics/proteomics.component';
import { ProteomicsMeasurementComponent } from './components/proteomics-measurement/proteomics-measurement.component';
import { ProteomicsUploadComponent } from './components/proteomics-upload/proteomics-upload.component';
import { MirnaComponent } from './components/mirna/mirna.component';
import { MirnaMeasurementComponent } from './components/mirna-measurement/mirna-measurement.component';
import { MirnaUploadComponent } from './components/mirna-upload/mirna-upload.component';
import { SubmitComponent } from './components/submit/submit.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatSlideToggleModule,
    MatAutocompleteModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatTabsModule,
    MatRippleModule,
    MatProgressSpinnerModule,
    subsystemAnalyzeRouting,
    MetabolCommonModule
  ],
  declarations: [
    ConcentrationTableComponent,
    ManualComponent,
    UploadComponent,
    SampleComponent,
    ExcelComponent,
    SubsystemAnalyzeComponent,
    WelcomeComponent,
    MetabolomicsComponent,
    MetabolomicsMeasurementComponent,
    TranscriptomicsComponent,
    TranscriptomicsMeasurementComponent,
    ProteomicsComponent,
    ProteomicsMeasurementComponent,
    ProteomicsUploadComponent,
    MirnaComponent,
    MirnaMeasurementComponent,
    MirnaUploadComponent,
    SubmitComponent
  ],
  providers: [
    OmicsSelectionService
  ],
  exports: []
})
export class SubsystemAnalyzeModule { }
