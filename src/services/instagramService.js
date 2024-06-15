const axios = require('axios');
const { ReclaimServiceResponse } = require('../utils/reclaimServiceResponse');

exports.processInstagramData = async (proof, providerName) => {
  const instagramUsername = JSON.parse(proof[0].claimData.context).extractedParameters.userName;
  const lastUpdateTimeStamp = proof[0].claimData.timestampS;

  const postCount = await getUserPosts(instagramUsername);

  return new ReclaimServiceResponse(
    providerName,
    lastUpdateTimeStamp,
    instagramUsername,
    postCount,
    proof[0]
  );
}

const getUserPosts = async (username) => {
  const instagramAccessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const userId = await getInstagramUserId(username, instagramAccessToken);
  const daysAgo = 3650;
  const dateSince = new Date(new Date().setDate(new Date().getDate() - daysAgo)).toISOString();
  
  const url = `https://graph.instagram.com/${userId}/media?fields=id,caption,timestamp&access_token=${instagramAccessToken}`;
  
  const response = await axios.get(url);
  const posts = response.data.data;

  const filteredPosts = posts.filter(post => new Date(post.timestamp) >= new Date(dateSince));
  
  console.log(`Total posts by ${username} in the last 10 years: ${filteredPosts.length}`);
  return filteredPosts.length;
}

const getInstagramUserId = async (username, accessToken) => {
  const url = `https://graph.instagram.com/v12.0/ig_hashtag_search?user_id=${username}&access_token=${accessToken}`;
  
  const response = await axios.get(url);
  const userId = response.data.id;
  
  if (!userId) {
    throw new Error('User ID not found');
  }
  
  return userId;
}
