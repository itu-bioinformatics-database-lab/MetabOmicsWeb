import { SampleComponent } from "./sample/sample.component";
import { Routes } from "@angular/router";

import { AuthGuard } from "../../metabol.auth";

import { ConcentrationTableComponent } from "./concentration-table";
import { ManualComponent } from "./manual/manual.component";
import { UploadComponent } from "./upload/upload.component";
import { SubsystemAnalyzeComponent } from "./subsystem-analyze.component";
import { ExcelComponent } from "./Excel";
import { WelcomeComponent } from "./welcome/welcome.component";
import { MetabolomicsComponent } from "./metabolomics/metabolomics.component";
import { TranscriptomicsComponent } from "./transcriptomics/transcriptomics.component";
import { TranscriptomicsMeasurementComponent } from "./transcriptomics-measurement/transcriptomics-measurement.component";
import { MetabolomicsMeasurementComponent } from "./metabolomics-measurement/metabolomics-measurement.component";
import { ProteomicsComponent } from "./proteomics/proteomics.component";
import { MirnaComponent } from "./mirna/mirnas.component";
import { SubmitComponent } from "./submit/submit.component";
import { GenomicVariantsComponent } from "./genomic-variants/genomic-variants.component";
import { EpigenomicsComponent } from "./epigenomics/epigenomics.component";
import { GenomicVariantsMeasurementComponent } from "./genomic-variants-measurement/genome-variants-measurement.component";
import { EpigenomicsMeasurementComponent } from "./epigenomics-measurement/epigenomics-measurement.component";
import { ProteomicsMeasurementComponent } from "./proteomics-measurement/proteomics-measurement.component";
import { MirnaMeasurementComponent } from "./mirnas-measurement/mirnas-measurement.component";

export const SubsystemAnalyzeRoutes: Routes = [
  {
    path: "analyze",
    component: SubsystemAnalyzeComponent,
    children: [
      { path: "welcome", component: WelcomeComponent },
      { path: "manual", component: ManualComponent },
      { path: "upload", component: UploadComponent },
      { path: "sample", component: SampleComponent },
      { path: "excel-data", component: ExcelComponent },
      { path: "metabolomics", component: MetabolomicsComponent },
      { path: "transcriptomics", component: TranscriptomicsComponent },
      {
        path: "transcriptomics-measurement",
        component: TranscriptomicsMeasurementComponent,
      },
      {
        path: "metabolomics-measurement",
        component: MetabolomicsMeasurementComponent,
      },
      { path: "genomic-variants", component: GenomicVariantsComponent },
      {
        path: "genomic-variants-measurement",
        component: GenomicVariantsMeasurementComponent,
      },
      { path: "epigenomics", component: EpigenomicsComponent },
      {
        path: "epigenomics-measurement",
        component: EpigenomicsMeasurementComponent,
      },
      {
        path: "proteomics-measurement",
        component: ProteomicsMeasurementComponent,
      },
      { path: "proteomics", component: ProteomicsComponent },
      { path: "mirnas", component: MirnaComponent },
      { path: "mirnas-measurement", component: MirnaMeasurementComponent },
      { path: "", redirectTo: "welcome", pathMatch: "full" },
      { path: "submit", component: SubmitComponent },
    ],
    canActivate: [AuthGuard],
  },
];
