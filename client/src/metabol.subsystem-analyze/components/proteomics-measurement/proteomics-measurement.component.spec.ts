import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProteomicsMeasurementComponent } from './proteomics-measurement.component';

describe('ProteomicsMeasurementComponent', () => {
  let component: ProteomicsMeasurementComponent;
  let fixture: ComponentFixture<ProteomicsMeasurementComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProteomicsMeasurementComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProteomicsMeasurementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

