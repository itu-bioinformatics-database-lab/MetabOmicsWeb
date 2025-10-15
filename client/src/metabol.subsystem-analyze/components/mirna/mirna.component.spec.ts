import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MirnaComponent } from './mirna.component';

describe('MirnaComponent', () => {
  let component: MirnaComponent;
  let fixture: ComponentFixture<MirnaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MirnaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MirnaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

