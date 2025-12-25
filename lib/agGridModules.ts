/**
 * AG Grid Module Registration
 * 
 * Centralized module registration for AG Grid v35+.
 * This file must be imported exactly once at application bootstrap.
 * 
 * Registers all modules required by the Pricing Console to prevent runtime errors.
 */

import { ModuleRegistry } from "ag-grid-community";
import {
    ClientSideRowModelModule,
    RowSelectionModule,
    ValidationModule,
    NumberEditorModule,
    TextEditorModule,
    TextFilterModule,
    NumberFilterModule,
} from "ag-grid-community";

// CRITICAL: RowStyleModule and CellStyleModule are required for styling functionality
// Without these, AG Grid v33+ throws error #200
import { RowStyleModule, CellStyleModule } from "ag-grid-community";

ModuleRegistry.registerModules([
    ClientSideRowModelModule,
    RowSelectionModule,
    ValidationModule,
    NumberEditorModule,
    TextEditorModule,
    TextFilterModule,
    NumberFilterModule,
    RowStyleModule,    // Fixes error #200 for getRowClass
    CellStyleModule,   // Fixes error #200 for cellClass and cellStyle
]);
