import { Component, OnInit, Input, AfterViewInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as _ from 'lodash';

import { LoginService } from "../../../metabol.auth/services";
import { MetaboliteConcentration } from '../../models/metaboliteConcentration';
import { SubsystemAnalyzeService } from "../../services/subsystem-analyze/subsystem-analyze.service";
import { AppSettings } from '../../../app/';
import { NotificationsService } from 'angular2-notifications';
import { AppDataLoader } from '../../../metabol.common/services';
import { Observable } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import synonyms from '../../../assets/datasets/synonyms_latest.json';
import { OmicsSelectionService } from 'src/metabol.subsystem-analyze/services/omics-selection.service';
import { UploadService } from 'src/metabol.subsystem-analyze/services/upload/upload.service';

export interface Disease {
  id: number;
  name: string;
  synonym: string;
}

declare var Plotly: any;

@Component({
  selector: 'concentration-table',
  templateUrl: 'concentration-table.component.html',
  styleUrls: ['concentration-table.component.css'],
  providers: [SubsystemAnalyzeService],
})
export class ConcentrationTableComponent implements OnInit, AfterViewInit {
  // Original name - change - recon_metabolite_name - recon_id
  @Input() mConTable: Array<[string, number, string, string, boolean]> = [];
  @Input() tConTable: Array<[string, number, string, string, boolean]> = [];
  @Input() pConTable: Array<[string, number, string, string, boolean]> = [];
  @Input() mrConTable: Array<[string, number, string, string, boolean]> = [];
  @Input() gvConTable: Array<[string, number, string, string, boolean]> = [];
  @Input() epConTable: Array<[string, number, string, string, boolean]> = [];
  @Input() unmappedMetabolites: Array<[string, number, string, string, boolean]> = [];
  @Input() unmappedTranscriptomics: Array<[string, number, string, string, boolean]> = [];
  @Input() currentOmics: string;
  myControl = new FormControl();
  analysisTable: Array<[string, number]> = [];
  previewTable: Array<[string, string, number]> = [];
  public synonymList: [] = synonyms;
  diseases: Disease[] = [];
  filteredOptions: Observable<Disease[]>;

  data;
  isMapped = true;

  form: FormGroup;
  analyzeName: FormControl;
  isPublic: FormControl;
  selectedMethod = 0;
  selectedModel = 0;
  analyzeEmail: FormControl;
  Disease: FormControl;
  selected = 'Combined.json';
  currentPage: string = '';

  comboboxMethods: Array<object> = [
    { id: 0, name: "Metabolitics" },
    { id: 1, name: "Direct Pathway Mapping" },
    { id: 2, name: "Pathway Enrichment"},
    { id: 3, name: "Linear Threshold"}
  ];
  methods = {
    Metabolitics: 0,
    DirectPathwayMapping: 1,
    MetaboliteEnrichment: 2,
  };

  chartId: string = 'chart-' + Math.random().toString(36).substr(2, 9);

  constructor(
    public uploadService: UploadService,
    public omicsService: OmicsSelectionService,
    private fb: FormBuilder,
    private subSerivce: SubsystemAnalyzeService,
    private router: Router,
    public login: LoginService,
    private http: HttpClient,
    private notify: NotificationsService,
    private loader: AppDataLoader) { }

  ngOnInit() {
    let dateTime = new Date().toLocaleString();
    
    // Initialize currentOmics if not provided
    if (!this.currentOmics) {
      this.currentOmics = this.omicsService.getCurrentOmics().type;
    }
    
    
    this.form = this.createForm();
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
    this.updatePieChart();
  }

  ngAfterViewInit() {
    // Defer to ensure DOM is painted
    setTimeout(() => this.updatePieChart(), 0);
  }

  @HostListener('window:resize')
  onResize() {
    this.updatePieChart();
  }

  ngOnChanges(){
    this.updatePieChart();
  }

  fetchDiseases() {
    this.http.get(`${AppSettings.API_ENDPOINT}/diseases/all`, this.login.optionByAuthorization())

      .subscribe((data: any) => {
        data.forEach(element => {
          this.diseases.push({ id: element['id'], name: element['name'], synonym: element['synonym'] })
        });

      });
  }
  displayFn(disease?: Disease): string | undefined {
    return disease ? disease.name : undefined;
  }
  private _filter(name: string): Disease[] {
    const filterValue = name.toLowerCase();

    return this.diseases.filter(option => option.name.toLowerCase().indexOf(filterValue) === 0 || option.synonym.toLowerCase().indexOf(filterValue) === 0);
  }

  remove(index) {
    switch(this.currentOmics){
      case 'Metabolomics':
        this.mConTable.splice(index, 1);
        break;
      case 'Transcriptomics':
        this.tConTable.splice(index, 1);
        break;
      case 'Proteomics':
        this.pConTable.splice(index, 1);
        break;
      case 'miRNA':
        this.mrConTable.splice(index, 1);
        break;
      case 'Genomic Variants':
        this.gvConTable.splice(index, 1);
        break;
      case 'Epigenomics':
        this.epConTable.splice(index, 1);
        break;
    }
    this.updatePieChart();
  }

  updatePieChart() {
    const activeTable = this.getActiveTable();
    const labels = this.getPieChartLabels();
    const unmappedCount = (activeTable || []).filter((m) => m[4] === false).length;
    
    if (!activeTable || activeTable.length === 0) {
      return; // Don't render chart if no data
    }
    
    var data = [{
      values: [activeTable.length - unmappedCount, unmappedCount],
      labels: labels,
      type: 'pie'
    }];
  
    var layout = {
      height: 250,
      margin: {
        t: 10,
        b: 10,
      },
    };
  
    const el = document.getElementById(this.chartId);
    if (!el) { return; }
    Plotly.react(el, data, layout);
  }

  private getPieChartLabels(): string[] {
    switch(this.currentOmics) {
      case 'Metabolomics': return ['Mapped Metabolites', 'Unmapped Metabolites'];
      case 'Transcriptomics': return ['Mapped Genes', 'Unmapped Genes'];
      case 'Proteomics': return ['Mapped Proteins', 'Unmapped Proteins'];
      case 'miRNA': return ['Mapped miRNAs', 'Unmapped miRNAs'];
      case 'Genomic Variants': return ['Mapped Variants', 'Unmapped Variants'];
      case 'Epigenomics': return ['Mapped Epigenomic Features', 'Unmapped Epigenomic Features'];
      default: return ['Mapped Items', 'Unmapped Items'];
    }
  }

  createForm() {
    return this.fb.group({
      "name": ["", Validators.required],
      "value": ["", Validators.pattern('[0-9]+(\\.[0-9]+)?')]
    });
  }

  onSubmit(value) {
    this.loader.get('Recon3D', (recon) => {
      if (recon.metabolites[value['name']]) {
        // tslint:disable-next-line:max-line-length
        this.mConTable.push([value['name'], value['value'], recon.metabolites[value['name']].id, recon.metabolites[value['name']].name, true]);
        this.notify.success('Metabolite successfully added with matching', 'Success');
      } else {
        if (this.synonymList[value['name']]) {
          let name = this.prioritizeMetabolites(this.synonymList[value['name']]);
          if (recon.metabolites[name]){
            this.mConTable.push([value['name'], value['value'], name, recon.metabolites[name].name, true]);
          } else {
            this.mConTable.push([value['name'], value['value'], name, name, true]);
          }
          this.notify.success('Metabolite successfully added with matching', 'Success');
        } else {
          this.mConTable.push([value['name'], value['value'], '-', '-', false]);
          this.notify.info("Metabolite successfully added but it has no matching", 'Info');
        }
      }
    });
    this.updatePieChart();
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

  prioritizeMetabolites(metaboliteList) {
    let is_c_found = false;
    let is_m_found = false;
    let recon_name = "";
    metaboliteList.forEach(metabolite => {
      if (/_c/.test(metabolite) && !is_c_found) {
        recon_name = metabolite;
        is_c_found = true;
      }
    });
    if (!is_c_found) {
      metaboliteList.forEach(metabolite => {
        if (/_m/.test(metabolite) && !is_m_found) {
          recon_name = metabolite;
          is_m_found = true;
        }
      });
    }
    if (!is_c_found && !is_m_found) {
      const randomNumber = this.getRandomInt(0, metaboliteList.length - 1);
      recon_name = metaboliteList[randomNumber];
    }
    return recon_name;
  }

  getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
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
  
  shouldShowOptions(): boolean {
    const selectedOmics = this.omicsService.getSelectedOmicsArray();
    const currentOmics = this.omicsService.getCurrentOmics();
    // Handle null currentOmics
    if (!currentOmics) {
      return false;
    }
    
    // Only show options if we're on the last selected omics type
    const lastSelectedOmics = selectedOmics[selectedOmics.length - 1];
    return currentOmics.type === lastSelectedOmics.type;
  }

  downloadCSV() {
    if (this.currentOmics !== 'Transcriptomics') {
      return;
    }

    // Filter only matched genes (where r[4] is true)
    const matchedGenes = this.tConTable.filter(gene => gene[4]);
    
    if (matchedGenes.length === 0) {
      this.notify.info('No matched genes to download', 'Info');
      return;
    }

    // Create CSV content
    const csvContent = [
      ['Original Name', 'Change Value', 'TRRUST Name', 'TRRUST ID']
    ];
    
    matchedGenes.forEach(gene => {
      csvContent.push([
        gene[0], // Original Name
        gene[1].toString(), // Change Value
        gene[2], // TRRUST Name
        gene[3]  // TRRUST ID
      ]);
    });
    
    const csvString = csvContent.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    // Create and download the file
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `matched_genes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.notify.success(`Downloaded ${matchedGenes.length} matched genes`, 'Success');
  }

  // Helper methods for template optimization
  getMappedLabel(): string {
    switch(this.currentOmics) {
      case 'Transcriptomics': return 'Number of Mapped Genes';
      case 'Proteomics': return 'Number of Mapped Proteins';
      case 'miRNA': return 'Number of Mapped miRNAs';
      case 'Genomic Variants': return 'Number of Mapped Variants';
      case 'Epigenomics': return 'Number of Mapped Epigenomic Features';
      default: return 'Number of Mapped Metabolites';
    }
  }

  private getActiveTable(): Array<[string, number, string, string, boolean]> {
    switch(this.currentOmics) {
      case 'Metabolomics': return this.mConTable;
      case 'Transcriptomics': return this.tConTable;
      case 'Proteomics': return this.pConTable;
      case 'miRNA': return this.mrConTable;
      case 'Genomic Variants': return this.gvConTable;
      case 'Epigenomics': return this.epConTable;
      default: return this.mConTable;
    }
  }

  getMappedCount(): number {
    const activeTable = this.getActiveTable();
    const unmappedCount = (activeTable || []).filter((m) => m[4] === false).length;
    return (activeTable || []).length - unmappedCount;
  }

  getUnmappedLabel(): string {
    switch(this.currentOmics) {
      case 'Transcriptomics': return 'Genes';
      case 'Proteomics': return 'Proteins';
      case 'miRNA': return 'miRNAs';
      case 'Genomic Variants': return 'Variants';
      case 'Epigenomics': return 'Epigenomic Features';
      default: return 'Metabolites';
    }
  }

  private getTableByType(omicsType: string): Array<[string, number, string, string, boolean]> {
    switch(omicsType) {
      case 'Metabolomics': return this.mConTable;
      case 'Transcriptomics': return this.tConTable;
      case 'Proteomics': return this.pConTable;
      case 'miRNA': return this.mrConTable;
      case 'Genomic Variants': return this.gvConTable;
      case 'Epigenomics': return this.epConTable;
      default: return this.mConTable;
    }
  }

  getUnmappedCount(dataType?: string): number {
    const omicsType = dataType || this.currentOmics;
    
    // Fall back to calculating directly from the table (preferred method)
    const activeTable = this.getTableByType(omicsType);
    return (activeTable || []).filter((m) => m[4] === false).length;
  }

  getListTitle(): string {
    switch(this.currentOmics) {
      case 'Metabolomics': return 'Metabolite List';
      case 'Transcriptomics': return 'Transcriptome List';
      case 'Proteomics': return 'Proteome List';
      case 'miRNA': return 'miRNA List';
      case 'Genomic Variants': return 'Genomic Variants List';
      case 'Epigenomics': return 'Epigenomic Features List';
    }
  }

  getNamePlaceholder(): string {
    switch(this.currentOmics) {
      case 'Metabolomics': return 'Metabolite Name';
      case 'Transcriptomics': return 'Gene Name';
      case 'Proteomics': return 'Protein Name';
      case 'miRNA': return 'miRNA Name';
      case 'Genomic Variants': return 'Variant Name';
      case 'Epigenomics': return 'Epigenomic Feature Name';
    }
  }

  getDatabaseLabel(): string {
    return this.currentOmics === 'Transcriptomics' ? 'TRRUST' : 'Recon3D';
  }
}
