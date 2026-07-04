# editMessageText()

> God node · 131 connections · [D:\.MUSICVERSE\aimusicverse\supabase\functions\telegram-bot\telegram-api.ts](file:///D:/.MUSICVERSE/aimusicverse/supabase/functions/telegram-bot/telegram-api.ts#L463)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as editMessageText()
    participant P1 as { error }
    participant P2 as handleDeepLink()
    participant P3 as .info()
    participant P4 as sendMessage()
    participant P5 as .build()
    participant P6 as .addButton()
    participant P7 as buildMessage()
    participant P8 as sendPhoto()
    participant P9 as .addRow()
    participant P10 as getMenuImage()
    participant P11 as handleProjects()
    participant P12 as handleLibrary()
    participant P13 as trackDeepLinkAnalytics()
    participant P14 as handleProjectDeepLink()
    participant P15 as handleTrackDeepLink()
    participant P16 as handleHelp()
    participant P17 as handleArtistDeepLink()
    participant P18 as handleProfileDeepLink()
    participant P19 as handleInviteDeepLink()
    participant P20 as handleQuickGenDeepLink()
    participant P21 as handlePaymentDeepLink()
    participant P22 as handleLeaderboardDeepLink()
    participant P23 as handleAchievementsDeepLink()
    participant P24 as handleQuickActionsCallbacks()
    participant P25 as handleAnalyzeDeepLink()
    participant P26 as handleStart()
    participant P27 as parseDeepLink()
    participant P28 as uploadAndShowActions()
    participant P29 as handleAudioActionCallback()
    participant P30 as handleDashboard()
    participant P31 as handleClassificationCallback()
    participant P32 as processVoiceMessage()
    participant P33 as handleAutoUploadWithPipeline()
    participant P34 as handleAudioMessage()
    participant P35 as deleteMessage()
    participant P36 as handleCallbackQuery()
    participant P37 as setActiveMenuMessageId()
    participant P38 as deleteAndSendNewMenuPhoto()
    participant P39 as initiateTariffPurchase()
    participant P40 as handleUpdate()
    participant P41 as uploadFile()
    participant P42 as editMessageMedia()
    participant P43 as handleGenerate()
    participant P44 as handleGuitarAudio()
    participant P45 as handleMidiCommand()
    participant P46 as handleStatus()
    participant P47 as sendNotification()
    participant P48 as .setActive()
    participant P49 as handleCheckTask()
    participant P50 as handleInlineQuery()
    participant P51 as startMidiConversion()
    participant P52 as handleCloudUploadWithAnalysis()
    participant P53 as processMediaGroupAction()
    participant P54 as sendTelegramAudio()
    participant P55 as handleVoiceForGeneration()
    participant P56 as getCachedAudio()
    participant P57 as createNotification()
    participant P58 as sendAudio()
    participant P59 as handleDynamicMenuCallback()
    participant P60 as handleGenerateFromReference()
    participant P61 as handleCloudCallback()
    participant P62 as handlePlayTrack()
    participant P63 as handleGenerationWizardCallback()
    participant P64 as .analyze()
    participant P65 as editMessageCaption()
    participant P66 as handleAnalyzeCommand()
    participant P67 as handleInlineQuery()
    participant P68 as handlePianoCommand()
    participant P69 as handleMyUploads()
    participant P70 as .saveState()
    participant P71 as handleAudioActionCallback()
    participant P72 as handleCoverAction()
    participant P73 as handleExtendAction()
    participant P74 as processAudioUpload()
    participant P75 as showTierInfo()
    participant P76 as startGenerationFromVoice()
    participant P77 as cacheAudio()
    participant P78 as .getState()
    participant P79 as sendDocument()
    participant P80 as handleChordAnalysis()
    participant P81 as handleBeatAnalysis()
    participant P82 as handleSendTrackToChat()
    participant P83 as .cleanup()
    participant P84 as handleStemsAction()
    participant P85 as handleMidiAction()
    participant P86 as handleUploadCallback()
    participant P87 as .deleteTrackedMessage()
    participant P88 as sendLikeDigest()
    participant P89 as sendCommentDigest()
    participant P90 as startGeneration()
    participant P91 as .persistToDatabase()
    participant P92 as handleRewardShare()
    participant P93 as .acquire()
    participant P94 as createTinkoffPayment()
    participant P95 as sendAlertToAdmins()
    participant P96 as checkAndUnlockAchievements()
    participant P97 as sendTelegramVideo()
    participant P98 as sendTelegramDocument()
    participant P99 as handleTranscription()
    participant P100 as handleFullAnalysis()
    participant P101 as handleAnalyzeList()
    participant P102 as handleGuitarCommand()
    participant P103 as handleLyrics()
    participant P104 as handleAddToPlaylist()
    participant P105 as handleRecognizeAudio()
    participant P106 as handleCheckStemsStatus()
    participant P107 as handleStudio()
    participant P108 as deleteActiveMenu()
    participant P109 as .showMenu()
    participant P110 as .startWizard()
    participant P111 as .handleCallback()
    participant P112 as showAudioClassificationPromptInternal()
    participant P113 as handleFeedbackCallback()
    participant P114 as handleChosenInlineResult()
    participant P115 as handleBuyCommand()
    participant P116 as startQuickGeneration()
    participant P117 as loadTiers()
    participant P118 as handleTariffCallback()
    participant P119 as handleVoiceProcessorCallback()
    participant P120 as sendAutoDeleteMessage()
    participant P121 as sendFollowerDigest()
    participant P122 as createProject()
    participant P123 as ensureAudioReady()
    participant P124 as resumeAudioContext()
    participant P125 as ensureAudioRoutedToDestination()
    participant P126 as showGenerationError()
    participant P127 as .generateFallback()
    participant P128 as detectBPM()
    participant P129 as shareTrackURL()
    participant P130 as sharePlaylistURL()
    participant P131 as sendTelegramMessage()
    participant P132 as handleSuccessfulPayment()
    participant P133 as handleMediaGroupCallbacks()
    participant P134 as handleAnalyzeSelect()
    participant P135 as handleRecognizeCommand()
    participant P136 as handleTrackStats()
    participant P137 as handleStemSeparation()
    participant P138 as handleSelectReference()
    participant P139 as handleUseReference()
    participant P140 as .cancelWizard()
    participant P141 as .getTrackById()
    participant P142 as .getUserProjects()
    participant P143 as loadMenuItems()
    participant P144 as processFeedbackMessage()
    participant P145 as sendFeedbackReply()
    participant P146 as handleDownloadTrack()
    participant P147 as handleBuyProduct()
    participant P148 as handleEnhancedQuickActionCallback()
    participant P149 as getUserRecentStyles()
    participant P150 as handleTracksCallback()
    participant P151 as generateThumbnails()
    participant P152 as handleSubmit()
    participant P153 as performUpload()
    participant P154 as analyzeAudio()
    participant P155 as registerAudioServiceWorker()
    participant P156 as migrateQueueFromPlayerStore()
    participant P157 as .saveState()
    participant P158 as fetchFeedback()
    participant P159 as loadProjectData()
    participant P160 as cancelTinkoffSubscription()
    participant P161 as .getActive()
    participant P162 as shareTrackToStory()
    participant P163 as sharePlaylistToStory()
    participant P164 as .analyzeWithFlamingo()
    participant P165 as .analyzeWithLovableAI()
    participant P166 as .analyzeWithKlangio()
    participant P167 as pollForResult()
    participant P168 as handlePreCheckoutQuery()
    participant P169 as getPublicTracksForGuests()
    participant P170 as handleMashup()
    participant P171 as handlePlaylistAdd()
    participant P172 as recognizeFromUrl()
    participant P173 as handleRemix()
    participant P174 as handleAddVocals()
    participant P175 as handleAddInstrumental()
    participant P176 as handleTrackDetails()
    participant P177 as handleDownloadStems()
    participant P178 as handleShowLyrics()
    participant P179 as getPendingUpload()
    participant P180 as consumePendingAudio()
    participant P181 as .navigateBack()
    participant P182 as .saveState()
    participant P183 as .handleInput()
    participant P184 as .confirmWizard()
    participant P185 as .getUserTracks()
    participant P186 as getFileUrl()
    participant P187 as getFileUrl()
    participant P188 as loadCustomImages()
    participant P189 as storeFailedNotification()
    participant P190 as handleFileSelect()
    participant P191 as runAccessibilityAudit()
    participant P192 as analyzeBundleSizes()
    participant P193 as handleSubmit()
    participant P194 as handleFileUpload()
    participant P195 as uploadAndAnalyze()
    participant P196 as handleActivateTrial()
    participant P197 as handleApplyCrop()
    participant P198 as handleFileUpload()
    participant P199 as handleGenerate()
    participant P200 as handleFileSelect()
    participant P201 as loadPositions()
    participant P202 as getOrCreateAudioNodes()
    participant P203 as checkAdminStatus()
    participant P204 as handleReply()
    participant P205 as processQueue()
    participant P206 as .getValidatePhrase()
    participant P207 as .getVoiceId()
    participant P208 as sendTelegramProgress()
    participant P209 as downloadAndUploadStem()
    participant P210 as handleShareTrack()
    participant P211 as handleSeparateStems()
    participant P212 as handleDownloadStems()
    participant P213 as handleDeleteReference()
    participant P214 as deleteAndSendNewMenu()
    participant P215 as setPendingAudio()
    participant P216 as updatePendingAudioAnalysis()
    participant P217 as setWizardState()
    participant P218 as .updateMenu()
    participant P219 as .getUserByTelegramId()
    participant P220 as updatePendingClassification()
    participant P221 as loadTariffTiers()
    participant P222 as handleLikeTrack()
    participant P223 as handleBuyCreditPackages()
    participant P224 as handleBuySubscriptions()
    participant P225 as showEnhancedQuickActions()
    participant P226 as handleUploadCancel()
    participant P227 as checkUserQuota()
    participant P228 as startGenerationWizard()
    participant P229 as validateFeatureAccess()
    participant P230 as handleSubmit()
    participant P231 as componentDidCatch()
    participant P232 as handleFileUpload()
    participant P233 as handleSubmit()
    participant P234 as handleImageUpload()
    participant P235 as handleAnalyze()
    participant P236 as handleExtractLyrics()
    participant P237 as handleRecordingComplete()
    participant P238 as handleGenerate()
    participant P239 as handleImprove()
    participant P240 as handleAddTags()
    participant P241 as uploadAndGetUrl()
    participant P242 as extractLyrics()
    participant P243 as handleSaveAsPlaylist()
    participant P244 as handleTranslate()
    participant P245 as handleGenerate()
    participant P246 as handleApply()
    participant P247 as handleRemoveAvatar()
    participant P248 as handleUseAsReference()
    participant P249 as generateWaveform()
    participant P250 as handleUpload()
    participant P251 as handleCopy()
    participant P252 as activateTrial()
    participant P253 as prefetchAudio()
    participant P254 as cleanupExpiredEntries()
    participant P255 as fetchDeeplinkAnalyticsSummary()
    participant P256 as exportAnalytics()
    participant P257 as detectBPMFromUrl()
    participant P258 as handleSeparateStems()
    participant P259 as fetchReplacedSections()
    participant P260 as getUserPaymentTransactions()
    participant P261 as getActiveSubscription()
    participant P262 as .clearActive()
    participant P263 as .validateVoice()
    participant P264 as .regeneratePhrase()
    participant P265 as .generateVoice()
    participant P266 as .checkVoiceAvailability()
    participant P267 as handleSetEmojiStatus()
    participant P268 as handleRemoveEmojiStatus()
    participant P269 as clearActiveMenu()
    participant P270 as getBotCommands()
    participant P271 as updateBotCommands()
    participant P272 as setPendingUpload()
    participant P273 as consumePendingUpload()
    participant P274 as getPendingAudioWithoutConsuming()
    participant P275 as updatePendingUpload()
    participant P276 as .sendMenu()
    participant P277 as .getActiveTasks()
    participant P278 as setPendingClassification()
    participant P279 as getPendingClassification()
    participant P280 as consumePendingClassification()
    participant P281 as getFileUrl()
    participant P282 as startInlineGeneration()
    participant P283 as handleVoiceGenerationCallback()
    participant P284 as flushMetrics()
    participant P285 as deductCredits()
    participant P286 as checkRateLimitDb()
    participant P287 as scheduleRetry()
    participant P288 as logApiCall()
    participant P289 as getSubscriptionStatus()
    participant P290 as getMidiMetadata()
    participant P291 as insertCreditTransaction()
    participant P292 as upsertUserCredits()
    participant P293 as getDerivedStateFromError()
    participant P294 as handleExtend()
    participant P295 as setupWebhook()
    participant P296 as handleSubmit()
    participant P297 as handleImageUpload()
    participant P298 as handleForceAlert()
    participant P299 as handleNewArrangement()
    participant P300 as handleNewVocal()
    participant P301 as loadData()
    participant P302 as handleAddNewPrompt()
    participant P303 as handleSubmit()
    participant P304 as handleDownload()
    participant P305 as startRecording()
    participant P306 as handleQuickGenerate()
    participant P307 as handleGenerateCover()
    participant P308 as handleStartTrial()
    participant P309 as handleSubscribe()
    participant P310 as handleGenerate()
    participant P311 as handleSendToTelegram()
    participant P312 as handleAddToProject()
    participant P313 as handleShareToStory()
    participant P314 as saveGuitarAnalysisForTrack()
    participant P315 as attemptAudioRecovery()
    participant P316 as logError()
    participant P317 as generateWaveformFromBuffer()
    participant P318 as .initializeAudioContext()
    participant P319 as retry()
    participant P320 as handleClose()
    participant P321 as getPaymentTransaction()
    participant P322 as getUserTinkoffSubscriptions()
    participant P323 as authenticateWithTelegram()
    participant P324 as hashContentFromUrl()
    participant P325 as editTelegramMessage()
    participant P326 as verifyAdminAccess()
    participant P327 as fetchWithRetry()
    participant P328 as loadConfigFromDatabase()
    participant P329 as executeSearch()
    participant P330 as answerInlineQuery()
    participant P331 as getActiveMenuMessageId()
    participant P332 as saveBotCommands()
    participant P333 as cancelPendingUpload()
    participant P334 as setConversationContext()
    participant P335 as getWizardState()
    participant P336 as editInlineMessage()
    participant P337 as storeMediaGroupSession()
    participant P338 as saveRecentStyle()
    participant P339 as storeVoiceTranscription()
    participant P340 as createMainMenuKeyboardAsync()
    participant P341 as .processQueue()
    participant P342 as markNotificationSuccess()
    participant P343 as markNotificationFailed()
    participant P344 as handleWizardTextInput()
    participant P345 as validateRequest()
    participant P346 as forwardBase64ToSuno()
    participant P347 as checkLinks()
    participant P348 as migrateFile()
    participant P349 as downloadMidiFile()
    participant P350 as updateUserCreditsBalance()
    participant P351 as uploadFile()
    participant P352 as deleteFile()
    participant P353 as listFiles()
    participant P354 as handleSubmit()
    participant P355 as handleGeneratePortrait()
    participant P356 as handleSubmit()
    participant P357 as handleDelete()
    participant P358 as sendTestAlert()
    participant P359 as handleSendTestAlert()
    participant P360 as handleGeneratePortrait()
    participant P361 as handleSubmit()
    participant P362 as handleTranscribe()
    participant P363 as handleSaveLyrics()
    participant P364 as handleDelete()
    participant P365 as handleDownload()
    participant P366 as handleLink()
    participant P367 as handleGenerate()
    participant P368 as checkProfileSetup()
    participant P369 as handleCancelSubscription()
    participant P370 as handleShareToStory()
    participant P371 as handleGetOptions()
    participant P372 as handleApplyOption()
    participant P373 as handleSubmit()
    participant P374 as handleGenerateCover()
    participant P375 as handleRemoveCover()
    participant P376 as handleDownload()
    participant P377 as handleDownload()
    participant P378 as handleSubmit()
    participant P379 as handleSubmit()
    participant P380 as handleSubmit()
    participant P381 as handleVersionSelect()
    participant P382 as init()
    participant P383 as handleScan()
    participant P384 as handleCopy()
    participant P385 as handleCopy()
    participant P386 as handleCopy()
    participant P387 as handleDownload()
    participant P388 as pickStem()
    participant P389 as getStoredPresets()
    participant P390 as savePositions()
    participant P391 as clearAudioCache()
    participant P392 as precacheAudioUrls()
    participant P393 as clearAudioCacheViaSW()
    participant P394 as deleteFile()
    participant P395 as mapSunoError()
    participant P396 as generateWaveformFromUrl()
    participant P397 as handleSaveRecording()
    participant P398 as handleCreate()
    participant P399 as getAllProducts()
    participant P400 as getProduct()
    participant P401 as getCreditPackages()
    participant P402 as getSubscriptions()
    participant P403 as createPayment()
    participant P404 as saveFailedNotification()
    participant P405 as switchInlineQuery()
    participant P406 as createHealthAlert()
    participant P407 as checkRateLimit()
    participant P408 as answerPreCheckoutQuery()
    participant P409 as logInlineSearch()
    participant P410 as sendNotification()
    participant P411 as getMenuState()
    participant P412 as clearWizardState()
    participant P413 as cleanupSessions()
    participant P414 as .getCurrentContext()
    participant P415 as .getBreadcrumb()
    participant P416 as .getProjectById()
    participant P417 as .incrementPlayCount()
    participant P418 as storeTemporaryAudio()
    participant P419 as logChosenResult()
    participant P420 as handleTrackChosen()
    participant P421 as getFileInfo()
    participant P422 as getFileUrl()
    participant P423 as getFileUrl()
    participant P424 as forwardUrlToSuno()
    participant P425 as getBundleFiles()
    participant P426 as uploadMidiFile()
    participant P427 as getMidiPublicUrl()
    participant P428 as deleteMidiFile()
    participant P429 as listMidiFilesForTrack()
    participant P430 as upsertNotificationSettings()
    participant P431 as upsertOnboardingNotificationSettings()
    participant P432 as upsertUserCreditsBalance()
    participant P433 as handleSubmit()
    participant P434 as handleRemixClick()
    participant P435 as handleResolve()
    participant P436 as handleSubmit()
    participant P437 as handleFileInputChange()
    participant P438 as handleSubmit()
    participant P439 as handleSave()
    participant P440 as handleCopyProgression()
    participant P441 as handleFileUpload()
    participant P442 as handleStartRecording()
    participant P443 as startTuner()
    participant P444 as handleReanalyze()
    participant P445 as handleCopy()
    participant P446 as handleCopy()
    participant P447 as handleCopy()
    participant P448 as handleSubscribe()
    participant P449 as handleDownload()
    participant P450 as handleCreateProject()
    participant P451 as handleShare()
    participant P452 as handleCopyLink()
    participant P453 as handleVersionSelect()
    participant P454 as handleCopy()
    participant P455 as handleSave()
    participant P456 as savePresets()
    participant P457 as requestNotificationPermission()
    participant P458 as getOwnTelegramIds()
    participant P459 as handleBatchAction()
    participant P460 as generateArtistPortraitForPreview()
    participant P461 as deleteNotification()
    participant P462 as cleanupExpiredNotifications()
    participant P463 as replaceSection()
    participant P464 as separateStems()
    participant P465 as switchToVersion()
    participant P466 as extendTrack()
    participant P467 as extendMusic()
    participant P468 as addInstrumental()
    participant P469 as addVocals()
    participant P470 as sunoUploadCover()
    participant P471 as sunoUploadExtend()
    participant P472 as sunoMashup()
    participant P473 as sunoPersona()
    participant P474 as sunoFileUpload()
    participant P475 as sendTelegramDocumentShare()
    participant P476 as remixTrack()
    participant P477 as setSession()
    participant P478 as setupTelegramWebhook()
    participant P479 as validateWebhookSignature()
    participant P480 as handleInternalAction()
    participant P481 as storeNotification()
    participant P482 as checkAlerts()
    participant P483 as getPendingRetries()
    participant P484 as handleFileSelect()
    participant P485 as handleFileSelect()
    participant P486 as componentDidCatch()
    participant P487 as handleBroadcast()
    participant P488 as handleCredit()
    participant P489 as handleCostChange()
    participant P490 as handleFeatureToggle()
    participant P491 as initWavesurfer()
    participant P492 as handleSaveRecording()
    participant P493 as handleGenerateTheme()
    participant P494 as .componentDidCatch()
    participant P495 as handleFileUpload()
    participant P496 as handleRecognizeLyrics()
    participant P497 as handleFileSelect()
    participant P498 as componentDidCatch()
    participant P499 as handleSaveAsTrack()
    participant P500 as init()
    participant P501 as componentDidCatch()
    participant P502 as handleGenerate()
    participant P503 as showGenerationCompleteNotification()
    participant P504 as deleteNotificationsByGroup()
    participant P505 as json()
    participant P506 as handleNavigationCallbacks()
    participant P507 as handleProjectsCallback()
    participant P508 as text
    participant P509 as handleProjectsCarousel()
    participant P510 as handleProjectDetails()
    participant P511 as showCloudFiles()
    participant P512 as handleWizardCallback()
    participant P513 as showCloudTracks()
    participant P514 as handleCoverCommand()
    participant P515 as handleExtendCommand()
    participant P516 as handleTerms()
    participant P517 as handlePrivacy()
    participant P518 as handleUploadCommand()
    participant P519 as handleArtistDetails()
    participant P520 as handleAbout()
    participant P521 as handleArtistsCallback()
    participant P522 as handleArtistTracks()
    participant P523 as showClassificationPrompt()
    participant P524 as showFileDetails()
    participant P525 as showMyRequests()
    participant P526 as handleProjectShare()
    participant P527 as handleProjectStats()
    participant P528 as handleProjectTracks()
    participant P529 as showTracksList()
    participant P530 as handleMidiTrackCallback()
    participant P531 as handleArtistEdit()
    participant P532 as showStemFiles()
    participant P533 as showMidiFiles()
    participant P534 as showStorageInfo()
    participant P535 as handleProjectEdit()
    participant P536 as startProjectWizard()
    participant P537 as handleArtistDeleteConfirm()
    participant P538 as handleProjectDeleteConfirm()
    participant P539 as showTariffsMenu()
    participant P540 as showEnterpriseContact()
    participant P541 as handleVoiceToTrack()
    participant P542 as showMoodStep()
    participant P543 as showTypeSelection()
    participant P544 as showGenreSelection()
    participant P545 as showMoodSelection()
    participant P546 as processGenerationWithReference()
    participant P547 as processAddVocalsInstrumental()
    participant P548 as handleCancelMidi()
    participant P549 as handleNews()
    participant P550 as handleRating()
    participant P551 as showCustomPromptInput()
    participant P552 as handleVoiceToArrangement()
    participant P553 as handleVoiceToCover()
    participant P554 as handleVoiceToStems()
    participant P555 as showSubgenreStep()
    participant P556 as showConfirmStep()
    participant P557 as cancelWizard()
    participant P558 as handleCancelUploadCallback()
    participant P559 as handleCancelGuitar()
    participant P560 as handleMidiUploadCallback()
    participant P561 as handleCancelRecognize()
    participant P562 as handleCopyTrackLink()
    participant P563 as handleTemplateSelection()
    participant P564 as showStyleStep()
    participant P565 as showDetailsStep()
    participant P566 as showDescriptionInput()
    participant P567 as showConfirmation()
    participant P568 as handleTranscribeMenu()
    participant P569 as handlePlaylistNew()
    participant P570 as handleSettings()
    participant P571 as handleNotificationSettings()
    participant P572 as handleEmojiStatusSettings()
    participant P573 as showGenderPrompt()
    participant P574 as promptFeedback()
    participant P575 as showEnergyStep()
    participant P576 as showRatingOptions()
    participant P577 as showGenreFilter()
    participant P578 as promptTrackSearch()
    participant P579 as showUploadProgress()
    P0->>+ P1: calls
    P1-->>- P0: return
    P1->>+ P0: calls
    P0-->>- P1: return
    P1->>+ P2: calls
    P2-->>- P1: return
    P2->>+ P1: calls
    P1-->>- P2: return
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
    P1->>+ P8: calls
    P8-->>- P1: return
    P1->>+ P28: calls
    P28-->>- P1: return
    P1->>+ P29: calls
    P29-->>- P1: return
    P1->>+ P30: calls
    P30-->>- P1: return
    P1->>+ P31: calls
    P31-->>- P1: return
    P1->>+ P32: calls
    P32-->>- P1: return
    P1->>+ P33: calls
    P33-->>- P1: return
    P1->>+ P11: calls
    P11-->>- P1: return
    P1->>+ P34: calls
    P34-->>- P1: return
    P1->>+ P35: calls
    P35-->>- P1: return
    P1->>+ P36: calls
    P36-->>- P1: return
    P1->>+ P12: calls
    P12-->>- P1: return
    P1->>+ P37: calls
    P37-->>- P1: return
    P1->>+ P38: calls
    P38-->>- P1: return
    P1->>+ P39: calls
    P39-->>- P1: return
    P1->>+ P40: calls
    P40-->>- P1: return
    P1->>+ P41: calls
    P41-->>- P1: return
    P1->>+ P42: calls
    P42-->>- P1: return
    P1->>+ P43: calls
    P43-->>- P1: return
    P1->>+ P44: calls
    P44-->>- P1: return
    P1->>+ P45: calls
    P45-->>- P1: return
    P1->>+ P46: calls
    P46-->>- P1: return
    P1->>+ P47: calls
    P47-->>- P1: return
    P1->>+ P48: calls
    P48-->>- P1: return
    P1->>+ P49: calls
    P49-->>- P1: return
    P1->>+ P50: calls
    P50-->>- P1: return
    P1->>+ P51: calls
    P51-->>- P1: return
    P1->>+ P52: calls
    P52-->>- P1: return
    P1->>+ P53: calls
    P53-->>- P1: return
    P1->>+ P54: calls
    P54-->>- P1: return
    P1->>+ P13: calls
    P13-->>- P1: return
    P1->>+ P55: calls
    P55-->>- P1: return
    P1->>+ P56: calls
    P56-->>- P1: return
    P1->>+ P57: calls
    P57-->>- P1: return
    P1->>+ P58: calls
    P58-->>- P1: return
    P1->>+ P59: calls
    P59-->>- P1: return
    P1->>+ P60: calls
    P60-->>- P1: return
    P1->>+ P61: calls
    P61-->>- P1: return
    P1->>+ P62: calls
    P62-->>- P1: return
    P1->>+ P63: calls
    P63-->>- P1: return
    P1->>+ P64: calls
    P64-->>- P1: return
    P1->>+ P65: calls
    P65-->>- P1: return
    P1->>+ P66: calls
    P66-->>- P1: return
    P1->>+ P67: calls
    P67-->>- P1: return
    P1->>+ P68: calls
    P68-->>- P1: return
    P1->>+ P69: calls
    P69-->>- P1: return
    P1->>+ P70: calls
    P70-->>- P1: return
    P1->>+ P71: calls
    P71-->>- P1: return
    P1->>+ P72: calls
    P72-->>- P1: return
    P1->>+ P73: calls
    P73-->>- P1: return
    P1->>+ P74: calls
    P74-->>- P1: return
    P1->>+ P75: calls
    P75-->>- P1: return
    P1->>+ P76: calls
    P76-->>- P1: return
    P1->>+ P77: calls
    P77-->>- P1: return
    P1->>+ P78: calls
    P78-->>- P1: return
    P1->>+ P79: calls
    P79-->>- P1: return
    P1->>+ P80: calls
    P80-->>- P1: return
    P1->>+ P81: calls
    P81-->>- P1: return
    P1->>+ P82: calls
    P82-->>- P1: return
    P1->>+ P83: calls
    P83-->>- P1: return
    P1->>+ P84: calls
    P84-->>- P1: return
    P1->>+ P85: calls
    P85-->>- P1: return
    P1->>+ P86: calls
    P86-->>- P1: return
    P1->>+ P87: calls
    P87-->>- P1: return
    P1->>+ P88: calls
    P88-->>- P1: return
    P1->>+ P89: calls
    P89-->>- P1: return
    P1->>+ P90: calls
    P90-->>- P1: return
    P1->>+ P91: calls
    P91-->>- P1: return
    P1->>+ P92: calls
    P92-->>- P1: return
    P1->>+ P93: calls
    P93-->>- P1: return
    P1->>+ P94: calls
    P94-->>- P1: return
    P1->>+ P95: calls
    P95-->>- P1: return
    P1->>+ P96: calls
    P96-->>- P1: return
    P1->>+ P97: calls
    P97-->>- P1: return
    P1->>+ P98: calls
    P98-->>- P1: return
    P1->>+ P99: calls
    P99-->>- P1: return
    P1->>+ P100: calls
    P100-->>- P1: return
    P1->>+ P101: calls
    P101-->>- P1: return
    P1->>+ P102: calls
    P102-->>- P1: return
    P1->>+ P103: calls
    P103-->>- P1: return
    P1->>+ P104: calls
    P104-->>- P1: return
    P1->>+ P105: calls
    P105-->>- P1: return
    P1->>+ P106: calls
    P106-->>- P1: return
    P1->>+ P107: calls
    P107-->>- P1: return
    P1->>+ P108: calls
    P108-->>- P1: return
    P1->>+ P109: calls
    P109-->>- P1: return
    P1->>+ P110: calls
    P110-->>- P1: return
    P1->>+ P111: calls
    P111-->>- P1: return
    P1->>+ P112: calls
    P112-->>- P1: return
    P1->>+ P113: calls
    P113-->>- P1: return
    P1->>+ P114: calls
    P114-->>- P1: return
    P1->>+ P115: calls
    P115-->>- P1: return
    P1->>+ P116: calls
    P116-->>- P1: return
    P1->>+ P117: calls
    P117-->>- P1: return
    P1->>+ P118: calls
    P118-->>- P1: return
    P1->>+ P119: calls
    P119-->>- P1: return
    P1->>+ P120: calls
    P120-->>- P1: return
    P1->>+ P121: calls
    P121-->>- P1: return
    P1->>+ P122: calls
    P122-->>- P1: return
    P1->>+ P123: calls
    P123-->>- P1: return
    P1->>+ P124: calls
    P124-->>- P1: return
    P1->>+ P125: calls
    P125-->>- P1: return
    P1->>+ P126: calls
    P126-->>- P1: return
    P1->>+ P127: calls
    P127-->>- P1: return
    P1->>+ P128: calls
    P128-->>- P1: return
    P1->>+ P129: calls
    P129-->>- P1: return
    P1->>+ P130: calls
    P130-->>- P1: return
    P1->>+ P131: calls
    P131-->>- P1: return
    P1->>+ P132: calls
    P132-->>- P1: return
    P1->>+ P133: calls
    P133-->>- P1: return
    P1->>+ P134: calls
    P134-->>- P1: return
    P1->>+ P135: calls
    P135-->>- P1: return
    P1->>+ P136: calls
    P136-->>- P1: return
    P1->>+ P137: calls
    P137-->>- P1: return
    P1->>+ P138: calls
    P138-->>- P1: return
    P1->>+ P139: calls
    P139-->>- P1: return
    P1->>+ P140: calls
    P140-->>- P1: return
    P1->>+ P141: calls
    P141-->>- P1: return
    P1->>+ P142: calls
    P142-->>- P1: return
    P1->>+ P143: calls
    P143-->>- P1: return
    P1->>+ P144: calls
    P144-->>- P1: return
    P1->>+ P145: calls
    P145-->>- P1: return
    P1->>+ P146: calls
    P146-->>- P1: return
    P1->>+ P147: calls
    P147-->>- P1: return
    P1->>+ P148: calls
    P148-->>- P1: return
    P1->>+ P149: calls
    P149-->>- P1: return
    P1->>+ P150: calls
    P150-->>- P1: return
    P1->>+ P151: calls
    P151-->>- P1: return
    P1->>+ P152: calls
    P152-->>- P1: return
    P1->>+ P153: calls
    P153-->>- P1: return
    P1->>+ P154: calls
    P154-->>- P1: return
    P1->>+ P155: calls
    P155-->>- P1: return
    P1->>+ P156: calls
    P156-->>- P1: return
    P1->>+ P157: calls
    P157-->>- P1: return
    P1->>+ P158: calls
    P158-->>- P1: return
    P1->>+ P159: calls
    P159-->>- P1: return
    P1->>+ P160: calls
    P160-->>- P1: return
    P1->>+ P161: calls
    P161-->>- P1: return
    P1->>+ P162: calls
    P162-->>- P1: return
    P1->>+ P163: calls
    P163-->>- P1: return
    P1->>+ P164: calls
    P164-->>- P1: return
    P1->>+ P165: calls
    P165-->>- P1: return
    P1->>+ P166: calls
    P166-->>- P1: return
    P1->>+ P167: calls
    P167-->>- P1: return
    P1->>+ P168: calls
    P168-->>- P1: return
    P1->>+ P169: calls
    P169-->>- P1: return
    P1->>+ P170: calls
    P170-->>- P1: return
    P1->>+ P171: calls
    P171-->>- P1: return
    P1->>+ P172: calls
    P172-->>- P1: return
    P1->>+ P173: calls
    P173-->>- P1: return
    P1->>+ P174: calls
    P174-->>- P1: return
    P1->>+ P175: calls
    P175-->>- P1: return
    P1->>+ P176: calls
    P176-->>- P1: return
    P1->>+ P177: calls
    P177-->>- P1: return
    P1->>+ P178: calls
    P178-->>- P1: return
    P1->>+ P179: calls
    P179-->>- P1: return
    P1->>+ P180: calls
    P180-->>- P1: return
    P1->>+ P181: calls
    P181-->>- P1: return
    P1->>+ P182: calls
    P182-->>- P1: return
    P1->>+ P183: calls
    P183-->>- P1: return
    P1->>+ P184: calls
    P184-->>- P1: return
    P1->>+ P185: calls
    P185-->>- P1: return
    P1->>+ P186: calls
    P186-->>- P1: return
    P1->>+ P187: calls
    P187-->>- P1: return
    P1->>+ P188: calls
    P188-->>- P1: return
    P1->>+ P189: calls
    P189-->>- P1: return
    P1->>+ P190: calls
    P190-->>- P1: return
    P1->>+ P191: calls
    P191-->>- P1: return
    P1->>+ P192: calls
    P192-->>- P1: return
    P1->>+ P193: calls
    P193-->>- P1: return
    P1->>+ P194: calls
    P194-->>- P1: return
    P1->>+ P195: calls
    P195-->>- P1: return
    P1->>+ P196: calls
    P196-->>- P1: return
    P1->>+ P197: calls
    P197-->>- P1: return
    P1->>+ P198: calls
    P198-->>- P1: return
    P1->>+ P199: calls
    P199-->>- P1: return
    P1->>+ P200: calls
    P200-->>- P1: return
    P1->>+ P201: calls
    P201-->>- P1: return
    P1->>+ P202: calls
    P202-->>- P1: return
    P1->>+ P203: calls
    P203-->>- P1: return
    P1->>+ P204: calls
    P204-->>- P1: return
    P1->>+ P205: calls
    P205-->>- P1: return
    P1->>+ P206: calls
    P206-->>- P1: return
    P1->>+ P207: calls
    P207-->>- P1: return
    P1->>+ P208: calls
    P208-->>- P1: return
    P1->>+ P209: calls
    P209-->>- P1: return
    P1->>+ P210: calls
    P210-->>- P1: return
    P1->>+ P211: calls
    P211-->>- P1: return
    P1->>+ P212: calls
    P212-->>- P1: return
    P1->>+ P213: calls
    P213-->>- P1: return
    P1->>+ P214: calls
    P214-->>- P1: return
    P1->>+ P215: calls
    P215-->>- P1: return
    P1->>+ P216: calls
    P216-->>- P1: return
    P1->>+ P217: calls
    P217-->>- P1: return
    P1->>+ P218: calls
    P218-->>- P1: return
    P1->>+ P219: calls
    P219-->>- P1: return
    P1->>+ P220: calls
    P220-->>- P1: return
    P1->>+ P221: calls
    P221-->>- P1: return
    P1->>+ P222: calls
    P222-->>- P1: return
    P1->>+ P223: calls
    P223-->>- P1: return
    P1->>+ P224: calls
    P224-->>- P1: return
    P1->>+ P225: calls
    P225-->>- P1: return
    P1->>+ P226: calls
    P226-->>- P1: return
    P1->>+ P227: calls
    P227-->>- P1: return
    P1->>+ P228: calls
    P228-->>- P1: return
    P1->>+ P229: calls
    P229-->>- P1: return
    P1->>+ P230: calls
    P230-->>- P1: return
    P1->>+ P231: calls
    P231-->>- P1: return
    P1->>+ P232: calls
    P232-->>- P1: return
    P1->>+ P233: calls
    P233-->>- P1: return
    P1->>+ P234: calls
    P234-->>- P1: return
    P1->>+ P235: calls
    P235-->>- P1: return
    P1->>+ P236: calls
    P236-->>- P1: return
    P1->>+ P237: calls
    P237-->>- P1: return
    P1->>+ P238: calls
    P238-->>- P1: return
    P1->>+ P239: calls
    P239-->>- P1: return
    P1->>+ P240: calls
    P240-->>- P1: return
    P1->>+ P241: calls
    P241-->>- P1: return
    P1->>+ P242: calls
    P242-->>- P1: return
    P1->>+ P243: calls
    P243-->>- P1: return
    P1->>+ P244: calls
    P244-->>- P1: return
    P1->>+ P245: calls
    P245-->>- P1: return
    P1->>+ P246: calls
    P246-->>- P1: return
    P1->>+ P247: calls
    P247-->>- P1: return
    P1->>+ P248: calls
    P248-->>- P1: return
    P1->>+ P249: calls
    P249-->>- P1: return
    P1->>+ P250: calls
    P250-->>- P1: return
    P1->>+ P251: calls
    P251-->>- P1: return
    P1->>+ P252: calls
    P252-->>- P1: return
    P1->>+ P253: calls
    P253-->>- P1: return
    P1->>+ P254: calls
    P254-->>- P1: return
    P1->>+ P255: calls
    P255-->>- P1: return
    P1->>+ P256: calls
    P256-->>- P1: return
    P1->>+ P257: calls
    P257-->>- P1: return
    P1->>+ P258: calls
    P258-->>- P1: return
    P1->>+ P259: calls
    P259-->>- P1: return
    P1->>+ P260: calls
    P260-->>- P1: return
    P1->>+ P261: calls
    P261-->>- P1: return
    P1->>+ P262: calls
    P262-->>- P1: return
    P1->>+ P263: calls
    P263-->>- P1: return
    P1->>+ P264: calls
    P264-->>- P1: return
    P1->>+ P265: calls
    P265-->>- P1: return
    P1->>+ P266: calls
    P266-->>- P1: return
    P1->>+ P267: calls
    P267-->>- P1: return
    P1->>+ P268: calls
    P268-->>- P1: return
    P1->>+ P269: calls
    P269-->>- P1: return
    P1->>+ P270: calls
    P270-->>- P1: return
    P1->>+ P271: calls
    P271-->>- P1: return
    P1->>+ P272: calls
    P272-->>- P1: return
    P1->>+ P273: calls
    P273-->>- P1: return
    P1->>+ P274: calls
    P274-->>- P1: return
    P1->>+ P275: calls
    P275-->>- P1: return
    P1->>+ P276: calls
    P276-->>- P1: return
    P1->>+ P277: calls
    P277-->>- P1: return
    P1->>+ P278: calls
    P278-->>- P1: return
    P1->>+ P279: calls
    P279-->>- P1: return
    P1->>+ P280: calls
    P280-->>- P1: return
    P1->>+ P281: calls
    P281-->>- P1: return
    P1->>+ P282: calls
    P282-->>- P1: return
    P1->>+ P283: calls
    P283-->>- P1: return
    P1->>+ P284: calls
    P284-->>- P1: return
    P1->>+ P285: calls
    P285-->>- P1: return
    P1->>+ P286: calls
    P286-->>- P1: return
    P1->>+ P287: calls
    P287-->>- P1: return
    P1->>+ P288: calls
    P288-->>- P1: return
    P1->>+ P289: calls
    P289-->>- P1: return
    P1->>+ P290: calls
    P290-->>- P1: return
    P1->>+ P291: calls
    P291-->>- P1: return
    P1->>+ P292: calls
    P292-->>- P1: return
    P1->>+ P293: calls
    P293-->>- P1: return
    P1->>+ P294: calls
    P294-->>- P1: return
    P1->>+ P295: calls
    P295-->>- P1: return
    P1->>+ P296: calls
    P296-->>- P1: return
    P1->>+ P297: calls
    P297-->>- P1: return
    P1->>+ P298: calls
    P298-->>- P1: return
    P1->>+ P299: calls
    P299-->>- P1: return
    P1->>+ P300: calls
    P300-->>- P1: return
    P1->>+ P301: calls
    P301-->>- P1: return
    P1->>+ P302: calls
    P302-->>- P1: return
    P1->>+ P303: calls
    P303-->>- P1: return
    P1->>+ P304: calls
    P304-->>- P1: return
    P1->>+ P305: calls
    P305-->>- P1: return
    P1->>+ P306: calls
    P306-->>- P1: return
    P1->>+ P307: calls
    P307-->>- P1: return
    P1->>+ P308: calls
    P308-->>- P1: return
    P1->>+ P309: calls
    P309-->>- P1: return
    P1->>+ P310: calls
    P310-->>- P1: return
    P1->>+ P311: calls
    P311-->>- P1: return
    P1->>+ P312: calls
    P312-->>- P1: return
    P1->>+ P313: calls
    P313-->>- P1: return
    P1->>+ P314: calls
    P314-->>- P1: return
    P1->>+ P315: calls
    P315-->>- P1: return
    P1->>+ P316: calls
    P316-->>- P1: return
    P1->>+ P317: calls
    P317-->>- P1: return
    P1->>+ P318: calls
    P318-->>- P1: return
    P1->>+ P319: calls
    P319-->>- P1: return
    P1->>+ P320: calls
    P320-->>- P1: return
    P1->>+ P321: calls
    P321-->>- P1: return
    P1->>+ P322: calls
    P322-->>- P1: return
    P1->>+ P323: calls
    P323-->>- P1: return
    P1->>+ P324: calls
    P324-->>- P1: return
    P1->>+ P325: calls
    P325-->>- P1: return
    P1->>+ P326: calls
    P326-->>- P1: return
    P1->>+ P327: calls
    P327-->>- P1: return
    P1->>+ P328: calls
    P328-->>- P1: return
    P1->>+ P329: calls
    P329-->>- P1: return
    P1->>+ P330: calls
    P330-->>- P1: return
    P1->>+ P331: calls
    P331-->>- P1: return
    P1->>+ P332: calls
    P332-->>- P1: return
    P1->>+ P333: calls
    P333-->>- P1: return
    P1->>+ P334: calls
    P334-->>- P1: return
    P1->>+ P335: calls
    P335-->>- P1: return
    P1->>+ P336: calls
    P336-->>- P1: return
    P1->>+ P337: calls
    P337-->>- P1: return
    P1->>+ P338: calls
    P338-->>- P1: return
    P1->>+ P339: calls
    P339-->>- P1: return
    P1->>+ P340: calls
    P340-->>- P1: return
    P1->>+ P341: calls
    P341-->>- P1: return
    P1->>+ P342: calls
    P342-->>- P1: return
    P1->>+ P343: calls
    P343-->>- P1: return
    P1->>+ P344: calls
    P344-->>- P1: return
    P1->>+ P345: calls
    P345-->>- P1: return
    P1->>+ P346: calls
    P346-->>- P1: return
    P1->>+ P347: calls
    P347-->>- P1: return
    P1->>+ P348: calls
    P348-->>- P1: return
    P1->>+ P349: calls
    P349-->>- P1: return
    P1->>+ P350: calls
    P350-->>- P1: return
    P1->>+ P351: calls
    P351-->>- P1: return
    P1->>+ P352: calls
    P352-->>- P1: return
    P1->>+ P353: calls
    P353-->>- P1: return
    P1->>+ P354: calls
    P354-->>- P1: return
    P1->>+ P355: calls
    P355-->>- P1: return
    P1->>+ P356: calls
    P356-->>- P1: return
    P1->>+ P357: calls
    P357-->>- P1: return
    P1->>+ P358: calls
    P358-->>- P1: return
    P1->>+ P359: calls
    P359-->>- P1: return
    P1->>+ P360: calls
    P360-->>- P1: return
    P1->>+ P361: calls
    P361-->>- P1: return
    P1->>+ P362: calls
    P362-->>- P1: return
    P1->>+ P363: calls
    P363-->>- P1: return
    P1->>+ P364: calls
    P364-->>- P1: return
    P1->>+ P365: calls
    P365-->>- P1: return
    P1->>+ P366: calls
    P366-->>- P1: return
    P1->>+ P367: calls
    P367-->>- P1: return
    P1->>+ P368: calls
    P368-->>- P1: return
    P1->>+ P369: calls
    P369-->>- P1: return
    P1->>+ P370: calls
    P370-->>- P1: return
    P1->>+ P371: calls
    P371-->>- P1: return
    P1->>+ P372: calls
    P372-->>- P1: return
    P1->>+ P373: calls
    P373-->>- P1: return
    P1->>+ P374: calls
    P374-->>- P1: return
    P1->>+ P375: calls
    P375-->>- P1: return
    P1->>+ P376: calls
    P376-->>- P1: return
    P1->>+ P377: calls
    P377-->>- P1: return
    P1->>+ P378: calls
    P378-->>- P1: return
    P1->>+ P379: calls
    P379-->>- P1: return
    P1->>+ P380: calls
    P380-->>- P1: return
    P1->>+ P381: calls
    P381-->>- P1: return
    P1->>+ P382: calls
    P382-->>- P1: return
    P1->>+ P383: calls
    P383-->>- P1: return
    P1->>+ P384: calls
    P384-->>- P1: return
    P1->>+ P385: calls
    P385-->>- P1: return
    P1->>+ P386: calls
    P386-->>- P1: return
    P1->>+ P387: calls
    P387-->>- P1: return
    P1->>+ P388: calls
    P388-->>- P1: return
    P1->>+ P389: calls
    P389-->>- P1: return
    P1->>+ P390: calls
    P390-->>- P1: return
    P1->>+ P391: calls
    P391-->>- P1: return
    P1->>+ P392: calls
    P392-->>- P1: return
    P1->>+ P393: calls
    P393-->>- P1: return
    P1->>+ P394: calls
    P394-->>- P1: return
    P1->>+ P395: calls
    P395-->>- P1: return
    P1->>+ P396: calls
    P396-->>- P1: return
    P1->>+ P397: calls
    P397-->>- P1: return
    P1->>+ P398: calls
    P398-->>- P1: return
    P1->>+ P399: calls
    P399-->>- P1: return
    P1->>+ P400: calls
    P400-->>- P1: return
    P1->>+ P401: calls
    P401-->>- P1: return
    P1->>+ P402: calls
    P402-->>- P1: return
    P1->>+ P403: calls
    P403-->>- P1: return
    P1->>+ P404: calls
    P404-->>- P1: return
    P1->>+ P405: calls
    P405-->>- P1: return
    P1->>+ P406: calls
    P406-->>- P1: return
    P1->>+ P407: calls
    P407-->>- P1: return
    P1->>+ P408: calls
    P408-->>- P1: return
    P1->>+ P409: calls
    P409-->>- P1: return
    P1->>+ P410: calls
    P410-->>- P1: return
    P1->>+ P411: calls
    P411-->>- P1: return
    P1->>+ P412: calls
    P412-->>- P1: return
    P1->>+ P413: calls
    P413-->>- P1: return
    P1->>+ P414: calls
    P414-->>- P1: return
    P1->>+ P415: calls
    P415-->>- P1: return
    P1->>+ P416: calls
    P416-->>- P1: return
    P1->>+ P417: calls
    P417-->>- P1: return
    P1->>+ P418: calls
    P418-->>- P1: return
    P1->>+ P419: calls
    P419-->>- P1: return
    P1->>+ P420: calls
    P420-->>- P1: return
    P1->>+ P421: calls
    P421-->>- P1: return
    P1->>+ P422: calls
    P422-->>- P1: return
    P1->>+ P423: calls
    P423-->>- P1: return
    P1->>+ P424: calls
    P424-->>- P1: return
    P1->>+ P425: calls
    P425-->>- P1: return
    P1->>+ P426: calls
    P426-->>- P1: return
    P1->>+ P427: calls
    P427-->>- P1: return
    P1->>+ P428: calls
    P428-->>- P1: return
    P1->>+ P429: calls
    P429-->>- P1: return
    P1->>+ P430: calls
    P430-->>- P1: return
    P1->>+ P431: calls
    P431-->>- P1: return
    P1->>+ P432: calls
    P432-->>- P1: return
    P1->>+ P433: calls
    P433-->>- P1: return
    P1->>+ P434: calls
    P434-->>- P1: return
    P1->>+ P435: calls
    P435-->>- P1: return
    P1->>+ P436: calls
    P436-->>- P1: return
    P1->>+ P437: calls
    P437-->>- P1: return
    P1->>+ P438: calls
    P438-->>- P1: return
    P1->>+ P439: calls
    P439-->>- P1: return
    P1->>+ P440: calls
    P440-->>- P1: return
    P1->>+ P441: calls
    P441-->>- P1: return
    P1->>+ P442: calls
    P442-->>- P1: return
    P1->>+ P443: calls
    P443-->>- P1: return
    P1->>+ P444: calls
    P444-->>- P1: return
    P1->>+ P445: calls
    P445-->>- P1: return
    P1->>+ P446: calls
    P446-->>- P1: return
    P1->>+ P447: calls
    P447-->>- P1: return
    P1->>+ P448: calls
    P448-->>- P1: return
    P1->>+ P449: calls
    P449-->>- P1: return
    P1->>+ P450: calls
    P450-->>- P1: return
    P1->>+ P451: calls
    P451-->>- P1: return
    P1->>+ P452: calls
    P452-->>- P1: return
    P1->>+ P453: calls
    P453-->>- P1: return
    P1->>+ P454: calls
    P454-->>- P1: return
    P1->>+ P455: calls
    P455-->>- P1: return
    P1->>+ P456: calls
    P456-->>- P1: return
    P1->>+ P457: calls
    P457-->>- P1: return
    P1->>+ P458: calls
    P458-->>- P1: return
    P1->>+ P459: calls
    P459-->>- P1: return
    P1->>+ P460: calls
    P460-->>- P1: return
    P1->>+ P461: calls
    P461-->>- P1: return
    P1->>+ P462: calls
    P462-->>- P1: return
    P1->>+ P463: calls
    P463-->>- P1: return
    P1->>+ P464: calls
    P464-->>- P1: return
    P1->>+ P465: calls
    P465-->>- P1: return
    P1->>+ P466: calls
    P466-->>- P1: return
    P1->>+ P467: calls
    P467-->>- P1: return
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
    P1->>+ P477: calls
    P477-->>- P1: return
    P1->>+ P478: calls
    P478-->>- P1: return
    P1->>+ P479: calls
    P479-->>- P1: return
    P1->>+ P480: calls
    P480-->>- P1: return
    P1->>+ P481: calls
    P481-->>- P1: return
    P1->>+ P482: calls
    P482-->>- P1: return
    P1->>+ P483: calls
    P483-->>- P1: return
    P1->>+ P484: calls
    P484-->>- P1: return
    P1->>+ P485: calls
    P485-->>- P1: return
    P1->>+ P486: calls
    P486-->>- P1: return
    P1->>+ P487: calls
    P487-->>- P1: return
    P1->>+ P488: calls
    P488-->>- P1: return
    P1->>+ P489: calls
    P489-->>- P1: return
    P1->>+ P490: calls
    P490-->>- P1: return
    P1->>+ P491: calls
    P491-->>- P1: return
    P1->>+ P492: calls
    P492-->>- P1: return
    P1->>+ P493: calls
    P493-->>- P1: return
    P1->>+ P494: calls
    P494-->>- P1: return
    P1->>+ P495: calls
    P495-->>- P1: return
    P1->>+ P496: calls
    P496-->>- P1: return
    P1->>+ P497: calls
    P497-->>- P1: return
    P1->>+ P498: calls
    P498-->>- P1: return
    P1->>+ P499: calls
    P499-->>- P1: return
    P1->>+ P500: calls
    P500-->>- P1: return
    P1->>+ P501: calls
    P501-->>- P1: return
    P1->>+ P502: calls
    P502-->>- P1: return
    P1->>+ P503: calls
    P503-->>- P1: return
    P1->>+ P504: calls
    P504-->>- P1: return
    P0->>+ P505: calls
    P505-->>- P0: return
    P0->>+ P28: calls
    P28-->>- P0: return
    P0->>+ P29: calls
    P29-->>- P0: return
    P0->>+ P31: calls
    P31-->>- P0: return
    P0->>+ P32: calls
    P32-->>- P0: return
    P0->>+ P11: calls
    P11-->>- P0: return
    P0->>+ P506: calls
    P506-->>- P0: return
    P0->>+ P12: calls
    P12-->>- P0: return
    P0->>+ P507: calls
    P507-->>- P0: return
    P0->>+ P39: calls
    P39-->>- P0: return
    P0->>+ P508: calls
    P508-->>- P0: return
    P0->>+ P46: calls
    P46-->>- P0: return
    P0->>+ P509: calls
    P509-->>- P0: return
    P0->>+ P49: calls
    P49-->>- P0: return
    P0->>+ P51: calls
    P51-->>- P0: return
    P0->>+ P510: calls
    P510-->>- P0: return
    P0->>+ P55: calls
    P55-->>- P0: return
    P0->>+ P60: calls
    P60-->>- P0: return
    P0->>+ P511: calls
    P511-->>- P0: return
    P0->>+ P512: calls
    P512-->>- P0: return
    P0->>+ P69: calls
    P69-->>- P0: return
    P0->>+ P72: calls
    P72-->>- P0: return
    P0->>+ P73: calls
    P73-->>- P0: return
    P0->>+ P75: calls
    P75-->>- P0: return
    P0->>+ P76: calls
    P76-->>- P0: return
    P0->>+ P80: calls
    P80-->>- P0: return
    P0->>+ P81: calls
    P81-->>- P0: return
    P0->>+ P84: calls
    P84-->>- P0: return
    P0->>+ P85: calls
    P85-->>- P0: return
    P0->>+ P513: calls
    P513-->>- P0: return
    P0->>+ P86: calls
    P86-->>- P0: return
    P0->>+ P90: calls
    P90-->>- P0: return
    P0->>+ P99: calls
    P99-->>- P0: return
    P0->>+ P100: calls
    P100-->>- P0: return
    P0->>+ P101: calls
    P101-->>- P0: return
    P0->>+ P514: calls
    P514-->>- P0: return
    P0->>+ P515: calls
    P515-->>- P0: return
    P0->>+ P516: calls
    P516-->>- P0: return
    P0->>+ P517: calls
    P517-->>- P0: return
    P0->>+ P103: calls
    P103-->>- P0: return
    P0->>+ P104: calls
    P104-->>- P0: return
    P0->>+ P106: calls
    P106-->>- P0: return
    P0->>+ P107: calls
    P107-->>- P0: return
    P0->>+ P518: calls
    P518-->>- P0: return
    P0->>+ P519: calls
    P519-->>- P0: return
    P0->>+ P116: calls
    P116-->>- P0: return
    P0->>+ P119: calls
    P119-->>- P0: return
    P0->>+ P122: calls
    P122-->>- P0: return
    P0->>+ P133: calls
    P133-->>- P0: return
    P0->>+ P134: calls
    P134-->>- P0: return
    P0->>+ P520: calls
    P520-->>- P0: return
    P0->>+ P136: calls
    P136-->>- P0: return
    P0->>+ P137: calls
    P137-->>- P0: return
    P0->>+ P138: calls
    P138-->>- P0: return
    P0->>+ P139: calls
    P139-->>- P0: return
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
    P0->>+ P529: calls
    P529-->>- P0: return
    P0->>+ P170: calls
    P170-->>- P0: return
    P0->>+ P530: calls
    P530-->>- P0: return
    P0->>+ P173: calls
    P173-->>- P0: return
    P0->>+ P174: calls
    P174-->>- P0: return
    P0->>+ P175: calls
    P175-->>- P0: return
    P0->>+ P176: calls
    P176-->>- P0: return
    P0->>+ P177: calls
    P177-->>- P0: return
    P0->>+ P178: calls
    P178-->>- P0: return
    P0->>+ P531: calls
    P531-->>- P0: return
    P0->>+ P532: calls
    P532-->>- P0: return
    P0->>+ P533: calls
    P533-->>- P0: return
    P0->>+ P534: calls
    P534-->>- P0: return
    P0->>+ P535: calls
    P535-->>- P0: return
    P0->>+ P536: calls
    P536-->>- P0: return
    P0->>+ P210: calls
    P210-->>- P0: return
    P0->>+ P211: calls
    P211-->>- P0: return
    P0->>+ P212: calls
    P212-->>- P0: return
    P0->>+ P218: calls
    P218-->>- P0: return
    P0->>+ P537: calls
    P537-->>- P0: return
    P0->>+ P538: calls
    P538-->>- P0: return
    P0->>+ P225: calls
    P225-->>- P0: return
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
    P0->>+ P549: calls
    P549-->>- P0: return
    P0->>+ P267: calls
    P267-->>- P0: return
    P0->>+ P268: calls
    P268-->>- P0: return
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
    P0->>+ P283: calls
    P283-->>- P0: return
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
```

## Connections by Relation

### calls
- [[{ error }]] `INFERRED`
- [[json()]] `INFERRED`
- [[uploadAndShowActions()]] `INFERRED`
- [[handleAudioActionCallback()]] `INFERRED`
- [[handleClassificationCallback()]] `INFERRED`
- [[processVoiceMessage()]] `INFERRED`
- [[handleProjects()]] `INFERRED`
- [[handleNavigationCallbacks()]] `INFERRED`
- [[handleLibrary()]] `INFERRED`
- [[handleProjectsCallback()]] `INFERRED`
- [[initiateTariffPurchase()]] `INFERRED`
- [[text]] `INFERRED`
- [[handleStatus()]] `INFERRED`
- [[handleProjectsCarousel()]] `INFERRED`
- [[handleCheckTask()]] `INFERRED`
- [[startMidiConversion()]] `INFERRED`
- [[handleProjectDetails()]] `INFERRED`
- [[handleVoiceForGeneration()]] `INFERRED`
- [[handleGenerateFromReference()]] `INFERRED`
- [[showCloudFiles()]] `INFERRED`

### contains
- [[telegram-api.ts]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*