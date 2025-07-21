"use strict";

var Twitter = require('twitter'); // Initialize Twitter client


var client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
}); // Function to repost a Twitter post by ID

function repostTwitterPost(postId) {
  return regeneratorRuntime.async(function repostTwitterPost$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _context.next = 3;
          return regeneratorRuntime.awrap(client.post('statuses/retweet/:id', {
            id: postId
          }));

        case 3:
          console.log("Successfully reposted Twitter post with ID: ".concat(postId));
          _context.next = 9;
          break;

        case 6:
          _context.prev = 6;
          _context.t0 = _context["catch"](0);
          console.error("Error reposting Twitter post with ID ".concat(postId, ":"), _context.t0);

        case 9:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 6]]);
}

module.exports = repostTwitterPost;