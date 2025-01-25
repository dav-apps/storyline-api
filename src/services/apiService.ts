import { request, gql } from "graphql-request"
import { getNewApiBaseUrl } from "../utils.js"
import { Notification } from "../types.js"

export async function createNotificationForUser(
	queryData: string,
	variables: {
		uuid?: string
		userId: number
		appId: number
		time: number
		interval: number
		title: string
		body: string
		icon?: string
		image?: string
		href?: string
	}
): Promise<Notification> {
	let result = await request<{
		createNotification: Notification
	}>(
		getNewApiBaseUrl(),
		gql`
			mutation CreateNotificationForUser(
				$uuid: String
				$userId: Int!
				$appId: Int!
				$time: Int!
				$interval: Int!
				$title: String!
				$body: String!
				$icon: String
				$image: String
				$href: String
			) {
				createNotificationForUser(
					uuid: $uuid
					userId: $userId
					appId: $appId
					time: $time
					interval: $interval
					title: $title
					body: $body
					icon: $icon
					image: $image
					href: $href
				) {
					${queryData}
				}
			}
		`,
		variables,
		{
			Authorization: process.env.DAV_AUTH
		}
	)

	return result.createNotification
}
