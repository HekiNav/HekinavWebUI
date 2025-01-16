export function padNumber(n: number) {
    return n < 10 ? "0" + n.toString() : n
}
export function currentTimeString() {
    const now = new Date()
    return `${padNumber(now.getHours())}:${padNumber(now.getMinutes())}`
}
export function currentDateString() {
    const now = new Date()
    return `${now.getFullYear()}-${padNumber(now.getMonth() + 1)}-${padNumber(now.getDate() + 1)}`
}
export function RFC3339fromTimeStringandDateString(time: string, date: string) {
    return `${date}T${time}+03:00`
}