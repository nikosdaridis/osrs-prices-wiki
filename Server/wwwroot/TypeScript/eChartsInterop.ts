export { };

declare global {
    const echarts: any;

    interface Window {
        eChartsInterop: {
            initializeDataZoomHandler(dotNetHelper: ItemChartRef): void;
        };
    }
}

interface ItemChartRef {
    invokeMethodAsync(methodName: string, ...args: any[]): void;
}

interface DataZoomParams {
    batch?: { start: number, end: number }[];
    start?: number;
    end?: number;
}

// Initializes data zoom handler for echarts
window.eChartsInterop = {
    initializeDataZoomHandler(itemChartRef: ItemChartRef): void {

        tryInitialize();
        function tryInitialize(): void {
            const chartDom = document.querySelector('[id^="echerts_"]');

            if (!chartDom) {
                setTimeout(tryInitialize, 100);
                return;
            }

            const itemChart = echarts.getInstanceByDom(chartDom);

            if (!itemChart) {
                setTimeout(tryInitialize, 100);
                return;
            }

            itemChart.on('datazoom', (params: DataZoomParams) => {
                const { start, end } = params.batch ? params.batch[0] : params

                if (typeof start === 'number' && typeof end === 'number') {
                    itemChartRef.invokeMethodAsync('HandleDataZoom', Math.round(start), Math.round(end));
                }
            });
        }
    }
};
