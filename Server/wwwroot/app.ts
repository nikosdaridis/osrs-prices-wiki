// Gets local time and timezone of client
function getClientTimeInfo(): { localTime: string, timeZone: string } {
    return {
        localTime: new Date().toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
}
