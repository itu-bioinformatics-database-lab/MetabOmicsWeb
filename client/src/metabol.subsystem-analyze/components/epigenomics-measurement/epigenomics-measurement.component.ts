import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";

@Component({
  selector: "app-epigenomics-measurement",
  templateUrl: "./epigenomics-measurement.component.html",
  styleUrls: ["./epigenomics-measurement.component.css"],
})
export class EpigenomicsMeasurementComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {}
}
