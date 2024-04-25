function moveProgressIndicator(): void {
    const dataGridGroupHeader = document.querySelector<HTMLElement>('.rz-group-header');
    const updateProgressCircle = document.querySelector<HTMLElement>('.rz-progressbar-circular');

    if (dataGridGroupHeader && updateProgressCircle)
        dataGridGroupHeader.appendChild(updateProgressCircle);
}
