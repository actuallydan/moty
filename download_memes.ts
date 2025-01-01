const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const memeData = JSON.parse(fs.readFileSync('top_memes.json', 'utf8'));

memeData.forEach((meme, index) => {
    try {
        const attachment = meme.attachments[0];
        const downloadUrl = attachment.attachment;
        const originalExt = path.extname(attachment.name); // Get original extension
        const protocol = downloadUrl.startsWith('https') ? https : http;
        const file = fs.createWriteStream(`meme_${index}${originalExt}`);

        protocol.get(downloadUrl, (response) => {
            response.pipe(file);

            file.on("finish", () => {
                file.close();
                console.log(`Downloaded meme ${index}${originalExt}`);
            });
        }).on('error', (err) => {
            console.error(`Failed to download meme ${index}`);
            console.log(`Original URL: ${meme.url}`);
            console.error(err);
        });
    } catch (err) {
        console.error(`Error processing meme ${index}`);
        console.log(`Original URL: ${meme.url}`);
        console.error(err);
    }
});