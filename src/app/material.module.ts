import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule, MatMenuModule, MatIconModule, MatButtonModule, MatCardModule, MatInputModule, MatProgressSpinnerModule, MatSnackBarModule, MatCheckboxModule, MatDialogModule, MatSelectModule, MatTooltipModule, MatSlideToggleModule, MatGridListModule, MatStepperModule, MatExpansionModule, MatListModule, MatChipsModule, MatTableModule, MatTabsModule, MatRadioModule, MatProgressBarModule } from '@angular/material';

const importedModules = [MatToolbarModule, MatMenuModule, MatIconModule, MatButtonModule, MatCardModule, MatInputModule, MatProgressSpinnerModule, MatSnackBarModule, MatCheckboxModule, MatDialogModule, MatSelectModule, MatTooltipModule, MatSlideToggleModule, MatGridListModule, MatStepperModule, MatExpansionModule, MatListModule, MatChipsModule, MatTableModule, MatTabsModule, MatRadioModule, MatProgressBarModule];

@NgModule({
  imports: importedModules,
  exports: importedModules
})

export class MaterialModule { }
