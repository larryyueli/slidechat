export function formatTime(time) {
    let now = Date.now();

    const oneMinute = 60 * 1000;
    const oneHour = oneMinute * 60;
    const oneDay = oneHour * 24;
    const oneWeek = oneDay * 7;
    const elapsed = now - time;

    if (elapsed < oneMinute) {
        return `${elapsed / 1000 >> 0} seconds ago`;
    } else if (elapsed < oneHour) {
        return `${elapsed / oneMinute >> 0} minutes ago`;
    } else if (elapsed < oneDay) {
        return `${elapsed / oneHour >> 0} hours ago`;
    } else if (elapsed < oneWeek) {
        return `${elapsed / oneDay >> 0} days ago`;
    } else {
        let date = new Date(time);
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    }
}

export function formatNames(names) {
    let len = names.length;
    if (len === 1) {
        return names[0];
    } else if (len === 2) {
        return `${names[0]} and ${names[1]}`;
    } else if (len === 3) {
        return `${names[0]}, ${names[1]} and ${names[2]}`;
    } else if (len > 3) {
        return `${names[0]}, ${names[1]}, ${names[2]} and ${len - 3} more`;
    } else {
        return 'error';
    }
}

export function range(start, end) {
    return Array.from({ length: end - start }, (_, i) => start + i);
}

export function getRandomNumber(max){
    return Math.floor(Math.random() * max);
}

export function getRandomName(names){
    return `anonymous ${names[getRandomNumber(names.length)]}`
}