export const createCondensePrompt = (size = '50%') =>
	`You will condense this text to about ${size} shorter - give or take 15%. You keep every detail, even if you think it does not matter. You keep the tone and style of speaking as well:`;

export const grammarPrompt = `Apply spelling, grammar and incorrectly transcribed word fixes to this transcript. Do not remove or add anything except paragraph spacing where you feel necessary.`;

export const midjourney = `simple vector. visualization of accepting money online, in the style of Netflix movie cover, golden yellow background. black and white , monochrome. painted illustrations, grainy. --v 5 --ar 16:9`;

export const misspellings = `
Please replace all instances of the following words with the correct spelling:

1. Replace "Century" with "Sentry"
2. Replace "Cintax", "Cintech", and "Cintacs" with "Syntax"
`;

export const summarizePrompt = `Summarize the provided podcast transcript into very succinct bullet points, each containing just a few words. The bullet points should correspond to sections, questions or topics discussed in the podcast with points at least every 3-5 minutes. For each bullet point, you may also provide a longer 1-2 sentence summary of the topic if necessary, which may also include the host's opinions, names and thoughts. Do not skip topics.

Remember, the key here is to read through the transcript carefully, identify all points, topics, questions and even banter, and then condense each one into a very brief, clear statement. It's also important to include timestamps if they're provided in the transcript, as they can help give a sense of the flow and structure of the podcast.

Additionally, Please create the following for this podcast episode:

1. 1-2 sentence description about what is covered in the podcast. This should be a short, catchy, and interesting description. It should provoke the listener to stop what they are doing and listen to the podcast.
2. 6-7 tweets for this podcast episode. These tweets should be short, catchy, and interesting. They should provoke the twitter user to respond an join in the conversation. Do not add any hashtags or emojis. Use exclamation points sparingly.
3. 6-7 tweets about this podcast that can be tweeted by listeners of the show. Some examples are "This is a fantastic episode about ___", or "I really enjoyed the part about ____". They should mention @syntaxfm. Do not add any hashtags or emojis. Use exclamation points sparingly.
4. 3-4 hashtags that categorize the episode. these will be used as topic tags on the website.
5. A summary of the podcast into a title. It should be catchy, slightly click-baity, mention a few topics covered and make the listener want to stop what they are doing and watch it.
6. Keep track of any links or websites mentioned in the podcast. These will be used as links on the website. If we don't explicitly mention a website, but instead mention a company, service or resource, find the associated website. Provide the timestamp of when the link is first mentioned. Do not skip links.
8. Provide a list of guest names. If the transcript doesn't include their real name, try to infer it.

${misspellings}

If you, the AI, have feedback or clarifications on your response, please put them in the notes section.

Return each of these things in JSON format that looks like this:

{
  "title": "...",
  "description": "...",
  "notes": "...",
  "summary": [{"time": "02:33", "text": "...", "description": "..."}],
  "tweets": ["..."],
  "topics": ["...", "..."],
  "links": [{ "name": "Name of link", "url": "https://example.com", "timestamp": "02:45" }],
  "guests": ["..."]
}`;

export const summarizePrompt2 = `Summarize the provided podcast transcript into very succinct bullet points, each containing just a few words. The bullet points should correspond to sections, questions or topics discussed in the podcast with points at least every 3-5 minutes.

summary: For each bullet point, provide:

1. time: A timestamp of when the topic is first mentioned
2. text: A short, clear, and concise summary of the topic. This should be a short, catchy, and interesting description. It should provoke the listener to stop what they are doing and listen to the podcast. Leave off any intro wording such as "Discussion on" and "Explanation of"
3. description: 1 to 3 words MAX summarizing the previously mentioned text. Do not provide more than 3 words. If you provide

Remember, the key here is to read through the transcript carefully, identify all points, topics, questions and even banter, and then condense each one into a very brief, clear statement. It's also important to include timestamps if they're provided in the transcript, as they can help give a sense of the flow and structure of the podcast. Do not leave out any topics.

Additionally, Please create the following for this podcast episode:

1. description: 1-2 sentence description about what is covered in the podcast. This should be a short, catchy, and interesting description. It should provoke the listener to stop what they are doing and listen to the podcast.
2. title: A summary of the podcast into a title. It should be catchy, slightly click-baity, mention a few topics covered and make the listener want to stop what they are doing and watch it.
3. tweets: 6-7 tweets for this podcast episode. These tweets should be short, catchy, and interesting. They should provoke the twitter user to respond an join in the conversation. Do not add any hashtags or emojis. Use exclamation points sparingly.
4. topics: 3-4 hashtags that categorize the episode. these will be used as topic tags on the website.
6. links: Keep track of any links or websites mentioned in the podcast. These will be used as links on the website. If we don't explicitly mention a website, but instead mention a company, service or resource, find the associated website. Provide the timestamp of when the link is first mentioned. Do not skip links.
8. guests: Provide a list of guest names. If the transcript doesn't include their real name, try to infer it.

${misspellings}

If you, the AI, have feedback or clarifications on your response, please put them in the notes property.

Return each of these things in JSON format that looks like this:

{
  "summary": [{"time": "02:33", "text": "...", "description": "..."}],
  "description": "...",
  "title": "...",
  "notes": "...",
  "tweets": ["..."],
  "topics": ["...", "..."],
  "links": [{ "name": "Name of link", "url": "https://example.com", "timestamp": "02:45" }],
  "guests": ["..."]
}

Your response must be 100% JSON. Do not respond with any other text or characters.

`;
