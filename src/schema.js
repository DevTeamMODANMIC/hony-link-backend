const { gql } = require('graphql-tag');

const typeDefs = gql`
  # ── Scalars ─────────────────────────────────────────────────────
  scalar Date

  # ── Auth ────────────────────────────────────────────────────────
  type AuthPayload {
    token: String!
    user:  User!
  }

  # ── User ────────────────────────────────────────────────────────
  type User {
    id:         ID!
    email:      String!
    username:   String!
    isVerified: Boolean!
    profile:    Profile
    subscription: Subscription
    createdAt:  Date!
  }

  # ── Profile ─────────────────────────────────────────────────────
  type Profile {
    id:         ID!
    user:       User!
    bio:        String
    age:        Int
    gender:     String
    interests:  [String!]
    photos:     [String!]
    city:       String
    lookingFor: String
    minAge:     Int
    maxAge:     Int
    updatedAt:  Date!
  }

  input UpdateProfileInput {
    bio:        String
    age:        Int
    gender:     String
    interests:  [String!]
    photos:     [String!]
    city:       String
    latitude:   Float
    longitude:  Float
    lookingFor: String
    minAge:     Int
    maxAge:     Int
  }

  # ── Swipe ────────────────────────────────────────────────────────
  type SwipeResult {
    direction: String!
    matched:   Boolean!
    match:     Match
  }

  # ── Match ────────────────────────────────────────────────────────
  type Match {
    id:        ID!
    users:     [User!]!
    createdAt: Date!
  }

  # ── Chat ─────────────────────────────────────────────────────────
  type Chat {
    id:           ID!
    participants: [User!]!
    lastMessage:  Message
    createdAt:    Date!
    updatedAt:    Date!
  }

  # ── Message ──────────────────────────────────────────────────────
  type Message {
    id:        ID!
    chat:      Chat!
    sender:    User!
    text:      String
    readBy:    [User!]!
    createdAt: Date!
  }

  # ── Short ────────────────────────────────────────────────────────
  type Short {
    id:        ID!
    uploader:  User!
    videoUrl:  String!
    caption:   String
    likesCount: Int!
    createdAt: Date!
  }

  # ── Subscription ─────────────────────────────────────────────────
  type Subscription {
    id:        ID!
    user:      User!
    plan:      String!
    status:    String!
    startDate: Date!
    endDate:   Date
    createdAt: Date!
  }

  # ── Queries ──────────────────────────────────────────────────────
  type Query {
    me:            User!
    allUsers(limit: Int, offset: Int): [User!]!
    swipeFeed(limit: Int): [User!]!
    searchUsers(
      q:      String!
      limit:  Int
      city:   String
      minAge: Int
      maxAge: Int
    ): [User!]!
    shortsFeed(limit: Int): [Short!]!
    chatList(limit:  Int): [Chat!]!
    messages(chatId: ID!, limit: Int): [Message!]!
    myMatches: [Match!]!
  }

  # ── Mutations ─────────────────────────────────────────────────────
  type Mutation {
    signup(email: String!, password: String!, username: String!): AuthPayload!
    login(email:  String!, password: String!): AuthPayload!
    updateProfile(input: UpdateProfileInput!): Profile!
    swipe(toUserId: ID!, direction: String!): SwipeResult!
    createChat(userId: ID!): Chat!
    sendMessage(chatId: ID!, text: String!): Message!
    uploadShort(videoUrl: String!, caption: String): Short!
    subscribe(plan: String!): Subscription!
  }
`;

module.exports = typeDefs;
