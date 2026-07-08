# now

> God node · 224 connections · [D:\.MUSICVERSE\aimusicverse\tests\integration\subscriptionStatus.test.ts](file:///D:/.MUSICVERSE/aimusicverse/tests/integration/subscriptionStatus.test.ts#L131)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as now
    participant P1 as sendMessage()
    participant P2 as json()
    participant P3 as editMessageText()
    participant P4 as answerCallbackQuery()
    participant P5 as handleAudioActionCallback()
    participant P6 as sendPhoto()
    participant P7 as on()
    participant P8 as handleGuitarAudio()
    participant P9 as deleteMessage()
    participant P10 as sendTelegramAudio()
    participant P11 as editMessageMedia()
    participant P12 as handleCheckTask()
    participant P13 as startMidiConversion()
    participant P14 as getStoryIndexFromServer()
    participant P15 as handleGenerateFromReference()
    participant P16 as sendAudio()
    participant P17 as sendAlertToAdmins()
    participant P18 as processAudioUpload()
    participant P19 as sendDocument()
    participant P20 as editMessageCaption()
    participant P21 as handleChordAnalysis()
    participant P22 as handleBeatAnalysis()
    participant P23 as sendTelegramVideo()
    participant P24 as sendTelegramDocument()
    participant P25 as handleTranscription()
    participant P26 as handleRecognizeAudio()
    participant P27 as sendTelegramMessage()
    participant P28 as pollForResult()
    participant P29 as handleBuyProduct()
    participant P30 as recognizeFromUrl()
    participant P31 as getFileUrl()
    participant P32 as getFileUrl()
    participant P33 as ninerouterFetch()
    participant P34 as sendTelegramProgress()
    participant P35 as logApiCall()
    participant P36 as fetchSunoTaskDetails()
    participant P37 as setUserEmojiStatus()
    participant P38 as getFileUrl()
    participant P39 as forwardBase64ToSuno()
    participant P40 as editTelegramMessage()
    participant P41 as setMyCommands()
    participant P42 as deleteTelegramMessage()
    participant P43 as logAuditAction()
    participant P44 as answerPreCheckoutQuery()
    participant P45 as getFileInfo()
    participant P46 as sendAudioWithMetadata()
    participant P47 as getFileInfo()
    participant P48 as getFileUrl()
    participant P49 as getFileUrl()
    participant P50 as callTelegramAPI()
    participant P51 as forwardUrlToSuno()
    participant P52 as handleSubscribe()
    participant P53 as healthCheck()
    participant P54 as retryJsonFetch()
    participant P55 as initTinkoffPayment()
    participant P56 as chargeTinkoffRecurrent()
    participant P57 as .callApi()
    participant P58 as setWebhook()
    participant P59 as getWebhookInfo()
    participant P60 as handleDeepLink()
    participant P61 as trackMetric()
    participant P62 as handleCommand()
    participant P63 as handleAutoUploadWithPipeline()
    participant P64 as processVoiceMessage()
    participant P65 as handleProjects()
    participant P66 as handleAudioMessage()
    participant P67 as handleNavigationCallbacks()
    participant P68 as handleLibrary()
    participant P69 as handleCloudUploadWithAnalysis()
    participant P70 as handleGenerate()
    participant P71 as handleMidiCommand()
    participant P72 as handleStatus()
    participant P73 as handleProjectsCarousel()
    participant P74 as handleUpdate()
    participant P75 as sendNotification()
    participant P76 as processMediaGroupAction()
    participant P77 as handleVoiceForGeneration()
    participant P78 as handleProjectDeepLink()
    participant P79 as handlePianoCommand()
    participant P80 as handleMyUploads()
    participant P81 as handleTrackDeepLink()
    participant P82 as handleDynamicMenuCallback()
    participant P83 as handleAnalyzeCommand()
    participant P84 as handlePlayTrack()
    participant P85 as handleSendTrackToChat()
    participant P86 as handleTrackStats()
    participant P87 as handleCoverAction()
    participant P88 as handleExtendAction()
    participant P89 as handleBuyCommand()
    participant P90 as sendLikeDigest()
    participant P91 as sendCommentDigest()
    participant P92 as createProject()
    participant P93 as handleGuitarCommand()
    participant P94 as handleLyrics()
    participant P95 as handleAddToPlaylist()
    participant P96 as handleCheckStemsStatus()
    participant P97 as handleStudio()
    participant P98 as handleUploadCommand()
    participant P99 as handleStemsAction()
    participant P100 as handleMidiAction()
    participant P101 as showAudioClassificationPromptInternal()
    participant P102 as handleArtistDeepLink()
    participant P103 as handleProfileDeepLink()
    participant P104 as handleUploadCallback()
    participant P105 as sendFollowerDigest()
    participant P106 as handleCoverCommand()
    participant P107 as handleExtendCommand()
    participant P108 as handleTerms()
    participant P109 as handlePrivacy()
    participant P110 as handleMashup()
    participant P111 as handleRemix()
    participant P112 as handleStemSeparation()
    participant P113 as handleInviteDeepLink()
    participant P114 as sendFeedbackReply()
    participant P115 as handleTextMessage()
    participant P116 as sendAutoDeleteMessage()
    participant P117 as handleMediaGroupCallbacks()
    participant P118 as handleAbout()
    participant P119 as handleRecognizeCommand()
    participant P120 as handleAddVocals()
    participant P121 as handleAddInstrumental()
    participant P122 as handleTrackDetails()
    participant P123 as handleDownloadStems()
    participant P124 as showClassificationPrompt()
    participant P125 as processFeedbackMessage()
    participant P126 as sendTrackBatch()
    participant P127 as processMediaGroup()
    participant P128 as handleDownloadTrack()
    participant P129 as handleShowTrackDetails()
    participant P130 as handleQuickGenPreset()
    participant P131 as storeFailedNotification()
    participant P132 as handleShareTrack()
    participant P133 as handleSeparateStems()
    participant P134 as handleDownloadStems()
    participant P135 as handleShareTrack()
    participant P136 as handleBuyCreditPackages()
    participant P137 as handleBuySubscriptions()
    participant P138 as showEnhancedQuickActions()
    participant P139 as startProjectWizard()
    participant P140 as handleApp()
    participant P141 as deleteAndSendNewMenu()
    participant P142 as handleQuickGenDeepLink()
    participant P143 as handlePaymentDeepLink()
    participant P144 as showEnterpriseContact()
    participant P145 as handleDownloadMidi()
    participant P146 as startGenerationWizard()
    participant P147 as showTypeSelection()
    participant P148 as handleCancelMidi()
    participant P149 as handleNews()
    participant P150 as handleSetEmojiStatus()
    participant P151 as handleRemoveEmojiStatus()
    participant P152 as .sendMenu()
    participant P153 as handleAddVocalsAction()
    participant P154 as handleAddInstrumentalAction()
    participant P155 as handleShowLyricsAction()
    participant P156 as handleLeaderboardDeepLink()
    participant P157 as handleAchievementsDeepLink()
    participant P158 as sendDefaultResponse()
    participant P159 as showConfirmStep()
    participant P160 as isRetryableError()
    participant P161 as handleCancelGuitar()
    participant P162 as handleHelpCommands()
    participant P163 as sendRecognitionResult()
    participant P164 as handleCancelRecognize()
    participant P165 as handleCopyTrackLink()
    participant P166 as handleEditStyleAction()
    participant P167 as handleConfirmQuickGen()
    participant P168 as handleDetectedIntent()
    participant P169 as suggestGeneration()
    participant P170 as showStyleStep()
    participant P171 as handleTitleInput()
    participant P172 as handleDescriptionInput()
    participant P173 as telegramFetchWithRetry()
    participant P174 as handleCancelCommand()
    participant P175 as showModelSelection()
    participant P176 as handlePlaylistNew()
    participant P177 as handleSettings()
    participant P178 as handleNotificationSettings()
    participant P179 as handleEmojiStatusSettings()
    participant P180 as sendNotification()
    participant P181 as handleInternalAction()
    participant P182 as handleChannel()
    participant P183 as handleTinkoffPaymentSuccess()
    participant P184 as showUploadProgress()
    participant P185 as handleTinkoffPaymentFailed()
    participant P186 as showUploadResult()
    participant P187 as e()
    participant P188 as constructor()
    participant P189 as constructor()
    participant P190 as uploadAndShowActions()
    participant P191 as iu()
    participant P192 as navigateTo()
    participant P193 as handleCallbackQuery()
    participant P194 as handleSubmenu()
    participant P195 as .setActive()
    participant P196 as .getState()
    participant P197 as getSession()
    participant P198 as trackMessage()
    participant P199 as getCachedAudio()
    participant P200 as createNotification()
    participant P201 as GlobalAudioProvider()
    participant P202 as processQueueItem()
    participant P203 as .handleCallback()
    participant P204 as .getState()
    participant P205 as handleProjectStats()
    participant P206 as saveWizardState()
    participant P207 as cacheAudio()
    participant P208 as buildSearchQuery()
    participant P209 as loadTiers()
    participant P210 as showTracksList()
    participant P211 as le()
    participant P212 as .acquire()
    participant P213 as migrateQueueFromPlayerStore()
    participant P214 as handleSuccessfulPayment()
    participant P215 as getPendingUpload()
    participant P216 as setPendingUpload()
    participant P217 as .startWizard()
    participant P218 as getPendingDigest()
    participant P219 as evictOldEntries()
    participant P220 as performUpload()
    participant P221 as parseLyrics()
    participant P222 as trackFeature()
    participant P223 as detectBPM()
    participant P224 as .processSingleTask()
    participant P225 as .resolveAudioUrl()
    participant P226 as processNotification()
    participant P227 as handlePreCheckoutQuery()
    participant P228 as setPendingAudio()
    participant P229 as setWizardState()
    participant P230 as loadCustomImages()
    participant P231 as handleFileUpload()
    participant P232 as handleApplyCrop()
    participant P233 as handleFileUpload()
    participant P234 as handleFileSelect()
    participant P235 as loadPositions()
    participant P236 as .getActive()
    participant P237 as getProvider()
    participant P238 as queueNotification()
    participant P239 as getMetrics()
    participant P240 as setPendingUpload()
    participant P241 as setPendingClassification()
    participant P242 as .trackMessage()
    participant P243 as ti()
    participant P244 as handleRecordingComplete()
    participant P245 as uploadAndAnalyze()
    participant P246 as uploadMenuItemImage()
    participant P247 as usePaywallTrigger()
    participant P248 as activateTrial()
    participant P249 as .generate()
    participant P250 as getOrCreateSessionId()
    participant P251 as .enqueue()
    participant P252 as getOrCreateJourneySessionId()
    participant P253 as .createFromUpload()
    participant P254 as .createFromRecording()
    participant P255 as checkGenerationQueue()
    participant P256 as processUploadAction()
    participant P257 as scheduleRetry()
    participant P258 as si()
    participant P259 as handleImageUpload()
    participant P260 as uploadAndGetUrl()
    participant P261 as applyTemplateToSections()
    participant P262 as trackPageVisit()
    participant P263 as handleUpload()
    participant P264 as cleanupExpiredEntries()
    participant P265 as .evictLowPriorityElement()
    participant P266 as cleanupCache()
    participant P267 as shouldDedupe()
    participant P268 as loadRecentlyPlayed()
    participant P269 as addRecentlyPlayed()
    participant P270 as .getAudioElement()
    participant P271 as validateAudioUrl()
    participant P272 as parseLyricsToSections()
    participant P273 as calculateFailureRate()
    participant P274 as .popFromStack()
    participant P275 as setWaitingForInput()
    participant P276 as showCustomPromptInput()
    participant P277 as .deleteExpired()
    participant P278 as addToPendingDigest()
    participant P279 as uploadAudioForAnalysis()
    participant P280 as makeSectionId()
    participant P281 as handleSelectInspiration()
    participant P282 as handleAddNewPrompt()
    participant P283 as saveGestureSettings()
    participant P284 as resetAllHints()
    participant P285 as setCachedLyrics()
    participant P286 as initTelemetry()
    participant P287 as recordMetric()
    participant P288 as startTimer()
    participant P289 as recordError()
    participant P290 as .evictOldestInactive()
    participant P291 as .set()
    participant P292 as frame()
    participant P293 as recordUpsellShown()
    participant P294 as refreshJourneySession()
    participant P295 as getRandomArtStyle()
    participant P296 as checkDatabase()
    participant P297 as validateTelegramWebAppData()
    participant P298 as getConfig()
    participant P299 as handleMidiUploadCallback()
    participant P300 as .pushToStack()
    participant P301 as storeMediaGroupSession()
    participant P302 as storeVoiceTranscription()
    participant P303 as shouldSendDigest()
    participant P304 as .execute()
    participant P305 as hasActiveWizard()
    participant P306 as checkRateLimit()
    participant P307 as runBenchmark()
    participant P308 as handleFileSelect()
    participant P309 as es()
    participant P310 as triggerConfetti()
    participant P311 as handleSaveToBookmarks()
    participant P312 as loadGestureSettings()
    participant P313 as handleExport()
    participant P314 as .set()
    participant P315 as setLastShownAt()
    participant P316 as updateAccessTime()
    participant P317 as .updatePriority()
    participant P318 as .getActiveElements()
    participant P319 as setCachedImage()
    participant P320 as .createFromStem()
    participant P321 as .createFromCreativeTool()
    participant P322 as .createFromTrack()
    participant P323 as generateId()
    participant P324 as recordFailure()
    participant P325 as consumePendingUpload()
    participant P326 as hasPendingUpload()
    participant P327 as getPendingUpload()
    participant P328 as updatePendingUpload()
    participant P329 as .buildStepMenu()
    participant P330 as addToMediaGroup()
    participant P331 as canSendNotification()
    participant P332 as markNotificationSent()
    participant P333 as cleanupStaleEntries()
    participant P334 as tick()
    participant P335 as update()
    participant P336 as reset()
    participant P337 as useAntiSpam()
    participant P338 as fireConfetti()
    participant P339 as useEnhancedStudioLogger()
    participant P340 as .get()
    participant P341 as generateNoteId()
    participant P342 as generateNoteId()
    participant P343 as getCachedImage()
    participant P344 as cleanupExpiredLyrics()
    participant P345 as createDefaultQueue()
    participant P346 as getSessionDuration()
    participant P347 as .cleanupInactiveElements()
    participant P348 as .get()
    participant P349 as .cleanup()
    participant P350 as .update()
    participant P351 as canShowUpsell()
    participant P352 as timePeriodToStartDate()
    participant P353 as trackGeneration()
    participant P354 as trackGenerationMetrics()
    participant P355 as timePeriodToStartDate()
    participant P356 as .createFromCloud()
    participant P357 as .createFromGuitar()
    participant P358 as checkAuth()
    participant P359 as checkCircuitBreaker()
    participant P360 as cleanupOldGuitarSessions()
    participant P361 as cleanupOldSessions()
    participant P362 as cleanupOldSessions()
    participant P363 as setConversationContext()
    participant P364 as setLastCommand()
    participant P365 as cleanupSessions()
    participant P366 as withMetrics()
    participant P367 as generateOrderId()
    participant P368 as generateTestUser()
    participant P369 as measureScrollFPS()
    participant P370 as handleDownload()
    participant P371 as formatTimeSince()
    participant P372 as handleDownload()
    participant P373 as showGenerationComplete()
    participant P374 as formatRelative()
    participant P375 as isWelcomeBonusExpired()
    participant P376 as useThrottledValue()
    participant P377 as useStudioActivityLogger()
    participant P378 as useFunnelAnalytics()
    participant P379 as useRetentionCohorts()
    participant P380 as .getStats()
    participant P381 as .startTimer()
    participant P382 as useRenderTime()
    participant P383 as createTimer()
    participant P384 as checkStorage()
    participant P385 as checkEdgeFunctions()
    participant P386 as checkTelegramBot()
    participant P387 as measureMemory()
    participant P388 as measureLoadTime()
    participant P389 as addSection
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
    P1->>+ P8: calls
    P8-->>- P1: return
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
    P1->>+ P13: calls
    P13-->>- P1: return
    P1->>+ P76: calls
    P76-->>- P1: return
    P1->>+ P77: calls
    P77-->>- P1: return
    P1->>+ P15: calls
    P15-->>- P1: return
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
    P1->>+ P26: calls
    P26-->>- P1: return
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
    P1->>+ P29: calls
    P29-->>- P1: return
    P1->>+ P130: calls
    P130-->>- P1: return
    P1->>+ P131: calls
    P131-->>- P1: return
    P1->>+ P30: calls
    P30-->>- P1: return
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
    P0->>+ P187: calls
    P187-->>- P0: return
    P0->>+ P188: calls
    P188-->>- P0: return
    P0->>+ P189: calls
    P189-->>- P0: return
    P0->>+ P190: calls
    P190-->>- P0: return
    P0->>+ P5: calls
    P5-->>- P0: return
    P0->>+ P63: calls
    P63-->>- P0: return
    P0->>+ P64: calls
    P64-->>- P0: return
    P0->>+ P66: calls
    P66-->>- P0: return
    P0->>+ P191: calls
    P191-->>- P0: return
    P0->>+ P8: calls
    P8-->>- P0: return
    P0->>+ P192: calls
    P192-->>- P0: return
    P0->>+ P69: calls
    P69-->>- P0: return
    P0->>+ P193: calls
    P193-->>- P0: return
    P0->>+ P74: calls
    P74-->>- P0: return
    P0->>+ P12: calls
    P12-->>- P0: return
    P0->>+ P194: calls
    P194-->>- P0: return
    P0->>+ P77: calls
    P77-->>- P0: return
    P0->>+ P195: calls
    P195-->>- P0: return
    P0->>+ P16: calls
    P16-->>- P0: return
    P0->>+ P196: calls
    P196-->>- P0: return
    P0->>+ P197: calls
    P197-->>- P0: return
    P0->>+ P198: calls
    P198-->>- P0: return
    P0->>+ P199: calls
    P199-->>- P0: return
    P0->>+ P200: calls
    P200-->>- P0: return
    P0->>+ P18: calls
    P18-->>- P0: return
    P0->>+ P201: calls
    P201-->>- P0: return
    P0->>+ P202: calls
    P202-->>- P0: return
    P0->>+ P19: calls
    P19-->>- P0: return
    P0->>+ P203: calls
    P203-->>- P0: return
    P0->>+ P204: calls
    P204-->>- P0: return
    P0->>+ P205: calls
    P205-->>- P0: return
    P0->>+ P206: calls
    P206-->>- P0: return
    P0->>+ P207: calls
    P207-->>- P0: return
    P0->>+ P93: calls
    P93-->>- P0: return
    P0->>+ P208: calls
    P208-->>- P0: return
    P0->>+ P101: calls
    P101-->>- P0: return
    P0->>+ P209: calls
    P209-->>- P0: return
    P0->>+ P210: calls
    P210-->>- P0: return
    P0->>+ P211: calls
    P211-->>- P0: return
    P0->>+ P212: calls
    P212-->>- P0: return
    P0->>+ P213: calls
    P213-->>- P0: return
    P0->>+ P214: calls
    P214-->>- P0: return
    P0->>+ P215: calls
    P215-->>- P0: return
    P0->>+ P216: calls
    P216-->>- P0: return
    P0->>+ P217: calls
    P217-->>- P0: return
    P0->>+ P218: calls
    P218-->>- P0: return
    P0->>+ P219: calls
    P219-->>- P0: return
    P0->>+ P220: calls
    P220-->>- P0: return
    P0->>+ P221: calls
    P221-->>- P0: return
    P0->>+ P222: calls
    P222-->>- P0: return
    P0->>+ P223: calls
    P223-->>- P0: return
    P0->>+ P224: calls
    P224-->>- P0: return
    P0->>+ P225: calls
    P225-->>- P0: return
    P0->>+ P226: calls
    P226-->>- P0: return
    P0->>+ P227: calls
    P227-->>- P0: return
    P0->>+ P119: calls
    P119-->>- P0: return
    P0->>+ P228: calls
    P228-->>- P0: return
    P0->>+ P229: calls
    P229-->>- P0: return
    P0->>+ P230: calls
    P230-->>- P0: return
    P0->>+ P231: calls
    P231-->>- P0: return
    P0->>+ P232: calls
    P232-->>- P0: return
    P0->>+ P233: calls
    P233-->>- P0: return
    P0->>+ P234: calls
    P234-->>- P0: return
    P0->>+ P235: calls
    P235-->>- P0: return
    P0->>+ P236: calls
    P236-->>- P0: return
    P0->>+ P237: calls
    P237-->>- P0: return
    P0->>+ P238: calls
    P238-->>- P0: return
    P0->>+ P239: calls
    P239-->>- P0: return
    P0->>+ P240: calls
    P240-->>- P0: return
    P0->>+ P241: calls
    P241-->>- P0: return
    P0->>+ P242: calls
    P242-->>- P0: return
    P0->>+ P131: calls
    P131-->>- P0: return
    P0->>+ P139: calls
    P139-->>- P0: return
    P0->>+ P243: calls
    P243-->>- P0: return
    P0->>+ P244: calls
    P244-->>- P0: return
    P0->>+ P245: calls
    P245-->>- P0: return
    P0->>+ P246: calls
    P246-->>- P0: return
    P0->>+ P247: calls
    P247-->>- P0: return
    P0->>+ P248: calls
    P248-->>- P0: return
    P0->>+ P249: calls
    P249-->>- P0: return
    P0->>+ P250: calls
    P250-->>- P0: return
    P0->>+ P251: calls
    P251-->>- P0: return
    P0->>+ P252: calls
    P252-->>- P0: return
    P0->>+ P253: calls
    P253-->>- P0: return
    P0->>+ P254: calls
    P254-->>- P0: return
    P0->>+ P255: calls
    P255-->>- P0: return
    P0->>+ P34: calls
    P34-->>- P0: return
    P0->>+ P256: calls
    P256-->>- P0: return
    P0->>+ P257: calls
    P257-->>- P0: return
    P0->>+ P35: calls
    P35-->>- P0: return
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
    P0->>+ P264: calls
    P264-->>- P0: return
    P0->>+ P265: calls
    P265-->>- P0: return
    P0->>+ P266: calls
    P266-->>- P0: return
    P0->>+ P267: calls
    P267-->>- P0: return
    P0->>+ P268: calls
    P268-->>- P0: return
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
    P0->>+ P275: calls
    P275-->>- P0: return
    P0->>+ P276: calls
    P276-->>- P0: return
    P0->>+ P277: calls
    P277-->>- P0: return
    P0->>+ P278: calls
    P278-->>- P0: return
    P0->>+ P279: calls
    P279-->>- P0: return
    P0->>+ P280: calls
    P280-->>- P0: return
    P0->>+ P281: calls
    P281-->>- P0: return
    P0->>+ P282: calls
    P282-->>- P0: return
    P0->>+ P283: calls
    P283-->>- P0: return
    P0->>+ P284: calls
    P284-->>- P0: return
    P0->>+ P285: calls
    P285-->>- P0: return
    P0->>+ P286: calls
    P286-->>- P0: return
    P0->>+ P287: calls
    P287-->>- P0: return
    P0->>+ P288: calls
    P288-->>- P0: return
    P0->>+ P289: calls
    P289-->>- P0: return
    P0->>+ P290: calls
    P290-->>- P0: return
    P0->>+ P291: calls
    P291-->>- P0: return
    P0->>+ P292: calls
    P292-->>- P0: return
    P0->>+ P293: calls
    P293-->>- P0: return
    P0->>+ P294: calls
    P294-->>- P0: return
    P0->>+ P295: calls
    P295-->>- P0: return
    P0->>+ P296: calls
    P296-->>- P0: return
    P0->>+ P297: calls
    P297-->>- P0: return
    P0->>+ P298: calls
    P298-->>- P0: return
    P0->>+ P299: calls
    P299-->>- P0: return
    P0->>+ P300: calls
    P300-->>- P0: return
    P0->>+ P301: calls
    P301-->>- P0: return
    P0->>+ P302: calls
    P302-->>- P0: return
    P0->>+ P303: calls
    P303-->>- P0: return
    P0->>+ P304: calls
    P304-->>- P0: return
    P0->>+ P305: calls
    P305-->>- P0: return
    P0->>+ P306: calls
    P306-->>- P0: return
    P0->>+ P307: calls
    P307-->>- P0: return
    P0->>+ P308: calls
    P308-->>- P0: return
    P0->>+ P309: calls
    P309-->>- P0: return
    P0->>+ P310: calls
    P310-->>- P0: return
    P0->>+ P311: calls
    P311-->>- P0: return
    P0->>+ P312: calls
    P312-->>- P0: return
    P0->>+ P313: calls
    P313-->>- P0: return
    P0->>+ P314: calls
    P314-->>- P0: return
    P0->>+ P315: calls
    P315-->>- P0: return
    P0->>+ P316: calls
    P316-->>- P0: return
    P0->>+ P317: calls
    P317-->>- P0: return
    P0->>+ P318: calls
    P318-->>- P0: return
    P0->>+ P319: calls
    P319-->>- P0: return
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
    P0->>+ P326: calls
    P326-->>- P0: return
    P0->>+ P327: calls
    P327-->>- P0: return
    P0->>+ P328: calls
    P328-->>- P0: return
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
```

## Connections by Relation

### calls
- [[sendMessage()]] `INFERRED`
- [[e()]] `INFERRED`
- [[constructor()]] `INFERRED`
- [[constructor()]] `INFERRED`
- [[uploadAndShowActions()]] `INFERRED`
- [[handleAudioActionCallback()]] `INFERRED`
- [[handleAutoUploadWithPipeline()]] `INFERRED`
- [[processVoiceMessage()]] `INFERRED`
- [[handleAudioMessage()]] `INFERRED`
- [[iu()]] `INFERRED`
- [[handleGuitarAudio()]] `INFERRED`
- [[navigateTo()]] `INFERRED`
- [[handleCloudUploadWithAnalysis()]] `INFERRED`
- [[handleCallbackQuery()]] `INFERRED`
- [[handleUpdate()]] `INFERRED`
- [[handleCheckTask()]] `INFERRED`
- [[handleSubmenu()]] `INFERRED`
- [[handleVoiceForGeneration()]] `INFERRED`
- [[.setActive()]] `INFERRED`
- [[sendAudio()]] `INFERRED`

### contains
- [[subscriptionStatus.test.ts]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*