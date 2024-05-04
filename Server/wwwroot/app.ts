function getClientTimeInfo(): { localTime: string, timeZone: string } {
    return {
        localTime: new Date().toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
}

function moveProgressIndicator(): void {
    const dataGridGroupHeader = document.querySelector<HTMLElement>('.rz-group-header');
    const updateProgressCircle = document.querySelector<HTMLElement>('.rz-progressbar-circular');

    if (dataGridGroupHeader && updateProgressCircle)
        dataGridGroupHeader.appendChild(updateProgressCircle);
}
