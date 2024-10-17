import BigNumber from 'bignumber.js';
import labItemsData from '../../data/lab-oct-2024-test.json';

export const spanishAmountFmt = {
  prefix: '',
  decimalSeparator: ',',
  groupSeparator: '.',
  groupSize: 3,
  secondaryGroupSize: 0,
  fractionGroupSeparator: ' ',
  fractionGroupSize: 0,
  suffix: '',
};

BigNumber.config({
  DECIMAL_PLACES: 2,
  ROUNDING_MODE: BigNumber.ROUND_HALF_UP,
  FORMAT: spanishAmountFmt,
});

export interface LabItem {
    id: number,
    code: string,
    name: string,
    price: number,
}

export default class LabCalculator {
  private static selectedLabItems: LabItem[];

  private static labItems: LabItem[] = labItemsData.map((item, index) => {
    let price = item.price.replace('$', '');
    price = price.replace('.', '');
    const itemBn = new BigNumber(price);
    return {
      id: index,
      name: item.name,
      code: item.code,
      price: itemBn.toNumber(),
    } as LabItem;
  });

  static getTotalAmount(selectedRowData: LabItem[]): BigNumber {
    let totalQuote = 0;
    selectedRowData.forEach((labItem) => {
      totalQuote += labItem.price;
    });
    return new BigNumber(totalQuote);
  }

  static getCurrentLabItems(): LabItem[] {
    return LabCalculator.labItems;
  }

  static setSelectedLabItems(labItems: LabItem[]): void {
    LabCalculator.selectedLabItems = labItems;
  }

  static getSelectedItems(): LabItem[] {
    return LabCalculator.selectedLabItems || [];
  }
}
