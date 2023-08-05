import BigNumber from "bignumber.js";

export const spanishAmountFmt = {
    prefix: '',
    decimalSeparator: ',',
    groupSeparator: '.',
    groupSize: 3,
    secondaryGroupSize: 0,
    fractionGroupSeparator: ' ',
    fractionGroupSize: 0,
    suffix: '',
}

BigNumber.config({
    DECIMAL_PLACES: 2,
    ROUNDING_MODE: BigNumber.ROUND_HALF_UP,
    FORMAT: spanishAmountFmt,
});

export interface LabItem {
    id: string,
    code: string,
    name: string,
    price: number,
}

export default class LabCalculator {
    private static labItems: LabItem[] = [
        { id: 1, code: 'HPR', name: '17-HIDROXI PROGESTERONA', price: 2623.11 } as LabItem,
        { id: 2, code: 'NU5', name: '5-NUCLEOTIDASA', price: 1772.42 } as LabItem,
        { id: 3, code: 'BHB', name: 'ACIDO BETA HIDROXI BUTIRICO', price: 1000.67 } as LabItem,
        { id: 4, code: 'ABI', name: 'ACIDOS BILIARES', price: 500.42 } as LabItem,
        { id: 5, code: 'AC', name: 'GRASO ACIDOS GRASOS SAT.DE CADENA LARGA', price: 680.95 } as LabItem,
        { id: 6, code: 'ACYL', name: 'ACIL CARNITINA', price: 1730.01 } as LabItem,
        { id: 7, code: 'ACTH', name: 'ACTH CORTICOTROFINA', price: 1500 } as LabItem,
        { id: 8, code: 'ADR', name: 'ADRENALINA PLASM', price: 1772 } as LabItem,
        { id: 9, code: 'ADO', name: 'ADRENALINA en orina', price: 200 } as LabItem,
        { id: 10, code: 'AGUA-B', name: 'AGUA ANALISIS BATERIOLOGICO', price: 250 } as LabItem,
        { id: 11, code: 'AGUA-F', name: 'AGUA ANALISIS FISICO QUIMICO', price: 175 } as LabItem,
        { id: 12, code: 'ALB', name: 'ALBUMINA', price: 8900 } as LabItem,
    ];

    static getTotalAmount(selectedRowData: LabItem[]): BigNumber {
        let totalQuote = 0;
        selectedRowData.forEach(labItem => {
            totalQuote += labItem.price;
        });
        return new BigNumber(totalQuote);
    }

    static getCurrentLabItems() {
        return LabCalculator.labItems;
    }
}
