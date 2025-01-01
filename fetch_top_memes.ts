import { Client, GatewayIntentBits } from 'discord.js';
import fs from 'fs/promises';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

// Replace with your channel ID
const CHANNEL_ID = '833509356012044349';
const TOP_COUNT = 32;

async function getTopPosts() {
    try {
        const channel = await client.channels.fetch(CHANNEL_ID);
        let allMessages = [];
        
        // Set start date to January 1st, 2024
        const startDate = new Date('2024-01-01T00:00:00Z');
        // Add end date of January 1st, 2025
        const endDate = new Date('2024-12-26T00:00:00Z');
        
        // Fetch messages from the channel between Jan 1st 2024 and Jan 1st 2025
        let lastId = null;
        while (true) {
            const options = { limit: 100 };
            if (lastId) options.before = lastId;
                        
            const messages = await channel.messages.fetch(options);
            if (messages.size === 0) break;
            
            // Filter messages by date range while fetching
            const validMessages = messages.filter(msg => 
                msg.createdTimestamp >= startDate.getTime() && 
                msg.createdTimestamp < endDate.getTime()
            );
            
            // Stop if we've reached messages older than Jan 1st 2024
            if (validMessages.size === 0) {
                break;
            }
            
            allMessages.push(...validMessages.values());
            lastId = messages.last().id;
        }

        // Filter messages that contain media
        const mediaMessages = allMessages.filter(msg => {
            return msg.attachments.size > 0 || // Has attachments
                   msg.embeds.length > 0 || // Has embeds
                   /https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|mp4|webm)/i.test(msg.content); // Has media links
        });

        // Score and sort messages
        const scoredMessages = mediaMessages.map(msg => ({
            content: msg.content,
            attachments: [...msg.attachments.values()],
            embeds: msg.embeds,
            url: msg.url,
            reactionCount: msg.reactions.cache.reduce((acc, reaction) => acc + reaction.count, 0),
            replyCount: msg.thread?.messageCount || 0,
            totalScore: (msg.reactions.cache.reduce((acc, reaction) => acc + reaction.count, 0) * 2) + 
                       (msg.thread?.messageCount || 0),
            timestamp: msg.createdTimestamp
        }));

        const topPosts = scoredMessages
            .sort((a, b) => b.totalScore - a.totalScore)
            .slice(0, TOP_COUNT);

        // Save results to a JSON file
        await fs.writeFile(
            'top_memes.json', 
            JSON.stringify(topPosts, null, 2)
        );

        console.log(`Successfully saved ${topPosts.length} top posts to top_memes.json`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

client.once('ready', () => {
    console.log('Bot is ready, fetching top posts...');
    getTopPosts();
});

client.login(process.env.DISCORD_TOKEN); 