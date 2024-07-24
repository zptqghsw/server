const insure = require('./insure');
const select = require('./select');
const crypto = require('../crypto');
const request = require('../request');
const { getManagedCacheStorage } = require('../cache');
const { logScope } = require('../logger');
const logger = logScope('provider/match');

const format = (song) => {
	return {
		id: song['id'],
		name: song['name'],
		artist: song['artist'],
		album: song['album'],
		pic_id: song['pic_id'],
		lyric_id: song['lyric_id'],
		source: song['source'],
	};
};

const search = (info) => {
	const url =
		'https://music-api.gdstudio.xyz/api.php?types=search&source=spotify&' +
		'name=' + encodeURIComponent(info.keyword);

	return request('GET', url)
		.then((response) => response.json())
		.then((jsonBody) => {
			const list = jsonBody.map(format)
			// const list = jsonBody.data.info.map(format);
			const matched = select(list, info);
			logger.debug({matched}, 'Getting Song URL');
			return matched ? matched : Promise.reject();
		})
		.catch(() => insure().kugou.search(info));
};

const track = (song) => {
	// Credit: This API is provided by GD studio (music.gdstudio.xyz).
	const url =
		'https://music-api.gdstudio.xyz/api.php?types=url&source=spotify&id=' +
		song.id +
		'&br=' +
		['999', '320'].slice(
			select.ENABLE_FLAC ? 0 : 1,
			select.ENABLE_FLAC ? 1 : 2
		);
	return request('GET', url)
		.then((response) => response.json())
		.then((jsonBody) => {
			if (
				jsonBody &&
				typeof jsonBody === 'object' &&
				(!'url') in jsonBody
			)
				return Promise.reject();
            const url_new = 'https://music-api.gdstudio.xyz/' + jsonBody.url
			return jsonBody.br > 0 ? url_new : Promise.reject();
		}).catch(() => insure().kugou.track(song));
};

const cs = getManagedCacheStorage('provider/kugou');
const check = (info) => cs.cache(info, () => search(info)).then(track);

module.exports = { check, search };
