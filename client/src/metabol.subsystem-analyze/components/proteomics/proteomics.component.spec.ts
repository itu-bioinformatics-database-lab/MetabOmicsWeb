import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProteomicsComponent } from './proteomics.component';

describe('ProteomicsComponent', () => {
  let component: ProteomicsComponent;
  let fixture: ComponentFixture<ProteomicsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProteomicsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProteomicsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

