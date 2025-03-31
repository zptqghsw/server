const insure = require('./insure');
const select = require('./select');
const request = require('../request');
const { getManagedCacheStorage } = require('../cache');

const format = (song) => {
	return {
		id: song.n,
		name: song.songname,
		artists: { id: song.song_rid, name: song.singer },
	};
};

const search = (info) => {
	const keyword = encodeURIComponent(info.keyword);
	const url =
		'https://www.hhlqilongzhu.cn/api/dg_kuwomusic.php?type=json&msg=' +
		keyword;

	return request('GET', url)
		.then((response) => response.json())
		.then((jsonBody) => {
			const list = jsonBody.data.map(format);
			const matched = select(list, info);
			return matched ? matched : Promise.reject();
		});
};

const track = (song) => {
	const url =
		'https://www.hhlqilongzhu.cn/api/dg_kuwomusic.php?type=json&msg=' +
		song.name + '&n=' + song.id;

	return request('GET', url)
		.then((response) => response.json())
		.then((jsonBody) => {
			if (jsonBody.code === 200) {
				return jsonBody.flac_url;
			} else {
				return Promise.reject();
			}
		})
		.catch(() => insure().kuwo.track(id));
};

const cs = getManagedCacheStorage('provider/kuwo');
const check = (info) => cs.cache(info, () => search(info)).then(track);

module.exports = { check, track };
