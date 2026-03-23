import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { NotificationsService } from "angular2-notifications";
import { OmicsSelectionService } from "src/metabol.subsystem-analyze/services";
import { UploadService } from "src/metabol.subsystem-analyze/services/upload/upload.service";

@Component({
  selector: "app-welcome",
  templateUrl: "./welcome.component.html",
  styleUrls: ["./welcome.component.scss"],
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
      this.notify.info(
        "Please select at least one omics type to continue",
        "Selection Required"
      );
      return;
    }

    this.omicsService.setSelectedOmics(this.selectedOmics);

    // Initialize the omics vector from the *sorted* omics array so that
    // UploadService.omicsVector and OmicsSelectionService stay in the same order.
    const sortedOmicsTypes = this.omicsService.getSelectedOmicsArray().map(o => o.type);
    this.uploadService.initializeOmicsVectorFromArray(sortedOmicsTypes);

    // Navigate to the first omics type (from the sorted list, matching the upload vector)
    const firstOmicsType = sortedOmicsTypes[0];
    // Navigate to measurement page (which offers Upload / Manual / Sample options)
    if (firstOmicsType === 'Metabolomics') {
      this.router.navigate(['/analyze/metabolomics-measurement']);
    } else {
      const firstOmicsTypePath = firstOmicsType.toLowerCase().replace(/\s+/g, '-');
      this.router.navigate([`/analyze/${firstOmicsTypePath}-measurement`]);
    }
  }
}
