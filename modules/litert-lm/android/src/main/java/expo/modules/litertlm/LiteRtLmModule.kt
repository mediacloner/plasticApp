package expo.modules.litertlm

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

class LiteRtLmModule : Module() {
    private val engine = LiteRtLmEngine()
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    override fun definition() = ModuleDefinition {
        Name("LiteRtLm")

        Events("onPartialResponse")

        AsyncFunction("initialize") { modelPath: String, promise: Promise ->
            scope.launch {
                try {
                    engine.initialize(modelPath)
                    promise.resolve(null)
                } catch (e: Exception) {
                    promise.reject("ERR_INIT", e.message ?: "Failed to initialize engine", e)
                }
            }
        }

        AsyncFunction("analyzeImage") { imagePath: String, prompt: String, promise: Promise ->
            scope.launch {
                try {
                    val result = engine.analyzeImage(imagePath, prompt) { partialText ->
                        sendEvent("onPartialResponse", mapOf("text" to partialText))
                    }
                    promise.resolve(result)
                } catch (e: Exception) {
                    promise.reject("ERR_INFERENCE", e.message ?: "Inference failed", e)
                }
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
