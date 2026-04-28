require('dotenv').config();

const express      = require('express');
const cors         = require('cors');
const rateLimit    = require('express-rate-limit');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { makeExecutableSchema } = require('@graphql-tools/schema');

const connectDB      = require('../config/db');
const typeDefs       = require('./schema');
const resolvers      = require('./resolvers');
const { buildContext } = require('./middleware/auth');

// ── Custom Date scalar ────────────────────────────────────────────
const { GraphQLScalarType, Kind } = require('graphql');
const DateScalar = new GraphQLScalarType({
  name: 'Date',
  serialize:    (v) => (v instanceof Date ? v.toISOString() : v),
  parseValue:   (v) => new Date(v),
  parseLiteral: (ast) => ast.kind === Kind.STRING ? new Date(ast.value) : null,
});

async function bootstrap() {
  await connectDB();

  const app  = express();
  const PORT = process.env.PORT || 4000;

  // ── Rate limiters ─────────────────────────────────────────────
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again later.' },
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Too many auth attempts. Please try again later.' },
  });

  // ── Middleware ────────────────────────────────────────────────
  app.use(cors({ origin: '*', credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(globalLimiter);

  // Stricter limit on auth mutations
  app.use('/graphql', (req, res, next) => {
    const body = req.body || {};
    const op   = body.operationName || '';
    if (['signup', 'login', 'Login', 'Signup'].some(n => op.includes(n))) {
      return authLimiter(req, res, next);
    }
    next();
  });

  app.get("/sample", (req, res)=>{
    return res.send("Hello world");
  });

  // ── Apollo Server ─────────────────────────────────────────────
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers: {
      ...resolvers,
      Date: DateScalar,
    },
  });

  const server = new ApolloServer({
    schema,
    introspection: process.env.NODE_ENV !== 'production',
    formatError: (formattedError, error) => {
      // Hide internal details in production
      if (process.env.NODE_ENV === 'production') {
        const safe = ['Authentication required', 'Invalid email', 'Access denied',
          'not found', 'already in use', 'Upgrade', 'cannot be empty',
          'must be LEFT', 'Cannot swipe', 'Cannot start', 'Invalid plan',
          'Shorts are available', 'Free users', 'parameter'];
        const isSafe = safe.some(m => formattedError.message.includes(m));
        if (!isSafe) return { message: 'Internal server error' };
      }
      return formattedError;
    },
  });

  await server.start();

  app.use(
    '/graphql',
    expressMiddleware(server, { context: buildContext }),
  );

  // ── Health check ──────────────────────────────────────────────
  app.get('/health', (_, res) =>
    res.json({ status: 'ok', timestamp: new Date().toISOString() }),
  );

  // ── 404 guard ─────────────────────────────────────────────────
  app.use((_, res) => res.status(404).json({ error: 'Not found' }));

  app.listen(PORT, () => {
    console.log(`✦  Hony Link API  →  http://localhost:${PORT}/graphql`);
    console.log(`    ENV: ${process.env.NODE_ENV || 'development'}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
