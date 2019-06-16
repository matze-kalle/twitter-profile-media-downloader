const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const https = require('https');
const moment = require('moment');
const mediaDir = path.resolve('media');

module.exports = (tweets, params) => {
    let lastDate = null;
    let dateCounter = 1;

    for (const tweet of tweets) {
        const twitterDate = new Date(tweet.created_at);
        const tpmdlDate = moment(twitterDate).format('Y-MM-DD');
        const allMedia = _.filter(tweet.extended_entities.media, (media) => {
            return params.mediaTypes[media.type];
        });

        for (const media of allMedia) {
            let url = null;
            let ext = null;
            const mediaType = {
                photo: false,
                video: false,
                animated_gif: false,
            };

            mediaType[media.type] = true;

            lastDate === tpmdlDate ? dateCounter++ : dateCounter = 1;
            lastDate = tpmdlDate;

            if (mediaType.video) {
                const extRegExp = /\/\w+$/;
                let bestVideo = _.find(media.video_info.variants, 'bitrate');

                media.video_info.variants.forEach((video) => {
                    if (video.bitrate > bestVideo.bitrate) {
                        bestVideo = video;
                    }
                });

                url = bestVideo.url;
                ext = _.head(bestVideo.content_type.match(extRegExp)).replace('/', '.');
            } else {
                const extRegExp = /\.\w+$/;

                if (mediaType.photo) {
                    url = media.media_url_https;
                } else if (mediaType.animated_gif) {
                    url = _.head(media.video_info.variants).url;
                }

                ext = _.head(url.match(extRegExp));
            }

            const fileName = `${tpmdlDate} (${dateCounter})${ext}`;
            const filePath = path.join(mediaDir, fileName);
            const fileStream = fs.createWriteStream(filePath);

            https.get(url, (res) => {
                res.pipe(fileStream);
            });
        }
    }
};
