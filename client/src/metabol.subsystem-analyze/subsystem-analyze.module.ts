import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

import { MatRippleModule } from "@angular/material";
import { FileSelectDirective } from "ng2-file-upload";
import {
  MatFormFieldModule,
  MatInputModule,
  MatSelectModule,
} from "@angular/material";
import { MatTableModule } from "@angular/material/table";
import { MatCardModule } from "@angular/material/card";
import { MatTabsModule } from "@angular/material";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";

import {
  ConcentrationTableComponent,
  ManualComponent,
  UploadComponent,
  SampleComponent,
  ExcelComponent,
  SubsystemAnalyzeComponent,
  WelcomeComponent,
  GenomicVariantsComponent,
} from "./components";

import { subsystemAnalyzeRouting } from "./subsystem-analyze.routes";
import { OmicsSelectionService } from "./services/omics-selection.service";

import { MetabolCommonModule } from "../metabol.common";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MetabolomicsComponent } from "./components/metabolomics/metabolomics.component";
import { TranscriptomicsComponent } from "./components/transcriptomics/transcriptomics.component";
import { MetabolomicsMeasurementComponent } from "./components/metabolomics-measurement/metabolomics-measurement.component";
import { ProteomicsComponent } from "./components/proteomics/proteomics.component";
import { MirnaComponent } from "./components/mirna/mirnas.component";
import { SubmitComponent } from "./components/submit/submit.component";
import { EpigenomicsComponent } from "./components/epigenomics/epigenomics.component";
import { GenomicVariantsMeasurementComponent } from "./components/genomic-variants-measurement/genome-variants-measurement.component";
import { EpigenomicsMeasurementComponent } from "./components/epigenomics-measurement/epigenomics-measurement.component";
import { TranscriptomicsMeasurementComponent } from "./components/transcriptomics-measurement/transcriptomics-measurement.component";
import { ProteomicsMeasurementComponent } from "./components/proteomics-measurement/proteomics-measurement.component";
import { MirnaMeasurementComponent } from "./components/mirnas-measurement/mirnas-measurement.component";

@NgModule({
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
    MirnaComponent,
    MirnaMeasurementComponent,
    GenomicVariantsComponent,
    GenomicVariantsMeasurementComponent,
    EpigenomicsComponent,
    EpigenomicsMeasurementComponent,
    SubmitComponent,
  ],
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
    MetabolCommonModule,
  ],
  providers: [OmicsSelectionService],
  exports: [],
})
export class SubsystemAnalyzeModule {}
