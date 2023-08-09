import BigNumber from "bignumber.js";

export default class MathUtils {
    static roundToNearestHundred(value: number): BigNumber {
        const remainder = value % 100;
        if (remainder === 0) {
            return new BigNumber(value);
        }
        const nextMultipleOf100 = value + (100 - remainder);
        return new BigNumber(nextMultipleOf100);
    }
}
