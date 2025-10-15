import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MirnaMeasurementComponent } from './mirna-measurement.component';

describe('MirnaMeasurementComponent', () => {
  let component: MirnaMeasurementComponent;
  let fixture: ComponentFixture<MirnaMeasurementComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MirnaMeasurementComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MirnaMeasurementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

