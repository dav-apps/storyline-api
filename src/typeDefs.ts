export const typeDefs = `#graphql
	type Query {
		retrieveArticle(uuid: String!): Article
		listArticles(
			limit: Int
			offset: Int
		): ArticleList!
	}

	type Publisher {
		uuid: String!
		name: String!
		url: String!
		logoUrl: String!
	}

	type Article {
		uuid: String!
		url: String!
		title: String
		description: String
		date: String
		imageUrl: String
		content: String
	}

	type ArticleList {
		total: Int!
		items: [Article!]!
	}
`
