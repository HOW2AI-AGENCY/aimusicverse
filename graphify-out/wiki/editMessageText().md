# editMessageText()

> God node · 130 connections · [D:\.MUSICVERSE\aimusicverse\supabase\functions\telegram-bot\telegram-api.ts](file:///D:/.MUSICVERSE/aimusicverse/supabase/functions/telegram-bot/telegram-api.ts#L467)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as editMessageText()
    participant P1 as error
    participant P2 as handleDeepLink()
    participant P3 as info
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
    participant P14 as handleTrackDeepLink()
    participant P15 as handleProjectDeepLink()
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
    participant P28 as handleDashboard()
    participant P29 as uploadAndShowActions()
    participant P30 as handleAudioActionCallback()
    participant P31 as processVoiceMessage()
    participant P32 as handleClassificationCallback()
    participant P33 as handleAudioMessage()
    participant P34 as deleteMessage()
    participant P35 as handleCallbackQuery()
    participant P36 as setActiveMenuMessageId()
    participant P37 as deleteAndSendNewMenuPhoto()
    participant P38 as initiateTariffPurchase()
    participant P39 as handleUpdate()
    participant P40 as handleAutoUploadWithPipeline()
    participant P41 as editMessageMedia()
    participant P42 as sendNotification()
    participant P43 as .setActive()
    participant P44 as handleGenerate()
    participant P45 as handleGuitarAudio()
    participant P46 as handleInlineQuery()
    participant P47 as handleMidiCommand()
    participant P48 as startMidiConversion()
    participant P49 as handleStatus()
    participant P50 as processMediaGroupAction()
    participant P51 as sendTelegramAudio()
    participant P52 as handleCheckTask()
    participant P53 as getCachedAudio()
    participant P54 as createNotification()
    participant P55 as sendAudio()
    participant P56 as handleDynamicMenuCallback()
    participant P57 as handleGenerateFromReference()
    participant P58 as handleCloudCallback()
    participant P59 as handlePlayTrack()
    participant P60 as handleVoiceForGeneration()
    participant P61 as handleGenerationWizardCallback()
    participant P62 as analyzeAudio()
    participant P63 as editMessageCaption()
    participant P64 as handleInlineQuery()
    participant P65 as .saveState()
    participant P66 as handleAudioActionCallback()
    participant P67 as handleCloudUploadWithAnalysis()
    participant P68 as showTierInfo()
    participant P69 as createProject()
    participant P70 as togglePlay()
    participant P71 as cacheAudio()
    participant P72 as resumeAudioContext()
    participant P73 as reportError()
    participant P74 as .getState()
    participant P75 as sendDocument()
    participant P76 as handleAnalyzeCommand()
    participant P77 as handleChordAnalysis()
    participant P78 as handlePianoCommand()
    participant P79 as handleSendTrackToChat()
    participant P80 as handleMyUploads()
    participant P81 as .cleanup()
    participant P82 as handleCoverAction()
    participant P83 as handleExtendAction()
    participant P84 as processAudioUpload()
    participant P85 as handleUploadCallback()
    participant P86 as .deleteTrackedMessage()
    participant P87 as sendLikeDigest()
    participant P88 as sendCommentDigest()
    participant P89 as handleRewardShare()
    participant P90 as getOrCreateAudioNodes()
    participant P91 as .analyze()
    participant P92 as sendTelegramVideo()
    participant P93 as sendTelegramDocument()
    participant P94 as handleTranscription()
    participant P95 as handleBeatAnalysis()
    participant P96 as handleFullAnalysis()
    participant P97 as handleGuitarCommand()
    participant P98 as handleLyrics()
    participant P99 as handleRecognizeAudio()
    participant P100 as handleStudio()
    participant P101 as deleteActiveMenu()
    participant P102 as .showMenu()
    participant P103 as .startWizard()
    participant P104 as .handleCallback()
    participant P105 as handleStemsAction()
    participant P106 as handleMidiAction()
    participant P107 as showAudioClassificationPromptInternal()
    participant P108 as handleFeedbackCallback()
    participant P109 as handleChosenInlineResult()
    participant P110 as handleTariffCallback()
    participant P111 as handleVoiceProcessorCallback()
    participant P112 as startGenerationFromVoice()
    participant P113 as sendAutoDeleteMessage()
    participant P114 as sendFollowerDigest()
    participant P115 as startGeneration()
    participant P116 as handleSave()
    participant P117 as .acquire()
    participant P118 as cleanPlaybackPositions()
    participant P119 as .generateFallback()
    participant P120 as createTinkoffPayment()
    participant P121 as shareTrackURL()
    participant P122 as sharePlaylistURL()
    participant P123 as checkAndUnlockAchievements()
    participant P124 as sendTelegramMessage()
    participant P125 as handleMediaGroupCallbacks()
    participant P126 as handleAnalyzeSelect()
    participant P127 as handleAnalyzeList()
    participant P128 as handleAddToPlaylist()
    participant P129 as handleRecognizeCommand()
    participant P130 as handleTrackStats()
    participant P131 as handleCheckStemsStatus()
    participant P132 as handleSelectReference()
    participant P133 as handleUseReference()
    participant P134 as .cancelWizard()
    participant P135 as .getTrackById()
    participant P136 as processFeedbackMessage()
    participant P137 as sendFeedbackReply()
    participant P138 as handleDownloadTrack()
    participant P139 as handleBuyCommand()
    participant P140 as handleBuyProduct()
    participant P141 as handleEnhancedQuickActionCallback()
    participant P142 as startQuickGeneration()
    participant P143 as loadTiers()
    participant P144 as handleTracksCallback()
    participant P145 as generateThumbnails()
    participant P146 as handleApplyCrop()
    participant P147 as handleStemAction()
    participant P148 as ensureAudioRoutedToDestination()
    participant P149 as cleanStemAudioReference()
    participant P150 as cleanupStaleData()
    participant P151 as showGenerationError()
    participant P152 as .saveState()
    participant P153 as detectBPM()
    participant P154 as .sendImmediate()
    participant P155 as .getActive()
    participant P156 as shareTrackToStory()
    participant P157 as sharePlaylistToStory()
    participant P158 as pollForResult()
    participant P159 as handlePreCheckoutQuery()
    participant P160 as handleSuccessfulPayment()
    participant P161 as recognizeFromUrl()
    participant P162 as handleRemix()
    participant P163 as handleAddVocals()
    participant P164 as handleAddInstrumental()
    participant P165 as handleTrackDetails()
    participant P166 as handleStemSeparation()
    participant P167 as handleDownloadStems()
    participant P168 as handleShowLyrics()
    participant P169 as getPendingUpload()
    participant P170 as consumePendingAudio()
    participant P171 as .navigateBack()
    participant P172 as .saveState()
    participant P173 as .handleInput()
    participant P174 as .confirmWizard()
    participant P175 as .getUserProjects()
    participant P176 as getFileUrl()
    participant P177 as getFileUrl()
    participant P178 as loadMenuItems()
    participant P179 as getUserRecentStyles()
    participant P180 as loadCustomImages()
    participant P181 as storeFailedNotification()
    participant P182 as runAccessibilityAudit()
    participant P183 as analyzeBundleSizes()
    participant P184 as handleSubmit()
    participant P185 as playNote()
    participant P186 as handleTranscribe()
    participant P187 as fetchRUMMetricsSummary()
    participant P188 as loadPositions()
    participant P189 as registerAudioServiceWorker()
    participant P190 as cleanLyricsWizardState()
    participant P191 as fetchFeedback()
    participant P192 as cancelTinkoffSubscription()
    participant P193 as .persistToDatabase()
    participant P194 as processQueue()
    participant P195 as sendTelegramProgress()
    participant P196 as verifyAdminAccess()
    participant P197 as getPublicTracksForGuests()
    participant P198 as handlePlaylistAdd()
    participant P199 as handleShareTrack()
    participant P200 as handleSeparateStems()
    participant P201 as handleDownloadStems()
    participant P202 as handleDeleteReference()
    participant P203 as deleteAndSendNewMenu()
    participant P204 as setPendingAudio()
    participant P205 as updatePendingAudioAnalysis()
    participant P206 as setWizardState()
    participant P207 as .updateMenu()
    participant P208 as .getUserByTelegramId()
    participant P209 as .getUserTracks()
    participant P210 as updatePendingClassification()
    participant P211 as handleLikeTrack()
    participant P212 as showEnhancedQuickActions()
    participant P213 as handleUploadCancel()
    participant P214 as checkUserQuota()
    participant P215 as startGenerationWizard()
    participant P216 as validateFeatureAccess()
    participant P217 as handleSubmit()
    participant P218 as componentDidCatch()
    participant P219 as handleImageUpload()
    participant P220 as handleFileUpload()
    participant P221 as handleRecordingComplete()
    participant P222 as handleFileSelect()
    participant P223 as uploadAndGetUrl()
    participant P224 as analyzeAudio()
    participant P225 as generateSection()
    participant P226 as generateAllSections()
    participant P227 as handleDelete()
    participant P228 as handleTranscribe()
    participant P229 as handleVersionSelect()
    participant P230 as startRecording()
    participant P231 as uploadAndAnalyze()
    participant P232 as handleSaveAsPlaylist()
    participant P233 as handleActivateTrial()
    participant P234 as handleFileUpload()
    participant P235 as handleFileSelect()
    participant P236 as handleRemoveAvatar()
    participant P237 as handleUseAsReference()
    participant P238 as handleCreateReference()
    participant P239 as handleUpload()
    participant P240 as handleVersionSelect()
    participant P241 as handleCopy()
    participant P242 as prefetchAudio()
    participant P243 as cleanupExpiredEntries()
    participant P244 as attemptAudioRecovery()
    participant P245 as displayError()
    participant P246 as exportAnalytics()
    participant P247 as detectBPMFromUrl()
    participant P248 as loadProjectData()
    participant P249 as checkAdminStatus()
    participant P250 as handleReply()
    participant P251 as handleClose()
    participant P252 as addSectionNote()
    participant P253 as batchGetLyricsHistory()
    participant P254 as .clearActive()
    participant P255 as sendAlertToAdmins()
    participant P256 as downloadAndUploadStem()
    participant P257 as handleSetEmojiStatus()
    participant P258 as handleRemoveEmojiStatus()
    participant P259 as clearActiveMenu()
    participant P260 as getBotCommands()
    participant P261 as updateBotCommands()
    participant P262 as setPendingUpload()
    participant P263 as consumePendingUpload()
    participant P264 as getPendingAudioWithoutConsuming()
    participant P265 as updatePendingUpload()
    participant P266 as .sendMenu()
    participant P267 as setPendingClassification()
    participant P268 as getPendingClassification()
    participant P269 as consumePendingClassification()
    participant P270 as getFileUrl()
    participant P271 as loadTariffTiers()
    participant P272 as startInlineGeneration()
    participant P273 as handleBuyCreditPackages()
    participant P274 as handleBuySubscriptions()
    participant P275 as handleVoiceGenerationCallback()
    participant P276 as flushMetrics()
    participant P277 as deductCredits()
    participant P278 as checkRateLimitDb()
    participant P279 as scheduleRetry()
    participant P280 as logApiCall()
    participant P281 as getSubscriptionStatus()
    participant P282 as getDerivedStateFromError()
    participant P283 as handleFileUpload()
    participant P284 as handleDelete()
    participant P285 as handleSubmit()
    participant P286 as handleImageUpload()
    participant P287 as handleNewArrangement()
    participant P288 as handleNewVocal()
    participant P289 as extractLyrics()
    participant P290 as loadData()
    participant P291 as handleAddNewPrompt()
    participant P292 as handleRetry()
    participant P293 as handleDownload()
    participant P294 as handleDownload()
    participant P295 as fetchAudioList()
    participant P296 as handleQuickGenerate()
    participant P297 as checkProfileSetup()
    participant P298 as runAnalysis()
    participant P299 as handleRemoveCover()
    participant P300 as handleGenerate()
    participant P301 as handleApply()
    participant P302 as handleCopy()
    participant P303 as handleDownload()
    participant P304 as handleAddToProject()
    participant P305 as handleAddToPlaylist()
    participant P306 as handleShareToStory()
    participant P307 as incrementSuggestionUsage()
    participant P308 as saveGuitarAnalysisForTrack()
    participant P309 as activateTrial()
    participant P310 as logError()
    participant P311 as generateWaveformFromUrl()
    participant P312 as generateWaveformFromBuffer()
    participant P313 as fetchDeeplinkAnalyticsSummary()
    participant P314 as .initializeAudioContext()
    participant P315 as saveLyricsWithVersioning()
    participant P316 as getLyricsHistory()
    participant P317 as getSectionNotesEnriched()
    participant P318 as fetchReplacedSections()
    participant P319 as getPaymentTransaction()
    participant P320 as getUserPaymentTransactions()
    participant P321 as getActiveSubscription()
    participant P322 as hashContentFromUrl()
    participant P323 as editTelegramMessage()
    participant P324 as fetchWithRetry()
    participant P325 as loadConfigFromDatabase()
    participant P326 as executeSearch()
    participant P327 as answerInlineQuery()
    participant P328 as getActiveMenuMessageId()
    participant P329 as saveBotCommands()
    participant P330 as cancelPendingUpload()
    participant P331 as setConversationContext()
    participant P332 as getWizardState()
    participant P333 as .getActiveTasks()
    participant P334 as editInlineMessage()
    participant P335 as storeMediaGroupSession()
    participant P336 as saveRecentStyle()
    participant P337 as storeVoiceTranscription()
    participant P338 as createMainMenuKeyboardAsync()
    participant P339 as markNotificationSuccess()
    participant P340 as markNotificationFailed()
    participant P341 as handleWizardTextInput()
    participant P342 as validateRequest()
    participant P343 as checkLinks()
    participant P344 as migrateFile()
    participant P345 as getMidiMetadata()
    participant P346 as downloadMidiFile()
    participant P347 as handleFileUpload()
    participant P348 as setupWebhook()
    participant P349 as handleSubmit()
    participant P350 as handleForceAlert()
    participant P351 as handleSaveLyrics()
    participant P352 as handleAnalyze()
    participant P353 as handleExtractLyrics()
    participant P354 as handleSeparateStems()
    participant P355 as handlePlay()
    participant P356 as handleDelete()
    participant P357 as startRecording()
    participant P358 as startRecording()
    participant P359 as handleFileUpload()
    participant P360 as startRecording()
    participant P361 as generateSuggestions()
    participant P362 as handleDownload()
    participant P363 as handleStartRecording()
    participant P364 as startTuner()
    participant P365 as handleLink()
    participant P366 as handleDownload()
    participant P367 as fetchVersions()
    participant P368 as handleCopy()
    participant P369 as handleCancelSubscription()
    participant P370 as handleShareToStory()
    participant P371 as handleSubscribe()
    participant P372 as handleStartTrial()
    participant P373 as handleSubscribe()
    participant P374 as handleApplyOption()
    participant P375 as handleTranslate()
    participant P376 as handleApplyUpdates()
    participant P377 as handleGenerate()
    participant P378 as handleDownload()
    participant P379 as handleDownload()
    participant P380 as handleSendToTelegram()
    participant P381 as init()
    participant P382 as handleImport()
    participant P383 as handleCopyLink()
    participant P384 as handleScan()
    participant P385 as handleSubmit()
    participant P386 as handleCopy()
    participant P387 as handleCopy()
    participant P388 as fetchVersions()
    participant P389 as handleSendToTelegram()
    participant P390 as handleDownload()
    participant P391 as handleClick()
    participant P392 as getStoredPresets()
    participant P393 as savePositions()
    participant P394 as clearAudioCache()
    participant P395 as precacheAudioUrls()
    participant P396 as clearAudioCacheViaSW()
    participant P397 as cleanAudioCache()
    participant P398 as deleteFile()
    participant P399 as mapSunoError()
    participant P400 as handleSaveRecording()
    participant P401 as handlePurchase()
    participant P402 as handleSeparateStems()
    participant P403 as handleCreate()
    participant P404 as restoreLyricsVersion()
    participant P405 as editSectionNote()
    participant P406 as batchAddSectionNotes()
    participant P407 as getAllProducts()
    participant P408 as getProduct()
    participant P409 as getCreditPackages()
    participant P410 as getSubscriptions()
    participant P411 as createPayment()
    participant P412 as separateStems()
    participant P413 as getUserTinkoffSubscriptions()
    participant P414 as authenticateWithTelegram()
    participant P415 as saveFailedNotification()
    participant P416 as switchInlineQuery()
    participant P417 as createHealthAlert()
    participant P418 as checkRateLimit()
    participant P419 as validateWebhookSignature()
    participant P420 as fetchStatusWithRetry()
    participant P421 as answerPreCheckoutQuery()
    participant P422 as logInlineSearch()
    participant P423 as sendNotification()
    participant P424 as getMenuState()
    participant P425 as clearWizardState()
    participant P426 as cleanupSessions()
    participant P427 as .getCurrentContext()
    participant P428 as .getBreadcrumb()
    participant P429 as .getProjectById()
    participant P430 as .incrementPlayCount()
    participant P431 as storeTemporaryAudio()
    participant P432 as logChosenResult()
    participant P433 as handleTrackChosen()
    participant P434 as getFileInfo()
    participant P435 as getFileUrl()
    participant P436 as getFileUrl()
    participant P437 as .processQueue()
    participant P438 as getBundleFiles()
    participant P439 as getMidiPublicUrl()
    participant P440 as handleGeneratePortrait()
    participant P441 as handleSubmit()
    participant P442 as handleGenerateCover()
    participant P443 as handleCreateNewArtist()
    participant P444 as handleManualCreate()
    participant P445 as handleSubmit()
    participant P446 as handleSubmit()
    participant P447 as handleRemixClick()
    participant P448 as handleResolve()
    participant P449 as sendTestAlert()
    participant P450 as handleSendTestAlert()
    participant P451 as handleTestWebhook()
    participant P452 as updateBotCommands()
    participant P453 as handleGeneratePortrait()
    participant P454 as handleFileInputChange()
    participant P455 as handleSubmit()
    participant P456 as handleSave()
    participant P457 as initWavesurfer()
    participant P458 as handleSubmit()
    participant P459 as handleTranscribe()
    participant P460 as handleCopyProgression()
    participant P461 as handleGenerate()
    participant P462 as handleImprove()
    participant P463 as handleAddTags()
    participant P464 as handleDelete()
    participant P465 as handleFileUpload()
    participant P466 as initWavesurfer()
    participant P467 as handleFileUpload()
    participant P468 as handleStartRecording()
    participant P469 as optimizeForSuno()
    participant P470 as generateCustomStructure()
    participant P471 as suggestRhymes()
    participant P472 as handleSubmit()
    participant P473 as handleReanalyze()
    participant P474 as handleCopy()
    participant P475 as handleCopy()
    participant P476 as handleVersionSwitch()
    participant P477 as componentDidCatch()
    participant P478 as handleGenerateCover()
    participant P479 as handleCopy()
    participant P480 as handleGenerate()
    participant P481 as handleDownload()
    participant P482 as handleGenerateCover()
    participant P483 as handleCreateProject()
    participant P484 as handleShare()
    participant P485 as handleGenerateArrangement()
    participant P486 as handleSubmit()
    participant P487 as handleSubmit()
    participant P488 as init()
    participant P489 as fetchBlob()
    participant P490 as handleSubmit()
    participant P491 as handleAnalyze()
    participant P492 as handleOptimize()
    participant P493 as handleSave()
    participant P494 as handleShare()
    participant P495 as handleCopyLink()
    participant P496 as handleAddMainShortcut()
    participant P497 as handleGenerate()
    participant P498 as handleRemixClick()
    participant P499 as handleFullscreen()
    participant P500 as handleOpenInStudio()
    participant P501 as componentDidCatch()
    participant P502 as handleCopy()
    participant P503 as handleSave()
    participant P504 as savePresets()
    participant P505 as uploadFile()
    participant P506 as getOwnTelegramIds()
    participant P507 as handleBatchAction()
    participant P508 as compareLyricVersions()
    participant P509 as deleteSectionNote()
    participant P510 as deleteNotification()
    participant P511 as cleanupExpiredNotifications()
    participant P512 as replaceSection()
    participant P513 as switchToVersion()
    participant P514 as .saveToDeadLetterQueue()
    participant P515 as setSession()
    participant P516 as handleInternalAction()
    participant P517 as storeNotification()
    participant P518 as checkAlerts()
    participant P519 as getPendingRetries()
    participant P520 as uploadMidiFile()
    participant P521 as deleteMidiFile()
    participant P522 as listMidiFilesForTrack()
    participant P523 as handleFileSelect()
    participant P524 as handleFileSelect()
    participant P525 as componentDidCatch()
    participant P526 as handleSubmit()
    participant P527 as handleBroadcast()
    participant P528 as handleCredit()
    participant P529 as handleCostChange()
    participant P530 as handleFeatureToggle()
    participant P531 as handleSaveRecording()
    participant P532 as generateThemeIdea()
    participant P533 as suggestNextLine()
    participant P534 as .componentDidCatch()
    participant P535 as handleFileUpload()
    participant P536 as handleRecognizeLyrics()
    participant P537 as handleGetOptions()
    participant P538 as handleFileSelect()
    participant P539 as handleAddTrack()
    participant P540 as componentDidCatch()
    participant P541 as handleSaveAsTrack()
    participant P542 as componentDidCatch()
    participant P543 as handleGenerate()
    participant P544 as handleStemSeparation()
    participant P545 as handleAction()
    participant P546 as deleteNotificationsByGroup()
    participant P547 as json
    participant P548 as handleNavigationCallbacks()
    participant P549 as handleProjectsCallback()
    participant P550 as text
    participant P551 as handleProjectsCarousel()
    participant P552 as handleProjectDetails()
    participant P553 as handleWizardCallback()
    participant P554 as showCloudFiles()
    participant P555 as handleCoverCommand()
    participant P556 as handleExtendCommand()
    participant P557 as handleTerms()
    participant P558 as handlePrivacy()
    participant P559 as handleUploadCommand()
    participant P560 as handleArtistDetails()
    participant P561 as showCloudTracks()
    participant P562 as handleAbout()
    participant P563 as showClassificationPrompt()
    participant P564 as showFileDetails()
    participant P565 as handleProjectShare()
    participant P566 as handleProjectStats()
    participant P567 as handleMidiTrackCallback()
    participant P568 as handleArtistsCallback()
    participant P569 as handleArtistEdit()
    participant P570 as handleArtistTracks()
    participant P571 as showStemFiles()
    participant P572 as showMidiFiles()
    participant P573 as showMyRequests()
    participant P574 as handleProjectEdit()
    participant P575 as handleProjectTracks()
    participant P576 as showTracksList()
    participant P577 as startProjectWizard()
    participant P578 as handleArtistDeleteConfirm()
    participant P579 as showStorageInfo()
    participant P580 as handleProjectDeleteConfirm()
    participant P581 as showTariffsMenu()
    participant P582 as showEnterpriseContact()
    participant P583 as showMoodStep()
    participant P584 as showTypeSelection()
    participant P585 as showGenreSelection()
    participant P586 as showMoodSelection()
    participant P587 as handleCancelMidi()
    participant P588 as handleNews()
    participant P589 as handleRating()
    participant P590 as showCustomPromptInput()
    participant P591 as handleVoiceToTrack()
    participant P592 as showSubgenreStep()
    participant P593 as showConfirmStep()
    participant P594 as cancelWizard()
    participant P595 as handleCancelUploadCallback()
    participant P596 as processGenerationWithReference()
    participant P597 as processAddVocalsInstrumental()
    participant P598 as handleCancelGuitar()
    participant P599 as handleMidiUploadCallback()
    participant P600 as handleCancelRecognize()
    participant P601 as handleCopyTrackLink()
    participant P602 as handleTemplateSelection()
    participant P603 as handleVoiceToArrangement()
    participant P604 as handleVoiceToCover()
    participant P605 as handleVoiceToStems()
    participant P606 as showStyleStep()
    participant P607 as showDetailsStep()
    participant P608 as showDescriptionInput()
    participant P609 as showConfirmation()
    participant P610 as handleTranscribeMenu()
    participant P611 as handlePlaylistNew()
    participant P612 as handleSettings()
    participant P613 as handleNotificationSettings()
    participant P614 as handleEmojiStatusSettings()
    participant P615 as showGenderPrompt()
    participant P616 as promptFeedback()
    participant P617 as showEnergyStep()
    participant P618 as showRatingOptions()
    participant P619 as showGenreFilter()
    participant P620 as promptTrackSearch()
    participant P621 as showUploadProgress()
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
    P1->>+ P34: calls
    P34-->>- P1: return
    P1->>+ P35: calls
    P35-->>- P1: return
    P1->>+ P11: calls
    P11-->>- P1: return
    P1->>+ P36: calls
    P36-->>- P1: return
    P1->>+ P37: calls
    P37-->>- P1: return
    P1->>+ P38: calls
    P38-->>- P1: return
    P1->>+ P39: calls
    P39-->>- P1: return
    P1->>+ P12: calls
    P12-->>- P1: return
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
    P1->>+ P13: calls
    P13-->>- P1: return
    P1->>+ P53: calls
    P53-->>- P1: return
    P1->>+ P54: calls
    P54-->>- P1: return
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
    P1->>+ P505: calls
    P505-->>- P1: return
    P1->>+ P506: calls
    P506-->>- P1: return
    P1->>+ P507: calls
    P507-->>- P1: return
    P1->>+ P508: calls
    P508-->>- P1: return
    P1->>+ P509: calls
    P509-->>- P1: return
    P1->>+ P510: calls
    P510-->>- P1: return
    P1->>+ P511: calls
    P511-->>- P1: return
    P1->>+ P512: calls
    P512-->>- P1: return
    P1->>+ P513: calls
    P513-->>- P1: return
    P1->>+ P514: calls
    P514-->>- P1: return
    P1->>+ P515: calls
    P515-->>- P1: return
    P1->>+ P516: calls
    P516-->>- P1: return
    P1->>+ P517: calls
    P517-->>- P1: return
    P1->>+ P518: calls
    P518-->>- P1: return
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
    P1->>+ P526: calls
    P526-->>- P1: return
    P1->>+ P527: calls
    P527-->>- P1: return
    P1->>+ P528: calls
    P528-->>- P1: return
    P1->>+ P529: calls
    P529-->>- P1: return
    P1->>+ P530: calls
    P530-->>- P1: return
    P1->>+ P531: calls
    P531-->>- P1: return
    P1->>+ P532: calls
    P532-->>- P1: return
    P1->>+ P533: calls
    P533-->>- P1: return
    P1->>+ P534: calls
    P534-->>- P1: return
    P1->>+ P535: calls
    P535-->>- P1: return
    P1->>+ P536: calls
    P536-->>- P1: return
    P1->>+ P537: calls
    P537-->>- P1: return
    P1->>+ P538: calls
    P538-->>- P1: return
    P1->>+ P539: calls
    P539-->>- P1: return
    P1->>+ P540: calls
    P540-->>- P1: return
    P1->>+ P541: calls
    P541-->>- P1: return
    P1->>+ P542: calls
    P542-->>- P1: return
    P1->>+ P543: calls
    P543-->>- P1: return
    P1->>+ P544: calls
    P544-->>- P1: return
    P1->>+ P545: calls
    P545-->>- P1: return
    P1->>+ P546: calls
    P546-->>- P1: return
    P0->>+ P547: calls
    P547-->>- P0: return
    P0->>+ P29: calls
    P29-->>- P0: return
    P0->>+ P30: calls
    P30-->>- P0: return
    P0->>+ P31: calls
    P31-->>- P0: return
    P0->>+ P32: calls
    P32-->>- P0: return
    P0->>+ P548: calls
    P548-->>- P0: return
    P0->>+ P11: calls
    P11-->>- P0: return
    P0->>+ P38: calls
    P38-->>- P0: return
    P0->>+ P12: calls
    P12-->>- P0: return
    P0->>+ P549: calls
    P549-->>- P0: return
    P0->>+ P550: calls
    P550-->>- P0: return
    P0->>+ P48: calls
    P48-->>- P0: return
    P0->>+ P49: calls
    P49-->>- P0: return
    P0->>+ P551: calls
    P551-->>- P0: return
    P0->>+ P52: calls
    P52-->>- P0: return
    P0->>+ P552: calls
    P552-->>- P0: return
    P0->>+ P57: calls
    P57-->>- P0: return
    P0->>+ P60: calls
    P60-->>- P0: return
    P0->>+ P553: calls
    P553-->>- P0: return
    P0->>+ P554: calls
    P554-->>- P0: return
    P0->>+ P68: calls
    P68-->>- P0: return
    P0->>+ P69: calls
    P69-->>- P0: return
    P0->>+ P77: calls
    P77-->>- P0: return
    P0->>+ P80: calls
    P80-->>- P0: return
    P0->>+ P82: calls
    P82-->>- P0: return
    P0->>+ P83: calls
    P83-->>- P0: return
    P0->>+ P85: calls
    P85-->>- P0: return
    P0->>+ P94: calls
    P94-->>- P0: return
    P0->>+ P95: calls
    P95-->>- P0: return
    P0->>+ P96: calls
    P96-->>- P0: return
    P0->>+ P555: calls
    P555-->>- P0: return
    P0->>+ P556: calls
    P556-->>- P0: return
    P0->>+ P557: calls
    P557-->>- P0: return
    P0->>+ P558: calls
    P558-->>- P0: return
    P0->>+ P98: calls
    P98-->>- P0: return
    P0->>+ P100: calls
    P100-->>- P0: return
    P0->>+ P559: calls
    P559-->>- P0: return
    P0->>+ P560: calls
    P560-->>- P0: return
    P0->>+ P105: calls
    P105-->>- P0: return
    P0->>+ P106: calls
    P106-->>- P0: return
    P0->>+ P561: calls
    P561-->>- P0: return
    P0->>+ P111: calls
    P111-->>- P0: return
    P0->>+ P112: calls
    P112-->>- P0: return
    P0->>+ P115: calls
    P115-->>- P0: return
    P0->>+ P125: calls
    P125-->>- P0: return
    P0->>+ P126: calls
    P126-->>- P0: return
    P0->>+ P127: calls
    P127-->>- P0: return
    P0->>+ P562: calls
    P562-->>- P0: return
    P0->>+ P128: calls
    P128-->>- P0: return
    P0->>+ P130: calls
    P130-->>- P0: return
    P0->>+ P131: calls
    P131-->>- P0: return
    P0->>+ P132: calls
    P132-->>- P0: return
    P0->>+ P133: calls
    P133-->>- P0: return
    P0->>+ P563: calls
    P563-->>- P0: return
    P0->>+ P564: calls
    P564-->>- P0: return
    P0->>+ P565: calls
    P565-->>- P0: return
    P0->>+ P566: calls
    P566-->>- P0: return
    P0->>+ P142: calls
    P142-->>- P0: return
    P0->>+ P567: calls
    P567-->>- P0: return
    P0->>+ P162: calls
    P162-->>- P0: return
    P0->>+ P163: calls
    P163-->>- P0: return
    P0->>+ P164: calls
    P164-->>- P0: return
    P0->>+ P165: calls
    P165-->>- P0: return
    P0->>+ P166: calls
    P166-->>- P0: return
    P0->>+ P167: calls
    P167-->>- P0: return
    P0->>+ P168: calls
    P168-->>- P0: return
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
    P0->>+ P199: calls
    P199-->>- P0: return
    P0->>+ P200: calls
    P200-->>- P0: return
    P0->>+ P201: calls
    P201-->>- P0: return
    P0->>+ P207: calls
    P207-->>- P0: return
    P0->>+ P578: calls
    P578-->>- P0: return
    P0->>+ P579: calls
    P579-->>- P0: return
    P0->>+ P580: calls
    P580-->>- P0: return
    P0->>+ P212: calls
    P212-->>- P0: return
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
    P0->>+ P257: calls
    P257-->>- P0: return
    P0->>+ P258: calls
    P258-->>- P0: return
    P0->>+ P589: calls
    P589-->>- P0: return
    P0->>+ P590: calls
    P590-->>- P0: return
    P0->>+ P591: calls
    P591-->>- P0: return
    P0->>+ P275: calls
    P275-->>- P0: return
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
```

## Connections by Relation

### calls

- [[error]] `INFERRED`
- [[json]] `INFERRED`
- [[uploadAndShowActions()]] `INFERRED`
- [[handleAudioActionCallback()]] `INFERRED`
- [[processVoiceMessage()]] `INFERRED`
- [[handleClassificationCallback()]] `INFERRED`
- [[handleNavigationCallbacks()]] `INFERRED`
- [[handleProjects()]] `INFERRED`
- [[initiateTariffPurchase()]] `INFERRED`
- [[handleLibrary()]] `INFERRED`
- [[handleProjectsCallback()]] `INFERRED`
- [[text]] `INFERRED`
- [[startMidiConversion()]] `INFERRED`
- [[handleStatus()]] `INFERRED`
- [[handleProjectsCarousel()]] `INFERRED`
- [[handleCheckTask()]] `INFERRED`
- [[handleProjectDetails()]] `INFERRED`
- [[handleGenerateFromReference()]] `INFERRED`
- [[handleVoiceForGeneration()]] `INFERRED`
- [[handleWizardCallback()]] `INFERRED`

### contains

- [[telegram-api.ts]] `EXTRACTED`

---

_Part of the graphify knowledge wiki. See [[index]] to navigate._
