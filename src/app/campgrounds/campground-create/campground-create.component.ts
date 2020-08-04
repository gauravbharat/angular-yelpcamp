import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { Campground } from '../campground.model';
import { mimeType } from '../../utils/mime-type.validator';

@Component({
  selector: 'app-campground-create',
  templateUrl: './campground-create.component.html',
  styleUrls: ['./campground-create.component.css'],
})
export class CampgroundCreateComponent implements OnInit {
  private mode = 'create';
  private campgroundId: string;
  campground: Campground;
  form: FormGroup;
  isLoading = false;
  displayImageName: string;
  imagePreview: string;

  ngOnInit() {
    this.form = new FormGroup({
      campgroundName: new FormControl(null, {
        validators: [Validators.required, Validators.minLength(6)],
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
  }

  onFormSubmit() {
    console.log('inside onFormSubmit');

    if (this.form.invalid) return;

    console.log('create-data', {
      campgroundName: this.form.value.campgroundName,
      campgroundPrice: this.form.value.campgroundPrice,
      campgroundDescription: this.form.value.campgroundDescription,
      campgroundLocation: this.form.value.campgroundLocation,
      campgroundImage: this.form.value.campgroundImage,
    });
  }

  onImagePicked(e: Event) {
    console.log('inside onImagePicked');

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
}
