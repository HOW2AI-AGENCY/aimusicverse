# Design Brief: Generation Form

## 1. Feature Summary

The generation form is the primary input surface for MusicVerse AI — where users describe, configure, and trigger music generation. It serves two distinct user groups: amateurs who want quick prompt-to-song (speed-first), and professionals who need lyrics, style settings, and instrument controls (depth-first). The form must serve both without favoring either, adapting to context via progressive disclosure.

## 2. Primary User Action

Describe a musical idea and generate it. Single most important action: typing a prompt and pressing "Generate" to hear a result. All other controls (lyrics, style, instruments) are depth to be discovered on engagement, not required upfront.

## 3. Design Direction

- **Color strategy:** Distinct sub-brand palette for generation. Overrides the project default Restrained. The generation surface earns a unique color register to signal "this is where creation happens." Suggested direction: a distinct accent tone (warmer or cooler than the product's teal-navy) used as a subtle surface tint on the generation panel, keeping the generate action as the saturated anchor.
- **Theme scene sentence:** Both an amateur on their phone at night in dim warm light, curious and relaxed, and a producer at a desktop in bright daylight, focused and intentional — the form adapts to who sits in front of it without asking.
- **Anchor references:** Suno AI / Udio for the clean prompt-first aesthetic. Fast, minimal, inviting. The depth is handled via progressive disclosure, not a separate "pro mode" toggle.

## 4. Scope

- **Fidelity:** Mid-fi planning — clear layout strategy, key states, interaction model, ready for implementation
- **Breadth:** Full generation form flow — prompt input, advanced settings, lyrics, generate actions, result/confirmation
- **Interactivity:** Interactive prototype quality — states, transitions, responsive behavior
- **Time intent:** Polish until it ships

## 5. Layout Strategy

**Progressive disclosure: one surface that grows as the user engages.**

- **Primary layer (always visible):** Prompt input field — large, centered, inviting placeholder text. Generate button beneath it. This is the default state. 60% of vertical space is the prompt + generate zone.
- **Secondary layer (revealed via scroll or tap):** Style tags/chips (genre, mood, tempo) as a horizontal scrollable strip. Quick-select chips for instant direction. Below that: collapsed "Advanced Settings" with expand/collapse chevron.
- **Tertiary layer (bottom sheet or separate expandable panel):** Full lyrics editor/assistant, instrument picker, key/tempo controls, vocal controls.
- **Mobile:** Bottom-anchored generate button. Prompt fills the middle zone. Secondary layers are bottom sheets that push the prompt up.
- **Desktop:** Side panel or drawer for depth. Prompt + generate in the center column. Depth slides in from the right.

The form never uses tabs to switch between "quick" and "deep" — that's a toggle that forces the user to choose a lane. Progressive disclosure lets one flow serve both without a decision upfront.

## 6. Key States

| State               | Description                        | User needs to see                                                                      |
| ------------------- | ---------------------------------- | -------------------------------------------------------------------------------------- |
| Default             | Clean form, cursor in prompt field | Inviting placeholder, generate button (subtle or disabled until input), credit balance |
| Prompt focused      | Cursor active in prompt            | Clear keyboard, character count if near limit, hint text                               |
| Prompt filled       | Text entered                       | Generate button activates, character count, remaining credits                          |
| Style selected      | Chips tapped                       | Selected chip highlighted, generate button stays active                                |
| Advanced expanded   | Settings panel open                | Clean sections, no overflow, scroll if needed                                          |
| Generating          | Form submitted                     | Progress indicator, estimated time, track preview placeholder                          |
| Lyrics mode         | Lyrics editor open                 | Structured editor, section cards, assistant chat available                             |
| Error (validation)  | Bad input                          | Inline error on the field, form stays intact                                           |
| Error (API/network) | Generation failed                  | Non-blocking toast/alert, form state preserved for retry                               |
| Success             | Track generated                    | Result preview card, option to generate more, share/edit actions                       |
| Empty credits       | No credits left                    | Credit purchase upsell, form disabled with explanation                                 |
| Loading (settings)  | Draft loading from storage         | Skeleton state on relevant sections, not full-page spinner                             |

## 7. Interaction Model

- **Entry:** User lands on the form. Cursor auto-focuses prompt on mobile; desktop keeps it ready.
- **Prompt input:** Real-time word count, credit estimation (visible as small badge).
- **Quick tags:** Single tap on genre/mood chip toggles selection (multi-select allowed). Changes reflected immediately.
- **Generate action:** Single tap initiates generation. Button transitions to a progress state (compact spinner replaces text). User can cancel generation in first 3 seconds.
- **Deep features:** Scroll down or tap "Lyrics" / "Settings" to reveal depth panels. These are bottom sheets on mobile, inline drawer on desktop. Selecting in a deep panel does not collapse the surface — user sees the change reflected in the prompt area.
- **Post-generation:** GenerationResultSheet slides up with the track. User can play, share, edit in studio, or generate another.
- **Scroll behavior:** The form scrolls as one page. No fixed sections. The prompt zone stably recedes as the user scrolls deeper.
- **Keyboard handling (mobile):** Prompt field dismisses keyboard on "Generate" tap. Sheet-style advanced sections open above the keyboard. The form handles `visualViewport` for keyboard-aware layout.

## 8. Content Requirements

### Copy

- **Placeholder text:** "Describe the music you want to create..." (friendly, open-ended, no examples that constrain creativity)
- **Generate button label:** "Generate" (not "Create" or "Go") — direct, familiar
- **Empty state tags chip row:** "Try: Pop, Electronic, Lo-fi, Cinematic, Jazz" (rotating suggestions)
- **Credit badge:** "X credits remaining" compact pill
- **Error messages:**
  - Validation: "Please describe what you'd like to create"
  - API error: "Generation failed. Your prompt and settings are saved."
  - No credits: "You're out of credits. Add more to keep creating."
- **Success state:** "Your track is ready!" with preview card
- **Progress:** "Generating..." with estimated time "About 30 seconds"

### Variable content ranges

- **Prompt length:** 10–500 characters (typical: 50–150)
- **Tags selected:** 0–10 chips
- **Lyrics verses:** 0–8 sections
- **Advanced settings:** 0–6 parameters

### Visual assets

- Prompt area: text only, no decoration
- Style chips: text labels on subtle rounded pills
- Credit indicator: compact badge, top right
- Generate button: full-width on mobile, centered on desktop

## 9. Recommended References

- `references/layout.md` — progressive disclosure spatial strategy
- `references/onboard.md` — first-time user patterns for the form
- `references/clarify.md` — microcopy and error message polish
- `references/animate.md` — state transitions, generating state, post-success animation

## 10. Open Questions

None. Recommend proceeding to implementation with `/impeccable craft generation-form` or directly building from this brief.
