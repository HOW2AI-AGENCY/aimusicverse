# info

> God node · 135 connections · [D:\.MUSICVERSE\aimusicverse\src\lib\__tests__\audioFormatUtils.test.ts](file:///D:/.MUSICVERSE/aimusicverse/src/lib/__tests__/audioFormatUtils.test.ts#L42)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as info
    participant P1 as getSupabaseClient()
    participant P2 as .get()
    participant P3 as now
    participant P4 as handleAudioActionCallback()
    participant P5 as getSession()
    participant P6 as handleProjects()
    participant P7 as .remove()
    participant P8 as sendTelegramAudio()
    participant P9 as processMediaGroupAction()
    participant P10 as handleProjectsCallback()
    participant P11 as getCachedAudio()
    participant P12 as handleCheckTask()
    participant P13 as handleGuitarAudio()
    participant P14 as .getState()
    participant P15 as startMidiConversion()
    participant P16 as .getState()
    participant P17 as handleWizardCallback()
    participant P18 as sendTelegramVideo()
    participant P19 as sendTelegramDocument()
    participant P20 as handleGenerateFromReference()
    participant P21 as .cleanup()
    participant P22 as .startWizard()
    participant P23 as sendLikeDigest()
    participant P24 as sendCommentDigest()
    participant P25 as .acquire()
    participant P26 as sendTelegramMessage()
    participant P27 as handleChordAnalysis()
    participant P28 as generateGuitarTab()
    participant P29 as handleRecognizeAudio()
    participant P30 as .cancelWizard()
    participant P31 as .nextStep()
    participant P32 as getPendingDigest()
    participant P33 as generateTab()
    participant P34 as trackFeature()
    participant P35 as getWaveform()
    participant P36 as generateThumbnails()
    participant P37 as pollForResult()
    participant P38 as handleTranscription()
    participant P39 as handleBeatAnalysis()
    participant P40 as handleFullAnalysis()
    participant P41 as getNavigationState()
    participant P42 as .handleInput()
    participant P43 as .showCurrentStep()
    participant P44 as .confirmWizard()
    participant P45 as getFileUrl()
    participant P46 as handleBuyProduct()
    participant P47 as .trackMessage()
    participant P48 as getTelegramConfig()
    participant P49 as evictOldEntries()
    participant P50 as memoize()
    participant P51 as sendTelegramProgress()
    participant P52 as recognizeFromUrl()
    participant P53 as .deleteExpired()
    participant P54 as .release()
    participant P55 as recordError()
    participant P56 as .getAudioElement()
    participant P57 as .removeAudioElement()
    participant P58 as validateAudioUrl()
    participant P59 as Projects()
    participant P60 as sendAlertToAdmins()
    participant P61 as downloadAndUploadStem()
    participant P62 as getAnalysisSession()
    participant P63 as getBotCommands()
    participant P64 as getFileUrl()
    participant P65 as buildKeyboard()
    participant P66 as processMediaGroup()
    participant P67 as addToPendingDigest()
    participant P68 as checkRateLimitFallback()
    participant P69 as checkRateLimit()
    participant P70 as .evictLowPriorityElement()
    participant P71 as shouldDedupe()
    participant P72 as getWaveformByTrackId()
    participant P73 as loadWithStandardFetch()
    participant P74 as sendNotifications()
    participant P75 as editTelegramMessage()
    participant P76 as answerInlineQuery()
    participant P77 as saveBotCommands()
    participant P78 as .scheduleCleanup()
    participant P79 as cancelPendingUpload()
    participant P80 as .handleSelection()
    participant P81 as .previousStep()
    participant P82 as editInlineMessage()
    participant P83 as .getMessages()
    participant P84 as validateRequest()
    participant P85 as tinkoffCharge()
    participant P86 as checkRateLimit()
    participant P87 as updateAccessTimeInDB()
    participant P88 as .updatePriority()
    participant P89 as shouldReport()
    participant P90 as parseUTMParams()
    participant P91 as .releaseAudioElement()
    participant P92 as checkRangeSupport()
    participant P93 as syncBotCommands()
    participant P94 as deleteTelegramMessage()
    participant P95 as validateWebhookSignature()
    participant P96 as getFileInfo()
    participant P97 as processGenerationWithReference()
    participant P98 as processAddVocalsInstrumental()
    participant P99 as addToMediaGroup()
    participant P100 as canSendNotification()
    participant P101 as .clearChat()
    participant P102 as .removeFromCache()
    participant P103 as .cancelCleanup()
    participant P104 as handleWizardTextInput()
    participant P105 as callTelegramAPI()
    participant P106 as authorize()
    participant P107 as .trackRender()
    participant P108 as getCachedImage()
    participant P109 as getTelegramConfig()
    participant P110 as answerInlineQuery()
    participant P111 as .markPersistent()
    participant P112 as hasActiveWizard()
    participant P113 as getAuthenticatedUser()
    participant P114 as isServiceRoleToken()
    participant P115 as getFeedbackSession()
    participant P116 as .updateMetadata()
    participant P117 as getWizardStep()
    participant P118 as .getRenderCount()
    participant P119 as initiateTariffPurchase()
    participant P120 as handleMidiCommand()
    participant P121 as showCloudFiles()
    participant P122 as getMenuItem()
    participant P123 as handlePianoCommand()
    participant P124 as showCloudTracks()
    participant P125 as loadTiers()
    participant P126 as getPendingUpload()
    participant P127 as consumePendingAudio()
    participant P128 as showFileDetails()
    participant P129 as loadMenuItems()
    participant P130 as processFeedbackMessage()
    participant P131 as sendFeedbackReply()
    participant P132 as loadCustomImages()
    participant P133 as updatePendingAudioAnalysis()
    participant P134 as setWizardState()
    participant P135 as showStemFiles()
    participant P136 as showMidiFiles()
    participant P137 as showMyRequests()
    participant P138 as showTracksList()
    participant P139 as handleMidiTrackCallback()
    participant P140 as setPendingUpload()
    participant P141 as consumePendingUpload()
    participant P142 as setPendingAudio()
    participant P143 as getPendingAudioWithoutConsuming()
    participant P144 as updatePendingUpload()
    participant P145 as showStorageInfo()
    participant P146 as loadTariffTiers()
    participant P147 as getUserByTelegramId()
    participant P148 as handleLikeTrack()
    participant P149 as flushLogBuffer()
    participant P150 as flushMetrics()
    participant P151 as checkRateLimitDb()
    participant P152 as storeFailedNotification()
    participant P153 as scheduleRetry()
    participant P154 as cancelPendingUpload()
    participant P155 as setConversationContext()
    participant P156 as getWizardState()
    participant P157 as getUserByTelegramId()
    participant P158 as deleteFile()
    participant P159 as handleRating()
    participant P160 as getUserByTelegramId()
    participant P161 as markNotificationSuccess()
    participant P162 as markNotificationFailed()
    participant P163 as clearWizardState()
    participant P164 as cleanupSessions()
    participant P165 as executeWithRetry()
    participant P166 as checkAlerts()
    participant P167 as getPendingRetries()
    participant P168 as bind
    participant P169 as handleDeepLink()
    participant P170 as uploadAndShowActions()
    participant P171 as deleteAndSendNewMenuPhoto()
    participant P172 as handleClassificationCallback()
    participant P173 as processVoiceMessage()
    participant P174 as trackConversionStage()
    participant P175 as .setActive()
    participant P176 as handleInlineQuery()
    participant P177 as sendNotification()
    participant P178 as trackDeeplinkVisit()
    participant P179 as analyzeAudio()
    participant P180 as togglePlay()
    participant P181 as resumeAudioContext()
    participant P182 as processQueueItem()
    participant P183 as handleInlineQuery()
    participant P184 as getOrCreateAudioNodes()
    participant P185 as .analyze()
    participant P186 as handleChosenInlineResult()
    participant P187 as createProject()
    participant P188 as cleanPlaybackPositions()
    participant P189 as createTinkoffPayment()
    participant P190 as deleteTrackWithCleanup()
    participant P191 as sendFollowerDigest()
    participant P192 as ensureAudioRoutedToDestination()
    participant P193 as cleanStemAudioReference()
    participant P194 as cleanupStaleData()
    participant P195 as detectBPM()
    participant P196 as .sendImmediate()
    participant P197 as processNotification()
    participant P198 as handlePreCheckoutQuery()
    participant P199 as handleSuccessfulPayment()
    participant P200 as getApiModelName()
    participant P201 as handleTranscribe()
    participant P202 as registerAudioServiceWorker()
    participant P203 as .initialize()
    participant P204 as flushBufferedDeeplinkTracks()
    participant P205 as cancelTinkoffSubscription()
    participant P206 as handleCheckStemsStatus()
    participant P207 as handleBuyCommand()
    participant P208 as .deleteCategory()
    participant P209 as checkUserQuota()
    participant P210 as validateFeatureAccess()
    participant P211 as analyzeAudio()
    participant P212 as handleFileSelect()
    participant P213 as handleUpload()
    participant P214 as cleanupExpiredEntries()
    participant P215 as resetAudioContext()
    participant P216 as exportAnalytics()
    participant P217 as addSectionNote()
    participant P218 as deleteStorageFiles()
    participant P219 as .clearActive()
    participant P220 as handleStemSeparation()
    participant P221 as handleDownloadStems()
    participant P222 as deleteAndSendNewMenu()
    participant P223 as startInlineGeneration()
    participant P224 as deductCredits()
    participant P225 as startProjectWizard()
    participant P226 as extractLyrics()
    participant P227 as handleQuickGenerate()
    participant P228 as handleAddShortcut()
    participant P229 as saveGuitarAnalysisForTrack()
    participant P230 as logAudioDiagnostics()
    participant P231 as initTelemetry()
    participant P232 as .completeStep()
    participant P233 as .skipWorkflow()
    participant P234 as .constructor()
    participant P235 as .evictOldestInactive()
    participant P236 as .cleanup()
    participant P237 as loadTone()
    participant P238 as chargeForGeneration()
    participant P239 as saveLyricsWithVersioning()
    participant P240 as .isCircuitBreakerOpen()
    participant P241 as fetchWithRetry()
    participant P242 as .deleteTemporary()
    participant P243 as .execute()
    participant P244 as setupWebhook()
    participant P245 as handleForceAlert()
    participant P246 as handleSeparateStems()
    participant P247 as handleAutoFix()
    participant P248 as handleNext()
    participant P249 as retryWithBackoff()
    participant P250 as saveFirstGeneratedTrack()
    participant P251 as .releaseAll()
    participant P252 as clearAudioCacheViaSW()
    participant P253 as restoreLyricsVersion()
    participant P254 as editSectionNote()
    participant P255 as batchAddSectionNotes()
    participant P256 as .analyzeWithFlamingo()
    participant P257 as .analyzeWithLovableAI()
    participant P258 as .analyzeWithKlangio()
    participant P259 as handleTrackChosen()
    participant P260 as checkAllLoaded()
    participant P261 as handleSkip()
    participant P262 as clearFirstGeneratedTrack()
    participant P263 as initSentry()
    participant P264 as .startWorkflow()
    participant P265 as .clearState()
    participant P266 as .cleanupInactiveElements()
    participant P267 as deleteSectionNote()
    participant P268 as batchSaveLyrics()
    participant P269 as cleanupExpiredNotifications()
    participant P270 as checkCircuitBreaker()
    participant P271 as .registerWizard()
    participant P272 as handleGenerationChosen()
    participant P273 as handleProjectChosen()
    participant P274 as handleProjectSelect()
    participant P275 as toggleMood()
    participant P276 as handleProjectSelect()
    participant P277 as toggleMood()
    participant P278 as handleClearSaved()
    participant P279 as handleCreatePlaylist()
    participant P280 as .constructor()
    participant P281 as clearAllAppStorage()
    participant P282 as handleTabExport()
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
    P1->>+ P119: calls
    P119-->>- P1: return
    P1->>+ P120: calls
    P120-->>- P1: return
    P1->>+ P15: calls
    P15-->>- P1: return
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
    P1->>+ P74: calls
    P74-->>- P1: return
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
    P0->>+ P171: calls
    P171-->>- P0: return
    P0->>+ P172: calls
    P172-->>- P0: return
    P0->>+ P173: calls
    P173-->>- P0: return
    P0->>+ P119: calls
    P119-->>- P0: return
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
    P0->>+ P8: calls
    P8-->>- P0: return
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
    P0->>+ P18: calls
    P18-->>- P0: return
    P0->>+ P19: calls
    P19-->>- P0: return
    P0->>+ P20: calls
    P20-->>- P0: return
    P0->>+ P22: calls
    P22-->>- P0: return
    P0->>+ P186: calls
    P186-->>- P0: return
    P0->>+ P23: calls
    P23-->>- P0: return
    P0->>+ P24: calls
    P24-->>- P0: return
    P0->>+ P187: calls
    P187-->>- P0: return
    P0->>+ P188: calls
    P188-->>- P0: return
    P0->>+ P189: calls
    P189-->>- P0: return
    P0->>+ P190: calls
    P190-->>- P0: return
    P0->>+ P30: calls
    P30-->>- P0: return
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
    P0->>+ P37: calls
    P37-->>- P0: return
    P0->>+ P198: calls
    P198-->>- P0: return
    P0->>+ P199: calls
    P199-->>- P0: return
    P0->>+ P200: calls
    P200-->>- P0: return
    P0->>+ P44: calls
    P44-->>- P0: return
    P0->>+ P130: calls
    P130-->>- P0: return
    P0->>+ P131: calls
    P131-->>- P0: return
    P0->>+ P46: calls
    P46-->>- P0: return
    P0->>+ P201: calls
    P201-->>- P0: return
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
    P0->>+ P208: calls
    P208-->>- P0: return
    P0->>+ P53: calls
    P53-->>- P0: return
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
    P0->>+ P60: calls
    P60-->>- P0: return
    P0->>+ P220: calls
    P220-->>- P0: return
    P0->>+ P221: calls
    P221-->>- P0: return
    P0->>+ P222: calls
    P222-->>- P0: return
    P0->>+ P223: calls
    P223-->>- P0: return
    P0->>+ P66: calls
    P66-->>- P0: return
    P0->>+ P224: calls
    P224-->>- P0: return
    P0->>+ P152: calls
    P152-->>- P0: return
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
    P0->>+ P101: calls
    P101-->>- P0: return
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
```

## Connections by Relation

### calls
- [[getSupabaseClient()]] `INFERRED`
- [[handleDeepLink()]] `INFERRED`
- [[uploadAndShowActions()]] `INFERRED`
- [[deleteAndSendNewMenuPhoto()]] `INFERRED`
- [[handleClassificationCallback()]] `INFERRED`
- [[processVoiceMessage()]] `INFERRED`
- [[initiateTariffPurchase()]] `INFERRED`
- [[trackConversionStage()]] `INFERRED`
- [[.setActive()]] `INFERRED`
- [[handleInlineQuery()]] `INFERRED`
- [[sendNotification()]] `INFERRED`
- [[trackDeeplinkVisit()]] `INFERRED`
- [[sendTelegramAudio()]] `INFERRED`
- [[analyzeAudio()]] `INFERRED`
- [[togglePlay()]] `INFERRED`
- [[resumeAudioContext()]] `INFERRED`
- [[processQueueItem()]] `INFERRED`
- [[handleInlineQuery()]] `INFERRED`
- [[getOrCreateAudioNodes()]] `INFERRED`
- [[.analyze()]] `INFERRED`

### contains
- [[audioFormatUtils.test.ts]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*