// Formatter for echarts yAxis labels
function yAxisLabelFormatter(value: number): string {
    if (value < 1_000)
        return value.toString();

    const absValue = Math.abs(value);
    var formattedValue: number;
    var suffix: string;

    if (absValue >= 1_000_000_000) {
        formattedValue = absValue / 1_000_000_000;
        suffix = 'B';
    } else if (absValue >= 1_000_000) {
        formattedValue = absValue / 1_000_000;
        suffix = 'M';
    } else if (absValue >= 1_000) {
        formattedValue = absValue / 1_000;
        suffix = 'K';
    } else {
        formattedValue = absValue;
        suffix = '';
    }

    const format: string = (() => {
        switch (suffix) {
            case 'B': return '0.###';
            case 'M': return '0.##';
            case 'K': return '0.#';
            default: return '0';
        }
    })();

    return `${value < 0 ? "-" : ""}${formattedValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: format.length - 2 })}${suffix}`;
}
