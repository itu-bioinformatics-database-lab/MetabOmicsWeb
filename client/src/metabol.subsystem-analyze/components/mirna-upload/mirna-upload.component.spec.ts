import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MirnaUploadComponent } from './mirna-upload.component';

describe('MirnaUploadComponent', () => {
  let component: MirnaUploadComponent;
  let fixture: ComponentFixture<MirnaUploadComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MirnaUploadComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MirnaUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

