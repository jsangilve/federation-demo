
const { PubSub, ApolloServer } = require("apollo-server");
const { addResolveFunctionsToSchema } = require('graphql-tools')
const { ApolloGateway } = require("@apollo/gateway");
const { printSchema, printIntrospectionSchema, graphqlSync, introspectionQuery } = require('graphql');


const pubsub = new PubSub();

const gateway = new ApolloGateway({
  serviceList: [
    { name: "accounts", url: "http://localhost:4001/graphql" },
    { name: "reviews", url: "http://localhost:4002/graphql" },
    { name: "products", url: "http://localhost:4003/graphql" },
    { name: "inventory", url: "http://localhost:4004/graphql" }
  ]
});

//const resolvers = {
//  Subscription: {
//    priceChanged: {
//      subscribe: () => pubsub.asyncIterator(['PRICE_CHANGED'])
//    }
//  }
//};

const buildSubscriptionsResolvers = (subscriptions) => ({
  Subscription: {
    priceChanged: {
      subscribe: () => pubsub.asyncIterator(['PRICE_CHANGED'])
    }
  }
})

(async () => {
  const { schema, executor } = await gateway.load();
//	console.log(graphqlSync(schema, introspectionQuery).data.__schema.subscriptionType)
//	console.log(printSchema(schema))
	console.log(Object.keys(schema.getSubscriptionType().getFields()))
  addResolveFunctionsToSchema({schema, resolvers});


  const server = new ApolloServer({ schema, executor });  
  
  // Refresh schema
//  setInterval(async () => {
//    gateway.isReady = false;
//    const { schema, executor } = await gateway.load();
//    console.log("Applying new schema");
//    server.schema = schema;
//  }, 5000)

  // Publish subscription event
  setInterval(() => {
    pubsub.publish('PRICE_CHANGED', {priceChanged: {
      upc: "1",
      price: 200,
    }})
  }, 1000)

  server.listen().then(({ url }) => {
    console.log(`🚀 Server ready at ${url}`);
  });
})();

