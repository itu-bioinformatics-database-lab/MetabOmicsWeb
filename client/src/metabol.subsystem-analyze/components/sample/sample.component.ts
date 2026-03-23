import { AppDataLoader } from './../../../metabol.common/services/data-loader/data-loader.service';
import { HttpClient } from "@angular/common/http";
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import synonyms from '../../../assets/datasets/synonyms_latest.json';
import uniprot_synonym_mapping from '../../../assets/datasets/uniprot_synonym_mapping.json';
import graph from '../../../assets/datasets/universalGraph_new.json';
import { OmicsSelectionService, OmicsData } from '../../services/omics-selection.service';
import { UploadService } from '../../services/upload/upload.service';

// Map of omics type to its sample JSON file path.
// Only types that have a dedicated sample file are listed; others fall back gracefully.
const SAMPLE_DATA_FILES: { [type: string]: string } = {
  'Metabolomics': 'assets/example-analyze-doc-files/example_metabolitic.json',
  'Transcriptomics': 'assets/example-analyze-doc-files/example_transcriptomic.json',
};

@Component({
  selector: 'app-sample',
  templateUrl: 'sample.component.html',
  styleUrls: ['sample.component.css'],
})
export class SampleComponent implements OnInit {

  mConTable: Array<[string, number, string, string, boolean]> = [];
  unmappedMetabolites: Array<[string, number, string, string, boolean]> = [];
  public synonymList: [] = synonyms;
  selectedOmics: OmicsData[] = [];
  loading: boolean = false;

  /** The omics type being handled on this visit to the sample page. */
  currentOmicsType: string = 'Metabolomics';
  hasSampleFile: boolean = true;

  constructor(
    private http: HttpClient,
    private loader: AppDataLoader,
    private router: Router,
    private omicsService: OmicsSelectionService,
    public uploadService: UploadService
  ) { }

  ngOnInit() {
    this.selectedOmics = this.omicsService.getSelectedOmicsArray();
    if (this.selectedOmics.length === 0) {
      this.router.navigate(['/analyze/welcome']);
      return;
    }

    // Initialize omics vector if not already initialized
    if (this.uploadService.omicsVector.length === 0) {
      this.uploadService.initializeOmicsVector();
    }

    // Determine which omics type is active RIGHT NOW
    const current = this.omicsService.getCurrentOmics();
    this.currentOmicsType = (current && current.type) ? current.type : 'Metabolomics';
    this.hasSampleFile = !!SAMPLE_DATA_FILES[this.currentOmicsType];

    // Point the local table reference at the correct service table
    this.mConTable = this.getActiveTable();

    if (this.hasSampleFile) {
      this.loadSampleDataSet(this.currentOmicsType);
    }
  }

  /** Returns the upload-service table for the active omics type. */
  private getActiveTable(): Array<[string, number, string, string, boolean]> {
    switch (this.currentOmicsType) {
      case 'Metabolomics':   return this.uploadService.mConTable;
      case 'Transcriptomics': return this.uploadService.tConTable;
      case 'Proteomics':     return this.uploadService.pConTable;
      case 'miRNAs':         return this.uploadService.mrConTable;
      case 'Epigenomics':    return this.uploadService.epConTable;
      default:               return this.uploadService.mConTable;
    }
  }

  loadSampleDataSet(omicsType: string) {
    this.loading = true;
    const filePath = SAMPLE_DATA_FILES[omicsType];
    this.http.get(filePath).subscribe((data: any) => {
      if (omicsType === 'Metabolomics') {
        this.loader.get('Recon3D', (recon) => {
          for (let key in data) {
            const change = data[key];
            if (recon.metabolites[key]) {
              this.uploadService.mConTable.push([key, change, recon.metabolites[key].id, recon.metabolites[key].name, true]);
            } else if (this.synonymList[key]) {
              const name = this.prioritizeMetabolites(this.synonymList[key]);
              if (recon.metabolites[name]) {
                this.uploadService.mConTable.push([key, change, name, recon.metabolites[name].name, true]);
              } else {
                this.uploadService.mConTable.push([key, change, name, name, true]);
              }
            } else {
              this.uploadService.mConTable.push([key, change, '-', '-', false]);
            }
          }
          this.unmappedMetabolites = this.uploadService.mConTable.filter(m => m[4] === false);
          this.mConTable = this.uploadService.mConTable;
          this.loading = false;
        });
      } else if (omicsType === 'Transcriptomics') {
        for (let gene in data) {
          const value = data[gene];
          const uniprots = uniprot_synonym_mapping[gene];
          if (!uniprots) {
            if ((graph as any).vertices[gene]) {
              this.uploadService.tConTable.push([gene, Number(value), (graph as any).vertices[gene].label || gene, gene, true]);
            } else {
              this.uploadService.tConTable.push([gene, Number(value), '-', '-', false]);
            }
          } else {
            let matched = false;
            for (const uniprot_id of uniprots) {
              const transcript_id = uniprot_id + '_transcript';
              const transcript_id_x = transcript_id + '_x';
              if ((graph as any).vertices[transcript_id]) {
                this.uploadService.tConTable.push([gene, Number(value), (graph as any).vertices[transcript_id].label || gene, transcript_id, true]);
                matched = true;
                break;
              } else if ((graph as any).vertices[transcript_id_x]) {
                this.uploadService.tConTable.push([gene, Number(value), (graph as any).vertices[transcript_id_x].label || gene, transcript_id_x, true]);
                matched = true;
                break;
              }
            }
            if (!matched) {
              this.uploadService.tConTable.push([gene, Number(value), '-', '-', false]);
            }
          }
        }
        this.mConTable = this.uploadService.tConTable;
        this.loading = false;
      } else {
        this.loading = false;
      }
    });
  }

  prioritizeMetabolites(metaboliteList) {
    let is_c_found = false;
    let is_m_found = false;
    let recon_name = '';
    metaboliteList.forEach(metabolite => {
      if (/_c/.test(metabolite) && !is_c_found) { recon_name = metabolite; is_c_found = true; }
    });
    if (!is_c_found) {
      metaboliteList.forEach(metabolite => {
        if (/_m/.test(metabolite) && !is_m_found) { recon_name = metabolite; is_m_found = true; }
      });
    }
    if (!is_c_found && !is_m_found) {
      recon_name = metaboliteList[this.getRandomInt(0, metaboliteList.length - 1)];
    }
    return recon_name;
  }

  getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  onBackClick() {
    // Go back to the measurement page for the current omics type
    const path = this.currentOmicsType === 'Metabolomics'
      ? '/analyze/metabolomics-measurement'
      : `/analyze/${this.currentOmicsType.toLowerCase().replace(/\s+/g, '-')}-measurement`;
    this.router.navigate([path]);
  }

  get isCurrentTableEmpty(): boolean {
    return !this.mConTable || this.mConTable.length === 0;
  }

  canProceed(): boolean {
    return !this.isCurrentTableEmpty;
  }

  getContinueButtonText(): string {
    return this.uploadService.getContinueButton();
  }

  onContinue() {
    if (!this.isCurrentTableEmpty) {
      // Mark the CURRENT omics type (not always Metabolomics) as having data
      this.omicsService.updateOmicsData(this.currentOmicsType, { fileName: 'Sample Data' });
    }
    // Proceed through the sequential upload flow
    this.uploadService.proceed(this.currentOmicsType);
  }
}
