# Hony Link — Backend API

Node.js + Express + GraphQL (Apollo Server v4) + MongoDB

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create your .env file
cp .env.example .env
# Edit .env and set MONGODB_URI and JWT_SECRET

# 3. Start development server
npm run dev

# 4. Open GraphQL Playground
# http://localhost:4000/graphql
```

## Environment Variables

| Variable        | Description                        | Default       |
|-----------------|------------------------------------|---------------|
| `PORT`          | Server port                        | `4000`        |
| `MONGODB_URI`   | MongoDB connection string          | *(required)*  |
| `JWT_SECRET`    | Secret key for JWT signing         | *(required)*  |
| `JWT_EXPIRES_IN`| JWT expiry duration                | `7d`          |
| `NODE_ENV`      | `development` or `production`      | `development` |

## Project Structure

```
src/
├── index.js              ← Express + Apollo Server entrypoint
├── schema.js             ← GraphQL type definitions
├── resolvers/
│   ├── index.js          ← Merges all resolvers
│   ├── authResolvers.js  ← signup, login
│   ├── userResolvers.js  ← me, swipeFeed, searchUsers, updateProfile
│   ├── swipeResolvers.js ← swipe, myMatches
│   ├── chatResolvers.js  ← chatList, messages, createChat, sendMessage
│   └── shortResolvers.js ← shortsFeed, uploadShort, subscribe
├── models/
│   ├── User.js           ← Auth & verification
│   ├── Profile.js        ← Bio, age, interests, location (2dsphere)
│   ├── Swipe.js          ← Left/right swipe actions
│   ├── Match.js          ← Mutual right swipes
│   ├── Chat.js           ← Conversation metadata
│   ├── Message.js        ← Chat messages
│   ├── Short.js          ← Video metadata
│   └── Subscription.js   ← Plan & status
├── middleware/
│   └── auth.js           ← JWT context, requireAuth(), signToken()
└── utils/
    └── matching.js       ← Smart match scoring (interests + age + distance)
config/
└── db.js                 ← MongoDB connection
```

## Business Logic

| Rule | Implementation |
|------|---------------|
| Match on mutual RIGHT swipe | `swipeResolvers.js` — checks for reciprocal swipe |
| Free users: 5 new chats/day | `chatResolvers.js` — counts today's chats before creating |
| Shorts locked to subscribers | `shortResolvers.js` — checks `Subscription.plan !== 'free'` |
| Geo search | `Profile` model has `2dsphere` index on `location` |
| Smart feed ranking | `utils/matching.js` — scores by interests, age, distance |
| Rate limiting | Auth: 20 req/15min · Global: 200 req/15min |

## Example Queries

### Sign up
```graphql
mutation {
  signup(email: "alice@example.com", password: "secret123", username: "alice") {
    token
    user { id username }
  }
}
```

### Swipe
```graphql
mutation {
  swipe(toUserId: "USER_ID", direction: "RIGHT") {
    matched
    match { id createdAt }
  }
}
```

### Send message
```graphql
mutation {
  sendMessage(chatId: "CHAT_ID", text: "Hey!") {
    id text createdAt
    sender { username }
  }
}
```

### Subscribe
```graphql
mutation {
  subscribe(plan: "premium") {
    plan status endDate
  }
}
```
