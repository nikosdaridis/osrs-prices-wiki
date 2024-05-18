// Gets local time and timezone of client
function getClientTimeInfo(): { localTime: string, timeZone: string } {
    return {
        localTime: new Date().toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
}

// Moves element by id to selector at position first or last and removes hidden class
function moveElement(id: string, selector: string, position: "first" | "last" = "last"): void {
    const elementToMove = document.getElementById(id);
    const parentElements = document.querySelectorAll<HTMLElement>(selector);

    if (!elementToMove)
        return;

    parentElements.forEach(parent => {
        if (elementToMove.parentNode)
            elementToMove.parentNode.removeChild(elementToMove);

        if (position === "first")
            parent.insertBefore(elementToMove, parent.firstChild);
        else
            parent.appendChild(elementToMove);

        elementToMove.classList.remove("hidden");
    });
}
