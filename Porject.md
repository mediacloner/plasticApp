# Fruit Quality Inspector — Project Proposal

## Gemma 4 On-Device Vision Demo

---

## 1. Executive Summary

This document describes the development of **Fruit Quality Inspector**, a mobile application that uses Google's Gemma 4 multimodal model to analyze fruit freshness and quality in real time using a smartphone camera. The application serves as a proof-of-concept demonstrating how on-device AI can perform visual quality control for consumer and commercial applications.

---

## 2. Problem Statement

Industrial quality control of food products currently requires specialized hardware (NIR sensors, hyperspectral cameras, Raman spectrometers). While these instruments provide unmatched precision for internal composition analysis, there is no accessible demonstration that communicates the concept of automated visual quality assessment to non-technical audiences.

A mobile demo that performs real-time fruit quality inspection using only a phone camera provides:

- A tangible entry point to explain industrial quality control solutions
- A proof-of-concept for on-device AI deployment in edge environments
- A research platform for evaluating Gemma 4's multimodal capabilities
- A foundation that can evolve into a full-scale commercial inspection tool

---

## 3. Objectives

1. Build a functional mobile application that captures fruit images and returns quality assessments
2. Evaluate Gemma 4 E4B's multimodal vision capabilities for food quality analysis
3. Demonstrate on-device AI inference without cloud dependency
4. Create a reusable architecture that can be extended to other inspection domains (plastics, pharmaceuticals, packaging)
5. Produce measurable benchmarks: accuracy, latency, and device compatibility

---

## 4. Technology Stack

### 4.1 Gemma 4 — Model Selection

Google released Gemma 4 on April 2, 2026, as its most capable open model family. The following models are available:

| Model         | Type        | Active Params | Total Params | Context | Audio     | License    |
| ------------- | ----------- | ------------- | ------------ | ------- | --------- | ---------- |
| **E2B**       | Edge/Mobile | ~2B           | ~2B          | 128K    | Yes (30s) | Apache 2.0 |
| **E4B**       | Edge/Mobile | ~4B           | ~4B          | 128K    | Yes (30s) | Apache 2.0 |
| **26B (A4B)** | MoE         | 4B active     | 26B total    | 256K    | No        | Apache 2.0 |
| **31B**       | Dense       | 31B           | 31B          | 256K    | No        | Apache 2.0 |

**Selected model for this project: Gemma 4 E4B**

Rationale:

- Natively multimodal (text + image input) — can process camera frames directly
- Designed for mobile deployment — runs on flagship Android phones with ~3 GB RAM
- Apache 2.0 license — full commercial freedom, no usage caps, embeddable in products
- Sufficient reasoning capability (~65-67% MMLU) for visual quality assessment tasks
- Supports on-device inference via Google MediaPipe and LiteRT frameworks

For the initial prototype phase, the **Gemma 4 26B via API** (Google AI Studio) will be used to accelerate development, with a planned migration to on-device E4B for the production demo.

### 4.2 Mobile Application Framework

| Component            | Technology                   | Version   | Purpose                                    |
| -------------------- | ---------------------------- | --------- | ------------------------------------------ |
| **Framework**        | React Native                 | 0.83+     | Cross-platform mobile app                  |
| **Build System**     | Expo                         | ~55.x     | Build tooling and native module management |
| **Camera**           | expo-camera                  | Latest    | Camera access and image capture            |
| **Image Processing** | expo-image-manipulator       | Latest    | Resize/compress images before inference    |
| **Local Storage**    | expo-sqlite                  | ~55.x     | Store scan history and results             |
| **State Management** | React Context + AsyncStorage | —         | App state and persistence                  |
| **Navigation**       | React Navigation             | 6.x       | Screen navigation                          |
| **AI (Phase 1)**     | Google AI Studio API         | —         | Cloud-based Gemma 4 26B inference          |
| **AI (Phase 2)**     | MediaPipe LLM Inference      | —         | On-device Gemma 4 E4B inference            |
| **RN AI Bridge**     | react-native-llm-mediapipe   | Community | React Native bindings for MediaPipe        |

### 4.3 AI Inference Architecture

#### Phase 1: API-Based (Prototype)

```
Phone Camera → Capture Image → Base64 Encode → Gemma 4 26B API → JSON Response → Display Results
```

- Fastest path to a working demo
- Requires internet connection
- Uses Google AI Studio free tier (sufficient for demo)
- Latency: ~2-4 seconds per analysis

#### Phase 2: On-Device (Production Demo)

```
Phone Camera → Capture Image → MediaPipe Preprocessing → Gemma 4 E4B (on-device) → JSON Response → Display Results
```

- No internet required — works in factories, warehouses, field inspections
- Model downloaded once (~2.5-3.5 GB quantized INT4)
- Latency: ~3-8 seconds per analysis (device-dependent)
- Full data privacy — images never leave the device

### 4.4 On-Device Deployment Stack

| Layer                     | Technology                  | Role                                                       |
| ------------------------- | --------------------------- | ---------------------------------------------------------- |
| **Runtime**               | LiteRT (TensorFlow Lite)    | Optimized mobile inference engine                          |
| **API**                   | MediaPipe LLM Inference API | Cross-platform LLM serving on mobile                       |
| **Quantization**          | INT4 (4-bit)                | Reduces model from ~8 GB to ~2.5-3.5 GB                    |
| **Hardware Acceleration** | GPU delegate (Android)      | Leverages mobile GPU for faster inference                  |
| **Android AI**            | AICore Developer Preview    | System-level AI runtime (Pixel, Samsung, Qualcomm devices) |

### 4.5 Supported Devices (On-Device Mode)

| Device                 | Chipset            | RAM    | Expected Performance            |
| ---------------------- | ------------------ | ------ | ------------------------------- |
| Pixel 9 Pro            | Tensor G4          | 16 GB  | Optimal — AICore native support |
| Pixel 8 Pro            | Tensor G3          | 12 GB  | Good — GPU delegate             |
| Samsung S24 Ultra      | Snapdragon 8 Gen 3 | 12 GB  | Good — Qualcomm AI Engine       |
| Samsung S23            | Snapdragon 8 Gen 2 | 8 GB   | Acceptable — may need E2B       |
| Mid-range (6-8 GB RAM) | Various            | 6-8 GB | E2B model recommended           |

---

## 5. Application Design

### 5.1 Core Functionality

The user points the phone camera at a fruit, taps "Analyze", and receives a structured quality assessment.

#### Analysis Criteria

| Criteria              | Good Signals                                              | Bad Signals                                               |
| --------------------- | --------------------------------------------------------- | --------------------------------------------------------- |
| **Color**             | Vibrant, uniform, expected for variety and ripeness stage | Browning, dark patches, abnormal fading, uneven coloring  |
| **Surface Texture**   | Smooth, firm, natural shine or bloom                      | Wrinkled, soft spots, dehydration, waxy deterioration     |
| **Shape & Structure** | Symmetrical, plump, consistent with variety               | Deformed, shriveled, crushed, collapsed areas             |
| **Defects**           | None or minor cosmetic marks                              | Cuts, deep bruises, mold, fungal growth, insect damage    |
| **Ripeness**          | Appropriate for intended use (eating vs. storage)         | Over-ripe (fermentation signs) or under-ripe (hard, pale) |

#### Output Structure

Each analysis returns a structured JSON response:

```json
{
  "fruit": "Apple (Red Delicious)",
  "status": "GOOD",
  "score": 8,
  "color_analysis": "Uniform deep red with minor green patches near stem — consistent with variety",
  "surface_analysis": "Smooth skin, firm to appearance, natural wax bloom present",
  "shape_analysis": "Symmetrical, typical elongated shape for Red Delicious",
  "defects": ["Minor stem bruise (cosmetic only)"],
  "ripeness": "Optimal eating ripeness",
  "recommendation": "Eat within 3-5 days or refrigerate for up to 2 weeks",
  "confidence": 0.92
}
```

### 5.2 Screens

#### Screen 1: Camera / Scanner

- Live camera preview (full screen)
- "Analyze" button to capture and send to Gemma
- Loading indicator during inference
- Quick result overlay (GOOD / ACCEPTABLE / BAD with color badge)

#### Screen 2: Result Detail

- Captured image displayed
- Full quality report card:
  - Fruit identification
  - Status badge (green/yellow/red)
  - Score (1-10 scale)
  - Color, surface, shape, and defect analysis
  - Ripeness stage
  - Recommendation (eat now / store / discard)
  - Confidence percentage
- Option to save to history

#### Screen 3: Scan History

- List of all scanned fruits with thumbnail, name, status, and score
- Filter: All / Good / Acceptable / Bad
- Statistics: total scanned, percentage by status
- Export functionality (CSV/JSON)

#### Screen 4: About / Technology Info

- Explanation of how camera-based analysis relates to traditional quality control
- Comparison of visual assessment vs. laboratory-grade sensors
- Technical specifications of the demo

### 5.3 System Prompt for Gemma

```
You are a fruit quality inspection system.
Analyze the provided image of a fruit and return a JSON assessment.

Evaluate the following criteria:
1. Identify the fruit type and variety if possible
2. Assess color uniformity and appropriateness for the variety
3. Examine surface texture for damage, dehydration, or decay
4. Check shape and structural integrity
5. Identify any defects: bruises, mold, cuts, insect damage
6. Estimate ripeness stage
7. Provide an overall quality score (1-10) and status (GOOD/ACCEPTABLE/BAD)
8. Give a storage or consumption recommendation

Return ONLY valid JSON with this structure:
{
  "fruit": "string — fruit name and variety",
  "status": "GOOD | ACCEPTABLE | BAD",
  "score": "number 1-10",
  "color_analysis": "string",
  "surface_analysis": "string",
  "shape_analysis": "string",
  "defects": ["array of strings"],
  "ripeness": "string",
  "recommendation": "string",
  "confidence": "number 0-1"
}
```

---

## 6. Fruit Database — Supported Types

The following fruits are prioritized for the demo, covering a range of visual quality indicators:

| Fruit      | Key Quality Indicators                      | Common Defects                         |
| ---------- | ------------------------------------------- | -------------------------------------- |
| Apple      | Color uniformity, firmness, skin condition  | Bruising, bitter pit, scald            |
| Banana     | Peel color progression (green→yellow→brown) | Over-ripening spots, crown rot         |
| Strawberry | Red uniformity, firmness, mold              | Gray mold (Botrytis), soft rot         |
| Orange     | Peel color, texture, firmness               | Green mold, stem-end rot, oleocellosis |
| Tomato     | Color, firmness, shape                      | Blossom-end rot, cracking, sunscald    |
| Avocado    | Skin color, firmness (external cues)        | Bruising, stem-end decay               |
| Grape      | Color, firmness, bloom (waxy coating)       | Gray mold, shatter, dehydration        |
| Lemon      | Yellow uniformity, skin texture             | Green mold, stylar-end breakdown       |
| Pear       | Color, shape, skin russeting                | Cork spot, bruising, scald             |
| Mango      | Color transition, firmness, aroma cues      | Anthracnose, sap burn                  |

---

## 7. Comparison with Industrial Quality Control

This demo app is a mobile proxy for high-end industrial inspection technology. The following table illustrates the relationship between mobile vision and industrial-grade sensors:

| Capability     | Fruit Inspector (Demo)           | Industrial Inspection Systems                                |
| -------------- | -------------------------------- | ------------------------------------------------------------ |
| **Sensor**     | Phone camera (RGB)               | NIR / Raman / Hyperspectral                                  |
| **Analysis**   | External visual quality          | Internal composition + external quality                      |
| **Detects**    | Color, bruises, mold, shape      | Moisture, sugar (Brix), acidity, fat, protein, contamination |
| **AI Model**   | Gemma 4 E4B (general multimodal) | Specialized models trained on spectral/sensor data          |
| **Deployment** | Consumer smartphone              | Industrial production line                                   |
| **Throughput** | 1 fruit per scan                 | Continuous real-time monitoring                              |
| **Accuracy**   | Visual assessment (~85-90%)      | Laboratory-grade measurement (>95%)                          |

**Key message for the demo:** "What this phone does with color and shape, industrial sensors do with internal composition — seeing the molecular makeup, not just the surface."

---

## 8. Development Plan

### Phase 1: API Prototype (Week 1-2)

| Task                  | Details                                                   |
| --------------------- | --------------------------------------------------------- |
| Project scaffolding   | React Native + Expo setup, navigation, camera permissions |
| Camera integration    | expo-camera capture, image compression (max 1024px)       |
| Gemma API integration | Google AI Studio API key, multimodal request with image   |
| Result display        | Parse JSON response, render quality report card           |
| Scan history          | SQLite storage, list view with filters                    |
| Testing               | Test with 10+ fruits in various conditions                |
| Deliverable           | **Working demo on physical device via Expo Go**           |

### Phase 2: On-Device Migration (Week 3-5)

| Task                     | Details                                                   |
| ------------------------ | --------------------------------------------------------- |
| MediaPipe setup          | Integrate react-native-llm-mediapipe or native module     |
| Model download           | Implement Gemma 4 E4B model download and caching          |
| On-device inference      | Replace API calls with local MediaPipe inference          |
| Performance optimization | Measure latency, tune quantization (INT4 vs INT8)         |
| Offline mode             | Full functionality without internet                       |
| Deliverable              | **Standalone app running Gemma 4 E4B entirely on-device** |

### Phase 3: Polish and Presentation (Week 6)

| Task                    | Details                                                   |
| ----------------------- | --------------------------------------------------------- |
| UI refinement           | Animations, transitions, custom branding                  |
| Technology info screen  | Comparison with industrial inspection capabilities         |
| Export/reporting        | Generate PDF or shareable report from scan history        |
| Benchmark documentation | Accuracy, latency, and device compatibility results       |
| Deliverable             | **Presentation-ready demo with supporting documentation** |

---

## 9. Success Metrics

| Metric                                 | Target         | Measurement Method                    |
| -------------------------------------- | -------------- | ------------------------------------- |
| Fruit identification accuracy          | > 95%          | Test with 50+ labeled samples         |
| Quality assessment accuracy (GOOD/BAD) | > 85%          | Compare with manual expert assessment |
| On-device inference latency            | < 8 seconds    | Measure on Pixel 9 Pro                |
| Model size (quantized)                 | < 3.5 GB       | Measure downloaded model              |
| RAM usage during inference             | < 4 GB         | Android profiler                      |
| App cold start time                    | < 5 seconds    | Measure on target devices             |
| Offline functionality                  | 100% (Phase 2) | Test in airplane mode                 |

---

## 10. Risks and Mitigations

| Risk                                                         | Impact | Probability | Mitigation                                                                              |
| ------------------------------------------------------------ | ------ | ----------- | --------------------------------------------------------------------------------------- |
| Gemma 4 E4B visual accuracy insufficient for quality grading | High   | Medium      | Fall back to 26B API; fine-tune E4B on fruit dataset                                    |
| MediaPipe React Native bindings unstable                     | Medium | Medium      | Build native Android module as fallback                                                 |
| On-device inference too slow (>15s)                          | Medium | Low         | Use E2B instead; optimize image preprocessing                                           |
| Model too large for mid-range devices                        | Medium | Medium      | Offer E2B as lightweight option; cloud fallback                                         |
| Gemma hallucinates defects or misidentifies fruit            | High   | Medium      | Post-processing validation; confidence thresholds; discard results below 0.7 confidence |

---

## 11. Future Extensions

Once the fruit demo is validated, the same architecture can be extended to:

1. **Plastics recycling** — Classify plastic types by visual appearance (PET, HDPE, PVC) for circular economy projects
2. **Pharmaceutical packaging** — Inspect pill color, shape, and packaging integrity
3. **Wood/paper quality** — Detect knots, discoloration, moisture damage
4. **Liquid analysis** — Assess olive oil, wine, or milk color and turbidity through glass containers
5. **Integration with specialized sensors** — Pair the app with portable spectrometers for combined visual + NIR analysis
6. **Voice interaction** — Use Gemma 4 E4B's audio capabilities for hands-free operation: "Analyze this sample" → capture → report read aloud

---

## 12. Budget Estimation

| Item                           | Cost                       | Notes                    |
| ------------------------------ | -------------------------- | ------------------------ |
| Google AI Studio API (Phase 1) | Free tier / ~$20/month     | 1,500 requests/day free  |
| Developer time (6 weeks)       | Internal R&D               | —                        |
| Test devices (if needed)       | ~$300-600                  | Pixel 9 Pro recommended  |
| Expo EAS Build                 | $0 (free tier) or $99/year | For production builds    |
| Apple Developer Account (iOS)  | $99/year                   | If iOS demo needed       |
| Total external cost            | **< $1,000**               | Excluding internal labor |

---

## 13. Conclusion

The Fruit Quality Inspector is a low-cost, high-impact R&D project that demonstrates expertise in AI-powered quality control in an accessible, tangible format. By leveraging Google's Gemma 4 E4B — the most capable open model designed for mobile deployment — the demo runs entirely on-device with no cloud dependency, addressing data privacy and connectivity concerns of industrial and commercial clients.

The project serves three strategic purposes:

1. **Strategic showcase** — A hands-on demo that makes the value proposition of visual AI immediately understandable
2. **R&D platform** — Evaluates Gemma 4's multimodal capabilities for future product integration
3. **Product foundation** — The architecture extends directly to a wide range of inspection use cases across various markets

---
