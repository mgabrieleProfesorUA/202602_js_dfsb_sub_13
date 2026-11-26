import { ApolloServer } from "@apollo/server";
import { PubSub } from "graphql-subscriptions";
import { startStandaloneServer } from "@apollo/server/standalone";

const pubsub = new PubSub();

const typeDefs = `
  type Post {
    id: ID!
    content: String!
  }

  type Query {
    posts: [Post!]!
  }

  type Mutation {
    createPost(content: String!): Post!
  }

  type Subscription {
    postCreated: Post!
  }
`;

const POST_CREATED = 'POST_CREATED';

let posts = [];
let nextPostId = 1;

const resolvers = {
  Query: {
    posts: () => posts,
  },

  Mutation: {
    createPost: (_, { content }) => {
      const newPost = { id: String(nextPostId++), content };
      posts.push(newPost);
      pubsub.publish(POST_CREATED, { postCreated: newPost }); // Publish the event
      return newPost;
    },
  },

  Subscription: {
    postCreated: {
      subscribe: () => pubsub.asyncIterator([POST_CREATED]), // Subscribe to the event
    },
  },

};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: {
    pubsub,
  },
});

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});
console.log(`🚀  Server ready at: ${url}`);
