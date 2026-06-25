# map

> God node · 269 connections · [D:\.MUSICVERSE\aimusicverse\src\components\admin\analytics\ErrorTrendsPanel.tsx](file:///D:/.MUSICVERSE/aimusicverse/src/components/admin/analytics/ErrorTrendsPanel.tsx#L400)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as map
    participant P1 as .addRow()
    participant P2 as handleDeepLink()
    participant P3 as error
    participant P4 as info
    participant P5 as .build()
    participant P6 as .addButton()
    participant P7 as buildMessage()
    participant P8 as getMenuImage()
    participant P9 as handleProjects()
    participant P10 as trackDeepLinkAnalytics()
    participant P11 as handleLibrary()
    participant P12 as handleTrackDeepLink()
    participant P13 as handleProjectDeepLink()
    participant P14 as handleHelp()
    participant P15 as handleArtistDeepLink()
    participant P16 as handleProfileDeepLink()
    participant P17 as handleInviteDeepLink()
    participant P18 as handleQuickGenDeepLink()
    participant P19 as handlePaymentDeepLink()
    participant P20 as handleLeaderboardDeepLink()
    participant P21 as handleAchievementsDeepLink()
    participant P22 as handleAnalyzeDeepLink()
    participant P23 as handleQuickActionsCallbacks()
    participant P24 as handleStart()
    participant P25 as parseDeepLink()
    participant P26 as handleDashboard()
    participant P27 as handleProfile()
    participant P28 as handleNavigationGenerate()
    participant P29 as handleTrackDetails()
    participant P30 as handleNavigationAnalyze()
    participant P31 as handleNavigationSettings()
    participant P32 as handleBalance()
    participant P33 as handleShareTrack()
    participant P34 as handlePlayTrack()
    participant P35 as handleTerms()
    participant P36 as handlePrivacy()
    participant P37 as handleAbout()
    participant P38 as mediaPlayerKeyboard()
    participant P39 as handleApp()
    participant P40 as createQuickActionsKeyboard()
    participant P41 as sendDefaultResponse()
    participant P42 as uploadAndShowActions()
    participant P43 as processVoiceMessage()
    participant P44 as handleInlineQuery()
    participant P45 as handleProjectsCallback()
    participant P46 as handleGuitarAudio()
    participant P47 as handleMidiCommand()
    participant P48 as handleStatus()
    participant P49 as handleAchievements()
    participant P50 as handleTransactions()
    participant P51 as .routeToProviders()
    participant P52 as buildDynamicKeyboard()
    participant P53 as fetchUsersWithBalances()
    participant P54 as sectionsToLyrics()
    participant P55 as handleSave()
    participant P56 as getCDNUrl()
    participant P57 as .generateFallback()
    participant P58 as checkAndUnlockAchievements()
    participant P59 as handleAnalyzeCommand()
    participant P60 as handleChordAnalysis()
    participant P61 as generateGuitarTab()
    participant P62 as handlePianoCommand()
    participant P63 as createKeyValue()
    participant P64 as sendFollowerDigest()
    participant P65 as generateTab()
    participant P66 as getLuminance()
    participant P67 as trackFeature()
    participant P68 as handleFullAnalysis()
    participant P69 as handleStudio()
    participant P70 as handleMyUploads()
    participant P71 as handleLeaderboard()
    participant P72 as getUserRecentStyles()
    participant P73 as runAccessibilityAudit()
    participant P74 as fetchRUMMetricsSummary()
    participant P75 as loadPositions()
    participant P76 as .professionalAnalysis()
    participant P77 as fetchFeedback()
    participant P78 as handleAnalyzeList()
    participant P79 as getPublicTracksForGuests()
    participant P80 as searchTracksAndProjects()
    participant P81 as handleAddToPlaylist()
    participant P82 as handleCheckStemsStatus()
    participant P83 as handleProjectStats()
    participant P84 as fetchTracksWithTagJoin()
    participant P85 as generateWaveform()
    participant P86 as updateSectionContent()
    participant P87 as handleSelectHistory()
    participant P88 as generateSection()
    participant P89 as generateAllSections()
    participant P90 as generateWaveform()
    participant P91 as handleSaveAsPlaylist()
    participant P92 as handleRemoveAvatar()
    participant P93 as generateWaveform()
    participant P94 as useUserFeatures()
    participant P95 as attemptAudioRecovery()
    participant P96 as .extractInlineTags()
    participant P97 as batchGetLyricsHistory()
    participant P98 as getProductsByType()
    participant P99 as cleanupTable()
    participant P100 as searchProjects()
    participant P101 as handleDownloadStems()
    participant P102 as handleArtistDetails()
    participant P103 as sendTrackBatch()
    participant P104 as processMediaGroup()
    participant P105 as showTariffsMenu()
    participant P106 as flushMetrics()
    participant P107 as showGenreSelection()
    participant P108 as showMoodSelection()
    participant P109 as generateTinkoffToken()
    participant P110 as getLyricVersions()
    participant P111 as getSectionNotes()
    participant P112 as loadData()
    participant P113 as generateWaveform()
    participant P114 as handleGenerate()
    participant P115 as loadHistory()
    participant P116 as handleCopy()
    participant P117 as loadLocalSaved()
    participant P118 as fetchPublicTracks()
    participant P119 as fetchFeaturedContent()
    participant P120 as logAudioDiagnostics()
    participant P121 as generateWaveformFromAudioBuffer()
    participant P122 as fetchDeeplinkAnalyticsSummary()
    participant P123 as detectSectionsFromGaps()
    participant P124 as parseTag()
    participant P125 as getLyricsHistory()
    participant P126 as getSectionNotesEnriched()
    participant P127 as getProducts()
    participant P128 as getPaymentHistory()
    participant P129 as fetchTracksWithLikes()
    participant P130 as hashContentFromUrl()
    participant P131 as generateMidi()
    participant P132 as executeSearch()
    participant P133 as buildTrackCaption()
    participant P134 as updateBotCommands()
    participant P135 as showEnhancedQuickActions()
    participant P136 as createBreadcrumb()
    participant P137 as showTypeSelection()
    participant P138 as capitalizeTitle()
    participant P139 as fetchFunnelDropoffStats()
    participant P140 as getTrackBatches()
    participant P141 as getActiveUserBatches()
    participant P142 as getPresetsWithAuthors()
    participant P143 as handleSubmit()
    participant P144 as parseLyrics()
    participant P145 as handleVoiceInput()
    participant P146 as handleApplyTemplate()
    participant P147 as generateSuggestions()
    participant P148 as handleGenerateMusic()
    participant P149 as enrichTracksWithCreators()
    participant P150 as enrichTracksWithCreators()
    participant P151 as loadLocalHistory()
    participant P152 as groupWordsIntoLines()
    participant P153 as useStudioAudioEngine()
    participant P154 as .getActiveElements()
    participant P155 as getRelativeLuminance()
    participant P156 as getUniqueMentionedUserIds()
    participant P157 as parseStyleTags()
    participant P158 as toCSV()
    participant P159 as detectBPM()
    participant P160 as formatLyricsForDisplay()
    participant P161 as getAllProducts()
    participant P162 as getCreditPackages()
    participant P163 as getSubscriptions()
    participant P164 as moveTrack()
    participant P165 as getFeaturedProducts()
    participant P166 as fetchPublicTracksWithCreators()
    participant P167 as parseTextResponse()
    participant P168 as syncBotCommands()
    participant P169 as createHealthAlert()
    participant P170 as .getBreadcrumb()
    participant P171 as .buildKeyboard()
    participant P172 as .buildStepMenu()
    participant P173 as generateFallbackTitle()
    participant P174 as printResults()
    participant P175 as normalizePeaks()
    participant P176 as reorderPlaylistTracks()
    participant P177 as exportLogs()
    participant P178 as calculateForecast()
    participant P179 as handleExportCSV()
    participant P180 as exportUsers()
    participant P181 as UserJourneyPanel()
    participant P182 as ReportCommentDialog()
    participant P183 as ContentHubTabs()
    participant P184 as handleMelodyComplete()
    participant P185 as handleComplete()
    participant P186 as handleUpdateSection()
    participant P187 as handleUpdateSectionTags()
    participant P188 as sectionsToLyrics()
    participant P189 as changeSectionType()
    participant P190 as applyTemplate()
    participant P191 as QuickActions()
    participant P192 as suggestRhymes()
    participant P193 as generateTags()
    participant P194 as generateStyleDescription()
    participant P195 as toMidiNotes()
    participant P196 as parseLyrics()
    participant P197 as analyzeLine()
    participant P198 as MobileFormSkeleton()
    participant P199 as handleDragEnd()
    participant P200 as groupWordsIntoLines()
    participant P201 as groupLinesIntoSections()
    participant P202 as getNextVersionLabel()
    participant P203 as handleGenerateAll()
    participant P204 as handleUpdateSection()
    participant P205 as MidiTranscriptionActions()
    participant P206 as GridSkeleton()
    participant P207 as Skeleton()
    participant P208 as TrackGridSkeleton()
    participant P209 as TrackListSkeleton()
    participant P210 as startUpload()
    participant P211 as getAvailableModels()
    participant P212 as calculateStdDev()
    participant P213 as detectZScoreAnomalies()
    participant P214 as getConfigByCategory()
    participant P215 as getFlagsByCategory()
    participant P216 as generatePeaksMainThread()
    participant P217 as getResponsiveImageSrcSet()
    participant P218 as getItems()
    participant P219 as processBatched()
    participant P220 as preloadCriticalRoutes()
    participant P221 as parseFullAnalysis()
    participant P222 as parseProducerReview()
    participant P223 as createMusicalSections()
    participant P224 as findAccessibleUrl()
    participant P225 as .validateTags()
    participant P226 as .detectRhymeScheme()
    participant P227 as .suggestStylePrompt()
    participant P228 as LoadingState()
    participant P229 as LoadingState()
    participant P230 as identifyChord()
    participant P231 as generateTagsFromAnalysis()
    participant P232 as batchSaveLyrics()
    participant P233 as cleanLyricsText()
    participant P234 as .normalizeKlangioResult()
    participant P235 as getSuggestedInstruments()
    participant P236 as sha256()
    participant P237 as detectTimeSignature()
    participant P238 as createGenerationResults()
    participant P239 as createProjectListKeyboard()
    participant P240 as measureFrame()
    participant P241 as .getPeakMemory()
    participant P242 as batchApplyPresetToTracks()
    participant P243 as SourcesHeatmap()
    participant P244 as BlogContentRenderer()
    participant P245 as calculateSimilarity()
    participant P246 as selectTemplate()
    participant P247 as generateStylePrompt()
    participant P248 as generateDetailedPrompt()
    participant P249 as parseLyrics()
    participant P250 as renderSectionTags()
    participant P251 as LyricsEditorToolbar()
    participant P252 as ParaphraseResultCard()
    participant P253 as analyzeRhythm()
    participant P254 as parseLyrics()
    participant P255 as parseLyrics()
    participant P256 as parseStructureContent()
    participant P257 as PresetCard()
    participant P258 as ShortcutsHelpContent()
    participant P259 as SocialLinks()
    participant P260 as QuickPresets()
    participant P261 as TelegramTab()
    participant P262 as SectionPresets()
    participant P263 as SectionQuickPicker()
    participant P264 as expandAll()
    participant P265 as SunoTimeline()
    participant P266 as StepIndicator()
    participant P267 as getComingSoonFeatures()
    participant P268 as extractTagsFromLyrics()
    participant P269 as parseCompoundTag()
    participant P270 as getAvailableGenres()
    participant P271 as generateStyleDescription()
    participant P272 as generateTags()
    participant P273 as getRegisteredShortcuts()
    participant P274 as getCacheKey()
    participant P275 as getGenrePlaylists()
    participant P276 as useVersionSync()
    participant P277 as prefetchQueue()
    participant P278 as generateSrcSet()
    participant P279 as preloadImages()
    participant P280 as batchLoad()
    participant P281 as splitWordByLineBreaks()
    participant P282 as generateMentionNotifications()
    participant P283 as parseTimeToSeconds()
    participant P284 as buildEnglishPrompt()
    participant P285 as parseTagsFromText()
    participant P286 as setPrimaryVersionOptimistic()
    participant P287 as .prefetchMany()
    participant P288 as formatErrorsForExport()
    participant P289 as formatDeeplinksForExport()
    participant P290 as .formatFinal()
    participant P291 as .formatSectionForDisplay()
    participant P292 as .parseCompoundTag()
    participant P293 as .validateLine()
    participant P294 as groupIntoEnhancedLines()
    participant P295 as extractLyricsForTimeRange()
    participant P296 as studioProjectToDAWProject()
    participant P297 as sectionsToLyrics()
    participant P298 as toggleSelectAll()
    participant P299 as analyzeGenerationDurations()
    participant P300 as cloneSections()
    participant P301 as getDownbeats()
    participant P302 as .addButtons()
    participant P303 as createList()
    participant P304 as addLineNumbers()
    participant P305 as formatList()
    participant P306 as createTable()
    P0->>+ P1: calls
    P1-->>- P0: return
    P1->>+ P0: calls
    P0-->>- P1: return
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
    P2->>+ P1: calls
    P1-->>- P2: return
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
    P1->>+ P26: calls
    P26-->>- P1: return
    P1->>+ P11: calls
    P11-->>- P1: return
    P1->>+ P27: calls
    P27-->>- P1: return
    P1->>+ P28: calls
    P28-->>- P1: return
    P1->>+ P29: calls
    P29-->>- P1: return
    P1->>+ P12: calls
    P12-->>- P1: return
    P1->>+ P13: calls
    P13-->>- P1: return
    P1->>+ P30: calls
    P30-->>- P1: return
    P1->>+ P31: calls
    P31-->>- P1: return
    P1->>+ P32: calls
    P32-->>- P1: return
    P1->>+ P14: calls
    P14-->>- P1: return
    P1->>+ P33: calls
    P33-->>- P1: return
    P1->>+ P34: calls
    P34-->>- P1: return
    P1->>+ P35: calls
    P35-->>- P1: return
    P1->>+ P36: calls
    P36-->>- P1: return
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
    P0->>+ P42: calls
    P42-->>- P0: return
    P0->>+ P43: calls
    P43-->>- P0: return
    P0->>+ P44: calls
    P44-->>- P0: return
    P0->>+ P9: calls
    P9-->>- P0: return
    P0->>+ P11: calls
    P11-->>- P0: return
    P0->>+ P45: calls
    P45-->>- P0: return
    P0->>+ P46: calls
    P46-->>- P0: return
    P0->>+ P47: calls
    P47-->>- P0: return
    P0->>+ P48: calls
    P48-->>- P0: return
    P0->>+ P49: calls
    P49-->>- P0: return
    P0->>+ P50: calls
    P50-->>- P0: return
    P0->>+ P51: calls
    P51-->>- P0: return
    P0->>+ P52: calls
    P52-->>- P0: return
    P0->>+ P53: calls
    P53-->>- P0: return
    P0->>+ P54: calls
    P54-->>- P0: return
    P0->>+ P55: calls
    P55-->>- P0: return
    P0->>+ P56: calls
    P56-->>- P0: return
    P0->>+ P57: calls
    P57-->>- P0: return
    P0->>+ P58: calls
    P58-->>- P0: return
    P0->>+ P59: calls
    P59-->>- P0: return
    P0->>+ P60: calls
    P60-->>- P0: return
    P0->>+ P61: calls
    P61-->>- P0: return
    P0->>+ P62: calls
    P62-->>- P0: return
    P0->>+ P63: calls
    P63-->>- P0: return
    P0->>+ P64: calls
    P64-->>- P0: return
    P0->>+ P65: calls
    P65-->>- P0: return
    P0->>+ P66: calls
    P66-->>- P0: return
    P0->>+ P67: calls
    P67-->>- P0: return
    P0->>+ P68: calls
    P68-->>- P0: return
    P0->>+ P69: calls
    P69-->>- P0: return
    P0->>+ P70: calls
    P70-->>- P0: return
    P0->>+ P71: calls
    P71-->>- P0: return
    P0->>+ P72: calls
    P72-->>- P0: return
    P0->>+ P73: calls
    P73-->>- P0: return
    P0->>+ P74: calls
    P74-->>- P0: return
    P0->>+ P75: calls
    P75-->>- P0: return
    P0->>+ P76: calls
    P76-->>- P0: return
    P0->>+ P77: calls
    P77-->>- P0: return
    P0->>+ P78: calls
    P78-->>- P0: return
    P0->>+ P79: calls
    P79-->>- P0: return
    P0->>+ P80: calls
    P80-->>- P0: return
    P0->>+ P81: calls
    P81-->>- P0: return
    P0->>+ P82: calls
    P82-->>- P0: return
    P0->>+ P83: calls
    P83-->>- P0: return
    P0->>+ P84: calls
    P84-->>- P0: return
    P0->>+ P85: calls
    P85-->>- P0: return
    P0->>+ P86: calls
    P86-->>- P0: return
    P0->>+ P87: calls
    P87-->>- P0: return
    P0->>+ P88: calls
    P88-->>- P0: return
    P0->>+ P89: calls
    P89-->>- P0: return
    P0->>+ P90: calls
    P90-->>- P0: return
    P0->>+ P91: calls
    P91-->>- P0: return
    P0->>+ P92: calls
    P92-->>- P0: return
    P0->>+ P93: calls
    P93-->>- P0: return
    P0->>+ P94: calls
    P94-->>- P0: return
    P0->>+ P95: calls
    P95-->>- P0: return
    P0->>+ P96: calls
    P96-->>- P0: return
    P0->>+ P97: calls
    P97-->>- P0: return
    P0->>+ P98: calls
    P98-->>- P0: return
    P0->>+ P99: calls
    P99-->>- P0: return
    P0->>+ P100: calls
    P100-->>- P0: return
    P0->>+ P101: calls
    P101-->>- P0: return
    P0->>+ P102: calls
    P102-->>- P0: return
    P0->>+ P103: calls
    P103-->>- P0: return
    P0->>+ P104: calls
    P104-->>- P0: return
    P0->>+ P105: calls
    P105-->>- P0: return
    P0->>+ P106: calls
    P106-->>- P0: return
    P0->>+ P107: calls
    P107-->>- P0: return
    P0->>+ P108: calls
    P108-->>- P0: return
    P0->>+ P109: calls
    P109-->>- P0: return
    P0->>+ P110: calls
    P110-->>- P0: return
    P0->>+ P111: calls
    P111-->>- P0: return
    P0->>+ P112: calls
    P112-->>- P0: return
    P0->>+ P113: calls
    P113-->>- P0: return
    P0->>+ P114: calls
    P114-->>- P0: return
    P0->>+ P115: calls
    P115-->>- P0: return
    P0->>+ P116: calls
    P116-->>- P0: return
    P0->>+ P117: calls
    P117-->>- P0: return
    P0->>+ P118: calls
    P118-->>- P0: return
    P0->>+ P119: calls
    P119-->>- P0: return
    P0->>+ P120: calls
    P120-->>- P0: return
    P0->>+ P121: calls
    P121-->>- P0: return
    P0->>+ P122: calls
    P122-->>- P0: return
    P0->>+ P123: calls
    P123-->>- P0: return
    P0->>+ P124: calls
    P124-->>- P0: return
    P0->>+ P125: calls
    P125-->>- P0: return
    P0->>+ P126: calls
    P126-->>- P0: return
    P0->>+ P127: calls
    P127-->>- P0: return
    P0->>+ P128: calls
    P128-->>- P0: return
    P0->>+ P129: calls
    P129-->>- P0: return
    P0->>+ P130: calls
    P130-->>- P0: return
    P0->>+ P131: calls
    P131-->>- P0: return
    P0->>+ P132: calls
    P132-->>- P0: return
    P0->>+ P133: calls
    P133-->>- P0: return
    P0->>+ P134: calls
    P134-->>- P0: return
    P0->>+ P135: calls
    P135-->>- P0: return
    P0->>+ P136: calls
    P136-->>- P0: return
    P0->>+ P137: calls
    P137-->>- P0: return
    P0->>+ P138: calls
    P138-->>- P0: return
    P0->>+ P139: calls
    P139-->>- P0: return
    P0->>+ P140: calls
    P140-->>- P0: return
    P0->>+ P141: calls
    P141-->>- P0: return
    P0->>+ P142: calls
    P142-->>- P0: return
    P0->>+ P143: calls
    P143-->>- P0: return
    P0->>+ P144: calls
    P144-->>- P0: return
    P0->>+ P145: calls
    P145-->>- P0: return
    P0->>+ P146: calls
    P146-->>- P0: return
    P0->>+ P147: calls
    P147-->>- P0: return
    P0->>+ P148: calls
    P148-->>- P0: return
    P0->>+ P149: calls
    P149-->>- P0: return
    P0->>+ P150: calls
    P150-->>- P0: return
    P0->>+ P151: calls
    P151-->>- P0: return
    P0->>+ P152: calls
    P152-->>- P0: return
    P0->>+ P153: calls
    P153-->>- P0: return
    P0->>+ P154: calls
    P154-->>- P0: return
    P0->>+ P155: calls
    P155-->>- P0: return
    P0->>+ P156: calls
    P156-->>- P0: return
    P0->>+ P157: calls
    P157-->>- P0: return
    P0->>+ P158: calls
    P158-->>- P0: return
    P0->>+ P159: calls
    P159-->>- P0: return
    P0->>+ P160: calls
    P160-->>- P0: return
    P0->>+ P161: calls
    P161-->>- P0: return
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
    P0->>+ P198: calls
    P198-->>- P0: return
    P0->>+ P199: calls
    P199-->>- P0: return
    P0->>+ P200: calls
    P200-->>- P0: return
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
```

## Connections by Relation

### calls

- [[.addRow()]] `INFERRED`
- [[uploadAndShowActions()]] `INFERRED`
- [[processVoiceMessage()]] `INFERRED`
- [[handleInlineQuery()]] `INFERRED`
- [[handleProjects()]] `INFERRED`
- [[handleLibrary()]] `INFERRED`
- [[handleProjectsCallback()]] `INFERRED`
- [[handleGuitarAudio()]] `INFERRED`
- [[handleMidiCommand()]] `INFERRED`
- [[handleStatus()]] `INFERRED`
- [[handleAchievements()]] `INFERRED`
- [[handleTransactions()]] `INFERRED`
- [[.routeToProviders()]] `INFERRED`
- [[buildDynamicKeyboard()]] `INFERRED`
- [[fetchUsersWithBalances()]] `INFERRED`
- [[sectionsToLyrics()]] `INFERRED`
- [[handleSave()]] `INFERRED`
- [[getCDNUrl()]] `INFERRED`
- [[.generateFallback()]] `INFERRED`
- [[checkAndUnlockAchievements()]] `INFERRED`

### contains

- [[ErrorTrendsPanel.tsx]] `EXTRACTED`

---

_Part of the graphify knowledge wiki. See [[index]] to navigate._
