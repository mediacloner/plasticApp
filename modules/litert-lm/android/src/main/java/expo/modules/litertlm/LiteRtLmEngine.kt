package expo.modules.litertlm

import com.google.ai.edge.litertlm.Engine
import com.google.ai.edge.litertlm.EngineConfig
import com.google.ai.edge.litertlm.Conversation
import com.google.ai.edge.litertlm.ConversationConfig
import com.google.ai.edge.litertlm.SamplerConfig
import com.google.ai.edge.litertlm.Backend
import com.google.ai.edge.litertlm.Content
import com.google.ai.edge.litertlm.Contents
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import java.io.File

class LiteRtLmEngine {
    private var engine: Engine? = null
    private val mutex = Mutex()

    val isInitialized: Boolean
        get() = engine != null

    suspend fun initialize(modelPath: String) {
        withContext(Dispatchers.IO) {
            val file = File(modelPath)
            if (!file.exists()) {
                throw Exception("Model file not found at: $modelPath")
            }

            val config = EngineConfig(
                modelPath = modelPath,
                backend = Backend.GPU(),
                visionBackend = Backend.GPU()
            )

            val eng = Engine(config)
            eng.initialize()
            engine = eng
        }
    }

    suspend fun analyzeImage(
        imagePath: String,
        prompt: String,
        onPartialResponse: ((String) -> Unit)? = null
    ): String {
        return mutex.withLock {
            val eng = engine ?: throw Exception("Engine not initialized")

            val conversation = eng.createConversation(
                ConversationConfig(
                    samplerConfig = SamplerConfig(
                        temperature = 0.4f,
                        topK = 32,
                        topP = 0.95f
                    ),
                    maxTokens = 1024
                )
            )

            // Strip file:// prefix that React Native URIs use
            val cleanPath = if (imagePath.startsWith("file://")) {
                imagePath.removePrefix("file://")
            } else {
                imagePath
            }

            val fullResponse = StringBuilder()

            withContext(Dispatchers.IO) {
                conversation.sendMessageAsync(
                    Contents.of(
                        Content.ImageFile(cleanPath),
                        Content.Text(prompt)
                    )
                )
                .catch { e -> throw Exception("Inference failed: ${e.message}") }
                .collect { message ->
                    fullResponse.append(message.text)
                    onPartialResponse?.invoke(message.text)
                }
            }

            fullResponse.toString()
        }
    }

    fun release() {
        engine?.close()
        engine = null
    }
}
