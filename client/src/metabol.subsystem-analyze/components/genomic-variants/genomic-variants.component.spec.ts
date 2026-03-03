import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { GenomicVariantsComponent } from "./genomic-variants.component";

describe("GenomicVariantsComponent", () => {
  let component: GenomicVariantsComponent;
  let fixture: ComponentFixture<GenomicVariantsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [GenomicVariantsComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GenomicVariantsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
