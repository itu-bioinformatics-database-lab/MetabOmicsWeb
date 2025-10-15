import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-proteomics-measurement',
  templateUrl: './proteomics-measurement.component.html',
  styleUrls: ['./proteomics-measurement.component.css']
})
export class ProteomicsMeasurementComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {
  }
}

