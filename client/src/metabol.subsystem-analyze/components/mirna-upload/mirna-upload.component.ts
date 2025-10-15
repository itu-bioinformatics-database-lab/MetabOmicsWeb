import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OmicsData, OmicsSelectionService } from 'src/metabol.subsystem-analyze/services/omics-selection.service';
import { UploadService } from 'src/metabol.subsystem-analyze/services/upload/upload.service';

@Component({
  selector: 'app-mirna-upload',
  templateUrl: './mirna-upload.component.html',
  styleUrls: ['./mirna-upload.component.css']
})
export class MirnaUploadComponent implements OnInit {

  selectedOmics: OmicsData[] = [];
  mrConTable: Array<[string, number, string, string, boolean]> = [];
  loading: boolean = false;

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
    this.mrConTable = this.uploadService.mrConTable;
    console.log('mrConTable:', this.mrConTable);
  }

  backButton() {
    this.uploadService.mrConTable = [];
    this.router.navigate(['/analyze/welcome']);
  }
}

