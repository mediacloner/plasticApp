package expo.modules.litertlm

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel

class LiteRtLmModule : Module() {
    private val engine = LiteRtLmEngine()
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    override fun definition() = ModuleDefinition {
        Name("LiteRtLm")

        Events("onPartialResponse")

        AsyncFunction("initialize") { modelPath: String ->
            engine.initialize(modelPath)
        }

        AsyncFunction("analyzeImage") { imagePath: String, prompt: String ->
            engine.analyzeImage(imagePath, prompt) { partialText ->
                sendEvent("onPartialResponse", mapOf("text" to partialText))
            }
        }

        Function("isLoaded") {
            engine.isInitialized
        }

        OnDestroy {
            engine.release()
            scope.cancel()
        }
    }
}
