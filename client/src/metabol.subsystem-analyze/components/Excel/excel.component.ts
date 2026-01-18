import { Component, OnInit } from '@angular/core';
import { ConcentrationTableComponent } from '../concentration-table/concentration-table.component';
import { MetaboliteConcentration } from '../../models/metaboliteConcentration';
import { LoginService } from "../../../metabol.auth/services";
import { SignupService } from '../../../metabol.auth/services/signup/signup.service';
import { Router } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material';
import { MatDialogModule } from '@angular/material/dialog';
import { Subject } from 'rxjs/Subject';
import { AppSettings } from '../../../app/';

import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NotificationsService } from 'angular2-notifications';
import { AppDataLoader } from '../../../metabol.common/services';
import { HttpClient } from '@angular/common/http';
import { SubsystemAnalyzeService } from "../../services/subsystem-analyze/subsystem-analyze.service";
import { Observable } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { Http, Headers, Response, URLSearchParams } from '@angular/http';
import 'rxjs/add/operator/toPromise';
import synonyms from '../../../assets/datasets/synonyms_latest.json';
import graph from '../../../assets/datasets/universalGraph_new.json';
import uniprot_synonym_mapping from '../../../assets/datasets/uniprot_synonym_mapping.json';

import * as LZString from 'lz-string';

export interface Disease2 {
  id: number;
  name: string;
  synonym: string;
}

declare var Plotly: any;

@Component({
  selector: 'app-manual',
  templateUrl: 'excel.component.html',
  styleUrls: ['excel.component.css'],
  providers: [SubsystemAnalyzeService],
})
export class ExcelComponent implements OnInit {


  usersData;
  usersData2;
  usersData3 = [];
  // keyys = []
  cases = [];
  labels = [];
  metaboliteNames = [];
  transcriptomeNames = [];
  proteinNames = [];
  mirnaNames = [];

  // Transcriptomics data placeholders
  usersDataTranscriptomics;
  transcriptomicsFormatted = [];
  unmappedTranscriptomics = [];
  casesTranscriptomics = [];
  labelsTranscriptomics = [];

  // Proteomics data placeholders
  usersDataProteomics;
  proteomicsFormatted = [];
  unmappedProteomics = [];
  casesProteomics = [];
  labelsProteomics = [];

  // miRNA data placeholders
  usersDataMiRNA;
  mirnaFormatted = [];
  unmappedMiRNA = [];
  casesMiRNA = [];
  labelsMiRNA = [];

  activeTab = 'Metabolomics'; // Default tab
  public synonymList: [] = synonyms;
  myControl = new FormControl();

  diseases: Disease2[] = [];
  filteredOptions: Observable<Disease2[]>;

  data;
  data2;
  data3;
  test: JSON;
  query: string;
  filteredDiseases = [];






  usersForm: FormGroup;

  form: FormGroup;
  analyzeName: FormControl;
  isPublic: FormControl;
  selectedMethod = 0;
  analyzeEmail: FormControl;
  Disease: FormControl;
  selected = 'Combined.json';

  unmappedMetabolites = [];

  comboboxMethods: Array<object> = [
    { id: 0, name: "Metabolitics" },
    { id: 1, name: "Direct Pathway Mapping" },
    { id: 2, name: "Pathway Enrichment" }
  ];
  methods = {
    Metabolitics: 0,
    DirectPathwayMapping: 1,
    MetaboliteEnrichment: 2
  };



  constructor(

    private fb: FormBuilder,
    private router: Router,
    public login: LoginService,
    private http: HttpClient,
    private notify: NotificationsService,
    // private http: Http,
    private loader: AppDataLoader
  ) {





  }

  ngOnInit() {

    this.form = this.createForm();
    this.analyzeName = new FormControl("My Analyze", Validators.required);
    this.isPublic = new FormControl(true, Validators.required);
    this.analyzeEmail = new FormControl("Email", Validators.required); //Disease
    this.Disease = new FormControl("Disease/Condition", Validators.required);
    this.fetchDiseases();
    this.filteredOptions = this.myControl.valueChanges
      .pipe(
        startWith(''),
        map(value => typeof value === 'string' ? value : (value.name + value.synonym)),
        map(name => name ? this._filter(name) : this.diseases.slice())
      );

    // --- Load Metabolomics Data ---
    const storedMetabolomics = localStorage.getItem('metabolitics-data-Metabolomics') || localStorage.getItem('metabolitics-data');
    if (storedMetabolomics) {
      this.usersData = JSON.parse(LZString.decompress(storedMetabolomics));
      this.usersData2 = this.usersData;

      for (let name in this.usersData2['analysis']) {
        this.cases.push(name);
        this.labels.push(this.usersData2['analysis'][name]['Label']);
      }
      for (let key in this.usersData2['isMapped']) {
        this.metaboliteNames.push(key);
      }

      this.loader.get('Recon3D', (recon) => {
        for (var _i = 0; _i < this.metaboliteNames.length; _i++) {
          let temp_list = new Array();
          let temp_metabol_name;
          for (var _j = 0; _j < this.cases.length; _j++) {
            temp_metabol_name = this.metaboliteNames[_i];
            temp_list.push(this.usersData2['analysis'][this.cases[_j]]["metabolites"][this.metaboliteNames[_i]]);
          }
          if (recon.metabolites[temp_metabol_name]) {
            temp_list.unshift(recon.metabolites[temp_metabol_name].id + " - (" + recon.metabolites[temp_metabol_name].name + ")");
          } else {
            if (this.synonymList[temp_metabol_name]) {
              const name = this.prioritizeMetabolites(this.synonymList[temp_metabol_name]);
              if (recon.metabolites[name]) {
                temp_list.unshift(recon.metabolites[name].id + " - (" + recon.metabolites[name].name + ")");
              } else {
                temp_list.unshift("- (-)");
              }
            } else {
              temp_list.unshift("- (-)");
            }
          }
          if (temp_metabol_name in this.usersData2['metabol']) {
            temp_list.unshift(this.usersData2['metabol'][temp_metabol_name]);
          } else {
            temp_list.unshift(temp_metabol_name);
          }
          if (temp_list.includes("- (-)")) {
            this.unmappedMetabolites.push(temp_list);
          }
          this.usersData3.push(temp_list);
        }
        this.updatePieChart();
      });
    }

    // --- Load Transcriptomics Data ---
    const storedTranscriptomics = localStorage.getItem('metabolitics-data-Transcriptomics');
    if (storedTranscriptomics) {
      this.usersDataTranscriptomics = JSON.parse(LZString.decompress(storedTranscriptomics));

      // Assume same study structure, grab cases/labels from first entry if not already set (though should be consistent)
      if (this.cases.length === 0) {
        for (let name in this.usersDataTranscriptomics['analysis']) {
          this.cases.push(name);
          this.labels.push(this.usersDataTranscriptomics['analysis'][name]['Label']);
        }
      }

      for (let name in this.usersDataTranscriptomics['analysis']) {
        this.casesTranscriptomics.push(name);
        this.labelsTranscriptomics.push(this.usersDataTranscriptomics['analysis'][name]['Label']);
      }

      // In Excel/Workbench format, keys are in 'isMapped' or similar, but let's check structure.
      // Assuming 'isMapped' contains the keys
      if (this.usersDataTranscriptomics['transcriptomes']) {
        this.transcriptomeNames = this.usersDataTranscriptomics['transcriptomes'];
      } else {
        for (let key in this.usersDataTranscriptomics['isMapped']) {
          this.transcriptomeNames.push(key);
        }
      }

      this.processTranscriptomics();
    }

    // --- Load Proteomics Data ---
    const storedProteomics = localStorage.getItem('metabolitics-data-Proteomics');
    if (storedProteomics) {
      this.usersDataProteomics = JSON.parse(LZString.decompress(storedProteomics));

      if (this.cases.length === 0) {
        for (let name in this.usersDataProteomics['analysis']) {
          this.cases.push(name);
          this.labels.push(this.usersDataProteomics['analysis'][name]['Label']);
        }
      }

      for (let name in this.usersDataProteomics['analysis']) {
        this.casesProteomics.push(name);
        this.labelsProteomics.push(this.usersDataProteomics['analysis'][name]['Label']);
      }

      if (this.usersDataProteomics['proteins']) {
        this.proteinNames = this.usersDataProteomics['proteins'];
      } else {
        for (let key in this.usersDataProteomics['isMapped']) {
          this.proteinNames.push(key);
        }
      }

      this.processProteomics();
    }

    // --- Load miRNA Data ---
    const storedMiRNA = localStorage.getItem('metabolitics-data-miRNAs');
    if (storedMiRNA) {
      this.usersDataMiRNA = JSON.parse(LZString.decompress(storedMiRNA));

      if (this.cases.length === 0) {
        for (let name in this.usersDataMiRNA['analysis']) {
          this.cases.push(name);
          this.labels.push(this.usersDataMiRNA['analysis'][name]['Label']);
        }
      }

      for (let name in this.usersDataMiRNA['analysis']) {
        this.casesMiRNA.push(name);
        this.labelsMiRNA.push(this.usersDataMiRNA['analysis'][name]['Label']);
      }

      if (this.usersDataMiRNA['mirnas']) {
        this.mirnaNames = this.usersDataMiRNA['mirnas'];
      } else {
        for (let key in this.usersDataMiRNA['isMapped']) {
          this.mirnaNames.push(key);
        }
      }

      this.processMiRNA();
    }

    // localStorage.removeItem('metabolitics-data');
    // localStorage.removeItem('metabolitics-data-Metabolomics');
    // localStorage.removeItem('metabolitics-data-Transcriptomics');
    // localStorage.removeItem('metabolitics-data-Proteomics');
    // localStorage.removeItem('metabolitics-data-miRNA');
  }

  processTranscriptomics() {
    for (let i = 0; i < this.transcriptomeNames.length; i++) {
      let temp_list = new Array();
      let temp_gene_name = this.transcriptomeNames[i];

      // Get values for each case
      for (let j = 0; j < this.casesTranscriptomics.length; j++) {
        let val;

        if (this.usersDataTranscriptomics['analysis'][this.casesTranscriptomics[j]]["transcriptomes"]) {
          val = this.usersDataTranscriptomics['analysis'][this.casesTranscriptomics[j]]["transcriptomes"][temp_gene_name];
        } else {
          val = this.usersDataTranscriptomics['analysis'][this.casesTranscriptomics[j]]["metabolites"][temp_gene_name];
        }
        temp_list.push(val);
      }


      if (this.usersDataTranscriptomics['isMapped'] && this.usersDataTranscriptomics['isMapped'][temp_gene_name]) {
        const mappingInfo = this.usersDataTranscriptomics['isMapped'][temp_gene_name];
        if (mappingInfo['isMapped'] === false) {
          temp_list.unshift("- (-)");
          this.unmappedTranscriptomics.push(temp_list);
        } else {
          temp_list.unshift(temp_gene_name);
        }
      } else {
        temp_list.unshift(temp_gene_name);
      }
      if (this.usersDataTranscriptomics['metabol'] && temp_gene_name in this.usersDataTranscriptomics['metabol']) {
        temp_list.unshift(this.usersDataTranscriptomics['metabol'][temp_gene_name]);
      } else {
        temp_list.unshift(temp_gene_name);
      }

      this.transcriptomicsFormatted.push(temp_list);
    }
  }

  processProteomics() {
    for (let i = 0; i < this.proteinNames.length; i++) {
      let temp_list = new Array();
      let temp_protein_name = this.proteinNames[i];

      for (let j = 0; j < this.casesProteomics.length; j++) {
        let val;
        if (this.usersDataProteomics['analysis'][this.casesProteomics[j]]["proteins"]) {
          val = this.usersDataProteomics['analysis'][this.casesProteomics[j]]["proteins"][temp_protein_name];
        } else {
          val = this.usersDataProteomics['analysis'][this.casesProteomics[j]]["metabolites"][temp_protein_name];
        }
        temp_list.push(val);
      }

      if (this.usersDataProteomics['isMapped'] && this.usersDataProteomics['isMapped'][temp_protein_name]) {
        const mappingInfo = this.usersDataProteomics['isMapped'][temp_protein_name];
        if (mappingInfo['isMapped'] === false) {
          temp_list.unshift("- (-)");
          this.unmappedProteomics.push(temp_list);
        } else {
          temp_list.unshift(temp_protein_name);
        }
      } else {
        temp_list.unshift(temp_protein_name);
      }

      if (this.usersDataProteomics['metabol'] && temp_protein_name in this.usersDataProteomics['metabol']) {
        temp_list.unshift(this.usersDataProteomics['metabol'][temp_protein_name]);
      } else {
        temp_list.unshift(temp_protein_name);
      }
      this.proteomicsFormatted.push(temp_list);
    }
  }

  processMiRNA() {
    for (let i = 0; i < this.mirnaNames.length; i++) {
      let temp_list = new Array();
      let temp_mirna_name = this.mirnaNames[i];

      for (let j = 0; j < this.casesMiRNA.length; j++) {
        let val;
        if (this.usersDataMiRNA['analysis'][this.casesMiRNA[j]]["mirnas"]) {
          val = this.usersDataMiRNA['analysis'][this.casesMiRNA[j]]["mirnas"][temp_mirna_name];
        } else {
          val = this.usersDataMiRNA['analysis'][this.casesMiRNA[j]]["metabolites"][temp_mirna_name];
        }
        temp_list.push(val);
      }

      if (this.usersDataMiRNA['isMapped'] && this.usersDataMiRNA['isMapped'][temp_mirna_name]) {
        const mappingInfo = this.usersDataMiRNA['isMapped'][temp_mirna_name];
        if (mappingInfo['isMapped'] === false) {
          temp_list.unshift("- (-)");
          this.unmappedMiRNA.push(temp_list);
        } else {
          temp_list.unshift(temp_mirna_name);
        }
      } else {
        temp_list.unshift(temp_mirna_name);
      }

      if (this.usersDataMiRNA['metabol'] && temp_mirna_name in this.usersDataMiRNA['metabol']) {
        temp_list.unshift(this.usersDataMiRNA['metabol'][temp_mirna_name]);
      } else {
        temp_list.unshift(temp_mirna_name);
      }
      this.mirnaFormatted.push(temp_list);
    }
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
    this.updatePieChart();
  }

  updatePieChart() {
    let mapped = 0;
    let unmapped = 0;
    let labelMapped = '';
    let labelUnmapped = '';

    if (this.activeTab === 'Metabolomics') {
      mapped = this.usersData3.length - this.unmappedMetabolites.length;
      unmapped = this.unmappedMetabolites.length;
      labelMapped = 'Mapped Metabolites';
      labelUnmapped = 'Unmapped Metabolites';
    } else if (this.activeTab === 'Transcriptomics') {
      mapped = this.transcriptomicsFormatted.length - this.unmappedTranscriptomics.length;
      unmapped = this.unmappedTranscriptomics.length;
      labelMapped = 'Mapped Genes';
      labelUnmapped = 'Unmapped Genes';
    } else if (this.activeTab === 'Proteomics') {
      mapped = this.proteomicsFormatted.length - this.unmappedProteomics.length;
      unmapped = this.unmappedProteomics.length;
      labelMapped = 'Mapped Proteins';
      labelUnmapped = 'Unmapped Proteins';
    } else if (this.activeTab === 'miRNAs') {
      mapped = this.mirnaFormatted.length - this.unmappedMiRNA.length;
      unmapped = this.unmappedMiRNA.length;
      labelMapped = 'Mapped miRNAs';
      labelUnmapped = 'Unmapped miRNAs';
    }

    var data = [{
      values: [mapped, unmapped],
      labels: [labelMapped, labelUnmapped],
      type: 'pie'
    }];

    var layout = {
      height: 250,
      width: 450,
      margin: {
        t: 10,
        b: 10
      },
    };

    Plotly.newPlot('chart', data, layout);
  }

  onSubmit() {
    // console.log("Analyse under Construction")



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

  createForm() {
    return this.fb.group({
      "name": ["", Validators.required],
      "value": ["", Validators.pattern('[0-9]+(\\.[0-9]+)?')]
    });
  }
  fetchDiseases() {
    this.http.get(`${AppSettings.API_ENDPOINT}/diseases/all`, this.login.optionByAuthorization())
      .subscribe((data: any) => {
        data.forEach(element => {
          this.diseases.push({ id: element['id'], name: element['name'], synonym: element['synonym'] })
        });
      });
  }
  displayFn(disease?: Disease2): string | undefined {
    return disease ? disease.name : undefined;
  }
  private _filter(name: string): Disease2[] {
    const filterValue = name.toLowerCase();

    return this.diseases.filter(option => option.name.toLowerCase().indexOf(filterValue) === 0 || option.synonym.toLowerCase().indexOf(filterValue) === 0);
  }

  analyze() {

    const selectedMethod = this.selectedMethod;

    if (!this.usersData2) {
      this.notify.error('Error', 'Metabolomics data is required for analysis.');
      return;
    }

    // 2. Update Public/Disease info on the payload
    if (this.login.isLoggedIn()) {
      this.usersData2['public'] = this.isPublic.value;
      this.usersData2['disease'] = this.myControl.value["id"];
    } else {
      this.usersData2['public'] = true;
      this.usersData2['disease'] = this.myControl.value["id"];
      this.usersData2['email'] = this.analyzeEmail.value;
    }

    // 3. Helper logic to merge specific omics data
    const mergeOmics = (sourceData, targetKey) => {
      if (!sourceData) return;
      for (let caseName in this.usersData2['analysis']) {
        if (sourceData['analysis'][caseName]) {
          // Prefer specific key, fallback to 'metabolites' if legacy
          const val = sourceData['analysis'][caseName][targetKey] || sourceData['analysis'][caseName]['metabolites'];
          this.usersData2['analysis'][caseName][targetKey] = val;
        }
      }
    };

    // 4. Merge all types
    mergeOmics(this.usersDataTranscriptomics, 'transcriptomes');
    mergeOmics(this.usersDataProteomics, 'proteins');
    mergeOmics(this.usersDataMiRNA, 'mirnas');

    if (selectedMethod === this.methods.Metabolitics) {
      this.metabolitics(this.usersData2);
    }
    else if (selectedMethod === this.methods.DirectPathwayMapping) {
      this.directPathwayMapping(this.usersData2);
    }
    else if (selectedMethod === this.methods.MetaboliteEnrichment) {
      this.metaboliteEnrichment(this.usersData2);
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
    }
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

    }
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
}