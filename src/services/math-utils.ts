export default class MathUtils {
    static roundToNearestHundred(value: number): number {
        const remainder = value % 100;
        if (remainder === 0) {
            return value;
        }
        const nextMultipleOf100 = value + (100 - remainder);
        return nextMultipleOf100;
    }
}
