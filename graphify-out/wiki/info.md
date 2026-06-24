# info

> God node · 140 connections · [D:\.MUSICVERSE\aimusicverse\src\lib\__tests__\audioFormatUtils.test.ts](file:///D:/.MUSICVERSE/aimusicverse/src/lib/__tests__/audioFormatUtils.test.ts#L42)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as info
    participant P1 as getSupabaseClient()
    participant P2 as .get()
    participant P3 as now
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
    participant P123 as initiateTariffPurchase()
    participant P124 as handleMidiCommand()
    participant P125 as showCloudFiles()
    participant P126 as handlePianoCommand()
    participant P127 as getMenuItem()
    participant P128 as showCloudTracks()
    participant P129 as showFileDetails()
    participant P130 as processFeedbackMessage()
    participant P131 as sendFeedbackReply()
    participant P132 as loadTiers()
    participant P133 as handleMidiTrackCallback()
    participant P134 as getPendingUpload()
    participant P135 as consumePendingAudio()
    participant P136 as showStemFiles()
    participant P137 as showMidiFiles()
    participant P138 as loadMenuItems()
    participant P139 as showMyRequests()
    participant P140 as showTracksList()
    participant P141 as loadCustomImages()
    participant P142 as storeFailedNotification()
    participant P143 as setPendingAudio()
    participant P144 as updatePendingAudioAnalysis()
    participant P145 as setWizardState()
    participant P146 as showStorageInfo()
    participant P147 as handleLikeTrack()
    participant P148 as setPendingUpload()
    participant P149 as consumePendingUpload()
    participant P150 as getPendingAudioWithoutConsuming()
    participant P151 as updatePendingUpload()
    participant P152 as deleteFile()
    participant P153 as loadTariffTiers()
    participant P154 as getUserByTelegramId()
    participant P155 as handleRating()
    participant P156 as flushLogBuffer()
    participant P157 as flushMetrics()
    participant P158 as checkRateLimitDb()
    participant P159 as scheduleRetry()
    participant P160 as cancelPendingUpload()
    participant P161 as setConversationContext()
    participant P162 as getWizardState()
    participant P163 as getUserByTelegramId()
    participant P164 as getUserByTelegramId()
    participant P165 as markNotificationSuccess()
    participant P166 as markNotificationFailed()
    participant P167 as clearWizardState()
    participant P168 as cleanupSessions()
    participant P169 as executeWithRetry()
    participant P170 as checkAlerts()
    participant P171 as getPendingRetries()
    participant P172 as bind
    participant P173 as handleDeepLink()
    participant P174 as uploadAndShowActions()
    participant P175 as processVoiceMessage()
    participant P176 as handleClassificationCallback()
    participant P177 as handleCallbackQuery()
    participant P178 as deleteAndSendNewMenuPhoto()
    participant P179 as handleUpdate()
    participant P180 as handleAutoUploadWithPipeline()
    participant P181 as sendNotification()
    participant P182 as trackConversionStage()
    participant P183 as .setActive()
    participant P184 as handleInlineQuery()
    participant P185 as trackDeeplinkVisit()
    participant P186 as analyzeAudio()
    participant P187 as handleInlineQuery()
    participant P188 as createProject()
    participant P189 as togglePlay()
    participant P190 as resumeAudioContext()
    participant P191 as processQueueItem()
    participant P192 as getOrCreateAudioNodes()
    participant P193 as .analyze()
    participant P194 as showAudioClassificationPromptInternal()
    participant P195 as handleChosenInlineResult()
    participant P196 as sendFollowerDigest()
    participant P197 as cleanPlaybackPositions()
    participant P198 as createTinkoffPayment()
    participant P199 as deleteTrackWithCleanup()
    participant P200 as handleCheckStemsStatus()
    participant P201 as handleBuyCommand()
    participant P202 as ensureAudioRoutedToDestination()
    participant P203 as cleanStemAudioReference()
    participant P204 as cleanupStaleData()
    participant P205 as detectBPM()
    participant P206 as .sendImmediate()
    participant P207 as processNotification()
    participant P208 as handlePreCheckoutQuery()
    participant P209 as handleSuccessfulPayment()
    participant P210 as getApiModelName()
    participant P211 as handleStemSeparation()
    participant P212 as handleDownloadStems()
    participant P213 as startProjectWizard()
    participant P214 as handleTranscribe()
    participant P215 as registerAudioServiceWorker()
    participant P216 as .initialize()
    participant P217 as flushBufferedDeeplinkTracks()
    participant P218 as cancelTinkoffSubscription()
    participant P219 as deleteAndSendNewMenu()
    participant P220 as .deleteCategory()
    participant P221 as checkUserQuota()
    participant P222 as validateFeatureAccess()
    participant P223 as analyzeAudio()
    participant P224 as handleFileSelect()
    participant P225 as handleUpload()
    participant P226 as cleanupExpiredEntries()
    participant P227 as resetAudioContext()
    participant P228 as exportAnalytics()
    participant P229 as addSectionNote()
    participant P230 as deleteStorageFiles()
    participant P231 as .clearActive()
    participant P232 as startInlineGeneration()
    participant P233 as deductCredits()
    participant P234 as extractLyrics()
    participant P235 as handleQuickGenerate()
    participant P236 as handleAddShortcut()
    participant P237 as saveGuitarAnalysisForTrack()
    participant P238 as logAudioDiagnostics()
    participant P239 as initTelemetry()
    participant P240 as .completeStep()
    participant P241 as .skipWorkflow()
    participant P242 as .constructor()
    participant P243 as .evictOldestInactive()
    participant P244 as .cleanup()
    participant P245 as loadTone()
    participant P246 as chargeForGeneration()
    participant P247 as saveLyricsWithVersioning()
    participant P248 as .isCircuitBreakerOpen()
    participant P249 as fetchWithRetry()
    participant P250 as .deleteTemporary()
    participant P251 as .execute()
    participant P252 as setupWebhook()
    participant P253 as handleForceAlert()
    participant P254 as handleSeparateStems()
    participant P255 as handleAutoFix()
    participant P256 as handleNext()
    participant P257 as retryWithBackoff()
    participant P258 as saveFirstGeneratedTrack()
    participant P259 as .releaseAll()
    participant P260 as clearAudioCacheViaSW()
    participant P261 as restoreLyricsVersion()
    participant P262 as editSectionNote()
    participant P263 as batchAddSectionNotes()
    participant P264 as .analyzeWithFlamingo()
    participant P265 as .analyzeWithLovableAI()
    participant P266 as .analyzeWithKlangio()
    participant P267 as handleTrackChosen()
    participant P268 as checkAllLoaded()
    participant P269 as handleSkip()
    participant P270 as clearFirstGeneratedTrack()
    participant P271 as initSentry()
    participant P272 as .startWorkflow()
    participant P273 as .clearState()
    participant P274 as .cleanupInactiveElements()
    participant P275 as deleteSectionNote()
    participant P276 as batchSaveLyrics()
    participant P277 as cleanupExpiredNotifications()
    participant P278 as checkCircuitBreaker()
    participant P279 as .registerWizard()
    participant P280 as handleGenerationChosen()
    participant P281 as handleProjectChosen()
    participant P282 as handleProjectSelect()
    participant P283 as toggleMood()
    participant P284 as handleProjectSelect()
    participant P285 as toggleMood()
    participant P286 as handleClearSaved()
    participant P287 as handleCreatePlaylist()
    participant P288 as .constructor()
    participant P289 as clearAllAppStorage()
    participant P290 as handleTabExport()
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
    P1->>+ P9: calls
    P9-->>- P1: return
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
    P1->>+ P77: calls
    P77-->>- P1: return
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
    P0->>+ P123: calls
    P123-->>- P0: return
    P0->>+ P179: calls
    P179-->>- P0: return
    P0->>+ P180: calls
    P180-->>- P0: return
    P0->>+ P181: calls
    P181-->>- P0: return
    P0->>+ P182: calls
    P182-->>- P0: return
    P0->>+ P183: calls
    P183-->>- P0: return
    P0->>+ P184: calls
    P184-->>- P0: return
    P0->>+ P185: calls
    P185-->>- P0: return
    P0->>+ P12: calls
    P12-->>- P0: return
    P0->>+ P15: calls
    P15-->>- P0: return
    P0->>+ P186: calls
    P186-->>- P0: return
    P0->>+ P187: calls
    P187-->>- P0: return
    P0->>+ P188: calls
    P188-->>- P0: return
    P0->>+ P189: calls
    P189-->>- P0: return
    P0->>+ P190: calls
    P190-->>- P0: return
    P0->>+ P191: calls
    P191-->>- P0: return
    P0->>+ P21: calls
    P21-->>- P0: return
    P0->>+ P22: calls
    P22-->>- P0: return
    P0->>+ P23: calls
    P23-->>- P0: return
    P0->>+ P192: calls
    P192-->>- P0: return
    P0->>+ P193: calls
    P193-->>- P0: return
    P0->>+ P24: calls
    P24-->>- P0: return
    P0->>+ P25: calls
    P25-->>- P0: return
    P0->>+ P30: calls
    P30-->>- P0: return
    P0->>+ P194: calls
    P194-->>- P0: return
    P0->>+ P195: calls
    P195-->>- P0: return
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
    P0->>+ P34: calls
    P34-->>- P0: return
    P0->>+ P130: calls
    P130-->>- P0: return
    P0->>+ P131: calls
    P131-->>- P0: return
    P0->>+ P201: calls
    P201-->>- P0: return
    P0->>+ P36: calls
    P36-->>- P0: return
    P0->>+ P202: calls
    P202-->>- P0: return
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
    P0->>+ P42: calls
    P42-->>- P0: return
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
    P0->>+ P47: calls
    P47-->>- P0: return
    P0->>+ P142: calls
    P142-->>- P0: return
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
    P0->>+ P55: calls
    P55-->>- P0: return
    P0->>+ P220: calls
    P220-->>- P0: return
    P0->>+ P56: calls
    P56-->>- P0: return
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
    P0->>+ P228: calls
    P228-->>- P0: return
    P0->>+ P229: calls
    P229-->>- P0: return
    P0->>+ P230: calls
    P230-->>- P0: return
    P0->>+ P231: calls
    P231-->>- P0: return
    P0->>+ P63: calls
    P63-->>- P0: return
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
    P0->>+ P106: calls
    P106-->>- P0: return
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
```

## Connections by Relation

### calls
- [[getSupabaseClient()]] `INFERRED`
- [[handleDeepLink()]] `INFERRED`
- [[uploadAndShowActions()]] `INFERRED`
- [[processVoiceMessage()]] `INFERRED`
- [[handleClassificationCallback()]] `INFERRED`
- [[handleCallbackQuery()]] `INFERRED`
- [[deleteAndSendNewMenuPhoto()]] `INFERRED`
- [[initiateTariffPurchase()]] `INFERRED`
- [[handleUpdate()]] `INFERRED`
- [[handleAutoUploadWithPipeline()]] `INFERRED`
- [[sendNotification()]] `INFERRED`
- [[trackConversionStage()]] `INFERRED`
- [[.setActive()]] `INFERRED`
- [[handleInlineQuery()]] `INFERRED`
- [[trackDeeplinkVisit()]] `INFERRED`
- [[sendTelegramAudio()]] `INFERRED`
- [[handleGenerateFromReference()]] `INFERRED`
- [[analyzeAudio()]] `INFERRED`
- [[handleInlineQuery()]] `INFERRED`
- [[createProject()]] `INFERRED`

### contains
- [[audioFormatUtils.test.ts]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*