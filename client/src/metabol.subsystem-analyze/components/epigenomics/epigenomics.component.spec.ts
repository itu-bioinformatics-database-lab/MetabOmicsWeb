import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { EpigenomicsComponent } from "./epigenomics.component";

describe("EpigenomicsComponent", () => {
  let component: EpigenomicsComponent;
  let fixture: ComponentFixture<EpigenomicsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EpigenomicsComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EpigenomicsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
