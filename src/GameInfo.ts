export type GameInfo = {
  metadata: {
    id: string
    title: string
    description: string
    keyImages: Array<{
      type: string
      url: string
      md5: string
      width: number
      height: number
      size: number
      uploadedDate: string
    }>
    categories: Array<{
      path: string
    }>
    namespace: string
    status: string
    creationDate: string
    lastModifiedDate: string
    customAttributes: {
      CanRunOffline: {
        type: string
        value: string
      }
      PresenceID: {
        type: string
        value: string
      }
      MonitorPresence: {
        type: string
        value: string
      }
      CloudSaveFolder: {
        type: string
        value: string
      }
      UseAccessControl: {
        type: string
        value: string
      }
      RequirementsJson: {
        type: string
        value: string
      }
      CanSkipKoreanIdVerification: {
        type: string
        value: string
      }
      FolderName: {
        type: string
        value: string
      }
      developerName: {
        type: string
        value: string
      }
    }
    entitlementName: string
    entitlementType: string
    itemType: string
    releaseInfo: Array<{
      id: string
      appId: string
      compatibleApps: []
      platform: [string]
      dateAdded: string
      releaseNote: ''
      versionTitle: ''
    }>
    developer: string
    developerId: string
    eulaIds: Array<string>
    endOfSupport: false
    dlcItemList: Array<GameInfo>
    ageGatings: {}
    applicationId: ''
    unsearchable: false
  }
  asset_infos: {
    Windows: {
      app_name: string
      asset_id: string
      build_version: string
      catalog_item_id: string
      label_name: string
      namespace: string
      metadata: {
        installationPoolId: string
      }
    }
  }
  app_name: string
  app_title: string
  base_urls: []
}
