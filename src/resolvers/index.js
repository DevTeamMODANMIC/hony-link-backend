const authResolvers  = require('./authResolvers');
const userResolvers  = require('./userResolvers');
const swipeResolvers = require('./swipeResolvers');
const chatResolvers  = require('./chatResolvers');
const shortResolvers = require('./shortResolvers');

// Merge all resolvers
const resolvers = {
  Query: {
    ...userResolvers.Query,
    ...swipeResolvers.Query,
    ...chatResolvers.Query,
    ...shortResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...userResolvers.Mutation,
    ...swipeResolvers.Mutation,
    ...chatResolvers.Mutation,
    ...shortResolvers.Mutation,
  },
  // Type-level field resolvers
  User:         userResolvers.User,
  SwipeResult:  swipeResolvers.SwipeResult,
  Match:        swipeResolvers.Match,
  Chat:         chatResolvers.Chat,
  Message:      chatResolvers.Message,
  Short:        shortResolvers.Short,
  Subscription: shortResolvers.Subscription,
};

module.exports = resolvers;
