# Playwright AI Agent — Journey Video

**Output:** `Playwright-AI-Agent-Journey.mp4`  
**Duration:** ~190s (3.17 min)  
**Voice:** en-US-JennyNeural (Microsoft Edge neural TTS)  
**Demo case:** BT-116909 (smallest billing-toggle queue validation)

1. Title — product overview  
2. Test case — BT-116909 steps & expected  
3. Architecture — **4-agent** pipeline (incl. SpecFeedbackLoop)  
4. Generation — how specs are produced  
5. Generated code — real BT-116909.spec.ts excerpt  
6. Chrome execution — **live Playwright recording** (sped to fit)  
7. Closing  

## Agents
1. StepProcessor  
2. POMMethodMatcher  
3. SpecValidator  
4. SpecFeedbackLoop (CSV cross-check / inject missing steps)  

## Rebuild
```bash
python commands/demo-video/build_video.py
```
Place a `.webm` from `recordVideo` under `commands/demo-video/chrome-recording/` to splice live Chrome into scene 6.
