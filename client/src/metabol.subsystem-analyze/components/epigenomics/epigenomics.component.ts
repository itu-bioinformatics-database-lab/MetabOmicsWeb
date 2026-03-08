import { Component, OnInit } from "@angular/core";
import { UploadService } from "../../services/upload/upload.service";
import { OmicsSelectionService } from "../../services/omics-selection.service";
@Component({
  selector: "app-epigenomics",
  templateUrl: "./epigenomics.component.html",
  styleUrls: ["./epigenomics.component.css"],
})
export class EpigenomicsComponent implements OnInit {
  constructor(
    public uploadService: UploadService,
    public omicsService: OmicsSelectionService
  ) {}

  ngOnInit() {
    this.omicsService.setCurrentOmicsByType("epigenomics");
  }
}
