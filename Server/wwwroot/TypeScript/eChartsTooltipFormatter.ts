// Defines parameters for echarts tooltip
interface TooltipItem {
    name: string;
    value: number | [string, number];
    seriesName: string;
    color: string;
    marker: string;
}

// Defines custom echarts tooltip formatter
interface EChartParams {
    DateTime?: string;
    Series?: {
        name: string;
        value: number;
        color: string;
        marker: string;
    }[];
    Volume?: {
        name: string;
        value: number;
        color: string;
        marker: string;
    }[];
}

// Formatter for echarts tooltip content
function tooltipFormatter(params: TooltipItem[]): string {
    const eChartParams: EChartParams = {};
    eChartParams.Series = [];

    params.forEach(item => {
        eChartParams.DateTime = item.name;

        eChartParams.Series?.push({
            name: item.seriesName,
            value: item.value as number,
            color: item.color,
            marker: item.marker
        });
    });

    var toolTipContent = `
    <div style="line-height:1;">
        <div style="font-size:14px;color:#000;font-weight:800;">${eChartParams.DateTime}</div>
            <div style="margin-top:20px;">
    `;

    eChartParams.Series?.forEach(item => {
        const seriesContainer = `
        <div style="margin-top:10px;font-size:14px;color:#000000;">
            <div>${item.marker}
                <span style="font-weight:500;margin-left:2px">${item.name}</span>
                <span style=";font-weight:800;float:right;margin-left:20px">${item.value ? new Intl.NumberFormat().format(item.value) : "-"}</span>
            </div>
        </div>
        `;

        toolTipContent += seriesContainer;
    });

    return toolTipContent;
}
