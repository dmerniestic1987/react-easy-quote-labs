import BigNumber from "bignumber.js";

export const spanishAmountFmt = {
    prefix: '',
    decimalSeparator: ',',
    groupSeparator: '.',
    groupSize: 3,
    secondaryGroupSize: 0,
    fractionGroupSeparator: ' ',
    fractionGroupSize: 0,
    suffix: ''
}

BigNumber.config({
    DECIMAL_PLACES: 2,
    ROUNDING_MODE: BigNumber.ROUND_HALF_UP,
    FORMAT: spanishAmountFmt
});

export interface LabItem {
    id: string,
    code: string,
    name: string,
    price: number,
}

export default class LabCalculator {
    static getTotalAmount(selectedRowData: LabItem[]): BigNumber {
        let totalQuote = 0;
        selectedRowData.forEach(labItem => {
            totalQuote += labItem.price;
        });
        return new BigNumber(totalQuote);
    }
}
