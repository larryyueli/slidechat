/**
 * return the formatted time
 * @param {Number} time
 * @return {String}
 */
export function formatTime(time) {
	let now = Date.now();

	const oneMinute = 60 * 1000;
	const oneHour = oneMinute * 60;
	const oneDay = oneHour * 24;
	const oneWeek = oneDay * 7;
	const elapsed = now - time;

	if (elapsed < oneMinute) {
		return `${(elapsed / 1000) >> 0} seconds ago`;
	} else if (elapsed < oneHour) {
		return `${(elapsed / oneMinute) >> 0} minutes ago`;
	} else if (elapsed < oneDay) {
		return `${(elapsed / oneHour) >> 0} hours ago`;
	} else if (elapsed < oneWeek) {
		return `${(elapsed / oneDay) >> 0} days ago`;
	} else {
		let date = new Date(time);
		return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
	}
}

/**
 * return the formatted names
 * @param {Array} names
 * @return {String}
 */
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

/**
 * return an array contain numbers from start to end
 * @param {Number} start
 * @param {Number} end
 * @return {Array[Number]} number array
 */
export function range(start, end) {
	return Array.from({ length: end - start }, (_, i) => start + i);
}

/**
 * return an random integer from 0 to max-1
 * @param {Number} max
 * @returns {Number}
 */
export function randInt(max) {
	return Math.floor(Math.random() * max);
}

const nameList = [
	'AI',
	'Alchemist',
	'Archer',
	'Archimage',
	'Assassin',
	'Astrologist',
	'Bard',
	'Berserker',
	'Blacksmith',
	'Blue Mage',
	'Bounty Hunter',
	'Dancer',
	'Dark Knight',
	'Demon Hunter',
	'Dragon Rider',
	'Dragonborn',
	'Dragoon',
	'Druid',
	'Duelist',
	'Enchanter',
	'Engineer',
	'Fighter',
	'Gladiator',
	'Guardian',
	'Gunblader',
	'Gunner',
	'Homunculus',
	'Hunter',
	'Inquisitor',
	'Joker',
	'Knight',
	'Lancer',
	'Machinist',
	'Mage',
	'Merchant',
	'Monk',
	'Necromancer',
	'Ninja',
	'NPC',
	'Paladin',
	'Pirate',
	'Priest',
	'Prophet',
	'Puppeteer',
	'Red Mage',
	'Rider',
	'Rogue',
	'Sage',
	'Samurai',
	'Scholar',
	'Shaman',
	'Sorcerer',
	'Summoner',
	'Warlock',
	'Warrior',
	'White Mage',
	'Wizard',
];

/**
 * return a random anonymous name
 * @returns {String}
 */
export function getRandomName() {
	return `Anonymous ${nameList[randInt(nameList.length)]}`;
}

/**
 * return the value of given cookieName, null if cookie not exist
 * @param {String} cookieName
 * @returns cookie value
 */
export function getCookie(cookieName) {
	let cookies = document.cookie.split('; ');
	for (let cookie of cookies) {
		let pair = cookie.split('=');
		if (pair[0] === cookieName) {
			return pair[1];
		}
	}
	return null;
}

/**
 * delete the cookie
 * @param {String} cookieName
 */
export function deleteCookie(cookieName) {
	let cookies = document.cookie.split('; ');
	for (let cookie of cookies) {
		let pair = cookie.split('=');
		if (pair[0] === cookieName) {
			document.cookie = cookieName + '=;path=/;';
		}
	}
}

const nameKey = 'SlideChat_DispName';
/**
 * save new display name
 * @param {String} name
 */
export function setDisplayName(name) {
	window.localStorage.setItem(nameKey, name);
}

/**
 * get the display name
 * @returns {String}
 */
export function getDisplayName() {
	let name = window.localStorage.getItem(nameKey);
	if (name) {
		return name;
	}
	name = getRandomName();
	setDisplayName(name);
	return name;
}

// qid for special pages
export const QUESTION_LIST = -1;
export const NEW_QUESTION = -2;
export const MODIFY_CHAT = -3;

export function anonymityMessage(anonymity, realName) {
	switch (anonymity) {
		case 'A':
		case 'B':
			return `Post as ${getDisplayName()}. Anonymous to everyone.`;
		case 'C':
			return `Post as ${realName}`;
		case 'D':
			return `Post as ${getDisplayName()}. Anonymous to classmates but not instructors.`;
		default:
			return '';
	}
}
