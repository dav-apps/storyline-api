import axios, { AxiosRequestConfig } from "axios"
import { request, gql } from "graphql-request"
import { List, UserApiResponse, TableObject, Notification } from "../types.js"
import {
	apiBaseUrlDevelopment,
	apiBaseUrlStaging,
	apiBaseUrlProduction,
	newApiBaseUrl,
	appId
} from "../constants.js"

function getApiBaseUrl() {
	switch (process.env.ENVIRONMENT) {
		case "staging":
			return apiBaseUrlStaging
		case "production":
			return apiBaseUrlProduction
		default:
			return apiBaseUrlDevelopment
	}
}

export async function getUser(accessToken: string): Promise<UserApiResponse> {
	if (accessToken == null) {
		return null
	}

	try {
		let response = await axios({
			method: "get",
			url: `${getApiBaseUrl()}/v1/user`,
			headers: {
				Authorization: accessToken
			}
		})

		return {
			status: response.status,
			data: {
				id: response.data.id,
				email: response.data.email,
				firstName: response.data.first_name,
				confirmed: response.data.confirmed,
				totalStorage: response.data.total_storage,
				usedStorage: response.data.used_storage,
				plan: response.data.plan,
				dev: response.data.dev,
				provider: response.data.provider,
				profileImage: response.data.profile_image,
				profileImageEtag: response.data.profile_image_etag
			}
		}
	} catch (error) {
		return {
			status: error.response?.status || 500,
			errors: error.response?.data?.errors
		}
	}
}

export async function listTableObjects(params: {
	caching?: boolean
	limit?: number
	offset?: number
	collectionName?: string
	tableName?: string
	userId?: number
	appId: number
	propertyName?: string
	propertyValue?: string
	exact?: boolean
}): Promise<List<TableObject>> {
	try {
		let requestParams: AxiosRequestConfig = {}

		requestParams["app_id"] = appId
		if (params.limit != null) requestParams["limit"] = params.limit
		if (params.offset != null) requestParams["offset"] = params.offset
		if (params.collectionName != null)
			requestParams["collection_name"] = params.collectionName
		if (params.tableName != null)
			requestParams["table_name"] = params.tableName
		if (params.userId != null) requestParams["user_id"] = params.userId
		if (params.propertyName != null)
			requestParams["property_name"] = params.propertyName
		if (params.propertyValue != null)
			requestParams["property_value"] = params.propertyValue
		if (params.exact != null) requestParams["exact"] = params.exact
		if (params.caching != null) requestParams["caching"] = params.caching

		let response = await axios({
			method: "get",
			url: `${getApiBaseUrl()}/v2/table_objects`,
			headers: {
				Authorization: process.env.DAV_AUTH
			},
			params: requestParams
		})

		let result: TableObject[] = []

		for (let obj of response.data.items) {
			result.push({
				uuid: obj.uuid,
				userId: obj.user_id,
				tableId: obj.table_id,
				properties: obj.properties
			})
		}

		return {
			total: response.data.total,
			items: result
		}
	} catch (error) {
		console.error(error.response?.data || error)
		return { total: 0, items: [] }
	}
}

export async function createNotification(
	queryData: string,
	variables: {
		uuid?: string
		userId: number
		appId: number
		time: number
		interval: number
		title: string
		body: string
	}
): Promise<Notification> {
	let result = await request<{
		createNotification: Notification
	}>(
		newApiBaseUrl,
		gql`
			mutation CreateNotification(
				$uuid: String
				$userId: Int!
				$appId: Int!
				$time: Int!
				$interval: Int!
				$title: String!
				$body: String!
			) {
				createNotification(
					uuid: $uuid
					userId: $userId
					appId: $appId
					time: $time
					interval: $interval
					title: $title
					body: $body
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
