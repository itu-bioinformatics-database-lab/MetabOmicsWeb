import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationsService } from 'angular2-notifications';
import { OmicsSelectionService } from 'src/metabol.subsystem-analyze/services';
import { UploadService } from 'src/metabol.subsystem-analyze/services/upload/upload.service';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss']
})
export class WelcomeComponent {
  selectedOmics: string[] = [];

  constructor(
    private router: Router, 
    private omicsService: OmicsSelectionService,
    private notify: NotificationsService,
    private uploadService: UploadService
  ) {}

  toggleOmics(omics: string) {
    const index = this.selectedOmics.indexOf(omics);
    if (index > -1) {
      this.selectedOmics.splice(index, 1); // Remove if already selected
    } else {
      this.selectedOmics.push(omics); // Add if not selected
    } 
  }

  continue() {
    // Validate that at least one omics type is selected
    if (this.selectedOmics.length === 0) {
      this.notify.info('Please select at least one omics type to continue', 'Selection Required');
      return;
    }
    
    this.omicsService.setSelectedOmics(this.selectedOmics); 
    
    // Initialize the omics vector in upload service using direct array method
    this.uploadService.initializeOmicsVectorFromArray(this.selectedOmics);
    
    // Navigate to the first selected omics type
    const firstOmicsType = this.selectedOmics[0].toLowerCase().replace(/\s+/g, '-');
    this.router.navigate([`/analyze/${firstOmicsType}-measurement`]);
  }
} 