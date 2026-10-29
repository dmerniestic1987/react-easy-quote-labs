import BigNumber from 'bignumber.js';
import type { GridRowId, GridRowSelectionModel } from '@mui/x-data-grid';
import LabCalculator, { LabItem } from './lab-calculator';
import MathUtils from './math-utils';

export const EMPTY_SELECTION: GridRowSelectionModel = { type: 'include', ids: new Set() };

/**
 * The grid selection is the single source of truth for the quote. The Data Grid reports "select all" as an
 * `exclude` model (everything except these ids), so both kinds have to be resolved here.
 */
export function getSelectedLabs(model: GridRowSelectionModel): LabItem[] {
  const items = LabCalculator.getCurrentLabItems();
  return model.type === 'include'
    ? items.filter((item) => model.ids.has(item.id))
    : items.filter((item) => !model.ids.has(item.id));
}

export function removeFromSelection(model: GridRowSelectionModel, id: GridRowId): GridRowSelectionModel {
  const ids = new Set(model.ids);
  if (model.type === 'include') ids.delete(id);
  else ids.add(id);
  return { ...model, ids };
}

/** Total of the selected studies, rounded up to the next hundred and formatted without cents. */
export function formatSuggestedTotal(labs: LabItem[]): string {
  const total = LabCalculator.getTotalAmount(labs);
  return new BigNumber(MathUtils.roundToNearestHundred(total.toNumber())).toFormat(0);
}
