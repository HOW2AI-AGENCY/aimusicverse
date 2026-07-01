# sendMessage()

> God node · 135 connections · [D:\.MUSICVERSE\aimusicverse\supabase\functions\telegram-bot\telegram-api.ts](file:///D:/.MUSICVERSE/aimusicverse/supabase/functions/telegram-bot/telegram-api.ts#L118)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as sendMessage()
    participant P1 as now
    participant P2 as .get()
    participant P3 as getSupabaseClient()
    participant P4 as handleAudioActionCallback()
    participant P5 as handleProjects()
    participant P6 as handleProjectsCallback()
    participant P7 as handleGuitarAudio()
    participant P8 as handleCheckTask()
    participant P9 as startMidiConversion()
    participant P10 as processMediaGroupAction()
    participant P11 as sendTelegramAudio()
    participant P12 as getSession()
    participant P13 as getCachedAudio()
    participant P14 as handleGenerateFromReference()
    participant P15 as .getState()
    participant P16 as handleWizardCallback()
    participant P17 as processAudioUpload()
    participant P18 as .remove()
    participant P19 as handleChordAnalysis()
    participant P20 as handleBeatAnalysis()
    participant P21 as .cleanup()
    participant P22 as .getState()
    participant P23 as sendLikeDigest()
    participant P24 as sendCommentDigest()
    participant P25 as .acquire()
    participant P26 as sendAlertToAdmins()
    participant P27 as sendTelegramVideo()
    participant P28 as sendTelegramDocument()
    participant P29 as handleTranscription()
    participant P30 as handleFullAnalysis()
    participant P31 as handleRecognizeAudio()
    participant P32 as .startWizard()
    participant P33 as sendTelegramMessage()
    participant P34 as .cancelWizard()
    participant P35 as .nextStep()
    participant P36 as handleBuyProduct()
    participant P37 as getPendingDigest()
    participant P38 as generateTab()
    participant P39 as trackFeature()
    participant P40 as getWaveform()
    participant P41 as generateThumbnails()
    participant P42 as pollForResult()
    participant P43 as generateGuitarTab()
    participant P44 as recognizeFromUrl()
    participant P45 as getNavigationState()
    participant P46 as .handleInput()
    participant P47 as .showCurrentStep()
    participant P48 as .confirmWizard()
    participant P49 as getFileUrl()
    participant P50 as getFileUrl()
    participant P51 as .trackMessage()
    participant P52 as getTelegramConfig()
    participant P53 as main()
    participant P54 as sendTelegramProgress()
    participant P55 as downloadAndUploadStem()
    participant P56 as processMediaGroup()
    participant P57 as evictOldEntries()
    participant P58 as .updateGesture()
    participant P59 as memoize()
    participant P60 as .getAudioElement()
    participant P61 as loadWithStandardFetch()
    participant P62 as validateAudioUrl()
    participant P63 as setUserEmojiStatus()
    participant P64 as getAnalysisSession()
    participant P65 as processGenerationWithReference()
    participant P66 as processAddVocalsInstrumental()
    participant P67 as getBotCommands()
    participant P68 as getFileUrl()
    participant P69 as buildKeyboard()
    participant P70 as .deleteExpired()
    participant P71 as addToPendingDigest()
    participant P72 as applyTemplateToSections()
    participant P73 as .release()
    participant P74 as .evictLowPriorityElement()
    participant P75 as .startGesture()
    participant P76 as .confirmGesture()
    participant P77 as shouldDedupe()
    participant P78 as recordError()
    participant P79 as getWaveformByTrackId()
    participant P80 as .removeAudioElement()
    participant P81 as sendNotifications()
    participant P82 as editTelegramMessage()
    participant P83 as setMyCommands()
    participant P84 as answerInlineQuery()
    participant P85 as saveBotCommands()
    participant P86 as .scheduleCleanup()
    participant P87 as cancelPendingUpload()
    participant P88 as .handleSelection()
    participant P89 as .previousStep()
    participant P90 as editInlineMessage()
    participant P91 as .getMessages()
    participant P92 as checkRateLimitFallback()
    participant P93 as handleWizardTextInput()
    participant P94 as validateRequest()
    participant P95 as checkRateLimit()
    participant P96 as tinkoffCharge()
    participant P97 as updateAccessTimeInDB()
    participant P98 as .updatePriority()
    participant P99 as .endGesture()
    participant P100 as findRepeatedWords()
    participant P101 as parseUTMParams()
    participant P102 as .releaseAudioElement()
    participant P103 as checkRangeSupport()
    participant P104 as syncBotCommands()
    participant P105 as deleteTelegramMessage()
    participant P106 as getFileInfo()
    participant P107 as addToMediaGroup()
    participant P108 as canSendNotification()
    participant P109 as .clearChat()
    participant P110 as .removeFromCache()
    participant P111 as .cancelCleanup()
    participant P112 as hasActiveWizard()
    participant P113 as callTelegramAPI()
    participant P114 as authorize()
    participant P115 as checkRateLimit()
    participant P116 as .trackRender()
    participant P117 as .getConflicts()
    participant P118 as .resolveConflict()
    participant P119 as getCachedImage()
    participant P120 as .abortPolling()
    participant P121 as validateWebhookSignature()
    participant P122 as getTelegramConfig()
    participant P123 as answerInlineQuery()
    participant P124 as .markPersistent()
    participant P125 as getAuthenticatedUser()
    participant P126 as isServiceRoleToken()
    participant P127 as getSunoKey()
    participant P128 as getServiceClient()
    participant P129 as getAuthUser()
    participant P130 as getChildCount()
    participant P131 as .getRecognizer()
    participant P132 as getFeedbackSession()
    participant P133 as .updateMetadata()
    participant P134 as getWizardStep()
    participant P135 as callbackUrl()
    participant P136 as .getRenderCount()
    participant P137 as .set()
    participant P138 as uploadAndShowActions()
    participant P139 as processVoiceMessage()
    participant P140 as handleAutoUploadWithPipeline()
    participant P141 as handleAudioMessage()
    participant P142 as handleCallbackQuery()
    participant P143 as handleUpdate()
    participant P144 as navigateTo()
    participant P145 as handleSubmenu()
    participant P146 as .setActive()
    participant P147 as handleCloudUploadWithAnalysis()
    participant P148 as handleVoiceForGeneration()
    participant P149 as trackMessage()
    participant P150 as createNotification()
    participant P151 as sendAudio()
    participant P152 as GlobalAudioProvider()
    participant P153 as saveWizardState()
    participant P154 as cacheAudio()
    participant P155 as processQueueItem()
    participant P156 as sendDocument()
    participant P157 as handleGuitarCommand()
    participant P158 as setPendingUpload()
    participant P159 as .handleCallback()
    participant P160 as showAudioClassificationPromptInternal()
    participant P161 as loadTiers()
    participant P162 as handleSuccessfulPayment()
    participant P163 as handleRecognizeCommand()
    participant P164 as handleProjectStats()
    participant P165 as showTracksList()
    participant P166 as handleFileSelect()
    participant P167 as migrateQueueFromPlayerStore()
    participant P168 as detectBPM()
    participant P169 as .processSingleTask()
    participant P170 as .getActive()
    participant P171 as queueNotification()
    participant P172 as processNotification()
    participant P173 as handlePreCheckoutQuery()
    participant P174 as buildSearchQuery()
    participant P175 as getPendingUpload()
    participant P176 as loadCustomImages()
    participant P177 as storeFailedNotification()
    participant P178 as startProjectWizard()
    participant P179 as handleFileUpload()
    participant P180 as uploadAndAnalyze()
    participant P181 as handleApplyCrop()
    participant P182 as handleFileUpload()
    participant P183 as handleFileSelect()
    participant P184 as usePaywallTrigger()
    participant P185 as loadPositions()
    participant P186 as .enqueue()
    participant P187 as setPendingAudio()
    participant P188 as setWizardState()
    participant P189 as processUploadAction()
    participant P190 as handleImageUpload()
    participant P191 as handleRecordingComplete()
    participant P192 as uploadAndGetUrl()
    participant P193 as handleUpload()
    participant P194 as uploadMenuItemImage()
    participant P195 as activateTrial()
    participant P196 as cleanupExpiredEntries()
    participant P197 as getOrCreateSessionId()
    participant P198 as .resolveAudioUrl()
    participant P199 as setPendingUpload()
    participant P200 as .popFromStack()
    participant P201 as setWaitingForInput()
    participant P202 as setPendingClassification()
    participant P203 as showCustomPromptInput()
    participant P204 as scheduleRetry()
    participant P205 as logApiCall()
    participant P206 as uploadAudioForAnalysis()
    participant P207 as handleAddNewPrompt()
    participant P208 as trackPageVisit()
    participant P209 as saveGestureSettings()
    participant P210 as setCachedLyrics()
    participant P211 as loadRecentlyPlayed()
    participant P212 as initTelemetry()
    participant P213 as recordMetric()
    participant P214 as startTimer()
    participant P215 as .generate()
    participant P216 as .evictOldestInactive()
    participant P217 as recordUpsellShown()
    participant P218 as getOrCreateJourneySessionId()
    participant P219 as refreshJourneySession()
    participant P220 as checkDatabase()
    participant P221 as getConfig()
    participant P222 as handleMidiUploadCallback()
    participant P223 as .pushToStack()
    participant P224 as storeMediaGroupSession()
    participant P225 as storeVoiceTranscription()
    participant P226 as shouldSendDigest()
    participant P227 as parseLyrics()
    participant P228 as handleSelectInspiration()
    participant P229 as handleSaveToBookmarks()
    participant P230 as .set()
    participant P231 as resetAllHints()
    participant P232 as updateAccessTime()
    participant P233 as .getActiveElements()
    participant P234 as loadGestureSettings()
    participant P235 as cleanupCache()
    participant P236 as setCachedImage()
    participant P237 as addRecentlyPlayed()
    participant P238 as frame()
    participant P239 as .createFromUpload()
    participant P240 as .createFromRecording()
    participant P241 as .createFromStem()
    participant P242 as .createFromCreativeTool()
    participant P243 as .createFromTrack()
    participant P244 as checkGenerationQueue()
    participant P245 as getMetrics()
    participant P246 as calculateFailureRate()
    participant P247 as recordFailure()
    participant P248 as validateTelegramWebAppData()
    participant P249 as consumePendingUpload()
    participant P250 as hasPendingUpload()
    participant P251 as getPendingUpload()
    participant P252 as updatePendingUpload()
    participant P253 as .buildStepMenu()
    participant P254 as markNotificationSent()
    participant P255 as .execute()
    participant P256 as runBenchmark()
    participant P257 as tick()
    participant P258 as triggerConfetti()
    participant P259 as addSection()
    participant P260 as update()
    participant P261 as reset()
    participant P262 as useAntiSpam()
    participant P263 as fireConfetti()
    participant P264 as useEnhancedStudioLogger()
    participant P265 as handleExport()
    participant P266 as .get()
    participant P267 as setLastShownAt()
    participant P268 as cleanupExpiredLyrics()
    participant P269 as createDefaultQueue()
    participant P270 as getSessionDuration()
    participant P271 as .cleanupInactiveElements()
    participant P272 as .cleanup()
    participant P273 as .update()
    participant P274 as parseLyricsToSections()
    participant P275 as canShowUpsell()
    participant P276 as trackGeneration()
    participant P277 as trackGenerationMetrics()
    participant P278 as .createFromCloud()
    participant P279 as .createFromGuitar()
    participant P280 as getRandomArtStyle()
    participant P281 as checkAuth()
    participant P282 as checkCircuitBreaker()
    participant P283 as cleanupOldGuitarSessions()
    participant P284 as cleanupOldSessions()
    participant P285 as cleanupOldSessions()
    participant P286 as setConversationContext()
    participant P287 as setLastCommand()
    participant P288 as withMetrics()
    participant P289 as cleanupStaleEntries()
    participant P290 as measureScrollFPS()
    participant P291 as handleDownload()
    participant P292 as formatTimeSince()
    participant P293 as handleDownload()
    participant P294 as parseLyrics()
    participant P295 as showGenerationComplete()
    participant P296 as formatRelative()
    participant P297 as generateNoteId()
    participant P298 as useThrottledValue()
    participant P299 as useStudioActivityLogger()
    participant P300 as generateNoteId()
    participant P301 as useFunnelAnalytics()
    participant P302 as useRetentionCohorts()
    participant P303 as generateA11yId()
    participant P304 as .getStats()
    participant P305 as .startTimer()
    participant P306 as useRenderTime()
    participant P307 as createTimer()
    participant P308 as generateId()
    participant P309 as checkStorage()
    participant P310 as checkEdgeFunctions()
    participant P311 as checkTelegramBot()
    participant P312 as cleanupSessions()
    participant P313 as generateOrderId()
    participant P314 as generateTestUser()
    participant P315 as measureMemory()
    participant P316 as measureLoadTime()
    participant P317 as json()
    participant P318 as handleDeepLink()
    participant P319 as trackMetric()
    participant P320 as handleCommand()
    participant P321 as handleNavigationCallbacks()
    participant P322 as handleLibrary()
    participant P323 as handleGenerate()
    participant P324 as handleMidiCommand()
    participant P325 as handleStatus()
    participant P326 as sendNotification()
    participant P327 as handleProjectsCarousel()
    participant P328 as handleDynamicMenuCallback()
    participant P329 as handleProjectDeepLink()
    participant P330 as handlePlayTrack()
    participant P331 as handleAnalyzeCommand()
    participant P332 as handlePianoCommand()
    participant P333 as handleMyUploads()
    participant P334 as handleCoverAction()
    participant P335 as handleExtendAction()
    participant P336 as handleTrackDeepLink()
    participant P337 as handleSendTrackToChat()
    participant P338 as handleStemsAction()
    participant P339 as handleMidiAction()
    participant P340 as handleUploadCallback()
    participant P341 as handleCoverCommand()
    participant P342 as handleExtendCommand()
    participant P343 as handleTerms()
    participant P344 as handlePrivacy()
    participant P345 as handleLyrics()
    participant P346 as handleAddToPlaylist()
    participant P347 as handleCheckStemsStatus()
    participant P348 as handleStudio()
    participant P349 as handleUploadCommand()
    participant P350 as handleArtistDeepLink()
    participant P351 as handleProfileDeepLink()
    participant P352 as handleBuyCommand()
    participant P353 as handleTextMessage()
    participant P354 as sendAutoDeleteMessage()
    participant P355 as sendFollowerDigest()
    participant P356 as createProject()
    participant P357 as handleMediaGroupCallbacks()
    participant P358 as handleAbout()
    participant P359 as handleTrackStats()
    participant P360 as handleStemSeparation()
    participant P361 as showClassificationPrompt()
    participant P362 as handleInviteDeepLink()
    participant P363 as processFeedbackMessage()
    participant P364 as sendFeedbackReply()
    participant P365 as handleDownloadTrack()
    participant P366 as handleShowTrackDetails()
    participant P367 as handleQuickGenPreset()
    participant P368 as handleRemix()
    participant P369 as handleAddVocals()
    participant P370 as handleAddInstrumental()
    participant P371 as handleTrackDetails()
    participant P372 as handleDownloadStems()
    participant P373 as handleShareTrack()
    participant P374 as handleApp()
    participant P375 as handleShareTrack()
    participant P376 as handleSeparateStems()
    participant P377 as handleDownloadStems()
    participant P378 as deleteAndSendNewMenu()
    participant P379 as handleQuickGenDeepLink()
    participant P380 as handlePaymentDeepLink()
    participant P381 as sendTrackBatch()
    participant P382 as handleBuyCreditPackages()
    participant P383 as handleBuySubscriptions()
    participant P384 as showEnhancedQuickActions()
    participant P385 as showEnterpriseContact()
    participant P386 as startGenerationWizard()
    participant P387 as showTypeSelection()
    participant P388 as handleCancelMidi()
    participant P389 as handleNews()
    participant P390 as handleSetEmojiStatus()
    participant P391 as handleRemoveEmojiStatus()
    participant P392 as .sendMenu()
    participant P393 as handleAddVocalsAction()
    participant P394 as handleAddInstrumentalAction()
    participant P395 as handleShowLyricsAction()
    participant P396 as handleLeaderboardDeepLink()
    participant P397 as handleAchievementsDeepLink()
    participant P398 as sendDefaultResponse()
    participant P399 as handleDownloadMidi()
    participant P400 as showConfirmStep()
    participant P401 as isRetryableError()
    participant P402 as handleCancelGuitar()
    participant P403 as handleHelpCommands()
    participant P404 as sendRecognitionResult()
    participant P405 as handleCancelRecognize()
    participant P406 as handleCopyTrackLink()
    participant P407 as handleEditStyleAction()
    participant P408 as handleConfirmQuickGen()
    participant P409 as handleDetectedIntent()
    participant P410 as suggestGeneration()
    participant P411 as showStyleStep()
    participant P412 as handleTitleInput()
    participant P413 as handleDescriptionInput()
    participant P414 as telegramFetchWithRetry()
    participant P415 as handleCancelCommand()
    participant P416 as showModelSelection()
    participant P417 as handlePlaylistNew()
    participant P418 as handleSettings()
    participant P419 as handleNotificationSettings()
    participant P420 as handleEmojiStatusSettings()
    participant P421 as sendNotification()
    participant P422 as handleInternalAction()
    participant P423 as handleChannel()
    participant P424 as handleTinkoffPaymentSuccess()
    participant P425 as showUploadProgress()
    participant P426 as handleTinkoffPaymentFailed()
    participant P427 as showUploadResult()
    P0->>+ P1: calls
    P1-->>- P0: return
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
    P1->>+ P0: calls
    P0-->>- P1: return
    P1->>+ P137: calls
    P137-->>- P1: return
    P1->>+ P138: calls
    P138-->>- P1: return
    P1->>+ P4: calls
    P4-->>- P1: return
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
    P1->>+ P7: calls
    P7-->>- P1: return
    P1->>+ P145: calls
    P145-->>- P1: return
    P1->>+ P146: calls
    P146-->>- P1: return
    P1->>+ P8: calls
    P8-->>- P1: return
    P1->>+ P147: calls
    P147-->>- P1: return
    P1->>+ P12: calls
    P12-->>- P1: return
    P1->>+ P148: calls
    P148-->>- P1: return
    P1->>+ P149: calls
    P149-->>- P1: return
    P1->>+ P13: calls
    P13-->>- P1: return
    P1->>+ P150: calls
    P150-->>- P1: return
    P1->>+ P151: calls
    P151-->>- P1: return
    P1->>+ P15: calls
    P15-->>- P1: return
    P1->>+ P152: calls
    P152-->>- P1: return
    P1->>+ P17: calls
    P17-->>- P1: return
    P1->>+ P153: calls
    P153-->>- P1: return
    P1->>+ P154: calls
    P154-->>- P1: return
    P1->>+ P155: calls
    P155-->>- P1: return
    P1->>+ P156: calls
    P156-->>- P1: return
    P1->>+ P22: calls
    P22-->>- P1: return
    P1->>+ P25: calls
    P25-->>- P1: return
    P1->>+ P157: calls
    P157-->>- P1: return
    P1->>+ P158: calls
    P158-->>- P1: return
    P1->>+ P32: calls
    P32-->>- P1: return
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
    P1->>+ P37: calls
    P37-->>- P1: return
    P1->>+ P166: calls
    P166-->>- P1: return
    P1->>+ P167: calls
    P167-->>- P1: return
    P1->>+ P39: calls
    P39-->>- P1: return
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
    P1->>+ P51: calls
    P51-->>- P1: return
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
    P1->>+ P54: calls
    P54-->>- P1: return
    P1->>+ P187: calls
    P187-->>- P1: return
    P1->>+ P188: calls
    P188-->>- P1: return
    P1->>+ P189: calls
    P189-->>- P1: return
    P1->>+ P57: calls
    P57-->>- P1: return
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
    P1->>+ P58: calls
    P58-->>- P1: return
    P1->>+ P197: calls
    P197-->>- P1: return
    P1->>+ P60: calls
    P60-->>- P1: return
    P1->>+ P62: calls
    P62-->>- P1: return
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
    P1->>+ P70: calls
    P70-->>- P1: return
    P1->>+ P71: calls
    P71-->>- P1: return
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
    P1->>+ P74: calls
    P74-->>- P1: return
    P1->>+ P209: calls
    P209-->>- P1: return
    P1->>+ P210: calls
    P210-->>- P1: return
    P1->>+ P77: calls
    P77-->>- P1: return
    P1->>+ P211: calls
    P211-->>- P1: return
    P1->>+ P212: calls
    P212-->>- P1: return
    P1->>+ P213: calls
    P213-->>- P1: return
    P1->>+ P214: calls
    P214-->>- P1: return
    P1->>+ P78: calls
    P78-->>- P1: return
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
    P1->>+ P95: calls
    P95-->>- P1: return
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
    P1->>+ P98: calls
    P98-->>- P1: return
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
    P1->>+ P107: calls
    P107-->>- P1: return
    P1->>+ P108: calls
    P108-->>- P1: return
    P1->>+ P254: calls
    P254-->>- P1: return
    P1->>+ P255: calls
    P255-->>- P1: return
    P1->>+ P112: calls
    P112-->>- P1: return
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
    P1->>+ P119: calls
    P119-->>- P1: return
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
    P0->>+ P317: calls
    P317-->>- P0: return
    P0->>+ P318: calls
    P318-->>- P0: return
    P0->>+ P319: calls
    P319-->>- P0: return
    P0->>+ P320: calls
    P320-->>- P0: return
    P0->>+ P139: calls
    P139-->>- P0: return
    P0->>+ P140: calls
    P140-->>- P0: return
    P0->>+ P5: calls
    P5-->>- P0: return
    P0->>+ P321: calls
    P321-->>- P0: return
    P0->>+ P141: calls
    P141-->>- P0: return
    P0->>+ P322: calls
    P322-->>- P0: return
    P0->>+ P143: calls
    P143-->>- P0: return
    P0->>+ P323: calls
    P323-->>- P0: return
    P0->>+ P7: calls
    P7-->>- P0: return
    P0->>+ P324: calls
    P324-->>- P0: return
    P0->>+ P325: calls
    P325-->>- P0: return
    P0->>+ P326: calls
    P326-->>- P0: return
    P0->>+ P327: calls
    P327-->>- P0: return
    P0->>+ P9: calls
    P9-->>- P0: return
    P0->>+ P147: calls
    P147-->>- P0: return
    P0->>+ P10: calls
    P10-->>- P0: return
    P0->>+ P148: calls
    P148-->>- P0: return
    P0->>+ P328: calls
    P328-->>- P0: return
    P0->>+ P14: calls
    P14-->>- P0: return
    P0->>+ P329: calls
    P329-->>- P0: return
    P0->>+ P330: calls
    P330-->>- P0: return
    P0->>+ P331: calls
    P331-->>- P0: return
    P0->>+ P332: calls
    P332-->>- P0: return
    P0->>+ P333: calls
    P333-->>- P0: return
    P0->>+ P334: calls
    P334-->>- P0: return
    P0->>+ P335: calls
    P335-->>- P0: return
    P0->>+ P336: calls
    P336-->>- P0: return
    P0->>+ P337: calls
    P337-->>- P0: return
    P0->>+ P338: calls
    P338-->>- P0: return
    P0->>+ P339: calls
    P339-->>- P0: return
    P0->>+ P340: calls
    P340-->>- P0: return
    P0->>+ P23: calls
    P23-->>- P0: return
    P0->>+ P24: calls
    P24-->>- P0: return
    P0->>+ P341: calls
    P341-->>- P0: return
    P0->>+ P342: calls
    P342-->>- P0: return
    P0->>+ P157: calls
    P157-->>- P0: return
    P0->>+ P343: calls
    P343-->>- P0: return
    P0->>+ P344: calls
    P344-->>- P0: return
    P0->>+ P345: calls
    P345-->>- P0: return
    P0->>+ P346: calls
    P346-->>- P0: return
    P0->>+ P31: calls
    P31-->>- P0: return
    P0->>+ P347: calls
    P347-->>- P0: return
    P0->>+ P348: calls
    P348-->>- P0: return
    P0->>+ P349: calls
    P349-->>- P0: return
    P0->>+ P160: calls
    P160-->>- P0: return
    P0->>+ P350: calls
    P350-->>- P0: return
    P0->>+ P351: calls
    P351-->>- P0: return
    P0->>+ P352: calls
    P352-->>- P0: return
    P0->>+ P353: calls
    P353-->>- P0: return
    P0->>+ P354: calls
    P354-->>- P0: return
    P0->>+ P355: calls
    P355-->>- P0: return
    P0->>+ P356: calls
    P356-->>- P0: return
    P0->>+ P357: calls
    P357-->>- P0: return
    P0->>+ P358: calls
    P358-->>- P0: return
    P0->>+ P163: calls
    P163-->>- P0: return
    P0->>+ P359: calls
    P359-->>- P0: return
    P0->>+ P360: calls
    P360-->>- P0: return
    P0->>+ P361: calls
    P361-->>- P0: return
    P0->>+ P362: calls
    P362-->>- P0: return
    P0->>+ P363: calls
    P363-->>- P0: return
    P0->>+ P364: calls
    P364-->>- P0: return
    P0->>+ P365: calls
    P365-->>- P0: return
    P0->>+ P366: calls
    P366-->>- P0: return
    P0->>+ P36: calls
    P36-->>- P0: return
    P0->>+ P367: calls
    P367-->>- P0: return
    P0->>+ P177: calls
    P177-->>- P0: return
    P0->>+ P44: calls
    P44-->>- P0: return
    P0->>+ P368: calls
    P368-->>- P0: return
    P0->>+ P369: calls
    P369-->>- P0: return
    P0->>+ P370: calls
    P370-->>- P0: return
    P0->>+ P371: calls
    P371-->>- P0: return
    P0->>+ P372: calls
    P372-->>- P0: return
    P0->>+ P373: calls
    P373-->>- P0: return
    P0->>+ P178: calls
    P178-->>- P0: return
    P0->>+ P374: calls
    P374-->>- P0: return
    P0->>+ P375: calls
    P375-->>- P0: return
    P0->>+ P376: calls
    P376-->>- P0: return
    P0->>+ P377: calls
    P377-->>- P0: return
    P0->>+ P378: calls
    P378-->>- P0: return
    P0->>+ P379: calls
    P379-->>- P0: return
    P0->>+ P380: calls
    P380-->>- P0: return
    P0->>+ P381: calls
    P381-->>- P0: return
    P0->>+ P56: calls
    P56-->>- P0: return
    P0->>+ P382: calls
    P382-->>- P0: return
    P0->>+ P383: calls
    P383-->>- P0: return
    P0->>+ P384: calls
    P384-->>- P0: return
    P0->>+ P385: calls
    P385-->>- P0: return
    P0->>+ P386: calls
    P386-->>- P0: return
    P0->>+ P387: calls
    P387-->>- P0: return
    P0->>+ P388: calls
    P388-->>- P0: return
    P0->>+ P389: calls
    P389-->>- P0: return
    P0->>+ P390: calls
    P390-->>- P0: return
    P0->>+ P391: calls
    P391-->>- P0: return
    P0->>+ P392: calls
    P392-->>- P0: return
    P0->>+ P393: calls
    P393-->>- P0: return
    P0->>+ P394: calls
    P394-->>- P0: return
    P0->>+ P395: calls
    P395-->>- P0: return
    P0->>+ P396: calls
    P396-->>- P0: return
    P0->>+ P397: calls
    P397-->>- P0: return
    P0->>+ P398: calls
    P398-->>- P0: return
    P0->>+ P399: calls
    P399-->>- P0: return
    P0->>+ P400: calls
    P400-->>- P0: return
    P0->>+ P401: calls
    P401-->>- P0: return
    P0->>+ P402: calls
    P402-->>- P0: return
    P0->>+ P403: calls
    P403-->>- P0: return
    P0->>+ P404: calls
    P404-->>- P0: return
    P0->>+ P405: calls
    P405-->>- P0: return
    P0->>+ P406: calls
    P406-->>- P0: return
    P0->>+ P407: calls
    P407-->>- P0: return
    P0->>+ P408: calls
    P408-->>- P0: return
    P0->>+ P409: calls
    P409-->>- P0: return
    P0->>+ P410: calls
    P410-->>- P0: return
    P0->>+ P411: calls
    P411-->>- P0: return
    P0->>+ P412: calls
    P412-->>- P0: return
    P0->>+ P413: calls
    P413-->>- P0: return
    P0->>+ P414: calls
    P414-->>- P0: return
    P0->>+ P415: calls
    P415-->>- P0: return
    P0->>+ P416: calls
    P416-->>- P0: return
    P0->>+ P417: calls
    P417-->>- P0: return
    P0->>+ P418: calls
    P418-->>- P0: return
    P0->>+ P419: calls
    P419-->>- P0: return
    P0->>+ P420: calls
    P420-->>- P0: return
    P0->>+ P421: calls
    P421-->>- P0: return
    P0->>+ P422: calls
    P422-->>- P0: return
    P0->>+ P423: calls
    P423-->>- P0: return
    P0->>+ P424: calls
    P424-->>- P0: return
    P0->>+ P425: calls
    P425-->>- P0: return
    P0->>+ P426: calls
    P426-->>- P0: return
    P0->>+ P427: calls
    P427-->>- P0: return
```

## Connections by Relation

### calls
- [[now]] `INFERRED`
- [[json()]] `INFERRED`
- [[handleDeepLink()]] `INFERRED`
- [[trackMetric()]] `INFERRED`
- [[handleCommand()]] `INFERRED`
- [[processVoiceMessage()]] `INFERRED`
- [[handleAutoUploadWithPipeline()]] `INFERRED`
- [[handleProjects()]] `INFERRED`
- [[handleNavigationCallbacks()]] `INFERRED`
- [[handleAudioMessage()]] `INFERRED`
- [[handleLibrary()]] `INFERRED`
- [[handleUpdate()]] `INFERRED`
- [[handleGenerate()]] `INFERRED`
- [[handleGuitarAudio()]] `INFERRED`
- [[handleMidiCommand()]] `INFERRED`
- [[handleStatus()]] `INFERRED`
- [[sendNotification()]] `INFERRED`
- [[handleProjectsCarousel()]] `INFERRED`
- [[startMidiConversion()]] `INFERRED`
- [[handleCloudUploadWithAnalysis()]] `INFERRED`

### contains
- [[telegram-api.ts]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*