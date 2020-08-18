/** Directive to apply class to truncate text with ellipsis */

import { Directive, HostBinding, OnInit } from '@angular/core';
import { Renderer2, ElementRef } from '@angular/core';

@Directive({
  selector: '[ayTextTruncateEllipsis]',
})
export class TextTruncateEllipsisDirective {
  @HostBinding('class.is-text-truncate-ellipsis') showEllipsis = true;

  // constructor(private elRef: ElementRef, private renderer: Renderer2) {}

  // ngOnInit() {
  //   this.renderer.setStyle(this.elRef.nativeElement, 'text-align', 'left');
  //   this.renderer.setStyle(this.elRef.nativeElement, 'white-space', 'nowrap');
  //   this.renderer.setStyle(this.elRef.nativeElement, 'width', '200px');
  //   this.renderer.setStyle(this.elRef.nativeElement, 'overflow', 'hidden');
  //   this.renderer.setStyle(
  //     this.elRef.nativeElement,
  //     'text-overflow',
  //     'ellipsis'
  //   );
  // }
}
