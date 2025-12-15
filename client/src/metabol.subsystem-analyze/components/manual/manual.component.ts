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
      return;
    }
    
    // Initialize omics vector if not already initialized
    if (this.uploadService.omicsVector.length === 0) {
      this.uploadService.initializeOmicsVector();
    }
    
    // Initialize mConTable from UploadService (starts empty for manual entry)
    this.mConTable = this.uploadService.mConTable;
  }

  onBackClick() {
    this.router.navigate(['/analyze/welcome']);
  }

  get isCurrentTableEmpty(): boolean {
    return !this.mConTable || this.mConTable.length === 0;
  }

  canProceed(): boolean {
    // For manual entry, user can proceed if they have entered at least one item
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
      this.omicsService.updateOmicsData('Metabolomics', { fileName: 'Manual Entry' });
    }
    
    // Use upload service to proceed to next omics or submit
    this.uploadService.proceed('Metabolomics');
  }
}
