import { AppDataLoader } from './../../../metabol.common/services/data-loader/data-loader.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ConcentrationTableComponent} from '../concentration-table/concentration-table.component';
import {MetaboliteConcentration} from '../../models/metaboliteConcentration';
import * as _ from 'lodash';
import * as XLSX from 'xlsx';
import { utils, write, WorkBook } from 'xlsx';
import * as LZString from 'lz-string';

import {SubsystemAnalyzeService} from '../../services/subsystem-analyze';
import {Router} from '@angular/router';
import {LoginService} from '../../../metabol.auth/services/login';
import {  FileUploader, FileSelectDirective, FileItem, ParsedResponseHeaders } from 'ng2-file-upload/ng2-file-upload';

import { HttpClient } from '@angular/common/http';
import { SimpleNotificationsModule } from 'angular2-notifications';
import { HttpClientModule } from '@angular/common/http';


import { AppSettings } from '../../../app/';
import synonyms from '../../../assets/datasets/synonyms_latest.json';
import { NotificationsService } from 'angular2-notifications';
import { OmicsSelectionService, OmicsData } from '../../services/omics-selection.service';
import { UploadService } from '../../services/upload/upload.service';


@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css'],
  providers: [SubsystemAnalyzeService,SimpleNotificationsModule]
})
export class UploadComponent implements OnInit {
  selectedOmics: OmicsData[] = [];
  mConTable: Array<[string, number, string, string, boolean]> = [];
  tConTable: Array<[string, number, string, string, boolean]> = [];
  pConTable: Array<[string, number, string, string, boolean]> = [];
  mrConTable: Array<[string, number, string, string, boolean]> = [];
  loading: boolean = false;
  currentOmic: OmicsData;
  currentOmics: string;

  constructor(
    private router: Router,
    private omicsService: OmicsSelectionService,
    public uploadService: UploadService
  ) { }

  ngOnInit() {
    this.selectedOmics = this.omicsService.getSelectedOmicsArray();
    if (this.selectedOmics.length === 0) {
      // If no omics types are selected, redirect back to welcome
      this.router.navigate(['/analyze/welcome']);
    }
    // Initialize conTable from UploadService
    this.mConTable = this.uploadService.mConTable;
    this.tConTable = this.uploadService.tConTable;
    this.pConTable = this.uploadService.pConTable;
    this.mrConTable = this.uploadService.mrConTable;
    // Get current omics type
    this.currentOmic = this.omicsService.getCurrentOmics();
    this.currentOmics = this.currentOmic ? this.currentOmic.type : '';
  }


  onBackClick() {
    this.router.navigate(['/analyze/welcome']);
  }

  get entityLabel(): string {
    switch (this.currentOmics) {
      case 'Metabolomics':
        return 'metabolites';
      case 'Transcriptomics':
        return 'genes';
      case 'Proteomics':
        return 'proteins';
      case 'miRNA':
        return 'miRNAs';
      default:
        return 'items';
    }
  }

  get isCurrentTableEmpty(): boolean {
    switch (this.currentOmics) {
      case 'Metabolomics':
        return !this.mConTable || this.mConTable.length === 0;
      case 'Transcriptomics':
        return !this.tConTable || this.tConTable.length === 0;
      case 'Proteomics':
        return !this.pConTable || this.pConTable.length === 0;
      case 'miRNA':
        return !this.mrConTable || this.mrConTable.length === 0;
      default:
        return true;
    }
  }
}