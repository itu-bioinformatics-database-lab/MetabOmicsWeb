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

  // Transcriptomics data placeholders
  usersDataTranscriptomics;
  transcriptomicsFormatted = [];
  unmappedTranscriptomics = [];
  casesTranscriptomics = [];
  labelsTranscriptomics = [];

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
            temp_list.push(this.usersData2['analysis'][this.cases[_j]]["Metabolites"][this.metaboliteNames[_i]]);
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

    // Cleanup old keys if any, or maybe keep them until submission?
    // localStorage.removeItem('metabolitics-data');
    // localStorage.removeItem('metabolitics-data-Metabolomics');
    // localStorage.removeItem('metabolitics-data-Transcriptomics');
  }

  processTranscriptomics() {
    for (let i = 0; i < this.transcriptomeNames.length; i++) {
      let temp_list = new Array();
      let temp_gene_name = this.transcriptomeNames[i];

      // Get values for each case
      for (let j = 0; j < this.casesTranscriptomics.length; j++) {
        // Backend now uses 'transcriptomes' key for Transcriptomics
        let val;
        // Try accessing via 'transcriptomes' or fall back to 'Metabolites' if backend not delivering
        if (this.usersDataTranscriptomics['analysis'][this.casesTranscriptomics[j]]["transcriptomes"]) {
          val = this.usersDataTranscriptomics['analysis'][this.casesTranscriptomics[j]]["transcriptomes"][temp_gene_name];
        } else {
          val = this.usersDataTranscriptomics['analysis'][this.casesTranscriptomics[j]]["Metabolites"][temp_gene_name];
        }
        temp_list.push(val);
      }

      // Backend now handles mapping, so we can trust the key (temp_gene_name) is already the mapped name if found
      // But we need to format it nicely for display if it's mapped, or show unmapped if it is not found.

      // The backend returns mapped keys like "GeneName - (UniprotID)" if mapped.
      // We can check the 'isMapped' status from backend response.

      if (this.usersDataTranscriptomics['isMapped'] && this.usersDataTranscriptomics['isMapped'][temp_gene_name]) {
        const mappingInfo = this.usersDataTranscriptomics['isMapped'][temp_gene_name];
        if (mappingInfo['isMapped'] === false) {
          temp_list.unshift("- (-)"); // Mark as unmapped for display if backend says so
          this.unmappedTranscriptomics.push(temp_list);
        } else {
          // It's mapped, and the key itself (temp_gene_name) is likely the mapped name from backend
          temp_list.unshift(temp_gene_name);
        }
      } else {
        // Fallback if isMapped is missing
        temp_list.unshift(temp_gene_name);
      }

      // Original Name (User provided) from 'metabol' key
      if (this.usersDataTranscriptomics['metabol'] && temp_gene_name in this.usersDataTranscriptomics['metabol']) {
        temp_list.unshift(this.usersDataTranscriptomics['metabol'][temp_gene_name]);
      } else {
        temp_list.unshift(temp_gene_name);
      }

      this.transcriptomicsFormatted.push(temp_list);
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
    } else {
      mapped = this.transcriptomicsFormatted.length - this.unmappedTranscriptomics.length;
      unmapped = this.unmappedTranscriptomics.length;
      labelMapped = 'Mapped Genes';
      labelUnmapped = 'Unmapped Genes';
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

    if (this.login.isLoggedIn()) {
      this.usersData2['public'] = this.isPublic.value;
      this.usersData2['disease'] = this.myControl.value["id"];
    } else {
      this.usersData2['public'] = true;
      this.usersData2['disease'] = this.myControl.value["id"];
      this.usersData2['email'] = this.analyzeEmail.value;
    }

    // Merge Transcriptomics if available
    // Structure: usersData2['analysis'][caseName]['Metabolites'] (existing)
    // Need to add: usersData2['analysis'][caseName]['transcriptomes'] ???
    // 
    // Wait, the API expects 'transcriptomes' key parallel to 'metabolites'?
    // Looking at SubmitComponent:
    // "analysis": { 
    //     [name]: { 
    //     "metabolites": _.fromPairs(this.metabolitesTable), 
    //     "transcriptomes": _.fromPairs(this.transcriptomesTable),
    //     "Label": "not_provided" } },

    // In usersData2 (from Excel), it seems 'Metabolites' is the key used for values in the 'analysis' object.

    if (this.usersDataTranscriptomics) {
      for (let caseName in this.usersData2['analysis']) {
        if (this.usersDataTranscriptomics['analysis'][caseName]) {
          // We need to inject transcriptomes.
          // Warning: The Excel parser (backend) should now set 'transcriptomes' key
          if (this.usersDataTranscriptomics['analysis'][caseName]['transcriptomes']) {
            this.usersData2['analysis'][caseName]['transcriptomes'] = this.usersDataTranscriptomics['analysis'][caseName]['transcriptomes'];
          } else {
            // Fallback if backend used old key
            this.usersData2['analysis'][caseName]['transcriptomes'] = this.usersDataTranscriptomics['analysis'][caseName]['Metabolites'];
          }
        }
      }
    }

    // If no metabolomics but only transcriptomics?
    // We initialized usersData2 from metabolomics. handling that edge case might be needed if user only uploads transcriptomics.
    if (!this.usersData2 && this.usersDataTranscriptomics) {
      this.usersData2 = this.usersDataTranscriptomics;
      // Rename Metabolites to transcriptomes? or keep and let backend handle?
      // Backend likely expects specific keys.
      // Rename Metabolites to transcriptomes? or keep and let backend handle?
      // Backend likely expects specific keys.
      for (let caseName in this.usersData2['analysis']) {
        if (!this.usersData2['analysis'][caseName]['transcriptomes'] && this.usersData2['analysis'][caseName]['Metabolites']) {
          this.usersData2['analysis'][caseName]['transcriptomes'] = this.usersData2['analysis'][caseName]['Metabolites'];
          delete this.usersData2['analysis'][caseName]['Metabolites'];
        }
      }
      if (this.login.isLoggedIn()) {
        this.usersData2['public'] = this.isPublic.value;
        this.usersData2['disease'] = this.myControl.value["id"];
      } else {
        this.usersData2['public'] = true;
        this.usersData2['disease'] = this.myControl.value["id"];
        this.usersData2['email'] = this.analyzeEmail.value;
      }
    }



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


