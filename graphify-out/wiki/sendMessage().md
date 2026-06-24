# sendMessage()

> God node · 135 connections · [D:\.MUSICVERSE\aimusicverse\supabase\functions\telegram-bot\telegram-api.ts](file:///D:/.MUSICVERSE/aimusicverse/supabase/functions/telegram-bot/telegram-api.ts#L122)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as sendMessage()
    participant P1 as now
    participant P2 as .get()
    participant P3 as getSupabaseClient()
    participant P4 as handleAudioActionCallback()
    participant P5 as handleProjects()
    participant P6 as getSession()
    participant P7 as handleProjectsCallback()
    participant P8 as handleGuitarAudio()
    participant P9 as startMidiConversion()
    participant P10 as processMediaGroupAction()
    participant P11 as .remove()
    participant P12 as sendTelegramAudio()
    participant P13 as handleCheckTask()
    participant P14 as getCachedAudio()
    participant P15 as handleGenerateFromReference()
    participant P16 as .getState()
    participant P17 as handleWizardCallback()
    participant P18 as handleChordAnalysis()
    participant P19 as .cleanup()
    participant P20 as .getState()
    participant P21 as processAudioUpload()
    participant P22 as sendLikeDigest()
    participant P23 as sendCommentDigest()
    participant P24 as sendTelegramVideo()
    participant P25 as sendTelegramDocument()
    participant P26 as handleTranscription()
    participant P27 as handleBeatAnalysis()
    participant P28 as handleFullAnalysis()
    participant P29 as handleRecognizeAudio()
    participant P30 as .startWizard()
    participant P31 as .acquire()
    participant P32 as sendTelegramMessage()
    participant P33 as generateGuitarTab()
    participant P34 as .cancelWizard()
    participant P35 as .nextStep()
    participant P36 as handleBuyProduct()
    participant P37 as getPendingDigest()
    participant P38 as generateTab()
    participant P39 as trackFeature()
    participant P40 as getWaveform()
    participant P41 as generateThumbnails()
    participant P42 as pollForResult()
    participant P43 as recognizeFromUrl()
    participant P44 as getNavigationState()
    participant P45 as .handleInput()
    participant P46 as .showCurrentStep()
    participant P47 as .confirmWizard()
    participant P48 as getFileUrl()
    participant P49 as getFileUrl()
    participant P50 as .trackMessage()
    participant P51 as getTelegramConfig()
    participant P52 as evictOldEntries()
    participant P53 as memoize()
    participant P54 as sendTelegramProgress()
    participant P55 as processMediaGroup()
    participant P56 as .deleteExpired()
    participant P57 as .release()
    participant P58 as recordError()
    participant P59 as .getAudioElement()
    participant P60 as .removeAudioElement()
    participant P61 as validateAudioUrl()
    participant P62 as Projects()
    participant P63 as sendAlertToAdmins()
    participant P64 as downloadAndUploadStem()
    participant P65 as setUserEmojiStatus()
    participant P66 as getAnalysisSession()
    participant P67 as getBotCommands()
    participant P68 as getFileUrl()
    participant P69 as buildKeyboard()
    participant P70 as addToPendingDigest()
    participant P71 as checkRateLimitFallback()
    participant P72 as checkRateLimit()
    participant P73 as .evictLowPriorityElement()
    participant P74 as shouldDedupe()
    participant P75 as getWaveformByTrackId()
    participant P76 as loadWithStandardFetch()
    participant P77 as sendNotifications()
    participant P78 as editTelegramMessage()
    participant P79 as setMyCommands()
    participant P80 as processGenerationWithReference()
    participant P81 as processAddVocalsInstrumental()
    participant P82 as answerInlineQuery()
    participant P83 as saveBotCommands()
    participant P84 as .scheduleCleanup()
    participant P85 as cancelPendingUpload()
    participant P86 as .handleSelection()
    participant P87 as .previousStep()
    participant P88 as editInlineMessage()
    participant P89 as .getMessages()
    participant P90 as handleWizardTextInput()
    participant P91 as validateRequest()
    participant P92 as tinkoffCharge()
    participant P93 as checkRateLimit()
    participant P94 as updateAccessTimeInDB()
    participant P95 as .updatePriority()
    participant P96 as shouldReport()
    participant P97 as parseUTMParams()
    participant P98 as .releaseAudioElement()
    participant P99 as checkRangeSupport()
    participant P100 as syncBotCommands()
    participant P101 as deleteTelegramMessage()
    participant P102 as validateWebhookSignature()
    participant P103 as getFileInfo()
    participant P104 as addToMediaGroup()
    participant P105 as canSendNotification()
    participant P106 as .clearChat()
    participant P107 as .removeFromCache()
    participant P108 as .cancelCleanup()
    participant P109 as hasActiveWizard()
    participant P110 as callTelegramAPI()
    participant P111 as authorize()
    participant P112 as .trackRender()
    participant P113 as getCachedImage()
    participant P114 as getTelegramConfig()
    participant P115 as answerInlineQuery()
    participant P116 as .markPersistent()
    participant P117 as getAuthenticatedUser()
    participant P118 as isServiceRoleToken()
    participant P119 as getFeedbackSession()
    participant P120 as .updateMetadata()
    participant P121 as getWizardStep()
    participant P122 as .getRenderCount()
    participant P123 as .set()
    participant P124 as uploadAndShowActions()
    participant P125 as processVoiceMessage()
    participant P126 as handleAudioMessage()
    participant P127 as handleCallbackQuery()
    participant P128 as handleUpdate()
    participant P129 as navigateTo()
    participant P130 as handleAutoUploadWithPipeline()
    participant P131 as handleSubmenu()
    participant P132 as .setActive()
    participant P133 as trackMessage()
    participant P134 as createNotification()
    participant P135 as sendAudio()
    participant P136 as handleVoiceForGeneration()
    participant P137 as analyzeAudio()
    participant P138 as trackSunoGeneration()
    participant P139 as handleCloudUploadWithAnalysis()
    participant P140 as saveWizardState()
    participant P141 as cacheAudio()
    participant P142 as processQueueItem()
    participant P143 as sendDocument()
    participant P144 as handleGuitarCommand()
    participant P145 as setPendingUpload()
    participant P146 as .handleCallback()
    participant P147 as showAudioClassificationPromptInternal()
    participant P148 as handleSave()
    participant P149 as cleanPlaybackPositions()
    participant P150 as .processQueue()
    participant P151 as handleRecognizeCommand()
    participant P152 as handleProjectStats()
    participant P153 as loadTiers()
    participant P154 as handleApplyCrop()
    participant P155 as cleanStemAudioReference()
    participant P156 as detectBPM()
    participant P157 as .processSingleTask()
    participant P158 as .getActive()
    participant P159 as queueNotification()
    participant P160 as processNotification()
    participant P161 as handlePreCheckoutQuery()
    participant P162 as handleSuccessfulPayment()
    participant P163 as getPendingUpload()
    participant P164 as showTracksList()
    participant P165 as loadCustomImages()
    participant P166 as storeFailedNotification()
    participant P167 as startProjectWizard()
    participant P168 as GlobalAudioProvider()
    participant P169 as usePaywallTrigger()
    participant P170 as loadPositions()
    participant P171 as buildSearchQuery()
    participant P172 as setPendingAudio()
    participant P173 as setWizardState()
    participant P174 as handleImageUpload()
    participant P175 as handleFileUpload()
    participant P176 as handleRecordingComplete()
    participant P177 as handleFileSelect()
    participant P178 as uploadAndGetUrl()
    participant P179 as handleTranscribe()
    participant P180 as uploadAndAnalyze()
    participant P181 as handleFileUpload()
    participant P182 as handleFileSelect()
    participant P183 as handleUpload()
    participant P184 as cleanupExpiredEntries()
    participant P185 as getOrCreateSessionId()
    participant P186 as .enqueue()
    participant P187 as getOrCreateJourneySessionId()
    participant P188 as setPendingUpload()
    participant P189 as setWaitingForInput()
    participant P190 as setPendingClassification()
    participant P191 as processUploadAction()
    participant P192 as showCustomPromptInput()
    participant P193 as scheduleRetry()
    participant P194 as logApiCall()
    participant P195 as handleAddNewPrompt()
    participant P196 as activateTrial()
    participant P197 as getUserIdForRollout()
    participant P198 as setCachedLyrics()
    participant P199 as initTelemetry()
    participant P200 as recordMetric()
    participant P201 as startTimer()
    participant P202 as .generate()
    participant P203 as .evictOldestInactive()
    participant P204 as loadTone()
    participant P205 as .isCircuitBreakerOpen()
    participant P206 as refreshJourneySession()
    participant P207 as .createFromStem()
    participant P208 as .resolveAudioUrl()
    participant P209 as checkDatabase()
    participant P210 as getConfig()
    participant P211 as handleMidiUploadCallback()
    participant P212 as .pushToStack()
    participant P213 as .popFromStack()
    participant P214 as storeMediaGroupSession()
    participant P215 as storeVoiceTranscription()
    participant P216 as shouldSendDigest()
    participant P217 as .execute()
    participant P218 as runBenchmark()
    participant P219 as uploadAudioForAnalysis()
    participant P220 as parseLyrics()
    participant P221 as handleDuplicateSection()
    participant P222 as handleSelectInspiration()
    participant P223 as handleSaveToBookmarks()
    participant P224 as uploadFile()
    participant P225 as .set()
    participant P226 as uploadMenuItemImage()
    participant P227 as resetAllHints()
    participant P228 as .updateConnectionState()
    participant P229 as .recordMessage()
    participant P230 as updateAccessTime()
    participant P231 as .getActiveElements()
    participant P232 as .tryAcquire()
    participant P233 as cleanupCache()
    participant P234 as setCachedImage()
    participant P235 as frame()
    participant P236 as .recordFailure()
    participant P237 as .createFromUpload()
    participant P238 as .createFromRecording()
    participant P239 as .createFromCloud()
    participant P240 as .createFromCreativeTool()
    participant P241 as .createFromGuitar()
    participant P242 as .createFromTrack()
    participant P243 as checkGenerationQueue()
    participant P244 as getMetrics()
    participant P245 as calculateFailureRate()
    participant P246 as recordFailure()
    participant P247 as validateTelegramWebAppData()
    participant P248 as cleanupOldGuitarSessions()
    participant P249 as cleanupOldSessions()
    participant P250 as cleanupOldSessions()
    participant P251 as consumePendingUpload()
    participant P252 as hasPendingUpload()
    participant P253 as getPendingUpload()
    participant P254 as updatePendingUpload()
    participant P255 as .buildStepMenu()
    participant P256 as markNotificationSent()
    participant P257 as triggerConfetti()
    participant P258 as handleAddSection()
    participant P259 as addSection()
    participant P260 as useAntiSpam()
    participant P261 as componentDidCatch()
    participant P262 as fireConfetti()
    participant P263 as .get()
    participant P264 as setLastShownAt()
    participant P265 as useAudioPerformanceMonitor()
    participant P266 as .checkConnectionHealth()
    participant P267 as .exportMetrics()
    participant P268 as useChannelMonitoring()
    participant P269 as cleanupRegistry()
    participant P270 as cleanupExpiredLyrics()
    participant P271 as getSessionDuration()
    participant P272 as .cleanupInactiveElements()
    participant P273 as .cleanup()
    participant P274 as parseLyricsToSections()
    participant P275 as trackGeneration()
    participant P276 as trackGenerationMetrics()
    participant P277 as getRandomArtStyle()
    participant P278 as checkAuth()
    participant P279 as checkCircuitBreaker()
    participant P280 as setConversationContext()
    participant P281 as setLastCommand()
    participant P282 as withMetrics()
    participant P283 as cleanupStaleEntries()
    participant P284 as measureScrollFPS()
    participant P285 as handleDownload()
    participant P286 as formatTimeSince()
    participant P287 as handleDownload()
    participant P288 as parseLyrics()
    participant P289 as updateProgress()
    participant P290 as update()
    participant P291 as useEnhancedStudioLogger()
    participant P292 as handleExport()
    participant P293 as handleAddSection()
    participant P294 as generateNoteId()
    participant P295 as useThrottledValue()
    participant P296 as useStudioActivityLogger()
    participant P297 as useStudioAnalytics()
    participant P298 as generateNoteId()
    participant P299 as useFunnelAnalytics()
    participant P300 as useRetentionCohorts()
    participant P301 as measureLatency()
    participant P302 as generateA11yId()
    participant P303 as .getStats()
    participant P304 as isCommentRateLimitExceeded()
    participant P305 as isFollowRateLimitExceeded()
    participant P306 as isLikeRateLimitExceeded()
    participant P307 as .startTimer()
    participant P308 as useRenderTime()
    participant P309 as createTimer()
    participant P310 as .update()
    participant P311 as generateId()
    participant P312 as checkStorage()
    participant P313 as checkEdgeFunctions()
    participant P314 as checkTelegramBot()
    participant P315 as cleanupSessions()
    participant P316 as generateOrderId()
    participant P317 as generateTestUser()
    participant P318 as measureMemory()
    participant P319 as measureLoadTime()
    participant P320 as json
    participant P321 as handleDeepLink()
    participant P322 as trackMetric()
    participant P323 as handleCommand()
    participant P324 as handleNavigationCallbacks()
    participant P325 as handleLibrary()
    participant P326 as sendNotification()
    participant P327 as handleGenerate()
    participant P328 as handleMidiCommand()
    participant P329 as handleStatus()
    participant P330 as handleProjectsCarousel()
    participant P331 as handleDynamicMenuCallback()
    participant P332 as handlePlayTrack()
    participant P333 as handleTrackDeepLink()
    participant P334 as handleProjectDeepLink()
    participant P335 as createProject()
    participant P336 as handleAnalyzeCommand()
    participant P337 as handlePianoCommand()
    participant P338 as handleSendTrackToChat()
    participant P339 as handleMyUploads()
    participant P340 as handleCoverAction()
    participant P341 as handleExtendAction()
    participant P342 as handleUploadCallback()
    participant P343 as handleCoverCommand()
    participant P344 as handleExtendCommand()
    participant P345 as handleTerms()
    participant P346 as handlePrivacy()
    participant P347 as handleLyrics()
    participant P348 as handleStudio()
    participant P349 as handleUploadCommand()
    participant P350 as handleStemsAction()
    participant P351 as handleMidiAction()
    participant P352 as handleArtistDeepLink()
    participant P353 as handleProfileDeepLink()
    participant P354 as handleTextMessage()
    participant P355 as sendAutoDeleteMessage()
    participant P356 as sendFollowerDigest()
    participant P357 as handleMediaGroupCallbacks()
    participant P358 as handleAbout()
    participant P359 as handleAddToPlaylist()
    participant P360 as handleTrackStats()
    participant P361 as handleCheckStemsStatus()
    participant P362 as showClassificationPrompt()
    participant P363 as handleInviteDeepLink()
    participant P364 as processFeedbackMessage()
    participant P365 as sendFeedbackReply()
    participant P366 as handleDownloadTrack()
    participant P367 as handleShowTrackDetails()
    participant P368 as handleBuyCommand()
    participant P369 as handleQuickGenPreset()
    participant P370 as handleRemix()
    participant P371 as handleAddVocals()
    participant P372 as handleAddInstrumental()
    participant P373 as handleTrackDetails()
    participant P374 as handleStemSeparation()
    participant P375 as handleDownloadStems()
    participant P376 as handleShareTrack()
    participant P377 as handleApp()
    participant P378 as handleShareTrack()
    participant P379 as handleSeparateStems()
    participant P380 as handleDownloadStems()
    participant P381 as deleteAndSendNewMenu()
    participant P382 as handleQuickGenDeepLink()
    participant P383 as handlePaymentDeepLink()
    participant P384 as sendTrackBatch()
    participant P385 as showEnhancedQuickActions()
    participant P386 as showEnterpriseContact()
    participant P387 as startGenerationWizard()
    participant P388 as showTypeSelection()
    participant P389 as handleCancelMidi()
    participant P390 as handleNews()
    participant P391 as handleSetEmojiStatus()
    participant P392 as handleRemoveEmojiStatus()
    participant P393 as .sendMenu()
    participant P394 as handleAddVocalsAction()
    participant P395 as handleAddInstrumentalAction()
    participant P396 as handleShowLyricsAction()
    participant P397 as handleLeaderboardDeepLink()
    participant P398 as handleAchievementsDeepLink()
    participant P399 as handleBuyCreditPackages()
    participant P400 as handleBuySubscriptions()
    participant P401 as sendDefaultResponse()
    participant P402 as handleDownloadMidi()
    participant P403 as showConfirmStep()
    participant P404 as isRetryableError()
    participant P405 as handleCancelGuitar()
    participant P406 as handleHelpCommands()
    participant P407 as sendRecognitionResult()
    participant P408 as handleCancelRecognize()
    participant P409 as handleCopyTrackLink()
    participant P410 as handleEditStyleAction()
    participant P411 as handleConfirmQuickGen()
    participant P412 as handleDetectedIntent()
    participant P413 as suggestGeneration()
    participant P414 as showStyleStep()
    participant P415 as handleTitleInput()
    participant P416 as handleDescriptionInput()
    participant P417 as telegramFetchWithRetry()
    participant P418 as handleCancelCommand()
    participant P419 as showModelSelection()
    participant P420 as handlePlaylistNew()
    participant P421 as handleSettings()
    participant P422 as handleNotificationSettings()
    participant P423 as handleEmojiStatusSettings()
    participant P424 as sendNotification()
    participant P425 as handleInternalAction()
    participant P426 as handleChannel()
    participant P427 as handleTinkoffPaymentSuccess()
    participant P428 as showUploadProgress()
    participant P429 as handleTinkoffPaymentFailed()
    participant P430 as showUploadResult()
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
    P1->>+ P123: calls
    P123-->>- P1: return
    P1->>+ P124: calls
    P124-->>- P1: return
    P1->>+ P4: calls
    P4-->>- P1: return
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
    P1->>+ P6: calls
    P6-->>- P1: return
    P1->>+ P131: calls
    P131-->>- P1: return
    P1->>+ P132: calls
    P132-->>- P1: return
    P1->>+ P8: calls
    P8-->>- P1: return
    P1->>+ P13: calls
    P13-->>- P1: return
    P1->>+ P133: calls
    P133-->>- P1: return
    P1->>+ P14: calls
    P14-->>- P1: return
    P1->>+ P134: calls
    P134-->>- P1: return
    P1->>+ P135: calls
    P135-->>- P1: return
    P1->>+ P16: calls
    P16-->>- P1: return
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
    P1->>+ P20: calls
    P20-->>- P1: return
    P1->>+ P21: calls
    P21-->>- P1: return
    P1->>+ P144: calls
    P144-->>- P1: return
    P1->>+ P145: calls
    P145-->>- P1: return
    P1->>+ P30: calls
    P30-->>- P1: return
    P1->>+ P146: calls
    P146-->>- P1: return
    P1->>+ P147: calls
    P147-->>- P1: return
    P1->>+ P148: calls
    P148-->>- P1: return
    P1->>+ P31: calls
    P31-->>- P1: return
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
    P1->>+ P37: calls
    P37-->>- P1: return
    P1->>+ P154: calls
    P154-->>- P1: return
    P1->>+ P155: calls
    P155-->>- P1: return
    P1->>+ P39: calls
    P39-->>- P1: return
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
    P1->>+ P50: calls
    P50-->>- P1: return
    P1->>+ P166: calls
    P166-->>- P1: return
    P1->>+ P167: calls
    P167-->>- P1: return
    P1->>+ P52: calls
    P52-->>- P1: return
    P1->>+ P168: calls
    P168-->>- P1: return
    P1->>+ P169: calls
    P169-->>- P1: return
    P1->>+ P170: calls
    P170-->>- P1: return
    P1->>+ P54: calls
    P54-->>- P1: return
    P1->>+ P171: calls
    P171-->>- P1: return
    P1->>+ P172: calls
    P172-->>- P1: return
    P1->>+ P173: calls
    P173-->>- P1: return
    P1->>+ P56: calls
    P56-->>- P1: return
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
    P1->>+ P58: calls
    P58-->>- P1: return
    P1->>+ P185: calls
    P185-->>- P1: return
    P1->>+ P59: calls
    P59-->>- P1: return
    P1->>+ P186: calls
    P186-->>- P1: return
    P1->>+ P61: calls
    P61-->>- P1: return
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
    P1->>+ P70: calls
    P70-->>- P1: return
    P1->>+ P193: calls
    P193-->>- P1: return
    P1->>+ P194: calls
    P194-->>- P1: return
    P1->>+ P72: calls
    P72-->>- P1: return
    P1->>+ P195: calls
    P195-->>- P1: return
    P1->>+ P196: calls
    P196-->>- P1: return
    P1->>+ P73: calls
    P73-->>- P1: return
    P1->>+ P197: calls
    P197-->>- P1: return
    P1->>+ P198: calls
    P198-->>- P1: return
    P1->>+ P74: calls
    P74-->>- P1: return
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
    P1->>+ P95: calls
    P95-->>- P1: return
    P1->>+ P231: calls
    P231-->>- P1: return
    P1->>+ P232: calls
    P232-->>- P1: return
    P1->>+ P96: calls
    P96-->>- P1: return
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
    P1->>+ P104: calls
    P104-->>- P1: return
    P1->>+ P105: calls
    P105-->>- P1: return
    P1->>+ P256: calls
    P256-->>- P1: return
    P1->>+ P109: calls
    P109-->>- P1: return
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
    P1->>+ P113: calls
    P113-->>- P1: return
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
    P0->>+ P320: calls
    P320-->>- P0: return
    P0->>+ P321: calls
    P321-->>- P0: return
    P0->>+ P322: calls
    P322-->>- P0: return
    P0->>+ P323: calls
    P323-->>- P0: return
    P0->>+ P125: calls
    P125-->>- P0: return
    P0->>+ P324: calls
    P324-->>- P0: return
    P0->>+ P126: calls
    P126-->>- P0: return
    P0->>+ P5: calls
    P5-->>- P0: return
    P0->>+ P128: calls
    P128-->>- P0: return
    P0->>+ P325: calls
    P325-->>- P0: return
    P0->>+ P130: calls
    P130-->>- P0: return
    P0->>+ P326: calls
    P326-->>- P0: return
    P0->>+ P327: calls
    P327-->>- P0: return
    P0->>+ P8: calls
    P8-->>- P0: return
    P0->>+ P328: calls
    P328-->>- P0: return
    P0->>+ P9: calls
    P9-->>- P0: return
    P0->>+ P329: calls
    P329-->>- P0: return
    P0->>+ P10: calls
    P10-->>- P0: return
    P0->>+ P330: calls
    P330-->>- P0: return
    P0->>+ P331: calls
    P331-->>- P0: return
    P0->>+ P15: calls
    P15-->>- P0: return
    P0->>+ P332: calls
    P332-->>- P0: return
    P0->>+ P136: calls
    P136-->>- P0: return
    P0->>+ P139: calls
    P139-->>- P0: return
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
    P0->>+ P341: calls
    P341-->>- P0: return
    P0->>+ P342: calls
    P342-->>- P0: return
    P0->>+ P22: calls
    P22-->>- P0: return
    P0->>+ P23: calls
    P23-->>- P0: return
    P0->>+ P343: calls
    P343-->>- P0: return
    P0->>+ P344: calls
    P344-->>- P0: return
    P0->>+ P144: calls
    P144-->>- P0: return
    P0->>+ P345: calls
    P345-->>- P0: return
    P0->>+ P346: calls
    P346-->>- P0: return
    P0->>+ P347: calls
    P347-->>- P0: return
    P0->>+ P29: calls
    P29-->>- P0: return
    P0->>+ P348: calls
    P348-->>- P0: return
    P0->>+ P349: calls
    P349-->>- P0: return
    P0->>+ P350: calls
    P350-->>- P0: return
    P0->>+ P351: calls
    P351-->>- P0: return
    P0->>+ P147: calls
    P147-->>- P0: return
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
    P0->>+ P359: calls
    P359-->>- P0: return
    P0->>+ P151: calls
    P151-->>- P0: return
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
    P0->>+ P367: calls
    P367-->>- P0: return
    P0->>+ P368: calls
    P368-->>- P0: return
    P0->>+ P36: calls
    P36-->>- P0: return
    P0->>+ P369: calls
    P369-->>- P0: return
    P0->>+ P166: calls
    P166-->>- P0: return
    P0->>+ P43: calls
    P43-->>- P0: return
    P0->>+ P370: calls
    P370-->>- P0: return
    P0->>+ P371: calls
    P371-->>- P0: return
    P0->>+ P372: calls
    P372-->>- P0: return
    P0->>+ P373: calls
    P373-->>- P0: return
    P0->>+ P374: calls
    P374-->>- P0: return
    P0->>+ P375: calls
    P375-->>- P0: return
    P0->>+ P376: calls
    P376-->>- P0: return
    P0->>+ P167: calls
    P167-->>- P0: return
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
    P0->>+ P382: calls
    P382-->>- P0: return
    P0->>+ P383: calls
    P383-->>- P0: return
    P0->>+ P384: calls
    P384-->>- P0: return
    P0->>+ P55: calls
    P55-->>- P0: return
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
    P0->>+ P428: calls
    P428-->>- P0: return
    P0->>+ P429: calls
    P429-->>- P0: return
    P0->>+ P430: calls
    P430-->>- P0: return
```

## Connections by Relation

### calls
- [[now]] `INFERRED`
- [[json]] `INFERRED`
- [[handleDeepLink()]] `INFERRED`
- [[trackMetric()]] `INFERRED`
- [[handleCommand()]] `INFERRED`
- [[processVoiceMessage()]] `INFERRED`
- [[handleNavigationCallbacks()]] `INFERRED`
- [[handleAudioMessage()]] `INFERRED`
- [[handleProjects()]] `INFERRED`
- [[handleUpdate()]] `INFERRED`
- [[handleLibrary()]] `INFERRED`
- [[handleAutoUploadWithPipeline()]] `INFERRED`
- [[sendNotification()]] `INFERRED`
- [[handleGenerate()]] `INFERRED`
- [[handleGuitarAudio()]] `INFERRED`
- [[handleMidiCommand()]] `INFERRED`
- [[startMidiConversion()]] `INFERRED`
- [[handleStatus()]] `INFERRED`
- [[processMediaGroupAction()]] `INFERRED`
- [[handleProjectsCarousel()]] `INFERRED`

### contains
- [[telegram-api.ts]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*