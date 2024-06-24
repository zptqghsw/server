const insure = require('./insure');
const select = require('./select');
const crypto = require('../crypto');
const request = require('../request');
const { getManagedCacheStorage } = require('../cache');

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
		'https://music-api.gdstudio.xyz/api.php?types=search&source=kugou&' +
		'name=' + encodeURIComponent(info.keyword);

	return request('GET', url)
		.then((response) => response.json())
		.then((jsonBody) => {
			// const list = jsonBody.data.lists.map(format)
			const list = jsonBody.data.info.map(format);
			const matched = select(list, info);
			return matched ? matched : Promise.reject();
		})
		.catch(() => insure().kugou.search(info));
};

const track = (song) => {
	// Credit: This API is provided by GD studio (music.gdstudio.xyz).
	const url =
		'https://music-api.gdstudio.xyz/api.php?types=url&source=kugou&id=' +
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

			return jsonBody.br > 0 ? jsonBody.url : Promise.reject();
		});
};

const cs = getManagedCacheStorage('provider/kugou');
const check = (info) => cs.cache(info, () => search(info)).then(track);

module.exports = { check, search };
