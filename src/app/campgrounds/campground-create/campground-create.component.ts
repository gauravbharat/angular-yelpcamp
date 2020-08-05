import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, ParamMap } from '@angular/router';

import { Campground } from '../campground.model';
import { mimeType } from '../../utils/mime-type.validator';
import { CampgroundsService } from '../campgrounds.service';

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
      campgroundName: new FormControl(null, {
        validators: [
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(30),
        ],
      }),
      campgroundPrice: new FormControl(null),
      campgroundImage: new FormControl(null, {
        validators: [Validators.required],
      }),
      campgroundDescription: new FormControl(null, {
        validators: [Validators.required],
      }),
      campgroundLocation: new FormControl(null, {
        validators: [Validators.required],
        asyncValidators: [mimeType],
      }),
    });

    this.route.paramMap.subscribe((paramMap: ParamMap) => {
      if (paramMap.has('campgroundId')) {
        this.mode = 'edit';
        this.formHeading = 'Edit Campground';
        this.campgroundId = paramMap.get('campgroundId');
        this.isLoading = true;
        this.campgroundsService.getCampground(this.campgroundId).subscribe(
          (campgroundData) => {
            // stop spinner
            this.isLoading = false;

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
            console.log(error);
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
    console.log('inside onFormSubmit');

    if (this.form.invalid) return;

    this.isLoading = true;

    if (this.mode === 'create') {
      this.campgroundsService
        .createCampground(
          this.form.value.campgroundName,
          this.form.value.campgroundPrice,
          this.form.value.campgroundDescription,
          this.form.value.campgroundLocation,
          this.form.value.campgroundImage
        )
        .subscribe(
          (result) => {
            this.form.reset();
            // console.log('success creating campground', result);
            this.campgroundsService.redirectToCampgrounds();
          },
          (error) => {
            console.log('error creating campground', error);
          }
        );
    } else {
      this.campgroundsService
        .updateCampground(
          this.campgroundId,
          this.form.value.campgroundName,
          this.form.value.campgroundPrice,
          this.form.value.campgroundDescription,
          this.form.value.campgroundLocation,
          this.form.value.campgroundImage
        )
        .subscribe(
          (response) => {
            this.form.reset();
            // console.log('success editing campground', response);
            this.campgroundsService.redirectToCampgrounds();
          },
          (error) => {
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
}
