import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipDirective } from './directives/tooltip.directive';
import { DropdownDirective } from './directives/dropdown.directive';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    TooltipDirective,
    DropdownDirective
  ],
  exports: [
    TooltipDirective,
    DropdownDirective
  ]
})
export class SharedModule { }




