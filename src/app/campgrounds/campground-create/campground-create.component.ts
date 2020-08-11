import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, ParamMap } from '@angular/router';

import { Campground } from '../campground.model';
import { mimeType } from '../../utils/mime-type.validator';
import { CampgroundsService } from '../campgrounds.service';

/** Material Chips Auto-complete related imports */
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { ElementRef, ViewChild } from '@angular/core';
import {
  MatAutocomplete,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-campground-create',
  templateUrl: './campground-create.component.html',
  styleUrls: ['./campground-create.component.css'],
})
export class CampgroundCreateComponent implements OnInit {
  private mode = 'create';
  private campgroundId: string;
  campground: Campground;
  formHeading = 'Create a New Campground';

  /** UI related vars */
  isLoading = false;
  form: FormGroup;
  displayImageName: string;
  imagePreview: string;

  /** Material Chips Auto-complete related vars */
  visible = true;
  selectable = true;
  removable = true;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  filteredAmenities: Observable<string[]>;
  amenities: string[] = ['Tents'];
  allAmenities: string[] = [
    'Tents',
    'Yoga Classes',
    'Upgraded Yurts',
    'Communal Campground Kitchens',
    'Coffee Cafes',
    'Stargazing Tours',
    'Live Music',
    'Food Trucks',
    'Swimming Pool',
    'Breakfast',
    'Lunch',
    'Dinner',
    'Games',
    'Zip Lines',
    'Hayrides',
    'Game Rooms',
    'Craft Brewing & Bars',
    'Summer Movie Nights',
    'Rental Cabins & RVs',
    'Toilet Only',
    'Toilet & Shower',
    'Electrical Outlets',
    'Internet & WiFi',
    'Wildlife Safari',
    'Campfire',
    'Barbeque, Fire Rings, Grills',
    'Drinking Water',
    'Pets Allowed',
    'Signage',
  ];

  /** Dependency Injection: Inject -
   * Campground Service
   * ActivatedRouter to get the current active route params, iff campgroundId is present
   */
  constructor(
    private campgroundsService: CampgroundsService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.form = new FormGroup({
      campgroundName: new FormControl(
        { value: null, disabled: false },
        {
          validators: [
            Validators.required,
            Validators.minLength(6),
            Validators.maxLength(30),
          ],
        }
      ),
      campgroundPrice: new FormControl({ value: null, disabled: false }),
      campgroundImage: new FormControl(
        { value: null, disabled: false },
        {
          validators: [Validators.required],
        }
      ),
      campgroundDescription: new FormControl(
        { value: null, disabled: false },
        {
          validators: [Validators.required],
        }
      ),
      campgroundLocation: new FormControl(
        { value: null, disabled: false },
        {
          validators: [Validators.required],
          asyncValidators: [mimeType],
        }
      ),
      amenitiesCtrl: new FormControl(),
    });

    this.route.paramMap.subscribe((paramMap: ParamMap) => {
      if (paramMap.has('campgroundId')) {
        this.mode = 'edit';
        this.formHeading = 'Edit Campground';
        this.campgroundId = paramMap.get('campgroundId');
        this.isLoading = true;
        this.disableFormControls(true);

        this.campgroundsService.getCampground(this.campgroundId).subscribe(
          (campgroundData) => {
            // stop spinner
            this.isLoading = false;
            this.disableFormControls(false);

            // console.log(campgroundData);

            // load data in local variable
            this.campground = {
              _id: campgroundData._id,
              name: campgroundData.name,
              price: campgroundData.price,
              image: campgroundData.image,
              location: campgroundData.location,
              description: campgroundData.description,
            };

            this.displayImageName = this.campground.image;

            // load data onto form elements
            this.form.setValue({
              campgroundName: this.campground.name,
              campgroundPrice: this.campground.price,
              campgroundImage: this.campground.image,
              campgroundLocation: this.campground.location,
              campgroundDescription: this.campground.description,
            });
          },
          (error) => {
            this.isLoading = false;
            // console.log(error);
            this.campgroundsService.redirectToCampgrounds();
          }
        );
      } else {
        this.mode = 'create';
        this.formHeading = 'Create a New Campground';
        this.campgroundId = null;
        this.displayImageName = null;
      }
    });
  }

  async onFormSubmit() {
    // console.log('inside onFormSubmit');

    if (this.form.invalid) return;

    // console.log('passed form validation!');

    /** IMPORTANT! Before programmatically disabling the reactive form controls,
     * store form control values in local varaibles or the form control values would
     * return UNDEFINED
     */
    const name = this.form.value.campgroundName;
    const price = this.form.value.campgroundPrice;
    const description = this.form.value.campgroundDescription;
    const location = this.form.value.campgroundLocation;
    const image = this.form.value.campgroundImage;

    this.isLoading = true;
    this.disableFormControls(true);

    if (this.mode === 'create') {
      this.campgroundsService
        .createCampground(name, price, description, location, image)
        .subscribe(
          (result) => {
            this.form.reset();
            // console.log('success creating campground', result);
            this.campgroundsService.redirectToCampgrounds();
          },
          (error) => {
            this.isLoading = false;
            this.disableFormControls(false);
            console.log('error creating campground', error);
          }
        );
    } else {
      this.campgroundsService
        .updateCampground(
          this.campgroundId,
          name,
          price,
          description,
          location,
          image
        )
        .subscribe(
          (response) => {
            this.form.reset();
            // console.log('success editing campground', response);
            this.campgroundsService.redirectToCampgrounds();
          },
          (error) => {
            this.isLoading = false;
            this.disableFormControls(false);
            console.log('error editing campground', error);
          }
        );
    }
  }

  onImagePicked(e: Event) {
    // console.log('inside onImagePicked');

    const file = (event.target as HTMLInputElement).files[0];
    this.displayImageName = file.name;

    // Set the file object in the FormControl 'campgroundImage' declared above
    this.form.patchValue({ campgroundImage: file });

    // Recalculates the value and validation controls for this control
    // Also, emit the value to valueChange event subscribers
    this.form.get('campgroundImage').updateValueAndValidity();

    // Read the file and show the preview
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  isEditMode(): boolean {
    return this.mode === 'edit';
  }

  disableFormControls(condition: boolean) {
    // disable for condition === true
    if (condition) {
      this.form.controls.campgroundName.disable();
      this.form.controls.campgroundPrice.disable();
      this.form.controls.campgroundDescription.disable();
      this.form.controls.campgroundLocation.disable();
    } else {
      this.form.controls.campgroundName.enable();
      this.form.controls.campgroundPrice.enable();
      this.form.controls.campgroundDescription.enable();
      this.form.controls.campgroundLocation.enable();
    }
  }

  /** Material Chips Auto-complete related methods */
  onAddChip(event: MatChipInputEvent): void {
    //
  }

  onRemoveChip(amenity: string): void {
    //
  }

  onSelectedChip(event: MatAutocompleteSelectedEvent): void {
    //
  }
}
