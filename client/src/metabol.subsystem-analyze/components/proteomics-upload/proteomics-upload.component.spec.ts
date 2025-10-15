import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProteomicsUploadComponent } from './proteomics-upload.component';

describe('ProteomicsUploadComponent', () => {
  let component: ProteomicsUploadComponent;
  let fixture: ComponentFixture<ProteomicsUploadComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProteomicsUploadComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProteomicsUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

