# invoke()

> God node · 134 connections · [D:\.MUSICVERSE\aimusicverse\src\api\voice-clone.api.ts](file:///D:/.MUSICVERSE/aimusicverse/src/api/voice-clone.api.ts#L14)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as invoke()
    participant P1 as handleAudioActionCallback()
    participant P2 as from
    participant P3 as uploadAndShowActions()
    participant P4 as handleClassificationCallback()
    participant P5 as processVoiceMessage()
    participant P6 as handleAutoUploadWithPipeline()
    participant P7 as handleProjects()
    participant P8 as getPublicUrl()
    participant P9 as handleAudioMessage()
    participant P10 as handleLibrary()
    participant P11 as setActiveMenuMessageId()
    participant P12 as handleProjectsCallback()
    participant P13 as initiateTariffPurchase()
    participant P14 as uploadFile()
    participant P15 as trackConversionStage()
    participant P16 as handleGenerate()
    participant P17 as handleGuitarAudio()
    participant P18 as handleMidiCommand()
    participant P19 as handleStatus()
    participant P20 as sendNotification()
    participant P21 as handleProjectsCarousel()
    participant P22 as handleCheckTask()
    participant P23 as handleInlineQuery()
    participant P24 as startMidiConversion()
    participant P25 as handleCloudUploadWithAnalysis()
    participant P26 as processMediaGroupAction()
    participant P27 as handleProjectDetails()
    participant P28 as trackDeeplinkVisit()
    participant P29 as trackDeepLinkAnalytics()
    participant P30 as showOnboardingStep()
    participant P31 as handleTrackDetails()
    participant P32 as handleVoiceForGeneration()
    participant P33 as handleGenerateFromReference()
    participant P34 as .getState()
    participant P35 as showCloudFiles()
    participant P36 as handleProjectDeepLink()
    participant P37 as handleAnalyzeCommand()
    participant P38 as handleInlineQuery()
    participant P39 as handlePianoCommand()
    participant P40 as handleMyUploads()
    participant P41 as .saveState()
    participant P42 as processAudioUpload()
    participant P43 as handleTrackDeepLink()
    participant P44 as handleAchievements()
    participant P45 as handleTransactions()
    participant P46 as startGenerationFromVoice()
    participant P47 as saveWizardState()
    participant P48 as .persistToDatabase()
    participant P49 as processQueueItem()
    participant P50 as handleSendTrackToChat()
    participant P51 as .getState()
    participant P52 as showCloudTracks()
    participant P53 as getMenuItem()
    participant P54 as startGeneration()
    participant P55 as fetchTracks()
    participant P56 as deleteTrackWithCleanup()
    participant P57 as sendAlertToAdmins()
    participant P58 as checkAndUnlockAchievements()
    participant P59 as handleAnalyzeList()
    participant P60 as handleGuitarCommand()
    participant P61 as handleLyrics()
    participant P62 as handleAddToPlaylist()
    participant P63 as handleRecognizeAudio()
    participant P64 as handleCheckStemsStatus()
    participant P65 as handleStudio()
    participant P66 as handleArtistDetails()
    participant P67 as showAudioClassificationPromptInternal()
    participant P68 as handleArtistDeepLink()
    participant P69 as handleProfileDeepLink()
    participant P70 as handleChosenInlineResult()
    participant P71 as handleBuyCommand()
    participant P72 as startQuickGeneration()
    participant P73 as loadTiers()
    participant P74 as handlePlayTrack()
    participant P75 as handleShareTrack()
    participant P76 as createProject()
    participant P77 as fetchUserCredits()
    participant P78 as createChangelogEntry()
    participant P79 as .generateFallback()
    participant P80 as handleSuccessfulPayment()
    participant P81 as handleAnalyzeSelect()
    participant P82 as handleTrackStats()
    participant P83 as handleStemSeparation()
    participant P84 as handleSelectReference()
    participant P85 as handleUseReference()
    participant P86 as .getTrackById()
    participant P87 as .getUserProjects()
    participant P88 as handleArtistsCallback()
    participant P89 as handleArtistTracks()
    participant P90 as showFileDetails()
    participant P91 as handleInviteDeepLink()
    participant P92 as loadMenuItems()
    participant P93 as showMyRequests()
    participant P94 as processFeedbackMessage()
    participant P95 as sendFeedbackReply()
    participant P96 as handleProjectShare()
    participant P97 as handleProjectStats()
    participant P98 as handleProjectTracks()
    participant P99 as getUserRecentStyles()
    participant P100 as showTracksList()
    participant P101 as fetchUsersWithBalances()
    participant P102 as generateTab()
    participant P103 as .saveState()
    participant P104 as fetchFeedback()
    participant P105 as loadProjectData()
    participant P106 as .resolveAudioUrl()
    participant P107 as processNotification()
    participant P108 as pollForResult()
    participant P109 as handlePreCheckoutQuery()
    participant P110 as generateGuitarTab()
    participant P111 as getPublicTracksForGuests()
    participant P112 as buildSearchQuery()
    participant P113 as searchTracksAndProjects()
    participant P114 as handleMashup()
    participant P115 as handleMidiTrackCallback()
    participant P116 as handlePlaylistAdd()
    participant P117 as handleRemix()
    participant P118 as handleAddVocals()
    participant P119 as handleAddInstrumental()
    participant P120 as handleTrackDetails()
    participant P121 as handleDownloadStems()
    participant P122 as handleShowLyrics()
    participant P123 as getPendingUpload()
    participant P124 as consumePendingAudio()
    participant P125 as .saveState()
    participant P126 as .getUserTracks()
    participant P127 as handleArtistEdit()
    participant P128 as showStemFiles()
    participant P129 as showMidiFiles()
    participant P130 as showStorageInfo()
    participant P131 as deleteFile()
    participant P132 as handleProjectEdit()
    participant P133 as handleProjectStatusChange()
    participant P134 as loadCustomImages()
    participant P135 as storeFailedNotification()
    participant P136 as fetchGenerationLogs()
    participant P137 as getPresetById()
    participant P138 as fetchStemTranscriptions()
    participant P139 as fetchTracksWithTagJoin()
    participant P140 as fetchTrackVersionsDetailed()
    participant P141 as flushBufferedDeeplinkTracks()
    participant P142 as handleReply()
    participant P143 as getProductsByType()
    participant P144 as aggregateByDay()
    participant P145 as .saveToDatabase()
    participant P146 as downloadAndUploadStem()
    participant P147 as searchProjects()
    participant P148 as handleShareTrack()
    participant P149 as handleSeparateStems()
    participant P150 as handleDownloadStems()
    participant P151 as handleDeleteReference()
    participant P152 as setPendingAudio()
    participant P153 as updatePendingAudioAnalysis()
    participant P154 as setWizardState()
    participant P155 as .getUserByTelegramId()
    participant P156 as handleArtistTogglePublic()
    participant P157 as handleArtistDeleteConfirm()
    participant P158 as getUserProfile()
    participant P159 as updatePendingClassification()
    participant P160 as loadTariffTiers()
    participant P161 as processUploadAction()
    participant P162 as handleLikeTrack()
    participant P163 as completeOnboarding()
    participant P164 as handleBuyCreditPackages()
    participant P165 as handleBuySubscriptions()
    participant P166 as handleProjectDeleteConfirm()
    participant P167 as handleVoiceToTrack()
    participant P168 as checkUserQuota()
    participant P169 as fetchUserFeedback()
    participant P170 as fetchUserGenerationStats()
    participant P171 as fetchDeeplinkEvents()
    participant P172 as createArtist()
    participant P173 as updateArtist()
    participant P174 as upsertUserCredits()
    participant P175 as createLyricVersion()
    participant P176 as restoreLyricVersion()
    participant P177 as fetchPlaylistTracks()
    participant P178 as getMaxPosition()
    participant P179 as incrementPresetUsage()
    participant P180 as updateUserProfile()
    participant P181 as listReferenceAudioForUser()
    participant P182 as fetchLatestStemTranscription()
    participant P183 as fetchSectionReplacementLogs()
    participant P184 as fetchReplacementTasks()
    participant P185 as updateTrack()
    participant P186 as generateWaveform()
    participant P187 as generateWaveform()
    participant P188 as uploadMenuItemImage()
    participant P189 as fetchPublicTracks()
    participant P190 as fetchPublicArtists()
    participant P191 as fetchFeaturedContent()
    participant P192 as fetchDeeplinkAnalyticsSummary()
    participant P193 as .extractInlineTags()
    participant P194 as loadUserTracks()
    participant P195 as getProducts()
    participant P196 as getPaymentHistory()
    participant P197 as getUserPaymentTransactions()
    participant P198 as getActiveSubscription()
    participant P199 as deleteStorageFiles()
    participant P200 as cleanupTable()
    participant P201 as clearActiveMenu()
    participant P202 as getBotCommands()
    participant P203 as setPendingUpload()
    participant P204 as consumePendingUpload()
    participant P205 as getPendingAudioWithoutConsuming()
    participant P206 as updatePendingUpload()
    participant P207 as .getActiveTasks()
    participant P208 as handleArtistDelete()
    participant P209 as setWaitingForInput()
    participant P210 as setPendingClassification()
    participant P211 as getPendingClassification()
    participant P212 as consumePendingClassification()
    participant P213 as getUserByTelegramId()
    participant P214 as handleRating()
    participant P215 as startInlineGeneration()
    participant P216 as handleProjectDelete()
    participant P217 as showCustomPromptInput()
    participant P218 as handleDownloadMidi()
    participant P219 as handleVoiceToArrangement()
    participant P220 as handleVoiceToCover()
    participant P221 as handleVoiceToStems()
    participant P222 as flushLogBuffer()
    participant P223 as .deleteExpired()
    participant P224 as flushMetrics()
    participant P225 as deductCredits()
    participant P226 as scheduleRetry()
    participant P227 as getWizardState()
    participant P228 as logApiCall()
    participant P229 as getSubscriptionStatus()
    participant P230 as handleSubmit()
    participant P231 as handleApply()
    participant P232 as fetchRecentBotEvents()
    participant P233 as fetchProfileSignupsForForecast()
    participant P234 as fetchCompletedStarsRevenueForForecast()
    participant P235 as fetchGenerationTaskCreatedForForecast()
    participant P236 as fetchTracksCreatedForForecast()
    participant P237 as fetchTrackAnalysis()
    participant P238 as uploadAudioForAnalysis()
    participant P239 as fetchFunnelMetricsRaw()
    participant P240 as fetchRealTimeMetricsRaw()
    participant P241 as fetchPublicArtists()
    participant P242 as getTrackBatches()
    participant P243 as retryBatch()
    participant P244 as getActiveUserBatches()
    participant P245 as logCreditTransaction()
    participant P246 as fetchCreditTransactions()
    participant P247 as countTracksCreatedBetween()
    participant P248 as countUserActivityBetween()
    participant P249 as fetchClaimedMissionActions()
    participant P250 as fetchCheckinsSince()
    participant P251 as countUserAchievements()
    participant P252 as countUserArtists()
    participant P253 as getLyricVersions()
    participant P254 as getSectionNotes()
    participant P255 as getNotifications()
    participant P256 as insertCreditTransaction()
    participant P257 as upsertUserCredits()
    participant P258 as getUserCredits()
    participant P259 as getStarsTransactions()
    participant P260 as updatePlaylist()
    participant P261 as getPresetsWithAuthors()
    participant P262 as updatePreset()
    participant P263 as updateProject()
    participant P264 as fetchProjectTracks()
    participant P265 as updateProjectCover()
    participant P266 as fetchReplacedSectionTasks()
    participant P267 as fetchSectionReplacementsHistory()
    participant P268 as fetchLatestStemTranscriptionByStemId()
    participant P269 as fetchLatestStemTranscriptionByTrackId()
    participant P270 as fetchTrackLikesWithUser()
    participant P271 as writeSeen()
    participant P272 as fetchDBHistory()
    participant P273 as saveGuitarAnalysisForTrack()
    participant P274 as fetchTrackChangelog()
    participant P275 as fetchVersionChangelog()
    participant P276 as fetchUserRecentChanges()
    participant P277 as fetchChangesByType()
    participant P278 as fetchPublicProjects()
    participant P279 as fetchTrackDetails()
    participant P280 as fetchTrackChangelog()
    participant P281 as fetchTrackVersions()
    participant P282 as fetchPrimaryVersion()
    participant P283 as fetchTracksWithPrimaryVersions()
    participant P284 as fetchProfilesMap()
    participant P285 as .startGesture()
    participant P286 as getTopGenerationUsers()
    participant P287 as getProductByCode()
    participant P288 as getFeaturedProducts()
    participant P289 as getPaymentTransaction()
    participant P290 as getUserTinkoffSubscriptions()
    participant P291 as rollupContentAnalytics()
    participant P292 as hashContentFromUrl()
    participant P293 as sendNotifications()
    participant P294 as checkDatabase()
    participant P295 as verifySignature()
    participant P296 as loadConfigFromDatabase()
    participant P297 as getProjectResult()
    participant P298 as getTrackResult()
    participant P299 as getActiveMenuMessageId()
    participant P300 as saveBotCommands()
    participant P301 as cancelPendingUpload()
    participant P302 as setConversationContext()
    participant P303 as getWizardState()
    participant P304 as .deleteState()
    participant P305 as getUserByTelegramId()
    participant P306 as getDashboardData()
    participant P307 as storeMediaGroupSession()
    participant P308 as getProfileData()
    participant P309 as saveRecentStyle()
    participant P310 as handleToggleLike()
    participant P311 as getUserByTelegramId()
    participant P312 as storeVoiceTranscription()
    participant P313 as markNotificationSuccess()
    participant P314 as markNotificationFailed()
    participant P315 as generateTinkoffToken()
    participant P316 as closeFeedbackItem()
    participant P317 as fetchProfilesSummary()
    participant P318 as fetchTodayGenerationStats()
    participant P319 as fetchCompletedStarsTransactions()
    participant P320 as fetchAllUserCreditsList()
    participant P321 as bulkAwardCredits()
    participant P322 as fetchCompletedTracksForContentAnalytics()
    participant P323 as fetchAnalyticsEventsForHeatmap()
    participant P324 as createTempAnalysisTrack()
    participant P325 as markDeeplinkConversion()
    participant P326 as fetchPeriodComparison()
    participant P327 as fetchRevenueAnalyticsRaw()
    participant P328 as fetchUserArtists()
    participant P329 as fetchArtistSummary()
    participant P330 as fetchArtistTrackStats()
    participant P331 as getUserBatchStats()
    participant P332 as fetchAchievements()
    participant P333 as fetchUserAchievements()
    participant P334 as hasCheckedInToday()
    participant P335 as fetchTodayCheckin()
    participant P336 as countUserTrackLikesBetween()
    participant P337 as countCompletedTracks()
    participant P338 as countLikesForTracks()
    participant P339 as countLikesForTracksBetween()
    participant P340 as updateSectionNote()
    participant P341 as getLyricVersionsBatch()
    participant P342 as updateUserCreditsBalance()
    participant P343 as fetchUserPlaylists()
    participant P344 as fetchPlaylistById()
    participant P345 as fetchPlaylistTracksWithDetails()
    participant P346 as fetchPlaylistsContainingTrack()
    participant P347 as getPresets()
    participant P348 as createPreset()
    participant P349 as fetchUserPromptTemplates()
    participant P350 as fetchProfileByUserId()
    participant P351 as fetchProfileCount()
    participant P352 as fetchUserProjects()
    participant P353 as deleteProject()
    participant P354 as countUserProjects()
    participant P355 as updateProjectFields()
    participant P356 as updateProjectBanner()
    participant P357 as updateShortcuts()
    participant P358 as uploadFile()
    participant P359 as deleteFile()
    participant P360 as listFiles()
    participant P361 as fetchTrackVersions()
    participant P362 as setPrimaryVersion()
    participant P363 as fetchTrackStems()
    participant P364 as fetchTrackStemsByTypes()
    participant P365 as fetchTrackStemByType()
    participant P366 as fetchVersionTranscriptionData()
    participant P367 as fetchSourceTrackForStudio()
    participant P368 as fetchStemTranscriptionsByStemIds()
    participant P369 as updateStudioProject()
    participant P370 as fetchTrackById()
    participant P371 as deleteTrack()
    participant P372 as countUserTracks()
    participant P373 as fetchTrackVersions()
    participant P374 as fetchParentTrack()
    participant P375 as parseLyrics()
    participant P376 as savePositions()
    participant P377 as searchPublicContent()
    participant P378 as fetchTrackVersions()
    participant P379 as fetchTrackStems()
    participant P380 as setPrimaryVersion()
    participant P381 as updateVersion()
    participant P382 as getVersionCount()
    participant P383 as evictFromMemoryCache()
    participant P384 as .getActiveElements()
    participant P385 as cleanupCache()
    participant P386 as deleteFile()
    participant P387 as getExperimentOrFlag()
    participant P388 as loadProjects()
    participant P389 as bucketCompletedTransactionsIntoCohorts()
    participant P390 as detectChords()
    participant P391 as mapToArray()
    participant P392 as saveFailedNotification()
    participant P393 as checkGenerationQueue()
    participant P394 as getMetrics()
    participant P395 as calculateFailureRate()
    participant P396 as createHealthAlert()
    participant P397 as checkRateLimit()
    participant P398 as logInlineSearch()
    participant P399 as getMenuState()
    participant P400 as clearWizardState()
    participant P401 as .clearState()
    participant P402 as .getProjectById()
    participant P403 as logChosenResult()
    participant P404 as getMediaGroupFiles()
    participant P405 as clearMediaGroupSession()
    participant P406 as startOnboarding()
    participant P407 as getStoredTranscription()
    participant P408 as deleteWizardState()
    participant P409 as checkIsAdmin()
    participant P410 as getFeaturePermission()
    participant P411 as reportContent()
    participant P412 as fetchBotMenuImagesConfig()
    participant P413 as createAudioAnalysis()
    participant P414 as deleteTempAnalysisTrack()
    participant P415 as saveGuitarRecording()
    participant P416 as trackAnalyticsEvent()
    participant P417 as fetchArtistById()
    participant P418 as deleteArtist()
    participant P419 as countUserArtists()
    participant P420 as hasHdAudio()
    participant P421 as getHdAudioUrl()
    participant P422 as getUpscaleStatus()
    participant P423 as hasWatermark()
    participant P424 as getWatermarkedUrl()
    participant P425 as getBatchStatus()
    participant P426 as cancelBatch()
    participant P427 as recordCheckin()
    participant P428 as retryGenerationTask()
    participant P429 as logGenerationFailure()
    participant P430 as dismissGenerationTask()
    participant P431 as createSectionNote()
    participant P432 as getNotificationSettings()
    participant P433 as upsertNotificationSettings()
    participant P434 as upsertOnboardingNotificationSettings()
    participant P435 as markNotificationRead()
    participant P436 as markAllNotificationsRead()
    participant P437 as upsertUserCreditsBalance()
    participant P438 as createPlaylist()
    participant P439 as deletePlaylist()
    participant P440 as addTrackToPlaylist()
    participant P441 as updateTrackPosition()
    participant P442 as deletePreset()
    participant P443 as updatePromptTemplateUsage()
    participant P444 as fetchPublicProfile()
    participant P445 as fetchUserSubscriptionTier()
    participant P446 as fetchProfileCountInRange()
    participant P447 as fetchProjectById()
    participant P448 as createProject()
    participant P449 as insertReferenceAudio()
    participant P450 as fetchReferenceAudioById()
    participant P451 as getShortcuts()
    participant P452 as resetShortcuts()
    participant P453 as fetchGuitarAnalysis()
    participant P454 as fetchGenerationTask()
    participant P455 as fetchGenerationTaskBySunoId()
    participant P456 as logTrackActivity()
    participant P457 as fetchStudioProject()
    participant P458 as createStudioProject()
    participant P459 as fetchTrackStemsMinimal()
    participant P460 as createTrack()
    participant P461 as toggleTrackLike()
    participant P462 as MobileFormSkeleton()
    participant P463 as cn()
    participant P464 as GridSkeleton()
    participant P465 as TrackGridSkeleton()
    participant P466 as TrackListSkeleton()
    participant P467 as fetchPlatformStats()
    participant P468 as getChangelogCount()
    participant P469 as fetchPublicTrack()
    participant P470 as fetchPublicProject()
    participant P471 as fetchPublicArtist()
    participant P472 as fetchTrackAnalysis()
    participant P473 as setPrimaryVersion()
    participant P474 as fetchVersion()
    participant P475 as createVersion()
    participant P476 as deleteVersion()
    participant P477 as .resolveConflict()
    participant P478 as getFileUrl()
    participant P479 as handleBatchAction()
    participant P480 as LoadingState()
    participant P481 as LoadingState()
    participant P482 as groupGenerationStatsByDay()
    participant P483 as deleteNotification()
    participant P484 as checkTransactionStatus()
    participant P485 as buildHeatmapData()
    participant P486 as fetchTrackProject()
    participant P487 as fetchTrackReferenceAudio()
    participant P488 as getSuggestedInstruments()
    participant P489 as sha256()
    participant P490 as ensureEntityOwner()
    participant P491 as canSendNotification()
    participant P492 as getChatIdForUser()
    participant P493 as logInlineSearch()
    participant P494 as storeNotification()
    participant P495 as checkIfNewUser()
    participant P496 as arrayBufferToBase64()
    participant P497 as upsertBotMenuImagesConfig()
    participant P498 as trackDeeplinkVisit()
    participant P499 as trackJourneyStep()
    participant P500 as deleteBatch()
    participant P501 as deleteGenerationTask()
    participant P502 as deleteSectionNote()
    participant P503 as removeTrackFromPlaylist()
    participant P504 as deletePromptTemplate()
    participant P505 as deleteReferenceAudio()
    participant P506 as insertTrackChangeLog()
    participant P507 as deleteStudioProject()
    participant P508 as cn()
    participant P509 as generateStarMovements()
    participant P510 as generateParticlePositions()
    participant P511 as checkAvailability()
    participant P512 as cn()
    participant P513 as .getActiveGestures()
    participant P514 as .getPendingGestures()
    participant P515 as { error }
    participant P516 as Select
    participant P517 as now
    participant P518 as .get()
    participant P519 as editMessageText()
    participant P520 as ORDER
    participant P521 as answerCallbackQuery()
    participant P522 as json()
    participant P523 as escapeMarkdown()
    participant P524 as limit
    participant P525 as arrayBuffer
    participant P526 as setPendingUpload()
    participant P527 as processGenerationWithReference()
    participant P528 as processAddVocalsInstrumental()
    participant P529 as getFileInfo()
    participant P530 as handleCoverAction()
    participant P531 as handleExtendAction()
    participant P532 as handleStemsAction()
    participant P533 as handleMidiAction()
    participant P534 as createTinkoffPayment()
    participant P535 as invokeLyricsAssistant()
    participant P536 as cancelTinkoffSubscription()
    participant P537 as .analyzeWithFlamingo()
    participant P538 as .analyzeWithLovableAI()
    participant P539 as .analyzeWithKlangio()
    participant P540 as handleSubmit()
    participant P541 as handleFileSelect()
    participant P542 as analyzeAudio()
    participant P543 as flushMetrics()
    participant P544 as handleSubmit()
    participant P545 as uploadAndAnalyze()
    participant P546 as handleGenerate()
    participant P547 as activateTrial()
    participant P548 as handleSeparateStems()
    participant P549 as handleSubmit()
    participant P550 as handleAnalyze()
    participant P551 as handleExtractLyrics()
    participant P552 as handleGenerate()
    participant P553 as handleImprove()
    participant P554 as handleAddTags()
    participant P555 as extractLyrics()
    participant P556 as handleTranslate()
    participant P557 as generateArtistPortrait()
    participant P558 as getMidiMetadata()
    participant P559 as authenticateWithTelegram()
    participant P560 as processGenerationAction()
    participant P561 as handleExtend()
    participant P562 as setupWebhook()
    participant P563 as handleSubmit()
    participant P564 as handleForceAlert()
    participant P565 as handleSubmit()
    participant P566 as handleGenerateCover()
    participant P567 as handleGenerate()
    participant P568 as handleSendToTelegram()
    participant P569 as invokeHealthAlert()
    participant P570 as fetchSunoApiBalance()
    participant P571 as invokeProjectAiActions()
    participant P572 as invokeGenerateProjectMedia()
    participant P573 as invokeAnalyzeAudio()
    participant P574 as handleSubmit()
    participant P575 as handleGeneratePortrait()
    participant P576 as handleSubmit()
    participant P577 as sendTestAlert()
    participant P578 as handleSendTestAlert()
    participant P579 as handleGeneratePortrait()
    participant P580 as handleSubmit()
    participant P581 as handleTranscribe()
    participant P582 as handleGetOptions()
    participant P583 as handleSubmit()
    participant P584 as handleSubmit()
    participant P585 as handleSubmit()
    participant P586 as invokeSendAdminMessage()
    participant P587 as invokeMidiTranscription()
    participant P588 as invokeAudioAnalysis()
    participant P589 as invokeLyricsTranscription()
    participant P590 as invokeReferenceAudioAnalysis()
    participant P591 as initiateBatchTranscribe()
    participant P592 as initiateBatchSeparate()
    participant P593 as invokeRewardAction()
    participant P594 as uploadMidiFile()
    participant P595 as deleteMidiFile()
    participant P596 as listMidiFilesForTrack()
    participant P597 as sendVideoShareNotification()
    participant P598 as invokeTelegramWebhookSetup()
    participant P599 as generateProjectConcept()
    participant P600 as invokeGenerateCoverImage()
    participant P601 as invokeGenerateProjectMedia()
    participant P602 as invokeStemSeparation()
    participant P603 as invokeReplaceSection()
    participant P604 as invokeSunoExtend()
    participant P605 as invokeSunoMusicExtend()
    participant P606 as invokeGenerateSfx()
    participant P607 as invokeSendTelegramNotification()
    participant P608 as invokeAnalyzeTrackContext()
    participant P609 as invokeMusicgenGenerate()
    participant P610 as invokeSunoRemix()
    participant P611 as invokeAddInstrumental()
    participant P612 as invokeAddVocals()
    participant P613 as invokeSunoUploadCover()
    participant P614 as invokeSunoUploadExtend()
    participant P615 as invokeSunoMashup()
    participant P616 as invokeSunoPersona()
    participant P617 as invokeSunoFileUpload()
    participant P618 as invokeExportMidi()
    participant P619 as invokeGeneratePlaylistCover()
    participant P620 as createInvoice()
    participant P621 as updateTrackVisibility()
    participant P622 as invokeTranscribeLyrics()
    participant P623 as invokeAddVocalsToGuitar()
    participant P624 as invokeGenerateProfileImage()
    participant P625 as sendTelegramMessage()
    participant P626 as processAnalyzeAction()
    participant P627 as processStemsAction()
    participant P628 as invokeAdminBroadcast()
    participant P629 as invokeHealthCheck()
    participant P630 as invokeProjectAi()
    participant P631 as startRecording()
    participant P632 as completeRecording()
    participant P633 as triggerChordDetection()
    participant P634 as getChordResults()
    participant P635 as invokeMergeStems()
    participant P636 as invokeReplicateMidiTranscription()
    participant P637 as invokeKlangioAnalyze()
    participant P638 as getSubscriptionStatus()
    participant P639 as getPaymentStats()
    participant P640 as invokeAddVocalsToReference()
    participant P641 as invokeProcessRecordedAudio()
    participant P642 as invokeExtractLyricsFromStem()
    participant P643 as invokeTranscribeMidi()
    P0->>+ P1: calls
    P1-->>- P0: return
    P1->>+ P2: calls
    P2-->>- P1: return
    P2->>+ P3: calls
    P3-->>- P2: return
    P2->>+ P1: calls
    P1-->>- P2: return
    P2->>+ P4: calls
    P4-->>- P2: return
    P2->>+ P5: calls
    P5-->>- P2: return
    P2->>+ P6: calls
    P6-->>- P2: return
    P2->>+ P7: calls
    P7-->>- P2: return
    P2->>+ P8: calls
    P8-->>- P2: return
    P2->>+ P9: calls
    P9-->>- P2: return
    P2->>+ P10: calls
    P10-->>- P2: return
    P2->>+ P11: calls
    P11-->>- P2: return
    P2->>+ P12: calls
    P12-->>- P2: return
    P2->>+ P13: calls
    P13-->>- P2: return
    P2->>+ P14: calls
    P14-->>- P2: return
    P2->>+ P15: calls
    P15-->>- P2: return
    P2->>+ P16: calls
    P16-->>- P2: return
    P2->>+ P17: calls
    P17-->>- P2: return
    P2->>+ P18: calls
    P18-->>- P2: return
    P2->>+ P19: calls
    P19-->>- P2: return
    P2->>+ P20: calls
    P20-->>- P2: return
    P2->>+ P21: calls
    P21-->>- P2: return
    P2->>+ P22: calls
    P22-->>- P2: return
    P2->>+ P23: calls
    P23-->>- P2: return
    P2->>+ P24: calls
    P24-->>- P2: return
    P2->>+ P25: calls
    P25-->>- P2: return
    P2->>+ P26: calls
    P26-->>- P2: return
    P2->>+ P27: calls
    P27-->>- P2: return
    P2->>+ P28: calls
    P28-->>- P2: return
    P2->>+ P29: calls
    P29-->>- P2: return
    P2->>+ P30: calls
    P30-->>- P2: return
    P2->>+ P31: calls
    P31-->>- P2: return
    P2->>+ P32: calls
    P32-->>- P2: return
    P2->>+ P33: calls
    P33-->>- P2: return
    P2->>+ P34: calls
    P34-->>- P2: return
    P2->>+ P35: calls
    P35-->>- P2: return
    P2->>+ P36: calls
    P36-->>- P2: return
    P2->>+ P37: calls
    P37-->>- P2: return
    P2->>+ P38: calls
    P38-->>- P2: return
    P2->>+ P39: calls
    P39-->>- P2: return
    P2->>+ P40: calls
    P40-->>- P2: return
    P2->>+ P41: calls
    P41-->>- P2: return
    P2->>+ P42: calls
    P42-->>- P2: return
    P2->>+ P43: calls
    P43-->>- P2: return
    P2->>+ P44: calls
    P44-->>- P2: return
    P2->>+ P45: calls
    P45-->>- P2: return
    P2->>+ P46: calls
    P46-->>- P2: return
    P2->>+ P47: calls
    P47-->>- P2: return
    P2->>+ P48: calls
    P48-->>- P2: return
    P2->>+ P49: calls
    P49-->>- P2: return
    P2->>+ P50: calls
    P50-->>- P2: return
    P2->>+ P51: calls
    P51-->>- P2: return
    P2->>+ P52: calls
    P52-->>- P2: return
    P2->>+ P53: calls
    P53-->>- P2: return
    P2->>+ P54: calls
    P54-->>- P2: return
    P2->>+ P55: calls
    P55-->>- P2: return
    P2->>+ P56: calls
    P56-->>- P2: return
    P2->>+ P57: calls
    P57-->>- P2: return
    P2->>+ P58: calls
    P58-->>- P2: return
    P2->>+ P59: calls
    P59-->>- P2: return
    P2->>+ P60: calls
    P60-->>- P2: return
    P2->>+ P61: calls
    P61-->>- P2: return
    P2->>+ P62: calls
    P62-->>- P2: return
    P2->>+ P63: calls
    P63-->>- P2: return
    P2->>+ P64: calls
    P64-->>- P2: return
    P2->>+ P65: calls
    P65-->>- P2: return
    P2->>+ P66: calls
    P66-->>- P2: return
    P2->>+ P67: calls
    P67-->>- P2: return
    P2->>+ P68: calls
    P68-->>- P2: return
    P2->>+ P69: calls
    P69-->>- P2: return
    P2->>+ P70: calls
    P70-->>- P2: return
    P2->>+ P71: calls
    P71-->>- P2: return
    P2->>+ P72: calls
    P72-->>- P2: return
    P2->>+ P73: calls
    P73-->>- P2: return
    P2->>+ P74: calls
    P74-->>- P2: return
    P2->>+ P75: calls
    P75-->>- P2: return
    P2->>+ P76: calls
    P76-->>- P2: return
    P2->>+ P77: calls
    P77-->>- P2: return
    P2->>+ P78: calls
    P78-->>- P2: return
    P2->>+ P79: calls
    P79-->>- P2: return
    P2->>+ P80: calls
    P80-->>- P2: return
    P2->>+ P81: calls
    P81-->>- P2: return
    P2->>+ P82: calls
    P82-->>- P2: return
    P2->>+ P83: calls
    P83-->>- P2: return
    P2->>+ P84: calls
    P84-->>- P2: return
    P2->>+ P85: calls
    P85-->>- P2: return
    P2->>+ P86: calls
    P86-->>- P2: return
    P2->>+ P87: calls
    P87-->>- P2: return
    P2->>+ P88: calls
    P88-->>- P2: return
    P2->>+ P89: calls
    P89-->>- P2: return
    P2->>+ P90: calls
    P90-->>- P2: return
    P2->>+ P91: calls
    P91-->>- P2: return
    P2->>+ P92: calls
    P92-->>- P2: return
    P2->>+ P93: calls
    P93-->>- P2: return
    P2->>+ P94: calls
    P94-->>- P2: return
    P2->>+ P95: calls
    P95-->>- P2: return
    P2->>+ P96: calls
    P96-->>- P2: return
    P2->>+ P97: calls
    P97-->>- P2: return
    P2->>+ P98: calls
    P98-->>- P2: return
    P2->>+ P99: calls
    P99-->>- P2: return
    P2->>+ P100: calls
    P100-->>- P2: return
    P2->>+ P101: calls
    P101-->>- P2: return
    P2->>+ P102: calls
    P102-->>- P2: return
    P2->>+ P103: calls
    P103-->>- P2: return
    P2->>+ P104: calls
    P104-->>- P2: return
    P2->>+ P105: calls
    P105-->>- P2: return
    P2->>+ P106: calls
    P106-->>- P2: return
    P2->>+ P107: calls
    P107-->>- P2: return
    P2->>+ P108: calls
    P108-->>- P2: return
    P2->>+ P109: calls
    P109-->>- P2: return
    P2->>+ P110: calls
    P110-->>- P2: return
    P2->>+ P111: calls
    P111-->>- P2: return
    P2->>+ P112: calls
    P112-->>- P2: return
    P2->>+ P113: calls
    P113-->>- P2: return
    P2->>+ P114: calls
    P114-->>- P2: return
    P2->>+ P115: calls
    P115-->>- P2: return
    P2->>+ P116: calls
    P116-->>- P2: return
    P2->>+ P117: calls
    P117-->>- P2: return
    P2->>+ P118: calls
    P118-->>- P2: return
    P2->>+ P119: calls
    P119-->>- P2: return
    P2->>+ P120: calls
    P120-->>- P2: return
    P2->>+ P121: calls
    P121-->>- P2: return
    P2->>+ P122: calls
    P122-->>- P2: return
    P2->>+ P123: calls
    P123-->>- P2: return
    P2->>+ P124: calls
    P124-->>- P2: return
    P2->>+ P125: calls
    P125-->>- P2: return
    P2->>+ P126: calls
    P126-->>- P2: return
    P2->>+ P127: calls
    P127-->>- P2: return
    P2->>+ P128: calls
    P128-->>- P2: return
    P2->>+ P129: calls
    P129-->>- P2: return
    P2->>+ P130: calls
    P130-->>- P2: return
    P2->>+ P131: calls
    P131-->>- P2: return
    P2->>+ P132: calls
    P132-->>- P2: return
    P2->>+ P133: calls
    P133-->>- P2: return
    P2->>+ P134: calls
    P134-->>- P2: return
    P2->>+ P135: calls
    P135-->>- P2: return
    P2->>+ P136: calls
    P136-->>- P2: return
    P2->>+ P137: calls
    P137-->>- P2: return
    P2->>+ P138: calls
    P138-->>- P2: return
    P2->>+ P139: calls
    P139-->>- P2: return
    P2->>+ P140: calls
    P140-->>- P2: return
    P2->>+ P141: calls
    P141-->>- P2: return
    P2->>+ P142: calls
    P142-->>- P2: return
    P2->>+ P143: calls
    P143-->>- P2: return
    P2->>+ P144: calls
    P144-->>- P2: return
    P2->>+ P145: calls
    P145-->>- P2: return
    P2->>+ P146: calls
    P146-->>- P2: return
    P2->>+ P147: calls
    P147-->>- P2: return
    P2->>+ P148: calls
    P148-->>- P2: return
    P2->>+ P149: calls
    P149-->>- P2: return
    P2->>+ P150: calls
    P150-->>- P2: return
    P2->>+ P151: calls
    P151-->>- P2: return
    P2->>+ P152: calls
    P152-->>- P2: return
    P2->>+ P153: calls
    P153-->>- P2: return
    P2->>+ P154: calls
    P154-->>- P2: return
    P2->>+ P155: calls
    P155-->>- P2: return
    P2->>+ P156: calls
    P156-->>- P2: return
    P2->>+ P157: calls
    P157-->>- P2: return
    P2->>+ P158: calls
    P158-->>- P2: return
    P2->>+ P159: calls
    P159-->>- P2: return
    P2->>+ P160: calls
    P160-->>- P2: return
    P2->>+ P161: calls
    P161-->>- P2: return
    P2->>+ P162: calls
    P162-->>- P2: return
    P2->>+ P163: calls
    P163-->>- P2: return
    P2->>+ P164: calls
    P164-->>- P2: return
    P2->>+ P165: calls
    P165-->>- P2: return
    P2->>+ P166: calls
    P166-->>- P2: return
    P2->>+ P167: calls
    P167-->>- P2: return
    P2->>+ P168: calls
    P168-->>- P2: return
    P2->>+ P169: calls
    P169-->>- P2: return
    P2->>+ P170: calls
    P170-->>- P2: return
    P2->>+ P171: calls
    P171-->>- P2: return
    P2->>+ P172: calls
    P172-->>- P2: return
    P2->>+ P173: calls
    P173-->>- P2: return
    P2->>+ P174: calls
    P174-->>- P2: return
    P2->>+ P175: calls
    P175-->>- P2: return
    P2->>+ P176: calls
    P176-->>- P2: return
    P2->>+ P177: calls
    P177-->>- P2: return
    P2->>+ P178: calls
    P178-->>- P2: return
    P2->>+ P179: calls
    P179-->>- P2: return
    P2->>+ P180: calls
    P180-->>- P2: return
    P2->>+ P181: calls
    P181-->>- P2: return
    P2->>+ P182: calls
    P182-->>- P2: return
    P2->>+ P183: calls
    P183-->>- P2: return
    P2->>+ P184: calls
    P184-->>- P2: return
    P2->>+ P185: calls
    P185-->>- P2: return
    P2->>+ P186: calls
    P186-->>- P2: return
    P2->>+ P187: calls
    P187-->>- P2: return
    P2->>+ P188: calls
    P188-->>- P2: return
    P2->>+ P189: calls
    P189-->>- P2: return
    P2->>+ P190: calls
    P190-->>- P2: return
    P2->>+ P191: calls
    P191-->>- P2: return
    P2->>+ P192: calls
    P192-->>- P2: return
    P2->>+ P193: calls
    P193-->>- P2: return
    P2->>+ P194: calls
    P194-->>- P2: return
    P2->>+ P195: calls
    P195-->>- P2: return
    P2->>+ P196: calls
    P196-->>- P2: return
    P2->>+ P197: calls
    P197-->>- P2: return
    P2->>+ P198: calls
    P198-->>- P2: return
    P2->>+ P199: calls
    P199-->>- P2: return
    P2->>+ P200: calls
    P200-->>- P2: return
    P2->>+ P201: calls
    P201-->>- P2: return
    P2->>+ P202: calls
    P202-->>- P2: return
    P2->>+ P203: calls
    P203-->>- P2: return
    P2->>+ P204: calls
    P204-->>- P2: return
    P2->>+ P205: calls
    P205-->>- P2: return
    P2->>+ P206: calls
    P206-->>- P2: return
    P2->>+ P207: calls
    P207-->>- P2: return
    P2->>+ P208: calls
    P208-->>- P2: return
    P2->>+ P209: calls
    P209-->>- P2: return
    P2->>+ P210: calls
    P210-->>- P2: return
    P2->>+ P211: calls
    P211-->>- P2: return
    P2->>+ P212: calls
    P212-->>- P2: return
    P2->>+ P213: calls
    P213-->>- P2: return
    P2->>+ P214: calls
    P214-->>- P2: return
    P2->>+ P215: calls
    P215-->>- P2: return
    P2->>+ P216: calls
    P216-->>- P2: return
    P2->>+ P217: calls
    P217-->>- P2: return
    P2->>+ P218: calls
    P218-->>- P2: return
    P2->>+ P219: calls
    P219-->>- P2: return
    P2->>+ P220: calls
    P220-->>- P2: return
    P2->>+ P221: calls
    P221-->>- P2: return
    P2->>+ P222: calls
    P222-->>- P2: return
    P2->>+ P223: calls
    P223-->>- P2: return
    P2->>+ P224: calls
    P224-->>- P2: return
    P2->>+ P225: calls
    P225-->>- P2: return
    P2->>+ P226: calls
    P226-->>- P2: return
    P2->>+ P227: calls
    P227-->>- P2: return
    P2->>+ P228: calls
    P228-->>- P2: return
    P2->>+ P229: calls
    P229-->>- P2: return
    P2->>+ P230: calls
    P230-->>- P2: return
    P2->>+ P231: calls
    P231-->>- P2: return
    P2->>+ P232: calls
    P232-->>- P2: return
    P2->>+ P233: calls
    P233-->>- P2: return
    P2->>+ P234: calls
    P234-->>- P2: return
    P2->>+ P235: calls
    P235-->>- P2: return
    P2->>+ P236: calls
    P236-->>- P2: return
    P2->>+ P237: calls
    P237-->>- P2: return
    P2->>+ P238: calls
    P238-->>- P2: return
    P2->>+ P239: calls
    P239-->>- P2: return
    P2->>+ P240: calls
    P240-->>- P2: return
    P2->>+ P241: calls
    P241-->>- P2: return
    P2->>+ P242: calls
    P242-->>- P2: return
    P2->>+ P243: calls
    P243-->>- P2: return
    P2->>+ P244: calls
    P244-->>- P2: return
    P2->>+ P245: calls
    P245-->>- P2: return
    P2->>+ P246: calls
    P246-->>- P2: return
    P2->>+ P247: calls
    P247-->>- P2: return
    P2->>+ P248: calls
    P248-->>- P2: return
    P2->>+ P249: calls
    P249-->>- P2: return
    P2->>+ P250: calls
    P250-->>- P2: return
    P2->>+ P251: calls
    P251-->>- P2: return
    P2->>+ P252: calls
    P252-->>- P2: return
    P2->>+ P253: calls
    P253-->>- P2: return
    P2->>+ P254: calls
    P254-->>- P2: return
    P2->>+ P255: calls
    P255-->>- P2: return
    P2->>+ P256: calls
    P256-->>- P2: return
    P2->>+ P257: calls
    P257-->>- P2: return
    P2->>+ P258: calls
    P258-->>- P2: return
    P2->>+ P259: calls
    P259-->>- P2: return
    P2->>+ P260: calls
    P260-->>- P2: return
    P2->>+ P261: calls
    P261-->>- P2: return
    P2->>+ P262: calls
    P262-->>- P2: return
    P2->>+ P263: calls
    P263-->>- P2: return
    P2->>+ P264: calls
    P264-->>- P2: return
    P2->>+ P265: calls
    P265-->>- P2: return
    P2->>+ P266: calls
    P266-->>- P2: return
    P2->>+ P267: calls
    P267-->>- P2: return
    P2->>+ P268: calls
    P268-->>- P2: return
    P2->>+ P269: calls
    P269-->>- P2: return
    P2->>+ P270: calls
    P270-->>- P2: return
    P2->>+ P271: calls
    P271-->>- P2: return
    P2->>+ P272: calls
    P272-->>- P2: return
    P2->>+ P273: calls
    P273-->>- P2: return
    P2->>+ P274: calls
    P274-->>- P2: return
    P2->>+ P275: calls
    P275-->>- P2: return
    P2->>+ P276: calls
    P276-->>- P2: return
    P2->>+ P277: calls
    P277-->>- P2: return
    P2->>+ P278: calls
    P278-->>- P2: return
    P2->>+ P279: calls
    P279-->>- P2: return
    P2->>+ P280: calls
    P280-->>- P2: return
    P2->>+ P281: calls
    P281-->>- P2: return
    P2->>+ P282: calls
    P282-->>- P2: return
    P2->>+ P283: calls
    P283-->>- P2: return
    P2->>+ P284: calls
    P284-->>- P2: return
    P2->>+ P285: calls
    P285-->>- P2: return
    P2->>+ P286: calls
    P286-->>- P2: return
    P2->>+ P287: calls
    P287-->>- P2: return
    P2->>+ P288: calls
    P288-->>- P2: return
    P2->>+ P289: calls
    P289-->>- P2: return
    P2->>+ P290: calls
    P290-->>- P2: return
    P2->>+ P291: calls
    P291-->>- P2: return
    P2->>+ P292: calls
    P292-->>- P2: return
    P2->>+ P293: calls
    P293-->>- P2: return
    P2->>+ P294: calls
    P294-->>- P2: return
    P2->>+ P295: calls
    P295-->>- P2: return
    P2->>+ P296: calls
    P296-->>- P2: return
    P2->>+ P297: calls
    P297-->>- P2: return
    P2->>+ P298: calls
    P298-->>- P2: return
    P2->>+ P299: calls
    P299-->>- P2: return
    P2->>+ P300: calls
    P300-->>- P2: return
    P2->>+ P301: calls
    P301-->>- P2: return
    P2->>+ P302: calls
    P302-->>- P2: return
    P2->>+ P303: calls
    P303-->>- P2: return
    P2->>+ P304: calls
    P304-->>- P2: return
    P2->>+ P305: calls
    P305-->>- P2: return
    P2->>+ P306: calls
    P306-->>- P2: return
    P2->>+ P307: calls
    P307-->>- P2: return
    P2->>+ P308: calls
    P308-->>- P2: return
    P2->>+ P309: calls
    P309-->>- P2: return
    P2->>+ P310: calls
    P310-->>- P2: return
    P2->>+ P311: calls
    P311-->>- P2: return
    P2->>+ P312: calls
    P312-->>- P2: return
    P2->>+ P313: calls
    P313-->>- P2: return
    P2->>+ P314: calls
    P314-->>- P2: return
    P2->>+ P315: calls
    P315-->>- P2: return
    P2->>+ P316: calls
    P316-->>- P2: return
    P2->>+ P317: calls
    P317-->>- P2: return
    P2->>+ P318: calls
    P318-->>- P2: return
    P2->>+ P319: calls
    P319-->>- P2: return
    P2->>+ P320: calls
    P320-->>- P2: return
    P2->>+ P321: calls
    P321-->>- P2: return
    P2->>+ P322: calls
    P322-->>- P2: return
    P2->>+ P323: calls
    P323-->>- P2: return
    P2->>+ P324: calls
    P324-->>- P2: return
    P2->>+ P325: calls
    P325-->>- P2: return
    P2->>+ P326: calls
    P326-->>- P2: return
    P2->>+ P327: calls
    P327-->>- P2: return
    P2->>+ P328: calls
    P328-->>- P2: return
    P2->>+ P329: calls
    P329-->>- P2: return
    P2->>+ P330: calls
    P330-->>- P2: return
    P2->>+ P331: calls
    P331-->>- P2: return
    P2->>+ P332: calls
    P332-->>- P2: return
    P2->>+ P333: calls
    P333-->>- P2: return
    P2->>+ P334: calls
    P334-->>- P2: return
    P2->>+ P335: calls
    P335-->>- P2: return
    P2->>+ P336: calls
    P336-->>- P2: return
    P2->>+ P337: calls
    P337-->>- P2: return
    P2->>+ P338: calls
    P338-->>- P2: return
    P2->>+ P339: calls
    P339-->>- P2: return
    P2->>+ P340: calls
    P340-->>- P2: return
    P2->>+ P341: calls
    P341-->>- P2: return
    P2->>+ P342: calls
    P342-->>- P2: return
    P2->>+ P343: calls
    P343-->>- P2: return
    P2->>+ P344: calls
    P344-->>- P2: return
    P2->>+ P345: calls
    P345-->>- P2: return
    P2->>+ P346: calls
    P346-->>- P2: return
    P2->>+ P347: calls
    P347-->>- P2: return
    P2->>+ P348: calls
    P348-->>- P2: return
    P2->>+ P349: calls
    P349-->>- P2: return
    P2->>+ P350: calls
    P350-->>- P2: return
    P2->>+ P351: calls
    P351-->>- P2: return
    P2->>+ P352: calls
    P352-->>- P2: return
    P2->>+ P353: calls
    P353-->>- P2: return
    P2->>+ P354: calls
    P354-->>- P2: return
    P2->>+ P355: calls
    P355-->>- P2: return
    P2->>+ P356: calls
    P356-->>- P2: return
    P2->>+ P357: calls
    P357-->>- P2: return
    P2->>+ P358: calls
    P358-->>- P2: return
    P2->>+ P359: calls
    P359-->>- P2: return
    P2->>+ P360: calls
    P360-->>- P2: return
    P2->>+ P361: calls
    P361-->>- P2: return
    P2->>+ P362: calls
    P362-->>- P2: return
    P2->>+ P363: calls
    P363-->>- P2: return
    P2->>+ P364: calls
    P364-->>- P2: return
    P2->>+ P365: calls
    P365-->>- P2: return
    P2->>+ P366: calls
    P366-->>- P2: return
    P2->>+ P367: calls
    P367-->>- P2: return
    P2->>+ P368: calls
    P368-->>- P2: return
    P2->>+ P369: calls
    P369-->>- P2: return
    P2->>+ P370: calls
    P370-->>- P2: return
    P2->>+ P371: calls
    P371-->>- P2: return
    P2->>+ P372: calls
    P372-->>- P2: return
    P2->>+ P373: calls
    P373-->>- P2: return
    P2->>+ P374: calls
    P374-->>- P2: return
    P2->>+ P375: calls
    P375-->>- P2: return
    P2->>+ P376: calls
    P376-->>- P2: return
    P2->>+ P377: calls
    P377-->>- P2: return
    P2->>+ P378: calls
    P378-->>- P2: return
    P2->>+ P379: calls
    P379-->>- P2: return
    P2->>+ P380: calls
    P380-->>- P2: return
    P2->>+ P381: calls
    P381-->>- P2: return
    P2->>+ P382: calls
    P382-->>- P2: return
    P2->>+ P383: calls
    P383-->>- P2: return
    P2->>+ P384: calls
    P384-->>- P2: return
    P2->>+ P385: calls
    P385-->>- P2: return
    P2->>+ P386: calls
    P386-->>- P2: return
    P2->>+ P387: calls
    P387-->>- P2: return
    P2->>+ P388: calls
    P388-->>- P2: return
    P2->>+ P389: calls
    P389-->>- P2: return
    P2->>+ P390: calls
    P390-->>- P2: return
    P2->>+ P391: calls
    P391-->>- P2: return
    P2->>+ P392: calls
    P392-->>- P2: return
    P2->>+ P393: calls
    P393-->>- P2: return
    P2->>+ P394: calls
    P394-->>- P2: return
    P2->>+ P395: calls
    P395-->>- P2: return
    P2->>+ P396: calls
    P396-->>- P2: return
    P2->>+ P397: calls
    P397-->>- P2: return
    P2->>+ P398: calls
    P398-->>- P2: return
    P2->>+ P399: calls
    P399-->>- P2: return
    P2->>+ P400: calls
    P400-->>- P2: return
    P2->>+ P401: calls
    P401-->>- P2: return
    P2->>+ P402: calls
    P402-->>- P2: return
    P2->>+ P403: calls
    P403-->>- P2: return
    P2->>+ P404: calls
    P404-->>- P2: return
    P2->>+ P405: calls
    P405-->>- P2: return
    P2->>+ P406: calls
    P406-->>- P2: return
    P2->>+ P407: calls
    P407-->>- P2: return
    P2->>+ P408: calls
    P408-->>- P2: return
    P2->>+ P409: calls
    P409-->>- P2: return
    P2->>+ P410: calls
    P410-->>- P2: return
    P2->>+ P411: calls
    P411-->>- P2: return
    P2->>+ P412: calls
    P412-->>- P2: return
    P2->>+ P413: calls
    P413-->>- P2: return
    P2->>+ P414: calls
    P414-->>- P2: return
    P2->>+ P415: calls
    P415-->>- P2: return
    P2->>+ P416: calls
    P416-->>- P2: return
    P2->>+ P417: calls
    P417-->>- P2: return
    P2->>+ P418: calls
    P418-->>- P2: return
    P2->>+ P419: calls
    P419-->>- P2: return
    P2->>+ P420: calls
    P420-->>- P2: return
    P2->>+ P421: calls
    P421-->>- P2: return
    P2->>+ P422: calls
    P422-->>- P2: return
    P2->>+ P423: calls
    P423-->>- P2: return
    P2->>+ P424: calls
    P424-->>- P2: return
    P2->>+ P425: calls
    P425-->>- P2: return
    P2->>+ P426: calls
    P426-->>- P2: return
    P2->>+ P427: calls
    P427-->>- P2: return
    P2->>+ P428: calls
    P428-->>- P2: return
    P2->>+ P429: calls
    P429-->>- P2: return
    P2->>+ P430: calls
    P430-->>- P2: return
    P2->>+ P431: calls
    P431-->>- P2: return
    P2->>+ P432: calls
    P432-->>- P2: return
    P2->>+ P433: calls
    P433-->>- P2: return
    P2->>+ P434: calls
    P434-->>- P2: return
    P2->>+ P435: calls
    P435-->>- P2: return
    P2->>+ P436: calls
    P436-->>- P2: return
    P2->>+ P437: calls
    P437-->>- P2: return
    P2->>+ P438: calls
    P438-->>- P2: return
    P2->>+ P439: calls
    P439-->>- P2: return
    P2->>+ P440: calls
    P440-->>- P2: return
    P2->>+ P441: calls
    P441-->>- P2: return
    P2->>+ P442: calls
    P442-->>- P2: return
    P2->>+ P443: calls
    P443-->>- P2: return
    P2->>+ P444: calls
    P444-->>- P2: return
    P2->>+ P445: calls
    P445-->>- P2: return
    P2->>+ P446: calls
    P446-->>- P2: return
    P2->>+ P447: calls
    P447-->>- P2: return
    P2->>+ P448: calls
    P448-->>- P2: return
    P2->>+ P449: calls
    P449-->>- P2: return
    P2->>+ P450: calls
    P450-->>- P2: return
    P2->>+ P451: calls
    P451-->>- P2: return
    P2->>+ P452: calls
    P452-->>- P2: return
    P2->>+ P453: calls
    P453-->>- P2: return
    P2->>+ P454: calls
    P454-->>- P2: return
    P2->>+ P455: calls
    P455-->>- P2: return
    P2->>+ P456: calls
    P456-->>- P2: return
    P2->>+ P457: calls
    P457-->>- P2: return
    P2->>+ P458: calls
    P458-->>- P2: return
    P2->>+ P459: calls
    P459-->>- P2: return
    P2->>+ P460: calls
    P460-->>- P2: return
    P2->>+ P461: calls
    P461-->>- P2: return
    P2->>+ P462: calls
    P462-->>- P2: return
    P2->>+ P463: calls
    P463-->>- P2: return
    P2->>+ P464: calls
    P464-->>- P2: return
    P2->>+ P465: calls
    P465-->>- P2: return
    P2->>+ P466: calls
    P466-->>- P2: return
    P2->>+ P467: calls
    P467-->>- P2: return
    P2->>+ P468: calls
    P468-->>- P2: return
    P2->>+ P469: calls
    P469-->>- P2: return
    P2->>+ P470: calls
    P470-->>- P2: return
    P2->>+ P471: calls
    P471-->>- P2: return
    P2->>+ P472: calls
    P472-->>- P2: return
    P2->>+ P473: calls
    P473-->>- P2: return
    P2->>+ P474: calls
    P474-->>- P2: return
    P2->>+ P475: calls
    P475-->>- P2: return
    P2->>+ P476: calls
    P476-->>- P2: return
    P2->>+ P477: calls
    P477-->>- P2: return
    P2->>+ P478: calls
    P478-->>- P2: return
    P2->>+ P479: calls
    P479-->>- P2: return
    P2->>+ P480: calls
    P480-->>- P2: return
    P2->>+ P481: calls
    P481-->>- P2: return
    P2->>+ P482: calls
    P482-->>- P2: return
    P2->>+ P483: calls
    P483-->>- P2: return
    P2->>+ P484: calls
    P484-->>- P2: return
    P2->>+ P485: calls
    P485-->>- P2: return
    P2->>+ P486: calls
    P486-->>- P2: return
    P2->>+ P487: calls
    P487-->>- P2: return
    P2->>+ P488: calls
    P488-->>- P2: return
    P2->>+ P489: calls
    P489-->>- P2: return
    P2->>+ P490: calls
    P490-->>- P2: return
    P2->>+ P491: calls
    P491-->>- P2: return
    P2->>+ P492: calls
    P492-->>- P2: return
    P2->>+ P493: calls
    P493-->>- P2: return
    P2->>+ P494: calls
    P494-->>- P2: return
    P2->>+ P495: calls
    P495-->>- P2: return
    P2->>+ P496: calls
    P496-->>- P2: return
    P2->>+ P497: calls
    P497-->>- P2: return
    P2->>+ P498: calls
    P498-->>- P2: return
    P2->>+ P499: calls
    P499-->>- P2: return
    P2->>+ P500: calls
    P500-->>- P2: return
    P2->>+ P501: calls
    P501-->>- P2: return
    P2->>+ P502: calls
    P502-->>- P2: return
    P2->>+ P503: calls
    P503-->>- P2: return
    P2->>+ P504: calls
    P504-->>- P2: return
    P2->>+ P505: calls
    P505-->>- P2: return
    P2->>+ P506: calls
    P506-->>- P2: return
    P2->>+ P507: calls
    P507-->>- P2: return
    P2->>+ P508: calls
    P508-->>- P2: return
    P2->>+ P509: calls
    P509-->>- P2: return
    P2->>+ P510: calls
    P510-->>- P2: return
    P2->>+ P511: calls
    P511-->>- P2: return
    P2->>+ P512: calls
    P512-->>- P2: return
    P2->>+ P513: calls
    P513-->>- P2: return
    P2->>+ P514: calls
    P514-->>- P2: return
    P1->>+ P515: calls
    P515-->>- P1: return
    P1->>+ P516: calls
    P516-->>- P1: return
    P1->>+ P517: calls
    P517-->>- P1: return
    P1->>+ P518: calls
    P518-->>- P1: return
    P1->>+ P0: calls
    P0-->>- P1: return
    P1->>+ P519: calls
    P519-->>- P1: return
    P1->>+ P520: calls
    P520-->>- P1: return
    P1->>+ P521: calls
    P521-->>- P1: return
    P1->>+ P522: calls
    P522-->>- P1: return
    P1->>+ P523: calls
    P523-->>- P1: return
    P1->>+ P524: calls
    P524-->>- P1: return
    P1->>+ P525: calls
    P525-->>- P1: return
    P1->>+ P8: calls
    P8-->>- P1: return
    P1->>+ P9: calls
    P9-->>- P1: return
    P1->>+ P18: calls
    P18-->>- P1: return
    P1->>+ P526: calls
    P526-->>- P1: return
    P1->>+ P124: calls
    P124-->>- P1: return
    P1->>+ P153: calls
    P153-->>- P1: return
    P1->>+ P154: calls
    P154-->>- P1: return
    P1->>+ P527: calls
    P527-->>- P1: return
    P1->>+ P528: calls
    P528-->>- P1: return
    P1->>+ P205: calls
    P205-->>- P1: return
    P1->>+ P529: calls
    P529-->>- P1: return
    P0->>+ P4: calls
    P4-->>- P0: return
    P0->>+ P5: calls
    P5-->>- P0: return
    P0->>+ P6: calls
    P6-->>- P0: return
    P0->>+ P16: calls
    P16-->>- P0: return
    P0->>+ P25: calls
    P25-->>- P0: return
    P0->>+ P32: calls
    P32-->>- P0: return
    P0->>+ P530: calls
    P530-->>- P0: return
    P0->>+ P531: calls
    P531-->>- P0: return
    P0->>+ P46: calls
    P46-->>- P0: return
    P0->>+ P532: calls
    P532-->>- P0: return
    P0->>+ P533: calls
    P533-->>- P0: return
    P0->>+ P54: calls
    P54-->>- P0: return
    P0->>+ P534: calls
    P534-->>- P0: return
    P0->>+ P72: calls
    P72-->>- P0: return
    P0->>+ P80: calls
    P80-->>- P0: return
    P0->>+ P83: calls
    P83-->>- P0: return
    P0->>+ P535: calls
    P535-->>- P0: return
    P0->>+ P536: calls
    P536-->>- P0: return
    P0->>+ P537: calls
    P537-->>- P0: return
    P0->>+ P538: calls
    P538-->>- P0: return
    P0->>+ P539: calls
    P539-->>- P0: return
    P0->>+ P540: calls
    P540-->>- P0: return
    P0->>+ P541: calls
    P541-->>- P0: return
    P0->>+ P542: calls
    P542-->>- P0: return
    P0->>+ P543: calls
    P543-->>- P0: return
    P0->>+ P142: calls
    P142-->>- P0: return
    P0->>+ P167: calls
    P167-->>- P0: return
    P0->>+ P544: calls
    P544-->>- P0: return
    P0->>+ P545: calls
    P545-->>- P0: return
    P0->>+ P546: calls
    P546-->>- P0: return
    P0->>+ P547: calls
    P547-->>- P0: return
    P0->>+ P548: calls
    P548-->>- P0: return
    P0->>+ P527: calls
    P527-->>- P0: return
    P0->>+ P528: calls
    P528-->>- P0: return
    P0->>+ P219: calls
    P219-->>- P0: return
    P0->>+ P220: calls
    P220-->>- P0: return
    P0->>+ P221: calls
    P221-->>- P0: return
    P0->>+ P549: calls
    P549-->>- P0: return
    P0->>+ P550: calls
    P550-->>- P0: return
    P0->>+ P551: calls
    P551-->>- P0: return
    P0->>+ P552: calls
    P552-->>- P0: return
    P0->>+ P553: calls
    P553-->>- P0: return
    P0->>+ P554: calls
    P554-->>- P0: return
    P0->>+ P555: calls
    P555-->>- P0: return
    P0->>+ P556: calls
    P556-->>- P0: return
    P0->>+ P557: calls
    P557-->>- P0: return
    P0->>+ P558: calls
    P558-->>- P0: return
    P0->>+ P559: calls
    P559-->>- P0: return
    P0->>+ P560: calls
    P560-->>- P0: return
    P0->>+ P561: calls
    P561-->>- P0: return
    P0->>+ P562: calls
    P562-->>- P0: return
    P0->>+ P563: calls
    P563-->>- P0: return
    P0->>+ P564: calls
    P564-->>- P0: return
    P0->>+ P565: calls
    P565-->>- P0: return
    P0->>+ P566: calls
    P566-->>- P0: return
    P0->>+ P567: calls
    P567-->>- P0: return
    P0->>+ P568: calls
    P568-->>- P0: return
    P0->>+ P569: calls
    P569-->>- P0: return
    P0->>+ P570: calls
    P570-->>- P0: return
    P0->>+ P571: calls
    P571-->>- P0: return
    P0->>+ P572: calls
    P572-->>- P0: return
    P0->>+ P573: calls
    P573-->>- P0: return
    P0->>+ P574: calls
    P574-->>- P0: return
    P0->>+ P575: calls
    P575-->>- P0: return
    P0->>+ P576: calls
    P576-->>- P0: return
    P0->>+ P577: calls
    P577-->>- P0: return
    P0->>+ P578: calls
    P578-->>- P0: return
    P0->>+ P579: calls
    P579-->>- P0: return
    P0->>+ P580: calls
    P580-->>- P0: return
    P0->>+ P581: calls
    P581-->>- P0: return
    P0->>+ P582: calls
    P582-->>- P0: return
    P0->>+ P583: calls
    P583-->>- P0: return
    P0->>+ P584: calls
    P584-->>- P0: return
    P0->>+ P585: calls
    P585-->>- P0: return
    P0->>+ P586: calls
    P586-->>- P0: return
    P0->>+ P587: calls
    P587-->>- P0: return
    P0->>+ P588: calls
    P588-->>- P0: return
    P0->>+ P589: calls
    P589-->>- P0: return
    P0->>+ P590: calls
    P590-->>- P0: return
    P0->>+ P591: calls
    P591-->>- P0: return
    P0->>+ P592: calls
    P592-->>- P0: return
    P0->>+ P593: calls
    P593-->>- P0: return
    P0->>+ P594: calls
    P594-->>- P0: return
    P0->>+ P595: calls
    P595-->>- P0: return
    P0->>+ P596: calls
    P596-->>- P0: return
    P0->>+ P597: calls
    P597-->>- P0: return
    P0->>+ P598: calls
    P598-->>- P0: return
    P0->>+ P599: calls
    P599-->>- P0: return
    P0->>+ P600: calls
    P600-->>- P0: return
    P0->>+ P601: calls
    P601-->>- P0: return
    P0->>+ P602: calls
    P602-->>- P0: return
    P0->>+ P603: calls
    P603-->>- P0: return
    P0->>+ P604: calls
    P604-->>- P0: return
    P0->>+ P605: calls
    P605-->>- P0: return
    P0->>+ P606: calls
    P606-->>- P0: return
    P0->>+ P607: calls
    P607-->>- P0: return
    P0->>+ P608: calls
    P608-->>- P0: return
    P0->>+ P609: calls
    P609-->>- P0: return
    P0->>+ P610: calls
    P610-->>- P0: return
    P0->>+ P611: calls
    P611-->>- P0: return
    P0->>+ P612: calls
    P612-->>- P0: return
    P0->>+ P613: calls
    P613-->>- P0: return
    P0->>+ P614: calls
    P614-->>- P0: return
    P0->>+ P615: calls
    P615-->>- P0: return
    P0->>+ P616: calls
    P616-->>- P0: return
    P0->>+ P617: calls
    P617-->>- P0: return
    P0->>+ P618: calls
    P618-->>- P0: return
    P0->>+ P619: calls
    P619-->>- P0: return
    P0->>+ P620: calls
    P620-->>- P0: return
    P0->>+ P621: calls
    P621-->>- P0: return
    P0->>+ P622: calls
    P622-->>- P0: return
    P0->>+ P623: calls
    P623-->>- P0: return
    P0->>+ P624: calls
    P624-->>- P0: return
    P0->>+ P625: calls
    P625-->>- P0: return
    P0->>+ P626: calls
    P626-->>- P0: return
    P0->>+ P627: calls
    P627-->>- P0: return
    P0->>+ P628: calls
    P628-->>- P0: return
    P0->>+ P629: calls
    P629-->>- P0: return
    P0->>+ P630: calls
    P630-->>- P0: return
    P0->>+ P631: calls
    P631-->>- P0: return
    P0->>+ P632: calls
    P632-->>- P0: return
    P0->>+ P633: calls
    P633-->>- P0: return
    P0->>+ P634: calls
    P634-->>- P0: return
    P0->>+ P635: calls
    P635-->>- P0: return
    P0->>+ P636: calls
    P636-->>- P0: return
    P0->>+ P637: calls
    P637-->>- P0: return
    P0->>+ P638: calls
    P638-->>- P0: return
    P0->>+ P639: calls
    P639-->>- P0: return
    P0->>+ P640: calls
    P640-->>- P0: return
    P0->>+ P641: calls
    P641-->>- P0: return
    P0->>+ P642: calls
    P642-->>- P0: return
    P0->>+ P643: calls
    P643-->>- P0: return
```

## Connections by Relation

### calls
- [[handleAudioActionCallback()]] `INFERRED`
- [[handleClassificationCallback()]] `INFERRED`
- [[processVoiceMessage()]] `INFERRED`
- [[handleAutoUploadWithPipeline()]] `INFERRED`
- [[handleGenerate()]] `INFERRED`
- [[handleCloudUploadWithAnalysis()]] `INFERRED`
- [[handleVoiceForGeneration()]] `INFERRED`
- [[handleCoverAction()]] `INFERRED`
- [[handleExtendAction()]] `INFERRED`
- [[startGenerationFromVoice()]] `INFERRED`
- [[handleStemsAction()]] `INFERRED`
- [[handleMidiAction()]] `INFERRED`
- [[startGeneration()]] `INFERRED`
- [[createTinkoffPayment()]] `INFERRED`
- [[startQuickGeneration()]] `INFERRED`
- [[handleSuccessfulPayment()]] `INFERRED`
- [[handleStemSeparation()]] `INFERRED`
- [[invokeLyricsAssistant()]] `INFERRED`
- [[cancelTinkoffSubscription()]] `INFERRED`
- [[.analyzeWithFlamingo()]] `INFERRED`

### contains
- [[voice-clone.api.ts]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*