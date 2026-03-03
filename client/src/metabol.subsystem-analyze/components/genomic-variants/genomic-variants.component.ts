import { Component, OnInit } from "@angular/core";
import { UploadService } from "../../services/upload/upload.service";
import { OmicsSelectionService } from "../../services/omics-selection.service";
@Component({
  selector: "app-genomic-variants",
  templateUrl: "./genomic-variants.component.html",
  styleUrls: ["./genomic-variants.component.css"],
})
export class GenomicVariantsComponent implements OnInit {
  constructor(
    public uploadService: UploadService,
    public omicsService: OmicsSelectionService
  ) {}

  ngOnInit() {
    this.omicsService.setCurrentOmicsByType("genomic-variants");
  }
}
