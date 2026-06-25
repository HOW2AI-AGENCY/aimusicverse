# now

> God node · 219 connections · [D:\.MUSICVERSE\aimusicverse\tests\unit\subscriptionStatus.test.ts](file:///D:/.MUSICVERSE/aimusicverse/tests/unit/subscriptionStatus.test.ts#L132)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as now
    participant P1 as .get()
    participant P2 as getSupabaseClient()
    participant P3 as info
    participant P4 as initiateTariffPurchase()
    participant P5 as handleMidiCommand()
    participant P6 as startMidiConversion()
    participant P7 as showCloudFiles()
    participant P8 as getMenuItem()
    participant P9 as handlePianoCommand()
    participant P10 as showCloudTracks()
    participant P11 as loadTiers()
    participant P12 as getPendingUpload()
    participant P13 as consumePendingAudio()
    participant P14 as showFileDetails()
    participant P15 as loadMenuItems()
    participant P16 as processFeedbackMessage()
    participant P17 as sendFeedbackReply()
    participant P18 as loadCustomImages()
    participant P19 as updatePendingAudioAnalysis()
    participant P20 as setWizardState()
    participant P21 as showStemFiles()
    participant P22 as showMidiFiles()
    participant P23 as showMyRequests()
    participant P24 as showTracksList()
    participant P25 as handleMidiTrackCallback()
    participant P26 as setPendingUpload()
    participant P27 as consumePendingUpload()
    participant P28 as setPendingAudio()
    participant P29 as getPendingAudioWithoutConsuming()
    participant P30 as updatePendingUpload()
    participant P31 as showStorageInfo()
    participant P32 as loadTariffTiers()
    participant P33 as getUserByTelegramId()
    participant P34 as handleLikeTrack()
    participant P35 as flushLogBuffer()
    participant P36 as flushMetrics()
    participant P37 as checkRateLimitDb()
    participant P38 as storeFailedNotification()
    participant P39 as scheduleRetry()
    participant P40 as sendNotifications()
    participant P41 as cancelPendingUpload()
    participant P42 as setConversationContext()
    participant P43 as getWizardState()
    participant P44 as getUserByTelegramId()
    participant P45 as deleteFile()
    participant P46 as handleRating()
    participant P47 as getUserByTelegramId()
    participant P48 as markNotificationSuccess()
    participant P49 as markNotificationFailed()
    participant P50 as clearWizardState()
    participant P51 as cleanupSessions()
    participant P52 as executeWithRetry()
    participant P53 as checkAlerts()
    participant P54 as getPendingRetries()
    participant P55 as bind
    participant P56 as handleAudioActionCallback()
    participant P57 as getSession()
    participant P58 as handleProjects()
    participant P59 as .remove()
    participant P60 as sendTelegramAudio()
    participant P61 as processMediaGroupAction()
    participant P62 as handleProjectsCallback()
    participant P63 as getCachedAudio()
    participant P64 as handleCheckTask()
    participant P65 as handleGuitarAudio()
    participant P66 as .getState()
    participant P67 as .getState()
    participant P68 as handleWizardCallback()
    participant P69 as sendTelegramVideo()
    participant P70 as sendTelegramDocument()
    participant P71 as handleGenerateFromReference()
    participant P72 as .cleanup()
    participant P73 as .startWizard()
    participant P74 as sendLikeDigest()
    participant P75 as sendCommentDigest()
    participant P76 as .acquire()
    participant P77 as sendTelegramMessage()
    participant P78 as handleChordAnalysis()
    participant P79 as generateGuitarTab()
    participant P80 as handleRecognizeAudio()
    participant P81 as .cancelWizard()
    participant P82 as .nextStep()
    participant P83 as getPendingDigest()
    participant P84 as generateTab()
    participant P85 as trackFeature()
    participant P86 as getWaveform()
    participant P87 as generateThumbnails()
    participant P88 as pollForResult()
    participant P89 as handleTranscription()
    participant P90 as handleBeatAnalysis()
    participant P91 as handleFullAnalysis()
    participant P92 as getNavigationState()
    participant P93 as .handleInput()
    participant P94 as .showCurrentStep()
    participant P95 as .confirmWizard()
    participant P96 as getFileUrl()
    participant P97 as handleBuyProduct()
    participant P98 as .trackMessage()
    participant P99 as getTelegramConfig()
    participant P100 as evictOldEntries()
    participant P101 as memoize()
    participant P102 as sendTelegramProgress()
    participant P103 as recognizeFromUrl()
    participant P104 as .deleteExpired()
    participant P105 as .release()
    participant P106 as recordError()
    participant P107 as .getAudioElement()
    participant P108 as .removeAudioElement()
    participant P109 as validateAudioUrl()
    participant P110 as Projects()
    participant P111 as sendAlertToAdmins()
    participant P112 as downloadAndUploadStem()
    participant P113 as getAnalysisSession()
    participant P114 as getBotCommands()
    participant P115 as getFileUrl()
    participant P116 as buildKeyboard()
    participant P117 as processMediaGroup()
    participant P118 as addToPendingDigest()
    participant P119 as checkRateLimitFallback()
    participant P120 as checkRateLimit()
    participant P121 as .evictLowPriorityElement()
    participant P122 as shouldDedupe()
    participant P123 as getWaveformByTrackId()
    participant P124 as loadWithStandardFetch()
    participant P125 as editTelegramMessage()
    participant P126 as answerInlineQuery()
    participant P127 as saveBotCommands()
    participant P128 as .scheduleCleanup()
    participant P129 as cancelPendingUpload()
    participant P130 as .handleSelection()
    participant P131 as .previousStep()
    participant P132 as editInlineMessage()
    participant P133 as .getMessages()
    participant P134 as validateRequest()
    participant P135 as tinkoffCharge()
    participant P136 as checkRateLimit()
    participant P137 as updateAccessTimeInDB()
    participant P138 as .updatePriority()
    participant P139 as shouldReport()
    participant P140 as parseUTMParams()
    participant P141 as .releaseAudioElement()
    participant P142 as checkRangeSupport()
    participant P143 as syncBotCommands()
    participant P144 as deleteTelegramMessage()
    participant P145 as validateWebhookSignature()
    participant P146 as getFileInfo()
    participant P147 as processGenerationWithReference()
    participant P148 as processAddVocalsInstrumental()
    participant P149 as addToMediaGroup()
    participant P150 as canSendNotification()
    participant P151 as .clearChat()
    participant P152 as .removeFromCache()
    participant P153 as .cancelCleanup()
    participant P154 as handleWizardTextInput()
    participant P155 as callTelegramAPI()
    participant P156 as authorize()
    participant P157 as .trackRender()
    participant P158 as getCachedImage()
    participant P159 as getTelegramConfig()
    participant P160 as answerInlineQuery()
    participant P161 as .markPersistent()
    participant P162 as hasActiveWizard()
    participant P163 as getAuthenticatedUser()
    participant P164 as isServiceRoleToken()
    participant P165 as getFeedbackSession()
    participant P166 as .updateMetadata()
    participant P167 as getWizardStep()
    participant P168 as .getRenderCount()
    participant P169 as .set()
    participant P170 as uploadAndShowActions()
    participant P171 as navigateTo()
    participant P172 as processVoiceMessage()
    participant P173 as handleSubmenu()
    participant P174 as .setActive()
    participant P175 as createNotification()
    participant P176 as trackMessage()
    participant P177 as analyzeAudio()
    participant P178 as trackSunoGeneration()
    participant P179 as saveWizardState()
    participant P180 as cacheAudio()
    participant P181 as processQueueItem()
    participant P182 as handleVoiceForGeneration()
    participant P183 as setPendingUpload()
    participant P184 as .handleCallback()
    participant P185 as handleSave()
    participant P186 as cleanPlaybackPositions()
    participant P187 as .processQueue()
    participant P188 as handleApplyCrop()
    participant P189 as cleanStemAudioReference()
    participant P190 as detectBPM()
    participant P191 as .processSingleTask()
    participant P192 as .getActive()
    participant P193 as queueNotification()
    participant P194 as processNotification()
    participant P195 as handlePreCheckoutQuery()
    participant P196 as handleSuccessfulPayment()
    participant P197 as handleGuitarCommand()
    participant P198 as GlobalAudioProvider()
    participant P199 as usePaywallTrigger()
    participant P200 as loadPositions()
    participant P201 as buildSearchQuery()
    participant P202 as handleRecognizeCommand()
    participant P203 as handleProjectStats()
    participant P204 as handleImageUpload()
    participant P205 as handleFileUpload()
    participant P206 as handleRecordingComplete()
    participant P207 as handleFileSelect()
    participant P208 as uploadAndGetUrl()
    participant P209 as handleTranscribe()
    participant P210 as uploadAndAnalyze()
    participant P211 as handleFileUpload()
    participant P212 as handleFileSelect()
    participant P213 as handleUpload()
    participant P214 as cleanupExpiredEntries()
    participant P215 as getOrCreateSessionId()
    participant P216 as .enqueue()
    participant P217 as getOrCreateJourneySessionId()
    participant P218 as setWaitingForInput()
    participant P219 as processUploadAction()
    participant P220 as startProjectWizard()
    participant P221 as logApiCall()
    participant P222 as handleAddNewPrompt()
    participant P223 as activateTrial()
    participant P224 as getUserIdForRollout()
    participant P225 as setCachedLyrics()
    participant P226 as initTelemetry()
    participant P227 as recordMetric()
    participant P228 as startTimer()
    participant P229 as .generate()
    participant P230 as .evictOldestInactive()
    participant P231 as loadTone()
    participant P232 as .isCircuitBreakerOpen()
    participant P233 as refreshJourneySession()
    participant P234 as .createFromStem()
    participant P235 as .resolveAudioUrl()
    participant P236 as checkDatabase()
    participant P237 as getConfig()
    participant P238 as .pushToStack()
    participant P239 as .popFromStack()
    participant P240 as setPendingClassification()
    participant P241 as storeMediaGroupSession()
    participant P242 as storeVoiceTranscription()
    participant P243 as shouldSendDigest()
    participant P244 as .execute()
    participant P245 as runBenchmark()
    participant P246 as uploadAudioForAnalysis()
    participant P247 as parseLyrics()
    participant P248 as handleDuplicateSection()
    participant P249 as handleSelectInspiration()
    participant P250 as handleSaveToBookmarks()
    participant P251 as uploadFile()
    participant P252 as .set()
    participant P253 as uploadMenuItemImage()
    participant P254 as resetAllHints()
    participant P255 as .updateConnectionState()
    participant P256 as .recordMessage()
    participant P257 as updateAccessTime()
    participant P258 as .getActiveElements()
    participant P259 as .tryAcquire()
    participant P260 as cleanupCache()
    participant P261 as setCachedImage()
    participant P262 as frame()
    participant P263 as .recordFailure()
    participant P264 as .createFromUpload()
    participant P265 as .createFromRecording()
    participant P266 as .createFromCloud()
    participant P267 as .createFromCreativeTool()
    participant P268 as .createFromGuitar()
    participant P269 as .createFromTrack()
    participant P270 as checkGenerationQueue()
    participant P271 as getMetrics()
    participant P272 as calculateFailureRate()
    participant P273 as recordFailure()
    participant P274 as validateTelegramWebAppData()
    participant P275 as cleanupOldGuitarSessions()
    participant P276 as cleanupOldSessions()
    participant P277 as cleanupOldSessions()
    participant P278 as hasPendingUpload()
    participant P279 as getPendingUpload()
    participant P280 as updatePendingUpload()
    participant P281 as .buildStepMenu()
    participant P282 as markNotificationSent()
    participant P283 as showCustomPromptInput()
    participant P284 as triggerConfetti()
    participant P285 as handleAddSection()
    participant P286 as addSection()
    participant P287 as useAntiSpam()
    participant P288 as componentDidCatch()
    participant P289 as fireConfetti()
    participant P290 as .get()
    participant P291 as setLastShownAt()
    participant P292 as useAudioPerformanceMonitor()
    participant P293 as .checkConnectionHealth()
    participant P294 as .exportMetrics()
    participant P295 as useChannelMonitoring()
    participant P296 as cleanupRegistry()
    participant P297 as cleanupExpiredLyrics()
    participant P298 as getSessionDuration()
    participant P299 as .cleanupInactiveElements()
    participant P300 as .cleanup()
    participant P301 as parseLyricsToSections()
    participant P302 as trackGeneration()
    participant P303 as trackGenerationMetrics()
    participant P304 as getRandomArtStyle()
    participant P305 as checkAuth()
    participant P306 as checkCircuitBreaker()
    participant P307 as handleMidiUploadCallback()
    participant P308 as consumePendingUpload()
    participant P309 as setConversationContext()
    participant P310 as setLastCommand()
    participant P311 as withMetrics()
    participant P312 as cleanupStaleEntries()
    participant P313 as measureScrollFPS()
    participant P314 as handleDownload()
    participant P315 as formatTimeSince()
    participant P316 as handleDownload()
    participant P317 as parseLyrics()
    participant P318 as updateProgress()
    participant P319 as update()
    participant P320 as useEnhancedStudioLogger()
    participant P321 as handleExport()
    participant P322 as handleAddSection()
    participant P323 as generateNoteId()
    participant P324 as useThrottledValue()
    participant P325 as useStudioActivityLogger()
    participant P326 as useStudioAnalytics()
    participant P327 as generateNoteId()
    participant P328 as useFunnelAnalytics()
    participant P329 as useRetentionCohorts()
    participant P330 as measureLatency()
    participant P331 as generateA11yId()
    participant P332 as .getStats()
    participant P333 as isCommentRateLimitExceeded()
    participant P334 as isFollowRateLimitExceeded()
    participant P335 as isLikeRateLimitExceeded()
    participant P336 as .startTimer()
    participant P337 as useRenderTime()
    participant P338 as createTimer()
    participant P339 as .update()
    participant P340 as generateId()
    participant P341 as checkStorage()
    participant P342 as checkEdgeFunctions()
    participant P343 as checkTelegramBot()
    participant P344 as cleanupSessions()
    participant P345 as generateOrderId()
    participant P346 as generateTestUser()
    participant P347 as measureMemory()
    participant P348 as measureLoadTime()
    P0->>+ P1: calls
    P1-->>- P0: return
    P1->>+ P0: calls
    P0-->>- P1: return
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
    P1->>+ P6: calls
    P6-->>- P1: return
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
    P1->>+ P40: calls
    P40-->>- P1: return
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
    P0->>+ P169: calls
    P169-->>- P0: return
    P0->>+ P170: calls
    P170-->>- P0: return
    P0->>+ P56: calls
    P56-->>- P0: return
    P0->>+ P171: calls
    P171-->>- P0: return
    P0->>+ P172: calls
    P172-->>- P0: return
    P0->>+ P57: calls
    P57-->>- P0: return
    P0->>+ P173: calls
    P173-->>- P0: return
    P0->>+ P174: calls
    P174-->>- P0: return
    P0->>+ P63: calls
    P63-->>- P0: return
    P0->>+ P175: calls
    P175-->>- P0: return
    P0->>+ P64: calls
    P64-->>- P0: return
    P0->>+ P65: calls
    P65-->>- P0: return
    P0->>+ P66: calls
    P66-->>- P0: return
    P0->>+ P176: calls
    P176-->>- P0: return
    P0->>+ P177: calls
    P177-->>- P0: return
    P0->>+ P178: calls
    P178-->>- P0: return
    P0->>+ P179: calls
    P179-->>- P0: return
    P0->>+ P180: calls
    P180-->>- P0: return
    P0->>+ P181: calls
    P181-->>- P0: return
    P0->>+ P67: calls
    P67-->>- P0: return
    P0->>+ P182: calls
    P182-->>- P0: return
    P0->>+ P183: calls
    P183-->>- P0: return
    P0->>+ P73: calls
    P73-->>- P0: return
    P0->>+ P184: calls
    P184-->>- P0: return
    P0->>+ P185: calls
    P185-->>- P0: return
    P0->>+ P76: calls
    P76-->>- P0: return
    P0->>+ P186: calls
    P186-->>- P0: return
    P0->>+ P187: calls
    P187-->>- P0: return
    P0->>+ P11: calls
    P11-->>- P0: return
    P0->>+ P83: calls
    P83-->>- P0: return
    P0->>+ P188: calls
    P188-->>- P0: return
    P0->>+ P189: calls
    P189-->>- P0: return
    P0->>+ P85: calls
    P85-->>- P0: return
    P0->>+ P190: calls
    P190-->>- P0: return
    P0->>+ P191: calls
    P191-->>- P0: return
    P0->>+ P192: calls
    P192-->>- P0: return
    P0->>+ P193: calls
    P193-->>- P0: return
    P0->>+ P194: calls
    P194-->>- P0: return
    P0->>+ P195: calls
    P195-->>- P0: return
    P0->>+ P196: calls
    P196-->>- P0: return
    P0->>+ P197: calls
    P197-->>- P0: return
    P0->>+ P12: calls
    P12-->>- P0: return
    P0->>+ P18: calls
    P18-->>- P0: return
    P0->>+ P98: calls
    P98-->>- P0: return
    P0->>+ P100: calls
    P100-->>- P0: return
    P0->>+ P198: calls
    P198-->>- P0: return
    P0->>+ P199: calls
    P199-->>- P0: return
    P0->>+ P200: calls
    P200-->>- P0: return
    P0->>+ P102: calls
    P102-->>- P0: return
    P0->>+ P201: calls
    P201-->>- P0: return
    P0->>+ P202: calls
    P202-->>- P0: return
    P0->>+ P20: calls
    P20-->>- P0: return
    P0->>+ P203: calls
    P203-->>- P0: return
    P0->>+ P24: calls
    P24-->>- P0: return
    P0->>+ P104: calls
    P104-->>- P0: return
    P0->>+ P204: calls
    P204-->>- P0: return
    P0->>+ P205: calls
    P205-->>- P0: return
    P0->>+ P206: calls
    P206-->>- P0: return
    P0->>+ P207: calls
    P207-->>- P0: return
    P0->>+ P208: calls
    P208-->>- P0: return
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
    P0->>+ P106: calls
    P106-->>- P0: return
    P0->>+ P215: calls
    P215-->>- P0: return
    P0->>+ P107: calls
    P107-->>- P0: return
    P0->>+ P216: calls
    P216-->>- P0: return
    P0->>+ P109: calls
    P109-->>- P0: return
    P0->>+ P217: calls
    P217-->>- P0: return
    P0->>+ P26: calls
    P26-->>- P0: return
    P0->>+ P28: calls
    P28-->>- P0: return
    P0->>+ P218: calls
    P218-->>- P0: return
    P0->>+ P219: calls
    P219-->>- P0: return
    P0->>+ P118: calls
    P118-->>- P0: return
    P0->>+ P38: calls
    P38-->>- P0: return
    P0->>+ P39: calls
    P39-->>- P0: return
    P0->>+ P220: calls
    P220-->>- P0: return
    P0->>+ P221: calls
    P221-->>- P0: return
    P0->>+ P120: calls
    P120-->>- P0: return
    P0->>+ P222: calls
    P222-->>- P0: return
    P0->>+ P223: calls
    P223-->>- P0: return
    P0->>+ P121: calls
    P121-->>- P0: return
    P0->>+ P224: calls
    P224-->>- P0: return
    P0->>+ P225: calls
    P225-->>- P0: return
    P0->>+ P122: calls
    P122-->>- P0: return
    P0->>+ P226: calls
    P226-->>- P0: return
    P0->>+ P227: calls
    P227-->>- P0: return
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
    P0->>+ P256: calls
    P256-->>- P0: return
    P0->>+ P257: calls
    P257-->>- P0: return
    P0->>+ P138: calls
    P138-->>- P0: return
    P0->>+ P258: calls
    P258-->>- P0: return
    P0->>+ P259: calls
    P259-->>- P0: return
    P0->>+ P139: calls
    P139-->>- P0: return
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
    P0->>+ P149: calls
    P149-->>- P0: return
    P0->>+ P150: calls
    P150-->>- P0: return
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
    P0->>+ P158: calls
    P158-->>- P0: return
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
    P0->>+ P162: calls
    P162-->>- P0: return
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
```

## Connections by Relation

### calls
- [[.get()]] `INFERRED`
- [[.set()]] `INFERRED`
- [[uploadAndShowActions()]] `INFERRED`
- [[handleAudioActionCallback()]] `INFERRED`
- [[navigateTo()]] `INFERRED`
- [[processVoiceMessage()]] `INFERRED`
- [[getSession()]] `INFERRED`
- [[handleSubmenu()]] `INFERRED`
- [[.setActive()]] `INFERRED`
- [[getCachedAudio()]] `INFERRED`
- [[createNotification()]] `INFERRED`
- [[handleCheckTask()]] `INFERRED`
- [[handleGuitarAudio()]] `INFERRED`
- [[.getState()]] `INFERRED`
- [[trackMessage()]] `INFERRED`
- [[analyzeAudio()]] `INFERRED`
- [[trackSunoGeneration()]] `INFERRED`
- [[saveWizardState()]] `INFERRED`
- [[cacheAudio()]] `INFERRED`
- [[processQueueItem()]] `INFERRED`

### contains
- [[subscriptionStatus.test.ts]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*