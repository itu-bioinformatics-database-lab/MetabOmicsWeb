import { AppDataLoader } from './../../../metabol.common/services/data-loader/data-loader.service';
import {HttpClient} from "@angular/common/http";
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import synonyms from '../../../assets/datasets/synonyms_latest.json';
import { OmicsSelectionService, OmicsData } from '../../services/omics-selection.service';
import { UploadService } from '../../services/upload/upload.service';

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
      // If no omics types are selected, redirect back to welcome
      this.router.navigate(['/analyze/welcome']);
      return;
    }
    
    // Initialize omics vector if not already initialized
    if (this.uploadService.omicsVector.length === 0) {
      this.uploadService.initializeOmicsVector();
    }
    
    // Initialize mConTable from UploadService
    this.mConTable = this.uploadService.mConTable;
    
    // Load sample data for Metabolomics
    this.loadSampleDataSet();
  }

  loadSampleDataSet() {
    this.loading = true;
    this.http.get('assets/example-analyze-doc-files/example_metabolitic.json')
      .subscribe((data:any) => {
        this.loader.get('Recon3D', (recon) => {
          // tslint:disable-next-line:forin
          for (let key in data) {
            let change = data[key];
            if (recon.metabolites[key]) {
              this.mConTable.push([key, change, recon.metabolites[key].id, recon.metabolites[key].name, true]);
            } else {
              if (this.synonymList[key]) {
                const name = this.prioritizeMetabolites(this.synonymList[key]);
                if (recon.metabolites[name]) {
                  this.mConTable.push([key, change, name, recon.metabolites[name].name, true]);
                } else {
                  this.mConTable.push([key, change, name, name, true]);
                }
              } else {
                this.mConTable.push([key, change, '-', '-', false]);
              }
            }
          }
          this.unmappedMetabolites = this.mConTable.filter((m) => {return m[4] == false;})
          this.loading = false;
        })
      });
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
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  onBackClick() {
    this.router.navigate(['/analyze/welcome']);
  }

  get isCurrentTableEmpty(): boolean {
    return !this.mConTable || this.mConTable.length === 0;
  }

  canProceed(): boolean {
    // For sample data, user can proceed if data has been loaded
    return !this.isCurrentTableEmpty;
  }

  getContinueButtonText(): string {
    const selectedOmics = this.omicsService.getSelectedOmicsArray();
    if (selectedOmics.length === 1) {
      return 'Continue to Analysis';
    } else if (selectedOmics.length > 1) {
      const currentIndex = this.omicsService.getCurrentOmicsIndex();
      const isLastOmics = currentIndex >= selectedOmics.length - 1;
      
      if (isLastOmics) {
        return 'Continue to Analysis';
      } else {
        const nextOmicsType = selectedOmics[currentIndex + 1].type;
        return `Continue to ${nextOmicsType}`;
      }
    }
    return 'Continue';
  }

  onContinue() {
    // Mark Metabolomics as having data entered
    if (!this.isCurrentTableEmpty) {
      this.omicsService.updateOmicsData('Metabolomics', { fileName: 'Sample Data' });
    }
    
    // Use upload service to proceed to next omics or submit
    this.uploadService.proceed('Metabolomics');
  }
}
