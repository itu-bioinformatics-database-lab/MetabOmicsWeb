import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";

@Component({
  selector: "app-mirnas-measurement",
  templateUrl: "./mirnas-measurement.component.html",
  styleUrls: ["./mirnas-measurement.component.css"],
})
export class MirnaMeasurementComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {}
}
