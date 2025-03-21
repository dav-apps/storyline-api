export const apiBaseUrlDevelopment = "http://localhost:3111"
export const apiBaseUrlStaging =
	"https://dav-backend-tfpik.ondigitalocean.app/staging"
export const apiBaseUrlProduction =
	"https://dav-backend-tfpik.ondigitalocean.app"
export const newApiBaseUrlDevelopment = "http://localhost:4000"
export const newApiBaseUrlStaging = "https://dav-api-staging-kb5tf.ondigitalocean.app"
export const newApiBaseUrlProduction =
	"https://dav-api-ax6gp.ondigitalocean.app"
export const websiteBaseUrlDevelopment = "http://localhost:3004"
export const websiteBaseUrlStaging =
	"https://storyline-staging-93s9b.ondigitalocean.app"
export const websiteBaseUrlProduction = "https://storyline.press"

//#region Misc
export const admins = [1]
export const defaultCacheExpiration = 60 * 60 * 24 // 24 hours
export const feedCacheExpiration = 60 * 60 * 24 * 10 // 10 days
//#endregion

//#region App & Table ids
export const appId = 7
export const followTableName = "Follow"
export const followTablePublisherKey = "publisher"
export const followTableExcludedFeedsKey = "excludedFeeds"
export const notificationTableName = "Notification"
export const notificationTablePublisherKey = "publisher"
//#endregion

//#region Regexes
export const urlRegex =
	/^(https?:\/\/)?(([\w.-]+(\.[\w.-]{2,4})+)|(localhost:[0-9]{3,4}))/
//#endregion
