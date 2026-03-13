import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OmicsSelectionService, OmicsData } from '../../services/omics-selection.service';
import { UploadService } from '../../services/upload/upload.service';

@Component({
  selector: 'app-manual',
  templateUrl: 'manual.component.html',
  styleUrls: ['manual.component.css'],
})
export class ManualComponent implements OnInit {
  mConTable: Array<[string, number, string, string, boolean]> = [];
  selectedOmics: OmicsData[] = [];
  /** The omics type active during this visit (set on init from the service). */
  currentOmicsType: string = 'Metabolomics';

  constructor(
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

    // Detect which omics type is currently active
    const current = this.omicsService.getCurrentOmics();
    this.currentOmicsType = (current && current.type) ? current.type : 'Metabolomics';

    // Initialize mConTable from UploadService (starts empty for manual entry)
    this.mConTable = this.uploadService.mConTable;
  }

  onBackClick() {
    const path = this.currentOmicsType === 'Metabolomics'
      ? '/analyze/metabolomics-measurement'
      : `/analyze/${this.currentOmicsType.toLowerCase().replace(/\s+/g, '-')}-measurement`;
    this.router.navigate([path]);
  }

  get isCurrentTableEmpty(): boolean {
    return !this.mConTable || this.mConTable.length === 0;
  }

  canProceed(): boolean {
    // For manual entry, user can proceed if they have entered at least one item
    return !this.isCurrentTableEmpty;
  }

  getContinueButtonText(): string {
    return this.uploadService.getContinueButton();
  }

  onContinue() {
    if (!this.isCurrentTableEmpty) {
      // Mark the CURRENT omics type as having data entered
      this.omicsService.updateOmicsData(this.currentOmicsType, { fileName: 'Manual Entry' });
    }
    // Use upload service to proceed through the sequential flow
    this.uploadService.proceed(this.currentOmicsType);
  }
}
