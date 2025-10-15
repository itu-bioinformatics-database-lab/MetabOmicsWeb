import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-metabolomics-measurement',
  templateUrl: './metabolomics-measurement.component.html',
  styleUrls: ['./metabolomics-measurement.component.css']
})
export class MetabolomicsMeasurementComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {
  }

} 