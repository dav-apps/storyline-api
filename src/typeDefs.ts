export const typeDefs = `#graphql
	type Query {
		retrievePublisher(uuid: String!): Publisher
		listPublishers(
			random: Boolean
			limit: Int
			offset: Int
		): PublisherList!
		retrieveFeed(uuid: String!): Feed
		retrieveArticle(uuid: String!): Article
		listArticles(
			publishers: [String!]
			excludeFeeds: [String!]
			limit: Int
			offset: Int
		): ArticleList!
	}

	type Mutation {
		createPublisher(
			name: String!
			description: String!
			url: String!
			logoUrl: String!
		): Publisher!
		updatePublisher(
			uuid: String!
			name: String
			description: String
			url: String
			logoUrl: String
		): Publisher!
		createFeed(
			publisherUuid: String!
			url: String!
		): Feed!
	}

	type Publisher {
		uuid: String!
		slug: String!
		name: String!
		description: String!
		url: String!
		logoUrl: String!
		feeds(
			hasName: Boolean
			limit: Int
			offset: Int
		): FeedList!
		articles(
			limit: Int
			offset: Int
		): ArticleList!
	}

	type PublisherList {
		total: Int!
		items: [Publisher!]!
	}

	type Feed {
		uuid: String!
		url: String!
		name: String
		language: String
		articles(
			exclude: String
			limit: Int
			offset: Int
		): ArticleList!
	}

	type FeedList {
		total: Int!
		items: [Feed!]!
	}

	type Article {
		uuid: String!
		publisher: Publisher!
		slug: String!
		url: String!
		title: String
		description: String
		date: String
		imageUrl: String
		content: String
		summary: String
		feeds(
			limit: Int
			offset: Int
		): FeedList!
	}

	type ArticleList {
		total: Int!
		items: [Article!]!
	}
`
