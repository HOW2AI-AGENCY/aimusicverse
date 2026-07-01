# success

> God node · 151 connections · [D:\.MUSICVERSE\aimusicverse\supabase\functions\suno-music-callback\index.ts](file:///D:/.MUSICVERSE/aimusicverse/supabase/functions/suno-music-callback/index.ts#L1087)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as success
    participant P1 as sendTelegramAudio()
    participant P2 as error
    participant P3 as editMessageText()
    participant P4 as handleDeepLink()
    participant P5 as sendPhoto()
    participant P6 as uploadAndShowActions()
    participant P7 as handleAudioActionCallback()
    participant P8 as handleDashboard()
    participant P9 as handleClassificationCallback()
    participant P10 as processVoiceMessage()
    participant P11 as handleAutoUploadWithPipeline()
    participant P12 as handleProjects()
    participant P13 as handleAudioMessage()
    participant P14 as deleteMessage()
    participant P15 as handleCallbackQuery()
    participant P16 as handleLibrary()
    participant P17 as setActiveMenuMessageId()
    participant P18 as deleteAndSendNewMenuPhoto()
    participant P19 as initiateTariffPurchase()
    participant P20 as handleUpdate()
    participant P21 as editMessageMedia()
    participant P22 as handleGenerate()
    participant P23 as handleGuitarAudio()
    participant P24 as handleMidiCommand()
    participant P25 as handleStatus()
    participant P26 as sendNotification()
    participant P27 as uploadFile()
    participant P28 as .setActive()
    participant P29 as handleCheckTask()
    participant P30 as handleInlineQuery()
    participant P31 as startMidiConversion()
    participant P32 as handleCloudUploadWithAnalysis()
    participant P33 as processMediaGroupAction()
    participant P34 as trackDeepLinkAnalytics()
    participant P35 as handleVoiceForGeneration()
    participant P36 as getCachedAudio()
    participant P37 as createNotification()
    participant P38 as sendAudio()
    participant P39 as handleDynamicMenuCallback()
    participant P40 as handleGenerateFromReference()
    participant P41 as handleCloudCallback()
    participant P42 as handlePlayTrack()
    participant P43 as handleGenerationWizardCallback()
    participant P44 as editMessageCaption()
    participant P45 as handleAnalyzeCommand()
    participant P46 as handleInlineQuery()
    participant P47 as handlePianoCommand()
    participant P48 as handleMyUploads()
    participant P49 as .saveState()
    participant P50 as handleAudioActionCallback()
    participant P51 as handleCoverAction()
    participant P52 as handleExtendAction()
    participant P53 as processAudioUpload()
    participant P54 as showTierInfo()
    participant P55 as startGenerationFromVoice()
    participant P56 as cacheAudio()
    participant P57 as .getState()
    participant P58 as sendDocument()
    participant P59 as handleChordAnalysis()
    participant P60 as handleBeatAnalysis()
    participant P61 as handleSendTrackToChat()
    participant P62 as .cleanup()
    participant P63 as handleStemsAction()
    participant P64 as handleMidiAction()
    participant P65 as handleUploadCallback()
    participant P66 as .deleteTrackedMessage()
    participant P67 as sendLikeDigest()
    participant P68 as sendCommentDigest()
    participant P69 as startGeneration()
    participant P70 as handleRewardShare()
    participant P71 as .acquire()
    participant P72 as createTinkoffPayment()
    participant P73 as .analyze()
    participant P74 as sendAlertToAdmins()
    participant P75 as sendTelegramVideo()
    participant P76 as sendTelegramDocument()
    participant P77 as handleTranscription()
    participant P78 as handleFullAnalysis()
    participant P79 as handleAnalyzeList()
    participant P80 as handleGuitarCommand()
    participant P81 as handleLyrics()
    participant P82 as handleAddToPlaylist()
    participant P83 as handleRecognizeAudio()
    participant P84 as handleCheckStemsStatus()
    participant P85 as handleStudio()
    participant P86 as deleteActiveMenu()
    participant P87 as .showMenu()
    participant P88 as .startWizard()
    participant P89 as .handleCallback()
    participant P90 as showAudioClassificationPromptInternal()
    participant P91 as handleFeedbackCallback()
    participant P92 as handleChosenInlineResult()
    participant P93 as handleBuyCommand()
    participant P94 as startQuickGeneration()
    participant P95 as loadTiers()
    participant P96 as handleTariffCallback()
    participant P97 as handleVoiceProcessorCallback()
    participant P98 as sendAutoDeleteMessage()
    participant P99 as sendFollowerDigest()
    participant P100 as createProject()
    participant P101 as ensureAudioReady()
    participant P102 as resumeAudioContext()
    participant P103 as ensureAudioRoutedToDestination()
    participant P104 as showGenerationError()
    participant P105 as .generateFallback()
    participant P106 as shareTrackURL()
    participant P107 as sharePlaylistURL()
    participant P108 as checkAndUnlockAchievements()
    participant P109 as sendTelegramMessage()
    participant P110 as handleSuccessfulPayment()
    participant P111 as handleMediaGroupCallbacks()
    participant P112 as handleAnalyzeSelect()
    participant P113 as handleRecognizeCommand()
    participant P114 as handleTrackStats()
    participant P115 as handleStemSeparation()
    participant P116 as handleSelectReference()
    participant P117 as handleUseReference()
    participant P118 as .cancelWizard()
    participant P119 as .getTrackById()
    participant P120 as .getUserProjects()
    participant P121 as loadMenuItems()
    participant P122 as processFeedbackMessage()
    participant P123 as sendFeedbackReply()
    participant P124 as handleDownloadTrack()
    participant P125 as handleBuyProduct()
    participant P126 as handleEnhancedQuickActionCallback()
    participant P127 as getUserRecentStyles()
    participant P128 as handleTracksCallback()
    participant P129 as generateThumbnails()
    participant P130 as handleSubmit()
    participant P131 as handleFileSelect()
    participant P132 as analyzeAudio()
    participant P133 as registerAudioServiceWorker()
    participant P134 as migrateQueueFromPlayerStore()
    participant P135 as .saveState()
    participant P136 as detectBPM()
    participant P137 as fetchFeedback()
    participant P138 as cancelTinkoffSubscription()
    participant P139 as .getActive()
    participant P140 as .persistToDatabase()
    participant P141 as shareTrackToStory()
    participant P142 as sharePlaylistToStory()
    participant P143 as pollForResult()
    participant P144 as handlePreCheckoutQuery()
    participant P145 as getPublicTracksForGuests()
    participant P146 as handlePlaylistAdd()
    participant P147 as recognizeFromUrl()
    participant P148 as handleRemix()
    participant P149 as handleAddVocals()
    participant P150 as handleAddInstrumental()
    participant P151 as handleTrackDetails()
    participant P152 as handleDownloadStems()
    participant P153 as handleShowLyrics()
    participant P154 as getPendingUpload()
    participant P155 as consumePendingAudio()
    participant P156 as .navigateBack()
    participant P157 as .saveState()
    participant P158 as .handleInput()
    participant P159 as .confirmWizard()
    participant P160 as .getUserTracks()
    participant P161 as getFileUrl()
    participant P162 as getFileUrl()
    participant P163 as loadCustomImages()
    participant P164 as storeFailedNotification()
    participant P165 as runAccessibilityAudit()
    participant P166 as analyzeBundleSizes()
    participant P167 as handleSubmit()
    participant P168 as handleFileUpload()
    participant P169 as uploadAndAnalyze()
    participant P170 as handleApplyCrop()
    participant P171 as handleFileUpload()
    participant P172 as handleFileSelect()
    participant P173 as loadPositions()
    participant P174 as getOrCreateAudioNodes()
    participant P175 as loadProjectData()
    participant P176 as checkAdminStatus()
    participant P177 as handleReply()
    participant P178 as processQueue()
    participant P179 as sendTelegramProgress()
    participant P180 as downloadAndUploadStem()
    participant P181 as handleShareTrack()
    participant P182 as handleSeparateStems()
    participant P183 as handleDownloadStems()
    participant P184 as handleDeleteReference()
    participant P185 as deleteAndSendNewMenu()
    participant P186 as setPendingAudio()
    participant P187 as updatePendingAudioAnalysis()
    participant P188 as setWizardState()
    participant P189 as .updateMenu()
    participant P190 as .getUserByTelegramId()
    participant P191 as updatePendingClassification()
    participant P192 as loadTariffTiers()
    participant P193 as handleLikeTrack()
    participant P194 as handleBuyCreditPackages()
    participant P195 as handleBuySubscriptions()
    participant P196 as showEnhancedQuickActions()
    participant P197 as handleUploadCancel()
    participant P198 as checkUserQuota()
    participant P199 as startGenerationWizard()
    participant P200 as validateFeatureAccess()
    participant P201 as handleSubmit()
    participant P202 as componentDidCatch()
    participant P203 as handleFileUpload()
    participant P204 as handleSubmit()
    participant P205 as handleImageUpload()
    participant P206 as handleRecordingComplete()
    participant P207 as uploadAndGetUrl()
    participant P208 as extractLyrics()
    participant P209 as fetchAudioList()
    participant P210 as handleActivateTrial()
    participant P211 as handleGenerate()
    participant P212 as handleUseAsReference()
    participant P213 as generateWaveform()
    participant P214 as handleUpload()
    participant P215 as handleCopy()
    participant P216 as activateTrial()
    participant P217 as prefetchAudio()
    participant P218 as cleanupExpiredEntries()
    participant P219 as fetchDeeplinkAnalyticsSummary()
    participant P220 as exportAnalytics()
    participant P221 as detectBPMFromUrl()
    participant P222 as handleSeparateStems()
    participant P223 as getUserPaymentTransactions()
    participant P224 as getActiveSubscription()
    participant P225 as .clearActive()
    participant P226 as handleSetEmojiStatus()
    participant P227 as handleRemoveEmojiStatus()
    participant P228 as clearActiveMenu()
    participant P229 as getBotCommands()
    participant P230 as updateBotCommands()
    participant P231 as setPendingUpload()
    participant P232 as consumePendingUpload()
    participant P233 as getPendingAudioWithoutConsuming()
    participant P234 as updatePendingUpload()
    participant P235 as .sendMenu()
    participant P236 as .getActiveTasks()
    participant P237 as setPendingClassification()
    participant P238 as getPendingClassification()
    participant P239 as consumePendingClassification()
    participant P240 as getFileUrl()
    participant P241 as startInlineGeneration()
    participant P242 as handleVoiceGenerationCallback()
    participant P243 as flushMetrics()
    participant P244 as deductCredits()
    participant P245 as checkRateLimitDb()
    participant P246 as scheduleRetry()
    participant P247 as logApiCall()
    participant P248 as getSubscriptionStatus()
    participant P249 as getMidiMetadata()
    participant P250 as upsertUserCredits()
    participant P251 as getDerivedStateFromError()
    participant P252 as handleExtend()
    participant P253 as setupWebhook()
    participant P254 as handleSubmit()
    participant P255 as handleImageUpload()
    participant P256 as handleForceAlert()
    participant P257 as handleNewArrangement()
    participant P258 as handleNewVocal()
    participant P259 as handleAnalyze()
    participant P260 as handleExtractLyrics()
    participant P261 as handleGenerate()
    participant P262 as handleImprove()
    participant P263 as handleAddTags()
    participant P264 as loadData()
    participant P265 as handleAddNewPrompt()
    participant P266 as handleDownload()
    participant P267 as startRecording()
    participant P268 as handleQuickGenerate()
    participant P269 as handleSaveAsPlaylist()
    participant P270 as handleTranslate()
    participant P271 as handleGenerate()
    participant P272 as handleApply()
    participant P273 as handleRemoveAvatar()
    participant P274 as handleSendToTelegram()
    participant P275 as fetchVersions()
    participant P276 as handleAddToProject()
    participant P277 as handleShareToStory()
    participant P278 as saveGuitarAnalysisForTrack()
    participant P279 as attemptAudioRecovery()
    participant P280 as logError()
    participant P281 as generateWaveformFromBuffer()
    participant P282 as .initializeAudioContext()
    participant P283 as retry()
    participant P284 as handleClose()
    participant P285 as fetchReplacedSections()
    participant P286 as getPaymentTransaction()
    participant P287 as getUserTinkoffSubscriptions()
    participant P288 as authenticateWithTelegram()
    participant P289 as .getValidatePhrase()
    participant P290 as .getVoiceId()
    participant P291 as hashContentFromUrl()
    participant P292 as editTelegramMessage()
    participant P293 as verifyAdminAccess()
    participant P294 as fetchWithRetry()
    participant P295 as loadConfigFromDatabase()
    participant P296 as executeSearch()
    participant P297 as answerInlineQuery()
    participant P298 as getActiveMenuMessageId()
    participant P299 as saveBotCommands()
    participant P300 as cancelPendingUpload()
    participant P301 as setConversationContext()
    participant P302 as getWizardState()
    participant P303 as editInlineMessage()
    participant P304 as storeMediaGroupSession()
    participant P305 as saveRecentStyle()
    participant P306 as storeVoiceTranscription()
    participant P307 as createMainMenuKeyboardAsync()
    participant P308 as markNotificationSuccess()
    participant P309 as markNotificationFailed()
    participant P310 as handleWizardTextInput()
    participant P311 as validateRequest()
    participant P312 as checkLinks()
    participant P313 as migrateFile()
    participant P314 as downloadMidiFile()
    participant P315 as insertCreditTransaction()
    participant P316 as updateUserCreditsBalance()
    participant P317 as uploadFile()
    participant P318 as deleteFile()
    participant P319 as listFiles()
    participant P320 as handleSubmit()
    participant P321 as handleGeneratePortrait()
    participant P322 as handleSubmit()
    participant P323 as handleDelete()
    participant P324 as sendTestAlert()
    participant P325 as handleSendTestAlert()
    participant P326 as handleGeneratePortrait()
    participant P327 as handleSubmit()
    participant P328 as handleTranscribe()
    participant P329 as handleSaveLyrics()
    participant P330 as handleDelete()
    participant P331 as startRecording()
    participant P332 as handleSubmit()
    participant P333 as handleDownload()
    participant P334 as handleLink()
    participant P335 as checkProfileSetup()
    participant P336 as handleCancelSubscription()
    participant P337 as handleGenerateCover()
    participant P338 as handleShareToStory()
    participant P339 as handleStartTrial()
    participant P340 as handleSubscribe()
    participant P341 as handleGenerate()
    participant P342 as handleApplyOption()
    participant P343 as handleSubmit()
    participant P344 as handleGenerateCover()
    participant P345 as handleRemoveCover()
    participant P346 as handleDownload()
    participant P347 as handleDownload()
    participant P348 as handleSubmit()
    participant P349 as handleSubmit()
    participant P350 as handleSubmit()
    participant P351 as handleVersionSelect()
    participant P352 as init()
    participant P353 as handleScan()
    participant P354 as handleCopy()
    participant P355 as handleCopy()
    participant P356 as handleCopy()
    participant P357 as handleDownload()
    participant P358 as pickStem()
    participant P359 as getStoredPresets()
    participant P360 as savePositions()
    participant P361 as clearAudioCache()
    participant P362 as precacheAudioUrls()
    participant P363 as clearAudioCacheViaSW()
    participant P364 as deleteFile()
    participant P365 as mapSunoError()
    participant P366 as generateWaveformFromUrl()
    participant P367 as handleSaveRecording()
    participant P368 as handleCreate()
    participant P369 as getAllProducts()
    participant P370 as getProduct()
    participant P371 as getCreditPackages()
    participant P372 as getSubscriptions()
    participant P373 as createPayment()
    participant P374 as saveFailedNotification()
    participant P375 as switchInlineQuery()
    participant P376 as .validateVoice()
    participant P377 as .regeneratePhrase()
    participant P378 as .generateVoice()
    participant P379 as .checkVoiceAvailability()
    participant P380 as createHealthAlert()
    participant P381 as checkRateLimit()
    participant P382 as fetchStatusWithRetry()
    participant P383 as answerPreCheckoutQuery()
    participant P384 as logInlineSearch()
    participant P385 as sendNotification()
    participant P386 as getMenuState()
    participant P387 as clearWizardState()
    participant P388 as cleanupSessions()
    participant P389 as .getCurrentContext()
    participant P390 as .getBreadcrumb()
    participant P391 as .getProjectById()
    participant P392 as .incrementPlayCount()
    participant P393 as storeTemporaryAudio()
    participant P394 as logChosenResult()
    participant P395 as handleTrackChosen()
    participant P396 as getFileInfo()
    participant P397 as getFileUrl()
    participant P398 as getFileUrl()
    participant P399 as .processQueue()
    participant P400 as getBundleFiles()
    participant P401 as uploadMidiFile()
    participant P402 as getMidiPublicUrl()
    participant P403 as deleteMidiFile()
    participant P404 as listMidiFilesForTrack()
    participant P405 as upsertNotificationSettings()
    participant P406 as upsertOnboardingNotificationSettings()
    participant P407 as upsertUserCreditsBalance()
    participant P408 as handleSubmit()
    participant P409 as handleRemixClick()
    participant P410 as handleResolve()
    participant P411 as handleFileInputChange()
    participant P412 as handleSubmit()
    participant P413 as handleSave()
    participant P414 as handleCopyProgression()
    participant P415 as handleFileUpload()
    participant P416 as handleStartRecording()
    participant P417 as generateThemeIdea()
    participant P418 as startTuner()
    participant P419 as handleReanalyze()
    participant P420 as handleCopy()
    participant P421 as handleCopy()
    participant P422 as handleCopy()
    participant P423 as handleSubscribe()
    participant P424 as handleGetOptions()
    participant P425 as handleDownload()
    participant P426 as handleCreateProject()
    participant P427 as handleShare()
    participant P428 as handleCopyLink()
    participant P429 as handleVersionSelect()
    participant P430 as handleCopy()
    participant P431 as handleSave()
    participant P432 as savePresets()
    participant P433 as requestNotificationPermission()
    participant P434 as getOwnTelegramIds()
    participant P435 as handleBatchAction()
    participant P436 as deleteNotification()
    participant P437 as cleanupExpiredNotifications()
    participant P438 as replaceSection()
    participant P439 as separateStems()
    participant P440 as switchToVersion()
    participant P441 as setSession()
    participant P442 as validateWebhookSignature()
    participant P443 as handleInternalAction()
    participant P444 as storeNotification()
    participant P445 as checkAlerts()
    participant P446 as getPendingRetries()
    participant P447 as handleFileSelect()
    participant P448 as handleFileSelect()
    participant P449 as componentDidCatch()
    participant P450 as handleSubmit()
    participant P451 as handleBroadcast()
    participant P452 as handleCredit()
    participant P453 as handleCostChange()
    participant P454 as handleFeatureToggle()
    participant P455 as initWavesurfer()
    participant P456 as handleSaveRecording()
    participant P457 as .componentDidCatch()
    participant P458 as handleFileUpload()
    participant P459 as handleRecognizeLyrics()
    participant P460 as handleFileSelect()
    participant P461 as componentDidCatch()
    participant P462 as handleSaveAsTrack()
    participant P463 as init()
    participant P464 as componentDidCatch()
    participant P465 as handleGenerate()
    participant P466 as showGenerationCompleteNotification()
    participant P467 as deleteNotificationsByGroup()
    participant P468 as .get()
    participant P469 as .info()
    participant P470 as .warn()
    participant P471 as .debug()
    participant P472 as json()
    participant P473 as blob
    participant P474 as processQueueItem()
    participant P475 as processNotification()
    participant P476 as sanitizeFilename()
    participant P477 as handleSelectHistory()
    participant P478 as handleDeleteHistory()
    participant P479 as handleExport()
    participant P480 as handleCover()
    participant P481 as handleExtend()
    participant P482 as handleOpenPromptDJ()
    participant P483 as handleSelectInspiration()
    participant P484 as handleSaveToBookmarks()
    participant P485 as handleAutoFix()
    participant P486 as handleUseAsReference()
    participant P487 as handlePlayFromHere()
    participant P488 as handlePlayNext()
    participant P489 as handleAddToQueue()
    participant P490 as handleUseTemplate()
    participant P491 as handleClearDraft()
    participant P492 as handleTemplateSelect()
    participant P493 as handleDeleteSaved()
    participant P494 as handleClearHistory()
    participant P495 as handleCopyTag()
    participant P496 as handleClearQueue()
    participant P497 as handleShare()
    participant P498 as handleDelete()
    participant P499 as handleShare()
    participant P500 as handleAddToQueue()
    participant P501 as handleToggleLoop()
    participant P502 as handleSpeedChange()
    participant P503 as handleStopRecording()
    participant P504 as loadTemplate()
    participant P505 as handleCopyTab()
    participant P506 as handleCreateClick()
    participant P507 as handleCopyCode()
    participant P508 as handleGuitarRecordingComplete()
    participant P509 as handleCopyProgression()
    participant P510 as handleSelectSaved()
    participant P511 as handleCopy()
    participant P512 as handleCopyTags()
    participant P513 as handleCopyTags()
    participant P514 as handleCopyLink()
    participant P515 as handleCopyLyrics()
    participant P516 as handleUseLyrics()
    participant P517 as handleToggleVersionMode()
    participant P518 as handleAddToTimeline()
    participant P519 as handleDownload()
    participant P520 as handleAddToTimeline()
    participant P521 as handleShare()
    participant P522 as handleApply()
    participant P523 as handleShare()
    participant P524 as handleProgressionExport()
    participant P525 as handleProgressionExport()
    participant P526 as handleCopyCode()
    participant P527 as handleCopyLink()
    participant P528 as handleCopy()
    P0->>+ P1: calls
    P1-->>- P0: return
    P1->>+ P2: calls
    P2-->>- P1: return
    P2->>+ P3: calls
    P3-->>- P2: return
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
    P2->>+ P1: calls
    P1-->>- P2: return
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
    P1->>+ P0: calls
    P0-->>- P1: return
    P1->>+ P468: calls
    P468-->>- P1: return
    P1->>+ P469: calls
    P469-->>- P1: return
    P1->>+ P470: calls
    P470-->>- P1: return
    P1->>+ P471: calls
    P471-->>- P1: return
    P1->>+ P472: calls
    P472-->>- P1: return
    P1->>+ P473: calls
    P473-->>- P1: return
    P1->>+ P474: calls
    P474-->>- P1: return
    P1->>+ P475: calls
    P475-->>- P1: return
    P1->>+ P476: calls
    P476-->>- P1: return
    P0->>+ P53: calls
    P53-->>- P0: return
    P0->>+ P70: calls
    P70-->>- P0: return
    P0->>+ P75: calls
    P75-->>- P0: return
    P0->>+ P76: calls
    P76-->>- P0: return
    P0->>+ P130: calls
    P130-->>- P0: return
    P0->>+ P131: calls
    P131-->>- P0: return
    P0->>+ P132: calls
    P132-->>- P0: return
    P0->>+ P143: calls
    P143-->>- P0: return
    P0->>+ P167: calls
    P167-->>- P0: return
    P0->>+ P168: calls
    P168-->>- P0: return
    P0->>+ P169: calls
    P169-->>- P0: return
    P0->>+ P170: calls
    P170-->>- P0: return
    P0->>+ P171: calls
    P171-->>- P0: return
    P0->>+ P172: calls
    P172-->>- P0: return
    P0->>+ P177: calls
    P177-->>- P0: return
    P0->>+ P201: calls
    P201-->>- P0: return
    P0->>+ P203: calls
    P203-->>- P0: return
    P0->>+ P204: calls
    P204-->>- P0: return
    P0->>+ P205: calls
    P205-->>- P0: return
    P0->>+ P206: calls
    P206-->>- P0: return
    P0->>+ P208: calls
    P208-->>- P0: return
    P0->>+ P477: calls
    P477-->>- P0: return
    P0->>+ P210: calls
    P210-->>- P0: return
    P0->>+ P211: calls
    P211-->>- P0: return
    P0->>+ P212: calls
    P212-->>- P0: return
    P0->>+ P214: calls
    P214-->>- P0: return
    P0->>+ P215: calls
    P215-->>- P0: return
    P0->>+ P222: calls
    P222-->>- P0: return
    P0->>+ P252: calls
    P252-->>- P0: return
    P0->>+ P253: calls
    P253-->>- P0: return
    P0->>+ P254: calls
    P254-->>- P0: return
    P0->>+ P255: calls
    P255-->>- P0: return
    P0->>+ P256: calls
    P256-->>- P0: return
    P0->>+ P257: calls
    P257-->>- P0: return
    P0->>+ P258: calls
    P258-->>- P0: return
    P0->>+ P259: calls
    P259-->>- P0: return
    P0->>+ P260: calls
    P260-->>- P0: return
    P0->>+ P261: calls
    P261-->>- P0: return
    P0->>+ P262: calls
    P262-->>- P0: return
    P0->>+ P263: calls
    P263-->>- P0: return
    P0->>+ P478: calls
    P478-->>- P0: return
    P0->>+ P265: calls
    P265-->>- P0: return
    P0->>+ P266: calls
    P266-->>- P0: return
    P0->>+ P267: calls
    P267-->>- P0: return
    P0->>+ P269: calls
    P269-->>- P0: return
    P0->>+ P270: calls
    P270-->>- P0: return
    P0->>+ P271: calls
    P271-->>- P0: return
    P0->>+ P272: calls
    P272-->>- P0: return
    P0->>+ P273: calls
    P273-->>- P0: return
    P0->>+ P274: calls
    P274-->>- P0: return
    P0->>+ P276: calls
    P276-->>- P0: return
    P0->>+ P277: calls
    P277-->>- P0: return
    P0->>+ P283: calls
    P283-->>- P0: return
    P0->>+ P284: calls
    P284-->>- P0: return
    P0->>+ P320: calls
    P320-->>- P0: return
    P0->>+ P321: calls
    P321-->>- P0: return
    P0->>+ P322: calls
    P322-->>- P0: return
    P0->>+ P323: calls
    P323-->>- P0: return
    P0->>+ P324: calls
    P324-->>- P0: return
    P0->>+ P325: calls
    P325-->>- P0: return
    P0->>+ P479: calls
    P479-->>- P0: return
    P0->>+ P326: calls
    P326-->>- P0: return
    P0->>+ P327: calls
    P327-->>- P0: return
    P0->>+ P480: calls
    P480-->>- P0: return
    P0->>+ P481: calls
    P481-->>- P0: return
    P0->>+ P482: calls
    P482-->>- P0: return
    P0->>+ P328: calls
    P328-->>- P0: return
    P0->>+ P329: calls
    P329-->>- P0: return
    P0->>+ P330: calls
    P330-->>- P0: return
    P0->>+ P331: calls
    P331-->>- P0: return
    P0->>+ P483: calls
    P483-->>- P0: return
    P0->>+ P484: calls
    P484-->>- P0: return
    P0->>+ P332: calls
    P332-->>- P0: return
    P0->>+ P333: calls
    P333-->>- P0: return
    P0->>+ P334: calls
    P334-->>- P0: return
    P0->>+ P485: calls
    P485-->>- P0: return
    P0->>+ P336: calls
    P336-->>- P0: return
    P0->>+ P337: calls
    P337-->>- P0: return
    P0->>+ P338: calls
    P338-->>- P0: return
    P0->>+ P341: calls
    P341-->>- P0: return
    P0->>+ P342: calls
    P342-->>- P0: return
    P0->>+ P343: calls
    P343-->>- P0: return
    P0->>+ P344: calls
    P344-->>- P0: return
    P0->>+ P345: calls
    P345-->>- P0: return
    P0->>+ P346: calls
    P346-->>- P0: return
    P0->>+ P486: calls
    P486-->>- P0: return
    P0->>+ P347: calls
    P347-->>- P0: return
    P0->>+ P348: calls
    P348-->>- P0: return
    P0->>+ P349: calls
    P349-->>- P0: return
    P0->>+ P350: calls
    P350-->>- P0: return
    P0->>+ P351: calls
    P351-->>- P0: return
    P0->>+ P353: calls
    P353-->>- P0: return
    P0->>+ P354: calls
    P354-->>- P0: return
    P0->>+ P355: calls
    P355-->>- P0: return
    P0->>+ P487: calls
    P487-->>- P0: return
    P0->>+ P488: calls
    P488-->>- P0: return
    P0->>+ P489: calls
    P489-->>- P0: return
    P0->>+ P356: calls
    P356-->>- P0: return
    P0->>+ P357: calls
    P357-->>- P0: return
    P0->>+ P358: calls
    P358-->>- P0: return
    P0->>+ P367: calls
    P367-->>- P0: return
    P0->>+ P490: calls
    P490-->>- P0: return
    P0->>+ P491: calls
    P491-->>- P0: return
    P0->>+ P410: calls
    P410-->>- P0: return
    P0->>+ P414: calls
    P414-->>- P0: return
    P0->>+ P492: calls
    P492-->>- P0: return
    P0->>+ P493: calls
    P493-->>- P0: return
    P0->>+ P494: calls
    P494-->>- P0: return
    P0->>+ P420: calls
    P420-->>- P0: return
    P0->>+ P421: calls
    P421-->>- P0: return
    P0->>+ P495: calls
    P495-->>- P0: return
    P0->>+ P496: calls
    P496-->>- P0: return
    P0->>+ P422: calls
    P422-->>- P0: return
    P0->>+ P497: calls
    P497-->>- P0: return
    P0->>+ P498: calls
    P498-->>- P0: return
    P0->>+ P427: calls
    P427-->>- P0: return
    P0->>+ P428: calls
    P428-->>- P0: return
    P0->>+ P499: calls
    P499-->>- P0: return
    P0->>+ P500: calls
    P500-->>- P0: return
    P0->>+ P501: calls
    P501-->>- P0: return
    P0->>+ P502: calls
    P502-->>- P0: return
    P0->>+ P430: calls
    P430-->>- P0: return
    P0->>+ P431: calls
    P431-->>- P0: return
    P0->>+ P503: calls
    P503-->>- P0: return
    P0->>+ P504: calls
    P504-->>- P0: return
    P0->>+ P505: calls
    P505-->>- P0: return
    P0->>+ P506: calls
    P506-->>- P0: return
    P0->>+ P507: calls
    P507-->>- P0: return
    P0->>+ P508: calls
    P508-->>- P0: return
    P0->>+ P509: calls
    P509-->>- P0: return
    P0->>+ P510: calls
    P510-->>- P0: return
    P0->>+ P511: calls
    P511-->>- P0: return
    P0->>+ P512: calls
    P512-->>- P0: return
    P0->>+ P513: calls
    P513-->>- P0: return
    P0->>+ P514: calls
    P514-->>- P0: return
    P0->>+ P515: calls
    P515-->>- P0: return
    P0->>+ P516: calls
    P516-->>- P0: return
    P0->>+ P517: calls
    P517-->>- P0: return
    P0->>+ P518: calls
    P518-->>- P0: return
    P0->>+ P519: calls
    P519-->>- P0: return
    P0->>+ P520: calls
    P520-->>- P0: return
    P0->>+ P521: calls
    P521-->>- P0: return
    P0->>+ P522: calls
    P522-->>- P0: return
    P0->>+ P523: calls
    P523-->>- P0: return
    P0->>+ P524: calls
    P524-->>- P0: return
    P0->>+ P525: calls
    P525-->>- P0: return
    P0->>+ P526: calls
    P526-->>- P0: return
    P0->>+ P527: calls
    P527-->>- P0: return
    P0->>+ P528: calls
    P528-->>- P0: return
```

## Connections by Relation

### calls
- [[sendTelegramAudio()]] `INFERRED`
- [[processAudioUpload()]] `INFERRED`
- [[handleRewardShare()]] `INFERRED`
- [[sendTelegramVideo()]] `INFERRED`
- [[sendTelegramDocument()]] `INFERRED`
- [[handleSubmit()]] `INFERRED`
- [[handleFileSelect()]] `INFERRED`
- [[analyzeAudio()]] `INFERRED`
- [[pollForResult()]] `INFERRED`
- [[handleSubmit()]] `INFERRED`
- [[handleFileUpload()]] `INFERRED`
- [[uploadAndAnalyze()]] `INFERRED`
- [[handleApplyCrop()]] `INFERRED`
- [[handleFileUpload()]] `INFERRED`
- [[handleFileSelect()]] `INFERRED`
- [[handleReply()]] `INFERRED`
- [[handleSubmit()]] `INFERRED`
- [[handleFileUpload()]] `INFERRED`
- [[handleSubmit()]] `INFERRED`
- [[handleImageUpload()]] `INFERRED`

### contains
- [[index.ts]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*