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

export function randInt(max) {
	return Math.floor(Math.random() * max);
}
const nameList = [
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
	'Caster',
	'Cook',
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
	'Fisherman',
	'Gladiator',
	'Guardian',
	'Gunblader',
	'Gunner',
	'Herbalist',
	'Hunter',
	'Inquisitor',
	'Joker',
	'Knight',
	'Lancer',
	'Machinist',
	'Mage',
	'Merchant',
	'Miner',
	'Mobile Suit',
	'Monk',
	'Necromancer',
	'Ninja',
	'NPC',
	'Paladin',
	'Pegasus Rider',
	'Pirate',
	'Priest',
	'Prophet',
	'Puppeteer',
	'Red Mage',
	'Rider',
	'Rogue',
	'Rune Saber',
	'Saber',
	'Sage',
	'Samurai',
	'Scholar',
	'Shaman',
	'Sorcerer',
	'Summoner',
	'Warlock',
	'Warrior',
	'White Mage',
	'Witch Doctor',
	'Witch',
	'Wizard',
];
export function getRandomName() {
	return `Anonymous ${nameList[randInt(nameList.length)]}`;
}

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
export function setDisplayName(name) {
	window.localStorage.setItem(nameKey, name);
}

export function getDisplayName() {
	let name = window.localStorage.getItem(nameKey);
	if (name) {
		return name;
	}
	name = getRandomName();
	setDisplayName(name);
	return name;
}
