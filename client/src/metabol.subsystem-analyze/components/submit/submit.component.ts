import { Component, OnInit, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as _ from 'lodash';

import { LoginService } from "../../../metabol.auth/services";
import { AppSettings } from '../../../app/';
import { Observable } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import synonyms from '../../../assets/datasets/synonyms_latest.json';
import { OmicsSelectionService, OmicsData } from 'src/metabol.subsystem-analyze/services/omics-selection.service';
import { UploadService } from 'src/metabol.subsystem-analyze/services/upload/upload.service';
import { NotificationsService } from 'angular2-notifications';
import { Router } from '@angular/router';

export interface Disease {
  id: number;
  name: string;
  synonym: string;
}

@Component({
  selector: 'app-submit',
  templateUrl: './submit.component.html',
  styleUrls: ['./submit.component.css']
})
export class SubmitComponent implements OnInit {
  @Input() unmappedMetabolites: Array<[string, number, string, string, boolean]> = [];
  @Input() unmappedTranscriptomics: Array<[string, number, string, string, boolean]> = [];
  @Input() currentOmics: string;
  myControl = new FormControl();
  analysisTable: Array<[string, number]> = [];
  previewTable: Array<[string, string, number]> = [];
  public synonymList: [] = synonyms;
  diseases: Disease[] = [];
  filteredOptions: Observable<Disease[]>;


  form: FormGroup;
  analyzeName: FormControl;
  isPublic: FormControl;
  selectedMethod = 0;
  selectedModel = 0;
  analyzeEmail: FormControl;
  Disease: FormControl;
  selected = 'Combined.json';
  currentPage: string = '';

  mConTable = this.uploadService.mConTable;
  tConTable = this.uploadService.tConTable;

  comboboxMethods: Array<object> = [
    { id: 0, name: "Metabolitics" },
    { id: 1, name: "Direct Pathway Mapping" },
    { id: 2, name: "Pathway Enrichment"},
  ];
  methods = {
    Metabolitics: 0,
    DirectPathwayMapping: 1,
    MetaboliteEnrichment: 2,
  };

  comboboxDiffusion: Array<object> = [
    { id: 0, name: "Linear Threshold"}
  ];

  diffusionss = {
    LinearThreshold: 0
  };

  omicsArray: OmicsData[] = [];
  selectedTabIndex = 0;

  constructor(
    private http: HttpClient,
    public login: LoginService,
    private omicsService: OmicsSelectionService,
    public uploadService: UploadService,
    private notify: NotificationsService,
    private router: Router
  ) { }

  ngOnInit() {
    let dateTime = new Date().toLocaleString();
    this.analyzeName = new FormControl("My Analysis - " + dateTime, Validators.required);
    this.isPublic = new FormControl(true, Validators.required);
    this.analyzeEmail = new FormControl("Email", Validators.required);
    this.Disease = new FormControl("Disease/Condition", Validators.required);
    this.fetchDiseases();
    this.filteredOptions = this.myControl.valueChanges
      .pipe(
        startWith(''),
        map(value => typeof value === 'string' ? value : (value.name + value.synonym)),
        map(name => name ? this._filter(name) : this.diseases.slice())
      );
      this.omicsService.selectedOmics$.subscribe(_ => {
        this.omicsArray = this.omicsService.getSelectedOmicsArray();
      });
  
      // Initialize tab index from service
      this.selectedTabIndex = this.omicsService.getCurrentOmicsIndex();
    }
  
    analyze() {
      const selectedMethod = this.selectedMethod;
      const selectedModel = this.selectedModel;
      if(!this.myControl.value){
        alert("Please choose a disease on the top of the page to start analysis.");
        return;
      }
  
      this.mConTable.forEach(metabolite => {
         if (metabolite[4]) {
           this.analysisTable.push([metabolite[2], metabolite[1]]);
         }
      });
      if(this.hasTranscriptomicsSelected()){
        this.tConTable.forEach(transcript => {
          if (transcript[4]) {
            this.analysisTable.push([transcript[2], transcript[1]]);
          }
        });
      }
      console.log(this.analysisTable);
      let data = {}
      if (localStorage.getItem('isMultiple') == 'True') {
  
      }
      else {
        let name = this.analyzeName.value;
        
  
  
        if (this.login.isLoggedIn()) {
          data = {
            "study_name": this.analyzeName.value,
            "public": this.isPublic.value,
            "analysis": { [name]: { "Metabolites": _.fromPairs(this.analysisTable), "Label": "not_provided" } },
            "group": "not_provided",
            "disease": this.myControl.value["id"]
          };
        }  // if
  
  
        else {
          data = {
            "study_name": this.analyzeName.value,
            "public": this.isPublic.value,
            "analysis": { [name]: { "Metabolites": _.fromPairs(this.analysisTable), "Label": "not_provided" } },
            "group": "not_provided",
            "disease": this.myControl.value["id"],
            "email": this.analyzeEmail.value
          };
        } // inner else
  
  
      }  // else
      // console.log(data);
  
      if(selectedModel === this.diffusionss.LinearThreshold) {
        this.linearthreshold(data);
      }
      if (selectedMethod === this.methods.Metabolitics) {
        this.metabolitics(data);
      }
      else if (selectedMethod === this.methods.DirectPathwayMapping) {
        this.directPathwayMapping(data);
      }
      else if (selectedMethod === this.methods.MetaboliteEnrichment) {
        this.metaboliteEnrichment(data);
      }
    }

    linearthreshold(data) {

      if (this.login.isLoggedIn()) {
        this.http.post(`${AppSettings.API_ENDPOINT}/analysis/linearthreshold`, data, this.login.optionByAuthorization())
      } // if
      else {
        this.http.post(`${AppSettings.API_ENDPOINT}/analysis/linearthreshold/public`,data)
      }
    }

    metabolitics(data) {

      if (this.login.isLoggedIn()) {
        this.notify.info('Analysis Start', 'Analysis in progress');
        this.http.post(`${AppSettings.API_ENDPOINT}/analysis/fva`,
          data, this.login.optionByAuthorization())
          .subscribe((data: any) => {
            this.router.navigate(['/panel/past-analysis'])
          },
            error => {
              this.notify.error('Analysis Fail', error);
            });
      } // if
      else {
        this.http.post(`${AppSettings.API_ENDPOINT}/analysis/fva/public`,
          data)
          .subscribe((data: any) => {
            this.notify.info('Analysis Start', 'Results will be sent by email.');
            this.router.navigate(['/search']);
          },
            error => {
              this.notify.error('Analysis Fail', error);
            });
  
      }
  
    }
  
    directPathwayMapping(data) {
  
      if (this.login.isLoggedIn()) {
        this.notify.info('Analysis Start', 'Analysis in progress');
        this.http.post(`${AppSettings.API_ENDPOINT}/analysis/direct-pathway-mapping`,
          data, this.login.optionByAuthorization())
          .subscribe((data: any) => {
            this.router.navigate(['/panel/past-analysis'])
          },
            error => {
              this.notify.error('Analysis Fail', error);
            });
  
        localStorage.setItem('search-results', JSON.stringify(data));
      } // if
      else {
        this.http.post(`${AppSettings.API_ENDPOINT}/analysis/direct-pathway-mapping/public`,
          data, this.login.optionByAuthorization())
          .subscribe((data: any) => {
            this.notify.info('Analysis Start', 'Analysis in progress');
            this.notify.success('Analysis Done', 'Analysis Results sent to your email');
            this.router.navigate(['/search']);
          },
            error => {
              this.notify.error('Analysis Fail', error);
            });
  
        localStorage.setItem('search-results', JSON.stringify(data));
  
      }
  
    }
  
    metaboliteEnrichment(data) {
      if (this.login.isLoggedIn()) {
        this.notify.info('Analysis Start', 'Analysis in progress');
        this.http.post(`${AppSettings.API_ENDPOINT}/analysis/pathway-enrichment`,
          data, this.login.optionByAuthorization())
          .subscribe((data: any) => {
            this.router.navigate(['/panel/past-analysis'])
          },
            error => {
              this.notify.error('Analysis Fail', error);
            });
  
        localStorage.setItem('search-results', JSON.stringify(data));
      } 
      else {
        this.http.post(`${AppSettings.API_ENDPOINT}/analysis/pathway-enrichment/public`,
          data, this.login.optionByAuthorization())
          .subscribe((data: any) => {
            this.notify.info('Analysis Start', 'Analysis in progress');
            this.notify.success('Analysis Done', 'Analysis Results sent to your email');
            this.router.navigate(['/search']);
          },
            error => {
              this.notify.error('Analysis Fail', error);
            });
  
        localStorage.setItem('search-results', JSON.stringify(data));
  
      }
    }
  
  hasTranscriptomicsSelected(): boolean {
    return this.omicsArray.some(o => o.type === 'Transcriptomics');
  }

  // Helpers adapted for submit view (derived from concentration-table helpers)
  private getActiveOmicsType(): string {
    const byTab = this.omicsArray && this.omicsArray[this.selectedTabIndex]
      ? this.omicsArray[this.selectedTabIndex].type
      : undefined;
    return byTab || this.currentOmics || 'Metabolomics';
  }

  getMappedLabel(): string {
    switch (this.getActiveOmicsType()) {
      case 'Transcriptomics': return 'Number of Mapped Genes';
      case 'Proteomics': return 'Number of Mapped Proteins';
      case 'miRNA': return 'Number of Mapped miRNAs';
      case 'Genomic Variants': return 'Number of Mapped Variants';
      case 'Epigenomics': return 'Number of Mapped Epigenomic Features';
      default: return 'Number of Mapped Metabolites';
    }
  }

  getMappedCount(): number {
    // Determine current tab's omics type using selectedTabIndex
    const current = (this.omicsArray && this.omicsArray[this.selectedTabIndex]) ? this.omicsArray[this.selectedTabIndex].type : undefined;
    if (!current) { return 0; }
    
    let activeTable;
    switch(current) {
      case 'Metabolomics': activeTable = this.uploadService.mConTable; break;
      case 'Transcriptomics': activeTable = this.uploadService.tConTable; break;
      case 'Proteomics': activeTable = this.uploadService.pConTable; break;
      case 'miRNA': activeTable = this.uploadService.mrConTable; break;
      case 'Genomic Variants': activeTable = this.uploadService.gvConTable; break;
      case 'Epigenomics': activeTable = this.uploadService.epConTable; break;
      default: return 0;
    }
    
    const total = (activeTable && activeTable.length) ? activeTable.length : 0;
    const unmapped = (activeTable || []).filter((m) => m[4] === false).length;
    return Math.max(total - unmapped, 0);
  }

  getUnmappedLabel(): string {
    switch (this.getActiveOmicsType()) {
      case 'Transcriptomics': return 'Genes';
      case 'Proteomics': return 'Proteins';
      case 'miRNA': return 'miRNAs';
      case 'Genomic Variants': return 'Variants';
      case 'Epigenomics': return 'Epigenomic Features';
      default: return 'Metabolites';
    }
  }

  getUnmappedCount(): number {
    const current = (this.omicsArray && this.omicsArray[this.selectedTabIndex]) ? this.omicsArray[this.selectedTabIndex].type : undefined;
    if (!current) { return 0; }
    
    // Calculate directly from the table to match pie chart logic
    let activeTable;
    switch(current) {
      case 'Metabolomics': activeTable = this.uploadService.mConTable; break;
      case 'Transcriptomics': activeTable = this.uploadService.tConTable; break;
      case 'Proteomics': activeTable = this.uploadService.pConTable; break;
      case 'miRNA': activeTable = this.uploadService.mrConTable; break;
      case 'Genomic Variants': activeTable = this.uploadService.gvConTable; break;
      case 'Epigenomics': activeTable = this.uploadService.epConTable; break;
      default: return 0;
    }
    
    return (activeTable || []).filter((m) => m[4] === false).length;
  }

  getListTitle(): string {
    switch (this.getActiveOmicsType()) {
      case 'Metabolomics': return 'Metabolite List';
      case 'Transcriptomics': return 'Transcriptome List';
      case 'Proteomics': return 'Proteome List';
      case 'miRNA': return 'miRNA List';
      case 'Genomic Variants': return 'Genomic Variants List';
      case 'Epigenomics': return 'Epigenomic Features List';
    }
  }

  getNamePlaceholder(): string {
    switch (this.getActiveOmicsType()) {
      case 'Metabolomics': return 'Metabolite Name';
      case 'Transcriptomics': return 'Gene Name';
      case 'Proteomics': return 'Protein Name';
      case 'miRNA': return 'miRNA Name';
      case 'Genomic Variants': return 'Variant Name';
      case 'Epigenomics': return 'Epigenomic Feature Name';
    }
  }

  onTabChange() {
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 0);
  }

  //TODO: Find a way of moving this function to the services. Otherwise it looks spaghetti.
  fetchDiseases() {
    this.http.get(`${AppSettings.API_ENDPOINT}/diseases/all`, this.login.optionByAuthorization())

      .subscribe((data: any) => {
        data.forEach(element => {
          this.diseases.push({ id: element['id'], name: element['name'], synonym: element['synonym'] })
        });

      });
  }

  private _filter(name: string): Disease[] {
      const filterValue = name.toLowerCase();
  
      return this.diseases.filter(option => option.name.toLowerCase().indexOf(filterValue) === 0 || option.synonym.toLowerCase().indexOf(filterValue) === 0);
  }

  //TODO: Add data change functions here for different tabs.

}

