/** 06082020 - Had used disabled attribute on reactive form control (create/edit campground component)
 * to disable select form controls when 'isLoading === true'. However it did not work
 * Moreover, Angular console logged a message recommending setting the disabled property
 * when instantiating the form control.
 *
 * Used another approach to create a custom directive and use it instead
 * passing the enable/disable condition
 */

import { FormControl } from '@angular/forms';
import { Directive, Input } from '@angular/core';

@Directive({
  selector: '[formControl][disableControl]',
})
export class DisableControlDirective {
  @Input() formControl: FormControl;

  constructor() {}

  get disableCond(): boolean {
    return !!this.formControl && this.formControl.disabled;
  }

  @Input('disableCond') set disableCond(condition: boolean) {
    if (!this.formControl) return;
    else if (condition) this.formControl.disable();
    else this.formControl.enable();
  }
}
